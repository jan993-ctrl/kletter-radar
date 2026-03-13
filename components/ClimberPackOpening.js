"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const GRADES = [
  "1a",
  "1b",
  "1c",
  "2a",
  "2b",
  "2c",
  "3a",
  "3b",
  "3c",
  "4a",
  "4b",
  "4c",
  "5a",
  "5b",
  "5c",
  "6a",
  "6b",
  "6c",
  "7a",
  "7b",
  "7c",
  "8a",
  "8b",
  "8c",
  "9a",
];

const STYLE_LABELS = ["Crimper", "Sloper", "Slab", "Dyno", "Pocket"];

const STAT_CONFIG = [
  { label: "KRF", idx: 0 },
  { label: "TEC", idx: 2 },
  { label: "MEN", idx: 6 },
];

const toPercent = (val) => Math.round((Math.min(24, Math.max(0, val)) / 24) * 100);

const getPowerScore = (abilities) => {
  const safe = Array.isArray(abilities) && abilities.length === 7 ? abilities : [0, 0, 0, 0, 0, 0, 0];
  return Math.round((safe.reduce((a, b) => a + b, 0) / (7 * 24)) * 100);
};

const getRarity = (powerScore) => {
  if (powerScore >= 80) return "legendary";
  if (powerScore >= 50) return "rare";
  return "common";
};

const getBestGrade = (styles) => {
  if (!Array.isArray(styles) || styles.length === 0) return "1a";
  return GRADES[Math.max(...styles)] || "1a";
};

const getDiscipline = (styles) => {
  if (!Array.isArray(styles) || styles.length === 0) return "Boulder";
  const bestIdx = styles.indexOf(Math.max(...styles));
  return [1, 2].includes(bestIdx) ? "Lead" : "Boulder";
};

const fallbackAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "K")}&background=2A1F06&color=FFD166&size=300`;

const RARITY_META = {
  legendary: {
    label: "LEGENDARY",
    color: "#FFB300",
    shadow: "0 0 24px #FFB30088, 0 0 48px #FF8F0044",
    badge: "#7B5800",
    bgFrom: "#3D2000",
  },
  rare: {
    label: "RARE",
    color: "#42A5F5",
    shadow: "0 0 16px #42A5F566, 0 0 32px #1565C033",
    badge: "#0D47A1",
    bgFrom: "#001A3D",
  },
  common: {
    label: "COMMON",
    color: "#9E9E9E",
    shadow: "0 4px 16px rgba(0,0,0,.5)",
    badge: "#212121",
    bgFrom: "#1C1C1C",
  },
};

const SPREAD_BY_COUNT = {
  1: [{ x: 0, y: -28, rot: 0 }],
  2: [
    { x: -18, y: -25, rot: -8 },
    { x: 18, y: -25, rot: 8 },
  ],
  3: [
    { x: -24, y: -22, rot: -12 },
    { x: 0, y: -30, rot: 0 },
    { x: 24, y: -22, rot: 12 },
  ],
  4: [
    { x: -32, y: -18, rot: -16 },
    { x: -10, y: -28, rot: -6 },
    { x: 10, y: -28, rot: 6 },
    { x: 32, y: -18, rot: 16 },
  ],
  5: [
    { x: -44, y: -16, rot: -24 },
    { x: -22, y: -26, rot: -11 },
    { x: 0, y: -30, rot: 1 },
    { x: 22, y: -26, rot: 13 },
    { x: 44, y: -16, rot: 23 },
  ],
};

const DEFAULT_SPREAD = SPREAD_BY_COUNT[5];

const CRUMBLE_DIRS = [
  { tx: "-55vw", ty: "60vh", rot: "-180deg" },
  { tx: "-25vw", ty: "80vh", rot: "-120deg" },
  { tx: "0vw", ty: "90vh", rot: "90deg" },
  { tx: "25vw", ty: "75vh", rot: "150deg" },
  { tx: "55vw", ty: "65vh", rot: "200deg" },
];

const COLLECT_DIRS = [
  { tx: "0vw", ty: "7vh", rot: "-12deg" },
  { tx: "0vw", ty: "5vh", rot: "8deg" },
  { tx: "0vw", ty: "6vh", rot: "-5deg" },
  { tx: "0vw", ty: "8vh", rot: "9deg" },
  { tx: "0vw", ty: "6vh", rot: "-9deg" },
];

export default function ClimberPackOpening({ cards = [], onDone, onDismiss }) {
  const [phase, setPhase] = useState("idle");
  const [activeCards, setActive] = useState([]);
  const [launched, setLaunched] = useState([]);
  const [revealed, setRevealed] = useState([]);
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
    setPhase("shake");

    later(() => setPhase("slice"), 650);
    later(() => setPhase("open"), 1150);
    later(() => {
      setActive(cards);
      setPhase("cards");
      cards.forEach((_, i) => later(() => setLaunched((prev) => [...prev, i]), i * 130));
    }, 1750);
    later(() => {
      setPhase("done");
      onDone?.(cards);
    }, 3600);
  }, [cards, onDone]);

  const triggerCrumble = useCallback(() => {
    setPhase("crumble");
    later(() => {
      setPhase("idle");
      setActive([]);
      setLaunched([]);
      setRevealed([]);
      onDismiss?.();
    }, 900);
  }, [onDismiss]);

  useEffect(() => () => clear(), []);

  const allRevealed = activeCards.length > 0 && revealed.length === activeCards.length;
  const remaining = activeCards.length - revealed.length;

  const canRevealCards = phase === "cards" || phase === "done";

  const toggleReveal = (i) => {
    if (!canRevealCards || !launched.includes(i)) return;
    setRevealed((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  const handleRootClick = () => {
    if (phase === "idle") {
      startAnimation();
      return;
    }
    if (phase === "done" && allRevealed) {
      triggerCrumble();
    }
  };

  return (
    <div className="cr-root" onClick={handleRootClick}>
      <style>{CSS}</style>

      {activeCards.map((card, i) => (
        <ClimberCard
          key={card.user_id || card.id || i}
          card={card}
          index={i}
          totalCards={activeCards.length}
          isLaunched={launched.includes(i)}
          isRevealed={revealed.includes(i)}
          isOwned={Boolean(card.alreadyOwned)}
          isCrumbling={phase === "crumble"}
          isDone={canRevealCards}
          onClick={(e) => {
            e.stopPropagation();
            toggleReveal(i);
          }}
        />
      ))}

      <div className={`cr-pack ${phase}`} role="button" aria-label="Pack öffnen">
        <div className="cr-pack-top" />
        <div className={`cr-slice ${["slice", "open", "cards", "done", "crumble"].includes(phase) ? "vis" : ""}`} />
        <div className="cr-pack-body">
          <div className="cr-pack-shine" />
          <div className="cr-pack-noise" />
          <div className="cr-pack-content">
            <span className="cr-pack-eyebrow">SEASON 1 · PRO SERIES</span>
            <span className="cr-pack-title">
              CRUX
              <br />
              CARDS
            </span>
            <MountainClimberIcon />
            <span className="cr-pack-sub">
              {cards.length} KLETTERER{cards.length !== 1 ? "" : ""} INSIDE
            </span>
          </div>
        </div>
      </div>

      {phase === "idle" && cards.length > 0 && <p className="cr-cta cr-cta-pulse">PACK ÖFFNEN</p>}
      {phase === "idle" && cards.length === 0 && <p className="cr-hint">keine Karten verfügbar</p>}
      {phase === "done" && !allRevealed && (
        <p className="cr-hint">
          {revealed.length === 0
            ? "Karte antippen zum Aufdecken"
            : `Noch ${remaining} Karte${remaining !== 1 ? "n" : ""} übrig`}
        </p>
      )}
      {phase === "done" && allRevealed && <p className="cr-cta cr-cta-pulse">Tippen zum Beenden</p>}
    </div>
  );
}

function ClimberCard({ card, index, totalCards, isLaunched, isRevealed, isOwned, isCrumbling, isDone, onClick }) {
  const spread = SPREAD_BY_COUNT[totalCards] || DEFAULT_SPREAD;
  const pos = spread[index] || DEFAULT_SPREAD[index] || DEFAULT_SPREAD[0];
  const cd = CRUMBLE_DIRS[index] || CRUMBLE_DIRS[0];
  const collect = COLLECT_DIRS[index] || COLLECT_DIRS[0];

  const safeAbilities = Array.isArray(card.abilities) && card.abilities.length === 7 ? card.abilities : [0, 0, 0, 0, 0, 0, 0];
  const safeStyles = Array.isArray(card.styles) && card.styles.length === 5 ? card.styles : [0, 0, 0, 0, 0];

  const powerScore = getPowerScore(safeAbilities);
  const rarity = getRarity(powerScore);
  const bestGrade = getBestGrade(safeStyles);
  const discipline = getDiscipline(safeStyles);
  const meta = RARITY_META[rarity];
  const imgSrc = card.image_url || fallbackAvatar(card.name);

  const bestStyleIdx = safeStyles.indexOf(Math.max(...safeStyles));
  const bestStyleLabel = STYLE_LABELS[bestStyleIdx] || "Boulder";

  return (
    <div
      className={["cr-card-wrap", isLaunched ? "fly" : "", isRevealed ? "flipped" : "", isCrumbling ? (isOwned ? "crumble" : "collect") : ""].join(" ")}
      style={{
        "--tx": `${pos.x}vw`,
        "--ty": `${pos.y}vh`,
        "--rot": `${pos.rot}deg`,
        "--delay": `${index * 0.1}s`,
        "--r-color": meta.color,
        "--r-shadow": meta.shadow,
        "--cx": cd.tx,
        "--cy": cd.ty,
        "--cr": cd.rot,
        "--cd": `${index * 0.06}s`,
        "--ctx": collect.tx,
        "--cty": collect.ty,
        "--cr2": collect.rot,
      }}
      onClick={isDone && !isCrumbling ? onClick : undefined}
    >
      <div className="cr-card-face cr-card-back">
        <MountainClimberIcon size={42} />
        <span className="cr-back-label">CRUX</span>
      </div>

      <div className="cr-card-face cr-card-front" style={{ "--card-bg-from": meta.bgFrom }}>
        <div className="cr-card-glow" />

        <div className="cr-card-head">
          <span className="cr-rarity-badge" style={{ background: meta.badge, color: meta.color }}>
            {meta.label}
          </span>
          <span className="cr-discipline">
            {discipline} · {bestStyleLabel}
          </span>
        </div>

        <div className="cr-art-zone">
          <div
            className="cr-art-bg"
            style={{ background: `radial-gradient(circle at 60% 40%, ${meta.color}22 0%, transparent 70%)` }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={card.name || "Kletterer"}
            className="cr-profile-img"
            onError={(e) => {
              e.currentTarget.src = fallbackAvatar(card.name);
            }}
          />
          <span className="cr-grade-overlay">{bestGrade}</span>
        </div>

        <div className="cr-name-row">
          <span className="cr-athlete-name">{card.name || "Kletterer"}</span>
          <span className="cr-power-badge" style={{ color: meta.color }}>
            ⚡{powerScore}
          </span>
        </div>

        <p className="cr-quote">{card.notes ? `“${card.notes}”` : "“Kraxelt seit Level 1a hoch.”"}</p>

        <div className="cr-stats">
          {STAT_CONFIG.map(({ label, idx }) => (
            <StatBar key={label} label={label} value={toPercent(safeAbilities[idx])} color={meta.color} />
          ))}
        </div>

        <div className="cr-holo" />
      </div>
    </div>
  );
}

function StatBar({ label, value, color }) {
  return (
    <div className="cr-stat-row">
      <span className="cr-stat-label">{label}</span>
      <div className="cr-stat-track">
        <div className="cr-stat-fill" style={{ "--fill": `${value}%`, "--fill-color": color }} />
      </div>
      <span className="cr-stat-val">{value}</span>
    </div>
  );
}

function MountainClimberIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" className="cr-carabiner">
      <path d="M2 46 L20 10 L26 20 L32 10 L50 46 Z" fill="currentColor" opacity=".18" />
      <path
        d="M2 46 L20 10 L26 20 L32 10 L50 46"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
        opacity=".7"
      />
      <path d="M32 10 L28.5 17 L35.5 17 Z" fill="currentColor" opacity=".5" />
      <circle cx="20" cy="7" r="2.2" fill="currentColor" opacity=".95" />
      <line x1="20" y1="9.2" x2="20" y2="13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="10.5" x2="17" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20" y1="10.5" x2="23" y2="7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20" y1="13.5" x2="18" y2="16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20" y1="13.5" x2="22" y2="16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 13.5 Q17 18 18 22" stroke="currentColor" strokeWidth="1.3" fill="none" opacity=".45" strokeLinecap="round" />
    </svg>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Rajdhani:wght@400;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.cr-root {
  position: relative;
  width: 100%; height: 100%;
  min-height: 100dvh;
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  font-family: 'Rajdhani', sans-serif;
}

.cr-pack {
  position: relative; z-index: 10;
  width: clamp(130px, 22vw, 175px);
  height: clamp(210px, 36vw, 285px);
  display: flex; flex-direction: column;
  cursor: pointer;
  filter: drop-shadow(0 20px 50px rgba(0,0,0,.75));
}
.cr-pack.shake { animation: packShake .65s ease forwards; }
@keyframes packShake {
  0%   { transform: rotate(0deg)    translateX(0);    }
  15%  { transform: rotate(-2.5deg) translateX(-11px);}
  30%  { transform: rotate(2deg)    translateX(11px); }
  45%  { transform: rotate(-2deg)   translateX(-8px); }
  60%  { transform: rotate(1.5deg)  translateX(8px);  }
  75%  { transform: rotate(-1deg)   translateX(-4px); }
  90%  { transform: rotate(.6deg)   translateX(3px);  }
  100% { transform: rotate(0)       translateX(0);    }
}
.cr-pack-top {
  height: 16%;
  background: linear-gradient(135deg, #2D2208 0%, #3D3010 100%);
  border-radius: 12px 12px 0 0;
  border-bottom: 2px solid #BF8C00;
  position: relative; z-index: 2;
  transition: transform .45s cubic-bezier(.22,.61,.36,1), opacity .45s ease;
  overflow: hidden;
}
.cr-pack-top::after {
  content:''; position:absolute; inset:0;
  background: linear-gradient(105deg,transparent 55%,rgba(255,220,100,.1) 62%,transparent 68%);
}
.cr-pack.open    .cr-pack-top,
.cr-pack.cards   .cr-pack-top,
.cr-pack.done    .cr-pack-top,
.cr-pack.crumble .cr-pack-top {
  transform: translateY(-160%) rotate(20deg) translateX(20%);
  opacity: 0;
}
.cr-slice {
  position: absolute; top: 16%;
  left: 50%; width: 0; height: 2px;
  background: linear-gradient(90deg, transparent, #FFD166, #fff, #FFD166, transparent);
  transform: translateX(-50%);
  border-radius: 2px;
  box-shadow: 0 0 10px 4px rgba(255,209,102,.5);
  opacity: 0;
  transition: width .38s ease, opacity .2s ease;
  z-index: 5;
}
.cr-slice.vis { width: 100%; opacity: 1; }
.cr-pack-body {
  flex: 1;
  background: linear-gradient(160deg, #2A1F06 0%, #1C1505 60%, #0E1020 100%);
  border-radius: 0 0 12px 12px;
  position: relative; overflow: hidden;
  border: 1px solid rgba(191,140,0,.35);
  border-top: none;
}
.cr-pack-noise {
  position:absolute; inset:0;
  background-image: repeating-linear-gradient(
    -45deg, transparent 0px, transparent 3px,
    rgba(255,255,255,.015) 3px, rgba(255,255,255,.015) 4px
  );
  pointer-events:none;
}
.cr-pack-shine {
  position:absolute; top:0; bottom:0; left:70%; width:12%;
  background: linear-gradient(180deg,
    transparent 0%, rgba(255,220,100,.08) 30%,
    rgba(255,255,255,.06) 60%, transparent 100%
  );
  border-radius: 3px;
}
.cr-pack-content {
  position:absolute; inset:0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: space-evenly;
  padding: 8% 8% 10%;
}
.cr-pack-eyebrow {
  font-size: clamp(6px, 1.3vw, 8px); font-weight: 700;
  letter-spacing: .22em; color: rgba(191,140,0,.8); text-transform: uppercase;
  font-family: 'Rajdhani', sans-serif;
}
.cr-pack-title {
  font-family: 'Oswald', sans-serif;
  font-size: clamp(20px, 4.5vw, 30px); font-weight: 700;
  line-height: .95; text-align: center; color: #FFD166;
  text-shadow: 0 0 20px rgba(255,209,102,.4); letter-spacing: .05em;
}
.cr-carabiner { color: rgba(255,209,102,.7); }
.cr-pack-sub {
  font-size: clamp(6px, 1.3vw, 8px); font-weight: 600;
  letter-spacing: .2em; color: rgba(255,255,255,.3); text-transform: uppercase;
}
.cr-pack.crumble {
  animation: packCrumble .7s .1s cubic-bezier(.55,0,1,.45) forwards;
  pointer-events: none;
}
@keyframes packCrumble {
  0%   { transform: scale(1) rotate(0deg); opacity: 1; }
  20%  { transform: scale(1.04) rotate(-3deg); }
  100% { transform: scale(0) rotate(25deg) translateY(40px); opacity: 0; }
}

.cr-card-wrap {
  position: absolute; z-index: 20;
  width: clamp(100px, 17vw, 148px);
  height: clamp(150px, 25vw, 215px);
  transform: translate(0,0) rotate(0deg) scale(0);
  opacity: 0; pointer-events: none;
  perspective: 800px; transform-style: preserve-3d;
}
.cr-card-wrap.fly {
  animation: cardFly .8s cubic-bezier(.22,.61,.36,1) forwards;
  animation-delay: var(--delay);
  pointer-events: auto;
}
@keyframes cardFly {
  0%   { transform: translate(0,0) rotate(0deg) scale(.15); opacity:0; }
  20%  { opacity: 1; }
  65%  { transform: translate(calc(var(--tx)*.75), calc(var(--ty)*1.3 - 7vh)) rotate(calc(var(--rot)*.6)) scale(1.08); }
  100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(1); opacity:1; }
}
.cr-card-wrap.fly:hover {
  z-index: 50;
  filter: drop-shadow(var(--r-shadow));
  transform: translate(var(--tx), calc(var(--ty) - 1vh)) rotate(var(--rot)) scale(1.06) !important;
  transition: transform .25s ease, filter .25s ease;
}
.cr-card-wrap.fly:active {
  transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(.97) !important;
}
.cr-card-wrap.crumble {
  animation: cardCrumble .8s cubic-bezier(.55,0,1,.45) forwards !important;
  animation-delay: var(--cd) !important;
  pointer-events: none !important;
}
.cr-card-wrap.collect {
  animation: cardCollect .85s cubic-bezier(.22,.61,.36,1) forwards !important;
  animation-delay: var(--cd) !important;
  pointer-events: none !important;
}
@keyframes cardCrumble {
  0%   { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(1); opacity: 1; }
  20%  { transform: translate(var(--tx), var(--ty)) rotate(calc(var(--rot) + 12deg)) scale(1.03); opacity: 1; }
  60%  { transform: translate(calc(var(--tx) + var(--cx) * .7), calc(var(--ty) + var(--cy) * .7)) rotate(calc(var(--rot) + var(--cr) * .7)) scale(0.4); opacity: .6; }
  100% { transform: translate(calc(var(--tx) + var(--cx)), calc(var(--ty) + var(--cy)))
                    rotate(calc(var(--rot) + var(--cr))) scale(0.06); opacity: 0; }
}
@keyframes cardCollect {
  0%   { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(1); opacity: 1; }
  55%  { transform: translate(calc(var(--tx) + var(--ctx)), calc(var(--ty) + var(--cty))) rotate(calc(var(--rot) + var(--cr2))) scale(0.95); opacity: 1; }
  100% { transform: translate(0, 7vh) rotate(0deg) scale(0.92); opacity: 1; }
}

.cr-card-wrap { transition: none; }
.cr-card-face {
  position: absolute; inset: 0; border-radius: 10px;
  backface-visibility: hidden; -webkit-backface-visibility: hidden;
  transition: transform .55s cubic-bezier(.4,0,.2,1);
}
.cr-card-back  { transform: rotateY(0deg); }
.cr-card-front { transform: rotateY(180deg); }
.cr-card-wrap.flipped .cr-card-back  { transform: rotateY(-180deg); }
.cr-card-wrap.flipped .cr-card-front { transform: rotateY(0deg); }

.cr-card-back {
  background: linear-gradient(145deg, #2A1F06, #0E1020);
  border: 1.5px solid rgba(191,140,0,.4);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
}
.cr-back-label {
  font-family: 'Oswald', sans-serif;
  font-size: clamp(11px, 2.2vw, 15px);
  letter-spacing: .3em; color: rgba(255,209,102,.6);
}

.cr-card-front {
  background: linear-gradient(155deg, var(--card-bg-from, #1C1C1C) 0%, #0D0D14 100%);
  border: 1.5px solid var(--r-color);
  display: flex; flex-direction: column; overflow: hidden; padding: 0;
}
.cr-card-glow {
  position: absolute; inset: -1px; border-radius: 10px;
  box-shadow: inset 0 0 12px rgba(0,0,0,.7), var(--r-shadow);
  pointer-events: none; z-index: 10;
}
.cr-card-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 7px 3px; background: rgba(0,0,0,.4); flex-shrink: 0;
}
.cr-rarity-badge {
  font-family: 'Oswald', sans-serif;
  font-size: clamp(6px, 1.2vw, 8px); font-weight: 500;
  letter-spacing: .15em; padding: 1px 5px; border-radius: 3px; text-transform: uppercase;
}
.cr-discipline {
  font-size: clamp(6px, 1.1vw, 8px); font-weight: 600;
  letter-spacing: .1em; color: rgba(255,255,255,.4); text-transform: uppercase;
}

.cr-art-zone {
  flex: 1; position: relative;
  display: flex; align-items: center; justify-content: center;
  margin: 4px 5px; border-radius: 5px;
  background: rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.06);
  overflow: hidden; min-height: 0;
}
.cr-art-bg { position:absolute; inset:0; pointer-events:none; }
.cr-profile-img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: top center;
  position: absolute; inset: 0;
  opacity: .85;
}
.cr-grade-overlay {
  position: absolute; bottom: 4px; right: 6px;
  font-family: 'Oswald', sans-serif;
  font-size: clamp(14px, 3vw, 20px); font-weight: 700;
  color: var(--r-color);
  text-shadow: 0 0 10px var(--r-color), 0 2px 4px rgba(0,0,0,.9);
  z-index: 3; line-height: 1;
}

.cr-name-row {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 3px 6px 1px; flex-shrink: 0;
}
.cr-athlete-name {
  font-family: 'Oswald', sans-serif;
  font-size: clamp(9px, 1.9vw, 12px); font-weight: 700; color: #fff;
  letter-spacing: .04em; white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis; max-width: 72%;
}
.cr-power-badge {
  font-size: clamp(7px, 1.3vw, 9px); font-weight: 700;
  letter-spacing: .05em; white-space: nowrap; flex-shrink: 0;
}
.cr-quote {
  font-size: clamp(6px, 1.1vw, 7.5px); color: rgba(255,255,255,.3);
  font-style: italic; padding: 0 6px 3px; line-height: 1.3;
  flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cr-stats { padding: 0 5px 5px; display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
.cr-stat-row { display: flex; align-items: center; gap: 4px; }
.cr-stat-label {
  font-family: 'Oswald', sans-serif;
  font-size: clamp(5.5px, 1.1vw, 7.5px); font-weight: 500;
  color: rgba(255,255,255,.4); letter-spacing: .1em; width: 22px; flex-shrink: 0;
}
.cr-stat-track {
  flex: 1; height: 4px; background: rgba(255,255,255,.08); border-radius: 2px; overflow: hidden;
}
.cr-stat-fill {
  height: 100%; width: var(--fill); background: var(--fill-color);
  border-radius: 2px; box-shadow: 0 0 4px var(--fill-color);
  animation: statGrow .6s ease forwards; transform-origin: left;
}
@keyframes statGrow { from { width: 0; } to { width: var(--fill); } }
.cr-stat-val {
  font-family: 'Rajdhani', sans-serif;
  font-size: clamp(6px, 1.1vw, 8px); font-weight: 700;
  color: rgba(255,255,255,.55); width: 18px; text-align: right; flex-shrink: 0;
}
.cr-holo {
  position:absolute; inset:0; border-radius:10px; pointer-events:none; z-index:9;
  background: linear-gradient(
    110deg, transparent 38%, rgba(255,255,255,.05) 44%,
    rgba(255,255,255,.09) 50%, transparent 56%
  );
}

.cr-cta {
  position: absolute; bottom: 5%; left: 50%; transform: translateX(-50%);
  z-index: 30; font-family: 'Oswald', sans-serif;
  font-size: clamp(11px, 2.2vw, 14px); font-weight: 500;
  letter-spacing: .25em; color: rgba(255,255,255,.45);
  text-transform: uppercase; animation: fadeUp .5s ease forwards;
  white-space: nowrap; cursor: pointer;
}
.cr-cta-pulse { animation: fadeUp .5s ease forwards, ctaPulse 2s ease infinite; }
@keyframes ctaPulse { 0%,100% { opacity: .3; } 50% { opacity: .75; } }
.cr-hint {
  position: absolute; bottom: 1.5%; left:50%; transform: translateX(-50%);
  z-index:30; font-family:'Rajdhani',sans-serif;
  font-size: clamp(8px,1.5vw,10px); letter-spacing:.18em;
  color:rgba(255,255,255,.35); text-transform:uppercase;
  animation: fadeUp .8s .4s ease both; white-space:nowrap;
}
@keyframes fadeUp {
  from { opacity:0; transform: translateX(-50%) translateY(12px); }
  to   { opacity:1; transform: translateX(-50%) translateY(0); }
}
`;
