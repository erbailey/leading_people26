import fs from "fs";
import path from "path";
import { Case } from "./types";

const CASES_DIR = path.join(process.cwd(), "cases");

function getPublicCases(): Case[] {
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
 * The value must be base64-encoded JSON (a Case object, or a JSON array of
 * them). Base64 avoids a real footgun with plain JSON in a .env file: dotenv
 * treats an unquoted ` #` as a comment marker, so any case text containing a
 * hashtag (e.g. "#AirbnbWhileBlack") silently truncates the value.
 */
function getPrivateCases(): Case[] {
  const raw = process.env.PRIVATE_CASES_JSON;
  if (!raw) return [];
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    console.error("PRIVATE_CASES_JSON is set but could not be decoded as base64 JSON — ignoring it.");
    return [];
  }
}

export function getAllCases(): Case[] {
  return [...getPublicCases(), ...getPrivateCases()].sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}

export function getCaseById(id: string): Case | undefined {
  return getAllCases().find((c) => c.id === id);
}
