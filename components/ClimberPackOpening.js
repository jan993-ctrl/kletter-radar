"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// --- KONSTANTEN ---
const GRADES = ["1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", "4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", "7a", "7b", "7c", "8a", "8b", "8c", "9a"];

const RARITY_META = {
  legendary: { label: "LEGENDARY", color: "#FFB300", shadow: "0 0 24px #FFB30088, 0 0 48px #FF8F0044", badge: "#7B5800", bgFrom: "#3D2000" },
  rare: { label: "RARE", color: "#42A5F5", shadow: "0 0 16px #42A5F566, 0 0 32px #1565C033", badge: "#0D47A1", bgFrom: "#001A3D" },
  common: { label: "COMMON", color: "#9E9E9E", shadow: "0 4px 16px rgba(0,0,0,.5)", badge: "#212121", bgFrom: "#1C1C1C" },
};

const SPREAD = [
  { x: -44, y: -16, rot: -24 },
  { x: -22, y: -26, rot: -11 },
  { x: 0, y: -30, rot: 1 },
  { x: 22, y: -26, rot: 13 },
  { x: 44, y: -16, rot: 23 },
];

const CRUMBLE_DIRS = [
  { tx: "-55vw", ty: "60vh", rot: "-180deg" },
  { tx: "-25vw", ty: "80vh", rot: "-120deg" },
  { tx: "0vw", ty: "90vh", rot: "90deg" },
  { tx: "25vw", ty: "75vh", rot: "150deg" },
  { tx: "55vw", ty: "65vh", rot: "200deg" },
];

const SHARDS = [
  { clip: "polygon(0% 0%, 52% 0%, 38% 33%, 0% 22%)", tx: "-88px", ty: "-95px", rot: "-48deg", delay: "0s" },
  { clip: "polygon(52% 0%, 100% 0%, 100% 26%, 62% 29%, 38% 33%)", tx: "80px", ty: "-90px", rot: "42deg", delay: "0.07s" },
  { clip: "polygon(0% 22%, 38% 33%, 27% 60%, 0% 52%)", tx: "-95px", ty: "18px", rot: "32deg", delay: "0.12s" },
  { clip: "polygon(38% 33%, 62% 29%, 100% 26%, 100% 60%, 66% 54%, 27% 60%)", tx: "18px", ty: "-65px", rot: "-22deg", delay: "0.05s" },
  { clip: "polygon(66% 54%, 100% 60%, 100% 100%, 72% 100%)", tx: "90px", ty: "88px", rot: "58deg", delay: "0.1s" },
  { clip: "polygon(0% 52%, 27% 60%, 20% 82%, 0% 100%)", tx: "-88px", ty: "90px", rot: "-52deg", delay: "0.04s" },
  { clip: "polygon(27% 60%, 66% 54%, 72% 100%, 20% 82%)", tx: "22px", ty: "95px", rot: "38deg", delay: "0.15s" },
];

