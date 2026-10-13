// Sample data shown with ?demo (and used for README screenshots). Matches the Mac app's ScreenshotRenderer.
import { questions } from "./content";
import { emptyProfile, plan, topFears } from "./engine";
import type { Profile } from "./types";

export function demoProfile(): Profile {
  const profile = emptyProfile();
  profile.lifeArea = "career";
  profile.goal = "Pitch my own project at work";
  const high: Record<string, number> = { q01: 4, q02: 4, q05: 3, q06: 4, q12: 4, q13: 3, q21: 3, q22: 2, q03: 2, q11: 2 };
  for (const q of questions) profile.answers[q.id] = high[q.id] ?? 1;
  const top = topFears(profile.answers);
  profile.sources[top[0]] = "criticism";
  profile.sources[top[1]] = "comparison";
  profile.sources[top[2]] = "pastEvent";
  const gamePlan = plan(profile, 3);
  const first = gamePlan.fears[0].quests;
  const day = 86_400_000;
  const notes = ["The critic sounded a lot like my old maths teacher.", "Awkward for five minutes, then fun.", "They had one useful note and liked the rest."];
  first.slice(0, 3).forEach((quest, i) => {
    profile.completions[quest.id] = {
      date: new Date(Date.now() - (5 - i) * day).toISOString(), fear: quest.fear, title: quest.title, xp: quest.xp,
      predicted: [6, 7, 8][i], actual: [3, 4, 4][i], note: notes[i],
    };
  });
  profile.accepted[first[3].id] = 8;
  const second = gamePlan.fears[1].quests[0];
  profile.completions[second.id] = {
    date: new Date(Date.now() - day).toISOString(), fear: second.fear, title: second.title, xp: second.xp,
    predicted: 5, actual: 2, note: "",
  };
  return profile;
}
