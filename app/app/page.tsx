"use client";

import { useEffect, useMemo, useState } from "react";

const MODES = [
  { id: "coaching", label: "Coaching" },
  { id: "sales", label: "Sales" },
  { id: "callcenter", label: "Call Center" },
  { id: "leadership", label: "Leadership" },
  { id: "interview", label: "Interview" },
] as const;

type ModeId = (typeof MODES)[number]["id"];

type Report = {
  summary: string;
  topics: string[];
  strengths: string[];
  improvements: string[];
  next_questions: string[];
  action_items: string[];
};

type Usage = {
  used: number;
  remaining: number;
  globalUsed: number;
  globalRemaining: number;
  limit: number;
};

type HistoryItem = {
  id: string;
  createdAt: string;
  mode: string;
  summary: string;
  transcriptChars: number;
};

export default function AppPage() {
  const [mode, setMode] = useState<ModeId>("coaching");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [usage, setUsage] = useState<Usage | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const canAnalyze = useMemo(() => text.trim().length >= 200, [text]);

  async function loadUsage() {
    try {
      const res = await fetch("/api/usage", { method: "GET" });
      if (!res.ok) return;
      setUsage((await res.json()) as Usage);
    } catch {
      // ignore for MVP
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch("/api/history", { method: "GET" });
      if (!res.ok) return;
      setHistory((await res.json()) as HistoryItem[]);
    } catch {
      // ignore for MVP
    }
  }

  useEffect(() => {
    loadUsage();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAnalyze() {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, mode }),
      });

      if (!res.ok) throw new Error(await res.text());

      setReport((await res.json()) as Report);
      await loadUsage();
      await loadHistory();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      await loadUsage();
      await loadHistory();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold">TalkScope</div>
          <a className="text-sm text-neutral-600 hover:text-neutral-900" href="/">
            Back to home
          </a>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-2">
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Analyze transcript</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Paste a conversation transcript, choose a mode, get a structured report.
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-neutral-500">Mode</div>
              <select
                className="mt-1 rounded-2xl border bg-white px-3 py-2 text-sm"
                value={mode}
                onChange={(e) => setMode(e.target.value as ModeId)}
              >
                {MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-neutral-500 text-right">
              <div>{text.trim().length} chars</div>
              {usage && (
                <div>
                  Today: {usage.used}/{usage.limit} • Left: {usage.remaining}
                </div>
              )}
            </div>
          </div>

          <textarea
            className="mt-4 h-[360px] w-full resize-none rounded-2xl border bg-white p-4 text-sm outline-none focus:ring-2"
            placeholder={`Agent: Hello, thank you for calling...\nCustomer: I'm really frustrated because...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
              onClick={onAnalyze}
              disabled={!canAnalyze || loading}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border bg-white p-4 text-sm">
              <div className="font-semibold">Error</div>
              <div className="mt-1 text-neutral-600">{error}</div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Report</h2>
              <p className="mt-2 text-sm text-neutral-600">Structured output you can act on.</p>
            </div>

            {usage && (
              <div className="rounded-2xl border bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                Global today: {usage.globalUsed} • Remaining: {usage.globalRemaining}
				{report && (
  <div className="mt-3 flex justify-end">
    <button
      className="rounded-2xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
      onClick={async () => {
        const res = await fetch("/api/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, report }),
        });
        if (!res.ok) return;

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "talkscope-report.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }}
    >
      Download PDF
    </button>
  </div>
)}

              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="mt-4 rounded-3xl border bg-neutral-50 p-4">
              <div className="text-xs font-semibold text-neutral-500">Recent reports</div>
              <div className="mt-2 space-y-2">
                {history.slice(0, 6).map((h) => (
                  <button
                    key={h.id}
                    className="w-full rounded-2xl border bg-white p-3 text-left text-sm hover:bg-neutral-50"
                    onClick={async () => {
                      const res = await fetch(`/api/history/${h.id}`);
                      if (!res.ok) return;
                      const data = await res.json();
                      setReport(data.report);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{h.mode}</div>
                      <div className="text-xs text-neutral-500">
                        {new Date(h.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-neutral-600 line-clamp-2">{h.summary}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!report ? (
            <div className="mt-6 rounded-3xl border bg-neutral-50 p-6 text-sm text-neutral-600">
              Paste a transcript and click Analyze.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <Block title="Summary" text={report.summary} />
              <ListBlock title="Key topics" items={report.topics} />
              <ListBlock title="Strengths" items={report.strengths} />
              <ListBlock title="Improvements" items={report.improvements} />
              <ListBlock title="Next questions" items={report.next_questions} />
              <ListBlock title="Action items" items={report.action_items} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border bg-neutral-50 p-5">
      <div className="text-xs font-semibold text-neutral-500">{title}</div>
      <div className="mt-2 text-sm text-neutral-800">{text}</div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border bg-neutral-50 p-5">
      <div className="text-xs font-semibold text-neutral-500">{title}</div>
      <ul className="mt-2 space-y-2 text-sm text-neutral-800">
        {items.map((x, i) => (
          <li key={`${title}-${i}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-neutral-900" />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
