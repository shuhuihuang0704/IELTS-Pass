#!/usr/bin/env python3
"""Build the 3,600-word IELTS-oriented learning dataset from licensed sources.

Inputs are downloaded outside the repository so the upstream archives are not
vendored. See THIRD_PARTY_NOTICES.md for source URLs and licenses.
"""

from __future__ import annotations

import csv
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NGSL_HTML = Path("/tmp/ielts-ngsl-gloss.html")
NAWL_HTML = Path("/tmp/ielts-nawl-gloss.html")
ECDICT_CSV = Path("/tmp/ielts-ecdict.csv")
NGSL_GR_CSV = Path("/tmp/ielts-ngsl-gr.csv")
OUTPUT = ROOT / "app" / "vocabulary-expanded.ts"
TARGET_SIZE = 3_600


class GlossaryParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_row = False
        self.in_cell = False
        self.cells: list[str] = []
        self.cell_parts: list[str] = []
        self.rows: list[list[str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "tr":
            self.in_row = True
            self.cells = []
        elif tag == "td" and self.in_row:
            self.in_cell = True
            self.cell_parts = []

    def handle_data(self, data: str) -> None:
        if self.in_cell:
            self.cell_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "td" and self.in_cell:
            value = re.sub(r"\s+", " ", " ".join(self.cell_parts)).strip()
            self.cells.append(html.unescape(value))
            self.in_cell = False
        elif tag == "tr" and self.in_row:
            if len(self.cells) >= 5 and self.cells[0].isdigit():
                self.rows.append(self.cells[:5])
            self.in_row = False


def parse_glossary(path: Path, source: str) -> list[dict[str, object]]:
    parser = GlossaryParser()
    parser.feed(path.read_text(encoding="utf-8", errors="replace"))
    entries: list[dict[str, object]] = []
    for rank, word, phonetic, pos, definition in parser.rows:
        normalized = word.strip().lower()
        if not re.fullmatch(r"[a-z][a-z'-]*", normalized):
            continue
        entries.append({
            "rank": int(rank),
            "word": normalized,
            "phonetic": phonetic.strip("/ "),
            "pos": pos.strip().lower(),
            "definition": definition.strip().rstrip("."),
            "source": source,
        })
    return sorted(entries, key=lambda entry: int(entry["rank"]))


def curated_words() -> set[str]:
    source = (ROOT / "app" / "learning-data.ts").read_text(encoding="utf-8")
    match = re.search(r"const dailyVocabularySource = `([\s\S]*?)`\.trim\(\);", source)
    if not match:
        raise RuntimeError("Could not find dailyVocabularySource")
    return {line.split("|", 1)[0].strip().lower() for line in match.group(1).strip().splitlines()}


def clean_translation(value: str) -> str:
    lines = []
    for raw_line in value.replace("\\n", "\n").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("[网络]"):
            continue
        line = re.sub(r"^(?:n|v|vt|vi|adj|adv|prep|pron|conj|num|art|aux|modal)\.\s*", "", line, flags=re.I)
        line = re.sub(r"\s+", " ", line)
        if line and line not in lines:
            lines.append(line)
        if len(lines) == 2:
            break
    result = "；".join(lines).replace(";", "；")
    return result[:120].rstrip("；,， ")


def load_translations(words: set[str]) -> dict[str, dict[str, str]]:
    translations: dict[str, dict[str, str]] = {}
    with ECDICT_CSV.open(encoding="utf-8", errors="replace", newline="") as source:
        for row in csv.DictReader(source):
            word = (row.get("word") or "").strip().lower()
            if word not in words or word in translations:
                continue
            translation = clean_translation(row.get("translation") or "")
            if not translation:
                continue
            translations[word] = {
                "meaning": translation,
                "pos": (row.get("pos") or "").strip(),
                "phonetic": (row.get("phonetic") or "").strip(),
                "definition": re.sub(r"\s+", " ", (row.get("definition") or "").replace("\\n", " ")).strip().rstrip("."),
            }
    return translations


def normalize_pos(value: str, fallback: str) -> str:
    primary = value.split("/")[0].split(":")[0].strip().lower()
    mapping = {
        "noun": "n.", "n": "n.", "verb": "v.", "v": "v.", "vt": "v.", "vi": "v.",
        "adj": "adj.", "adjective": "adj.", "adv": "adv.", "adverb": "adv.",
        "prep": "prep.", "pron": "pron.", "conj": "conj.", "det": "det.",
        "number": "num.", "num": "num.", "modal": "modal v.", "prefix": "prefix",
    }
    return mapping.get(primary) or mapping.get(fallback.lower(), fallback or "word")


def ts_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def main() -> None:
    for path in (NGSL_HTML, NAWL_HTML, ECDICT_CSV, NGSL_GR_CSV):
        if not path.exists():
            raise FileNotFoundError(f"Missing source file: {path}")

    curated = curated_words()
    blocked = {"bloody", "damn"}
    ngsl = [entry for entry in parse_glossary(NGSL_HTML, "NGSL 1.2") if int(entry["rank"]) > 200 and entry["word"] not in blocked]
    nawl = parse_glossary(NAWL_HTML, "NAWL 1.2")

    nawl_unique = [entry for entry in nawl if entry["word"] not in curated]
    academic_words = {str(entry["word"]) for entry in nawl_unique}
    ngsl_unique = [entry for entry in ngsl if entry["word"] not in curated and entry["word"] not in academic_words]
    known_words = curated | academic_words | {str(entry["word"]) for entry in ngsl_unique}
    graded_reader: list[dict[str, object]] = []
    with NGSL_GR_CSV.open(encoding="utf-8-sig", newline="") as source:
        for row in csv.DictReader(source):
            word = (row.get("Word") or "").strip().lower()
            if not re.fullmatch(r"[a-z][a-z'-]*", word) or word in known_words or word in blocked:
                continue
            graded_reader.append({
                "rank": int(row.get("WordID") or 99_999),
                "word": word,
                "phonetic": "",
                "pos": "",
                "definition": "",
                "source": "NGSL-GR 1.0",
            })
            known_words.add(word)
    needed_general = TARGET_SIZE - len(curated) - len(nawl_unique)
    if needed_general < 0:
        raise RuntimeError("Academic and curated pools exceed target size")
    if len(ngsl_unique) < needed_general:
        ngsl_unique.extend(graded_reader)
    selected_general = ngsl_unique[:needed_general]
    selected = nawl_unique + selected_general
    if len(curated) + len(selected) != TARGET_SIZE:
        raise RuntimeError(f"Expected {TARGET_SIZE} unique words, got {len(curated) + len(selected)}")

    translations = load_translations({str(entry["word"]) for entry in selected})
    missing = [str(entry["word"]) for entry in selected if str(entry["word"]) not in translations]
    if missing:
        raise RuntimeError(f"Missing Chinese translations for {len(missing)} words: {', '.join(missing[:20])}")

    academic = [entry for entry in selected if entry["source"] == "NAWL 1.2"]
    general = [entry for entry in selected if entry["source"] != "NAWL 1.2"]
    ordered: list[dict[str, object]] = []
    academic_index = 0
    general_index = 0
    expanded_target = TARGET_SIZE - len(curated)
    for day in range(36):
        remaining_days = 36 - day
        academic_take = min(len(academic) - academic_index, round((len(academic) - academic_index) / remaining_days))
        batch = academic[academic_index:academic_index + academic_take]
        academic_index += academic_take
        general_take = min(100 - 9 - len(batch), len(general) - general_index)
        batch.extend(general[general_index:general_index + general_take])
        general_index += general_take
        ordered.extend(batch)
    ordered.extend(academic[academic_index:])
    ordered.extend(general[general_index:])
    ordered = ordered[:expanded_target]

    lines = [
        "// Generated by scripts/build-vocabulary.py.",
        "// NGSL 1.2, NAWL 1.2 and NGSL-GR 1.0: CC BY-SA 4.0.",
        "// Chinese translations: ECDICT, MIT License, Copyright (c) Linwei.",
        "// See THIRD_PARTY_NOTICES.md for full attribution and source URLs.",
        "",
        "export type ExpandedVocabularyRow = readonly [",
        "  word: string,",
        "  meaning: string,",
        "  partOfSpeech: string,",
        "  definition: string,",
        "  sourceCode: \"a\" | \"n\" | \"g\",",
        "];",
        "",
        "export const expandedVocabularyRows: ExpandedVocabularyRow[] = [",
    ]
    for entry in ordered:
        word = str(entry["word"])
        dictionary = translations[word]
        source = str(entry["source"])
        definition = str(entry["definition"]) or dictionary["definition"] or f"a useful word for IELTS reading and discussion"
        part = normalize_pos(str(entry["pos"]), dictionary["pos"])
        source_code = "a" if source.startswith("NAWL") else "g" if source.startswith("NGSL-GR") else "n"
        lines.append(
            "  ["
            f"{ts_string(word)}, {ts_string(dictionary['meaning'])}, {ts_string(part)}, "
            f"{ts_string(definition)}, {ts_string(source_code)}"
            "],"
        )
    lines.extend([
        "];",
        "",
    ])
    OUTPUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated {len(ordered)} expanded entries; total with curated words: {len(curated) + len(ordered)}")


if __name__ == "__main__":
    main()
