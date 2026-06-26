import { useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';

/**
 * Frontend instrumentation for the Karpathy Loop feedback system.
 *
 * Usage:
 *   const { logClick, logRating } = useQueryFeedback(sessionId, userEmail, collegeId);
 *
 *   // When user clicks a PDF card:
 *   <PDFCard onClick={() => logClick(fileId, queryText)} />
 *
 *   // When user rates an AI response:
 *   <ThumbsUp onClick={() => logRating(5, queryText)} />
 *   <ThumbsDown onClick={() => logRating(1, queryText)} />
 */

export interface FeedbackLogOptions {
  sessionId: string;
  userEmail: string;
  collegeId: string;
}

export function useQueryFeedback({ sessionId, userEmail, collegeId }: FeedbackLogOptions) {
  const logClick = useCallback(
    async (fileId: string, queryText: string) => {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('query_feedback').upsert(
          {
            session_id: sessionId,
            query_text: queryText,
            query_hash: computeQueryHash(queryText),
            files_clicked: [fileId],
            user_email: userEmail,
            college_id: collegeId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'session_id, query_hash' }
        );
      } catch (err) {
        console.warn('Failed to log click feedback', err);
      }
    },
    [sessionId, userEmail, collegeId]
  );

  const logRating = useCallback(
    async (rating: 1 | 2 | 3 | 4 | 5, queryText: string) => {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('query_feedback').upsert(
          {
            session_id: sessionId,
            query_text: queryText,
            query_hash: computeQueryHash(queryText),
            user_rating: rating,
            user_email: userEmail,
            college_id: collegeId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'session_id, query_hash' }
        );
      } catch (err) {
        console.warn('Failed to log rating feedback', err);
      }
    },
    [sessionId, userEmail, collegeId]
  );

  const logFollowUp = useCallback(
    async (followUpQuery: string, previousQueryText: string) => {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('query_feedback').upsert(
          {
            session_id: sessionId,
            query_text: previousQueryText,
            query_hash: computeQueryHash(previousQueryText),
            follow_up_query: followUpQuery,
            user_email: userEmail,
            college_id: collegeId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'session_id, query_hash' }
        );
      } catch (err) {
        console.warn('Failed to log follow-up feedback', err);
      }
    },
    [sessionId, userEmail, collegeId]
  );

  const logSyllabusClarification = useCallback(
    async (subjectCode: string, unitExamMap: Record<string, string>) => {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('query_feedback').insert({
          session_id: sessionId,
          query_text: `Syllabus clarification: ${subjectCode} - ${JSON.stringify(unitExamMap)}`,
          query_hash: computeQueryHash(`syllabus-${subjectCode}`),
          parsed_intent: 'syllabus_clarification',
          user_email: userEmail,
          college_id: collegeId,
        });
      } catch (err) {
        console.warn('Failed to log syllabus clarification', err);
      }
    },
    [sessionId, userEmail, collegeId]
  );

  return { logClick, logRating, logFollowUp, logSyllabusClarification };
}

function computeQueryHash(query: string): string {
  return query
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .split('')
    .reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)
    .toString(16);
}
