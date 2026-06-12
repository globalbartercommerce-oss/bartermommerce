/**
 * Global Barter Commerce — Cloudflare Workers Edge Proxy
 *
 * Routes:
 *   GET  /api/health            → Health check
 *   POST /api/upload            → Upload file to R2 bucket
 *   GET  /api/media/:key        → Stream file from R2
 *   DELETE /api/media/:key      → Delete file from R2
 *   POST /api/notify/email      → Send transactional email via Resend
 *   POST /api/notify/line       → Send LINE Flex Message push
 *   POST /api/webhook/line      → Receive LINE webhook events
 *
 * Security: All mutating endpoints require X-Edge-Proxy-Secret header
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

// ── Environment Bindings ──────────────────────────────────
export interface Env {
  // R2 bucket
  BARTER_MEDIA: R2Bucket;
  // Secrets (set via wrangler secret put)
  EDGE_PROXY_SECRET: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  RESEND_FROM_NAME: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
  LINE_ADMIN_USER_ID: string;
  // Config
  APP_ENV: string;
}

// ── App Setup ─────────────────────────────────────────────
const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3001", "https://*.pages.dev", "https://yourdomain.com"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Edge-Proxy-Secret"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
  })
);
app.use("*", secureHeaders());

// Auth middleware for protected routes
const requireSecret = async (c: any, next: any) => {
  const secret = c.req.header("X-Edge-Proxy-Secret");
  if (!secret || secret !== c.env.EDGE_PROXY_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};

// ── Health Check ──────────────────────────────────────────
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    service: "barter-edge-proxy",
    version: "1.0.0",
    env: c.env.APP_ENV,
    timestamp: new Date().toISOString(),
    features: {
      r2: !!c.env.BARTER_MEDIA,
      resend: !!c.env.RESEND_API_KEY,
      line: !!c.env.LINE_CHANNEL_ACCESS_TOKEN,
    },
  });
});

// ── R2 File Upload ────────────────────────────────────────
app.post("/api/upload", requireSecret, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "listings";

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  // Validate
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: `Invalid file type: ${file.type}` }, 400);
  }
  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: "File too large (max 10MB)" }, 400);
  }

  // Generate unique key
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();

  await c.env.BARTER_MEDIA.put(key, buffer, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  // Construct public URL from R2 custom domain if available
  const publicUrl = `https://pub-placeholder.r2.dev/${key}`;

  return c.json({ url: publicUrl, key, size: file.size });
});

// ── R2 File Retrieval (Stream) ────────────────────────────
app.get("/api/media/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.BARTER_MEDIA.get(key);

  if (!object) {
    return c.json({ error: "File not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000");

  return new Response(object.body, { headers });
});

// ── R2 File Deletion ──────────────────────────────────────
app.delete("/api/media/:key{.+}", requireSecret, async (c) => {
  const key = c.req.param("key");
  await c.env.BARTER_MEDIA.delete(key);
  return c.json({ success: true, key });
});

// ── Resend Email Proxy ────────────────────────────────────
app.post("/api/notify/email", requireSecret, async (c) => {
  const { to, subject, html, text } = await c.req.json<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }>();

  if (!to || !subject) {
    return c.json({ error: "Missing required fields: to, subject" }, 400);
  }

  const fromName = c.env.RESEND_FROM_NAME || "Global Barter Commerce";
  const fromEmail = c.env.RESEND_FROM_EMAIL || "noreply@globalbarter.com";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html: html || `<p>${text || subject}</p>`,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("[Worker] Resend error:", data);
    return c.json({ error: "Email send failed", details: data }, 500);
  }

  return c.json({ success: true, id: (data as any).id });
});

// ── LINE Push Notification Proxy ──────────────────────────
app.post("/api/notify/line", requireSecret, async (c) => {
  const { to, messages } = await c.req.json<{
    to: string;
    messages: Array<{ type: string; text?: string; [key: string]: any }>;
  }>();

  if (!to || !messages?.length) {
    return c.json({ error: "Missing required fields: to, messages" }, 400);
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to, messages }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[Worker] LINE push failed:", err);
    return c.json({ error: "LINE push failed", status: response.status }, 500);
  }

  return c.json({ success: true });
});

// ── LINE Webhook Receiver ─────────────────────────────────
app.post("/api/webhook/line", async (c) => {
  const signature = c.req.header("X-Line-Signature");
  const body = await c.req.text();

  // Verify LINE signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(c.env.LINE_CHANNEL_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));

  if (computed !== signature) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const payload = JSON.parse(body);
  console.log("[Worker] LINE webhook received:", JSON.stringify(payload.events?.length));

  // Handle events (extend as needed)
  for (const event of payload.events || []) {
    if (event.type === "message" && event.message.type === "text") {
      // Echo or handle admin commands here
      console.log(`[Worker] LINE message from ${event.source.userId}: ${event.message.text}`);
    }
  }

  return c.json({ ok: true });
});

// ── 404 Handler ───────────────────────────────────────────
app.notFound((c) => c.json({ error: "Route not found" }, 404));

// ── Error Handler ─────────────────────────────────────────
app.onError((err, c) => {
  console.error("[Worker] Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
