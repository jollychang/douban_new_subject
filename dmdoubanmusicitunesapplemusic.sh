#!/bin/sh

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title dmdoubanmusicitunesapplemusic
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🤖

# Documentation:
# @raycast.author jollychang
# @raycast.authorURL https://raycast.com/jollychang

if [ -z "${BASH_VERSION:-}" ]; then
  exec /bin/bash "$0" "$@"
fi

set -euo pipefail

if [ -x "/opt/homebrew/bin/python3" ]; then
  PYTHON="/opt/homebrew/bin/python3"
else
  PYTHON="python3"
fi

track_json=$(osascript -l JavaScript <<JXA
var Music = Application("Music");
var app = Application.currentApplication();
app.includeStandardAdditions = true;

function safeString(value) {
  try {
    if (value === undefined || value === null) {
      return "";
    }
    if (value === app.missingValue) {
      return "";
    }
    return String(value);
  } catch (e) {
    return "";
  }
}

function safeProp(obj, propName) {
  try {
    return safeString(obj[propName]());
  } catch (e) {
    try {
      return safeString(obj[propName]);
    } catch (err) {
      return "";
    }
  }
}

var t = null;
try {
  t = Music.currentTrack();
} catch (e) {
  t = null;
}

var parts;
if (!t) {
  parts = ["", "", "", "", "", ""];
} else {
  var album = safeProp(t, "album");
  var artist = safeProp(t, "albumArtist") || safeProp(t, "artist");
  parts = [
    album,
    artist,
    safeProp(t, "sortAlbum"),
    safeProp(t, "sortAlbumArtist"),
    safeProp(t, "sortArtist"),
    safeProp(t, "storeURL")
  ];
}

JSON.stringify(parts);
JXA
)

encoded=$(TRACK_JSON="$track_json" "$PYTHON" - <<PY
import json
import os
import re
import urllib.parse
import urllib.request

raw = os.environ.get("TRACK_JSON", "").strip()
parts = []

if raw:
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            parts = parsed
    except Exception:
        start = raw.find("[")
        end = raw.rfind("]")
        if start != -1 and end != -1 and end > start:
            try:
                parsed = json.loads(raw[start : end + 1])
                if isinstance(parsed, list):
                    parts = parsed
            except Exception:
                parts = []
        if not parts:
            parts = raw.split("\t")

if not parts and raw:
    parts = [raw]

while len(parts) < 6:
    parts.append("")

albuminfo, albumartist, sortAlbum, sortAlbumArtist, sortArtist, storeUrl = [
    str(part or "") for part in parts[:6]
]

finalAlbum = sortAlbum or albuminfo
finalArtist = sortAlbumArtist or sortArtist or albumartist

original_has_cjk = False
if re.search(r"[\\u4e00-\\u9fff]", (albuminfo + " " + albumartist).strip()):
    original_has_cjk = True

needs_lookup = False
if not finalAlbum or not finalArtist:
    needs_lookup = True
if re.search(r"[\\u4e00-\\u9fff]", finalAlbum + " " + finalArtist):
    needs_lookup = True
if original_has_cjk:
    needs_lookup = True

def itunes_lookup(lookup_id):
    try:
        lookup_url = "https://itunes.apple.com/lookup?id={}&country=us".format(lookup_id)
        with urllib.request.urlopen(lookup_url, timeout=8) as resp:
            data = json.load(resp)
        results = data.get("results") or []
        if results:
            return results[0]
    except Exception:
        return None
    return None

def itunes_search(term):
    try:
        qs = urllib.parse.urlencode(
            {
                "term": term,
                "entity": "album",
                "limit": 1,
                "country": "us",
                "lang": "en_us",
            }
        )
        search_url = "https://itunes.apple.com/search?" + qs
        with urllib.request.urlopen(search_url, timeout=8) as resp:
            data = json.load(resp)
        results = data.get("results") or []
        if results:
            return results[0]
    except Exception:
        return None
    return None

item = None
if needs_lookup:
    if storeUrl:
        try:
            parsed = urllib.parse.urlparse(storeUrl)
            qs = urllib.parse.parse_qs(parsed.query)
            track_id = qs.get("i", [None])[0]
            lookup_id = track_id or (parsed.path.rstrip("/").split("/")[-1] if parsed.path else "")
            if lookup_id.isdigit():
                item = itunes_lookup(lookup_id)
        except Exception:
            item = None

    if not item:
        search_terms = []
        base_album = (sortAlbum or albuminfo).strip()
        base_artist = (sortAlbumArtist or sortArtist or albumartist).strip()
        combined = (base_album + " " + base_artist).strip()
        combined_orig = (albuminfo.strip() + " " + albumartist.strip()).strip()
        if combined:
            search_terms.append(combined)
        if combined_orig and combined_orig != combined:
            search_terms.append(combined_orig)
        if base_album and re.search(r"[\\u4e00-\\u9fff]", base_artist):
            search_terms.append(base_album)
        if albuminfo and albuminfo != base_album:
            search_terms.append(albuminfo)
        seen = set()
        for term in search_terms:
            if not term or term in seen:
                continue
            seen.add(term)
            item = itunes_search(term)
            if item:
                break

    if item:
        finalAlbum = item.get("collectionName") or finalAlbum
        artist_from_item = item.get("collectionArtistName") or item.get("artistName")
        finalArtist = artist_from_item or finalArtist
    elif original_has_cjk:
        finalAlbum = albuminfo or finalAlbum
        finalArtist = albumartist or finalArtist

query = (finalAlbum + " " + finalArtist).strip()
print(urllib.parse.quote(query))
PY
)

if [ -z "${encoded:-}" ]; then
  echo "Error: empty query"
  exit 1
fi

open -a "Google Chrome" "https://music.douban.com/subject_search?search_text=${encoded}"
