import { useEffect, useMemo, useReducer, useState } from "react";
import { demoProfile } from "./model/demo";
import { initialState, persist, reducer } from "./model/store";
import { isTyping, StoreContext } from "./views/Common";
import { MainShell } from "./views/Main";
import { Onboarding } from "./views/Onboarding";
import { CelebrationModal } from "./views/Celebration";
import { ProgressTransfer } from "./views/ProgressTransfer";
import { FeedbackDialog, SettingsDialog } from "./views/SettingsFeedback";

export function App({ demo = false }: { demo?: boolean }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(demo ? demoProfile() : undefined));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const store = useMemo(() => ({ state, dispatch }), [state]);

  useEffect(() => { setSaveFailed(!persist(state)); }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.appearance === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", state.settings.appearance);
  }, [state.settings.appearance]);

  // ⌘, (Mac) or Ctrl+, opens Settings.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "," && (e.metaKey || e.ctrlKey) && !isTyping(e)) {
        e.preventDefault();
        setSettingsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Scroll to the top whenever the screen changes.
  useEffect(() => { window.scrollTo?.(0, 0); }, [state.phase, state.page, state.questionIndex, state.sourceIndex]);

  const inMain = state.phase === "main" && state.profile;
  return (
    <StoreContext.Provider value={store}>
      <ProgressTransfer>
        {inMain ? (
          <MainShell onSettings={() => setSettingsOpen(true)} onFeedback={() => setFeedbackOpen(true)} />
        ) : (
          <>
            <button className="icon-button floating-settings" onClick={() => setSettingsOpen(true)} aria-label="Settings" title="Settings (⌘, or Ctrl+,)">⚙︎</button>
            <Onboarding />
            <button className="feedback-tab" onClick={() => setFeedbackOpen(true)}>Feedback</button>
          </>
        )}
        {saveFailed && <p className="save-warning" role="alert">This browser is blocking storage, so progress won't be saved.</p>}
        {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
        {feedbackOpen && <FeedbackDialog onClose={() => setFeedbackOpen(false)} />}
        {state.celebration && <CelebrationModal celebration={state.celebration} onClose={() => dispatch({ type: "dismissCelebration" })} />}
      </ProgressTransfer>
    </StoreContext.Provider>
  );
}
