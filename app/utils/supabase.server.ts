import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load env variables from .env file
dotenv.config();

const rawUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawUrl && rawUrl !== "undefined" && rawUrl !== "null" && rawUrl.trim() !== "" ? rawUrl : "https://placeholder.supabase.co";
console.log("[SUPABASE DEBUG] rawUrl:", JSON.stringify(rawUrl));
console.log("[SUPABASE DEBUG] supabaseUrl:", JSON.stringify(supabaseUrl));
console.log("[SUPABASE DEBUG] cwd:", process.cwd());

if (!supabaseUrl || typeof supabaseUrl !== "string" || !supabaseUrl.startsWith("http")) {
  throw new Error(`DEBUG: supabaseUrl is invalid! Value: [${supabaseUrl}], type: ${typeof supabaseUrl}`);
}

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

// Service Role client for bypassing RLS in admin actions and triggers
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Standard Client for standard loader and action calls
export function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
