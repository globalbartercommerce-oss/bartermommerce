/**
 * LINE Messaging API Utility
 * Push Notifications for Escrow, Barter, and System Events
 * Uses LINE Messaging API (Official Bot Channel)
 */

// ── Types ──────────────────────────────────────────────────
interface LineTextMessage {
  type: "text";
  text: string;
}

interface LineFlexMessage {
  type: "flex";
  altText: string;
  contents: object;
}

type LineMessage = LineTextMessage | LineFlexMessage;

interface LinePushResponse {
  ok: boolean;
  status: number;
  message?: string;
}

// ── LINE API Client ────────────────────────────────────────
const LINE_API = "https://api.line.me/v2/bot/message";

async function pushMessage(
  to: string,
  messages: LineMessage[]
): Promise<LinePushResponse> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.warn("[LINE] LINE_CHANNEL_ACCESS_TOKEN not configured");
    return { ok: false, status: 0, message: "Not configured" };
  }

  try {
    const response = await fetch(`${LINE_API}/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to, messages }),
    });

    const ok = response.ok;
    const status = response.status;

    if (!ok) {
      const body = await response.text();
      console.error(`[LINE] Push failed (${status}):`, body);
    } else {
      console.log(`[LINE] Push sent to ${to} (${messages.length} messages)`);
    }

    return { ok, status };
  } catch (error) {
    console.error("[LINE] Network error:", error);
    return { ok: false, status: 0, message: String(error) };
  }
}

// ── Flex Message Builders ──────────────────────────────────
function buildEscrowBubble(
  escrowId: string,
  status: string,
  amount: number,
  appUrl: string
) {
  const statusConfig: Record<string, { color: string; label: string; emoji: string }> = {
    funded: { color: "#22d3ee", label: "ได้รับเงินมัดจำ", emoji: "💰" },
    goods_delivered: { color: "#fbbf24", label: "ส่งสินค้าแล้ว", emoji: "📦" },
    completed: { color: "#34d399", label: "สำเร็จแล้ว", emoji: "✅" },
    disputed: { color: "#f87171", label: "มีข้อพิพาท", emoji: "⚠️" },
    cancelled: { color: "#94a3b8", label: "ยกเลิก", emoji: "❌" },
  };
  const cfg = statusConfig[status] || { color: "#22d3ee", label: status, emoji: "📋" };

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0d1117",
      contents: [
        {
          type: "text",
          text: `${cfg.emoji} Escrow Update`,
          weight: "bold",
          color: cfg.color,
          size: "sm",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0d1117",
      contents: [
        {
          type: "text",
          text: cfg.label,
          weight: "bold",
          size: "xl",
          color: "#ffffff",
        },
        {
          type: "box",
          layout: "vertical",
          margin: "md",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "Escrow ID", size: "xs", color: "#64748b", flex: 2 },
                { type: "text", text: escrowId.substring(0, 12) + "...", size: "xs", color: "#e2e8f0", flex: 3, align: "end" },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "sm",
              contents: [
                { type: "text", text: "มูลค่า", size: "xs", color: "#64748b", flex: 2 },
                { type: "text", text: `${amount.toLocaleString()} UNC`, size: "sm", color: cfg.color, weight: "bold", flex: 3, align: "end" },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0d1117",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#22d3ee",
          action: {
            type: "uri",
            label: "ดูรายละเอียด",
            uri: `${appUrl}/app/escrows`,
          },
          height: "sm",
        },
      ],
    },
  };
}

function buildMatchBubble(
  listingTitle: string,
  matchScore: number,
  appUrl: string
) {
  const scorePercent = Math.round(matchScore * 100);
  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0d1117",
      contents: [
        {
          type: "text",
          text: "🤖 AI พบคู่แลกเปลี่ยน!",
          weight: "bold",
          color: "#a78bfa",
          size: "sm",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0d1117",
      contents: [
        {
          type: "text",
          text: listingTitle,
          weight: "bold",
          size: "md",
          color: "#ffffff",
          wrap: true,
          maxLines: 2,
        },
        {
          type: "box",
          layout: "horizontal",
          margin: "md",
          contents: [
            { type: "text", text: "ความเข้ากัน:", size: "xs", color: "#64748b", flex: 2 },
            { type: "text", text: `${scorePercent}%`, size: "lg", color: "#22d3ee", weight: "bold", flex: 1, align: "end" },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0d1117",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#a78bfa",
          action: {
            type: "uri",
            label: "ดูข้อเสนอ",
            uri: `${appUrl}/app/marketplace`,
          },
          height: "sm",
        },
      ],
    },
  };
}

// ── Notification Functions ─────────────────────────────────
const APP_URL = () =>
  process.env.APP_URL || "http://localhost:3001";

/**
 * Send generic LINE text notification
 */
export async function sendLineNotification(
  lineUserId: string,
  text: string
): Promise<LinePushResponse> {
  return pushMessage(lineUserId, [{ type: "text", text }]);
}

/**
 * Send rich Escrow status update via LINE Flex Message
 */
export async function sendEscrowAlert(
  lineUserId: string,
  escrowId: string,
  status: string,
  amount: number = 0
): Promise<LinePushResponse> {
  if (!isLineConfigured()) {
    console.log(`[LINE] Escrow alert skipped: ${escrowId}`);
    return { ok: false, status: 0, message: "Not configured" };
  }

  const bubble = buildEscrowBubble(escrowId, status, amount, APP_URL());
  return pushMessage(lineUserId, [
    {
      type: "flex",
      altText: `Escrow ${escrowId.substring(0, 8)}: ${status}`,
      contents: bubble,
    },
  ]);
}

/**
 * Send AI Barter Match notification via LINE Flex Message
 */
export async function sendMatchNotification(
  lineUserId: string,
  matchedListingTitle: string,
  matchScore: number
): Promise<LinePushResponse> {
  if (!isLineConfigured()) {
    console.log(`[LINE] Match notification skipped`);
    return { ok: false, status: 0, message: "Not configured" };
  }

  const bubble = buildMatchBubble(matchedListingTitle, matchScore, APP_URL());
  return pushMessage(lineUserId, [
    {
      type: "flex",
      altText: `🤖 AI พบคู่แลกเปลี่ยน: ${matchedListingTitle}`,
      contents: bubble,
    },
  ]);
}

/**
 * Notify admin about new business registration
 */
export async function notifyAdminNewBusiness(
  companyName: string,
  email: string,
  country: string
): Promise<void> {
  const adminId = process.env.LINE_ADMIN_USER_ID;
  if (!adminId || !isLineConfigured()) return;

  const text = `🏢 ธุรกิจใหม่สมัครเข้าร่วม!\n\nบริษัท: ${companyName}\nEmail: ${email}\nประเทศ: ${country}\n\nกรุณาตรวจสอบ KYB เพื่ออนุมัติ`;
  await sendLineNotification(adminId, text);
}

/**
 * Notify admin on dispute created
 */
export async function notifyAdminDispute(
  escrowId: string,
  reason: string
): Promise<void> {
  const adminId = process.env.LINE_ADMIN_USER_ID;
  if (!adminId || !isLineConfigured()) return;

  const text = `⚠️ ข้อพิพาทใหม่!\n\nEscrow: ${escrowId.substring(0, 12)}...\nเหตุผล: ${reason}\n\nกรุณาตรวจสอบทันที`;
  await sendLineNotification(adminId, text);
}

/**
 * Verify LINE Webhook signature (for receiving messages)
 */
export function verifyLineSignature(
  body: string,
  signature: string
): boolean {
  const crypto = require("crypto");
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return false;

  const hash = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64");

  return hash === signature;
}

/**
 * Check if LINE is configured
 */
export function isLineConfigured(): boolean {
  return !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
}
