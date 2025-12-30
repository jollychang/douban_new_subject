#!/usr/bin/env osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title DMDoubanMusicItunesAppleMusic
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🤖

# Documentation:
# @raycast.author jollychang
# @raycast.authorURL https://raycast.com/jollychang

set pythonPath to "/opt/homebrew/bin/python3"

using terms from application id "com.apple.Music"
tell application id "com.apple.Music"
	set currentTrack to current track
	set albuminfo to album of currentTrack
	set albumartist to album artist of currentTrack
	if albumartist is missing value or albumartist is "" then
		set albumartist to artist of currentTrack
	end if
	set sortAlbum to ""
	set sortAlbumArtist to ""
	set sortArtist to ""
	set storeUrl to ""
	try
		set sortAlbum to sort album of currentTrack
	end try
	try
		set sortAlbumArtist to sort album artist of currentTrack
	end try
	try
		set sortArtist to sort artist of currentTrack
	end try
	if sortAlbumArtist is "" then
		set sortAlbumArtist to sortArtist
	end if
	try
		set storeUrl to store URL of currentTrack
	end try
end tell
end using terms from

if storeUrl is missing value then
	set storeUrl to ""
end if
if sortAlbum is missing value then
	set sortAlbum to ""
end if
if sortAlbumArtist is missing value then
	set sortAlbumArtist to ""
end if
if sortArtist is missing value then
	set sortArtist to ""
end if

set finalAlbum to albuminfo
if sortAlbum is not "" then
	set finalAlbum to sortAlbum
end if

set finalArtist to albumartist
if sortAlbumArtist is not "" then
	set finalArtist to sortAlbumArtist
end if

set needsLookup to false
if finalAlbum is "" or finalArtist is "" then
	set needsLookup to true
end if
if my containsCJK(finalAlbum) or my containsCJK(finalArtist) then
	set needsLookup to true
end if
if my containsCJK(albuminfo) or my containsCJK(albumartist) then
	set needsLookup to true
end if

