import { useState } from "react";
import { rules } from "../model/content";
import { averageRelief, fearInfo, nextQuest, plan, rank, scores, sourceInfo, status, xp, type Quest, type QuestStatus } from "../model/engine";
import type { Page } from "../model/store";
import type { Profile } from "../model/types";
import { ExampleLine, FamilyLegend, FearBars, FearTag, Meter, Modal, SourceTag, useStore, useTransfer } from "./Common";

const pages: { id: Page; title: string; icon: string }[] = [
  { id: "board", title: "Quest Board", icon: "⚑" },
  { id: "profile", title: "Fear Profile", icon: "◎" },
  { id: "journal", title: "Journal", icon: "▤" },
];

export function MainShell({ onSettings, onFeedback }: { onSettings: () => void; onFeedback: () => void }) {
  const { state, dispatch } = useStore();
  const transfer = useTransfer();
  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Pages">
        <div className="brand"><span aria-hidden>🔥</span> What Do You Actually Fear</div>
        {pages.map((p) => (
          <button key={p.id} className={`nav-item ${state.page === p.id ? "active" : ""}`}
            aria-current={state.page === p.id ? "page" : undefined}
            onClick={() => dispatch({ type: "page", page: p.id })}>
            <span aria-hidden className="nav-icon">{p.icon}</span>{p.title}
          </button>
        ))}
        <span className="spacer" />
        <button className="nav-item subtle" onClick={transfer.exportNow}>⇩ Export progress</button>
        <button className="nav-item subtle" onClick={transfer.openImport}>⇧ Import progress…</button>
        <button className="nav-item subtle" onClick={onFeedback}>💬 Feedback</button>
      </nav>
      <div className="content">
        <header className="toolbar">
          <h1 className="page-title">{pages.find((p) => p.id === state.page)!.title}</h1>
          <span className="spacer" />
          {state.page === "profile" && (
            <button className="secondary" onClick={() => dispatch({ type: "start" })} title="Your journal is kept">↺ Retake</button>
          )}
          <button className="icon-button" onClick={onSettings} aria-label="Settings" title="Settings (⌘, or Ctrl+,)">⚙︎</button>
        </header>
        {state.demo && (
          <p className="demo-banner">You're looking at sample answers. Nothing is saved. <a href="./">Start your own</a></p>
        )}
        <div className="page">
          {state.page === "board" && <QuestBoard />}
          {state.page === "profile" && state.profile && <FearProfileContent profile={state.profile} focusCount={state.settings.focusCount} />}
          {state.page === "journal" && <Journal />}
        </div>
      </div>
    </div>
  );
}

// MARK: Quest Board

