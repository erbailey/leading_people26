# Case Prep

A guided, Socratic case-prep tool for class discussion. Students never get a summary or
"the answer" — they work through a fixed sequence of stages for a case, writing their own
position at each step, and the model only pushes back (missed stakeholders, unexamined
assumptions, contradicting facts) until they've committed to a real read.

No student login. Progress is saved in the browser's `localStorage`, per case, per device —
nothing is stored on the server.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

You need an Anthropic API key from https://console.anthropic.com (API Keys page). Create
`.env.local` in this folder (never committed — see `.gitignore`) with:

```
ANTHROPIC_API_KEY=sk-ant-...
```

(`.env.local.example` shows the format.)

## Adding a new case

Add a new JSON file to `/cases`, e.g. `cases/my-new-case.json`. No code changes needed — it
will automatically appear on the home page. Shape:

```json
{
  "id": "my-new-case",
  "title": "Case Title",
  "source": "© Your Name, Year",
  "fullText": "The full case text, as one string...",
  "stages": [
    {
      "id": "situation",
      "title": "Stage title shown in the stepper",
      "guidingQuestion": "The question shown to the student for this stage.",
      "hint": "Optional. Instructor-only notes on what matters here — used to steer the model's follow-up questions. Never shown to the student."
    }
  ]
}
```

Stages run in array order and unlock one at a time — a student must send at least one
message and get a reply in a stage before the next one unlocks. There's no fixed number of
stages or required stage names; design the sequence to fit the shape of the case (a single
protagonist's decision might be Situation → Key Facts → Stakeholders → Decision Point →
Alternatives → Recommendation; a multi-person case might be one stage per person plus a
synthesis stage at the end, as in `many-keys-for-many-doors.json`).

The model is instructed (see `lib/prompt.ts`) to never summarize the case or state a
recommendation — it only asks questions. The `hint` field is the main lever for steering
what it probes for on a given case.

## Deployment (GitHub + Vercel)

1. Push this repo to GitHub (see the setup notes you were given separately).
2. In Vercel, "Add New Project" → import the GitHub repo. Vercel auto-detects Next.js; no
   config needed.
3. In the Vercel project's Settings → Environment Variables, add `ANTHROPIC_API_KEY` with
   your key. This keeps the key server-side only — it's never sent to students' browsers.
4. Deploy. Students use the Vercel URL directly — no login required.
5. To add a case later: add a new file to `/cases`, commit, push — Vercel redeploys
   automatically.
