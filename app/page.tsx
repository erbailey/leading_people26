import Link from "next/link";
import { getAllCases, getPrivateCasesStatus } from "@/lib/cases";

// Render this page fresh on every request rather than baking it in at build
// time. The case list depends on PRIVATE_CASES_JSON, and a build-cache-reused
// redeploy could otherwise keep serving a stale list from before the env var
// was last updated.
export const dynamic = "force-dynamic";

export default function Home() {
  const cases = getAllCases();
  const privateStatus = getPrivateCasesStatus();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-neutral-900">Case Prep</h1>
      <p className="mt-2 text-neutral-600">
        Pick your case. You&apos;ll work through it step by step — the tool won&apos;t summarize
        the case for you, but it will push back on your thinking as you go.
      </p>

      {privateStatus.state === "unset" && (
        <p className="mt-6 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Diagnostic: PRIVATE_CASES_JSON is not set in this deployment&apos;s environment.
        </p>
      )}
      {privateStatus.state === "error" && (
        <p className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          Diagnostic: PRIVATE_CASES_JSON is set ({privateStatus.rawLength} characters) but failed
          to decode: {privateStatus.message}
        </p>
      )}
      {privateStatus.state === "ok" && (
        <p className="mt-6 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Diagnostic: PRIVATE_CASES_JSON loaded {privateStatus.count} case
          {privateStatus.count === 1 ? "" : "s"} successfully.
        </p>
      )}

      <ul className="mt-6 space-y-3">
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
