const DEFAULT_APK_URL = "/downloads/studyshare-android.apk";
const DEFAULT_HOSTED_APK_URL = "https://file.mystudyspace.me/downloads/studyshare-android.apk";
const DEFAULT_ANDROID_APP_VERSION = "1.0.3 (Build 4)";
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

const configuredPrimaryApkUrl = normalizeConfiguredApkUrl(import.meta.env.VITE_ANDROID_APK_URL);
const configuredFallbackApkUrl = normalizeConfiguredApkUrl(import.meta.env.VITE_ANDROID_APK_FALLBACK_URL);
const hostedFallbackApkUrl = normalizeConfiguredApkUrl(DEFAULT_HOSTED_APK_URL);

export const ANDROID_APK_URL =
  configuredPrimaryApkUrl || configuredFallbackApkUrl || hostedFallbackApkUrl || DEFAULT_APK_URL;
export const ANDROID_APP_VERSION =
  (typeof import.meta.env.VITE_ANDROID_APP_VERSION === "string" &&
  import.meta.env.VITE_ANDROID_APP_VERSION.trim()) ||
  DEFAULT_ANDROID_APP_VERSION;

export async function resolveAndroidApkDownloadUrl(): Promise<string | null> {
  return ANDROID_APK_URL || null;
}

export async function openAndroidApkDownload(): Promise<boolean> {
  const url = await resolveAndroidApkDownloadUrl();
  if (!url) return false;
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) {
    window.location.assign(url);
  }
  return true;
}
