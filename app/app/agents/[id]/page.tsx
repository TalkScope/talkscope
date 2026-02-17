"use client";

import { useEffect, useMemo, useState } from "react";

type AgentDTO = {
  id: string;
  name: string;
  email?: string | null;
  createdAt: string;
  team?: { id: string; name: string; organization?: { id: string; name: string } | null } | null;
};

type ScoreDTO = {
  createdAt: string;
  windowSize: number;
  overallScore: number;
  communicationScore: number;
  conversionScore: number;
  riskScore: number;
  coachingPriority: number;
  strengths: string[];
  weaknesses: string[];
  keyPatterns: string[];
};

type ConversationDTO = {
  id: string;
  createdAt: string;
  score?: number | null;
  excerpt: string;
};

type PatternDTO = {
  id: string;
  createdAt: string;
  windowSize: number;
};

type AgentMetaResponse = {
  ok: boolean;
  agent?: AgentDTO;
  lastScore?: ScoreDTO | null;
  trend?: { createdAt: string; score: number; windowSize: number }[];
  conversations?: ConversationDTO[];
  lastPattern?: PatternDTO | null;
  error?: string;
};

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(1);
}

function safeJsonParse(text: string) {
  // если вдруг прилетит HTML (например 404-страница), покажем понятную ошибку
  const t = text.trim();
  if (t.startsWith("<!DOCTYPE") || t.startsWith("<html") || t.startsWith("<")) {
    throw new Error("API returned HTML instead of JSON (route not found or server error).");
  }
  return JSON.parse(t);
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border px-3 py-1 text-xs text-neutral-600">
      {children}
    </span>
  );
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          {desc && <div className="mt-1 text-sm text-neutral-500">{desc}</div>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, Number(value)));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600">{label}</span>
        <span className="font-semibold">{fmt(v)}</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-neutral-100">
        <div className="h-2 rounded-full bg-black" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export default function AgentPage({ params }: { params: { id: string } }) {
  const agentId = decodeURIComponent(params.id);

  const [data, setData] = useState<AgentMetaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/meta/agent?id=${encodeURIComponent(agentId)}`, { cache: "no-store" });
      const text = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${text.slice(0, 200)}`);
      const j = safeJsonParse(text) as AgentMetaResponse;
      if (!j.ok) throw new Error(j.error || "Agent API returned ok:false");
      setData(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to load agent");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const agent = data?.agent;
  const lastScore = data?.lastScore;

  const headerTitle = useMemo(() => {
    if (!agent) return "Agent Intelligence";
    return agent.name || `Agent ${agent.id}`;
  }, [agent]);

  const subline = useMemo(() => {
    if (!agent) return "Profile, scores, risk, coaching priority, and pattern insights.";
    const team = agent.team?.name ? `Team: ${agent.team.name}` : null;
    const org = agent.team?.organization?.name ? `Org: ${agent.team.organization.name}` : null;
    return [org, team].filter(Boolean).join(" - ") || "Agent profile";
  }, [agent]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{headerTitle}</h1>
          <p className="text-sm text-neutral-500">{subline}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>Agent ID: <span className="font-mono">{agentId}</span></Badge>
            {agent?.email ? <Badge>{agent.email}</Badge> : <Badge>Email: —</Badge>}
            {agent?.createdAt ? <Badge>Created: {new Date(agent.createdAt).toLocaleString()}</Badge> : null}
          </div>
        </div>

        <div className="flex gap-2">
          <a href="/app/dashboard" className="rounded-lg border px-4 py-2 text-sm font-medium">
            Dashboard
          </a>
          <a href="/app/patterns" className="rounded-lg border px-4 py-2 text-sm font-medium">
            Pattern Intelligence
          </a>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      )}

      {!err && !agent && (
        <div className="mt-6 rounded-xl border p-4 text-sm text-neutral-700">
          Loading agent...
        </div>
      )}

      {/* Score snapshot */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card
          title="Latest Score Snapshot"
          desc="How this agent performs across key dimensions."
        >
          {!lastScore ? (
            <div className="text-sm text-neutral-600">
              No score snapshots yet. Generate scoring first.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>At: {new Date(lastScore.createdAt).toLocaleString()}</Badge>
                <Badge>Window: {lastScore.windowSize}</Badge>
              </div>

              <ScoreBar label="Overall" value={lastScore.overallScore} />
              <ScoreBar label="Communication" value={lastScore.communicationScore} />
              <ScoreBar label="Conversion" value={lastScore.conversionScore} />
              <ScoreBar label="Risk" value={lastScore.riskScore} />
              <ScoreBar label="Coaching priority" value={lastScore.coachingPriority} />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold">Strengths</div>
                  <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                    {(lastScore.strengths || []).slice(0, 6).map((x, i) => (
                      <li key={i}>- {x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-semibold">Weaknesses</div>
                  <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                    {(lastScore.weaknesses || []).slice(0, 6).map((x, i) => (
                      <li key={i}>- {x}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold">Key patterns</div>
                <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                  {(lastScore.keyPatterns || []).slice(0, 6).map((x, i) => (
                    <li key={i}>- {x}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Pattern Intelligence"
          desc="Recurring issues with evidence examples from conversations."
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Last pattern: {data?.lastPattern ? new Date(data.lastPattern.createdAt).toLocaleString() : "—"}</Badge>
              <Badge>Window: {data?.lastPattern?.windowSize ?? "—"}</Badge>
            </div>

            <div className="text-sm text-neutral-700">
              This runs the Pattern Engine on the latest conversation window for this agent.
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={`/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&windowSize=20`}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Open Patterns (window 20)
              </a>
              <a
                href={`/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&windowSize=30`}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Open Patterns (window 30)
              </a>
              <a
                href={`/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&windowSize=50`}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Open Patterns (window 50)
              </a>
            </div>

            <div className="text-xs text-neutral-500">
              Note: generation happens on the patterns page. Здесь мы даём быстрые ссылки, чтобы не вводить refId вручную.
            </div>
          </div>
        </Card>
      </div>

      {/* Recent conversations */}
      <div className="mt-6">
        <Card
          title="Recent conversations"
          desc="Short excerpts for quick scanning. Full transcript stored in DB."
        >
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Conversation ID</th>
                  <th className="px-3 py-2 text-left">Excerpt</th>
                </tr>
              </thead>
              <tbody>
                {(data?.conversations ?? []).map((c) => (
                  <tr key={c.id} className="border-t align-top">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                      {c.id}
                    </td>
                    <td className="px-3 py-2 text-neutral-700">
                      {c.excerpt}
                    </td>
                  </tr>
                ))}
                {(!data || (data.conversations ?? []).length === 0) && (
                  <tr>
                    <td className="px-3 py-3 text-neutral-600" colSpan={3}>
                      No conversations found for this agent.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
