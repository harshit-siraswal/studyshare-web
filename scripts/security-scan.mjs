import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const includeRoots = [
  "src",
  "index.html",
  "vercel.json",
  "cloudflare-workers/src",
  "functions/lib",
];

const ignoreDirs = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
]);

const secretRules = [
  { name: "Firebase API key", regex: /AIza[0-9A-Za-z_-]{20,}/g },
  { name: "Supabase JWT-like key", regex: /eyJhbGciOiJIUzI1Ni[A-Za-z0-9._-]*/g },
  { name: "Agora primary certificate", regex: /primaryCertificate\s*[:=]\s*['"][^'"]{16,}['"]/gi },
  { name: "reCAPTCHA secret key", regex: /RECAPTCHA_SECRET_KEY\s*[:=]\s*['"`]?[A-Za-z0-9_-]{20,}/gi },
  { name: "Supabase service role key", regex: /SUPABASE_SERVICE(_ROLE)?_KEY\s*[:=]\s*['"`]?[A-Za-z0-9._-]{20,}/gi },
];

const textExtensions = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".html",
  ".css",
  ".md",
  ".sql",
  ".yml",
  ".yaml",
]);

function shouldScanFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return textExtensions.has(ext) || path.basename(filePath) === "index.html";
}

function walk(targetPath, out) {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    if (shouldScanFile(targetPath)) out.push(targetPath);
    return;
  }

  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue;
    walk(path.join(targetPath, entry.name), out);
  }
}

function toRelative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

const files = [];
for (const includeRoot of includeRoots) {
  const abs = path.join(root, includeRoot);
  if (!fs.existsSync(abs)) continue;
  walk(abs, files);
}

const findings = [];
for (const filePath of files) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const rule of secretRules) {
    for (let i = 0; i < lines.length; i += 1) {
      if (rule.regex.test(lines[i])) {
        findings.push({
          file: toRelative(filePath),
          line: i + 1,
          rule: rule.name,
        });
      }
      rule.regex.lastIndex = 0;
    }
  }
}

if (findings.length > 0) {
  console.error("Potential secret exposures detected:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} (${finding.rule})`);
  }
  process.exit(1);
}

console.log("Security scan passed: no high-confidence secret patterns found.");