// --- HELPER ---
const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "K")}&background=2A1F06&color=FFD166&size=300`;

const toPercent = (val) => Math.round((Math.min(24, Math.max(0, Number(val) || 0)) / 24) * 100);

const getPowerScore = (abilities) => {
  const safe = Array.isArray(abilities) && abilities.length === 7 ? abilities : [0, 0, 0, 0, 0, 0, 0];
  return Math.round((safe.reduce((a, b) => a + b, 0) / (7 * 24)) * 100);
};

const getRarity = (powerScore) => {
  if (powerScore >= 92) return "legendary";
  if (powerScore >= 75) return "rare";
  return "common";
};

const getGrade = (powerScore) => {
  const idx = Math.max(0, Math.min(GRADES.length - 1, Math.round((powerScore / 100) * (GRADES.length - 1))));
  return GRADES[idx];
};

// --- HAUPTKOMPONENTE ---
export default function ClimberPackOpening({ cards = [], packTheme = {}, ownedIds = new Set(), onDone, onDismiss }) {
  const [phase, setPhase] = useState("idle");
  const [activeCards, setActive] = useState([]);
  const [launched, setLaunched] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [exitModes, setExitModes] = useState({});
  const [gatherPos, setGatherPos] = useState({});
  const [bagOffsets, setBagOffsets] = useState({});
  const [bagVisible, setBagVisible] = useState(false);
  
  const timeouts = useRef([]);

  const clear = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  };

  const later = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timeouts.current.push(id);
    return id;
  };

  const startAnimation = useCallback(() => {
    if (cards.length === 0) return;
    clear();
    setActive([]);
    setLaunched([]);
    setRevealed([]);
    setExitModes({});
    setGatherPos({});
    setBagOffsets({});
    setBagVisible(false);

    setPhase("shake");
    later(() => setPhase("slice"), 650);
    later(() => setPhase("open"), 1150);
    later(() => {
      setActive(cards);
      setPhase("cards");
      cards.forEach((_, i) => later(() => setLaunched((prev) => [...prev, i]), i * 130));
    }, 1750);
    later(() => setPhase("done"), 3600);
  }, [cards]);

  const triggerExit = useCallback(() => {
    const modes = {};
    const newCards = [];
    const shatterCards = [];

    activeCards.forEach((card, i) => {
      const cardKey = card.originalId || card.id;
      const isDupe = ownedIds.has(cardKey);
      modes[i] = isDupe ? "shatter" : "gather";
      if (!isDupe) newCards.push(i);
      else shatterCards.push(i);
    });

    setExitModes(modes);
    onDone?.(newCards.map((i) => activeCards[i]).filter(Boolean));

    const CARD_W = 148;
    const GAP = 12;
    const total = newCards.length;
    const gp = {};
    const Y_OFFSET = -110;

    if (total <= 3) {
      newCards.forEach((cardIdx, j) => {
        gp[cardIdx] = { gx: (j - (total - 1) / 2) * (CARD_W + GAP), gy: Y_OFFSET };
      });
    } else {
      const radius = 140 + total * 8;
      newCards.forEach((cardIdx, j) => {
        const angle = (j / total) * 2 * Math.PI - Math.PI / 2;
        gp[cardIdx] = { gx: Math.cos(angle) * radius, gy: Math.sin(angle) * radius + Y_OFFSET };
      });
    }
    setGatherPos(gp);

    const BAG_X_VW = 0;
    const BAG_Y_VH = 31;
    const bo = {};
    shatterCards.forEach((i) => {
      const sp = SPREAD[i] || SPREAD[0];
      // FIX: Saubere Template Literals ohne störende Backslashes
      bo[i] = { bx: `${BAG_X_VW - sp.x}vw`, by: `${BAG_Y_VH - sp.y}vh` };
    });

    setBagOffsets(bo);
    if (shatterCards.length > 0) setBagVisible(true);
    setPhase("exit");

    later(() => {
      setPhase("idle");
      setActive([]);
      setLaunched([]);
      setRevealed([]);
      setExitModes({});
      setGatherPos({});
      setBagOffsets({});
      setBagVisible(false);
      onDismiss?.();
    }, newCards.length > 0 ? 2800 : 2400);
  }, [activeCards, onDismiss, onDone, ownedIds]);

  useEffect(() => () => clear(), []);

  const allRevealed = activeCards.length > 0 && revealed.length === activeCards.length;

  const toggleReveal = (i) => {
    if (phase !== "done") return;
    setRevealed((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  return (
    <div className={`cr-root phase-${phase}`} onClick={() => phase === "idle" ? startAnimation() : (allRevealed && phase === "done" ? triggerExit() : null)}>
      <style>{CSS}</style>
      
      {/* PACK ANIMATION */}
      <div className={`cr-pack ${phase === "shake" ? "shake" : ""} ${phase}`}>
        <div className="cr-pack-top" />
        <div className={`cr-slice ${phase === "slice" ? "vis" : ""}`} />
        <div className="cr-pack-body">
           <div className="cr-pack-content">
              <span className="cr-pack-eyebrow">SEASON 26 · CRUX</span>
              <h2 className="cr-pack-title">CRUX CARDS</h2>
              <MountainClimberIcon size={42} />
              <span className="cr-pack-sub">{cards.length} CLIMBERS INSIDE</span>
           </div>
        </div>
      </div>

      {/* CARDS LAYER */}
      <div className="cards-layer">
        {activeCards.map((card, i) => (
          <ClimberCard
            key={card.id || i}
            card={card}
            index={i}
            isLaunched={launched.includes(i)}
            isRevealed={revealed.includes(i)}
            exitMode={phase === "exit" ? exitModes[i] || null : null}
            gatherPos={gatherPos[i] || null}
            bagOffset={bagOffsets[i] || null}
            isDone={phase === "done"}
            onClick={(e) => {
              e.stopPropagation();
              toggleReveal(i);
            }}
          />
        ))}
      </div>

      {bagVisible && <div className="cr-bag-wrap"><ShardChest /></div>}

      {/* UI HINTS */}
      {phase === "idle" && <div className="cr-cta cr-cta-pulse">TAP TO OPEN PACK</div>}
      {phase === "done" && !allRevealed && <div className="cr-hint">Reveal all cards to continue</div>}
      {phase === "done" && allRevealed && <div className="cr-cta cr-cta-pulse">Tap to collect</div>}
    </div>
  );
}

// --- SUB-KOMPONENTEN ---

function ClimberCard({ card, index, isLaunched, isRevealed, exitMode, gatherPos, bagOffset, isDone, onClick }) {
  const pos = SPREAD[index] || SPREAD[0];
  const safeAbilities = Array.isArray(card.abilities) && card.abilities.length === 7 ? card.abilities : [0, 0, 0, 0, 0, 0, 0];
  const powerScore = card.stats?.power ?? getPowerScore(safeAbilities);
  const rarity = card.rarity || getRarity(powerScore);
  const meta = RARITY_META[rarity] || RARITY_META.common;
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const isShatter = exitMode === "shatter";
  const isGather = exitMode === "gather";
  const canTilt = isDone && isRevealed && !exitMode;

  const handlePointerMove = (event) => {
    if (!canTilt) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setTilt({ rx: (0.5 - py) * 7, ry: (px - 0.5) * 9 });
  };

  return (
    <div
      className={`cr-card-wrap ${isLaunched ? "fly" : ""} ${isRevealed ? "flipped" : ""} ${isGather ? "gather" : ""} ${canTilt ? "alive" : ""}`}
      style={{
        "--tx": `${pos.x}vw`, "--ty": `${pos.y}vh`, "--rot": `${pos.rot}deg`,
        "--gx": `${gatherPos?.gx ?? 0}px`, "--gy": `${gatherPos?.gy ?? 0}px`,
        "--hrx": `${tilt.rx}deg`, "--hry": `${tilt.ry}deg`,
        "--r-color": meta.color, "--r-shadow": meta.shadow
      }}
      onMouseMove={handlePointerMove}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
      onClick={onClick}
    >
      <div className="cr-card-face cr-card-back">
        <MountainClimberIcon size={32} />
        <span style={{color: '#FFD166'}}>CRUX</span>
      </div>
      <div className="cr-card-face cr-card-front" style={{ borderColor: meta.color }}>
        <div className="cr-card-head">
          <span className="cr-rarity-badge" style={{ background: meta.badge, color: meta.color }}>{meta.label}</span>
          <span className="cr-power-badge">POW {powerScore}</span>
        </div>
        <div className="cr-art-zone">
          <Image src={card.image_url || fallbackAvatar(card.name)} alt={card.name || "Kletterer"} className="cr-profile-img" width={320} height={320} unoptimized />
          <div className="cr-grade-overlay">{card.grade || getGrade(powerScore)}</div>
        </div>
        <div className="cr-name-row">
          <span className="cr-athlete-name">{card.name || "Kletterer"}</span>
        </div>
        <div className="cr-stats">
          <StatBar label="POW" value={powerScore} color={meta.color} />
          <StatBar label="TEC" value={card.stats?.tech ?? toPercent(safeAbilities[2])} color={meta.color} />
          <StatBar label="END" value={card.stats?.endurance ?? toPercent(safeAbilities[6])} color={meta.color} />
        </div>

        {isShatter && (
          <>
            <div className="cr-shatter-flash" />
            {SHARDS.map((s, si) => (
              <div
                key={si}
                className="cr-shard"
                style={{
                  "--shard-clip": s.clip, "--stx": s.tx, "--sty": s.ty, "--srot": s.rot,
                  "--bag-tx": bagOffset?.bx ?? "0px", "--bag-ty": bagOffset?.by ?? "0px", "--delay": s.delay,
                  background: `linear-gradient(155deg, ${meta.bgFrom} 0%, #0D0D14 100%)`,
                  border: `1.5px solid ${meta.color}`
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function StatBar({ label, value, color }) {
  return (
    <div className="cr-stat-row">
      <span className="cr-stat-label">{label}</span>
      <div className="cr-stat-track"><div className="cr-stat-fill" style={{ width: `${value}%`, backgroundColor: color }} /></div>
      <span className="cr-stat-val">{value}</span>
    </div>
  );
}

function ShardChest() {
  return (
    <div className="cr-chest-visual">
       <div className="cr-bag-label">DUPLIKAT</div>
    </div>
  );
}

function MountainClimberIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 40L26 12L40 40H12Z" />
    </svg>
  );
}

