# Todo

- [x] Diagnose why the Op. 99 & 100 Moreau search URL still shows no Presto result.
- [x] Add a more robust scoped Presto fallback for work-number/title noise if needed.
- [x] Verify the new query and previous query both reach product `9844946`.
- [x] Rebuild the extension ZIP if code changes are required.
- [x] Document the result.

## Previous Work

- [x] Bump extension version from `0.1.2` to `0.1.3`.
- [x] Create Chrome Web Store upload ZIP for version `0.1.3`.
- [x] Verify manifest syntax and ZIP contents for version `0.1.3`.
- [x] Document the version bump result.

## Earlier Work

- [x] Diagnose why the exact Moreau Schubert Douban search URL shows no Presto result.
- [x] Add a scoped Presto fallback query that removes performer-role noise when the exact query returns nothing.
- [x] Verify the fallback reaches Presto product `9844946` and run syntax checks.
- [x] Document the root cause and result.

## Earlier Work 2

- [x] Inspect the Douban search flow and Presto metadata extraction for the failing Maria Perrotta case.
- [x] Reproduce the live search responses for title, performer, and barcode queries.
- [x] Tighten search-hit detection so unrelated same-title releases do not block subject creation.
- [x] Verify the updated matching logic against the Maria Perrotta case and run a syntax check.
- [x] Reproduce the sidebar's Presto search with the exact Maria Perrotta query.
- [x] Fix the sidebar result loading/parsing if the Presto response format is not being handled.
- [x] Verify the sidebar now shows the expected Presto candidate for this case.
- [x] Switch Presto sidebar search to the official ajax search endpoint.
- [x] Add extension permission for the ajax Presto host and verify the returned payload.
- [x] Confirm the Chrome Web Store update requirement for extension versioning.
- [x] Bump the extension manifest version for the next store release.
- [x] Verify the updated manifest metadata is syntactically valid.
- [x] Create the Chrome Web Store upload ZIP for version `0.1.2`.
- [x] Verify the upload ZIP contains the expected extension root files only.

# Review

- Investigation confirmed the Presto release exists and is searchable on Presto.
- Douban search currently returns no Maria Perrotta / barcode hit for this release, so the extension must avoid treating other same-title releases as matches.
- Verified `content/douban.js` with `node --check`.
- Verified the updated matcher rejects the live wrong-title hit pattern while still accepting an exact title + performer match.
- Confirmed the exact Presto search query returns the Maria Perrotta release page.
- Added card-based Presto parsing plus raw-URL fallback so the sidebar can still surface the product when the search markup shifts.
- Increased background fetch timeout from 15s to 30s to reduce empty sidebar results on slower responses.
- Replaced HTML scraping as the primary search path with `https://ajax-www.prestomusic.com/api/classical/search`, which returns the expected Maria Perrotta record directly for this query.
- Bumped the extension version from `0.1.1` to `0.1.2` for the next Chrome Web Store upload and verified that `manifest.json` still parses cleanly.
- Created `/Users/william/Works/douban_new_subject/Douban New Subject-0.1.2.zip` with only the extension runtime files and verified the archive contains `manifest.json`, `background.js`, `content/douban.js`, `content/panel.css`, and the icon assets.
- The Moreau Schubert URL did not show Presto because the exact query `Schubert: Piano Trios David Moreau (violin), Edgar Moreau` returns no Presto API or HTML search results, even though product `9844946` exists.
- Added a Presto fallback query that strips parenthesized performer roles and punctuation after the exact query fails; the normalized query `Schubert Piano Trios David Moreau Edgar Moreau` returns product `9844946`.
- Verified `content/douban.js`, `background.js`, and `manifest.json` syntax after the change.
- Bumped `manifest.json` from `0.1.2` to `0.1.3` for the Presto fallback release.
- Created `/Users/william/Works/douban_new_subject/Douban New Subject-0.1.3.zip` with only the extension runtime files.
- Verified local and zipped `manifest.json` both report version `0.1.3`.
- The Op. 99 & 100 Moreau query still failed because Presto returns no results for both the exact query and the punctuation-only fallback while `Op 99 100` remains in the search text.
- Added a work-number fallback that strips common catalog/work labels such as `Op.`, `No.`, `D.`, `K.`, `BWV`, `RV`, `Hob.`, and `S.` before the final Presto retry.
- Verified the cleaned query `Schubert Piano Trios Edgar Moreau Jérémie Moreau David Moreau` returns product `9844946`, and the previous cleaned query still returns product `9844946`.
- Bumped `manifest.json` to `0.1.4`, created `/Users/william/Works/douban_new_subject/Douban New Subject-0.1.4.zip`, and verified the ZIP manifest reports version `0.1.4`.
