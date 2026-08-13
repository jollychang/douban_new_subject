#!/bin/sh

set -eu

version=${1:-}
ref=${2:-HEAD}
output_dir=${RELEASE_OUTPUT_DIR:-.}

if [ -z "$version" ]; then
  echo "Usage: npm run build:release -- <version> [git-ref]" >&2
  exit 2
fi

manifest_version=$(git show "$ref:manifest.json" | node -e 'let input=""; process.stdin.on("data", (chunk) => input += chunk); process.stdin.on("end", () => process.stdout.write(JSON.parse(input).version));')
package_version=$(git show "$ref:package.json" | node -e 'let input=""; process.stdin.on("data", (chunk) => input += chunk); process.stdin.on("end", () => process.stdout.write(JSON.parse(input).version));')

if [ "$version" != "$manifest_version" ] || [ "$version" != "$package_version" ]; then
  echo "Version $version must match manifest ($manifest_version) and package ($package_version) at $ref" >&2
  exit 1
fi

if [ ! -d "$output_dir" ]; then
  echo "RELEASE_OUTPUT_DIR must be an existing directory: $output_dir" >&2
  exit 2
fi

archive="$output_dir/Douban New Subject-$version.zip"
if [ -e "$archive" ]; then
  echo "Refusing to overwrite existing release archive: $archive" >&2
  exit 1
fi

git archive --format=zip --output="$archive" "$ref" -- \
  background.js \
  content/douban.js \
  content/icons/icon-128.png \
  content/icons/icon-16.png \
  content/icons/icon-32.png \
  content/icons/icon-48.png \
  content/panel.css \
  manifest.json

node scripts/verify-release.mjs --archive "$archive" --ref "$ref"
shasum -a 256 "$archive"
