"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Level = "agent" | "team" | "org";

function isLevel(x: string): x is Level {
  return x === "agent" || x === "team" || x === "org";
}

function PatternsInner() {
  const sp = useSearchParams();

  const [level, setLevel] = useState<Level>("agent");
  const [refId, setRefId] = useState("");
  const [windowSize, setWindowSize] = useState(50);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // auto-fill from URL: /app/patterns?level=agent&refId=...&window=50
  useEffect(() => {
    const qLevel = sp.get("level") || "";
    const qRefId = sp.get("refId") || "";
    const qWin = sp.get("window") || "";

    if (qLevel && isLevel(qLevel)) setLevel(qLevel);
    if (qRefId) setRefId(qRefId);

    const n = Number(qWin);
    if (qWin && Number.isFinite(n) && n >= 10 && n <= 100) setWindowSize(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const canGenerate = useMemo(() => {
    return refId.trim().length > 0 && windowSize >= 10 && windowSize <= 100;
  }, [refId, windowSize]);

  async function generate() {
    setLoading(true);
    setErr(null);
    setResult(null);

    try {
      const r = await fetch("/api/patterns/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          refId: refId.trim(),
          windowSize,
        }),
      });

      const txt = await r.text();
      if (!r.ok) {
        throw new Error(`Generate failed ${r.status}: ${txt.slice(0, 300)}`);
      }

      let j: any;
      try {
        j = JSON.parse(txt);
      } catch {
        throw new Error(`Invalid JSON from API: ${txt.slice(0, 200)}`);
      }

      if (j?.ok === false && j?.error) throw new Error(j.error);

      setResult(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to generate patterns");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pattern Intelligence</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Generate recurring-issues report for an agent, team, or whole organization.
          </p>
        </div>

        <a
          href="/app/dashboard"
          className="rounded-lg border px-4 py-2 text-sm font-medium text-center"
        >
          Back to Dashboard
        </a>
      </div>

      <div className="mt-6 rounded-2xl border p-5">
        <div className="grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-2">
            <div className="text-xs text-neutral-500">Level</div>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
            >
              <option value="agent">agent</option>
              <option value="team">team</option>
              <option value="org">org</option>
            </select>
          </div>

          <div className="md:col-span-7">
            <div className="text-xs text-neutral-500">refId</div>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
              placeholder={
                level === "agent"
                  ? "agentId"
                  : level === "team"
                  ? "teamId"
                  : "organizationId"
              }
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
            />
            <div className="mt-1 text-xs text-neutral-500">
              Tip: refId подставится автоматически, если ты пришёл со страницы агента.
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-neutral-500">Window</div>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
            >
              {[20, 30, 50, 80, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <button
              onClick={generate}
              disabled={!canGenerate || loading}
              className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "..." : "Generate"}
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Report</h2>

        {!result && !loading && (
          <p className="mt-2 text-sm text-neutral-600">
            Нажми Generate. Система возьмёт последние {windowSize} разговоров по выбранному уровню и соберёт повторяющиеся
            слабые места с evidence по conversation_id.
          </p>
        )}

        {loading && (
          <p className="mt-2 text-sm text-neutral-600">Generating...</p>
        )}

        {result && (
          <pre className="mt-4 overflow-auto rounded-xl border bg-neutral-50 p-4 text-xs leading-relaxed">
{JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function PatternIntelligencePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-neutral-600">
          Loading Pattern Intelligence...
        </div>
      }
    >
      <PatternsInner />
    </Suspense>
  );
}
