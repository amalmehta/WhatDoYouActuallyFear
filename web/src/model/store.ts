// App state and persistence (browser localStorage). Mirrors the Mac app's AppStore.
import { questions } from "./content";
import { emptyProfile, topFears } from "./engine";
import type { FeedbackEntry, FearId, Profile, SourceId } from "./types";
import type { Quest } from "./engine";

export type Phase = "welcome" | "area" | "questions" | "sources" | "reveal" | "main";
export type Page = "board" | "profile" | "journal";

export interface Settings {
  focusCount: number;
  showXP: boolean;
  appearance: "system" | "light" | "dark";
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
}

export const keys = { profile: "wdyaf.profile", settings: "wdyaf.settings", feedback: "wdyaf.feedback" };
export const defaultSettings: Settings = { focusCount: 3, showXP: true, appearance: "system" };

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
  | { type: "erase" };

export const sourceFears = (state: State) => topFears(state.draft.answers);

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return {
        ...state,
        draft: { ...emptyProfile(), lifeArea: state.profile?.lifeArea ?? "career", goal: state.profile?.goal ?? "" },
        questionIndex: 0, sourceIndex: 0, phase: "area",
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
      if (state.questionIndex + 1 < questions.length) return { ...state, draft, questionIndex: state.questionIndex + 1 };
      return { ...state, draft, sourceIndex: 0, phase: "sources" };
    }
    case "back":
      switch (state.phase) {
        case "area": return { ...state, phase: state.profile ? "main" : "welcome" };
        case "questions":
          return state.questionIndex > 0 ? { ...state, questionIndex: state.questionIndex - 1 } : { ...state, phase: "area" };
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
      return { ...state, profile: { ...state.profile, accepted, completions } };
    }
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
