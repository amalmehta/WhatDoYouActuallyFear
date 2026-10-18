import { createContext, useContext, useEffect, useRef, type Dispatch, type ReactNode } from "react";
import { families } from "../model/content";
import type { Action, State } from "../model/store";
import { fearInfo, lifeAreaTitle, sourceInfo, type FearScore, type Quest } from "../model/engine";
import type { FearId, LifeAreaId, SourceId } from "../model/types";

export const StoreContext = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);

/** Export and import of the progress file, available from any screen. */
export const TransferContext = createContext<{ openImport: () => void; exportNow: () => void }>({
  openImport: () => {}, exportNow: () => {},
});
export const useTransfer = () => useContext(TransferContext);

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore outside StoreContext");
  return value;
}

export const areaIcons: Record<LifeAreaId, string> = {
  career: "💼", relationships: "❤️", friendships: "👥", health: "🚶", creativity: "🎨", money: "💵", purpose: "🧭",
};

/** What a quest step looks like in the person's chosen life area. */
export function ExampleLine({ quest }: { quest: Quest }) {
  if (!quest.example) return null;
  const { area, text } = quest.example;
  return (
    <p className="example" style={{ "--c": `var(--fear-${quest.fear})` } as React.CSSProperties}
      title={`An example for ${lifeAreaTitle(area).toLowerCase()}`}>
      <span aria-label={lifeAreaTitle(area)} role="img">{areaIcons[area]}</span> {text}
    </p>
  );
}

/** A colored chip naming a fear. */
export function FearTag({ fear, large = false }: { fear: FearId; large?: boolean }) {
  const info = fearInfo(fear);
  const family = families.find((f) => f.id === info.family)!;
  return (
    <span className={`tag ${large ? "tag-large" : ""}`} style={{ "--c": `var(--fear-${fear})` } as React.CSSProperties}
      title={`${family.title} family`}>
      <span className="dot" aria-hidden />
      {info.name}
    </span>
  );
}

/** A colored chip naming where a fear came from. */
export function SourceTag({ source }: { source: SourceId }) {
  return (
    <span className="tag" style={{ "--c": `var(--source-${source})` } as React.CSSProperties}>
      <span aria-hidden>↺</span>
      {sourceInfo(source).title}
    </span>
  );
}

/** Horizontal bars for every fear, highest first. */
export function FearBars({ scores, highlight }: { scores: FearScore[]; highlight: Set<FearId> }) {
  return (
    <ul className="bars" aria-label="Every fear's score">
      {scores.map((s) => {
        const focus = highlight.size === 0 || highlight.has(s.fear);
        return (
          <li key={s.fear} className={focus ? "focus" : ""}>
            <span className="bar-label">{fearInfo(s.fear).name}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${Math.max(2, s.percent)}%`, background: `var(--fear-${s.fear})` }} />
            </span>
            <span className="bar-value">{s.percent}%</span>
          </li>
        );
      })}
    </ul>
  );
}

export function FamilyLegend() {
  return (
    <span className="legend">
      {families.map((f) => (
        <span key={f.id}><span className="dot" style={{ background: `var(--family-${f.id})` }} aria-hidden />{f.emoji} {f.title}</span>
      ))}
    </span>
  );
}

export function Meter({ fraction, label }: { fraction: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  return (
    <div className="meter" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

/** A modal dialog. Escape or clicking outside closes it. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input, textarea, select, button")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close.current(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); previous?.focus(); };
  }, []);
  return (
    <div className="backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        {children}
      </div>
    </div>
  );
}

export const isTyping = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
};