const CSS = `
:root {
  color-scheme: dark;
}

.cr-root {
  position: relative;
  width: min(100%, 920px);
  min-height: 560px;
  margin: 0 auto;
  border-radius: 24px;
  overflow: hidden;
  background: radial-gradient(circle at 50% 20%, #1e253f 0%, #090b12 70%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
  perspective: 1200px;
  display: flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
}

.cr-root::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 85%, #ffd16622 0%, transparent 45%);
  pointer-events: none;
}

.cr-pack {
  position: absolute;
  left: 50%;
  top: 56%;
  width: 250px;
  transform: translate(-50%, -50%);
  transition: opacity 0.55s ease, transform 0.55s ease;
}

.cr-pack-top {
  position: relative;
  width: 100%;
  height: 42px;
  border-radius: 14px 14px 7px 7px;
  background: linear-gradient(180deg, #f6be5f 0%, #b07016 100%);
  transform-origin: bottom center;
  box-shadow: inset 0 1px 8px #fff4, 0 10px 22px #0008;
}

.cr-pack-body {
  margin-top: -5px;
  border-radius: 14px;
  border: 1.5px solid #ffcd7d66;
  background: linear-gradient(180deg, #5a3b12 0%, #20160a 100%);
  padding: 18px 16px 22px;
  box-shadow: 0 15px 28px rgba(0, 0, 0, 0.42);
}

.cr-pack-content {
  display: grid;
  justify-items: center;
  gap: 8px;
  text-align: center;
  color: #f5f5f5;
}

.cr-pack-eyebrow {
  font-size: 11px;
  letter-spacing: .16em;
  opacity: .85;
}

.cr-pack-title {
  margin: 0;
  font-size: 26px;
  line-height: 1;
}

.cr-pack-sub {
  font-size: 12px;
  letter-spacing: .12em;
  color: #ffd166;
}

.cr-pack.shake {
  animation: cr-shake .58s linear;
}

.phase-open .cr-pack-top {
  animation: cr-lid-open .65s cubic-bezier(.2, .8, .2, 1) forwards;
}

.phase-cards .cr-pack,
.phase-done .cr-pack,
.phase-exit .cr-pack {
  opacity: 0;
  transform: translate(-50%, -52%) scale(.9);
  pointer-events: none;
}

.cr-slice {
  position: absolute;
  left: 50%;
  top: 43%;
  width: 115%;
  height: 3px;
  transform: translate(-50%, -50%) rotate(-12deg) scaleX(0);
  background: linear-gradient(90deg, transparent, #ffffff, transparent);
  box-shadow: 0 0 24px #fff;
  opacity: 0;
}

.cr-slice.vis {
  animation: cr-slice .45s ease;
}

.cards-layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.cr-card-wrap {
  --tx: 0vw;
  --ty: 0vh;
  --rot: 0deg;
  --gx: 0px;
  --gy: 0px;
  --hrx: 0deg;
  --hry: 0deg;
  position: absolute;
  width: 148px;
  height: 224px;
  transform-style: preserve-3d;
  transform: translate3d(0, 130px, -250px) rotateZ(0deg) rotateX(4deg);
  transition: transform .72s cubic-bezier(.2, .85, .2, 1), filter .25s ease;
  pointer-events: none;
}

.cr-card-wrap.fly {
  transform: translate3d(var(--tx), var(--ty), 0) rotateZ(var(--rot));
  pointer-events: auto;
}

.cr-card-wrap.alive:hover {
  filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.35));
}

.cr-card-wrap.flipped {
  transform: translate3d(var(--tx), var(--ty), 0) rotateZ(var(--rot)) rotateY(calc(180deg + var(--hry))) rotateX(var(--hrx));
}

.cr-card-wrap.gather {
  transform: translate3d(var(--gx), var(--gy), 0) rotateY(180deg) scale(.92);
}

.cr-card-face {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  overflow: hidden;
  backface-visibility: hidden;
}

.cr-card-back {
  border: 1.5px solid #ffd166aa;
  background: linear-gradient(165deg, #2a1f06 0%, #0f1018 100%);
  display: grid;
  place-content: center;
  gap: 12px;
  justify-items: center;
}

.cr-card-front {
  transform: rotateY(180deg);
  border: 1.5px solid var(--r-color, #999);
  background: linear-gradient(160deg, #1e222f 0%, #0e1018 100%);
  box-shadow: var(--r-shadow);
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  gap: 10px;
  padding: 10px;
}

.cr-card-head,
.cr-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.cr-rarity-badge,
.cr-power-badge {
  font-size: 10px;
  letter-spacing: .08em;
  font-weight: 700;
  padding: 5px 7px;
  border-radius: 999px;
}

.cr-power-badge {
  color: #eceff1;
  background: #121826;
}

.cr-art-zone {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #ffffff22;
  aspect-ratio: 1.1;
}

.cr-profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cr-grade-overlay {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-weight: 800;
  font-size: 22px;
  color: #ffd166;
  text-shadow: 0 2px 6px #000;
}

.cr-athlete-name {
  font-weight: 700;
}

.cr-stats {
  display: grid;
  gap: 6px;
}

.cr-stat-row {
  display: grid;
  grid-template-columns: 28px 1fr 32px;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.cr-stat-track {
  border-radius: 999px;
  overflow: hidden;
  background: #ffffff1a;
  height: 7px;
}

.cr-stat-fill {
  height: 100%;
}

.cr-shatter-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, #fff 0%, #fff8 30%, transparent 75%);
  animation: cr-shatter-flash .35s ease-out;
  pointer-events: none;
}

.cr-shard {
  position: absolute;
  inset: 0;
  clip-path: var(--shard-clip);
  animation: cr-shard .7s ease-out var(--delay, 0s) forwards, cr-shard-bag .95s ease-in .55s forwards;
}

.cr-bag-wrap {
  position: absolute;
  left: 50%;
  bottom: 8%;
  transform: translateX(-50%);
  z-index: 2;
}

.cr-chest-visual {
  width: 128px;
  height: 56px;
  border-radius: 14px;
  border: 1px solid #ffcd7d70;
  background: linear-gradient(180deg, #4a3111, #1b1208);
  display: grid;
  place-items: center;
  box-shadow: 0 10px 24px #0009;
}

.cr-bag-label {
  font-size: 11px;
  letter-spacing: .16em;
  color: #ffcf7f;
}

.cr-cta,
.cr-hint {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  letter-spacing: .09em;
  background: #0d1019cc;
  border: 1px solid #ffffff22;
  border-radius: 999px;
  padding: 10px 14px;
}

.cr-cta {
  bottom: 18px;
}

.cr-hint {
  top: 14px;
}

.cr-cta-pulse {
  animation: cr-pulse 1.4s ease-in-out infinite;
}

@keyframes cr-shake {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  25% { transform: translate(-49%, -50%) rotate(1.8deg); }
  50% { transform: translate(-50%, -50%) rotate(-1.8deg); }
  75% { transform: translate(-51%, -50%) rotate(1.3deg); }
}

@keyframes cr-lid-open {
  from { transform: rotateX(0deg); }
  to { transform: rotateX(-82deg) translateY(-12px); }
}

@keyframes cr-slice {
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(-12deg) scaleX(0); }
  45% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(-12deg) scaleX(1.15); }
}

@keyframes cr-shatter-flash {
  0% { opacity: 0; }
  25% { opacity: .65; }
  100% { opacity: 0; }
}

@keyframes cr-shard {
  to {
    transform: translate(var(--stx), var(--sty)) rotate(var(--srot)) scale(.9);
    opacity: .45;
  }
}

@keyframes cr-shard-bag {
  to {
    transform: translate(var(--bag-tx), var(--bag-ty)) rotate(360deg) scale(.1);
    opacity: 0;
  }
}

@keyframes cr-pulse {
  0%, 100% { box-shadow: 0 0 0 0 #ffd16633; }
  50% { box-shadow: 0 0 0 8px #ffd16600; }
}
`;
