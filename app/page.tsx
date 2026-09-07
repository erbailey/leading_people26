import Link from "next/link";
import { getAllCases } from "@/lib/cases";

export default function Home() {
  const cases = getAllCases();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-neutral-900">Case Prep</h1>
      <p className="mt-2 text-neutral-600">
        Pick your case. You&apos;ll work through it step by step — the tool won&apos;t summarize
        the case for you, but it will push back on your thinking as you go.
      </p>

      <ul className="mt-10 space-y-3">
        {cases.map((c) => (
          <li key={c.id}>
            <Link
              href={`/case/${c.id}`}
              className="block rounded-lg border border-neutral-200 px-5 py-4 transition hover:border-neutral-400 hover:bg-neutral-50"
            >
              <div className="font-medium text-neutral-900">{c.title}</div>
              {c.source && <div className="mt-1 text-sm text-neutral-500">{c.source}</div>}
            </Link>
          </li>
        ))}
        {cases.length === 0 && (
          <li className="text-neutral-500">No cases loaded yet.</li>
        )}
      </ul>
    </main>
  );
}
