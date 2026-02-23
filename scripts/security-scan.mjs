import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "dist",
  "build",
  "out",
]);
const IGNORE_EXTENSIONS = new Set([
  ".db",
  ".db-journal",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".pdf",
  ".zip",
]);

function shouldIgnoreFileName(fileName) {
  if (fileName === ".env.example") return false;
  return fileName === ".env" || fileName.startsWith(".env.");
}

const RULES = [
  {
    name: "JWT-like token",
    regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  },
  {
    name: "Hardcoded authToken literal",
    regex: /authToken\s*:\s*["'`][^"'`\r\n]{20,}["'`]/g,
  },
  {
    name: "Hardcoded TURSO_AUTH_TOKEN assignment",
    regex: /TURSO_AUTH_TOKEN\s*[:=]\s*["'`][^"'`\r\n]{20,}["'`]/g,
  },
];

const SAFE_PLACEHOLDER_PATTERNS = [
  "paste-your-turso-token-here",
  "your-token",
  "your-strong-password",
];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        files.push(...(await walk(fullPath)));
      }
      continue;
    }
    if (entry.isFile()) {
      if (shouldIgnoreFileName(entry.name)) {
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!IGNORE_EXTENSIONS.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function lineNumberAtIndex(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

async function main() {
  const files = await walk(ROOT);
  const findings = [];

  for (const filePath of files) {
    let content = "";
    try {
      content = await fs.readFile(filePath, "utf8");
    } catch {
      continue;
    }

    for (const rule of RULES) {
      const matches = [...content.matchAll(rule.regex)];
      for (const match of matches) {
        if (SAFE_PLACEHOLDER_PATTERNS.some((token) => match[0].includes(token))) {
          continue;
        }
        const index = match.index ?? 0;
        findings.push({
          rule: rule.name,
          file: path.relative(ROOT, filePath),
          line: lineNumberAtIndex(content, index),
          sample: match[0].slice(0, 60),
        });
      }
    }
  }

  if (findings.length > 0) {
    console.error("Security scan failed: potential secret leakage detected.\n");
    for (const finding of findings) {
      console.error(
        `- ${finding.rule}: ${finding.file}:${finding.line} -> ${finding.sample}...`
      );
    }
    process.exit(1);
  }

  console.log("Security scan passed. No obvious hardcoded secrets found.");
}

main().catch((error) => {
  console.error("Security scan failed unexpectedly:", error);
  process.exit(1);
});
