"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GRADES = ["1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", "4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", "7a", "7b", "7c", "8a", "8b", "8c", "9a"];
const STYLE_LABELS = ["Crimper", "Sloper", "Slab", "Dyno", "Pocket"];

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

const RARITY_META = {
  legendary: { label: "LEGENDARY", color: "#FFB300", shadow: "0 0 24px #FFB30088, 0 0 48px #FF8F0044", badge: "#7B5800", bgFrom: "#3D2000" },
  rare: { label: "RARE", color: "#42A5F5", shadow: "0 0 16px #42A5F566, 0 0 32px #1565C033", badge: "#0D47A1", bgFrom: "#001A3D" },
  common: { label: "COMMON", color: "#9E9E9E", shadow: "0 4px 16px rgba(0,0,0,.5)", badge: "#212121", bgFrom: "#1C1C1C" },
};

const fallbackAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "K")}&background=2A1F06&color=FFD166&size=300`;

const clampAbility = (value) => Math.max(0, Math.min(24, Number(value) || 0));
const toPercent = (value) => Math.round((clampAbility(value) / 24) * 100);

const normalizeCard = (card) => {
  const abilities = Array.isArray(card.abilities) && card.abilities.length > 0 ? card.abilities.map(clampAbility) : [0, 0, 0, 0, 0, 0, 0];
  const styles = Array.isArray(card.styles) && card.styles.length > 0 ? card.styles.map(clampAbility) : [0, 0, 0, 0, 0];
  const abilityPower = Math.round((abilities.reduce((sum, value) => sum + value, 0) / (Math.max(abilities.length, 1) * 24)) * 100);
  const power = Number(card?.stats?.power);
  const powerScore = Number.isFinite(power) ? Math.max(0, Math.min(100, power)) : abilityPower;
  const rarity = card.rarity || (powerScore >= 80 ? "legendary" : powerScore >= 50 ? "rare" : "common");

  const bestStyleIndex = styles.indexOf(Math.max(...styles));
  const discipline = card.discipline || ([1, 2].includes(bestStyleIndex) ? "Lead" : "Boulder");
  const grade =
    card.grade ||
    GRADES[Math.max(0, Math.min(GRADES.length - 1, Math.round((powerScore / 100) * (GRADES.length - 1))))];

  return {
    ...card,
    rarity,
    powerScore,
    discipline,
    grade,
    styleLabel: STYLE_LABELS[bestStyleIndex] || "Boulder",
    quote: card.quote || card.notes || "Kraxelt seit Level 1a hoch.",
    country: card.country || card.gym_name || "GYM",
    flag: card.flag || "🧗",
    imageUrl: card.image_url || fallbackAvatar(card.name),
    statPower: Number(card?.stats?.power) || toPercent(abilities[0]),
    statTech: Number(card?.stats?.tech) || toPercent(abilities[2]),
    statEndurance: Number(card?.stats?.endurance) || toPercent(abilities[6] ?? abilities[3]),
  };
};

export default function ClimberPackOpening({ cards = [], onDone, onDismiss }) {
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
    later(() => {
      setPhase("done");
      onDone?.(cards);
    }, 3600);
  }, [cards, onDone]);

  const triggerExit = useCallback(() => {
    const modes = {};
    const newCards = [];
    const duplicateCards = [];

    activeCards.forEach((card, i) => {
      const isDupe = Boolean(card.isOwned);
      modes[i] = isDupe ? "shatter" : "gather";
      if (isDupe) duplicateCards.push(i);
      else newCards.push(i);
    });
    setExitModes(modes);

    const CARD_W = 148;
    const GAP = 12;
    const Y_OFFSET = -110;
    const gp = {};

    if (newCards.length <= 3) {
      newCards.forEach((cardIdx, j) => {
        gp[cardIdx] = { gx: (j - (newCards.length - 1) / 2) * (CARD_W + GAP), gy: Y_OFFSET };
      });
    } else {
      const radius = 140 + newCards.length * 8;
      newCards.forEach((cardIdx, j) => {
        const angle = (j / newCards.length) * 2 * Math.PI - Math.PI / 2;
        gp[cardIdx] = { gx: Math.cos(angle) * radius, gy: Math.sin(angle) * radius + Y_OFFSET };
      });
    }
    setGatherPos(gp);

    const BAG_X_VW = 0;
    const BAG_Y_VH = 31;
    const bo = {};
    duplicateCards.forEach((i) => {
      const sp = SPREAD[i] || SPREAD[0];
      bo[i] = { bx: `${BAG_X_VW - sp.x}vw`, by: `${BAG_Y_VH - sp.y}vh` };
    });
    setBagOffsets(bo);
    if (duplicateCards.length > 0) setBagVisible(true);

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
  }, [activeCards, onDismiss]);

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
          key={card.user_id || card.id || i}
          card={card}
          index={i}
          isLaunched={launched.includes(i)}
          isRevealed={revealed.includes(i)}
          exitMode={phase === "exit" ? (exitModes[i] || null) : null}
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

      <div className={`cr-pack ${phase === "exit" ? "crumble" : phase}`} role="button" aria-label="Pack öffnen">
        <div className="cr-pack-top" />
        <div className={`cr-slice ${["slice", "open", "cards", "done", "exit"].includes(phase) ? "vis" : ""}`} />
        <div className="cr-pack-body">
          <div className="cr-pack-shine" />
          <div className="cr-pack-noise" />
          <div className="cr-pack-content">
            <span className="cr-pack-eyebrow">SEASON 1 · PRO SERIES</span>
            <span className="cr-pack-title">CRUX<br />CARDS</span>
            <MountainClimberIcon />
            <span className="cr-pack-sub">{cards.length} KLETTERER INSIDE</span>
          </div>
        </div>
      </div>

      {phase === "idle" && cards.length > 0 && <p className="cr-cta cr-cta-pulse">PACK ÖFFNEN</p>}
      {phase === "idle" && cards.length === 0 && <p className="cr-hint">keine Karten verfügbar</p>}
      {phase === "done" && !allRevealed && (
        <p className="cr-hint">
          {revealed.length === 0 ? "Karte antippen zum Aufdecken" : `Noch ${remaining} Karte${remaining !== 1 ? "n" : ""} übrig`}
        </p>
      )}
      {phase === "done" && allRevealed && <p className="cr-cta cr-cta-pulse">Tippen zum Einsammeln</p>}
    </div>
  );
}

function ClimberCard({ card, index, isLaunched, isRevealed, exitMode, gatherPos, bagOffset, isDone, onClick }) {
  const normalized = normalizeCard(card);
  const pos = SPREAD[index] || SPREAD[0];
  const cd = CRUMBLE_DIRS[index] || CRUMBLE_DIRS[0];
  const meta = RARITY_META[normalized.rarity] || RARITY_META.common;

  const isShatter = exitMode === "shatter";
  const isGather = exitMode === "gather";

  return (
    <div
      className={["cr-card-wrap", isLaunched ? "fly" : "", isRevealed ? "flipped" : "", isGather ? "gather" : ""].join(" ")}
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
        "--gx": gatherPos ? `${gatherPos.gx}px` : "0px",
        "--gy": gatherPos ? `${gatherPos.gy}px` : "0px",
      }}
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
          <span className="cr-discipline">{normalized.discipline} · {normalized.styleLabel}</span>
        </div>

        <div className="cr-art-zone">
          <div className="cr-art-bg" style={{ background: `radial-gradient(circle at 60% 40%, ${meta.color}22 0%, transparent 70%)` }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normalized.imageUrl}
            alt={normalized.name || "Kletterer"}
            className="cr-profile-img"
            onError={(e) => {
              e.currentTarget.src = fallbackAvatar(normalized.name);
            }}
          />
          <span className="cr-grade-overlay">{normalized.grade}</span>
        </div>

        <div className="cr-name-row">
          <span className="cr-athlete-name">{normalized.name || "Kletter-Gast"}</span>
          <span className="cr-flag">{normalized.flag} {normalized.country}</span>
        </div>

        <p className="cr-quote">&ldquo;{normalized.quote}&rdquo;</p>

        <div className="cr-stats">
          <StatBar label="KRF" value={normalized.statPower} color={meta.color} />
          <StatBar label="TEC" value={normalized.statTech} color={meta.color} />
          <StatBar label="MEN" value={normalized.statEndurance} color={meta.color} />
        </div>
        <div className="cr-holo" />
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
                boxShadow: `inset 0 0 8px rgba(0,0,0,.6), 0 0 6px ${meta.color}66`,
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
        <div className="cr-stat-fill" style={{ "--fill": `${Math.max(0, Math.min(100, value))}%`, "--fill-color": color }} />
      </div>
      <span className="cr-stat-val">{Math.round(value)}</span>
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
      <line x1="20" y1="9.2" x2="20" y2="13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="10.5" x2="17" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20" y1="10.5" x2="23" y2="7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20" y1="13.5" x2="18" y2="16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20" y1="13.5" x2="22" y2="16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 13.5 Q17 18 18 22" stroke="currentColor" strokeWidth="1.3" fill="none" opacity=".45" strokeLinecap="round" />
    </svg>
  );
}

function ShardChest() {
  return (
    <div className="cr-bag-wrap">
      <div style={{ perspective: "380px", perspectiveOrigin: "50% 120%", position: "relative", width: 104, height: 84 }}>
        <div className="cr-chest-lid" style={{ position: "absolute", top: 0, left: 0, width: 104, height: 34, transformOrigin: "50% 100%" }}>
          <svg width="104" height="34" viewBox="0 0 104 34" fill="none" style={{ display: "block", overflow: "visible" }}>
            <rect x="2" y="2" width="100" height="22" rx="3" fill="#8A4E18" stroke="#1E0A00" strokeWidth="1.4" />
            <rect x="2" y="22" width="100" height="10" rx="2" fill="#5C3408" stroke="#1E0A00" strokeWidth="1.4" />
            <rect x="2" y="22" width="100" height="5" rx="1" fill="#BF8C00" stroke="#7A5200" strokeWidth="1" />
          </svg>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 104, height: 54 }}>
          <svg width="104" height="54" viewBox="0 0 104 54" fill="none" style={{ display: "block", overflow: "visible" }}>
            <rect x="2" y="0" width="100" height="50" rx="3" fill="#6C3E12" stroke="#1E0A00" strokeWidth="1.4" />
            <rect x="2" y="0" width="100" height="7" rx="1" fill="#BF8C00" stroke="#7A5200" strokeWidth="1" />
            <rect x="2" y="43" width="100" height="7" rx="1" fill="#BF8C00" stroke="#7A5200" strokeWidth="1" />
          </svg>
        </div>
      </div>
      <span className="cr-bag-label">DUPLIKATE</span>
    </div>
  );
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
.cr-root { position: relative; width: 100%; height: 100%; min-height: 100dvh; display: flex; align-items: center; justify-content: center; overflow: hidden; font-family: 'Rajdhani', sans-serif; }
.cr-pack { position: relative; z-index: 10; width: clamp(130px, 22vw, 175px); height: clamp(210px, 36vw, 285px); display: flex; flex-direction: column; cursor: pointer; filter: drop-shadow(0 20px 50px rgba(0,0,0,.75)); }
.cr-pack.shake { animation: packShake .65s ease forwards; }
@keyframes packShake { 0%{transform:rotate(0) translateX(0)} 25%{transform:rotate(-2deg) translateX(-10px)} 50%{transform:rotate(2deg) translateX(10px)} 100%{transform:rotate(0) translateX(0)} }
.cr-pack-top { height: 16%; background: linear-gradient(135deg, #2D2208 0%, #3D3010 100%); border-radius: 12px 12px 0 0; border-bottom: 2px solid #BF8C00; transition: transform .45s, opacity .45s; }
.cr-pack.open .cr-pack-top, .cr-pack.cards .cr-pack-top, .cr-pack.done .cr-pack-top, .cr-pack.crumble .cr-pack-top { transform: translateY(-160%) rotate(20deg) translateX(20%); opacity: 0; }
.cr-slice { position: absolute; top:16%; left:50%; width:0; height:2px; background:linear-gradient(90deg, transparent, #FFD166, #fff, #FFD166, transparent); transform:translateX(-50%); box-shadow:0 0 10px 4px rgba(255,209,102,.5); opacity:0; transition:width .38s, opacity .2s; }
.cr-slice.vis { width:100%; opacity:1; }
.cr-pack-body { flex:1; background: linear-gradient(160deg, #2A1F06 0%, #1C1505 60%, #0E1020 100%); border-radius:0 0 12px 12px; position:relative; overflow:hidden; border:1px solid rgba(191,140,0,.35); border-top:none; }
.cr-pack-noise { position:absolute; inset:0; background-image: repeating-linear-gradient(-45deg, transparent 0px, transparent 3px, rgba(255,255,255,.015) 3px, rgba(255,255,255,.015) 4px); }
.cr-pack-shine { position:absolute; top:0; bottom:0; left:70%; width:12%; background: linear-gradient(180deg, transparent 0%, rgba(255,220,100,.08) 30%, rgba(255,255,255,.04) 60%, transparent 100%); }
.cr-pack-content { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:space-evenly; padding:8% 8% 10%; }
.cr-pack-eyebrow{font-size:8px;letter-spacing:.2em;color:rgba(191,140,0,.8)} .cr-pack-title{font-family:'Oswald',sans-serif;font-size:clamp(20px,4.5vw,30px);font-weight:700;line-height:.95;text-align:center;color:#FFD166} .cr-carabiner{color:rgba(255,209,102,.7)} .cr-pack-sub{font-size:8px;color:rgba(255,255,255,.35)}
.cr-pack.crumble { animation: packCrumble .7s .1s cubic-bezier(.55,0,1,.45) forwards; pointer-events:none; }
@keyframes packCrumble { 0%{transform:scale(1);opacity:1} 100%{transform:scale(0) rotate(25deg) translateY(40px);opacity:0} }
.cr-card-wrap { position:absolute; z-index:20; width:clamp(100px,17vw,148px); height:clamp(150px,25vw,215px); transform:translate(0,0) rotate(0deg) scale(0); opacity:0; pointer-events:none; perspective:800px; transform-style:preserve-3d; }
.cr-card-wrap.fly { animation: cardFly .8s cubic-bezier(.22,.61,.36,1) forwards; animation-delay: var(--delay); pointer-events:auto; }
@keyframes cardFly { 0%{transform:translate(0,0) rotate(0deg) scale(.15);opacity:0} 20%{opacity:1} 100%{transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1);opacity:1} }
.cr-card-wrap.gather { animation: cardGather 1.5s cubic-bezier(.22,.61,.36,1) forwards !important; pointer-events:none !important; }
@keyframes cardGather { 0%{transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1);opacity:1} 100%{transform:translate(var(--gx), var(--gy)) rotate(0deg) scale(1.04);opacity:1} }
.cr-card-face { position:absolute; inset:0; border-radius:10px; backface-visibility:hidden; transition:transform .55s cubic-bezier(.4,0,.2,1); }
.cr-card-back{transform:rotateY(0deg)} .cr-card-front{transform:rotateY(180deg)} .cr-card-wrap.flipped .cr-card-back{transform:rotateY(-180deg)} .cr-card-wrap.flipped .cr-card-front{transform:rotateY(0deg)}
.cr-card-back{background:linear-gradient(145deg,#2A1F06,#0E1020);border:1.5px solid rgba(191,140,0,.4);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
.cr-back-label{font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:.25em;color:rgba(255,209,102,.6)}
.cr-card-front{background:linear-gradient(155deg,var(--card-bg-from,#1C1C1C) 0%,#0D0D14 100%);border:1.5px solid var(--r-color);display:flex;flex-direction:column;overflow:hidden}
.cr-card-head{display:flex;justify-content:space-between;align-items:center;padding:5px 7px 3px;background:rgba(0,0,0,.4)}
.cr-rarity-badge{font-family:'Oswald',sans-serif;font-size:7px;letter-spacing:.12em;padding:1px 5px;border-radius:3px}.cr-discipline{font-size:7px;color:rgba(255,255,255,.5)}
.cr-art-zone{flex:1;position:relative;display:flex;align-items:center;justify-content:center;margin:4px 5px;border-radius:5px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.06);overflow:hidden}
.cr-profile-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(1.08) contrast(1.04)}
.cr-art-bg{position:absolute;inset:0}.cr-grade-overlay{position:absolute;bottom:4px;right:6px;font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:var(--r-color);text-shadow:0 0 10px var(--r-color),0 2px 4px rgba(0,0,0,.9)}
.cr-name-row{display:flex;justify-content:space-between;align-items:baseline;padding:3px 6px 1px}.cr-athlete-name{font-family:'Oswald',sans-serif;font-size:10px;color:#fff;max-width:65%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cr-flag{font-size:8px;color:rgba(255,255,255,.5);white-space:nowrap}
.cr-quote{font-size:7px;color:rgba(255,255,255,.35);font-style:italic;padding:0 6px 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cr-stats{padding:0 5px 5px;display:flex;flex-direction:column;gap:2px}.cr-stat-row{display:flex;align-items:center;gap:4px}.cr-stat-label{font-family:'Oswald',sans-serif;font-size:6px;color:rgba(255,255,255,.4);width:22px}.cr-stat-track{flex:1;height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}.cr-stat-fill{height:100%;width:var(--fill);background:var(--fill-color);border-radius:2px}.cr-stat-val{font-size:7px;color:rgba(255,255,255,.6);width:16px;text-align:right}
.cr-holo{position:absolute;inset:0;border-radius:10px;pointer-events:none;background:linear-gradient(110deg,transparent 38%,rgba(255,255,255,.05) 44%,rgba(255,255,255,.09) 50%,transparent 56%)}
.cr-shard{position:absolute;inset:0;clip-path:var(--shard-clip);animation:shardCollect 1.8s cubic-bezier(.4,0,.2,1) forwards;animation-delay:var(--shard-delay);z-index:30}
@keyframes shardCollect { 0%{transform:translate(0,0) rotate(0deg) scale(1);opacity:1} 100%{transform:translate(var(--bag-tx), var(--bag-ty)) rotate(calc(var(--srot)*1.6)) scale(0.03);opacity:0} }
.cr-shatter-flash{position:absolute;inset:0;border-radius:10px;z-index:29;background:white;animation:shatterFlash .3s ease-out forwards} @keyframes shatterFlash{0%{opacity:.8}100%{opacity:0}}
.cr-bag-wrap{position:absolute;left:50%;bottom:14%;transform:translateX(-50%);z-index:60;display:flex;flex-direction:column;align-items:center;gap:6px;animation:bagAppear .5s both;pointer-events:none}
.cr-bag-label{font-family:'Oswald',sans-serif;font-size:9px;letter-spacing:.22em;color:rgba(191,140,0,.6);text-transform:uppercase}
.cr-chest-lid{animation:chestLidAnim 2.6s .45s ease-in-out forwards}@keyframes chestLidAnim{0%{transform:rotateX(0)}18%{transform:rotateX(-108deg)}78%{transform:rotateX(-108deg)}100%{transform:rotateX(0)}}
@keyframes bagAppear{0%{transform:translateX(-50%) scale(.3) translateY(20px);opacity:0}100%{transform:translateX(-50%) scale(1) translateY(0);opacity:1}}
.cr-cta{position:absolute;bottom:5%;left:50%;transform:translateX(-50%);font-family:'Oswald',sans-serif;font-size:13px;letter-spacing:.2em;color:rgba(255,255,255,.45);text-transform:uppercase}
.cr-cta-pulse{animation:ctaPulse 2s ease infinite}@keyframes ctaPulse{0%,100%{opacity:.3}50%{opacity:.75}}
.cr-hint{position:absolute;bottom:1.5%;left:50%;transform:translateX(-50%);font-size:10px;letter-spacing:.12em;color:rgba(255,255,255,.4);text-transform:uppercase;white-space:nowrap}
`;
