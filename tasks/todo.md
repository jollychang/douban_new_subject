# Todo

- [x] Inspect the Douban search flow and Presto metadata extraction for the failing Maria Perrotta case.
- [x] Reproduce the live search responses for title, performer, and barcode queries.
- [x] Tighten search-hit detection so unrelated same-title releases do not block subject creation.
- [x] Verify the updated matching logic against the Maria Perrotta case and run a syntax check.
- [x] Reproduce the sidebar's Presto search with the exact Maria Perrotta query.
- [x] Fix the sidebar result loading/parsing if the Presto response format is not being handled.
- [x] Verify the sidebar now shows the expected Presto candidate for this case.
- [x] Switch Presto sidebar search to the official ajax search endpoint.
- [x] Add extension permission for the ajax Presto host and verify the returned payload.

# Review

- Investigation confirmed the Presto release exists and is searchable on Presto.
- Douban search currently returns no Maria Perrotta / barcode hit for this release, so the extension must avoid treating other same-title releases as matches.
- Verified `content/douban.js` with `node --check`.
- Verified the updated matcher rejects the live wrong-title hit pattern while still accepting an exact title + performer match.
- Confirmed the exact Presto search query returns the Maria Perrotta release page.
- Added card-based Presto parsing plus raw-URL fallback so the sidebar can still surface the product when the search markup shifts.
- Increased background fetch timeout from 15s to 30s to reduce empty sidebar results on slower responses.
- Replaced HTML scraping as the primary search path with `https://ajax-www.prestomusic.com/api/classical/search`, which returns the expected Maria Perrotta record directly for this query.
