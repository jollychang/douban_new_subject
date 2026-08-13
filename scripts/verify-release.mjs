#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";

const RUNTIME_FILES = [
  "background.js",
  "content/douban.js",
  "content/icons/icon-128.png",
  "content/icons/icon-16.png",
  "content/icons/icon-32.png",
  "content/icons/icon-48.png",
  "content/panel.css",
  "manifest.json"
];

function fail(message) {
  throw new Error(message);
}

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: "utf8", ...options });
}

function parseArgs(argv) {
  const options = { archive: null, ref: "HEAD" };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--archive") {
      options.archive = argv[++index];
    } else if (argument === "--ref") {
      options.ref = argv[++index];
    } else if (argument === "--help") {
      console.log("Usage: npm run verify:release -- --archive <zip> [--ref <git-ref>]");
      process.exit(0);
    } else {
      fail(`Unknown argument: ${argument}`);
    }
  }
  if (!options.archive) {
    fail("--archive is required");
  }
  return options;
}

function readJsonFromRef(ref, file) {
  return JSON.parse(run("git", ["show", `${ref}:${file}`]));
}

function archiveFileList(archive) {
  return run("unzip", ["-Z1", archive])
    .split(/\r?\n/)
    .filter((entry) => entry && !entry.endsWith("/"))
    .sort();
}

function readArchiveFile(archive, file) {
  return Buffer.from(execFileSync("unzip", ["-p", archive, file]));
}

function sameItems(actual, expected) {
  return actual.length === expected.length && actual.every((item, index) => item === expected[index]);
}

function main() {
  const { archive, ref } = parseArgs(process.argv.slice(2));
  const archivePath = resolve(archive);
  if (!existsSync(archivePath)) {
    fail(`Archive does not exist: ${archive}`);
  }

  const manifest = readJsonFromRef(ref, "manifest.json");
  const packageJson = readJsonFromRef(ref, "package.json");
  if (manifest.version !== packageJson.version) {
    fail(`Version mismatch at ${ref}: manifest ${manifest.version}, package ${packageJson.version}`);
  }

  const expectedName = `Douban New Subject-${manifest.version}.zip`;
  if (basename(archivePath) !== expectedName) {
    fail(`Archive must be named ${expectedName}, got ${basename(archivePath)}`);
  }

  run("unzip", ["-t", archivePath], { stdio: "pipe" });
  const expectedFiles = [...RUNTIME_FILES].sort();
  const actualFiles = archiveFileList(archivePath);
  if (!sameItems(actualFiles, expectedFiles)) {
    fail(`Archive files differ from the runtime allowlist. Expected ${expectedFiles.join(", ")}; got ${actualFiles.join(", ")}`);
  }

  for (const file of RUNTIME_FILES) {
    const archiveBytes = readArchiveFile(archivePath, file);
    const refBytes = Buffer.from(execFileSync("git", ["show", `${ref}:${file}`]));
    if (!archiveBytes.equals(refBytes)) {
      fail(`Runtime bytes differ for ${file} between ${archive} and ${ref}`);
    }
  }

  const archivedManifest = JSON.parse(readArchiveFile(archivePath, "manifest.json").toString("utf8"));
  if (archivedManifest.version !== manifest.version) {
    fail(`Archive manifest version ${archivedManifest.version} does not match ${ref} (${manifest.version})`);
  }

  console.log(`Release archive verified: ${archivePath}`);
  console.log(`Git reference: ${ref}`);
  console.log(`Version: ${manifest.version}`);
  console.log(`Runtime files: ${RUNTIME_FILES.length}`);
}

try {
  main();
} catch (error) {
  console.error(`Release verification failed: ${error.message}`);
  process.exitCode = 1;
}
