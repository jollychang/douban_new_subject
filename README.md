# Douban New Subject Helper

Chrome extension that assists with searching and creating Douban Music subjects.

## Overview

This extension adds a fixed side panel on Douban Music search and new-subject pages. It uses Presto Music pages to gather album metadata (cover, artist, barcode, release date, label) and helps you search and create Douban entries more quickly.

## Features

- Injects a right-side panel on Douban Music search and new-subject pages.
- Parses Presto Music search results for candidate albums.
- Extracts barcode / EAN / UPC, release date, label, and performers.
- Searches Douban by barcode or album name + artist.
- Highlights existing Douban entries when found.
- Auto-fills the Douban "new subject" forms (title, barcode, performers, release date, label, reference link).
- Auto-downloads the album cover when opening the new-subject page.
- Leaves cover upload to you (manual).

## Requirements

- Chrome (or Chromium-based browser).
- Node.js 20+ for local quality checks.
- Network access to:
  - https://music.douban.com/
  - https://search.douban.com/
  - https://www.douban.com/
  - https://www.prestomusic.com/

## Install

### Chrome Web Store (recommended)

Install [Douban New Subject Helper from the Chrome Web Store](https://chromewebstore.google.com/detail/douban-new-subject-helper/akgdaclanljoajifphppdlpkhfgokeih).

The store reported 31 users when checked on 2026-08-13. This is the Chrome Web Store user figure, not a download count, GitHub adoption metric, or estimate of a wider ecosystem.

### Unpacked development copy

1. Open Chrome and go to `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked" and select this project folder.

## Usage

1. Open a Douban search URL, for example:
   `https://music.douban.com/subject_search?search_text=Album%20Artist`
   or `https://www.douban.com/search?cat=1003&q=Album%20Artist`
2. The right-side panel appears and shows Presto candidates.
3. Pick a candidate and click:
   - "Search Douban (barcode)" or
   - "Search Douban (name)"
4. If a Douban entry exists, it will be highlighted.
5. If no entry exists, it opens:
   `https://music.douban.com/new_subject?cat=1003`
6. The extension auto-fills the form. You can submit and then upload the cover manually.

## How it works

- Content script injects the side panel and handles form filling.
- Background service worker fetches Presto HTML (cross-origin).
- Candidate data is stored in `chrome.storage.local` and passed across page navigation.

## File layout

- `manifest.json` - Chrome extension manifest (MV3).
- `background.js` - background service worker for cross-origin fetch.
- `content/douban.js` - main logic, UI, parsing, and form fill.
- `content/panel.css` - side panel styling.
- `scripts/quality-check.mjs` - local and CI quality/security gate.

## Quality checks

Run the complete local gate before committing or publishing:

```bash
npm test
```

The test suite runs nine behavior tests for the new-subject flow, then the deterministic quality/security gate. The latter checks JavaScript syntax, manifest consistency, overly broad extension permissions, forbidden committed artifacts, common secret patterns, and dangerous JavaScript APIs. GitHub Actions runs the full `npm test` command on pushes to `main` and on pull requests.

For release-package validation and deterministic packaging instructions, see [docs/releasing.md](docs/releasing.md).

For an additional AI code review pass before pushing:

```bash
npm run review
```

This reviews uncommitted local changes. After committing but before pushing, use:

```bash
npm run review:branch
```

The review commands use your local Codex CLI login. Do not commit API keys or CI secrets for Codex review unless the workflow is explicitly designed for that.

## Troubleshooting

- If fields are not filled, reload the extension and redo the search.
- If Presto changes page structure, parsing may need updates in `content/douban.js`.
- The panel shows missing required fields in its status area.

## Maintenance and support

The primary maintainer is [jollychang](https://github.com/jollychang). The maintainer is responsible for triaging reports, reviewing changes, verifying releases, and keeping the Chrome Web Store runtime aligned with public source.

- [Changelog](CHANGELOG.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Release process](docs/releasing.md)
- [Report a bug or request a feature](https://github.com/jollychang/douban_new_subject/issues/new/choose)

## License status

No license has been published yet. Do not assume permission to reuse the code or assets until the copyright ownership and third-party asset provenance have been confirmed and a `LICENSE` file is added.
