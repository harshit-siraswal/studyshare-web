const DEFAULT_APK_URL = "/downloads/studyshare-android-v1.0.5-b6.apk";
const LEGACY_APK_URL = "/downloads/studyshare-android.apk";
const DEFAULT_HOSTED_APK_URL = "/downloads/studyshare-android-v1.0.5-b6.apk";
const LEGACY_HOSTED_APK_URL = "/downloads/studyshare-android.apk";
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

const configuredPrimaryApkUrl = normalizeConfiguredApkUrl(process.env.NEXT_PUBLIC_ANDROID_APK_URL);
const configuredFallbackApkUrl = normalizeConfiguredApkUrl(process.env.NEXT_PUBLIC_ANDROID_APK_FALLBACK_URL);
const hostedFallbackApkUrls = [
  normalizeConfiguredApkUrl(DEFAULT_HOSTED_APK_URL),
  normalizeConfiguredApkUrl(LEGACY_HOSTED_APK_URL),
].filter(Boolean);

const STATIC_APK_CANDIDATE_URLS = [configuredPrimaryApkUrl, configuredFallbackApkUrl].filter(Boolean);

let bundledApkValidationPromise: Promise<boolean> | null = null;
let configuredApkValidationPromise: Promise<string | null> | null = null;

async function isBundledApkUsable(): Promise<boolean> {
  const primaryProbe = await probeApkUrl(DEFAULT_APK_URL);
  if (primaryProbe === true) return true;

  const legacyProbe = await probeApkUrl(LEGACY_APK_URL);
  return legacyProbe === true;
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

export async function resolveAndroidApkDownloadUrl(): Promise<string | null> {
  if (STATIC_APK_CANDIDATE_URLS.length > 0) {
    if (!configuredApkValidationPromise) {
      configuredApkValidationPromise = resolveConfiguredApkUrl();
    }
    const configuredUrl = await configuredApkValidationPromise;
    if (configuredUrl) return configuredUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_APK_URL;
  }

  if (!bundledApkValidationPromise) {
    bundledApkValidationPromise = isBundledApkUsable();
  }

  const isValid = await bundledApkValidationPromise;
  if (isValid) {
    const primaryProbe = await probeApkUrl(DEFAULT_APK_URL);
    if (primaryProbe === true) return DEFAULT_APK_URL;

    const legacyProbe = await probeApkUrl(LEGACY_APK_URL);
    if (legacyProbe === true || legacyProbe === null) return LEGACY_APK_URL;
  }

  for (const hostedFallbackApkUrl of hostedFallbackApkUrls) {
    const hostedProbe = await probeApkUrl(hostedFallbackApkUrl);
    if (hostedProbe === true) {
      return hostedFallbackApkUrl;
    }
    if (hostedProbe === null && !isSameOriginUrl(hostedFallbackApkUrl)) {
      return hostedFallbackApkUrl;
    }
  }

  return null;
}

export async function openAndroidApkDownload(): Promise<boolean> {
  const url = await resolveAndroidApkDownloadUrl();
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

