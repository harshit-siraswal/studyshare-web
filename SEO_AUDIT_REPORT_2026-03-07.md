# StudyShare SEO Audit (2026-03-07)

## Scope
- Repository-level SEO configuration review.
- Live checks against:
  - `https://studyshare.in/`
  - `https://studyshare.in/blog`
  - `https://studyshare.in/blog/how-to-study-faster-with-ai-pdf-chat`

## Critical Findings
1. SPA meta mismatch on crawled route URLs (critical).
   - Live fetch for `/blog` and `/blog/<slug>` returns homepage metadata and canonical `https://studyshare.in/`.
   - Impact:
     - Blog pages can be indexed as homepage duplicates.
     - Page-specific titles/descriptions/schema are not reliably visible to bots that do not execute JS fully.
2. Route SEO is client-injected only.
   - React Helmet is used in app routes, but first HTML payload is shared shell.
   - Impact:
     - Inconsistent indexing/rich snippets for deep routes.

## High Findings
1. Sitemap structure should be upgraded to a sitemap index.
   - `public/sitemap.xml` lists only `/` and `/blog`.
   - Blog URLs are in `public/blogs.xml` and discovered via `robots.txt`.
   - Better practice: `sitemap_index.xml` referencing both child sitemaps.
2. No hreflang/x-default strategy.
   - For future regional growth and cleaner canonicalization, add `hreflang` (or intentionally omit with documented strategy).

## Medium Findings
1. Generic root-level metadata copy is not aligned with route intent.
   - Root OG/Twitter text differs from route/page-specific messaging.
2. Organization JSON-LD is present in root HTML, but article/blog structured data relies on runtime rendering.
   - Move critical schema for indexed content to prerendered HTML response.

## Low Findings
1. Meta keywords still present.
   - Not harmful, but obsolete for modern ranking.

## Positives
- Canonical, robots, OG/Twitter, JSON-LD exist in root shell.
- `robots.txt` correctly blocks private app areas.
- Blog SEO component and BlogPosting schema are implemented in source.
- `blogs.xml` exists with blog URLs.

## Evidence (Code References)
- Root shell metadata:
  - `index.html` lines 7-37, 39-48.
- Root canonical hardcoded:
  - `index.html` line 14.
- Client-side route SEO implementation:
  - `src/components/SEO.tsx` lines 59-92.
- Primary sitemap:
  - `public/sitemap.xml` lines 1-13.
- Robots directives + sitemap pointers:
  - `public/robots.txt` lines 1-13.

## Recommended Fix Plan
1. Implement prerender for SEO routes (must-do).
   - Prerender at least:
     - `/`
     - `/blog`
     - each blog post route from `blogPosts`.
   - Keep app sections (`/study`, `/messages`, etc.) as SPA/noindex.
2. Return route-correct canonical/title/meta in initial HTML.
   - Ensure `/blog/<slug>` initial HTML has:
     - unique `<title>`
     - unique `<meta name="description">`
     - canonical to that slug
     - BlogPosting JSON-LD.
3. Upgrade sitemap architecture.
   - Add sitemap index (`/sitemap.xml`) that references:
     - `/sitemaps/core.xml`
     - `/sitemaps/blog.xml`
   - Include `lastmod` for all entries.
4. Add automated SEO regression checks in CI.
   - Validate canonical/title/description for key routes.
   - Validate sitemap URLs return 200 and non-root canonical on blog pages.

## Suggested Acceptance Criteria
- Fetching `/blog` and `/blog/<slug>` without JS returns route-specific canonical/title/description.
- Blog pages appear in Search Console as unique indexed URLs (not duplicate canonicalized to `/`).
- Rich results validator sees BlogPosting JSON-LD on blog detail HTML response.
