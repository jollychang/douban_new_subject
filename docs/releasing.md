# Releasing

This process keeps the public source, Chrome Web Store runtime, release asset, and Git tag auditable without treating governance-only files as extension runtime.

## Preconditions

- Confirm the release version in `manifest.json` and `package.json`.
- Confirm copyright ownership and asset provenance before publishing or changing a license.
- Enable GitHub private vulnerability reporting before advertising GitHub Security Advisories as a private reporting channel. Until then, retain the Chrome Web Store developer-contact route in `SECURITY.md`.
- Work from a reviewed commit; do not use force push.
- Stage an explicit allowlist and inspect `git diff --cached` before every commit. Never use `git add .` or `git add -A`.

## Local verification

Run the complete behavior and quality gate:

```bash
npm test
git diff --check
```

Build the release package from the exact Git reference that supplies the extension runtime. The script refuses to overwrite an existing archive, so use an empty release directory for a rebuild:

```bash
release_dir="$(mktemp -d)"
RELEASE_OUTPUT_DIR="$release_dir" npm run build:release -- 0.1.5 4f7a959
npm run verify:release -- --archive "$release_dir/Douban New Subject-0.1.5.zip" --ref 4f7a959
```

`build:release` uses `git archive`, has no package dependencies, includes only the eight runtime files listed by `verify:release`, validates ZIP integrity, checks versions, and compares each archived file byte-for-byte against the specified Git reference.

## Publishing sequence

1. Fetch and confirm `origin/main` is an ancestor of local `main`; use an ordinary fast-forward push only after authorization.
2. Push the verified runtime commit and read back GitHub's branch, commit, and CI result.
3. Put legal and governance improvements in a substantive pull request. A self-review must be described as self-review, never as external community review.
4. After approval, merge the PR and re-run the local checks from the merge commit.
5. Rebuild and re-verify the Chrome Web Store ZIP against the runtime reference. For v0.1.5, that reference is `4f7a959` and the verified SHA-256 is `2270a96670ec0b226ab5a60cab1377ae28c1661b47bc8c6c5ec15aab1f9c572d`.
6. After authorization, create annotated tag `v0.1.5` from the merged public source and publish a non-draft, non-prerelease GitHub Release with the verified ZIP attached.
7. In the release notes, state clearly that the tag source archive contains governance files added after the store runtime, while the eight runtime files are byte-identical to the verified Chrome Web Store package built from `4f7a959`.
8. Re-read the release asset SHA-256, tag target, GitHub CI, and Chrome Web Store version/user figure. Record the user figure with its date; never describe it as downloads, stars, forks, or broad adoption.

## Release asset provenance

The repository intentionally ignores `*.zip`; release packages are verified local artifacts and GitHub Release attachments, not tracked source files. The permitted v0.1.5 runtime files are:

- `background.js`
- `content/douban.js`
- `content/icons/icon-128.png`
- `content/icons/icon-16.png`
- `content/icons/icon-32.png`
- `content/icons/icon-48.png`
- `content/panel.css`
- `manifest.json`
