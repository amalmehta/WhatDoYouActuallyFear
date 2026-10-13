import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { downloadProgress, parseProgress, previewSummary, ProgressError } from "../model/progress";
import type { Profile } from "../model/types";
import { isTyping, Modal, TransferContext, useStore } from "./Common";

/**
 * Export and import of the progress file. Import works from the Import buttons (file picker),
 * by dropping a file anywhere on the page, or by pasting a file or its text with ⌘V / Ctrl+V.
 */
export function ProgressTransfer({ children }: { children: ReactNode }) {
  const { state, dispatch } = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const read = useCallback((text: string) => {
    try {
      setPending(parseProgress(text));
      setError(null);
    } catch (e) {
      setError(e instanceof ProgressError ? e.message : "Couldn't read that file.");
    }
  }, []);

  const readFile = useCallback((file: File) => {
    file.text().then(read, () => setError(`Couldn't open ${file.name}.`));
  }, [read]);

  const value = useRef({ openImport: () => input.current?.click(), exportNow: () => {} });
  value.current.exportNow = () => { if (state.profile) downloadProgress(state.profile); };

  // Drop anywhere on the page.
  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const onEnter = (e: DragEvent) => { if (hasFiles(e)) { depth++; setDragging(true); } };
    const onLeave = (e: DragEvent) => { if (hasFiles(e) && --depth <= 0) { depth = 0; setDragging(false); } };
    const onOver = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const file = e.dataTransfer?.files[0];
      if (file) readFile(file);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [readFile]);

  // Paste a file, or the file's text, when no text field is being edited.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isTyping(e as unknown as KeyboardEvent)) return;
      const file = e.clipboardData?.files[0];
      if (file) { e.preventDefault(); readFile(file); return; }
      const text = e.clipboardData?.getData("text")?.trim() ?? "";
      if (text.startsWith("{")) { e.preventDefault(); read(text); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [read, readFile]);

  const confirm = () => {
    if (!pending) return;
    dispatch({ type: "import", profile: pending });
    setPending(null);
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  };

  const replacing = state.profile !== null && !state.demo;
  return (
    <TransferContext.Provider value={{ openImport: () => value.current.openImport(), exportNow: () => value.current.exportNow() }}>
      {children}
      <input ref={input} type="file" accept=".json,application/json" hidden data-testid="import-input"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) readFile(file); e.target.value = ""; }} />
      {dragging && (
        <div className="drop-overlay" aria-hidden><span>⇩ Drop to import your progress</span></div>
      )}
      {pending && (
        <Modal title={replacing ? "Replace your progress?" : "Import this progress?"} onClose={() => setPending(null)}>
          <h2>{replacing ? "Replace your progress?" : "Import this progress?"}</h2>
          <p>{previewSummary(pending)}</p>
          {replacing && <p className="muted">This replaces your current answers, quests and journal.</p>}
          <div className="actions">
            <button className="secondary" onClick={() => setPending(null)}>Cancel</button>
            <button className={replacing ? "danger" : "primary"} onClick={confirm}>{replacing ? "Replace" : "Import"}</button>
          </div>
        </Modal>
      )}
      {error && (
        <Modal title="Couldn't import" onClose={() => setError(null)}>
          <h2>Couldn't import</h2>
          <p>{error}</p>
          <div className="actions"><button className="primary" onClick={() => setError(null)}>OK</button></div>
        </Modal>
      )}
    </TransferContext.Provider>
  );
}
