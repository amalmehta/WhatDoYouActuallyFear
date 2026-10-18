// App state and persistence (browser localStorage). Mirrors the Mac app's AppStore.
import { questions } from "./content";
import { cheerFor, emptyProfile, rank, realityLine, sectionOf, topFears, xp } from "./engine";
import type { FeedbackEntry, FearId, Profile, SourceId } from "./types";
import type { Quest } from "./engine";

export type Phase = "welcome" | "area" | "questions" | "sources" | "reveal" | "main";
export type Page = "board" | "profile" | "journal";

export interface Settings {
  focusCount: number;
  showXP: boolean;
  appearance: "system" | "light" | "dark";
  /** The "How quests work" card has been dismissed. */
  seenQuestIntro: boolean;
}

export interface State {
  phase: Phase;
  page: Page;
  profile: Profile | null;
  draft: Profile;
  questionIndex: number;
  sourceIndex: number;
  settings: Settings;
  /** True when showing sample data (?demo): nothing is saved. */
  demo: boolean;
  /** Set right after a questionnaire part ends (index of that part); the breather shows until cleared. */
  sectionBreak: number | null;
  /** Set when a quest is finished; the celebration shows until cleared. */
  celebration: Celebration | null;
}

export interface Celebration {
  quest: Quest;
  cheer: string;
  reality: string;
  /** Set when this quest moved the person up a rank. */
  newRank: string | null;
}

export const keys = { profile: "wdyaf.profile", settings: "wdyaf.settings", feedback: "wdyaf.feedback" };
export const defaultSettings: Settings = { focusCount: 3, showXP: true, appearance: "system", seenQuestIntro: false };

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function initialState(demoProfile?: Profile): State {
  const profile = demoProfile ?? readJSON<Profile>(keys.profile);
  return {
    phase: profile ? "main" : "welcome",
    page: "board",
    profile,
    draft: emptyProfile(),
    questionIndex: 0,
    sourceIndex: 0,
    settings: { ...defaultSettings, ...readJSON<Partial<Settings>>(keys.settings) },
    demo: Boolean(demoProfile),
    sectionBreak: null,
    celebration: null,
  };
}

export type Action =
  | { type: "start" }
  | { type: "setArea"; area: Profile["lifeArea"] }
  | { type: "setGoal"; goal: string }
  | { type: "goto"; phase: Phase }
  | { type: "page"; page: Page }
  | { type: "answer"; value: number }
  | { type: "back" }
  | { type: "chooseSource"; source: SourceId }
  | { type: "sourceNote"; fear: FearId; note: string }
  | { type: "nextSource" }
  | { type: "accept"; quest: Quest; predicted: number }
  | { type: "complete"; quest: Quest; actual: number; note: string }
  | { type: "undo"; quest: Quest }
  | { type: "settings"; settings: Partial<Settings> }
  | { type: "erase" }
  | { type: "import"; profile: Profile }
  | { type: "continueAfterBreak" }
  | { type: "dismissCelebration" };