if needsLookup then
	set lookupScript to ""
	set lookupScript to lookupScript & "import json, sys, urllib.parse, urllib.request" & linefeed
	set lookupScript to lookupScript & "store_url = sys.argv[1] if len(sys.argv) > 1 else ''" & linefeed
	set lookupScript to lookupScript & "albuminfo = sys.argv[2] if len(sys.argv) > 2 else ''" & linefeed
	set lookupScript to lookupScript & "albumartist = sys.argv[3] if len(sys.argv) > 3 else ''" & linefeed
	set lookupScript to lookupScript & "sort_album = sys.argv[4] if len(sys.argv) > 4 else ''" & linefeed
	set lookupScript to lookupScript & "sort_album_artist = sys.argv[5] if len(sys.argv) > 5 else ''" & linefeed
	set lookupScript to lookupScript & "sort_artist = sys.argv[6] if len(sys.argv) > 6 else ''" & linefeed
	set lookupScript to lookupScript & "final_album = sort_album or albuminfo" & linefeed
	set lookupScript to lookupScript & "final_artist = sort_album_artist or sort_artist or albumartist" & linefeed
	set lookupScript to lookupScript & "def contains_cjk(text):" & linefeed
	set lookupScript to lookupScript & "    for ch in text:" & linefeed
	set lookupScript to lookupScript & "        code = ord(ch)" & linefeed
	set lookupScript to lookupScript & "        if 0x4E00 <= code <= 0x9FFF:" & linefeed
	set lookupScript to lookupScript & "            return True" & linefeed
	set lookupScript to lookupScript & "    return False" & linefeed
	set lookupScript to lookupScript & "original_has_cjk = False" & linefeed
	set lookupScript to lookupScript & "if contains_cjk((albuminfo + ' ' + albumartist).strip()):" & linefeed
	set lookupScript to lookupScript & "    original_has_cjk = True" & linefeed
	set lookupScript to lookupScript & "def itunes_lookup(lookup_id):" & linefeed
	set lookupScript to lookupScript & "    try:" & linefeed
	set lookupScript to lookupScript & "        lookup_url = 'https://itunes.apple.com/lookup?id={}&country=us'.format(lookup_id)" & linefeed
	set lookupScript to lookupScript & "        with urllib.request.urlopen(lookup_url, timeout=8) as resp:" & linefeed
	set lookupScript to lookupScript & "            data = json.load(resp)" & linefeed
	set lookupScript to lookupScript & "        results = data.get('results') or []" & linefeed
	set lookupScript to lookupScript & "        if results:" & linefeed
	set lookupScript to lookupScript & "            return results[0]" & linefeed
	set lookupScript to lookupScript & "    except Exception:" & linefeed
	set lookupScript to lookupScript & "        return None" & linefeed
	set lookupScript to lookupScript & "    return None" & linefeed
	set lookupScript to lookupScript & "def itunes_search(term):" & linefeed
	set lookupScript to lookupScript & "    try:" & linefeed
	set lookupScript to lookupScript & "        qs = urllib.parse.urlencode({'term': term, 'entity': 'album', 'limit': 1, 'country': 'us', 'lang': 'en_us'})" & linefeed
	set lookupScript to lookupScript & "        search_url = 'https://itunes.apple.com/search?' + qs" & linefeed
	set lookupScript to lookupScript & "        with urllib.request.urlopen(search_url, timeout=8) as resp:" & linefeed
	set lookupScript to lookupScript & "            data = json.load(resp)" & linefeed
	set lookupScript to lookupScript & "        results = data.get('results') or []" & linefeed
	set lookupScript to lookupScript & "        if results:" & linefeed
	set lookupScript to lookupScript & "            return results[0]" & linefeed
	set lookupScript to lookupScript & "    except Exception:" & linefeed
	set lookupScript to lookupScript & "        return None" & linefeed
	set lookupScript to lookupScript & "    return None" & linefeed
	set lookupScript to lookupScript & "needs_lookup = False" & linefeed
	set lookupScript to lookupScript & "if not final_album or not final_artist:" & linefeed
	set lookupScript to lookupScript & "    needs_lookup = True" & linefeed
	set lookupScript to lookupScript & "if contains_cjk(final_album + ' ' + final_artist):" & linefeed
	set lookupScript to lookupScript & "    needs_lookup = True" & linefeed
	set lookupScript to lookupScript & "if original_has_cjk:" & linefeed
	set lookupScript to lookupScript & "    needs_lookup = True" & linefeed
	set lookupScript to lookupScript & "item = None" & linefeed
	set lookupScript to lookupScript & "if needs_lookup:" & linefeed
	set lookupScript to lookupScript & "    if store_url:" & linefeed
	set lookupScript to lookupScript & "        try:" & linefeed
	set lookupScript to lookupScript & "            parsed = urllib.parse.urlparse(store_url)" & linefeed
	set lookupScript to lookupScript & "            qs = urllib.parse.parse_qs(parsed.query)" & linefeed
	set lookupScript to lookupScript & "            track_id = qs.get('i', [None])[0]" & linefeed
	set lookupScript to lookupScript & "            lookup_id = track_id or (parsed.path.rstrip('/').split('/')[-1] if parsed.path else '')" & linefeed
	set lookupScript to lookupScript & "            if lookup_id.isdigit():" & linefeed
	set lookupScript to lookupScript & "                item = itunes_lookup(lookup_id)" & linefeed
	set lookupScript to lookupScript & "        except Exception:" & linefeed
	set lookupScript to lookupScript & "            item = None" & linefeed
	set lookupScript to lookupScript & "    if not item:" & linefeed
	set lookupScript to lookupScript & "        search_terms = []" & linefeed
	set lookupScript to lookupScript & "        base_album = (sort_album or albuminfo).strip()" & linefeed
	set lookupScript to lookupScript & "        base_artist = (sort_album_artist or sort_artist or albumartist).strip()" & linefeed
	set lookupScript to lookupScript & "        combined = (base_album + ' ' + base_artist).strip()" & linefeed
	set lookupScript to lookupScript & "        combined_orig = (albuminfo.strip() + ' ' + albumartist.strip()).strip()" & linefeed
	set lookupScript to lookupScript & "        if combined:" & linefeed
	set lookupScript to lookupScript & "            search_terms.append(combined)" & linefeed
	set lookupScript to lookupScript & "        if combined_orig and combined_orig != combined:" & linefeed
	set lookupScript to lookupScript & "            search_terms.append(combined_orig)" & linefeed
	set lookupScript to lookupScript & "        if base_album and contains_cjk(base_artist):" & linefeed
	set lookupScript to lookupScript & "            search_terms.append(base_album)" & linefeed
	set lookupScript to lookupScript & "        if albuminfo and albuminfo != base_album:" & linefeed
	set lookupScript to lookupScript & "            search_terms.append(albuminfo)" & linefeed
	set lookupScript to lookupScript & "        seen = set()" & linefeed
	set lookupScript to lookupScript & "        for term in search_terms:" & linefeed
	set lookupScript to lookupScript & "            if not term or term in seen:" & linefeed
	set lookupScript to lookupScript & "                continue" & linefeed
	set lookupScript to lookupScript & "            seen.add(term)" & linefeed
	set lookupScript to lookupScript & "            item = itunes_search(term)" & linefeed
	set lookupScript to lookupScript & "            if item:" & linefeed
	set lookupScript to lookupScript & "                break" & linefeed
	set lookupScript to lookupScript & "if item:" & linefeed
	set lookupScript to lookupScript & "    final_album = item.get('collectionName') or final_album" & linefeed
	set lookupScript to lookupScript & "    artist_from_item = item.get('collectionArtistName') or item.get('artistName')" & linefeed
	set lookupScript to lookupScript & "    final_artist = artist_from_item or final_artist" & linefeed
	set lookupScript to lookupScript & "elif original_has_cjk:" & linefeed
	set lookupScript to lookupScript & "    final_album = albuminfo or final_album" & linefeed
	set lookupScript to lookupScript & "    final_artist = albumartist or final_artist" & linefeed
	set lookupScript to lookupScript & "print(final_album + '\\t' + final_artist)" & linefeed
	try
		set lookupResult to do shell script pythonPath & " -c " & quoted form of lookupScript & " " & quoted form of storeUrl & " " & quoted form of albuminfo & " " & quoted form of albumartist & " " & quoted form of sortAlbum & " " & quoted form of sortAlbumArtist & " " & quoted form of sortArtist
		if lookupResult is not "" then
			set AppleScript's text item delimiters to tab
			set lookupItems to text items of lookupResult
			set AppleScript's text item delimiters to ""
			if (count of lookupItems) >= 1 then
				set lookupAlbum to item 1 of lookupItems
				if lookupAlbum is not "" then
					set finalAlbum to lookupAlbum
				end if
			end if
			if (count of lookupItems) >= 2 then
				set lookupArtist to item 2 of lookupItems
				if lookupArtist is not "" then
					set finalArtist to lookupArtist
				end if
			end if
		end if
	end try
end if

set ArtistAndAlbum to finalAlbum & " " & finalArtist
set ArtistAndAlbumencode to do shell script pythonPath & " -c " & quoted form of "import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))" & " " & quoted form of ArtistAndAlbum

tell application "Google Chrome"
	get ArtistAndAlbumencode
	set DoubanMusicURL to "https://music.douban.com/subject_search?search_text=" & ArtistAndAlbumencode
	open location DoubanMusicURL
end tell

on containsCJK(theText)
	if theText is missing value then
		return false
	end if
	set textValue to theText as text
	repeat with i from 1 to length of textValue
		set codePoint to id of character i of textValue
		if codePoint >= 19968 and codePoint <= 40959 then
			return true
		end if
	end repeat
	return false
end containsCJK
