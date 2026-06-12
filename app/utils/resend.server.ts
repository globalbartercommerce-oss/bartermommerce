/**
 * Resend Email Utility
 * Transactional email for registration, escrow, and barter events
 */

import { Resend } from "resend";

// ── Resend Client ──────────────────────────────────────────
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }
  resendClient = new Resend(apiKey);
  return resendClient;
}

const FROM = () => {
  const email = process.env.RESEND_FROM_EMAIL || "noreply@globalbarter.com";
  const name = process.env.RESEND_FROM_NAME || "Global Barter Commerce";
  return `${name} <${email}>`;
};

// ── Brand Colors ──────────────────────────────────────────
const BRAND = {
  primary: "#22d3ee",      // cyan-400
  secondary: "#a78bfa",    // violet-400
  dark: "#070a13",
  cardBg: "#0d1117",
  text: "#e2e8f0",
  muted: "#64748b",
};

// ── Email Templates ───────────────────────────────────────
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Global Barter Commerce</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: ${BRAND.dark}; color: ${BRAND.text}; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { display: inline-flex; align-items: center; gap: 10px;
            text-decoration: none; color: ${BRAND.primary}; }
    .logo-icon { width: 40px; height: 40px; border-radius: 10px;
                 background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary});
                 display: inline-flex; align-items: center; justify-content: center;
                 font-weight: 900; font-size: 20px; color: #fff; }
    .logo-text { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .card { background: ${BRAND.cardBg}; border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px; padding: 32px; margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 8px; }
    h2 { font-size: 16px; font-weight: 700; color: ${BRAND.primary}; margin-bottom: 16px; }
    p { font-size: 14px; line-height: 1.7; color: ${BRAND.text}; margin-bottom: 12px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px;
             font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
    .badge-primary { background: rgba(34,211,238,0.1); color: ${BRAND.primary};
                     border: 1px solid rgba(34,211,238,0.2); }
    .badge-warning { background: rgba(251,191,36,0.1); color: #fbbf24;
                     border: 1px solid rgba(251,191,36,0.2); }
    .badge-success { background: rgba(52,211,153,0.1); color: #34d399;
                     border: 1px solid rgba(52,211,153,0.2); }
    .btn { display: inline-block; padding: 14px 28px; border-radius: 12px;
           font-size: 14px; font-weight: 700; text-decoration: none;
           background: ${BRAND.primary}; color: #000; margin-top: 8px; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06);
               margin: 24px 0; }
    .info-row { display: flex; justify-content: space-between;
                padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .info-label { font-size: 12px; color: ${BRAND.muted}; font-weight: 600; }
    .info-value { font-size: 13px; color: #fff; font-weight: 700; }
    .footer { text-align: center; font-size: 12px; color: ${BRAND.muted}; margin-top: 32px; }
    .amount { font-size: 28px; font-weight: 900; color: ${BRAND.primary}; }
    .amount-unit { font-size: 14px; font-weight: 700; color: ${BRAND.muted};
                   margin-left: 4px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">U</div>
        <span class="logo-text">UNICORN GLOBAL</span>
      </div>
    </div>
    ${content}
    <div class="footer">
      <p>© 2026 Global Barter Commerce. All rights reserved.</p>
      <p style="margin-top: 4px;">
        ส่งโดย Unicorn Global Commerce · 
        <a href="https://globalbarter.com" style="color: ${BRAND.primary}; text-decoration: none;">globalbarter.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Email Functions ────────────────────────────────────────

/**
 * Welcome email sent after successful business registration
 */
export async function sendWelcomeEmail(
  to: string,
  companyName: string
): Promise<void> {
  if (!isResendConfigured()) {
    console.log(`[Email] Welcome email skipped (not configured): ${to}`);
    return;
  }

  const resend = getResendClient();
  const html = baseTemplate(`
    <div class="card">
      <span class="badge badge-primary">🎉 ยินดีต้อนรับ</span>
      <h1 style="margin-top: 16px;">ยินดีต้อนรับสู่ Global Barter Commerce!</h1>
      <h2>${companyName}</h2>
      <p>บัญชีธุรกิจของท่านได้ถูกสร้างเรียบร้อยแล้ว ท่านสามารถเริ่มต้นใช้งานระบบการแลกเปลี่ยนเครดิตระดับโลกได้ทันที</p>

      <hr class="divider">

      <h2 style="color: #fff; font-size: 14px;">ขั้นตอนถัดไป:</h2>
      <p>1. ✅ <strong>กรอกข้อมูลโปรไฟล์</strong> — ยืนยัน KYB เพื่อรับโควต้าเต็ม</p>
      <p>2. 💳 <strong>เติมเครดิต</strong> — รับ 1,000 UNC Coin แรกฟรีสำหรับสมาชิกใหม่</p>
      <p>3. 🛒 <strong>โพสต์สินค้า/บริการ</strong> — เข้าสู่ตลาดแลกเปลี่ยนระดับโลก</p>

      <hr class="divider">

      <a href="${process.env.APP_URL || "http://localhost:3001"}/app/dashboard" class="btn">
        เริ่มต้นใช้งาน Dashboard →
      </a>
    </div>
  `);

  await resend.emails.send({
    from: FROM(),
    to: [to],
    subject: `ยินดีต้อนรับ ${companyName} สู่ Global Barter Commerce! 🎉`,
    html,
  });

  console.log(`[Email] Welcome sent to ${to}`);
}

/**
 * Escrow status change notification
 */
export async function sendEscrowNotification(
  to: string,
  escrowId: string,
  status: string,
  companyName: string,
  amount?: number
): Promise<void> {
  if (!isResendConfigured()) {
    console.log(`[Email] Escrow notification skipped: ${escrowId}`);
    return;
  }

  const resend = getResendClient();
  const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
    funded: { label: "ได้รับเงินมัดจำแล้ว", color: "badge-primary", icon: "💰" },
    goods_delivered: { label: "สินค้าส่งมอบแล้ว", color: "badge-warning", icon: "📦" },
    completed: { label: "ดำเนินการสำเร็จ", color: "badge-success", icon: "✅" },
    disputed: { label: "มีข้อพิพาท", color: "badge-warning", icon: "⚠️" },
    cancelled: { label: "ยกเลิกแล้ว", color: "badge-warning", icon: "❌" },
  };
  const s = statusLabels[status] || { label: status, color: "badge-primary", icon: "📋" };

  const html = baseTemplate(`
    <div class="card">
      <span class="badge ${s.color}">${s.icon} ${s.label}</span>
      <h1 style="margin-top: 16px;">อัปเดต Escrow Contract</h1>
      
      <div style="margin: 20px 0;">
        <div class="info-row">
          <span class="info-label">Escrow ID</span>
          <span class="info-value" style="font-family: monospace; font-size: 12px;">${escrowId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">สถานะ</span>
          <span class="info-value">${s.label}</span>
        </div>
        ${amount ? `
        <div class="info-row">
          <span class="info-label">มูลค่า</span>
          <span class="info-value">
            <span class="amount" style="font-size: 20px;">${amount.toLocaleString()}</span>
            <span class="amount-unit">UNC</span>
          </span>
        </div>` : ""}
      </div>

      <a href="${process.env.APP_URL || "http://localhost:3001"}/app/escrows" class="btn">
        ดูรายละเอียด Escrow →
      </a>
    </div>
  `);

  await resend.emails.send({
    from: FROM(),
    to: [to],
    subject: `${s.icon} Escrow ${s.label} — ${companyName}`,
    html,
  });

  console.log(`[Email] Escrow notification sent: ${escrowId} → ${status}`);
}

/**
 * Barter match found notification
 */
export async function sendBarterMatchEmail(
  to: string,
  matchedListingTitle: string,
  matchScore: number,
  companyName: string
): Promise<void> {
  if (!isResendConfigured()) {
    console.log(`[Email] Barter match notification skipped`);
    return;
  }

  const resend = getResendClient();
  const html = baseTemplate(`
    <div class="card">
      <span class="badge badge-primary">🤖 AI พบคู่แลกเปลี่ยน</span>
      <h1 style="margin-top: 16px;">พบสินค้าที่น่าสนใจสำหรับท่าน!</h1>
      
      <div style="margin: 20px 0; padding: 20px; background: rgba(34,211,238,0.05); 
                  border: 1px solid rgba(34,211,238,0.15); border-radius: 12px;">
        <p style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 8px;">
          "${matchedListingTitle}"
        </p>
        <p style="margin: 0; color: ${BRAND.muted};">ความเข้ากันได้: 
          <strong style="color: ${BRAND.primary};">${Math.round(matchScore * 100)}%</strong>
        </p>
      </div>

      <p>ระบบ AI ของเราได้วิเคราะห์และพบสินค้า/บริการที่เข้ากันกับธุรกิจของ ${companyName} กรุณาตรวจสอบและเริ่มต้นการเจรจาได้เลย</p>

      <a href="${process.env.APP_URL || "http://localhost:3001"}/app/marketplace" class="btn">
        ดูข้อเสนอนี้ →
      </a>
    </div>
  `);

  await resend.emails.send({
    from: FROM(),
    to: [to],
    subject: `🤖 AI พบคู่แลกเปลี่ยนใหม่! ความเข้ากัน ${Math.round(matchScore * 100)}%`,
    html,
  });
}

/**
 * Check if Resend is configured
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
