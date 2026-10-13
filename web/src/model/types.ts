export type FamilyId = "selfWorth" | "social" | "uncertainty" | "connection";
export type FearId =
  | "failure" | "notEnough" | "foundOut"
  | "rejection" | "judgment" | "conflict"
  | "unknown" | "wrongChoice" | "losingControl"
  | "beingLeft" | "beingSeen";
export type SourceId = "criticism" | "pastEvent" | "modelled" | "instability" | "comparison" | "unsure";
export type LifeAreaId = "career" | "relationships" | "friendships" | "health" | "creativity" | "money" | "purpose";

export interface Family { id: FamilyId; title: string; hue: number }
export interface QuestTemplate { title: string; detail: string }

export interface FearInfo {
  id: FearId;
  name: string;
  family: FamilyId;
  shade: number;
  summary: string;
  howItKeepsYouStuck: string[];
  coreBelief: string;
  reframe: string;
  ladder: QuestTemplate[];
}

export interface Source {
  id: SourceId;
  group: "people" | "events" | "unknown";
  shade: number;
  title: string;
  howItFormed: string;
  exercise: QuestTemplate;
}

export interface LifeArea { id: LifeAreaId; title: string }

export interface Question {
  id: string;
  text: string;
  weights: Partial<Record<FearId, number>>;
}

export interface Rules {
  stepXP: number[];
  sourceXP: number;
  bossXP: number;
  maxFocus: number;
  ranks: { floor: number; title: string }[];
}

/** Everything the person has told the app, plus quest progress. Same shape as the Mac app's Profile.json. */
export interface Profile {
  lifeArea: LifeAreaId;
  goal: string;
  answers: Record<string, number>;
  sources: Partial<Record<FearId, SourceId>>;
  sourceNotes: Partial<Record<FearId, string>>;
  /** Quest id -> predicted fear (0–10), set when accepted. */
  accepted: Record<string, number>;
  completions: Record<string, QuestCompletion>;
  createdAt: string;
}

export interface QuestCompletion {
  date: string;
  fear: FearId;
  title: string;
  xp: number;
  predicted: number;
  actual: number;
  note: string;
}

export interface FeedbackEntry {
  date: string;
  kind: string;
  text: string;
}
