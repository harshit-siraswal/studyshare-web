# StudyShare Website Security Audit (2026-03-05)

## Scope
- Target: `d:\StudyspaceProjects\Studyspace`
- Type: Static audit (dependency + source review)
- Date: 2026-03-05

## Method
- `npm audit --json`
- `npm run security:scan`
- Manual review of high-risk surfaces:
  - HTML injection paths
  - Client-side key handling
  - Security headers
  - Direct database access from frontend

## Findings

### 1) Critical: Vulnerable `jspdf` dependency in production path
- Severity: Critical
- Evidence:
  - [package.json](d:/StudyspaceProjects/Studyspace/package.json:67) uses `jspdf: ^2.5.2`
  - `npm audit` reports multiple advisories including critical (`GHSA-f8cm-6447-x5h2`) and high (`GHSA-p5xg-68wr-hm3m`, `GHSA-9vjf-qc39-jprp`).
- Risk:
  - PDF injection / object injection / DoS vectors in PDF generation flows.
- Recommended fix:
  - Upgrade `jspdf` to `>=4.2.0`.
  - Re-test PDF export functionality end-to-end after upgrade.

### 2) Moderate: `dompurify` flagged vulnerable; used on PPTX HTML rendering flow
- Severity: Moderate
- Evidence:
  - [package.json](d:/StudyspaceProjects/Studyspace/package.json:61) uses `dompurify: ^3.3.1`
  - Sanitization usage at [DocumentViewer.tsx](d:/StudyspaceProjects/Studyspace/src/components/DocumentViewer.tsx:342)
  - HTML injection sink at [DocumentViewer.tsx](d:/StudyspaceProjects/Studyspace/src/components/DocumentViewer.tsx:1037)
  - `npm audit` reports `dompurify <=3.3.1` advisories.
- Risk:
  - If crafted slide HTML bypasses sanitizer version in use, XSS can occur in document viewer.
- Recommended fix:
  - Upgrade `dompurify` to latest patched version.
  - Keep sanitizer strict and add regression tests for malicious PPTX payloads.

### 3) Medium: Missing modern browser hardening headers (CSP/HSTS)
- Severity: Medium
- Evidence:
  - [vercel.json](d:/StudyspaceProjects/Studyspace/vercel.json:6) defines some headers, but no `Content-Security-Policy` and no `Strict-Transport-Security`.
- Risk:
  - XSS blast radius and downgrade/transport hardening are weaker than recommended for production.
- Recommended fix:
  - Add a restrictive `Content-Security-Policy` tuned for current asset/script origins.
  - Add `Strict-Transport-Security` with long max-age and includeSubDomains/preload if domain policy allows.

### 4) Medium: Frontend directly accesses Supabase tables (authorization surface drift)
- Severity: Medium
- Evidence:
  - Direct Supabase client import in UI component: [StudySidebar.tsx](d:/StudyspaceProjects/Studyspace/src/components/StudySidebar.tsx:18)
  - Direct table query from browser: [StudySidebar.tsx](d:/StudyspaceProjects/Studyspace/src/components/StudySidebar.tsx:67)
  - Additional direct `.from(...)` usage exists across pages/components.
- Risk:
  - Security posture depends on perfect RLS and policy hygiene everywhere.
  - Can diverge from backend-authz model and increase accidental data exposure risk.
- Recommended fix:
  - Route privileged reads/writes through backend API consistently.
  - Minimize browser-side direct table access to least-privileged, strictly RLS-bound operations.

### 5) Informational: Public Firebase/Supabase fallback keys embedded in frontend source
- Severity: Info
- Evidence:
  - Firebase config fallback at [firebase.js](d:/StudyspaceProjects/Studyspace/src/firebase.js:8)
  - Supabase publishable fallback key at [client.ts](d:/StudyspaceProjects/Studyspace/src/integrations/supabase/client.ts:6)
  - Additional Supabase fallback key at [supabase.js](d:/StudyspaceProjects/Studyspace/src/supabase.js:5)
  - Detected by built-in scanner (`npm run security:scan`).
- Risk:
  - These are public-by-design keys, but hardcoded defaults make project targeting easier and reduce environment isolation.
- Recommended fix:
  - Prefer env-only config in production builds.
  - Keep strict RLS and rotate keys if exposure scope changes.

## Priority Remediation Plan
1. Upgrade `jspdf` and `dompurify`, then run full regression for PDF export + document viewer.
2. Add CSP and HSTS headers in `vercel.json` (roll out in report-only/monitor mode first for CSP if needed).
3. Reduce direct Supabase browser queries and centralize authz in backend endpoints.
4. Move to env-only config for Firebase/Supabase defaults in production.

## Commands Run
- `npm audit --json`
- `npm run security:scan`
- `rg`-based static checks for injection sinks, storage usage, and link hardening.

