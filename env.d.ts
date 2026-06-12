/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

declare module "process" {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        // ── Supabase ──────────────────────────────────────────
        SUPABASE_URL: string;
        SUPABASE_ANON_KEY: string;
        SUPABASE_SERVICE_ROLE_KEY: string;

        // ── Session ───────────────────────────────────────────
        SESSION_SECRET: string;

        // ── Cloudflare R2 ─────────────────────────────────────
        R2_ACCESS_KEY_ID: string;
        R2_SECRET_ACCESS_KEY: string;
        R2_ENDPOINT: string;
        R2_BUCKET_NAME: string;
        R2_PUBLIC_URL: string;

        // ── Cloudflare Account ────────────────────────────────
        CLOUDFLARE_ACCOUNT_ID?: string;
        CLOUDFLARE_API_TOKEN?: string;
        EDGE_PROXY_URL?: string;
        EDGE_PROXY_SECRET?: string;

        // ── Resend ────────────────────────────────────────────
        RESEND_API_KEY: string;
        RESEND_FROM_EMAIL: string;
        RESEND_FROM_NAME?: string;

        // ── LINE Messaging API ────────────────────────────────
        LINE_CHANNEL_ACCESS_TOKEN: string;
        LINE_CHANNEL_SECRET: string;
        LINE_ADMIN_USER_ID?: string;

        // ── Runtime ───────────────────────────────────────────
        NODE_ENV: "development" | "production" | "test";
        PORT?: string;
      }
    }
  }
}
