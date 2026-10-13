import { useEffect } from "react";
import { lifeAreas, questions, scale, sources } from "../model/content";
import { fearInfo, lifeAreaTitle, plan, scores } from "../model/engine";
import { sourceFears } from "../model/store";
import type { Profile } from "../model/types";
import { areaIcons, FamilyLegend, FearBars, FearTag, isTyping, Meter, SourceTag, useStore, useTransfer } from "./Common";

/** Welcome → stuck area & goal → 22 statements → where each top fear came from → results. */
export function Onboarding() {
  const { state } = useStore();
  switch (state.phase) {
    case "welcome": return <Welcome />;
    case "area": return <AreaGoal />;
    case "questions": return <QuestionStep />;
    case "sources": return <SourceStep />;
    case "reveal": return <Reveal />;
    default: return null;
  }
}

function Welcome() {
  const { dispatch } = useStore();
  const transfer = useTransfer();
  return (
    <main className="center welcome">
      <div className="flame" aria-hidden>🔥</div>
      <h1 className="serif">What do you actually fear?</h1>
      <p className="lead">
        Answer {questions.length} quick statements. Find the fears keeping you stuck, where they came from, and a quest plan
        to face them — one small brave step at a time.
      </p>
      <button className="primary large" onClick={() => dispatch({ type: "start" })} autoFocus>Begin</button>
      <p className="muted small">🔒 Everything stays in this browser.</p>
      <p className="small"><a href="?demo">See a demo with sample answers</a></p>
      <p className="small">
        <button className="link import-link" onClick={transfer.openImport}>Have a progress file? Import it…</button>
      </p>
    </main>
  );
}

function BackButton() {
  const { dispatch } = useStore();
  return <button className="link back" onClick={() => dispatch({ type: "back" })}>‹ Back</button>;
}

function AreaGoal() {
  const { state, dispatch } = useStore();
  return (
    <main className="narrow">
      <BackButton />
      <h1 className="serif">Where do you feel most stuck?</h1>
      <div className="area-grid" role="radiogroup" aria-label="Life area">
        {lifeAreas.map((area) => (
          <button key={area.id} role="radio" aria-checked={state.draft.lifeArea === area.id}
            className={`choice ${state.draft.lifeArea === area.id ? "selected" : ""}`}
            onClick={() => dispatch({ type: "setArea", area: area.id })}>
            <span className="icon" aria-hidden>{areaIcons[area.id]}</span>
            {area.title}
          </button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); dispatch({ type: "goto", phase: "questions" }); }}>
        <label className="field">
          <span className="field-title">If you weren't afraid, what would you do?</span>
          <span className="muted">This becomes your final boss quest. Leave it blank if you're not sure yet.</span>
          <input autoFocus value={state.draft.goal} placeholder="e.g. Apply for the design lead role"
            onChange={(e) => dispatch({ type: "setGoal", goal: e.target.value })} />
        </label>
        <div className="actions"><button className="primary large" type="submit">Continue</button></div>
      </form>
    </main>
  );
}

function QuestionStep() {
  const { state, dispatch } = useStore();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= scale.length) dispatch({ type: "answer", value: n - 1 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);
  return (
    <main className="narrow">
      <BackButton />
      <QuestionCard index={state.questionIndex} selected={state.draft.answers[questions[state.questionIndex].id]}
        onAnswer={(value) => dispatch({ type: "answer", value })} />
    </main>
  );
}

/** One statement with its five-point answer scale. Keys 1–5 answer. */
export function QuestionCard({ index, selected, onAnswer }: { index: number; selected?: number; onAnswer: (v: number) => void }) {
  return (
    <section className="question">
      <p className="muted">Statement {index + 1} of {questions.length}</p>
      <Meter fraction={index / questions.length} label="Questionnaire progress" />
      <h1 className="serif statement" key={index}>{questions[index].text}</h1>
      <p className="muted">How true is this for you?</p>
      <div className="scale" role="group" aria-label="How true is this for you?">
        {scale.map((label, value) => (
          <button key={label} className={`choice ${selected === value ? "selected" : ""}`} aria-pressed={selected === value}
            onClick={() => onAnswer(value)}>
            <span className="key" aria-hidden>{value + 1}</span>
            {label}
          </button>
        ))}
      </div>
      <p className="hint">Tip: press 1–5 to answer.</p>
    </section>
  );
}

