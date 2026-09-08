# Spanish 6000 Flashcards

A static, mobile-friendly study app modeled on `DE_cards`, with:

- 5,000 frequency-ranked Spanish word forms
- 1,000 short Spanish–English phrase pairs
- Flashcard and four-choice quiz modes
- Spanish → English, English → Spanish, and mixed directions
- Search, rank bands, topics, shuffle, random card, text-to-speech, and saved progress
- Offline PWA support

## Run locally

```bash
python3 -m http.server 8027
```

Then open `http://127.0.0.1:8027/index.html`.

## Data methodology

The word deck uses the first 5,000 unique usable word forms in the corpus frequency data, excluding duplicate spellings, punctuation, and entries without an English definition. Infinitives and common conjugated verb forms are included. Rank numbers in the app refer to the resulting learner deck, not the unfiltered raw row number.

The phrase deck is selected from reviewed Tatoeba Spanish–English pairs. There is no universal, authoritative ranking of “the 1,000 most-used phrases,” so the generator ranks short pairs for learner usefulness using word frequency, length, review scores, and common conversational signals. Names, profanity, duplicate translations, and unusual or overly long examples are filtered out.

## Sources and licenses

- Frequency list: [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords), CC BY-SA 3.0, distributed through [doozan/spanish_data](https://github.com/doozan/spanish_data)
- Word definitions: Wiktionary-derived data from [spanish-english-json](https://github.com/fufu70/spanish-english-json) and [doozan/spanish_data](https://github.com/doozan/spanish_data); see the source repositories for attribution and share-alike terms
- Sentence pairs: [Tatoeba](https://tatoeba.org/), CC BY 2.0 FR; attribution metadata is available in the upstream `sentences.tsv`

This app includes compact derived study fields rather than reproducing the complete upstream datasets. Preserve this README and its attribution links when redistributing the generated deck.

## Rebuild the deck

After cloning the two source repositories to the default `/private/tmp` paths shown in `tools/build-data.js`:

```bash
node tools/build-data.js
```

Override the source locations with `SPANISH_DATA_ROOT` and `SPANISH_DICTIONARY_ROOT` if needed.
