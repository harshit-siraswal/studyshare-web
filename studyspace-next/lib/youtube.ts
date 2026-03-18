type YouTubeOptions = {
  autoplay?: boolean;
  muted?: boolean;
  rel?: boolean;
  modestBranding?: boolean;
  playsInline?: boolean;
  startSeconds?: number;
  enableJsApi?: boolean;
};

const DIRECT_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function parseTimeToSeconds(input: string | null): number | null {
  if (!input) return null;
  if (/^\d+$/.test(input)) return Number(input);
  const match = input.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (!match) return null;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return Number.isFinite(total) && total > 0 ? total : null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function getRuntimeOrigin(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.location.origin;
  } catch {
    return null;
  }
}

export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  if (DIRECT_ID_REGEX.test(input)) return input;

  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/")[1];
      return DIRECT_ID_REGEX.test(id) ? id : null;
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id && DIRECT_ID_REGEX.test(id) ? id : null;
      }

      const pathParts = url.pathname.split("/").filter(Boolean);
      const prefix = pathParts[0];
      if (["embed", "shorts", "live", "v"].includes(prefix) && pathParts[1]) {
        const id = pathParts[1];
        return DIRECT_ID_REGEX.test(id) ? id : null;
      }
    }
  } catch {
    const match = input.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  }

  return null;
}

export function getYouTubeEmbedUrl(input: string, options: YouTubeOptions = {}): string | null {
  const id = extractYouTubeId(input);
  if (!id) return null;

  const params = new URLSearchParams();
  params.set("autoplay", options.autoplay ? "1" : "0");
  params.set("mute", options.muted ? "1" : "0");
  params.set("playsinline", options.playsInline === false ? "0" : "1");
  params.set("rel", options.rel ? "1" : "0");
  params.set("modestbranding", options.modestBranding === false ? "0" : "1");
  params.set("enablejsapi", options.enableJsApi === false ? "0" : "1");

  const origin = getRuntimeOrigin();
  if (origin) {
    params.set("origin", origin);
  }

  try {
    const url = new URL(input);
    const start =
      typeof options.startSeconds === "number" && options.startSeconds >= 0
        ? Math.floor(options.startSeconds)
        : parseTimeToSeconds(url.searchParams.get("start") || url.searchParams.get("t"));
    if (start) {
      params.set("start", String(start));
    }
  } catch {
    // Ignore parsing errors for time
  }

  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function getYouTubeWatchUrl(input: string, options?: { startSeconds?: number }): string | null {
  const id = extractYouTubeId(input);
  if (!id) return null;

  const url = new URL(`https://www.youtube.com/watch?v=${id}`);
  const start =
    typeof options?.startSeconds === "number" && options.startSeconds >= 0
      ? Math.floor(options.startSeconds)
      : null;
  if (start) {
    url.searchParams.set("t", String(start));
  }
  return url.toString();
}

export function getYouTubeBrowserUrl(input: string, options?: { startSeconds?: number }): string | null {
  const id = extractYouTubeId(input);
  if (!id) return null;

  const url = new URL(`https://www.youtube.com/embed/${id}`);
  const start =
    typeof options?.startSeconds === "number" && options.startSeconds >= 0
      ? Math.floor(options.startSeconds)
      : null;
  if (start) {
    url.searchParams.set("start", String(start));
  }
  url.searchParams.set("autoplay", "1");
  return url.toString();
}

export function getYouTubeAppUrl(input: string, options?: { startSeconds?: number }): string | null {
  const id = extractYouTubeId(input);
  if (!id) return null;

  const start =
    typeof options?.startSeconds === "number" && options.startSeconds >= 0
      ? Math.floor(options.startSeconds)
      : null;
  const watchPath = `www.youtube.com/watch?v=${id}${start ? `&t=${start}` : ""}`;

  if (isBrowser()) {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android")) {
      return `intent://${watchPath}#Intent;package=com.google.android.youtube;scheme=https;end`;
    }
  }

  return `youtube://${watchPath}`;
}

export function openYouTubeInApp(input: string, options?: { startSeconds?: number; fallbackToWatch?: boolean }) {
  if (!isBrowser()) return;

  const appUrl = getYouTubeAppUrl(input, options);
  if (!appUrl) return;

  const watchUrl = options?.fallbackToWatch === false ? null : getYouTubeWatchUrl(input, options);
  const fallbackDelayMs = 1200;
  let fallbackTimer: number | null = null;

  const clearFallback = () => {
    if (fallbackTimer !== null) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      clearFallback();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange, { once: true });

  if (watchUrl) {
    fallbackTimer = window.setTimeout(() => {
      window.open(watchUrl, "_blank", "noopener,noreferrer");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, fallbackDelayMs);
  }

  window.location.href = appUrl;
}
