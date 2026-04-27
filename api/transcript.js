const YOUTUBE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
  Cookie: "CONSENT=YES+cb.20210328-17-p0.en+FX+; SOCS=CAI",
};

const YOUTUBE_ANDROID_CLIENT = {
  clientName: "ANDROID",
  clientVersion: "21.03.36",
  sdkVersion: 36,
  osVersion: "16",
  userAgent:
    "com.google.android.youtube/21.03.36(Linux; U; Android 16; en_US; SM-S908E Build/TP1A.220624.014) gzip",
  clientNameHeader: "3",
};

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function applyCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.end(JSON.stringify(payload));
}

function formatTimestamp(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function normalizeLanguageCode(language) {
  return typeof language === "string" ? language.trim().toLowerCase() : "";
}

function buildLanguageCandidates(language) {
  const requested = normalizeLanguageCode(language);
  const base = requested.includes("-") ? requested.split("-")[0] : requested;
  return [...new Set([requested, base, "en", "en-us", "en-gb", "hi", "hi-in"].filter(Boolean))];
}

function extractYouTubeId(raw) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  if (YOUTUBE_ID_PATTERN.test(value)) return value;

  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const host = url.hostname.toLowerCase();
    if (host === "youtu.be" || host.endsWith(".youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    const searchId = url.searchParams.get("v");
    if (searchId && YOUTUBE_ID_PATTERN.test(searchId)) {
      return searchId;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 2) {
      const [first, second] = pathParts;
      if (["embed", "shorts", "live", "v"].includes(first.toLowerCase()) && YOUTUBE_ID_PATTERN.test(second)) {
        return second;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function pickCaptionTrack(tracks, preferredLanguage) {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;
  const candidates = buildLanguageCandidates(preferredLanguage);

  for (const candidate of candidates) {
    const exact = tracks.find((track) => normalizeLanguageCode(track.languageCode) === candidate);
    if (exact) return exact;
  }

  for (const candidate of candidates) {
    const base = candidate.split("-")[0];
    const match = tracks.find((track) => normalizeLanguageCode(track.languageCode).split("-")[0] === base);
    if (match) return match;
  }

  return tracks.find((track) => track.kind !== "asr") || tracks[0] || null;
}

function sortTimedTextTracks(tracks, preferredLanguage) {
  if (!Array.isArray(tracks) || tracks.length === 0) return [];
  const preferred = new Set(buildLanguageCandidates(preferredLanguage));

  return [...tracks].sort((left, right) => {
    const leftCode = normalizeLanguageCode(left?.languageCode);
    const rightCode = normalizeLanguageCode(right?.languageCode);
    const leftPreferred = preferred.has(leftCode);
    const rightPreferred = preferred.has(rightCode);
    if (leftPreferred !== rightPreferred) {
      return leftPreferred ? -1 : 1;
    }

    const leftAsr = normalizeLanguageCode(left?.kind) === "asr";
    const rightAsr = normalizeLanguageCode(right?.kind) === "asr";
    if (leftAsr !== rightAsr) {
      return leftAsr ? 1 : -1;
    }

    return 0;
  });
}

function buildTranscriptFromJson3(videoId, language, payload) {
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const segments = [];

  for (const event of events) {
    const parts = Array.isArray(event?.segs) ? event.segs : [];
    const text = parts
      .map((part) => (typeof part?.utf8 === "string" ? part.utf8 : ""))
      .join("")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) continue;

    const offsetSeconds = Math.max(0, Number(event?.tStartMs || 0) / 1000);
    const durationSeconds = Math.max(0, Number(event?.dDurationMs || 0) / 1000);
    const endSeconds = offsetSeconds + durationSeconds;

    segments.push({
      text,
      offsetSeconds,
      durationSeconds,
      endSeconds,
      timestamp: formatTimestamp(offsetSeconds),
      language: language || null,
    });
  }

  if (segments.length === 0) {
    return null;
  }

  return {
    videoId,
    language: language || null,
    segments,
    fullText: segments.map((segment) => segment.text).join(" ").trim(),
  };
}

function buildTranscriptFromXml(videoId, language, rawXml) {
  const source = typeof rawXml === "string" ? rawXml : "";
  if (!source.trim()) return null;

  const segments = [];
  const pattern = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const attrs = match[1] || "";
    const body = decodeHtmlEntities(match[2] || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!body) continue;

    const startMatch = attrs.match(/\bstart="([^"]+)"/i);
    const durMatch = attrs.match(/\bdur="([^"]+)"/i);
    const offsetSeconds = Math.max(0, Number(startMatch?.[1] || 0));
    const durationSeconds = Math.max(0, Number(durMatch?.[1] || 0));
    const endSeconds = offsetSeconds + durationSeconds;

    segments.push({
      text: body,
      offsetSeconds,
      durationSeconds,
      endSeconds,
      timestamp: formatTimestamp(offsetSeconds),
      language: language || null,
    });
  }

  if (segments.length === 0) {
    return null;
  }

  return {
    videoId,
    language: language || null,
    segments,
    fullText: segments.map((segment) => segment.text).join(" ").trim(),
  };
}

async function fetchTranscriptTrack(videoId, track) {
  const trackUrl = typeof track?.baseUrl === "string" ? track.baseUrl : "";
  if (!trackUrl) return null;

  const separator = trackUrl.includes("?") ? "&" : "?";
  const response = await fetch(`${trackUrl}${separator}fmt=json3`, {
    headers: {
      ...YOUTUBE_HEADERS,
      "User-Agent": YOUTUBE_ANDROID_CLIENT.userAgent,
    },
  });

  if (!response.ok) {
    return null;
  }

  const rawText = await response.text();
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    try {
      return buildTranscriptFromJson3(videoId, track.languageCode, JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  return buildTranscriptFromXml(videoId, track.languageCode, trimmed);
}

function extractBalancedObject(source, startIndex) {
  let depth = 0;
  let inString = false;
  let stringQuote = "";
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === stringQuote) {
        inString = false;
        stringQuote = "";
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringQuote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function extractPlayerResponseFromHtml(html) {
  const markers = [
    "ytInitialPlayerResponse =",
    "var ytInitialPlayerResponse =",
    'window["ytInitialPlayerResponse"] =',
  ];

  for (const marker of markers) {
    const markerIndex = html.indexOf(marker);
    if (markerIndex === -1) continue;

    const objectStart = html.indexOf("{", markerIndex);
    if (objectStart === -1) continue;

    const objectText = extractBalancedObject(html, objectStart);
    if (!objectText) continue;

    try {
      return JSON.parse(objectText);
    } catch {
      continue;
    }
  }

  return null;
}

function parseTimedTextTrackList(xml) {
  if (!xml) return [];
  const tracks = [];
  const pattern = /<track\b([^>]+)\/>/gi;
  let match;

  while ((match = pattern.exec(xml)) !== null) {
    const attrs = match[1] || "";
    const languageMatch = attrs.match(/\blang_code="([^"]+)"/i);
    if (!languageMatch?.[1]) continue;
    const kindMatch = attrs.match(/\bkind="([^"]+)"/i);
    tracks.push({
      languageCode: decodeHtmlEntities(languageMatch[1]),
      kind: kindMatch?.[1] ? decodeHtmlEntities(kindMatch[1]) : "",
    });
  }

  return tracks;
}

async function fetchTimedTextTrackList(videoId) {
  const response = await fetch(
    `https://www.youtube.com/api/timedtext?type=list&v=${encodeURIComponent(videoId)}`,
    {
      headers: YOUTUBE_HEADERS,
    }
  );

  if (!response.ok) {
    return [];
  }

  return parseTimedTextTrackList(await response.text());
}

async function fetchTimedTextTranscript(videoId, languageCode, kind) {
  if (!languageCode) return null;

  const params = new URLSearchParams({
    v: videoId,
    lang: languageCode,
    fmt: "json3",
  });
  if (kind) {
    params.set("kind", kind);
  }

  const response = await fetch(`https://www.youtube.com/api/timedtext?${params.toString()}`, {
    headers: YOUTUBE_HEADERS,
  });

  if (!response.ok) {
    return null;
  }

  const rawText = await response.text();
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    try {
      return buildTranscriptFromJson3(videoId, languageCode, JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  return buildTranscriptFromXml(videoId, languageCode, trimmed);
}

async function fetchTranscriptViaInnertube(videoId, preferredLanguage) {
  const response = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: {
      ...YOUTUBE_HEADERS,
      "Content-Type": "application/json",
      "User-Agent": YOUTUBE_ANDROID_CLIENT.userAgent,
      "X-YouTube-Client-Name": YOUTUBE_ANDROID_CLIENT.clientNameHeader,
      "X-YouTube-Client-Version": YOUTUBE_ANDROID_CLIENT.clientVersion,
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: YOUTUBE_ANDROID_CLIENT.clientName,
          clientVersion: YOUTUBE_ANDROID_CLIENT.clientVersion,
          androidSdkVersion: YOUTUBE_ANDROID_CLIENT.sdkVersion,
          osName: "Android",
          osVersion: YOUTUBE_ANDROID_CLIENT.osVersion,
          hl: preferredLanguage || "en",
          gl: "US",
          userAgent: YOUTUBE_ANDROID_CLIENT.userAgent,
        },
        thirdParty: {
          embedUrl: `https://www.youtube.com/watch?v=${videoId}`,
        },
      },
      videoId,
      playbackContext: {
        contentPlaybackContext: {
          html5Preference: "HTML5_PREF_WANTS",
        },
      },
      contentCheckOk: true,
      racyCheckOk: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`YouTube player request failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  const tracks = payload?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!Array.isArray(tracks) || tracks.length === 0) {
    return {
      transcript: null,
      playabilityStatus: payload?.playabilityStatus ?? null,
    };
  }

  const selected = pickCaptionTrack(
    tracks.map((track) => ({
      baseUrl: typeof track?.baseUrl === "string" ? track.baseUrl : "",
      languageCode: typeof track?.languageCode === "string" ? track.languageCode : "",
      kind: typeof track?.kind === "string" ? track.kind : "",
    })),
    preferredLanguage
  );

  if (!selected) {
    return {
      transcript: null,
      playabilityStatus: payload?.playabilityStatus ?? null,
    };
  }

  const transcript = await fetchTranscriptTrack(videoId, selected);
  return {
    transcript,
    playabilityStatus: payload?.playabilityStatus ?? null,
  };
}

async function fetchTranscriptViaWatchPage(videoId, preferredLanguage) {
  const response = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=en`, {
    headers: YOUTUBE_HEADERS,
  });

  if (!response.ok) {
    return {
      transcript: null,
      playabilityStatus: null,
    };
  }

  const html = await response.text();
  const playerResponse = extractPlayerResponseFromHtml(html);
  const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!Array.isArray(tracks) || tracks.length === 0) {
    return {
      transcript: null,
      playabilityStatus: playerResponse?.playabilityStatus ?? null,
    };
  }

  const selected = pickCaptionTrack(
    tracks.map((track) => ({
      baseUrl: typeof track?.baseUrl === "string" ? track.baseUrl : "",
      languageCode: typeof track?.languageCode === "string" ? track.languageCode : "",
      kind: typeof track?.kind === "string" ? track.kind : "",
    })),
    preferredLanguage
  );

  if (!selected) {
    return {
      transcript: null,
      playabilityStatus: playerResponse?.playabilityStatus ?? null,
    };
  }

  const transcript = await fetchTranscriptTrack(videoId, selected);
  return {
    transcript,
    playabilityStatus: playerResponse?.playabilityStatus ?? null,
  };
}

async function fetchTranscriptViaTimedTextList(videoId, preferredLanguage) {
  const tracks = sortTimedTextTracks(await fetchTimedTextTrackList(videoId), preferredLanguage);
  for (const track of tracks) {
    const transcript = await fetchTimedTextTranscript(videoId, track.languageCode, track.kind);
    if (transcript?.fullText) {
      return transcript;
    }
  }
  return null;
}

async function fetchTranscriptViaTimedTextGuess(videoId, preferredLanguage) {
  const candidates = buildLanguageCandidates(preferredLanguage);
  for (const languageCode of candidates) {
    const manual = await fetchTimedTextTranscript(videoId, languageCode);
    if (manual?.fullText) return manual;

    const asr = await fetchTimedTextTranscript(videoId, languageCode, "asr");
    if (asr?.fullText) return asr;
  }
  return null;
}

async function extractTranscript(videoId, preferredLanguage) {
  let playabilityStatus = null;
  let lastError = null;

  try {
    const innertubeResult = await fetchTranscriptViaInnertube(videoId, preferredLanguage);
    playabilityStatus = innertubeResult.playabilityStatus ?? playabilityStatus;
    if (innertubeResult.transcript?.fullText) {
      return {
        transcript: innertubeResult.transcript,
        playabilityStatus,
      };
    }
  } catch (error) {
    lastError = error;
  }

  try {
    const watchPageResult = await fetchTranscriptViaWatchPage(videoId, preferredLanguage);
    playabilityStatus = watchPageResult.playabilityStatus ?? playabilityStatus;
    if (watchPageResult.transcript?.fullText) {
      return {
        transcript: watchPageResult.transcript,
        playabilityStatus,
      };
    }
  } catch (error) {
    lastError = error;
  }

  try {
    const timedTextTranscript = await fetchTranscriptViaTimedTextList(videoId, preferredLanguage);
    if (timedTextTranscript?.fullText) {
      return {
        transcript: timedTextTranscript,
        playabilityStatus,
      };
    }
  } catch (error) {
    lastError = error;
  }

  try {
    const guessedTranscript = await fetchTranscriptViaTimedTextGuess(videoId, preferredLanguage);
    if (guessedTranscript?.fullText) {
      return {
        transcript: guessedTranscript,
        playabilityStatus,
      };
    }
  } catch (error) {
    lastError = error;
  }

  if (lastError) {
    throw lastError;
  }

  return {
    transcript: null,
    playabilityStatus,
  };
}

export default async function handler(req, res) {
  applyCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET" && req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  const rawBody =
    req.body && typeof req.body === "string"
      ? (() => {
          try {
            return JSON.parse(req.body);
          } catch {
            return {};
          }
        })()
      : req.body && typeof req.body === "object"
        ? req.body
        : {};

  const videoId = extractYouTubeId(
    req.query?.v ||
      req.query?.videoId ||
      req.query?.url ||
      rawBody?.v ||
      rawBody?.videoId ||
      rawBody?.video_url ||
      rawBody?.url
  );
  if (!videoId) {
    json(res, 400, { error: "Missing or invalid YouTube video id" });
    return;
  }

  try {
    const preferredLanguage =
      normalizeLanguageCode(req.query?.lang || rawBody?.language || rawBody?.lang) || "en";
    const { transcript, playabilityStatus } = await extractTranscript(videoId, preferredLanguage);

    if (!transcript) {
      json(res, 404, {
        error: "Transcript unavailable for this video",
        playabilityStatus,
      });
      return;
    }

    json(res, 200, {
      ...transcript,
      text: transcript.fullText,
      provider: "studyshare-vercel-proxy",
    });
  } catch (error) {
    json(res, 500, {
      error: error instanceof Error ? error.message : "Transcript proxy failed",
    });
  }
}
