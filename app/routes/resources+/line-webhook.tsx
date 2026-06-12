/**
 * LINE Messaging API Webhook Handler
 * POST /resources/line-webhook
 * Receives incoming messages and events from LINE Platform
 */

import { type ActionFunction, json } from "@remix-run/node";
import { verifyLineSignature } from "~/utils/line.server";

export const action: ActionFunction = async ({ request }) => {
  // Only accept POST
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const signature = request.headers.get("X-Line-Signature");
  if (!signature) {
    return json({ error: "Missing X-Line-Signature" }, { status: 401 });
  }

  const body = await request.text();

  // Verify HMAC signature
  if (!verifyLineSignature(body, signature)) {
    console.error("[LINE Webhook] Invalid signature");
    return json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  console.log("[LINE Webhook] Received events:", payload.events?.length || 0);

  // Process events
  for (const event of payload.events || []) {
    if (event.type === "message" && event.message.type === "text") {
      const text = event.message.text.toLowerCase();
      const userId = event.source.userId;
      console.log(`[LINE Webhook] Message from ${userId}: ${text}`);

      // Admin commands
      if (text === "/status") {
        // Could push back a status message
        console.log("[LINE Webhook] Status command received from admin");
      }
    } else if (event.type === "follow") {
      console.log(`[LINE Webhook] New follower: ${event.source.userId}`);
    } else if (event.type === "unfollow") {
      console.log(`[LINE Webhook] Unfollowed: ${event.source.userId}`);
    }
  }

  // LINE requires 200 OK response within 30 seconds
  return json({ ok: true });
};

// LINE verification challenge
export const loader = () => json({ challenge: "line-webhook-active" });
