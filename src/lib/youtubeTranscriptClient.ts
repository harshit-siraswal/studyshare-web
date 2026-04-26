import { extractYouTubeId } from "@/lib/youtube";

export interface ClientYouTubeTranscriptResult {
  videoId: string;
  language: string | null;
  text: string;
}

type CaptionTrack = {
  languageCode: string;
  kind?: string;
};

const DEFAULT_LANGUAGE_CANDIDATES = ["en", "en-us", "en-gb", "en-in", "hi", "hi-in"];

function buildLanguageCandidates(preferredLanguage?: string): string[] {
  const normalized = String(preferredLanguage || "").trim().toLowerCase().replace(/_/g, "-");
  const base = normalized.split("-")[0];
  const values = [normalized, base, ...DEFAULT_LANGUAGE_CANDIDATES].filter(Boolean);
  return values.filter((value, index) => values.indexOf(value) === index);
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseTimedTextList(xmlText: string): CaptionTrack[] {
  if (!xmlText.trim() || typeof DOMParser === "undefined") return [];
  const document = new DOMParser().parseFromString(xmlText, "text/xml");
  return Array.from(document.getElementsByTagName("track"))
    .map((node) => ({
      languageCode: node.getAttribute("lang_code") || "",
      kind: node.getAttribute("kind") || undefined,
    }))
    .filter((track) => track.languageCode);
}

function pickTrack(tracks: CaptionTrack[], preferredLanguage?: string): CaptionTrack | null {
  if (!tracks.length) return null;
  const candidates = buildLanguageCandidates(preferredLanguage);
  const ranked = [...tracks].sort((left, right) => {
    const leftLang = left.languageCode.toLowerCase();
    const rightLang = right.languageCode.toLowerCase();
    const leftBase = leftLang.split("-")[0];
    const rightBase = rightLang.split("-")[0];
    const leftIndex = candidates.findIndex((candidate) => candidate === leftLang || candidate === leftBase);
    const rightIndex = candidates.findIndex((candidate) => candidate === rightLang || candidate === rightBase);
    const leftScore = leftIndex === -1 ? 999 : leftIndex;
    const rightScore = rightIndex === -1 ? 999 : rightIndex;
    const leftPenalty = left.kind === "asr" ? 1 : 0;
    const rightPenalty = right.kind === "asr" ? 1 : 0;
    return leftScore - rightScore || leftPenalty - rightPenalty;
  });
  return ranked[0] || null;
}

async function fetchJson3Transcript(videoId: string, languageCode: string, kind?: string): Promise<string> {
  const params = new URLSearchParams({
    v: videoId,
    lang: languageCode,
    fmt: "json3",
  });
  if (kind) params.set("kind", kind);

  const response = await fetch(`https://www.youtube.com/api/timedtext?${params.toString()}`, {
    method: "GET",
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(`Transcript request failed (${response.status})`);
  }

  const payload = await response.json();
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const text = events
    .map((event: any) =>
      Array.isArray(event?.segs)
        ? event.segs
            .map((part: any) => String(part?.utf8 || ""))
            .join(" ")
        : ""
    )
    .map((line: string) => normalizeText(line))
    .filter(Boolean)
    .join(" ")
    .trim();

  return text;
}

async function tryLanguageGuess(videoId: string, preferredLanguage?: string): Promise<ClientYouTubeTranscriptResult | null> {
  for (const languageCode of buildLanguageCandidates(preferredLanguage)) {
    for (const kind of [undefined, "asr"]) {
      try {
        const text = await fetchJson3Transcript(videoId, languageCode, kind);
        if (text.length > 20) {
          return {
            videoId,
            language: languageCode,
            text,
          };
        }
      } catch {
        // Try the next candidate.
      }
    }
  }
  return null;
}

export async function fetchYouTubeTranscriptClient(
  url: string,
  preferredLanguage?: string
): Promise<ClientYouTubeTranscriptResult> {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  try {
    const listResponse = await fetch(`https://www.youtube.com/api/timedtext?type=list&v=${videoId}`, {
      method: "GET",
      credentials: "omit",
    });
    if (listResponse.ok) {
      const xmlText = await listResponse.text();
      const track = pickTrack(parseTimedTextList(xmlText), preferredLanguage);
      if (track) {
        const text = await fetchJson3Transcript(videoId, track.languageCode, track.kind);
        if (text.length > 20) {
          return {
            videoId,
            language: track.languageCode,
            text,
          };
        }
      }
    }
  } catch {
    // Fall through to direct language guesses.
  }

  const guessed = await tryLanguageGuess(videoId, preferredLanguage);
  if (guessed) return guessed;

  throw new Error("Transcript unavailable from this browser");
}
