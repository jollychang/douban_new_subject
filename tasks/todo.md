# Todo

## OSS Readiness: v0.1.5 (2026-08-13)

- [ ] Independently read back Chrome Web Store runtime evidence (local `4f7a959` and ZIP checks passed).
- [ ] Confirm copyright ownership and re-licensing rights before publishing MIT.
- [x] Add non-legal governance, CI, and reproducible-release materials.
- [ ] Add license and license-dependent project metadata/quality gates after provenance confirmation.
- [x] Run the full local release and quality verification.
- [x] Prepare a scoped commit and show its cached diff for review.
- [x] Obtain explicit authorization before push (2026-08-13); PR merge, tag, GitHub Release, profile changes, and application submission remain separately authorized actions.


## Current Release: Chrome Web Store 0.1.5

- [x] Confirm the exact commit and package scope.
- [x] Run the full release verification.
- [x] Commit only the 0.1.5 fix, tests, and version files.
- [x] Build and inspect the 0.1.5 Chrome extension ZIP.
- [x] Chrome Web Store 0.1.5 was published on 2026-07-27.
- [x] Record the final store status and release evidence: 31 Chrome Web Store users when assessed; this is not a download count.

## Current Work: Prevent stale new-subject candidates

- [x] Make `search_text` authoritative on `/new_subject`.
- [x] Select only a unique exact or sole Presto candidate for direct prefilling.
- [x] Reject stale stored candidates when no active creation flow exists.
- [x] Consume candidate state after the flow completes.
- [x] Add zero-dependency VM behavior regression tests.
- [x] Run targeted tests, the full quality gate, syntax checks, and `git diff --check`.
- [x] Record the verified result below.

- [x] Review recent version changes and identify user-facing release themes.
- [x] Draft copy for Douban diary, Chrome Web Store release notes, and future release reuse.
- [x] Verify the release copy references the current manifest/package version and existing artifacts accurately.
- [x] Document the result in this task file.

## Previous Work

- [x] Add deterministic lint/security checks for the extension repository.
- [x] Add GitHub Actions quality gate for push and pull request events.
- [x] Add local Codex review command without committing credentials.
- [x] Update project docs for the new quality workflow.
- [x] Run local verification and document results.

## Earlier Work

- [x] Diagnose why the Op. 99 & 100 Moreau search URL still shows no Presto result.
- [x] Add a more robust scoped Presto fallback for work-number/title noise if needed.
- [x] Verify the new query and previous query both reach product `9844946`.
- [x] Rebuild the extension ZIP if code changes are required.
- [x] Document the result.

## Earlier Work 2

- [x] Bump extension version from `0.1.2` to `0.1.3`.
- [x] Create Chrome Web Store upload ZIP for version `0.1.3`.
- [x] Verify manifest syntax and ZIP contents for version `0.1.3`.
- [x] Document the version bump result.

## Earlier Work 3

- [x] Diagnose why the exact Moreau Schubert Douban search URL shows no Presto result.
- [x] Add a scoped Presto fallback query that removes performer-role noise when the exact query returns nothing.
- [x] Verify the fallback reaches Presto product `9844946` and run syntax checks.
- [x] Document the root cause and result.

## Earlier Work 4

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

- Committed the scoped 0.1.5 release as `4f7a959` without including the existing `docs/` or `tasks/todo.md` work.
- Built `Douban New Subject-0.1.5.zip` directly from commit `4f7a959`; archive validation passed and SHA-256 is `2270a96670ec0b226ab5a60cab1377ae28c1661b47bc8c6c5ec15aab1f9c572d`.
- Chrome Web Store upload is waiting at Google's "Verify it's you" reauthentication screen for `jollychang@gmail.com`.
- `/new_subject?search_text=...` now clears stale storage first, resolves Presto from the URL query, and uses one selected candidate for the helper card and Douban form.
- Direct URLs only prefill when Presto returns a sole result or one unique exact match; failed and ambiguous lookups leave the form unchanged.
- Queryless pages only reuse a candidate from an active `create` or `detail` flow. Existing-subject matches and completed detail forms clear both `candidate` and `pending`.
- Cover-download writes are awaited before lifecycle cleanup so delayed storage updates cannot resurrect a completed candidate.
- Added nine zero-dependency VM behavior tests covering URL priority, exact/sole selection, failure, ambiguity, stale queryless state, automatic button flow, detail cleanup, the cover-write race, and `+` / `%26` decoding.
- Verified with `npm test`, JavaScript syntax checks, `git diff --check`, and an independent read-only review with no remaining findings.
- No version bump, ZIP rebuild, or release was performed.
- Added `docs/release-copy.md` with ready-to-post v0.1.4 copy for Douban diary, short Douban diary, Chrome Web Store release notes in Chinese and English, a one-line store summary, and submission notes.
- Added a reusable future-release template and checklist so later releases can update the same format before store submission.
- Verified `manifest.json`, `package.json`, and `Douban New Subject-0.1.4.zip` all report version `0.1.4`.
- Ran `npm test`; the quality gate passed.
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
- Added a zero-dependency quality gate at `scripts/quality-check.mjs` that checks JavaScript syntax, manifest consistency, extension permissions, committed artifact types, common secret patterns, file sizes, and dangerous JavaScript APIs.
- Added `package.json` scripts: `npm run lint`, `npm test`, `npm run review`, and `npm run review:branch`.
- Added `.github/workflows/quality.yml` to run the quality gate on pushes to `main` and pull requests with read-only repository permissions.
- Updated `.gitignore` to keep ZIP/CRX packages, `.env` files, dependency folders, coverage, and build outputs out of git.
- Verified `npm run lint`, `npm test`, `git diff --check`, workflow YAML parsing, and a local Codex review run.
