#!/usr/bin/env python3
"""Build the app's daily vocabulary from user-supplied English headwords.

Only English headwords are read from the extracted study sheet. Definitions,
examples, ordering and memory aids from that sheet are deliberately ignored.
Chinese meanings and parts of speech come from ECDICT (MIT), while examples
are generated in the application from original topic-aware templates.
"""

from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_TEXT = ROOT / "tmp" / "pdfs" / "ielts-vocab-audit" / "vocabulary.txt"
ECDICT_CSV = Path("/tmp/ielts-ecdict.csv")
OUTPUT = ROOT / "app" / "vocabulary-user-headwords.ts"

LIST_CATEGORY = {
    **{number: "自然地理" for number in range(1, 5)},
    **{number: "植物研究" for number in range(5, 7)},
    **{number: "动物保护" for number in range(7, 10)},
    10: "太空探索",
    **{number: "学校教育" for number in range(11, 18)},
    **{number: "科技发明" for number in range(18, 20)},
    20: "文化历史",
    **{number: "语言演化" for number in range(21, 23)},
    **{number: "娱乐运动" for number in range(23, 25)},
    25: "娱乐与物品",
    **{number: "物品材料" for number in range(26, 28)},
    **{number: "时尚潮流" for number in range(28, 30)},
    **{number: "饮食健康" for number in range(30, 33)},
    **{number: "建筑场所" for number in range(33, 36)},
    **{number: "交通旅行" for number in range(36, 38)},
    **{number: "国家政府" for number in range(38, 41)},
    **{number: "社会经济" for number in range(41, 44)},
    **{number: "法律法规" for number in range(44, 46)},
    **{number: "战争冲突" for number in range(46, 50)},
    50: "社会关系",
    **{number: "行为动作" for number in range(51, 57)},
}

ROW_PATTERN = re.compile(
    r"(?<!\w)(\d{1,2})\s+([A-Za-z][^\u3400-\u9fff\r\n]{0,70})"
)
POS_PATTERN = re.compile(
    r"\s+(?:n|v|adj|adv|prep|conj|pron|num|art|aux|modal)(?:\s*[/.,]|\s|$)",
    re.IGNORECASE,
)
VALID_HEADWORD = re.compile(r"[A-Za-z][A-Za-z' -]*")
BLOCKED_HEADWORDS = {"adj", "adv", "n", "v"}


@dataclass(frozen=True)
class DictionaryEntry:
    word: str
    meaning: str
    part_of_speech: str
    bnc_rank: int
    general_frequency: int
    is_ielts_tagged: bool


def clean_translation(value: str) -> str:
    lines: list[str] = []
    for raw_line in value.replace("\\n", "\n").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("[网络]"):
            continue
        line = re.sub(
            r"^(?:n|v|vt|vi|a|adj|adv|prep|pron|conj|num|art|aux|modal)\.\s*",
            "",
            line,
            flags=re.IGNORECASE,
        )
        line = re.sub(r"\s+", " ", line)
        if line and line not in lines:
            lines.append(line)
        if len(lines) == 2:
            break
    return "；".join(lines).replace(";", "；")[:120].rstrip("；,， ")


def normalize_pos(word: str, value: str, translation: str, definition: str) -> str:
    primary = value.split("/")[0].split(":")[0].strip().lower()
    if not primary:
        prefix = re.match(
            r"\s*(n|v|vt|vi|a|adj|adv|prep|pron|conj|num|art|aux|modal)\.",
            translation,
            flags=re.IGNORECASE,
        ) or re.match(r"\s*(n|v|a|s|r)(?:\.|\s)", definition, flags=re.IGNORECASE)
        primary = prefix.group(1).lower() if prefix else ""
    if not primary:
        if " " in word or word in {"alumni", "biorhythm", "cosplay", "criteria", "franchiser", "rainforest", "trousers"}:
            primary = "n"
        elif word == "affordable":
            primary = "adj"
    mapping = {
        "noun": "n.",
        "n": "n.",
        "verb": "v.",
        "v": "v.",
        "vt": "v.",
        "vi": "v.",
        "adj": "adj.",
        "a": "adj.",
        "s": "adj.",
        "adjective": "adj.",
        "adv": "adv.",
        "r": "adv.",
        "adverb": "adv.",
        "prep": "prep.",
        "pron": "pron.",
        "conj": "conj.",
        "det": "det.",
        "number": "num.",
        "num": "num.",
        "modal": "modal v.",
    }
    return mapping.get(primary, "word")


