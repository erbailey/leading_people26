"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Case, ChatMessage } from "@/lib/types";

type StoredState = {
  currentStageIndex: number;
  stages: Record<string, ChatMessage[]>;
};

function storageKey(caseId: string) {
  return `case-prep:${caseId}`;
}

function emptyState(caseData: Case): StoredState {
  const stages: Record<string, ChatMessage[]> = {};
  for (const s of caseData.stages) stages[s.id] = [];
  return { currentStageIndex: 0, stages };
}

function isStageComplete(messages: ChatMessage[]) {
  return (
    messages.length >= 2 && messages[messages.length - 1].role === "assistant"
  );
}

export default function CasePrepFlow({ caseData }: { caseData: Case }) {
  const [state, setState] = useState<StoredState>(() => emptyState(caseData));
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseOpen, setCaseOpen] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Load persisted progress on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(caseData.id));
      if (raw) {
        const parsed = JSON.parse(raw) as StoredState;
        setState(parsed);
      }
    } catch {
      // ignore corrupt storage, fall back to empty state
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData.id]);

  // Persist on every change, once initial load has happened.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey(caseData.id), JSON.stringify(state));
    } catch {
      // storage full or unavailable — progress just won't persist
    }
  }, [state, loaded, caseData.id]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.currentStageIndex, state.stages]);

  const stage = caseData.stages[state.currentStageIndex];
  const messages = state.stages[stage.id] ?? [];
  const completedHere = isStageComplete(messages);
  const maxUnlockedIndex = caseData.stages.reduce((max, s, i) => {
    if (i === 0) return max;
    const prevComplete = isStageComplete(state.stages[caseData.stages[i - 1].id] ?? []);
    return prevComplete ? Math.max(max, i) : max;
  }, 0);
  const isLastStage = state.currentStageIndex === caseData.stages.length - 1;

  function goToStage(index: number) {
    if (index > maxUnlockedIndex) return;
    setError(null);
    setDraft("");
    setState((s) => ({ ...s, currentStageIndex: index }));
  }

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setState((s) => ({
      ...s,
      stages: { ...s.stages, [stage.id]: nextMessages },
    }));
    setDraft("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseData.id,
          stageId: stage.id,
          messages: nextMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setState((s) => ({
        ...s,
        stages: {
          ...s.stages,
          [stage.id]: [...nextMessages, { role: "assistant", content: data.reply }],
        },
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  function resetProgress() {
    if (!confirm("Clear all your progress on this case? This can't be undone.")) return;
    const fresh = emptyState(caseData);
    setState(fresh);
    setDraft("");
    setError(null);
  }

  if (!loaded) return null;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10 lg:flex-row">
      {/* Case text panel */}
      <aside className="lg:w-[36%] lg:shrink-0">
        <div className="lg:sticky lg:top-6">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
            ← All cases
          </Link>
          <h2 className="mt-2 text-lg font-semibold text-neutral-900">{caseData.title}</h2>
          {caseData.source && (
            <p className="text-sm text-neutral-500">{caseData.source}</p>
          )}

          <button
            onClick={() => setCaseOpen((v) => !v)}
            className="mt-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 lg:hidden"
          >
            {caseOpen ? "Hide case text ▲" : "Show case text ▼"}
          </button>

          <div
            className={`${
              caseOpen ? "block" : "hidden"
            } mt-4 max-h-[70vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-800 lg:block`}
          >
            {caseData.fullText}
          </div>
        </div>
      </aside>

      {/* Prep flow */}
      <section className="flex-1">
        {/* Stepper */}
        <ol className="flex flex-wrap gap-2">
          {caseData.stages.map((s, i) => {
            const unlocked = i <= maxUnlockedIndex;
            const active = i === state.currentStageIndex;
            const complete = isStageComplete(state.stages[s.id] ?? []);
            return (
              <li key={s.id}>
                <button
                  disabled={!unlocked}
                  onClick={() => goToStage(i)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : unlocked
                      ? "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      : "border-neutral-200 text-neutral-300"
                  }`}
                >
                  {complete && !active ? "✓ " : ""}
                  {i + 1}. {s.title}
                </button>
              </li>
            );
          })}
        </ol>

        {/* Guiding question */}
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
          <h3 className="text-base font-semibold text-neutral-900">{stage.title}</h3>
          <p className="mt-2 text-neutral-700">{stage.guidingQuestion}</p>
        </div>

        {/* Chat thread */}
        <div className="mt-6 space-y-4">
          {messages.length === 0 && (
            <p className="text-sm text-neutral-500">
              Write your own answer below to start. This isn&apos;t graded on polish — say what
              you actually think.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-800"
              }`}
            >
              {m.content}
            </div>
          ))}
          {sending && (
            <div className="max-w-[85%] rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-400">
              Thinking…
            </div>
          )}
          <div ref={threadEndRef} />
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {/* Composer */}
        <div className="mt-4 flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              messages.length === 0
                ? "Your answer…"
                : "Respond, or push back…"
            }
            rows={3}
            className="flex-1 resize-none rounded-lg border border-neutral-300 p-3 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="self-end rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>

        {/* Advance / finish */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={resetProgress}
            className="text-xs text-neutral-400 hover:text-neutral-600"
          >
            Reset progress on this case
          </button>

          {completedHere && !isLastStage && (
            <button
              onClick={() => goToStage(state.currentStageIndex + 1)}
              className="rounded-lg border border-neutral-900 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-900 hover:text-white"
            >
              Move to next step →
            </button>
          )}
          {completedHere && isLastStage && (
            <p className="text-sm font-medium text-neutral-700">
              You&apos;ve worked through every stage — you&apos;re ready for class discussion.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
