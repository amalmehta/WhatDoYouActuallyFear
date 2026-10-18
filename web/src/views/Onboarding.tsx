import { useEffect } from "react";
import { families, lifeAreas, questions, scale, sections, sources } from "../model/content";
import { fearInfo, lifeAreaTitle, plan, scores, sectionOf } from "../model/engine";
import { sourceFears } from "../model/store";
import type { Profile } from "../model/types";
import { areaIcons, FamilyLegend, FearBars, FearTag, isTyping, Meter, SourceTag, useStore, useTransfer } from "./Common";

/** Welcome → stuck area & goal → 22 statements in four parts (with breathers) → where each top fear came from → results. */
export function Onboarding() {
  const { state } = useStore();
  switch (state.phase) {
    case "welcome": return <Welcome />;
    case "area": return <AreaGoal />;
    case "questions": return state.sectionBreak !== null ? <Breather part={state.sectionBreak} /> : <QuestionStep />;
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
      <div className="hero-emoji" aria-hidden>🌱</div>
      <h1>What do you actually fear?</h1>
      <p className="lead">
        Let's find out together. You'll answer {questions.length} quick statements (about 5 minutes, and there are no
        wrong answers). Then you'll get a gentle, step-by-step plan for facing what's been holding you back.
      </p>
      <ul className="pills" aria-label="What you'll get">
        <li>🔍 Find your fears</li>
        <li>🌿 See where they started</li>
        <li>🗺️ Get small, doable steps</li>
      </ul>
      <button className="primary large" onClick={() => dispatch({ type: "start" })} autoFocus>Let's begin</button>
      <p className="muted small">🔒 Private: everything stays in this browser.</p>
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
      <header className="stack-tight">
        <h1>First, where do you feel most stuck?</h1>
        <p className="muted">Pick the one that matters most right now. Your quests will include examples for it.</p>
      </header>
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
          <span className="muted">Optional. Whatever you write becomes your final quest, the one everything builds up to.</span>
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

/** The four questionnaire parts as segments: done ones full, the current one filling up. */
export function PartsMap({ questionIndex }: { questionIndex: number }) {
  return (
    <div className="parts-map" aria-label={`Part ${sectionOf(Math.min(questionIndex, questions.length - 1)) + 1} of ${sections.length}`}>
      {sections.map((part) => (
        <Meter key={part.title} label={part.title}
          fraction={Math.max(0, Math.min(part.end - part.start, questionIndex - part.start)) / (part.end - part.start)} />
      ))}
    </div>
  );
}

/** One statement with its five-point answer scale. Keys 1–5 answer. */
export function QuestionCard({ index, selected, onAnswer }: { index: number; selected?: number; onAnswer: (v: number) => void }) {
  const partIndex = sectionOf(index);
  return (
    <section className="question">
      <div className="row wrap">
        <strong className="small">Part {partIndex + 1} of {sections.length} · {sections[partIndex].title}</strong>
        <span className="spacer" />
        <span className="muted small">Statement {index + 1} of {questions.length}</span>
      </div>
      <PartsMap questionIndex={index} />
      <h1 className="statement" key={index}>{questions[index].text}</h1>
      <p className="muted">How true is this for you? Go with your first instinct.</p>
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

/** A short pause between questionnaire parts. */
function Breather({ part }: { part: number }) {
  const { state, dispatch } = useStore();
  return (
    <main className="narrow breather">
      <BackButton />
      <div className="center-block">
        <div className="hero-emoji" aria-hidden>{["🌱", "🌿", "🌳"][Math.min(part, 2)]}</div>
        <h1>Part {part + 1} done</h1>
        <p className="lead">{sections[part].cheer}</p>
        <PartsMap questionIndex={state.questionIndex} />
        <button className="primary large" autoFocus onClick={() => dispatch({ type: "continueAfterBreak" })}>Keep going</button>
      </div>
    </main>
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
      {state.sourceIndex === 0 && <p className="callout">🎉 {sections.at(-1)?.cheer}</p>}
      <p className="muted">Fear {state.sourceIndex + 1} of {fears.length}</p>
      <FearTag fear={fear} large />
      <header className="stack-tight">
        <h1>Where might this one have started?</h1>
        <p className="lead">{fearInfo(fear).summary} There's no wrong answer. Go with what feels closest.</p>
      </header>
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
        <span className="muted">Earliest memory of this fear (optional, just for you)</span>
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
          Show me my quests
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
      <header className="stack-tight">
        <h1>Here's what's been holding you back</h1>
        <p className="lead">Stuck in {lifeAreaTitle(profile.lifeArea).toLowerCase()}. These are the fears doing the most work behind the scenes.</p>
      </header>
      <p className="callout row-top">
        <span aria-hidden>💛</span>
        <span>
          This isn't a verdict on who you are. Fears are old protectors doing their job a little too well. Next, you'll get
          small, doable quests that show them you're safe.
        </span>
      </p>
      {gamePlan.fears.map((fp, i) => {
        const info = fearInfo(fp.fear);
        return (
          <section className="card" key={fp.fear}>
            <div className="row">
              <span className="family-emoji" aria-hidden>{families.find((f) => f.id === info.family)?.emoji}</span>
              <FearTag fear={fp.fear} large />
              <span className="spacer" />
              <span className="rank-number">#{i + 1}</span>
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
