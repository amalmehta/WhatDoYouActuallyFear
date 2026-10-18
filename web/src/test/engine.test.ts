// Mirrors the Mac app's EngineTests.swift.
import { describe, expect, it } from "vitest";
import { cheers, fears, lifeAreas, questions, rules, sections, sources } from "../model/content";
import { areaExample, averageRelief, cheerFor, emptyProfile, nextQuest, plan, rank, realityLine, scores, sectionOf, status, topFears, xp, type Quest } from "../model/engine";
import { fearColor, hsbToHsl, sourceColor } from "../model/theme";
import type { Profile, QuestCompletion } from "../model/types";

const sample = (): Profile => ({ ...emptyProfile(), answers: { q01: 4, q02: 4, q06: 3, q12: 2 } });
const completion = (q: Quest, predicted = 5, actual = 3): QuestCompletion =>
  ({ date: new Date().toISOString(), fear: q.fear, title: q.title, xp: q.xp, predicted, actual, note: "" });

describe("content", () => {
  it("every fear has a full ladder and at least two statements", () => {
    for (const f of fears) {
      expect(f.ladder).toHaveLength(rules.stepXP.length);
      expect(questions.filter((q) => (q.weights[f.id] ?? 0) > 0).length).toBeGreaterThanOrEqual(2);
    }
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
  });

  it("shades are unique within each family, and every color is distinct", () => {
    for (const family of new Set(fears.map((f) => f.family))) {
      const shades = fears.filter((f) => f.family === family).map((f) => f.shade);
      expect(new Set(shades).size).toBe(shades.length);
    }
    for (const scheme of ["light", "dark"] as const) {
      const colors = [...fears.map((f) => fearColor(f.id, scheme)), ...sources.filter((s) => s.group !== "unknown").map((s) => sourceColor(s.id, scheme))];
      expect(new Set(colors).size).toBe(colors.length);
    }
  });

  it("converts HSB to HSL", () => {
    expect(hsbToHsl(0, 1, 1)).toBe("hsl(0.0 100.0% 50.0%)");
    expect(hsbToHsl(0, 0, 1)).toBe("hsl(0.0 0.0% 100.0%)");
  });
});

describe("scoring", () => {
  it("all-zero answers score zero and keep library order", () => {
    const s = scores({});
    expect(s.every((x) => x.percent === 0)).toBe(true);
    expect(s.map((x) => x.fear)).toEqual(fears.map((f) => f.id));
  });

  it("all-max answers score 100", () => {
    const answers = Object.fromEntries(questions.map((q) => [q.id, 4]));
    expect(scores(answers).every((x) => x.percent === 100)).toBe(true);
  });

  it("answers point to the right fear", () => {
    expect(topFears({ q12: 4, q13: 4 }, 1)).toEqual(["wrongChoice"]);
    expect(topFears({ q08: 4, q09: 4 }, 1)).toEqual(["conflict"]);
  });

  it("clamps out-of-range answers", () => {
    const top = scores({ q02: 99 })[0];
    expect(top.fear).toBe("failure");
    expect(top.percent).toBeLessThanOrEqual(100);
  });
});

