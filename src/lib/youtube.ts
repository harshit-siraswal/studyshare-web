type YouTubeOptions = {
  autoplay?: boolean;
  muted?: boolean;
  rel?: boolean;
  modestBranding?: boolean;
  playsInline?: boolean;
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

  try {
    const url = new URL(input);
    const start = parseTimeToSeconds(url.searchParams.get("start") || url.searchParams.get("t"));
    if (start) {
      params.set("start", String(start));
    }
  } catch {
    // Ignore parsing errors for time
  }

  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
