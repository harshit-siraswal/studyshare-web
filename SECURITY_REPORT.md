# Security Report (Studyspace)

Date: 2026-02-11
Scope: web app, admin dashboard, Android app, backend API, and Supabase schema usage.

## Summary
Several security gaps come from direct client access to Supabase with the anon key, missing RLS on public tables, and admin verification happening client-side. These create risk of data exposure and unauthorized writes. The most urgent fixes are enabling RLS on sensitive tables, moving admin auth server-side, and locking down database functions and views.

## High Severity Findings
1. Client apps use the Supabase anon key for direct reads/writes across many tables with weak or missing RLS.
Evidence: `C:\Users\ASUS\Studyspace\src\supabase.js`, `C:\Users\ASUS\Desktop\mystudyspace-app\flutter_application_1\lib\config\app_config.dart`, and extensive `supabase` usage in app code.
Impact: Any user can query or mutate exposed tables via PostgREST if RLS is not strict.

2. RLS disabled on sensitive public tables.
Tables: `admin_notifications`, `admin_push_history`, `fcm_tokens`, `notification_preferences`.
Impact: Data exposure, PII leakage, and unauthorized access to admin-only history and device tokens.

3. Security definer view on `notice_like_counts`.
Impact: RLS and permissions of the view owner can be used instead of the querying user.

4. Admin verification performed client-side via RPC.
Evidence: `C:\Users\ASUS\Desktop\admin-studyspace\auth.js` previously called `verify_admin_key` directly.
Impact: RPC exposure and privilege escalation risk if RLS is loosened.

## Medium Severity Findings
1. Functions without fixed `search_path`.
Impact: Risk of search_path hijacking for `SECURITY DEFINER` functions.

2. `vector` extension installed in `public` schema.
Impact: Public schema should not host extensions; increases risk of object shadowing.

3. Admin key hash stored in localStorage.
Impact: If XSS occurs, admin session can be stolen. Consider short-lived tokens or HttpOnly session cookies.

## Database Structure Improvements
1. Separate extension objects into `extensions` schema and grant only needed usage.
2. Use consistent user identifiers.
Prefer `users.id` or `firebase_uid` everywhere instead of mixing email and UUID.
3. Standardize RLS policy templates.
Create per-table policies with consistent naming for read vs write paths.
4. Minimize direct client database access.
Route writes through backend and keep client reads to filtered views or API endpoints.

## Applied or Planned Fixes
1. Added `C:\Users\ASUS\Studyspace\SECURITY_FIXES.sql` to:
Enable RLS on sensitive tables, add policies, fix view security, move `vector` extension, and set function `search_path`.
2. Admin login is moving to server-side verification via `/api/admin` instead of RPC.

## Next Steps
1. Migrate remaining Supabase client operations to backend APIs, starting with write paths.
2. Enforce RLS across all public tables after API migration, then remove unused RPCs.
3. Add automated security checks in CI (Supabase lints and unit tests for policy coverage).