def positive_integer(value: str | None) -> int:
    try:
        parsed = int(value or "0")
    except ValueError:
        return 1_000_000
    return parsed if parsed > 0 else 1_000_000


def load_dictionary() -> dict[str, DictionaryEntry]:
    entries: dict[str, DictionaryEntry] = {}
    with ECDICT_CSV.open(encoding="utf-8", errors="replace", newline="") as source:
        for row in csv.DictReader(source):
            word = (row.get("word") or "").strip().lower()
            if not word or word in entries:
                continue
            meaning = clean_translation(row.get("translation") or "")
            if not meaning:
                continue
            tags = (row.get("tag") or "").lower()
            entries[word] = DictionaryEntry(
                word=word,
                meaning=meaning,
                part_of_speech=normalize_pos(
                    word,
                    row.get("pos") or "",
                    row.get("translation") or "",
                    row.get("definition") or "",
                ),
                bnc_rank=positive_integer(row.get("bnc")),
                general_frequency=positive_integer(row.get("frq")),
                is_ielts_tagged="ielts" in tags,
            )
    return entries


def extract_headwords() -> list[tuple[str, str]]:
    extracted: list[tuple[str, str]] = []
    for page in SOURCE_TEXT.read_text(encoding="utf-8").split("\f"):
        list_match = re.search(r"List\s*(\d{1,2})", page, flags=re.IGNORECASE)
        if not list_match:
            continue
        list_number = int(list_match.group(1))
        category = LIST_CATEGORY.get(list_number, "IELTS 主题词汇")
        for match in ROW_PATTERN.finditer(page):
            row_number = int(match.group(1))
            raw = match.group(2)
            if not 1 <= row_number <= 60 or raw.strip().startswith("Date"):
                continue
            pos_match = POS_PATTERN.search(raw)
            term = raw[: pos_match.start()] if pos_match else raw
            term = re.sub(r"\s*\*\s*", "", term)
            term = re.sub(r"\s+", " ", term).strip(" .,:;()[]~").lower()
            if VALID_HEADWORD.fullmatch(term) and term not in BLOCKED_HEADWORDS:
                extracted.append((term, category))
    return extracted


def main() -> None:
    if not SOURCE_TEXT.exists():
        raise FileNotFoundError(f"Missing extracted headword source: {SOURCE_TEXT}")
    if not ECDICT_CSV.exists():
        raise FileNotFoundError(f"Missing ECDICT source: {ECDICT_CSV}")

    dictionary = load_dictionary()
    raw_headwords = extract_headwords()
    selected: dict[str, tuple[DictionaryEntry, str]] = {}
    for word, category in raw_headwords:
        entry = dictionary.get(word)
        if entry and word not in selected:
            selected[word] = (entry, category)

    # Use independent frequency metadata rather than preserving the source order.
    ordered = sorted(
        selected.values(),
        key=lambda item: (
            not item[0].is_ielts_tagged,
            min(item[0].bnc_rank, item[0].general_frequency),
            item[0].word,
        ),
    )

    lines = [
        "// Generated by scripts/build-user-headword-vocabulary.py.",
        "// English headwords: user-supplied study list; original ordering and annotations discarded.",
        "// Chinese meanings and parts of speech: ECDICT (MIT License).",
        "// Example sentences are generated from original templates in app/learning-data.ts.",
        "// See THIRD_PARTY_NOTICES.md for attribution and methodology.",
        "",
        "export type UserHeadwordVocabularyRow = readonly [",
        "  word: string,",
        "  meaning: string,",
        "  partOfSpeech: string,",
        "  category: string,",
        "];",
        "",
        "export const userHeadwordVocabularyRows: UserHeadwordVocabularyRow[] = [",
    ]
    for entry, category in ordered:
        values = [entry.word, entry.meaning, entry.part_of_speech, category]
        lines.append(f"  [{', '.join(json.dumps(value, ensure_ascii=False) for value in values)}],")
    lines.extend([
        "];",
        "",
    ])
    OUTPUT.write_text("\n".join(lines), encoding="utf-8")

    raw_unique = len({word for word, _ in raw_headwords})
    print(f"Parsed {len(raw_headwords)} rows and {raw_unique} unique candidate headwords.")
    print(f"Kept {len(ordered)} high-confidence headwords with independent dictionary metadata.")
    print(f"Discarded {raw_unique - len(ordered)} malformed or unmatched candidates.")


if __name__ == "__main__":
    main()
