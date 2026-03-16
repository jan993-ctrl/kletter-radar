"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

const fallbackAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "K")}&background=2A1F06&color=FFD166&size=300`;

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
  const remaining = activeCards.length - revealed.length;

  const toggleReveal = (i) => {
    if (phase !== "done") return;
    setRevealed((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  const handleRootClick = () => {
    if (phase === "idle") {
      startAnimation();
      return;
    }
    if (phase === "done" && allRevealed) {
      triggerExit();
    }
  };

  return (
    <div className="cr-root" onClick={handleRootClick}>
      <style>{CSS}</style>

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

      {bagVisible && <ShardChest />}

      <div className={`cr-pack ${phase === "exit" ? "crumble" : phase}`} style={packTheme} role="button" aria-label="Pack öffnen">
        <div className="cr-pack-top" />
        <div className={`cr-slice ${["slice", "open", "cards", "done", "exit"].includes(phase) ? "vis" : ""}`} />
        <div className="cr-pack-body">
          <div className="cr-pack-shine" />
          <div className="cr-pack-noise" />
          <div className="cr-pack-content">
            <span className="cr-pack-eyebrow">SEASON 26 · CRUX</span>
            <span className="cr-pack-title">CRUX<br />CARDS</span>
            <MountainClimberIcon />
            <span className="cr-pack-sub">{cards.length} CLIMBERS INSIDE</span>
          </div>
        </div>
      </div>

      {phase === "idle" && cards.length > 0 && <p className="cr-cta cr-cta-pulse">TAP TO OPEN PACK</p>}
      {phase === "idle" && cards.length === 0 && <p className="cr-hint">no cards available</p>}
      {phase === "done" && !allRevealed && (
        <p className="cr-hint">{revealed.length === 0 ? "tap each card to reveal" : `${remaining} card${remaining !== 1 ? "s" : ""} left`}</p>
      )}
      {phase === "done" && allRevealed && <p className="cr-cta cr-cta-pulse">tap anywhere to collect</p>}
    </div>
  );
}

function ClimberCard({ card, index, isLaunched, isRevealed, exitMode, gatherPos, bagOffset, isDone, onClick }) {
  const pos = SPREAD[index] || SPREAD[0];
  const cd = CRUMBLE_DIRS[index] || CRUMBLE_DIRS[0];
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
    setTilt({
      rx: (0.5 - py) * 7,
      ry: (px - 0.5) * 9,
    });
  };

  const resetTilt = () => setTilt({ rx: 0, ry: 0 });

  return (
    <div
      className={["cr-card-wrap", isLaunched ? "fly" : "", isRevealed ? "flipped" : "", isGather ? "gather" : "", canTilt ? "alive" : ""].join(" ")}
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
        "--gx": `${gatherPos?.gx ?? 0}px`,
        "--gy": `${gatherPos?.gy ?? 0}px`,
        "--hrx": `${tilt.rx}deg`,
        "--hry": `${tilt.ry}deg`,
      }}
      onMouseMove={handlePointerMove}
      onMouseLeave={resetTilt}
      onClick={isDone && !exitMode ? onClick : undefined}
    >
      <div className="cr-card-face cr-card-back" style={isShatter ? { opacity: 0 } : {}}>
        <MountainClimberIcon size={42} />
        <span className="cr-back-label">CRUX</span>
      </div>

      <div className="cr-card-face cr-card-front" style={{ "--card-bg-from": meta.bgFrom, ...(isShatter ? { opacity: 0 } : {}) }}>
        <div className="cr-card-glow" />
        <div className="cr-card-head">
          <span className="cr-rarity-badge" style={{ background: meta.badge, color: meta.color }}>{meta.label}</span>
          <span className="cr-discipline">POW {powerScore}</span>
        </div>
        <div className="cr-art-zone">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.image_url || fallbackAvatar(card.name)}
            alt={card.name || "Kletterer"}
            className="cr-profile-img"
            onError={(e) => {
              e.currentTarget.src = fallbackAvatar(card.name);
            }}
          />
          <span className="cr-grade-overlay">{card.grade || getGrade(powerScore)}</span>
        </div>
        <div className="cr-name-row">
          <span className="cr-athlete-name">{card.name || "Kletterer"}</span>
          <span className="cr-power-badge">{card.set_name || "Community"}</span>
        </div>
        <p className="cr-quote">{card.quote ? `“${card.quote}”` : "“Keep climbing.”"}</p>
        <div className="cr-stats">
          <StatBar label="POW" value={Math.max(0, Math.min(100, powerScore))} color={meta.color} />
          <StatBar label="TEC" value={card.stats?.tech ?? toPercent(safeAbilities[2])} color={meta.color} />
          <StatBar label="END" value={card.stats?.endurance ?? toPercent(safeAbilities[6])} color={meta.color} />
        </div>
      </div>

      {isShatter && (
        <>
          <div className="cr-shatter-flash" />
          {SHARDS.map((s, si) => (
            <div
              key={si}
              className="cr-shard"
              style={{
                "--shard-clip": s.clip,
                "--stx": s.tx,
                "--sty": s.ty,
                "--srot": s.rot,
                "--shard-delay": s.delay,
                "--bag-tx": bagOffset?.bx ?? "0px",
                "--bag-ty": bagOffset?.by ?? "0px",
                background: `linear-gradient(155deg, ${meta.bgFrom} 0%, #0D0D14 100%)`,
                border: `1.5px solid ${meta.color}`,
              }}
            />
          ))}
        </>
      )}
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