function SourceStep() {
  const { state, dispatch } = useStore();
  const fears = sourceFears(state);
  const fear = fears[Math.min(state.sourceIndex, fears.length - 1)];
  const chosen = state.draft.sources[fear];
  const last = state.sourceIndex + 1 >= fears.length;
  return (
    <main className="narrow">
      <BackButton />
      <p className="muted">Fear {state.sourceIndex + 1} of {fears.length}</p>
      <FearTag fear={fear} large />
      <h1 className="serif">{fearInfo(fear).summary} Where do you think it started?</h1>
      <div className="sources" role="radiogroup" aria-label="Where it started">
        {sources.map((s) => (
          <button key={s.id} role="radio" aria-checked={chosen === s.id}
            className={`source ${chosen === s.id ? "selected" : ""}`}
            style={{ "--c": `var(--source-${s.id})` } as React.CSSProperties}
            onClick={() => dispatch({ type: "chooseSource", source: s.id })}>
            <span className="radio" aria-hidden />
            <span>
              <strong>{s.title}</strong>
              {chosen === s.id && <span className="muted block">{s.howItFormed}</span>}
            </span>
          </button>
        ))}
      </div>
      <label className="field">
        <span className="muted">Earliest memory of this fear (optional)</span>
        <textarea rows={2} value={state.draft.sourceNotes[fear] ?? ""}
          onChange={(e) => dispatch({ type: "sourceNote", fear, note: e.target.value })} />
      </label>
      <div className="actions">
        <button className="primary large" disabled={!chosen} onClick={() => dispatch({ type: "nextSource" })}>
          {last ? "Show me my fears" : "Next fear"}
        </button>
      </div>
    </main>
  );
}

function Reveal() {
  const { state, dispatch } = useStore();
  if (!state.profile) return null;
  return (
    <main className="wide">
      <RevealContent profile={state.profile} focusCount={state.settings.focusCount} />
      <div className="actions center-actions">
        <button className="primary large" autoFocus onClick={() => { dispatch({ type: "page", page: "board" }); dispatch({ type: "goto", phase: "main" }); }}>
          Start my quests
        </button>
      </div>
    </main>
  );
}

/** The results: top fears, their beliefs, and every fear's score. */
export function RevealContent({ profile, focusCount }: { profile: Profile; focusCount: number }) {
  const gamePlan = plan(profile, focusCount);
  return (
    <div className="stack">
      <header>
        <h1 className="serif">Here's what's actually holding you back</h1>
        <p className="lead">Stuck in {lifeAreaTitle(profile.lifeArea).toLowerCase()}. These are the fears doing the most work behind the scenes.</p>
      </header>
      {gamePlan.fears.map((fp, i) => {
        const info = fearInfo(fp.fear);
        return (
          <section className="card" key={fp.fear}>
            <div className="row">
              <span className="rank-number">#{i + 1}</span>
              <FearTag fear={fp.fear} large />
              <span className="spacer" />
              <span className="percent">{fp.score.percent}%</span>
            </div>
            <p className="big">{info.summary}</p>
            <p><span className="muted">The belief underneath: </span><em>“{info.coreBelief}”</em></p>
            <p className="row wrap"><span className="muted">Likely started with:</span> <SourceTag source={fp.source} /></p>
          </section>
        );
      })}
      <section className="card">
        <div className="row wrap"><h2 className="h3">All {scores(profile.answers).length} fears</h2><span className="spacer" /><FamilyLegend /></div>
        <FearBars scores={scores(profile.answers)} highlight={new Set(gamePlan.fears.map((f) => f.fear))} />
      </section>
    </div>
  );
}
