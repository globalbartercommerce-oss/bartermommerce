import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy factory — reads process.env at call time, not at module load time.
// This is required for Cloudflare Workers where env vars are injected into
// process.env inside the request handler, AFTER module initialisation.
function createAdminClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// Proxy so existing callers keep `supabaseAdmin.from(...)` syntax unchanged,
// but the underlying client is created on first access (after env is ready).
let _admin: SupabaseClient | null = null;
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_admin) _admin = createAdminClient();
    return (_admin as any)[prop];
  },
});

// Standard client for loader / action calls (anon key, no admin privileges).
export function getSupabaseClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_ANON_KEY || "placeholder-anon-key",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