function ShardChest() {
  return (
    <div className="cr-bag-wrap">
      <div style={{ perspective: "380px", perspectiveOrigin: "50% 120%", position: "relative", width: 104, height: 84 }}>
        <div className="cr-chest-lid" style={{ position: "absolute", top: 0, left: 0, width: 104, height: 34, transformOrigin: "50% 100%" }}>
          <svg width="104" height="34" viewBox="0 0 104 34" fill="none" style={{ display: "block", overflow: "visible" }}>
            <defs>
              <linearGradient id="lidTop" x1="0" y1="0" x2="0" y2="34" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#A06220" />
                <stop offset="100%" stopColor="#5C3408" />
              </linearGradient>
              <linearGradient id="lidFront" x1="0" y1="22" x2="0" y2="34" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7A4410" />
                <stop offset="100%" stopColor="#4A2A06" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="100" height="22" rx="3" fill="url(#lidTop)" stroke="#1E0A00" strokeWidth="1.4" />
            <line x1="2" y1="10" x2="102" y2="10" stroke="rgba(0,0,0,.22)" strokeWidth="1" />
            <line x1="2" y1="17" x2="102" y2="17" stroke="rgba(0,0,0,.18)" strokeWidth="1" />
            <rect x="4" y="3" width="96" height="5" rx="1.5" fill="rgba(255,200,80,.1)" />
            <rect x="2" y="22" width="100" height="10" rx="2" fill="url(#lidFront)" stroke="#1E0A00" strokeWidth="1.4" />
            <rect x="2" y="22" width="100" height="5" rx="1" fill="#BF8C00" stroke="#7A5200" strokeWidth="1" />
            {[12, 30, 52, 74, 92].map((x) => <circle key={x} cx={x} cy="24.5" r="2.3" fill="#FFD166" stroke="#8B5E00" strokeWidth=".6" />)}
            <rect x="2" y="2" width="8" height="30" rx="2" fill="none" stroke="#CF9A10" strokeWidth="2" />
            <rect x="94" y="2" width="8" height="30" rx="2" fill="none" stroke="#CF9A10" strokeWidth="2" />
            <rect x="40" y="18" width="24" height="14" rx="4" fill="#FFD166" stroke="#8B5E00" strokeWidth="1.5" />
            <rect x="43" y="21" width="18" height="9" rx="3" fill="#BF8C00" />
            <circle cx="52" cy="24.5" r="3" fill="#3E1A00" />
            <rect x="50.7" y="24.5" width="2.6" height="4.5" rx="1" fill="#3E1A00" />
            <rect x="2" y="26" width="14" height="7" rx="2" fill="#FFD166" stroke="#8B5E00" strokeWidth="1.2" />
            <circle cx="9" cy="29.5" r="2.5" fill="#8B6000" />
            <circle cx="9" cy="29.5" r="1" fill="#FFD166" />
            <rect x="88" y="26" width="14" height="7" rx="2" fill="#FFD166" stroke="#8B5E00" strokeWidth="1.2" />
            <circle cx="95" cy="29.5" r="2.5" fill="#8B6000" />
            <circle cx="95" cy="29.5" r="1" fill="#FFD166" />
          </svg>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, width: 104, height: 54 }}>
          <svg width="104" height="54" viewBox="0 0 104 54" fill="none" style={{ display: "block", overflow: "visible" }}>
            <defs>
              <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="54" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7A4610" />
                <stop offset="100%" stopColor="#3A1E04" />
              </linearGradient>
              <linearGradient id="innerGrad" x1="0" y1="0" x2="0" y2="12" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#120600" />
                <stop offset="100%" stopColor="#28120A" />
              </linearGradient>
            </defs>
            <rect x="2" y="0" width="100" height="14" rx="2" fill="url(#innerGrad)" />
            <rect x="2" y="0" width="100" height="50" rx="3" fill="url(#bodyGrad)" stroke="#1E0A00" strokeWidth="1.4" />
            <line x1="2" y1="14" x2="102" y2="14" stroke="rgba(0,0,0,.22)" strokeWidth="1" />
            <line x1="2" y1="26" x2="102" y2="26" stroke="rgba(0,0,0,.2)" strokeWidth="1" />
            <line x1="2" y1="38" x2="102" y2="38" stroke="rgba(0,0,0,.16)" strokeWidth="1" />
            <rect x="2" y="0" width="100" height="7" rx="1" fill="#BF8C00" stroke="#7A5200" strokeWidth="1" />
            <rect x="2" y="43" width="100" height="7" rx="1" fill="#BF8C00" stroke="#7A5200" strokeWidth="1" />
            {[12, 30, 52, 74, 92].map((x) => <circle key={x} cx={x} cy="3.5" r="2.3" fill="#FFD166" stroke="#8B5E00" strokeWidth=".6" />)}
            {[12, 30, 52, 74, 92].map((x) => <circle key={x} cx={x} cy="46.5" r="2.3" fill="#FFD166" stroke="#8B5E00" strokeWidth=".6" />)}
            <rect x="48" y="0" width="8" height="50" fill="#BF8C00" stroke="#7A5200" strokeWidth="1" />
            <rect x="2" y="0" width="9" height="50" rx="2" fill="none" stroke="#CF9A10" strokeWidth="2.2" />
            <rect x="93" y="0" width="9" height="50" rx="2" fill="none" stroke="#CF9A10" strokeWidth="2.2" />
            <rect x="2" y="0" width="16" height="7" rx="2" fill="#FFD166" stroke="#8B5E00" strokeWidth="1.2" />
            <rect x="86" y="0" width="16" height="7" rx="2" fill="#FFD166" stroke="#8B5E00" strokeWidth="1.2" />
            <circle cx="10" cy="3.5" r="2.5" fill="#8B6000" />
            <circle cx="94" cy="3.5" r="2.5" fill="#8B6000" />
          </svg>
        </div>
      </div>
      <span className="cr-bag-label">DUPLIKAT</span>
    </div>
  );
}

function MountainClimberIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" className="cr-carabiner">
      <path d="M2 46 L20 10 L26 20 L32 10 L50 46 Z" fill="currentColor" opacity=".18" />
      <path d="M2 46 L20 10 L26 20 L32 10 L50 46" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" opacity=".7" />
      <path d="M32 10 L28.5 17 L35.5 17 Z" fill="currentColor" opacity=".5" />
      <circle cx="20" cy="7" r="2.2" fill="currentColor" opacity=".95" />
    </svg>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Rajdhani:wght@400;600;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
.cr-root { position: relative; width: 100%; height: 100%; min-height: 100dvh; display: flex; align-items: center; justify-content: center; overflow: hidden; font-family: 'Rajdhani', sans-serif; }
.cr-pack { position: relative; z-index: 10; width: clamp(130px,22vw,175px); height: clamp(210px,36vw,285px); display: flex; flex-direction: column; cursor: pointer; filter: drop-shadow(0 20px 50px rgba(0,0,0,.75)); }
.cr-pack.shake { animation: packShake .65s ease forwards; }
@keyframes packShake { 15%{transform:rotate(-2.5deg) translateX(-11px)} 30%{transform:rotate(2deg) translateX(11px)} 100%{transform:rotate(0) translateX(0)} }
.cr-pack-top { height: 16%; background: linear-gradient(135deg, var(--pt-top-from,#2D2208) 0%, var(--pt-top-to,#3D3010) 100%); border-radius: 12px 12px 0 0; border-bottom: 2px solid var(--pt-top-border,#BF8C00); transition: transform .45s, opacity .45s; }
.cr-pack.open .cr-pack-top,.cr-pack.cards .cr-pack-top,.cr-pack.done .cr-pack-top,.cr-pack.crumble .cr-pack-top { transform: translateY(-160%) rotate(20deg) translateX(20%); opacity: 0; }
.cr-slice { position:absolute; top:16%; left:50%; width:0; height:2px; transform:translateX(-50%); opacity:0; transition:width .38s, opacity .2s; background:linear-gradient(90deg, transparent, var(--pt-slice,#FFD166), #fff, var(--pt-slice,#FFD166), transparent); box-shadow:0 0 10px 4px var(--pt-slice-glow,rgba(255,209,102,.5)); }
.cr-slice.vis { width:100%; opacity:1; }
.cr-pack-body { flex:1; background: linear-gradient(160deg, var(--pt-body-from,#2A1F06) 0%, var(--pt-body-mid,#1C1505) 60%, var(--pt-body-to,#0E1020) 100%); border-radius:0 0 12px 12px; border:1px solid var(--pt-body-border,rgba(191,140,0,.35)); border-top:none; position:relative; overflow:hidden; }
.cr-pack-content { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:space-evenly; padding:8% 8% 10%; }
.cr-pack-eyebrow { font-size: clamp(6px,1.3vw,8px); letter-spacing:.22em; color: var(--pt-eyebrow,rgba(191,140,0,.8)); font-weight:700; }
.cr-pack-title { font-family:'Oswald',sans-serif; color: var(--pt-title,#FFD166); text-shadow:0 0 20px var(--pt-title-glow,rgba(255,209,102,.4)); font-size: clamp(20px,4.5vw,30px); line-height:.95; text-align:center; }
.cr-carabiner { color: var(--pt-icon,rgba(255,209,102,.7)); }
.cr-pack-sub { font-size: clamp(6px,1.3vw,8px); color: rgba(255,255,255,.3); letter-spacing:.2em; }
.cr-pack.crumble { animation: packCrumble .7s .1s forwards; }
@keyframes packCrumble { 100% { transform:scale(0) rotate(25deg) translateY(40px); opacity:0; } }
.cr-card-wrap { position:absolute; z-index:20; width:clamp(100px,17vw,148px); height:clamp(150px,25vw,215px); transform:translate(0,0) scale(0); opacity:0; perspective:800px; }
.cr-card-wrap.fly { animation: cardFly .8s forwards; animation-delay: var(--delay); pointer-events:auto; }
@keyframes cardFly { 0% { transform:translate(0,0) scale(.15); opacity:0; } 100% { transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1); opacity:1; } }
.cr-card-wrap.gather { animation: cardGather 1.5s forwards !important; pointer-events:none !important; }
@keyframes cardGather { 0% { transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1); opacity:1;} 100% { transform:translate(var(--gx), var(--gy)) rotate(0deg) scale(1.04); opacity:1;} }
.cr-card-face { position:absolute; inset:0; border-radius:10px; backface-visibility:hidden; transition:transform .55s; }
.cr-card-back { transform:rotateY(0deg); background:linear-gradient(145deg,#2A1F06,#0E1020); border:1.5px solid rgba(191,140,0,.4); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:8px; }
.cr-card-front { transform:rotateY(180deg); background:linear-gradient(155deg,var(--card-bg-from,#1C1C1C) 0%,#0D0D14 100%); border:1.5px solid var(--r-color); overflow:hidden; display:flex; flex-direction:column; }
.cr-card-wrap.flipped .cr-card-back { transform:rotateY(-180deg); }
.cr-card-wrap.flipped .cr-card-front { transform:rotateY(0deg); }
.cr-card-wrap.alive { transition: transform .18s ease-out, filter .2s ease; }
.cr-card-wrap.alive:hover { filter: drop-shadow(0 0 20px rgba(255,209,102,.32)); }
.cr-card-wrap.alive.flipped { transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) rotateX(var(--hrx, 0deg)) rotateY(var(--hry, 0deg)) scale(1.025); }
.cr-profile-img { width:100%; height:100%; object-fit:cover; }
.cr-card-head { display:flex; justify-content:space-between; padding:5px 7px 3px; background:rgba(0,0,0,.4); }
.cr-rarity-badge { font-family:'Oswald',sans-serif; font-size:7px; letter-spacing:.15em; padding:1px 5px; border-radius:3px; }
.cr-discipline { font-size:8px; color:rgba(255,255,255,.5); }
.cr-art-zone { flex:1; margin:4px 5px; border-radius:5px; overflow:hidden; border:1px solid rgba(255,255,255,.06); }
.cr-grade-overlay { position:absolute; right:6px; bottom:4px; color:var(--r-color); font-family:'Oswald',sans-serif; font-size:18px; text-shadow:0 0 10px var(--r-color); }
.cr-name-row { display:flex; justify-content:space-between; padding:3px 6px 1px; }
.cr-athlete-name { font-family:'Oswald',sans-serif; font-size:11px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70%; }
.cr-power-badge { font-size:8px; color:rgba(255,255,255,.6); }
.cr-quote { font-size:7px; color:rgba(255,255,255,.35); padding:0 6px 3px; font-style:italic; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cr-stats { padding:0 5px 5px; display:flex; flex-direction:column; gap:2px; }
.cr-stat-row { display:flex; align-items:center; gap:4px; }
.cr-stat-track { flex:1; height:4px; background:rgba(255,255,255,.08); border-radius:2px; overflow:hidden; }
.cr-stat-fill { height:100%; width:var(--fill); background:var(--fill-color); }
.cr-stat-label,.cr-stat-val { font-size:7px; color:rgba(255,255,255,.6); }
.cr-shard { position:absolute; inset:0; clip-path:var(--shard-clip); animation:shardCollect 1.8s forwards; animation-delay:var(--shard-delay); }
@keyframes shardCollect { 0%{transform:translate(0,0) scale(1); opacity:1} 100%{transform:translate(var(--bag-tx), var(--bag-ty)) rotate(var(--srot)) scale(0.03); opacity:0} }
.cr-shatter-flash { position:absolute; inset:0; border-radius:10px; background:white; animation:shatterFlash .3s forwards; }
@keyframes shatterFlash { 0%{opacity:.8} 100%{opacity:0} }
.cr-bag-wrap { position:absolute; left:50%; bottom:14%; transform:translateX(-50%); z-index:60; display:flex; flex-direction:column; align-items:center; gap:6px; animation:bagAppear .5s cubic-bezier(.22,.61,.36,1) both, bagWiggle .55s 2.3s ease both; pointer-events:none; filter:drop-shadow(0 8px 22px rgba(0,0,0,.85)) drop-shadow(0 0 14px rgba(191,140,0,.35)); }
.cr-bag-label { font-family:'Oswald',sans-serif; font-size:9px; letter-spacing:.22em; color:rgba(191,140,0,.6); text-transform:uppercase; }
.cr-chest-lid { transform-origin:50% 100%; animation:chestLidAnim 2.6s .45s ease-in-out forwards; }
@keyframes chestLidAnim { 0%{transform:rotateX(0deg);} 18%{transform:rotateX(-108deg);} 78%{transform:rotateX(-108deg);} 100%{transform:rotateX(0deg);} }
@keyframes bagAppear { 0%{transform:translateX(-50%) scale(.3) translateY(20px); opacity:0;} 70%{transform:translateX(-50%) scale(1.12) translateY(-3px); opacity:1;} 100%{transform:translateX(-50%) scale(1) translateY(0); opacity:1;} }
@keyframes bagWiggle { 0%{transform:translateX(-50%) rotate(0deg) scale(1);} 20%{transform:translateX(-50%) rotate(-8deg) scale(1.08);} 40%{transform:translateX(-50%) rotate(7deg) scale(1.06);} 60%{transform:translateX(-50%) rotate(-5deg) scale(1.04);} 80%{transform:translateX(-50%) rotate(3deg) scale(1.02);} 100%{transform:translateX(-50%) rotate(0deg) scale(1);} }
.cr-cta,.cr-hint { position:absolute; left:50%; transform:translateX(-50%); color:rgba(255,255,255,.5); text-transform:uppercase; letter-spacing:.2em; }
.cr-cta { bottom:5%; font-family:'Oswald',sans-serif; }
.cr-hint { bottom:1.5%; font-size:10px; }
.cr-cta-pulse { animation: ctaPulse 2s ease infinite; }
@keyframes ctaPulse { 0%,100% { opacity:.3; } 50% { opacity:.75; } }
`;
