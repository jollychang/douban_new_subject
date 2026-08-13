# Contributing

Thanks for helping improve Douban New Subject Helper.

## Before opening an issue

Use the [bug report](https://github.com/jollychang/douban_new_subject/issues/new/choose) form for reproducible defects and the feature request form for new ideas. Do not disclose security vulnerabilities in public issues; follow [SECURITY.md](SECURITY.md) instead.

Please include the affected Douban URL only when it is safe to share, the extension version, the expected behavior, the observed behavior, and concise reproduction steps. Remove private account, album-library, or session information.

## Local development

1. Use Node.js 20 or later.
2. Load the project directory as an unpacked extension in `chrome://extensions`.
3. Make the smallest focused change.
4. Run the full local gate:

   ```bash
   npm test
   ```

5. For a release candidate, follow [docs/releasing.md](docs/releasing.md).

## Pull requests

- Keep changes focused and describe user-visible behavior.
- Do not commit packages, credentials, browser profiles, cookies, or personal data.
- Add or update behavior tests when runtime behavior changes.
- Complete the pull-request template and ensure CI passes.

The primary maintainer reviews changes for correctness, permissions, DOM-safety, release impact, and documentation. A Codex-assisted self-review is not an external community review.
