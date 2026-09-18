# Vocabulary sources and notices

## User-supplied English headwords

- Use in this project: English headword candidates only.
- Excluded: the source document's Chinese definitions, examples, memory aids, page design and ordering.
- Changes: malformed or clipped candidates are rejected, duplicates are removed, and the remaining words are independently re-ordered with ECDICT frequency metadata.
- Distribution: the source PDF is not included in the repository or website.
- App-authored material: targets without an exact CC0 sentence match use the original topic-aware fallback generator in `app/learning-data.ts`; matched examples are listed in `app/listening-sentence-bank.ts`.

The expanded vocabulary dataset in `app/vocabulary-expanded.ts` combines the following sources. The generated dataset is kept separate from the rest of the application so its attribution and license remain explicit.

## New General Service List 1.2

- Authors: Charles Browne, Brent Culligan and Joseph Phillips
- Official source: <https://www.newgeneralservicelist.com/new-general-service-list>
- Use in this project: ranked general-English headwords, part of speech and easy-English definitions; the first 200 very basic entries are excluded unless required to complete the target size.
- License: [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/)
- Changes: combined with an independently curated IELTS theme layer, filtered, de-duplicated, assigned Chinese dictionary meanings and formatted for the App.

## New Academic Word List 1.2

- Authors: Charles Browne, Brent Culligan and Joseph Phillips
- Official source: <https://www.newgeneralservicelist.com/new-academic-word-list>
- Use in this project: academic-English headwords, rank, part of speech and easy-English definitions.
- License: [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/)
- Changes: combined with an independently curated IELTS theme layer, de-duplicated, assigned Chinese dictionary meanings and formatted for the App.

## New General Service List – Graded Reader 1.0

- Authors: Charles Browne and Brent Culligan
- Official source: <https://www.newgeneralservicelist.com/ngsl-graded-reader>
- Use in this project: a small number of mid-frequency reading words used only when needed to reach 3,600 entries without reintroducing the most basic function words.
- License: [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/)
- Changes: filtered, de-duplicated, assigned dictionary meanings and formatted for the App.

## ECDICT

- Author/maintainer: Linwei / skywind3000
- Source: <https://github.com/skywind3000/ECDICT>
- Use in this project: concise Chinese meanings for the selected NGSL and NAWL headwords.
- License: MIT License, Copyright (c) Linwei. The full license is available in the upstream [LICENSE](https://github.com/skywind3000/ECDICT/blob/master/LICENSE) file.

## Tatoeba CC0 English sentence export

- Source: <https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences_CC0.tsv.bz2>
- Use in this project: exact-match example sentences for the listening vocabulary and connected-speech targets.
- License: the export contains sentences explicitly released under CC0; the selected sentences are stored in `app/listening-sentence-bank.ts`.
- Changes: sentences are filtered for exact target matches, reasonable length, and duplicate visible contexts before bundling. Targets without a CC0 match continue through the app's clearly marked generated fallback.

The dataset is not presented as an electronic edition of the user-supplied source document.
