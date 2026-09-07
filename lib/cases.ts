import fs from "fs";
import path from "path";
import { Case } from "./types";

const CASES_DIR = path.join(process.cwd(), "cases");

export function getAllCases(): Case[] {
  const files = fs.readdirSync(CASES_DIR).filter((f) => f.endsWith(".json"));
  return files
    .map((f) => JSON.parse(fs.readFileSync(path.join(CASES_DIR, f), "utf-8")) as Case)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getCaseById(id: string): Case | undefined {
  return getAllCases().find((c) => c.id === id);
}
