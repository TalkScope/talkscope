// app/app/agents/[id]/page.tsx
import Link from "next/link";

export default async function AgentIntelligencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: agentId } = await params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent Intelligence</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Profile, scores, risks, coaching priority, and pattern insights.
          </p>
          <div className="mt-3 text-xs text-neutral-500">
            Agent ID: <span className="font-mono">{agentId}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Link
            href={`/app/patterns?level=agent&refId=${encodeURIComponent(agentId)}&window=50`}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white text-center"
          >
            Generate Patterns (Agent)
          </Link>

          <Link
            href="/app/dashboard"
            className="rounded-lg border px-4 py-2 text-sm font-medium text-center"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">What this page will become</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Сейчас здесь базовая навигация. Дальше добавим: score trend, последние разговоры, последние паттерны,
          и блоки “coaching plan” и “evidence”.
        </p>
      </div>
    </div>
  );
}
