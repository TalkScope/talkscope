import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Send email via Resend ─────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TalkScope <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
  }
}

// ── Email template ────────────────────────────────────────────
function newUserEmail(data: {
  email: string;
  name: string;
  createdAt: string;
  userId: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f8fc;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e7ef;">

    <!-- Header -->
    <div style="background:#0b1220;padding:24px 32px;display:flex;align-items:center;gap:12px;">
      <div style="width:36px;height:36px;border-radius:9px;background:#406184;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:13px;">TS</div>
      <span style="color:white;font-weight:800;font-size:16px;letter-spacing:-0.02em;">TalkScope</span>
      <span style="margin-left:auto;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#4ade80;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">New user</span>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <h2 style="margin:0 0 6px;font-size:20px;font-weight:900;color:#0b1220;letter-spacing:-0.02em;">
        🎉 New signup!
      </h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Someone just registered on TalkScope.</p>

      <!-- User card -->
      <div style="background:#f6f8fc;border:1px solid #e4e7ef;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;width:80px;">Name</td>
            <td style="padding:6px 0;font-size:14px;font-weight:600;color:#0b1220;">${data.name || "—"}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Email</td>
            <td style="padding:6px 0;font-size:14px;font-weight:600;color:#406184;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Time</td>
            <td style="padding:6px 0;font-size:14px;color:#0b1220;">${data.createdAt}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">User ID</td>
            <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-family:monospace;">${data.userId}</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <a href="https://dashboard.clerk.com" style="display:inline-block;padding:11px 22px;background:#406184;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
        View in Clerk dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #e4e7ef;text-align:center;">
      <span style="font-size:12px;color:#94a3b8;">TalkScope · talk-scope.com</span>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ── Webhook handler ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Verify signature
  const svix_id        = req.headers.get("svix-id") ?? "";
  const svix_timestamp = req.headers.get("svix-timestamp") ?? "";
  const svix_signature = req.headers.get("svix-signature") ?? "";

  const body = await req.text();

  let event: any;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id":        svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle user.created
  if (event.type === "user.created") {
    const user = event.data;

    const email      = user.email_addresses?.[0]?.email_address ?? "unknown";
    const firstName  = user.first_name ?? "";
    const lastName   = user.last_name ?? "";
    const name       = [firstName, lastName].filter(Boolean).join(" ") || email;
    const createdAt  = new Date(user.created_at).toLocaleString("en-GB", {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " UTC";
    const userId = user.id;

    const notifyEmail = process.env.NOTIFY_EMAIL;
    if (!notifyEmail) {
      console.warn("NOTIFY_EMAIL not set — skipping notification");
    } else {
      await sendEmail(
        notifyEmail,
        `🎉 New TalkScope signup: ${name}`,
        newUserEmail({ email, name, createdAt, userId })
      );
      console.log(`Notification sent for new user: ${email}`);
    }
  }

  return NextResponse.json({ ok: true });
}