export const sourceFears = (state: State) => topFears(state.draft.answers);

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return {
        ...state,
        draft: { ...emptyProfile(), lifeArea: state.profile?.lifeArea ?? "career", goal: state.profile?.goal ?? "" },
        questionIndex: 0, sourceIndex: 0, sectionBreak: null, phase: "area",
      };
    case "setArea":
      return { ...state, draft: { ...state.draft, lifeArea: action.area } };
    case "setGoal":
      return { ...state, draft: { ...state.draft, goal: action.goal } };
    case "goto":
      return { ...state, phase: action.phase };
    case "page":
      return { ...state, page: action.page };
    case "answer": {
      const draft = { ...state.draft, answers: { ...state.draft.answers, [questions[state.questionIndex].id]: action.value } };
      if (state.questionIndex + 1 < questions.length) {
        const part = sectionOf(state.questionIndex);
        const sectionBreak = sectionOf(state.questionIndex + 1) !== part ? part : null;
        return { ...state, draft, sectionBreak, questionIndex: state.questionIndex + 1 };
      }
      return { ...state, draft, sectionBreak: null, sourceIndex: 0, phase: "sources" };
    }
    case "back":
      switch (state.phase) {
        case "area": return { ...state, phase: state.profile ? "main" : "welcome" };
        case "questions":
          return state.questionIndex > 0
            ? { ...state, sectionBreak: null, questionIndex: state.questionIndex - 1 }
            : { ...state, sectionBreak: null, phase: "area" };
        case "sources":
          return state.sourceIndex > 0 ? { ...state, sourceIndex: state.sourceIndex - 1 } : { ...state, phase: "questions" };
        default: return state;
      }
    case "chooseSource": {
      const fear = sourceFears(state)[state.sourceIndex];
      return { ...state, draft: { ...state.draft, sources: { ...state.draft.sources, [fear]: action.source } } };
    }
    case "sourceNote":
      return { ...state, draft: { ...state.draft, sourceNotes: { ...state.draft.sourceNotes, [action.fear]: action.note } } };
    case "nextSource": {
      if (state.sourceIndex + 1 < sourceFears(state).length) return { ...state, sourceIndex: state.sourceIndex + 1 };
      // Finish: journal and quest progress carry over from any earlier run.
      const profile: Profile = {
        ...state.draft,
        accepted: state.profile?.accepted ?? {},
        completions: state.profile?.completions ?? {},
        createdAt: new Date().toISOString(),
      };
      return { ...state, profile, phase: "reveal" };
    }
    case "accept":
      if (!state.profile) return state;
      return { ...state, profile: { ...state.profile, accepted: { ...state.profile.accepted, [action.quest.id]: action.predicted } } };
    case "complete": {
      if (!state.profile) return state;
      const { quest } = action;
      const predicted = state.profile.accepted[quest.id] ?? action.actual;
      const accepted = { ...state.profile.accepted };
      delete accepted[quest.id];
      const completions = {
        ...state.profile.completions,
        [quest.id]: {
          date: new Date().toISOString(), fear: quest.fear, title: quest.title, xp: quest.xp,
          predicted, actual: action.actual, note: action.note.trim(),
        },
      };
      const before = rank(xp(state.profile)).title;
      const profile = { ...state.profile, accepted, completions };
      const after = rank(xp(profile)).title;
      const celebration: Celebration = {
        quest, cheer: cheerFor(quest.id), reality: realityLine(predicted, action.actual),
        newRank: after !== before ? after : null,
      };
      return { ...state, profile, celebration };
    }
    case "continueAfterBreak":
      return { ...state, sectionBreak: null };
    case "dismissCelebration":
      return { ...state, celebration: null };
    case "undo": {
      if (!state.profile) return state;
      const accepted = { ...state.profile.accepted };
      const completions = { ...state.profile.completions };
      delete accepted[action.quest.id];
      delete completions[action.quest.id];
      return { ...state, profile: { ...state.profile, accepted, completions } };
    }
    case "settings":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "import":
      // Replaces answers, quests and journal. Leaves demo mode so the imported progress is saved.
      return { ...state, profile: action.profile, page: "board", phase: "main", demo: false };
    case "erase":
      return { ...state, profile: null, draft: emptyProfile(), page: "board", phase: "welcome", demo: false };
  }
}

/** Saves after every change. Demo mode never writes. */
export function persist(state: State): boolean {
  if (state.demo) return true;
  const settingsOk = writeJSON(keys.settings, state.settings);
  if (!state.profile) {
    try { localStorage.removeItem(keys.profile); } catch { /* storage unavailable */ }
    return settingsOk;
  }
  return writeJSON(keys.profile, state.profile) && settingsOk;
}

export function saveFeedback(entry: FeedbackEntry): boolean {
  const all = readJSON<FeedbackEntry[]>(keys.feedback) ?? [];
  all.push(entry);
  return writeJSON(keys.feedback, all);
}

export function loadFeedback(): FeedbackEntry[] {
  return readJSON<FeedbackEntry[]>(keys.feedback) ?? [];
}