function QuestBoard() {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState<Quest | null>(null);
  if (!state.profile) return null;
  return (
    <>
      <QuestBoardContent profile={state.profile} focusCount={state.settings.focusCount} showXP={state.settings.showXP}
        showIntro={!state.settings.seenQuestIntro && !state.demo}
        onDismissIntro={() => dispatch({ type: "settings", settings: { seenQuestIntro: true } })}
        onSelect={setSelected} />
      {selected && <QuestDialog quest={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

export function QuestBoardContent({ profile, focusCount, showXP, showIntro = false, onDismissIntro = () => {}, onSelect }: {
  profile: Profile; focusCount: number; showXP: boolean; showIntro?: boolean; onDismissIntro?: () => void; onSelect: (q: Quest) => void;
}) {
  const gamePlan = plan(profile, focusCount);
  const next = nextQuest(gamePlan, profile);
  return (
    <div className="stack">
      {showIntro && <QuestIntro onDismiss={onDismissIntro} />}
      {next && <NextStep quest={next} status={status(next, gamePlan, profile)} onSelect={onSelect} />}
      <ProgressHeader profile={profile} showXP={showXP} />
      {gamePlan.fears.map((fp) => {
        const done = fp.quests.filter((q) => profile.completions[q.id]).length;
        return (
          <section className="card" key={fp.fear} aria-label={`${fearInfo(fp.fear).name} quests`}>
            <div className="row wrap">
              <FearTag fear={fp.fear} large />
              <span className="muted strong">{fp.score.percent}%</span>
              <span className="spacer" />
              <span className="muted">{done} of {fp.quests.length} faced</span>
            </div>
            <p className="muted">{fearInfo(fp.fear).reframe}</p>
            <ul className="quests">
              {fp.quests.map((q) => (
                <QuestRow key={q.id} quest={q} status={status(q, gamePlan, profile)} showXP={showXP} onSelect={onSelect} />
              ))}
            </ul>
          </section>
        );
      })}
      {gamePlan.boss && <BossCard quest={gamePlan.boss} status={status(gamePlan.boss, gamePlan, profile)} showXP={showXP} onSelect={onSelect} />}
    </div>
  );
}

function ProgressHeader({ profile, showXP }: { profile: Profile; showXP: boolean }) {
  const points = xp(profile);
  const r = rank(points);
  const relief = averageRelief(profile);
  return (
    <section className="card progress-header">
      {showXP && (
        <div className="rank">
          <span className="muted small">Your rank</span>
          <span className="serif rank-title">{r.title}</span>
          {r.next !== null ? (
            <>
              <Meter fraction={(points - r.floor) / (r.next - r.floor)} label="Progress to next rank" />
              <span className="muted small">{points} XP · {r.next - points} to next rank</span>
            </>
          ) : <span className="muted small">{points} XP · top rank</span>}
        </div>
      )}
      <div className="relief">
        <span className="muted small">Fear vs. reality</span>
        {relief === null ? (
          <p className="muted">Each time you finish a quest, you'll see how the real thing compared to the fear. It's usually kinder than you expect.</p>
        ) : (
          <p className="big">{relief > 0
            ? `Reality has been ${relief.toFixed(1)} points less scary than you expected.`
            : "You're facing it head-on. Keep logging how it really felt."}</p>
        )}
      </div>
    </section>
  );
}

function QuestRow({ quest, status: s, showXP, onSelect }: { quest: Quest; status: QuestStatus; showXP: boolean; onSelect: (q: Quest) => void }) {
  const label = quest.kind.type === "source" ? "ROOT" : quest.kind.type === "step" ? `STEP ${quest.kind.n}` : "";
  const icon = { done: "✓", accepted: "🔥", available: "", locked: "🔒" }[s.type];
  return (
    <li className={`quest ${s.type}`} style={{ "--c": `var(--fear-${quest.fear})` } as React.CSSProperties}>
      <span className={`status-icon ${s.type}`} aria-label={s.type}>{icon}</span>
      <div className="quest-text">
        <div><span className="quest-label">{label}</span> <strong>{quest.title}</strong></div>
        <p className="muted">{quest.detail}</p>
        <ExampleLine quest={quest} />
      </div>
      <div className="quest-side">
        {showXP && <span className="xp">+{quest.xp} XP</span>}
        <QuestAction quest={quest} status={s} onSelect={onSelect} />
      </div>
    </li>
  );
}

function QuestAction({ quest, status: s, onSelect }: { quest: Quest; status: QuestStatus; onSelect: (q: Quest) => void }) {
  switch (s.type) {
    case "available": return <button className="secondary small-button" onClick={() => onSelect(quest)}>Accept</button>;
    case "accepted": return <button className="primary small-button" onClick={() => onSelect(quest)}>I did it</button>;
    case "done":
      return (
        <button className="link small" onClick={() => onSelect(quest)} title={`Expected ${s.completion.predicted}/10, actually ${s.completion.actual}/10`}>
          feared {s.completion.predicted} → felt {s.completion.actual}
        </button>
      );
    case "locked": return null;
  }
}

function BossCard({ quest, status: s, showXP, onSelect }: { quest: Quest; status: QuestStatus; showXP: boolean; onSelect: (q: Quest) => void }) {
  return (
    <section className={`card boss ${s.type}`} aria-label="Final boss">
      <span className="boss-icon" aria-hidden>{s.type === "locked" ? "🛡" : "👑"}</span>
      <div className="quest-text">
        <span className="quest-label">FINAL BOSS</span>
        <h2 className="serif">{quest.title}</h2>
        <p className="muted">{quest.detail}</p>
        {s.type === "locked" && <p className="hint">Unlocks when you've finished every quest for one fear.</p>}
      </div>
      <div className="quest-side">
        {showXP && <span className="xp">+{quest.xp} XP</span>}
        <QuestAction quest={quest} status={s} onSelect={onSelect} />
      </div>
    </section>
  );
}

/** Accept a quest (rate how scary it feels) or log that you did it (rate how it really felt). */
function QuestDialog({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");
  if (!state.profile) return null;
  const s = status(quest, plan(state.profile, rules.maxFocus), state.profile);
  const act = (fn: () => void) => () => { fn(); onClose(); };

  const slider = (label: string) => (
    <label className="field">
      <span className="row"><strong>{label}</strong><span className="spacer" /><strong>{rating}/10</strong></span>
      <span className="row slider-row">
        <span className="muted small">calm</span>
        <input type="range" min={0} max={10} step={1} value={rating} onChange={(e) => setRating(Number(e.target.value))} aria-label={label} />
        <span className="muted small">terrified</span>
      </span>
    </label>
  );

  return (
    <Modal title={quest.title} onClose={onClose}>
      <FearTag fear={quest.fear} />
      <h2 className="serif">{quest.title}</h2>
      <p className="muted">{quest.detail}</p>
      <ExampleLine quest={quest} />
      <hr />
      {s.type === "available" && (
        <>
          {slider("How scary does this feel right now? Any number is fine.")}
          <div className="actions">
            <button className="secondary" onClick={onClose}>Cancel</button>
            <button className="primary" onClick={act(() => dispatch({ type: "accept", quest, predicted: rating }))}>Accept quest</button>
          </div>
        </>
      )}
      {s.type === "accepted" && (
        <>
          <p className="muted">You expected this to be {s.predicted}/10 scary.</p>
          {slider("How scary was it, really?")}
          <label className="field">
            <span className="muted">What happened? What did you learn? (optional)</span>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="actions">
            <button className="danger-link" onClick={act(() => dispatch({ type: "undo", quest }))}>Give up this quest</button>
            <span className="spacer" />
            <button className="secondary" onClick={onClose}>Cancel</button>
            <button className="primary" onClick={act(() => dispatch({ type: "complete", quest, actual: rating, note }))}>I did it</button>
          </div>
        </>
      )}
      {s.type === "done" && (
        <>
          <p>Done {new Date(s.completion.date).toLocaleDateString()}. Feared {s.completion.predicted}/10, felt {s.completion.actual}/10.</p>
          {s.completion.note && <p><em>{s.completion.note}</em></p>}
          <div className="actions">
            <button className="danger-link" onClick={act(() => dispatch({ type: "undo", quest }))}>Mark as not done</button>
            <span className="spacer" />
            <button className="primary" onClick={onClose}>Close</button>
          </div>
        </>
      )}
      {s.type === "locked" && (
        <>
          <p className="muted">This one opens up once you've finished the step before it. No rush.</p>
          <div className="actions"><button className="primary" onClick={onClose}>Close</button></div>
        </>
      )}
    </Modal>
  );
}

// MARK: Fear Profile

export function FearProfileContent({ profile, focusCount }: { profile: Profile; focusCount: number }) {
  const gamePlan = plan(profile, focusCount);
  return (
    <div className="stack">
      {gamePlan.fears.map((fp) => {
        const info = fearInfo(fp.fear);
        const memory = profile.sourceNotes[fp.fear];
        return (
          <section className="card" key={fp.fear}>
            <div className="row"><FearTag fear={fp.fear} large /><span className="spacer" /><span className="percent">{fp.score.percent}%</span></div>
            <p className="big">{info.summary}</p>
            <h3 className="eyebrow">How it keeps you stuck</h3>
            <ul className="bullets">{info.howItKeepsYouStuck.map((s) => <li key={s}>{s}</li>)}</ul>
            <h3 className="eyebrow">The belief underneath</h3>
            <p><em>“{info.coreBelief}”</em></p>
            <h3 className="eyebrow">Try this instead</h3>
            <p>{info.reframe}</p>
            <h3 className="eyebrow">Where it likely started</h3>
            <p><SourceTag source={fp.source} /></p>
            <p className="muted">{sourceInfo(fp.source).howItFormed}</p>
            {memory && <p className="muted"><em>Your memory: {memory}</em></p>}
          </section>
        );
      })}
      <section className="card">
        <div className="row wrap"><h2 className="h3">All fears</h2><span className="spacer" /><FamilyLegend /></div>
        <FearBars scores={scores(profile.answers)} highlight={new Set(gamePlan.fears.map((f) => f.fear))} />
      </section>
    </div>
  );
}

// MARK: Journal

function Journal() {
  const { state } = useStore();
  const entries = Object.values(state.profile?.completions ?? {}).sort((a, b) => b.date.localeCompare(a.date));
  if (entries.length === 0) {
    return (
      <div className="empty">
        <div className="hero-emoji" aria-hidden>📓</div>
        <p className="big">Your journal is waiting</p>
        <p className="muted">When you finish a quest, how it felt and what you learned will live here. Every entry is proof you can do hard things.</p>
      </div>
    );
  }
  return (
    <div className="stack">
      {entries.map((e, i) => (
        <section className="card compact" key={`${e.date}-${i}`}>
          <div className="row wrap">
            <FearTag fear={e.fear} />
            <strong>{e.title}</strong>
            <span className="spacer" />
            <span className="muted">{new Date(e.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          <p className="muted">⛈ Feared {e.predicted}/10 · ☀︎ Felt {e.actual}/10</p>
          {e.note && <p>{e.note}</p>}
        </section>
      ))}
    </div>
  );
}

/** A short, dismissible explanation of how quests work, shown until the person taps "Got it". */
function QuestIntro({ onDismiss }: { onDismiss: () => void }) {
  return (
    <section className="intro-card" aria-label="How quests work">
      <h2 className="h3">👋 How quests work</h2>
      <ol className="intro-steps">
        <li>Pick your next quest and rate how scary it feels.</li>
        <li>Go and do it, in your own time. Small is fine.</li>
        <li>Come back, tap <strong>I did it</strong>, and rate how it really felt.</li>
      </ol>
      <div className="row wrap">
        <span className="muted small">Quests unlock one at a time, so you're never asked to jump ahead.</span>
        <span className="spacer" />
        <button className="secondary" onClick={onDismiss}>Got it</button>
      </div>
    </section>
  );
}

/** The one quest to do next, front and centre. */
function NextStep({ quest, status: s, onSelect }: { quest: Quest; status: QuestStatus; onSelect: (q: Quest) => void }) {
  const started = s.type === "accepted";
  return (
    <section className="card next-step" aria-label="Your next step" style={{ "--c": `var(--fear-${quest.fear})` } as React.CSSProperties}>
      <div className="row wrap">
        <strong className="next-label">{started ? "🔥 In progress" : "👉 Your next step"}</strong>
        <span className="spacer" />
        <FearTag fear={quest.fear} />
      </div>
      <h2>{quest.title}</h2>
      <p className="muted">{quest.detail}</p>
      <ExampleLine quest={quest} />
      <div className="row wrap">
        <span className="muted small">{started ? "When you've done it, come back and tell me how it went." : "Take your time. Nothing happens until you say so."}</span>
        <span className="spacer" />
        <button className="primary large" onClick={() => onSelect(quest)}>{started ? "I did it" : "Accept quest"}</button>
      </div>
    </section>
  );
}
