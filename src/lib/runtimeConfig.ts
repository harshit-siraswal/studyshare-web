const DEFAULT_DEV_API_BASE = "http://localhost:3001";
const DEFAULT_PROD_API_BASE = "https://api.studyshare.in";

const LOCALHOST_API_REGEX = /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)(?::\d+)?(?:\/|$)/i;
const HTTP_URL_REGEX = /^https?:\/\//i;

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const fallback = import.meta.env.DEV ? DEFAULT_DEV_API_BASE : DEFAULT_PROD_API_BASE;
  const envValue = (import.meta.env.VITE_API_URL || "").trim();

  if (!envValue) {
    return fallback;
  }

  if (!HTTP_URL_REGEX.test(envValue)) {
    if (import.meta.env.PROD) {
      console.warn("[runtimeConfig] Invalid VITE_API_URL in production, using default API domain.");
    }
    return fallback;
  }

  if (import.meta.env.PROD && LOCALHOST_API_REGEX.test(envValue)) {
    console.warn("[runtimeConfig] Ignoring localhost VITE_API_URL in production build.");
    return DEFAULT_PROD_API_BASE;
  }

  return trimTrailingSlash(envValue);
}

