import { useState } from "react";
import { saveFeedback } from "../model/store";
import { Modal, useStore } from "./Common";

/** All preferences in one place (gear button, or ⌘, / Ctrl+,). */
export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [confirmErase, setConfirmErase] = useState(false);
  const { settings } = state;
  return (
    <Modal title="Settings" onClose={onClose}>
      <h2>Settings</h2>
      <fieldset>
        <legend>Your plan</legend>
        <label className="setting">
          Fears to focus on
          <select value={settings.focusCount} onChange={(e) => dispatch({ type: "settings", settings: { focusCount: Number(e.target.value) } })}>
            <option value={1}>Just the top one</option>
            <option value={2}>Top two</option>
            <option value={3}>Top three</option>
          </select>
        </label>
        <label className="setting">
          Show XP and ranks
          <input type="checkbox" role="switch" checked={settings.showXP}
            onChange={(e) => dispatch({ type: "settings", settings: { showXP: e.target.checked } })} />
        </label>
      </fieldset>
      <fieldset>
        <legend>Appearance</legend>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {(["system", "light", "dark"] as const).map((a) => (
            <button key={a} role="radio" aria-checked={settings.appearance === a} className={settings.appearance === a ? "selected" : ""}
              onClick={() => dispatch({ type: "settings", settings: { appearance: a } })}>
              {a[0].toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Your data</legend>
        <p className="muted small">
          {state.demo ? "Sample data: nothing is saved." : "Saved in this browser only. Nothing is sent anywhere."}
        </p>
        <div className="actions left">
          <button className="secondary" disabled={!state.profile} onClick={() => { dispatch({ type: "start" }); onClose(); }}>
            Retake the questionnaire
          </button>
          <span className="spacer" />
          {confirmErase ? (
            <>
              <span className="small">Erase answers, quests and journal? This can't be undone.</span>
              <button className="secondary" onClick={() => setConfirmErase(false)}>Keep</button>
              <button className="danger" onClick={() => { dispatch({ type: "erase" }); onClose(); }}>Erase everything</button>
            </>
          ) : (
            <button className="danger-link" onClick={() => setConfirmErase(true)}>Erase everything…</button>
          )}
        </div>
      </fieldset>
      <div className="actions"><button className="primary" onClick={onClose}>Done</button></div>
    </Modal>
  );
}

const kinds = ["Idea", "Something's broken", "A question or quest", "Something else"];
export const issuesURL = "https://github.com/amalmehta/WhatDoYouActuallyFear/issues/new";

/** Small feedback form. Saves in this browser; you can also copy it or post it as a GitHub issue. */
export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState(kinds[0]);
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const empty = text.trim() === "";
  const issueLink = `${issuesURL}?${new URLSearchParams({ title: `[${kind}] Website feedback`, body: text })}`;
  return (
    <Modal title="Feedback" onClose={onClose}>
      <h2>Feedback</h2>
      <label className="setting">
        About
        <select value={kind} onChange={(e) => setKind(e.target.value)}>{kinds.map((k) => <option key={k}>{k}</option>)}</select>
      </label>
      <label className="field">
        <span className="sr-only">Your feedback</span>
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="What's on your mind?" />
      </label>
      <p className="muted small">
        Saving keeps it in this browser only. To send it to the developer, open it as a GitHub issue (needs a GitHub account).
      </p>
      {message && <p className="small" role="status">{message}</p>}
      <div className="actions">
        <button className="link" disabled={empty} onClick={async () => {
          try { await navigator.clipboard.writeText(`[${kind}] ${text}`); setMessage("Copied."); } catch { setMessage("Couldn't copy."); }
        }}>Copy</button>
        <a className={`button secondary ${empty ? "disabled" : ""}`} aria-disabled={empty}
          href={empty ? undefined : issueLink} target="_blank" rel="noreferrer">Open as GitHub issue</a>
        <span className="spacer" />
        <button className="secondary" onClick={onClose}>Cancel</button>
        <button className="primary" disabled={empty} onClick={() => {
          if (saveFeedback({ date: new Date().toISOString(), kind, text })) onClose();
          else setMessage("Couldn't save: this browser is blocking storage.");
        }}>Save</button>
      </div>
    </Modal>
  );
}
