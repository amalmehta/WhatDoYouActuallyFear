// The progress file shared with the Mac app: a Profile as JSON, the same shape as the Mac app's Profile.json.
import { fears, lifeAreas, questions, sources } from "./content";
import { fearInfo, topFears } from "./engine";
import type { Profile, QuestCompletion } from "./types";

export const progressFileName = "What Do You Actually Fear Progress.json";

export class ProgressError extends Error {}

const fearIds = new Set<string>(fears.map((f) => f.id));
const sourceIds = new Set<string>(sources.map((s) => s.id));
const areaIds = new Set<string>(lifeAreas.map((a) => a.id));
const questionIds = new Set(questions.map((q) => q.id));

/** Whole-second ISO 8601, which the Mac app's decoder expects. */
const wholeSeconds = (iso: string) => new Date(iso).toISOString().replace(/\.\d+Z$/, "Z");

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]));
  }
  return value;
}

/** The file's text: sorted keys and whole-second dates, readable by both apps. */
export function exportProgress(profile: Profile): string {
  const completions = Object.fromEntries(
    Object.entries(profile.completions).map(([id, c]) => [id, { ...c, date: wholeSeconds(c.date) }]));
  return JSON.stringify(sortKeys({ ...profile, completions, createdAt: wholeSeconds(profile.createdAt) }), null, 2) + "\n";
}

const fail = (message: string): never => { throw new ProgressError(message); };
const notProgress = () => fail("This isn't a What Do You Actually Fear progress file.");
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isInt = (v: unknown, min: number, max: number) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const isDate = (v: unknown) => typeof v === "string" && !Number.isNaN(Date.parse(v));

/** Reads and checks a progress file. Throws ProgressError with a message a person can act on. */
export function parseProgress(text: string): Profile {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return notProgress(); }
  if (!isObject(data)) return notProgress();
  const { lifeArea, goal, answers, sources: src, sourceNotes, accepted, completions, createdAt } = data;
  if (typeof lifeArea !== "string" || !areaIds.has(lifeArea) || typeof goal !== "string" || !isDate(createdAt)
    || !isObject(answers) || !isObject(src) || !isObject(sourceNotes) || !isObject(accepted) || !isObject(completions)) {
    return notProgress();
  }
  const answerKeys = Object.keys(answers);
  if (answerKeys.length === 0) fail("This progress file has no answers in it.");
  if (!answerKeys.every((k) => questionIds.has(k))) fail("This progress file has answers to questions this app doesn't know.");
  if (!Object.values(answers).every((v) => isInt(v, 0, 4))) fail("This progress file has answers out of range.");
  if (!Object.entries(src).every(([k, v]) => fearIds.has(k) && typeof v === "string" && sourceIds.has(v))) notProgress();
  if (!Object.entries(sourceNotes).every(([k, v]) => fearIds.has(k) && typeof v === "string")) notProgress();
  const completionOk = (c: unknown): c is QuestCompletion => isObject(c) && isDate(c.date) && typeof c.fear === "string" && fearIds.has(c.fear)
    && typeof c.title === "string" && typeof c.note === "string" && isInt(c.xp, 0, 100_000);
  if (!Object.values(completions).every(completionOk)) notProgress();
  const ratingsOk = Object.values(accepted).every((v) => isInt(v, 0, 10))
    && Object.values(completions as Record<string, QuestCompletion>).every((c) => isInt(c.predicted, 0, 10) && isInt(c.actual, 0, 10));
  if (!ratingsOk) fail("This progress file has fear ratings out of range.");
  return data as unknown as Profile;
}

/** One line describing what's in a file, shown before it replaces anything. */
export function previewSummary(profile: Profile): string {
  const top = topFears(profile.answers, 1)[0];
  const done = Object.keys(profile.completions).length;
  const date = new Date(profile.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  return `From ${date}. Top fear: ${top ? fearInfo(top).name : "—"}. ${done} quest${done === 1 ? "" : "s"} done.`;
}

/** Downloads the progress file. */
export function downloadProgress(profile: Profile) {
  const url = URL.createObjectURL(new Blob([exportProgress(profile)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = progressFileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
