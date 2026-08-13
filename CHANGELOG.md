# Changelog

All notable runtime changes are documented in this file. The source repository may also contain governance or release-process updates that do not change the Chrome Web Store runtime.

## [0.1.5] - 2026-07-27

### Fixed

- Made the URL `search_text` authoritative when entering the new-subject flow, preventing stale stored candidates from being used.
- Limited direct prefilling to a unique exact Presto match or a sole candidate; ambiguous and failed lookups leave the form unchanged.
- Cleared candidate and pending state after completed or existing-subject flows, including the delayed cover-write path.

### Tested

- Added nine zero-dependency behavior tests covering query priority, exact and sole selection, failures, ambiguity, state cleanup, automatic flow, cover-write timing, and URL decoding.

[0.1.5]: https://github.com/jollychang/douban_new_subject/compare/1c70f8c...4f7a959
