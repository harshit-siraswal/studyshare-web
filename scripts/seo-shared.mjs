import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_SITE_URL = "https://studyshare.in";

function normalizeSiteUrl(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return DEFAULT_SITE_URL;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withProtocol);
    const hostname = url.hostname.toLowerCase();

    // Ignore the retired domain even if a stale build env still injects it.
    if (hostname.includes("mystudyspace.me")) {
      return DEFAULT_SITE_URL;
    }

    return `${url.protocol}//${url.host}`.replace(/\/+$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getSiteUrl() {
  return normalizeSiteUrl(process.env.VITE_SITE_URL);
}

export function ensureDir(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
}

export function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function toAbsoluteUrl(pathOrUrl, siteUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const normalized = String(pathOrUrl || "/").startsWith("/")
    ? String(pathOrUrl)
    : `/${String(pathOrUrl)}`;
  return `${siteUrl}${normalized}`;
}

export function loadBlogPosts() {
  const sourceFile = path.join(projectRoot, "src", "content", "blogPosts.ts");
  const source = fs.readFileSync(sourceFile, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourceFile,
  }).outputText;

  const moduleShim = { exports: {} };
  const sandbox = {
    module: moduleShim,
    exports: moduleShim.exports,
    require: createRequire(sourceFile),
    __dirname: path.dirname(sourceFile),
    __filename: sourceFile,
    console,
    process,
  };
  vm.runInNewContext(output, sandbox, { filename: sourceFile });
  const posts = moduleShim.exports.blogPosts;

  if (!Array.isArray(posts)) {
    throw new Error("Unable to load blogPosts from src/content/blogPosts.ts");
  }

  return posts;
}
