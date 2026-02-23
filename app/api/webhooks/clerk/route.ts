import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn("RESEND_API_KEY not set — skipping email"); return; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "TalkScope <notifications@talk-scope.com>", to, subject, html }),
  });
  if (!res.ok) console.error("Resend error:", await res.text());
}

function welcomeEmail(name: string) {
  const firstName = name.split(" ")[0] || "there";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f8fc;font-family:'Segoe UI',system-ui,sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e7ef;">
  <div style="background:#0b1220;padding:24px 32px;display:flex;align-items:center;gap:12px;">
    <div style="width:36px;height:36px;border-radius:9px;background:#406184;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:13px;">TS</div>
    <span style="color:white;font-weight:800;font-size:16px;letter-spacing:-0.02em;">TalkScope</span>
  </div>
  <div style="padding:32px;">
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#0b1220;letter-spacing:-0.02em;">Welcome, ${firstName}!</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.7;">Your TalkScope workspace is ready. Get your first AI insights in 3 steps.</p>
    <div style="border:1px solid #e4e7ef;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div style="display:flex;gap:14px;padding:16px 18px;">
        <div style="width:28px;height:28px;border-radius:8px;background:#406184;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">1</div>
        <div><div style="font-weight:700;font-size:14px;color:#0b1220;margin-bottom:2px;">Import your agents</div><div style="font-size:13px;color:#64748b;">Upload a CSV or add agents manually in the Upload section.</div></div>
      </div>
      <div style="display:flex;gap:14px;padding:16px 18px;border-top:1px solid #e4e7ef;">
        <div style="width:28px;height:28px;border-radius:8px;background:#406184;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">2</div>
        <div><div style="font-weight:700;font-size:14px;color:#0b1220;margin-bottom:2px;">Upload conversations</div><div style="font-size:13px;color:#64748b;">Upload .txt transcripts or audio files. AI scores them automatically.</div></div>
      </div>
      <div style="display:flex;gap:14px;padding:16px 18px;border-top:1px solid #e4e7ef;">
        <div style="width:28px;height:28px;border-radius:8px;background:#406184;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;">3</div>
        <div><div style="font-weight:700;font-size:14px;color:#0b1220;margin-bottom:2px;">Run Batch Scoring</div><div style="font-size:13px;color:#64748b;">Dashboard → Batch Engine → Run to 100% to score all agents.</div></div>
      </div>
    </div>
    <a href="https://talk-scope.com/app/dashboard" style="display:block;text-align:center;padding:13px 22px;background:#406184;color:white;text-decoration:none;border-radius:10px;font-weight:800;font-size:15px;margin-bottom:20px;">Open Dashboard →</a>
    <div style="display:flex;gap:16px;justify-content:center;">
      <a href="https://talk-scope.com/guide" style="font-size:13px;color:#406184;text-decoration:none;">Documentation</a>
      <span style="color:#e4e7ef;">|</span>
      <a href="https://talk-scope.com/demo" style="font-size:13px;color:#406184;text-decoration:none;">Live Demo</a>
      <span style="color:#e4e7ef;">|</span>
      <a href="mailto:support@talk-scope.com" style="font-size:13px;color:#406184;text-decoration:none;">Get help</a>
    </div>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #e4e7ef;text-align:center;">
    <span style="font-size:12px;color:#94a3b8;">TalkScope · talk-scope.com · You received this because you signed up.</span>
  </div>
</div>
</body></html>`;
}

function adminEmail(data: { email: string; name: string; createdAt: string; userId: string }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f8fc;font-family:'Segoe UI',system-ui,sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e7ef;">
  <div style="background:#0b1220;padding:24px 32px;display:flex;align-items:center;gap:12px;">
    <div style="width:36px;height:36px;border-radius:9px;background:#406184;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:13px;">TS</div>
    <span style="color:white;font-weight:800;font-size:16px;letter-spacing:-0.02em;">TalkScope</span>
    <span style="margin-left:auto;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#4ade80;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">New signup</span>
  </div>
  <div style="padding:32px;">
    <h2 style="margin:0 0 6px;font-size:20px;font-weight:900;color:#0b1220;">New user registered</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Someone just signed up on TalkScope.</p>
    <div style="background:#f6f8fc;border:1px solid #e4e7ef;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;width:80px;">Name</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#0b1220;">${data.name || "—"}</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Email</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#406184;">${data.email}</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Time</td><td style="padding:6px 0;font-size:14px;color:#0b1220;">${data.createdAt}</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;">User ID</td><td style="padding:6px 0;font-size:12px;color:#94a3b8;font-family:monospace;">${data.userId}</td></tr>
      </table>
    </div>
    <a href="https://dashboard.clerk.com" style="display:inline-block;padding:11px 22px;background:#406184;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">View in Clerk →</a>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #e4e7ef;text-align:center;">
    <span style="font-size:12px;color:#94a3b8;">TalkScope · talk-scope.com</span>
  </div>
</div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const svix_id        = req.headers.get("svix-id") ?? "";
  const svix_timestamp = req.headers.get("svix-timestamp") ?? "";
  const svix_signature = req.headers.get("svix-signature") ?? "";
  const body = await req.text();

  let event: any;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, { "svix-id": svix_id, "svix-timestamp": svix_timestamp, "svix-signature": svix_signature });
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created") {
    const user      = event.data;
    const email     = user.email_addresses?.[0]?.email_address ?? "unknown";
    const firstName = user.first_name ?? "";
    const lastName  = user.last_name ?? "";
    const name      = [firstName, lastName].filter(Boolean).join(" ") || email;
    const userId    = user.id;
    const createdAt = new Date(user.created_at).toLocaleString("en-GB", {
      timeZone: "UTC", dateStyle: "medium", timeStyle: "short",
    }) + " UTC";

    // 1. Auto-create Organization + default Team
    try {
      const orgName = name !== email ? `${name}'s Workspace` : "My Workspace";
      const org = await prisma.organization.create({
        data: {
          name:        orgName,
          clerkUserId: userId,
          teams:       { create: { name: "Default Team" } },
        },
      });
      console.log(`Auto-created org "${orgName}" (${org.id}) for ${email}`);
    } catch (e: any) {
      console.error("Failed to auto-create org:", e?.message);
    }

    // 2. Welcome email to user
    if (email !== "unknown") {
      await sendEmail(email, "Welcome to TalkScope — your workspace is ready", welcomeEmail(name));
      console.log(`Welcome email sent to: ${email}`);
    }

    // 3. Admin notification
    const notifyEmail = process.env.NOTIFY_EMAIL;
    if (notifyEmail) {
      await sendEmail(notifyEmail, `New TalkScope signup: ${name}`, adminEmail({ email, name, createdAt, userId }));
    }
  }

  return NextResponse.json({ ok: true });
}
