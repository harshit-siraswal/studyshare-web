const DEFAULT_APK_URL = "/downloads/studyshare-android.apk";

export const ANDROID_APK_URL =
  import.meta.env.VITE_ANDROID_APK_URL?.trim() || DEFAULT_APK_URL;

export function openAndroidApkDownload() {
  window.open(ANDROID_APK_URL, "_blank", "noopener,noreferrer");
}
