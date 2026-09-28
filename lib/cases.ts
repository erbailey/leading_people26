import fs from "fs";
import path from "path";
import zlib from "zlib";
import { Case } from "./types";

const CASES_DIR = path.join(process.cwd(), "cases");

function getPublicCases(): Case[] {
  // git doesn't track empty directories, so /cases can be entirely absent
  // from a deploy if every case file inside it has been removed.
  if (!fs.existsSync(CASES_DIR)) return [];
  const files = fs.readdirSync(CASES_DIR).filter((f) => f.endsWith(".json"));
  return files.map(
    (f) => JSON.parse(fs.readFileSync(path.join(CASES_DIR, f), "utf-8")) as Case
  );
}

/**
 * Licensed/third-party cases that can't be committed to a public repo.
 * Set PRIVATE_CASES_JSON as an environment variable — locally in .env.local,
 * and in Vercel's project settings for production. Never write this content
 * into a file under /cases.
 *
 * The value must be gzip-compressed, then base64-encoded JSON (a Case
 * object, or a JSON array of them). Two reasons, not one:
 * - Plain JSON in a .env file breaks: dotenv treats an unquoted ` #` as a
 *   comment marker, so any case text containing a hashtag (e.g.
 *   "#AirbnbWhileBlack") silently truncates the value.
 * - Plain base64 (no gzip) inflates the payload ~33%, which pushed us past
 *   Vercel's 64KB per-variable limit once there were a handful of cases.
 *   Gzip first so there's real headroom as more cases get added.
 */
export type PrivateCasesStatus =
  | { state: "unset" }
  | { state: "error"; message: string; rawLength: number }
  | { state: "ok"; count: number };

function loadPrivateCases(): { cases: Case[]; status: PrivateCasesStatus } {
  const raw = process.env.PRIVATE_CASES_JSON;
  if (!raw) return { cases: [], status: { state: "unset" } };
  try {
    const compressed = Buffer.from(raw, "base64");
    const decoded = zlib.gunzipSync(compressed).toString("utf-8");
    const parsed = JSON.parse(decoded);
    const cases = Array.isArray(parsed) ? parsed : [parsed];
    return { cases, status: { state: "ok", count: cases.length } };
  } catch (err) {
    return {
      cases: [],
      status: {
        state: "error",
        message: err instanceof Error ? err.message : String(err),
        rawLength: raw.length,
      },
    };
  }
}

export function getPrivateCasesStatus(): PrivateCasesStatus {
  return loadPrivateCases().status;
}

function getPrivateCases(): Case[] {
  return loadPrivateCases().cases;
}

export function getAllCases(): Case[] {
  return [...getPublicCases(), ...getPrivateCases()].sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}

export function getCaseById(id: string): Case | undefined {
  return getAllCases().find((c) => c.id === id);
}
