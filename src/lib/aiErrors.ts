/**
 * WP-2: Single source of truth for error code → user-facing message mapping.
 * These messages are shown in the UI when YouTube source ingestion fails.
 * IMPORTANT: Never mention "Android app" or "use a different app" — show
 * specific, honest messages that describe the real limitation.
 */

export const AI_ERROR_MESSAGES: Record<string, string> = {
    TRANSCRIPT_UNAVAILABLE:
        'This video has no captions and audio transcription failed. Try another video.',
    ASR_TOO_LONG:
        'This video is longer than 90 minutes, which isn\u2019t supported yet.',
    FETCH_BLOCKED:
        'YouTube is temporarily blocking transcript access. We\u2019ve queued a retry \u2014 please check back in a few minutes.',
    UNSUPPORTED_URL: 'Only YouTube links are supported right now.',
    VIDEO_UNAVAILABLE: 'This video is unavailable or private.',
    ASR_FAILED: 'Audio transcription failed for this video. Try another video.',
    QUEUE_FAILED:
        'Failed to queue transcript ingestion. Please try again.',
};

/**
 * Maps a backend error_code to a user-facing message.
 * Returns a generic fallback if the code is unknown or undefined.
 */
export function mapAiErrorCode(code: string | undefined): string {
    if (!code) return 'Something went wrong. Please try again.';
    return AI_ERROR_MESSAGES[code] ?? `Processing failed (${code}). Please try again.`;
}
