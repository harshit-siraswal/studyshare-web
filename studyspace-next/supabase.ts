import { supabase as rawSupabase } from "./integrations/supabase/client";

// This compatibility shim mirrors the original app's loosely typed Supabase usage.
// The generated Database types are incomplete for legacy tables like `users` and `colleges`,
// so we intentionally expose the client as `any` during the migration.
export const supabase = rawSupabase as any;
