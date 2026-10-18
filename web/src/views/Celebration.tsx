import type { Celebration } from "../model/store";
import { Modal } from "./Common";

const confetti = ["🎉", "✨", "🌟", "💛", "🌱", "🎊"];

/** A short celebration after finishing a quest. The confetti is hidden when reduced motion is preferred. */
export function CelebrationModal({ celebration, onClose }: { celebration: Celebration; onClose: () => void }) {
  return (
    <Modal title="Quest complete!" onClose={onClose}>
      <div className="confetti" aria-hidden>
        {Array.from({ length: 18 }, (_, i) => {
          const angle = (i / 18) * 2 * Math.PI;
          return (
            <span key={i} style={{
              "--x": `${Math.round(Math.cos(angle) * 220)}px`,
              "--y": `${Math.round(Math.sin(angle) * 170)}px`,
              animationDelay: `${(i % 3) * 50}ms`,
            } as React.CSSProperties}>{confetti[i % confetti.length]}</span>
          );
        })}
      </div>
      <div className="celebration">
        <div className="hero-emoji" aria-hidden>🎉</div>
        <h2>Quest complete!</h2>
        <p className="big">{celebration.cheer}</p>
        <p className="muted">{celebration.reality}</p>
        <p className="xp-gain">+{celebration.quest.xp} XP</p>
        {celebration.newRank && <p className="new-rank">✨ New rank: {celebration.newRank}</p>}
        <button className="primary large" onClick={onClose} autoFocus>Keep going</button>
      </div>
    </Modal>
  );
}
