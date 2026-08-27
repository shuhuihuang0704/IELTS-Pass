#!/usr/bin/env python3
"""Import the user-provided listening corpus workbook into a compact TS module."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import openpyxl


WORD_PATTERN = re.compile(r"^[A-Za-z]+(?:[-'][A-Za-z]+)*$")
PHRASE_PATTERN = re.compile(r"^[A-Za-z]+(?:[-'][A-Za-z]+)*(?: [A-Za-z]+(?:[-'][A-Za-z]+)*)+$")


def compact_rows(rows: list[tuple[str, str, str]]) -> str:
    return ",\n".join(
        "  " + json.dumps(row, ensure_ascii=False, separators=(",", ":"))
        for row in rows
    )


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: import-listening-corpus.py INPUT.xlsx OUTPUT.ts")

    source_path = Path(sys.argv[1]).expanduser().resolve()
    output_path = Path(sys.argv[2]).expanduser().resolve()
    workbook = openpyxl.load_workbook(source_path, read_only=True, data_only=True)
    sheet = workbook["错词总表"]

    words: dict[str, tuple[str, str, str]] = {}
    phrases: dict[str, tuple[str, str, str]] = {}
    for row in sheet.iter_rows(min_row=2, values_only=True):
        raw_term, raw_meaning, raw_section = row[1], row[2], row[3]
        if not isinstance(raw_term, str) or not isinstance(raw_meaning, str):
            continue
        term = " ".join(raw_term.strip().split())
        meaning = raw_meaning.strip()
        section = str(raw_section or "").strip()
        if not term or not meaning:
            continue
        normalized = term.lower()
        record = (term, meaning, section)
        if WORD_PATTERN.fullmatch(term):
            words.setdefault(normalized, record)
        elif PHRASE_PATTERN.fullmatch(term) and 2 <= len(term.split()) <= 7:
            phrases.setdefault(normalized, record)

    word_rows = list(words.values())
    phrase_rows = list(phrases.values())
    module = f'''// Generated from {source_path.name}. Run scripts/import-listening-corpus.py to refresh.
export type ListeningCorpusEntry = {{
  term: string;
  meaning: string;
  section: string;
}};

const listeningCorpusWordRows = [
{compact_rows(word_rows)}
] as const;

const listeningCorpusPhraseRows = [
{compact_rows(phrase_rows)}
] as const;

export const listeningCorpusWords: ListeningCorpusEntry[] = listeningCorpusWordRows.map(([term, meaning, section]) => ({{ term, meaning, section }}));
export const listeningCorpusPhrases: ListeningCorpusEntry[] = listeningCorpusPhraseRows.map(([term, meaning, section]) => ({{ term, meaning, section }}));

export const listeningCorpusMeta = {{
  source: {json.dumps(source_path.name, ensure_ascii=False)},
  wordCount: listeningCorpusWordRows.length,
  phraseCount: listeningCorpusPhraseRows.length,
}} as const;
'''
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(module, encoding="utf-8")
    print(json.dumps({
        "source": str(source_path),
        "output": str(output_path),
        "words": len(word_rows),
        "phrases": len(phrase_rows),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
