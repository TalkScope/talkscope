export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl border bg-neutral-50" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">TalkScope</div>
              <div className="text-xs text-neutral-500">Conversation Analyzer</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
            <a className="hover:text-neutral-900" href="#how">How it works</a>
            <a className="hover:text-neutral-900" href="#use">Use cases</a>
            <a className="hover:text-neutral-900" href="#faq">FAQ</a>
          </nav>

          <a className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-neutral-50" href="/app">
            Open app
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-14 pt-12 md:pb-20 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-neutral-50 px-3 py-1 text-xs text-neutral-600">
              <span className="h-2 w-2 rounded-full bg-neutral-900" />
              Transcript in → insights out
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              See what your conversation really did.
            </h1>

            <p className="mt-4 text-base leading-relaxed text-neutral-600 md:text-lg">
              TalkScope analyzes transcripts and returns a structured report: themes, missed opportunities,
              tone, and actionable next steps. Built for coaching, sales, call centers, leadership, and interviews.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90" href="/app">
                Analyze a transcript
              </a>
              <a className="rounded-2xl border px-5 py-3 text-sm font-semibold hover:bg-neutral-50" href="#how">
                See how it works
              </a>
            </div>

            <div className="mt-6 text-xs text-neutral-500">
              MVP: fast, structured, multi-mode. Auth & billing later.
            </div>
          </div>

          <div className="rounded-3xl border bg-neutral-50 p-6 shadow-sm">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold text-neutral-500">Sample report</div>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border bg-neutral-50 p-3">
                  <div className="text-xs font-semibold">Summary</div>
                  <div className="mt-1 text-sm text-neutral-600">
                    The conversation de-escalated successfully and ended with a clear next step and confirmation.
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border bg-neutral-50 p-3">
                    <div className="text-xs font-semibold">Strengths</div>
                    <div className="mt-1 text-sm text-neutral-600">
                      Clear structure, calm tone, good recap.
                    </div>
                  </div>
                  <div className="rounded-xl border bg-neutral-50 p-3">
                    <div className="text-xs font-semibold">Improve</div>
                    <div className="mt-1 text-sm text-neutral-600">
                      Earlier empathy, tighter action items.
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border bg-neutral-50 p-3">
                  <div className="text-xs font-semibold">Next questions</div>
                  <div className="mt-1 text-sm text-neutral-600">
                    “What would make this resolution feel complete for you?”
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-neutral-500">
              Multi-mode engine: Coaching / Sales / Call Center / Leadership / Interview
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-2 max-w-2xl text-neutral-600">
            Paste transcript → choose mode → get a structured report you can use immediately.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { t: "Paste transcript", d: "Any format. Any language. Clean text works best." },
              { t: "Select mode", d: "Coaching, Sales, Call Center, Leadership, Interview." },
              { t: "Get report", d: "Themes, signals, improvements, next steps." },
            ].map((x) => (
              <div key={x.t} className="rounded-3xl border p-6">
                <div className="text-sm font-semibold">{x.t}</div>
                <div className="mt-2 text-sm text-neutral-600">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="use" className="border-t bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Use cases</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              { t: "Coaching", d: "Patterns, questions quality, transformational moments." },
              { t: "Sales", d: "Objections, discovery gaps, next steps, missed revenue." },
              { t: "Call centers", d: "Empathy timing, compliance, de-escalation, retention." },
              { t: "Leadership & Interviews", d: "Clarity, alignment, decision confidence, bias signals." },
            ].map((x) => (
              <div key={x.t} className="rounded-3xl border bg-white p-6">
                <div className="text-sm font-semibold">{x.t}</div>
                <div className="mt-2 text-sm text-neutral-600">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>

          <div className="mt-8 space-y-3">
            <details className="rounded-3xl border p-6">
              <summary className="cursor-pointer text-sm font-semibold">Do I need audio upload?</summary>
              <div className="mt-2 text-sm text-neutral-600">
                Not for MVP. Start with transcript paste. Audio can be added later.
              </div>
            </details>

            <details className="rounded-3xl border p-6">
              <summary className="cursor-pointer text-sm font-semibold">Is my data stored?</summary>
              <div className="mt-2 text-sm text-neutral-600">
                MVP can run without saving history. Later we’ll add retention controls and “do not store” mode.
              </div>
            </details>
          </div>

          <div className="mt-10 flex items-center justify-between border-t pt-8 text-xs text-neutral-500">
            <div>© {new Date().getFullYear()} TalkScope</div>
            <a className="hover:text-neutral-900" href="/app">Open app</a>
          </div>
        </div>
      </section>
    </main>
  );
}
