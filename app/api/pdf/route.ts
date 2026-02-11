import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

type Report = {
  summary: string;
  topics: string[];
  strengths: string[];
  improvements: string[];
  next_questions: string[];
  action_items: string[];
};

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function list(items: string[]) {
  return `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const mode = String(body?.mode ?? "coaching");
  const report = body?.report as Report | undefined;

  if (!report?.summary) {
    return new NextResponse("Missing report", { status: 400 });
  }

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>TalkScope Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 28px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    .meta { font-size: 12px; color: #666; margin-bottom: 18px; }
    .card { border: 1px solid #e5e5e5; border-radius: 14px; padding: 14px 16px; margin: 10px 0; background: #fafafa; }
    .title { font-size: 12px; font-weight: 700; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .04em; }
    .text { font-size: 13px; line-height: 1.45; }
    ul { margin: 8px 0 0 18px; padding: 0; }
    li { margin: 6px 0; font-size: 13px; line-height: 1.35; }
    .footer { margin-top: 18px; font-size: 11px; color: #777; }
  </style>
</head>
<body>
  <h1>TalkScope Report</h1>
  <div class="meta">Mode: ${esc(mode)} • Generated: ${esc(new Date().toLocaleString())}</div>

  <div class="card">
    <div class="title">Summary</div>
    <div class="text">${esc(report.summary)}</div>
  </div>

  <div class="card"><div class="title">Key topics</div>${list(report.topics || [])}</div>
  <div class="card"><div class="title">Strengths</div>${list(report.strengths || [])}</div>
  <div class="card"><div class="title">Improvements</div>${list(report.improvements || [])}</div>
  <div class="card"><div class="title">Next questions</div>${list(report.next_questions || [])}</div>
  <div class="card"><div class="title">Action items</div>${list(report.action_items || [])}</div>

  <div class="footer">TalkScope • Structured conversation analysis</div>
</body>
</html>`;

  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
  format: "A4",
  printBackground: true,
  margin: { top: "18mm", right: "12mm", bottom: "18mm", left: "12mm" },
});

// Convert Uint8Array -> ArrayBuffer for NextResponse body typing
const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength);

return new NextResponse(body, {

      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="talkscope-report.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
