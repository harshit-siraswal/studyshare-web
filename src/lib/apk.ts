const DEFAULT_APK_URL = "/downloads/studyshare-android.apk";
const DEFAULT_ANDROID_APP_VERSION = "1.0.1 (Build 2)";
const MIN_EXPECTED_APK_BYTES = 5 * 1024 * 1024;
const LIKELY_TEXT_MIME_RE = /^text\/|application\/json/i;
const PLACEHOLDER_HOST_MARKERS = ["your-domain.com", "example.com"];

function normalizeConfiguredApkUrl(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  const lowered = raw.toLowerCase();
  if (PLACEHOLDER_HOST_MARKERS.some((marker) => lowered.includes(marker))) {
    return "";
  }

  if (raw.startsWith("/")) {
    return /\.apk(?:$|\?)/i.test(raw) ? raw : "";
  }

  try {
    const parsed = new URL(raw);
    if (!/\.apk$/i.test(parsed.pathname)) return "";
    return raw;
  } catch {
    return "";
  }
}

function isSameOriginUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

function isLikelyApkResponse(response: Response): boolean {
  const contentLength = Number(response.headers.get("content-length") || "0");
  const contentType = (response.headers.get("content-type") || "").toLowerCase();

  if (Number.isFinite(contentLength) && contentLength > 0 && contentLength < MIN_EXPECTED_APK_BYTES) {
    return false;
  }
  if (LIKELY_TEXT_MIME_RE.test(contentType)) {
    return false;
  }
  return true;
}

async function probeApkUrl(url: string): Promise<boolean | null> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
    });
    if (!response.ok) {
      if (response.status === 405 || response.status === 501) return null;
      return false;
    }
    return isLikelyApkResponse(response);
  } catch {
    return null;
  }
}

const configuredPrimaryApkUrl = normalizeConfiguredApkUrl(import.meta.env.VITE_ANDROID_APK_URL);
const configuredFallbackApkUrl = normalizeConfiguredApkUrl(import.meta.env.VITE_ANDROID_APK_FALLBACK_URL);

const STATIC_APK_CANDIDATE_URLS = [configuredPrimaryApkUrl, configuredFallbackApkUrl].filter(Boolean);

let bundledApkValidationPromise: Promise<boolean> | null = null;
let configuredApkValidationPromise: Promise<string | null> | null = null;

async function isBundledApkUsable(): Promise<boolean> {
  const probe = await probeApkUrl(DEFAULT_APK_URL);
  return probe === true;
}

async function resolveConfiguredApkUrl(): Promise<string | null> {
  for (const candidate of STATIC_APK_CANDIDATE_URLS) {
    const probe = await probeApkUrl(candidate);
    if (probe === true) return candidate;
    if (probe === false) continue;
    if (!isSameOriginUrl(candidate)) return candidate;
  }
  return null;
}

export const ANDROID_APK_URL = configuredPrimaryApkUrl || DEFAULT_APK_URL;
export const ANDROID_APP_VERSION =
  (typeof import.meta.env.VITE_ANDROID_APP_VERSION === "string" &&
  import.meta.env.VITE_ANDROID_APP_VERSION.trim()) ||
  DEFAULT_ANDROID_APP_VERSION;

export async function resolveAndroidApkDownloadUrl(): Promise<string | null> {
  if (STATIC_APK_CANDIDATE_URLS.length > 0) {
    if (!configuredApkValidationPromise) {
      configuredApkValidationPromise = resolveConfiguredApkUrl();
    }
    const configuredUrl = await configuredApkValidationPromise;
    if (configuredUrl) return configuredUrl;
  }

  if (import.meta.env.DEV) {
    return DEFAULT_APK_URL;
  }

  if (!bundledApkValidationPromise) {
    bundledApkValidationPromise = isBundledApkUsable();
  }

  const isValid = await bundledApkValidationPromise;
  return isValid ? DEFAULT_APK_URL : null;
}

export async function openAndroidApkDownload(): Promise<boolean> {
  const url = await resolveAndroidApkDownloadUrl();
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
