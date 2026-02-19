import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function esc(s: string) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function list(items: string[], color = "#1f7a3a") {
  if (!items?.length) return "<p style='color:#999'>No data</p>";
  return `<ul style="margin:0;padding-left:18px">${items.map((x) =>
    `<li style="margin-bottom:6px;color:#1a2535">${esc(x)}</li>`
  ).join("")}</ul>`;
}

function scoreColor(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "#94a3b8";
  if (n >= 80) return "#1f7a3a";
  if (n >= 60) return "#b86a00";
  return "#b42318";
}

function riskColor(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "#94a3b8";
  if (n >= 70) return "#b42318";
  if (n >= 45) return "#b86a00";
  return "#1f7a3a";
}

function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

function priorityLabel(n: number | null | undefined): string {
  const v = Number(n);
  if (isNaN(v) || n == null) return "No data";
  if (v >= 70) return "Urgent";
  if (v >= 45) return "Focus";
  return "Monitor";
}

function riskLabel(n: number | null | undefined): string {
  const v = Number(n);
  if (isNaN(v) || n == null) return "No data";
  if (v >= 70) return "High";
  if (v >= 45) return "Medium";
  return "Low";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const agent = body.agent as {
      id: string;
      name: string;
      teamName?: string;
      orgName?: string;
    };
    const score = body.score as {
      overallScore: number | null;
      communicationScore: number | null;
      conversionScore: number | null;
      riskScore: number | null;
      coachingPriority: number | null;
      strengths: string[];
      weaknesses: string[];
      keyPatterns: string[];
      createdAt: string;
      windowSize: number;
    } | null;
    const trend = (body.trend ?? []) as { createdAt: string; score: number }[];

    const generatedAt = new Date().toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    color: #1a2535;
    background: #fff;
    padding: 40px 48px;
    line-height: 1.5;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #406184;
    padding-bottom: 20px;
    margin-bottom: 28px;
  }
  .brand { font-size: 18px; font-weight: 800; color: #406184; letter-spacing: -0.5px; }
  .brand-tag { font-size: 11px; color: #64748b; margin-top: 2px; }
  .report-meta { text-align: right; font-size: 11px; color: #64748b; }
  .agent-name { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
  .agent-sub { font-size: 13px; color: #64748b; }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin: 24px 0;
  }
  .kpi-card {
    border: 1px solid #e6e8ee;
    border-radius: 12px;
    padding: 14px 16px;
  }
  .kpi-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    margin-bottom: 6px;
  }
  .kpi-val {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.04em;
  }
  .kpi-sub { font-size: 10px; color: #94a3b8; margin-top: 4px; }
  .section { margin-bottom: 24px; }
  .section-title {
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e6e8ee;
  }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .box {
    border: 1px solid #e6e8ee;
    border-radius: 12px;
    padding: 16px;
  }
  .box-title {
    font-size: 12px;
    font-weight: 750;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f0f2f7;
  }
  .coaching-box {
    background: rgba(64,97,132,0.05);
    border-left: 3px solid #406184;
    border-radius: 0 8px 8px 0;
    padding: 12px 16px;
    font-size: 13px;
    color: #1a2535;
    margin-bottom: 14px;
    line-height: 1.7;
  }
  .pattern-chip {
    display: inline-block;
    background: rgba(184,106,0,0.07);
    border: 1px solid rgba(184,106,0,0.2);
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 11px;
    color: #b86a00;
    margin: 3px 4px 3px 0;
  }
  .trend-table { width: 100%; border-collapse: collapse; }
  .trend-table th, .trend-table td {
    text-align: left;
    padding: 7px 10px;
    font-size: 12px;
    border-bottom: 1px solid #f0f2f7;
  }
  .trend-table th {
    font-weight: 800;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    background: #f8fafc;
  }
  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e6e8ee;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #94a3b8;
  }
  .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="brand">TalkScope</div>
    <div class="brand-tag">Conversation Intelligence OS</div>
  </div>
  <div class="report-meta">
    <div>Agent Performance Report</div>
    <div style="margin-top:4px">${generatedAt}</div>
  </div>
</div>

<div style="margin-bottom:24px">
  <div class="agent-name">${esc(agent.name)}</div>
  <div class="agent-sub">
    ${agent.teamName ? esc(agent.teamName) : ""}
    ${agent.orgName ? ` · ${esc(agent.orgName)}` : ""}
    ${score ? ` · Score window: last ${score.windowSize} conversations` : ""}
  </div>
</div>

${score ? `
<div class="kpi-grid">
  <div class="kpi-card">
    <div class="kpi-label">Overall</div>
    <div class="kpi-val" style="color:${scoreColor(score.overallScore)}">${fmt(score.overallScore)}</div>
    <div class="kpi-sub">${new Date(score.createdAt).toLocaleDateString()}</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Communication</div>
    <div class="kpi-val" style="color:${scoreColor(score.communicationScore)}">${fmt(score.communicationScore)}</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Conversion</div>
    <div class="kpi-val" style="color:${scoreColor(score.conversionScore)}">${fmt(score.conversionScore)}</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Risk Signal</div>
    <div class="kpi-val" style="color:${riskColor(score.riskScore)}">${fmt(score.riskScore)}</div>
    <div class="kpi-sub">${riskLabel(score.riskScore)}</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Coaching Priority</div>
    <div class="kpi-val" style="color:${riskColor(score.coachingPriority)}">${fmt(score.coachingPriority)}</div>
    <div class="kpi-sub">${priorityLabel(score.coachingPriority)}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Strengths & Areas to Improve</div>
  <div class="two-col">
    <div class="box">
      <div class="box-title" style="color:#1f7a3a">✓ Strengths</div>
      ${list(score.strengths)}
    </div>
    <div class="box">
      <div class="box-title" style="color:#b42318">✗ Areas to Improve</div>
      ${list(score.weaknesses)}
    </div>
  </div>
</div>

${score.keyPatterns?.length ? `
<div class="section">
  <div class="section-title">Coaching Focus & Key Patterns</div>
  <div class="coaching-box">
    Coaching priority: <strong>${priorityLabel(score.coachingPriority)}</strong> —
    Risk level: <strong>${riskLabel(score.riskScore)}</strong> (${fmt(score.riskScore)})
  </div>
  <div>
    ${score.keyPatterns.map((p) => `<span class="pattern-chip">⚠ ${esc(p)}</span>`).join("")}
  </div>
</div>
` : ""}

` : `
<div class="box" style="margin-bottom:24px;text-align:center;padding:24px;color:#94a3b8">
  No score data available. Generate a score first.
</div>
`}

${trend.length >= 2 ? `
<div class="section">
  <div class="section-title">Score History</div>
  <table class="trend-table">
    <thead>
      <tr><th>Date</th><th>Score</th></tr>
    </thead>
    <tbody>
      ${trend.slice(-10).reverse().map((t) => `
        <tr>
          <td>${new Date(t.createdAt).toLocaleDateString()}</td>
          <td style="font-weight:700;color:${scoreColor(t.score)}">${t.score.toFixed(1)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</div>
` : ""}

<div class="footer">
  <div>Agent ID: ${esc(agent.id)}</div>
  <div>TalkScope · Conversation Intelligence OS · ${generatedAt}</div>
</div>

</body>
</html>`;

    // Return HTML for client-side print-to-PDF
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Report-Name": `TalkScope_${agent.name.replace(/\s+/g, "_")}_Report.pdf`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