describe("plan and progress", () => {
  it("builds a root quest plus five steps per fear, clamped to 1–3 fears", () => {
    for (const n of [1, 2, 3]) {
      const p = plan(sample(), n);
      expect(p.fears).toHaveLength(n);
      for (const fp of p.fears) {
        expect(fp.quests).toHaveLength(6);
        expect(fp.quests[0].kind.type).toBe("source");
      }
    }
    expect(plan(sample(), 9).fears).toHaveLength(3);
    expect(plan(sample(), 0).fears).toHaveLength(1);
  });

  it("root quest follows the chosen source", () => {
    const profile = sample();
    const top = topFears(profile.answers, 1)[0];
    profile.sources[top] = "modelled";
    expect(plan(profile, 1).fears[0].quests[0].title).toBe(sources.find((s) => s.id === "modelled")!.exercise.title);
    delete profile.sources[top];
    expect(plan(profile, 1).fears[0].quests[0].title).toBe(sources.find((s) => s.id === "unsure")!.exercise.title);
  });

  it("unlocks in order; boss needs one full ladder", () => {
    const profile = sample();
    const p = plan(profile, 2);
    const quests = p.fears[0].quests;
    expect(status(quests[0], p, profile)).toEqual({ type: "available" });
    expect(status(quests[1], p, profile)).toEqual({ type: "locked" });
    expect(status(p.boss!, p, profile)).toEqual({ type: "locked" });
    profile.accepted[quests[0].id] = 7;
    expect(status(quests[0], p, profile)).toEqual({ type: "accepted", predicted: 7 });
    for (const q of quests) profile.completions[q.id] = completion(q);
    expect(status(p.boss!, p, profile)).toEqual({ type: "available" });
  });

  it("boss uses the goal or falls back", () => {
    const profile = sample();
    profile.goal = "  Start the podcast  ";
    expect(plan(profile, 1).boss?.title).toBe("Start the podcast");
    profile.goal = " ";
    expect(plan(profile, 1).boss?.title).toBe("The step you've been avoiding");
  });

  it("every step has a distinct example for every area", () => {
    for (const f of fears) {
      for (const a of lifeAreas) {
        const list = [1, 2, 3, 4, 5].map((n) => areaExample(f.id, a.id, n));
        expect(list.every((t) => typeof t === "string" && t.trim().length > 0 && t.length <= 140)).toBe(true);
        expect(new Set(list).size).toBe(5);
      }
    }
    expect(areaExample("failure", "career", 0)).toBeUndefined();
    expect(areaExample("failure", "career", 6)).toBeUndefined();
  });

  it("uses the chosen area's examples; ids don't change with the area", () => {
    const profile = sample();
    profile.lifeArea = "health";
    const quests = plan(profile, 1).fears[0].quests;
    expect(quests[0].example).toBeUndefined();
    for (const q of quests.slice(1)) {
      if (q.kind.type !== "step") throw new Error("expected a step");
      expect(q.example).toEqual({ area: "health", text: areaExample(q.fear, "health", q.kind.n) });
    }
    profile.lifeArea = "money";
    const money = plan(profile, 1).fears[0].quests[1];
    expect(money.example?.area).toBe("money");
    expect(money.example?.text).not.toBe(quests[1].example?.text);
    expect(money.id).toBe(quests[1].id);
    expect(plan(profile, 1).boss?.example).toBeUndefined();
  });

  it("next quest prefers what you started", () => {
    const profile = sample();
    const p = plan(profile, 2);
    expect(nextQuest(p, profile)?.id).toBe(p.fears[0].quests[0].id);
    const second = p.fears[1].quests[0];
    profile.accepted[second.id] = 6;
    expect(nextQuest(p, profile)?.id).toBe(second.id);
    for (const q of p.fears.flatMap((fp) => fp.quests)) profile.completions[q.id] = completion(q);
    profile.accepted = {};
    expect(nextQuest(p, profile)?.kind.type).toBe("boss");
    profile.completions.boss = completion(p.boss!);
    expect(nextQuest(p, profile)).toBeUndefined();
  });

  it("parts cover every statement; encouragement matches the Mac app's rules", () => {
    expect(sections.reduce((n, s) => n + (s.end - s.start), 0)).toBe(questions.length);
    expect([0, 5, 6, 10, 11, 16, 17, 21].map(sectionOf)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(cheerFor("failure.step1")).toBe(cheerFor("failure.step1"));
    expect(cheers).toContain(cheerFor("boss"));
    // Same pick as Swift: sum of code points modulo the list length.
    const sum = [..."failure.source"].reduce((n, c) => n + c.codePointAt(0)!, 0);
    expect(cheerFor("failure.source")).toBe(cheers[sum % cheers.length]);
    expect(realityLine(8, 3)).toContain("overestimated by 5");
    expect(realityLine(4, 4)).toContain("about as scary");
    expect(realityLine(3, 6)).toContain("scarier than expected");
  });

  it("XP, ranks and relief", () => {
    expect(rank(0).title).toBe("Just Starting");
    expect(rank(49).next).toBe(50);
    expect(rank(150).title).toBe("Stepping Out");
    expect(rank(5000).next).toBeNull();
    const profile = sample();
    expect(averageRelief(profile)).toBeNull();
    const quests = plan(profile, 1).fears[0].quests;
    profile.completions[quests[0].id] = completion(quests[0], 8, 4);
    profile.completions[quests[1].id] = completion(quests[1], 6, 4);
    expect(xp(profile)).toBe(quests[0].xp + quests[1].xp);
    expect(averageRelief(profile)).toBe(3);
  });
});
