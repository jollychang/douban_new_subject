#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname } from "node:path";

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${file}: invalid JSON (${error.message})`);
    return null;
  }
}

function gitFiles(args) {
  const output = execFileSync("git", ["ls-files", "-z", ...args], {
    encoding: "utf8"
  });
  return output.split("\0").filter(Boolean);
}

function gitGrep(pattern, files) {
  const matches = [];
  for (const file of files) {
    const stat = statSync(file);
    if (stat.size > 1024 * 1024) {
      continue;
    }
    const content = readFileSync(file);
    if (content.includes(0)) {
      continue;
    }
    const text = content.toString("utf8");
    let match;
    pattern.regex.lastIndex = 0;
    while ((match = pattern.regex.exec(text)) !== null) {
      const before = text.slice(0, match.index);
      const line = before.split("\n").length;
      matches.push(`${file}:${line}: ${pattern.name}`);
      if (!pattern.regex.global) {
        break;
      }
    }
  }
  return matches;
}

function checkRequiredIgnores() {
  const gitignore = existsSync(".gitignore") ? readFileSync(".gitignore", "utf8") : "";
  const required = [
    "*.zip",
    "*.crx",
    ".DS_Store",
    ".env",
    ".env.*",
    "!.env.example",
    "node_modules/",
    "coverage/",
    "dist/",
    "build/"
  ];
  for (const pattern of required) {
    const found = gitignore
      .split(/\r?\n/)
      .map((line) => line.trim())
      .includes(pattern);
    if (!found) {
      fail(`.gitignore must include ${pattern}`);
    }
  }
}

function checkTrackedFiles(files) {
  const forbiddenExact = new Set([".DS_Store"]);
  const forbiddenExt = new Set([".zip", ".crx", ".pem", ".key", ".p12", ".pfx", ".db", ".sqlite"]);
  const maxTrackedFileSize = 1024 * 1024;

  for (const file of files) {
    const base = file.split("/").pop();
    const ext = extname(file).toLowerCase();
    const stat = statSync(file);

    if (forbiddenExact.has(base)) {
      fail(`${file}: OS/generated file should not be committed`);
    }
    if (forbiddenExt.has(ext)) {
      fail(`${file}: ${ext} file should not be committed`);
    }
    if (/^\.env(?:\.|$)|\/\.env(?:\.|$)/.test(file) && file !== ".env.example") {
      fail(`${file}: environment files must not be committed`);
    }
    if (file.includes("node_modules/")) {
      fail(`${file}: node_modules must not be committed`);
    }
    if (stat.size > maxTrackedFileSize) {
      fail(`${file}: file is larger than ${maxTrackedFileSize} bytes`);
    }
  }
}

function checkSecrets(files) {
  const patterns = [
    { name: "private key block", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
    { name: "GitHub token", regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b/g },
    { name: "GitHub fine-grained token", regex: /\bgithub_pat_[A-Za-z0-9_]{20,}_[A-Za-z0-9_]{20,}\b/g },
    { name: "OpenAI API key", regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
    { name: "AWS access key", regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
    { name: "Google API key", regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
    { name: "Slack token", regex: /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/g },
    { name: "Stripe secret key", regex: /\b(?:sk|rk)_(?:live|test)_[0-9A-Za-z]{24,}\b/g }
  ];

  for (const pattern of patterns) {
    const matches = gitGrep(pattern, files);
    matches.forEach((match) => fail(match));
  }
}

function checkManifest(files, trackedFiles) {
  const manifest = readJson("manifest.json");
  if (!manifest) {
    return;
  }

  if (manifest.manifest_version !== 3) {
    fail("manifest.json: manifest_version must be 3");
  }
  if (!/^\d+\.\d+\.\d+$/.test(String(manifest.version || ""))) {
    fail("manifest.json: version must use x.y.z format");
  }

  const packageJson = readJson("package.json");
  if (packageJson && packageJson.version !== manifest.version) {
    fail(`package.json version ${packageJson.version} must match manifest version ${manifest.version}`);
  }

  const allowedPermissions = new Set(["storage", "downloads"]);
  for (const permission of manifest.permissions || []) {
    if (!allowedPermissions.has(permission)) {
      fail(`manifest.json: unexpected Chrome permission ${permission}`);
    }
  }

  const unsafeHostPermissions = ["<all_urls>", "*://*/*", "http://*/*", "https://*/*"];
  for (const host of manifest.host_permissions || []) {
    if (unsafeHostPermissions.includes(host)) {
      fail(`manifest.json: overly broad host permission ${host}`);
    }
  }

  const requiredFiles = new Set();
  if (manifest.background?.service_worker) {
    requiredFiles.add(manifest.background.service_worker);
  }
  for (const icon of Object.values(manifest.icons || {})) {
    requiredFiles.add(icon);
  }
  for (const script of manifest.content_scripts || []) {
    for (const js of script.js || []) {
      requiredFiles.add(js);
    }
    for (const css of script.css || []) {
      requiredFiles.add(css);
    }
  }

  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      fail(`manifest.json: referenced file does not exist: ${file}`);
    }
    if (!trackedFiles.has(file)) {
      fail(`manifest.json: referenced file is not tracked by git: ${file}`);
    }
  }

  const csp = JSON.stringify(manifest.content_security_policy || {});
  if (/unsafe-eval|unsafe-inline/.test(csp)) {
    fail("manifest.json: content_security_policy must not allow unsafe-eval or unsafe-inline");
  }
}

function checkJavaScriptSyntax(files) {
  const jsFiles = files.filter((file) => [".js", ".mjs", ".cjs"].includes(extname(file)));
  for (const file of jsFiles) {
    try {
      execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    } catch (error) {
      fail(`${file}: JavaScript syntax check failed\n${String(error.stderr || error.message).trim()}`);
    }
  }
}

function checkDangerousJavaScript(files) {
  const jsFiles = files.filter((file) => [".js", ".mjs", ".cjs"].includes(extname(file)));
  const checks = [
    { name: "eval", regex: /\beval\s*\(/g },
    { name: "new Function", regex: /\bnew\s+Function\s*\(/g },
    { name: "document.write", regex: /\bdocument\.write\s*\(/g },
    { name: "string setTimeout", regex: /\bsetTimeout\s*\(\s*["'`]/g },
    { name: "string setInterval", regex: /\bsetInterval\s*\(\s*["'`]/g }
  ];

  for (const file of jsFiles) {
    const text = readFileSync(file, "utf8");
    for (const check of checks) {
      if (check.regex.test(text)) {
        fail(`${file}: forbidden JavaScript API detected (${check.name})`);
      }
      check.regex.lastIndex = 0;
    }
    if (/credentials\s*:\s*["']include["']/.test(text)) {
      warn(`${file}: fetch uses credentials: include; confirm this is intentional`);
    }
  }
}

function main() {
  const files = gitFiles(["--cached", "--others", "--exclude-standard"]);
  const trackedFiles = new Set(gitFiles(["--cached"]));
  checkRequiredIgnores();
  checkTrackedFiles(files);
  checkSecrets(files);
  checkManifest(files, trackedFiles);
  checkJavaScriptSyntax(files);
  checkDangerousJavaScript(files);

  for (const warning of warnings) {
    console.warn(`WARN: ${warning}`);
  }

  if (failures.length) {
    console.error("Quality gate failed:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(`Quality gate passed (${files.length} tracked or unignored files checked).`);
}

main();
