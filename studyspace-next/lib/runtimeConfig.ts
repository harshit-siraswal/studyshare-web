const DEFAULT_DEV_API_BASE = "http://localhost:3001";
const DEFAULT_PROD_API_BASE = "/backend";

const LOCALHOST_API_REGEX = /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)(?::\d+)?(?:\/|$)/i;
const HTTP_URL_REGEX = /^https?:\/\//i;
const RELATIVE_PATH_REGEX = /^\/[^\s]*$/;

function trimTrailingSlash(url: string): string {
  const trimmed = url.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "/";
}

export function getApiBaseUrl(): string {
  const isProduction = process.env.NODE_ENV === "production";
  const fallback = isProduction ? DEFAULT_PROD_API_BASE : DEFAULT_DEV_API_BASE;
  const envValue = (process.env.NEXT_PUBLIC_API_URL || "").trim();

  if (!envValue) {
    return fallback;
  }

  if (RELATIVE_PATH_REGEX.test(envValue)) {
    return trimTrailingSlash(envValue);
  }

  if (!HTTP_URL_REGEX.test(envValue)) {
    if (isProduction) {
      console.warn("[runtimeConfig] Invalid NEXT_PUBLIC_API_URL in production, using default API domain.");
    }
    return fallback;
  }

  if (isProduction && LOCALHOST_API_REGEX.test(envValue)) {
    console.warn("[runtimeConfig] Ignoring localhost NEXT_PUBLIC_API_URL in production build.");
    return DEFAULT_PROD_API_BASE;
  }

  return trimTrailingSlash(envValue);
}

