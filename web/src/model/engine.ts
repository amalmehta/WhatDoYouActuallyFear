// Pure logic: scoring, plan building, quest unlocking and XP. A port of the Mac app's Engine.swift.
import { examples, fears, lifeAreas, questions, rules, sources } from "./content";
import type { FearId, FearInfo, LifeAreaId, Profile, QuestCompletion, Source, SourceId } from "./types";

export interface FearScore { fear: FearId; percent: number }

export type QuestKind = { type: "source" } | { type: "step"; n: number } | { type: "boss" };

export interface Quest {
  id: string;
  fear: FearId;
  kind: QuestKind;
  title: string;
  detail: string;
  xp: number;
  /** What this step looks like in the person's chosen life area (ladder steps only). */
  example?: { area: LifeAreaId; text: string };
}

/** The example for one ladder step (1–5) in one life area. */
export const areaExample = (fear: FearId, area: LifeAreaId, step: number): string | undefined =>
  examples[fear]?.[area]?.[step - 1];

export type QuestStatus =
  | { type: "locked" }
  | { type: "available" }
  | { type: "accepted"; predicted: number }
  | { type: "done"; completion: QuestCompletion };

export interface FearPlan { score: FearScore; fear: FearId; source: SourceId; quests: Quest[] }
export interface GamePlan { fears: FearPlan[]; boss: Quest | null }
export interface Rank { title: string; floor: number; next: number | null }

const fearById = new Map(fears.map((f) => [f.id, f]));
const sourceById = new Map(sources.map((s) => [s.id, s]));

export const fearInfo = (id: FearId): FearInfo => fearById.get(id)!;
export const sourceInfo = (id: SourceId): Source => sourceById.get(id)!;
export const lifeAreaTitle = (id: Profile["lifeArea"]) => lifeAreas.find((a) => a.id === id)!.title;

export function emptyProfile(): Profile {
  return { lifeArea: "career", goal: "", answers: {}, sources: {}, sourceNotes: {}, accepted: {}, completions: {}, createdAt: new Date().toISOString() };
}

/** Each fear's score is the weighted share of the maximum possible agreement. Highest first; ties keep library order. */
export function scores(answers: Record<string, number>): FearScore[] {
  const got = new Map<FearId, number>();
  const max = new Map<FearId, number>();
  for (const q of questions) {
    const answer = Math.min(4, Math.max(0, answers[q.id] ?? 0));
    for (const [fear, weight] of Object.entries(q.weights) as [FearId, number][]) {
      got.set(fear, (got.get(fear) ?? 0) + answer * weight);
      max.set(fear, (max.get(fear) ?? 0) + 4 * weight);
    }
  }
  return fears
    .map((f, index) => {
      const total = max.get(f.id) ?? 0;
      // Swift's .rounded() rounds half away from zero; Math.round matches for positive numbers.
      const percent = total > 0 ? Math.round(((got.get(f.id) ?? 0) / total) * 100) : 0;
      return { fear: f.id, percent, index };
    })
    .sort((a, b) => (a.percent !== b.percent ? b.percent - a.percent : a.index - b.index))
    .map(({ fear, percent }) => ({ fear, percent }));
}

export const topFears = (answers: Record<string, number>, count = rules.maxFocus) =>
  scores(answers).slice(0, count).map((s) => s.fear);

export function plan(profile: Profile, focusCount: number): GamePlan {
  const focus = Math.max(1, Math.min(rules.maxFocus, focusCount));
  const fearPlans = scores(profile.answers).slice(0, focus).map((score): FearPlan => {
    const info = fearInfo(score.fear);
    const source = profile.sources[score.fear] ?? "unsure";
    const exercise = sourceInfo(source).exercise;
    const quests: Quest[] = [
      { id: `${score.fear}.source`, fear: score.fear, kind: { type: "source" }, title: exercise.title, detail: exercise.detail, xp: rules.sourceXP },
      ...info.ladder.map((step, i): Quest => ({
        id: `${score.fear}.step${i + 1}`, fear: score.fear, kind: { type: "step", n: i + 1 }, title: step.title, detail: step.detail, xp: rules.stepXP[i],
        ...(areaExample(score.fear, profile.lifeArea, i + 1) !== undefined
          ? { example: { area: profile.lifeArea, text: areaExample(score.fear, profile.lifeArea, i + 1)! } }
          : {}),
      })),
    ];
    return { score, fear: score.fear, source, quests };
  });
  return { fears: fearPlans, boss: bossQuest(profile, fearPlans[0]?.fear) };
}

export function bossQuest(profile: Profile, top: FearId | undefined): Quest | null {
  if (!top) return null;
  const goal = profile.goal.trim();
  if (!goal) {
    return {
      id: "boss", fear: top, kind: { type: "boss" }, xp: rules.bossXP,
      title: "The step you've been avoiding",
      detail: `Take the one step in ${lifeAreaTitle(profile.lifeArea).toLowerCase()} that fear has kept you from. You've built the courage — now use it.`,
    };
  }
  return {
    id: "boss", fear: top, kind: { type: "boss" }, xp: rules.bossXP, title: goal,
    detail: "This is what you said you'd do if you weren't afraid. Do it, or the first real piece of it.",
  };
}

/** Quests in a fear's plan unlock one at a time. The boss unlocks once any one plan is fully done. */
export function status(quest: Quest, gamePlan: GamePlan, profile: Profile): QuestStatus {
  const done = profile.completions[quest.id];
  if (done) return { type: "done", completion: done };
  const predicted = profile.accepted[quest.id];
  if (predicted !== undefined) return { type: "accepted", predicted };
  if (quest.kind.type === "boss") {
    const anyPlanDone = gamePlan.fears.some((fp) => fp.quests.every((q) => profile.completions[q.id]));
    return { type: anyPlanDone ? "available" : "locked" };
  }
  const fearPlan = gamePlan.fears.find((fp) => fp.fear === quest.fear);
  const index = fearPlan?.quests.findIndex((q) => q.id === quest.id) ?? -1;
  if (!fearPlan || index < 0) return { type: "locked" };
  if (index === 0) return { type: "available" };
  return { type: profile.completions[fearPlan.quests[index - 1].id] ? "available" : "locked" };
}

export const xp = (profile: Profile) => Object.values(profile.completions).reduce((sum, c) => sum + c.xp, 0);

export function rank(points: number): Rank {
  let index = 0;
  rules.ranks.forEach((r, i) => { if (points >= r.floor) index = i; });
  const next = index + 1 < rules.ranks.length ? rules.ranks[index + 1].floor : null;
  return { title: rules.ranks[index].title, floor: rules.ranks[index].floor, next };
}

/** Average of (predicted − actual) across finished quests: how much less scary reality was. */
export function averageRelief(profile: Profile): number | null {
  const all = Object.values(profile.completions);
  if (all.length === 0) return null;
  return all.reduce((sum, c) => sum + (c.predicted - c.actual), 0) / all.length;
}
