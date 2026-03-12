"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const RARITY_WEIGHTS = { legendary: 10, rare: 30, common: 60 };

const RARITY_META = {
  legendary: { label: "LEGENDARY", color: "#FFB300", shadow: "0 0 24px #FFB30088, 0 0 48px #FF8F0044", badge: "#7B5800" },
  rare: { label: "RARE", color: "#42A5F5", shadow: "0 0 16px #42A5F566, 0 0 32px #1565C033", badge: "#0D47A1" },
  common: { label: "COMMON", color: "#9E9E9E", shadow: "0 4px 16px rgba(0,0,0,.5)", badge: "#212121" },
};

function drawCards(pool, count = 5) {
  const localPool = [...pool];
  const drawn = [];
  const weightedPool = () =>
    localPool.flatMap((a) => Array(RARITY_WEIGHTS[a.rarity] || 1).fill(a));

  while (drawn.length < count && localPool.length > 0) {
    const wp = weightedPool();
    const pick = wp[Math.floor(Math.random() * wp.length)];
    drawn.push(pick);
    localPool.splice(localPool.indexOf(pick), 1);
  }
  return drawn;
}

export default function ClimberPackOpening({ athletes = [], maxCards = 5, onDone, onClose }) {
  const [phase, setPhase] = useState("shake");
  const [drawnCards, setDrawn] = useState([]);
  const [launched, setLaunched] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const timeouts = useRef([]);

  useEffect(() => {
    if (!athletes.length) return undefined;

    const cards = drawCards(athletes, Math.min(maxCards, athletes.length));
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timeouts.current.push(id);
    };

    later(() => setPhase("slice"), 650);
    later(() => setPhase("open"), 1150);
    later(() => {
      setDrawn(cards);
      setPhase("cards");
      cards.forEach((_, i) => {
        later(() => setLaunched((prev) => [...prev, i]), i * 130);
      });
    }, 1750);
    later(() => {
      setPhase("done");
      onDone?.(cards);
    }, 3600);

    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, [athletes, maxCards, onDone]);

  const toggleReveal = (i) => {
    if (phase !== "done") return;
    setRevealed((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  return (
    <div className="cr-root">
      <style>{CSS}</style>
      <Particles />
      <button className="cr-close" onClick={onClose} type="button" aria-label="Pack schließen">✕</button>

      {drawnCards.map((athlete, i) => (
        <ClimberCard
          key={`${athlete.id}-${i}`}
          athlete={athlete}
          index={i}
          isLaunched={launched.includes(i)}
          isRevealed={revealed.includes(i)}
          isDone={phase === "done"}
          onClick={() => toggleReveal(i)}
        />
      ))}

      <div className={`cr-pack ${phase}`} role="img" aria-label="Climber Pack Opening">
        <div className="cr-pack-top" />
        <div className={`cr-slice ${["slice", "open", "cards", "done"].includes(phase) ? "vis" : ""}`} />
        <div className="cr-pack-body">
          <div className="cr-pack-shine" />
          <div className="cr-pack-noise" />
          <div className="cr-pack-content">
            <span className="cr-pack-eyebrow">SEASON 1 · PRO SERIES</span>
            <span className="cr-pack-title">CRUX<br />CARDS</span>
            <CarabinerIcon />
            <span className="cr-pack-sub">{Math.min(maxCards, athletes.length)} ELITE CLIMBERS</span>
          </div>
        </div>
      </div>

      {phase === "done" && revealed.length === 0 && <p className="cr-hint">tippe auf eine Karte für Details</p>}
      {phase === "done" && <p className="cr-cta" onClick={onClose} style={{ cursor: "pointer" }}>Weiter zum Inventar →</p>}
    </div>
  );
}

const SPREAD = [
  { x: -44, y: -16, rot: -24 },
  { x: -22, y: -26, rot: -11 },
  { x: 0, y: -30, rot: 1 },
  { x: 22, y: -26, rot: 13 },
  { x: 44, y: -16, rot: 23 },
];

function ClimberCard({ athlete, index, isLaunched, isRevealed, isDone, onClick }) {
  const pos = SPREAD[index] || SPREAD[0];
  const meta = RARITY_META[athlete.rarity] || RARITY_META.common;

  return (
    <div
      className={`cr-card-wrap ${isLaunched ? "fly" : ""} ${isRevealed ? "flipped" : ""}`}
      style={{ "--tx": `${pos.x}vw`, "--ty": `${pos.y}vh`, "--rot": `${pos.rot}deg`, "--delay": `${index * 0.1}s`, "--r-color": meta.color, "--r-shadow": meta.shadow }}
      onClick={isDone ? onClick : undefined}
    >
      <div className="cr-card-face cr-card-back"><CarabinerIcon size={38} /><span className="cr-back-label">CRUX</span></div>
      <div className="cr-card-face cr-card-front" style={{ "--card-bg-from": athlete.rarity === "legendary" ? "#3D2000" : athlete.rarity === "rare" ? "#001A3D" : "#1C1C1C" }}>
        <div className="cr-card-glow" />
        <div className="cr-card-head"><span className="cr-rarity-badge" style={{ background: meta.badge, color: meta.color }}>{meta.label}</span><span className="cr-discipline">{athlete.discipline}</span></div>
        <div className="cr-art-zone"><div className="cr-art-bg" style={{ background: `radial-gradient(circle at 60% 40%, ${meta.color}22 0%, transparent 70%)` }} /><span className="cr-art-emoji">{athlete.emoji || "🧗"}</span><span className="cr-grade-overlay">{athlete.grade || "7a"}</span></div>
        <div className="cr-name-row"><span className="cr-athlete-name">{athlete.name}</span><span className="cr-flag">{athlete.flag || "🏔️"} {athlete.country || "GYM"}</span></div>
        <p className="cr-quote">&ldquo;{athlete.quote || "Keep climbing."}&rdquo;</p>
        <div className="cr-stats"><StatBar label="POW" value={athlete.stats.power} color={meta.color} /><StatBar label="TEC" value={athlete.stats.tech} color={meta.color} /><StatBar label="END" value={athlete.stats.endurance} color={meta.color} /></div>
        <div className="cr-holo" />
      </div>
    </div>
  );
}

function StatBar({ label, value, color }) {
  return <div className="cr-stat-row"><span className="cr-stat-label">{label}</span><div className="cr-stat-track"><div className="cr-stat-fill" style={{ "--fill": `${value}%`, "--fill-color": color }} /></div><span className="cr-stat-val">{value}</span></div>;
}

function CarabinerIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" className="cr-carabiner">
      <ellipse cx="22" cy="22" rx="14" ry="18" stroke="currentColor" strokeWidth="3.5" fill="none" />
      <rect x="29" y="14" width="5" height="16" rx="2.5" fill="currentColor" opacity=".9" />
      <line x1="22" y1="4" x2="22" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="22" y1="34" x2="22" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function pseudoRand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function Particles() {
  const pts = useMemo(
    () =>
      Array.from({ length: 55 }, (_, i) => {
        const b = i + 1;
        return {
          x: pseudoRand(b * 1.23) * 100,
          y: pseudoRand(b * 2.34) * 100,
          s: 0.6 + pseudoRand(b * 3.45) * 2.2,
          d: (2 + pseudoRand(b * 4.56) * 4).toFixed(1),
          del: (pseudoRand(b * 5.67) * 5).toFixed(1),
          o: (0.15 + pseudoRand(b * 6.78) * 0.45).toFixed(2),
        };
      }),
    []
  );

  return <div className="cr-particles" aria-hidden>{pts.map((p, i) => <div key={i} className="cr-particle" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}px`, height: `${p.s}px`, opacity: p.o, animationDuration: `${p.d}s`, animationDelay: `${p.del}s` }} />)}</div>;
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
.cr-root { position: fixed; inset:0; min-height: 100dvh; background: radial-gradient(ellipse at 30% 20%, #1a0a0022 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, #001a3a22 0%, transparent 55%), #0E0E12; display: flex; align-items: center; justify-content: center; overflow: hidden; font-family: 'Rajdhani', sans-serif; z-index:1000; }
.cr-close { position:absolute; top:22px; right:22px; border:none; border-radius:999px; width:40px; height:40px; background:#ffffff18; color:#fff; font-size:18px; cursor:pointer; z-index:1100; }
.cr-particles { position:absolute; inset:0; pointer-events:none; z-index:0; }
.cr-particle { position:absolute; border-radius:50%; background: rgba(235,230,220,.9); animation: drift linear infinite; }
@keyframes drift { 0% { transform: translateY(0) scale(1); opacity: inherit; } 50% { transform: translateY(-18px) scale(1.3); } 100% { transform: translateY(0) scale(1); opacity: inherit; } }
.cr-pack { position: relative; z-index: 10; width: clamp(130px, 22vw, 175px); height: clamp(210px, 36vw, 285px); display: flex; flex-direction: column; filter: drop-shadow(0 20px 50px rgba(0,0,0,.75)); }
.cr-pack.shake { animation: packShake .65s ease forwards; }
@keyframes packShake { 0% { transform: rotate(0deg) translateX(0); } 15% { transform: rotate(-2.5deg) translateX(-11px);} 30% { transform: rotate(2deg) translateX(11px);} 45% { transform: rotate(-2deg) translateX(-8px);} 60% { transform: rotate(1.5deg) translateX(8px);} 75% { transform: rotate(-1deg) translateX(-4px);} 90% { transform: rotate(.6deg) translateX(3px);} 100% { transform: rotate(0) translateX(0);} }
.cr-pack-top { height:16%; background: linear-gradient(135deg,#2D2208 0%,#3D3010 100%); border-radius:12px 12px 0 0; border-bottom:2px solid #BF8C00; position:relative; z-index:2; transition: transform .45s cubic-bezier(.22,.61,.36,1), opacity .45s ease; overflow:hidden; }
.cr-pack.open .cr-pack-top,.cr-pack.cards .cr-pack-top,.cr-pack.done .cr-pack-top { transform: translateY(-160%) rotate(20deg) translateX(20%); opacity:0; }
.cr-slice { position:absolute; top:16%; left:50%; width:0; height:2px; background: linear-gradient(90deg, transparent, #FFD166, #fff, #FFD166, transparent); transform: translateX(-50%); border-radius:2px; box-shadow:0 0 10px 4px rgba(255,209,102,.5); opacity:0; transition: width .38s ease, opacity .2s ease; z-index:5; }
.cr-slice.vis { width:100%; opacity:1; }
.cr-pack-body { flex:1; background: linear-gradient(160deg,#2A1F06 0%,#1C1505 60%,#0E1020 100%); border-radius:0 0 12px 12px; position:relative; overflow:hidden; border:1px solid rgba(191,140,0,.35); border-top:none; }
.cr-pack-noise { position:absolute; inset:0; background-image: repeating-linear-gradient(-45deg, transparent 0px, transparent 3px, rgba(255,255,255,.015) 3px, rgba(255,255,255,.015) 4px); pointer-events:none; }
.cr-pack-shine { position:absolute; top:0; bottom:0; left:70%; width:12%; background: linear-gradient(180deg, transparent 0%, rgba(255,220,100,.08) 30%, rgba(255,255,255,.06) 60%, transparent 100%); border-radius:3px; }
.cr-pack-content { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:space-evenly; padding:8% 8% 10%; }
.cr-pack-eyebrow { font-size: clamp(6px, 1.3vw, 8px); font-weight:700; letter-spacing:.22em; color: rgba(191,140,0,.8); text-transform:uppercase; }
.cr-pack-title { font-size: clamp(20px, 4.5vw, 30px); font-weight:700; line-height:.95; text-align:center; color:#FFD166; text-shadow: 0 0 20px rgba(255,209,102,.4); letter-spacing:.05em; }
.cr-carabiner { color: rgba(255,209,102,.7); }
.cr-pack-sub { font-size: clamp(6px,1.3vw,8px); font-weight:600; letter-spacing:.2em; color: rgba(255,255,255,.3); text-transform:uppercase; }
.cr-card-wrap { position:absolute; z-index:20; width: clamp(100px,17vw,148px); height: clamp(150px,25vw,215px); transform: translate(0,0) rotate(0deg) scale(0); opacity:0; perspective:800px; transform-style:preserve-3d; }
.cr-card-wrap.fly { animation: cardFly .8s cubic-bezier(.22,.61,.36,1) forwards; animation-delay:var(--delay); pointer-events:auto; }
@keyframes cardFly { 0% { transform: translate(0,0) rotate(0deg) scale(.15); opacity:0;} 20% {opacity:1;} 65% {transform: translate(calc(var(--tx)*.75), calc(var(--ty)*1.3 - 7vh)) rotate(calc(var(--rot)*.6)) scale(1.08);} 100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(1); opacity:1; } }
.cr-card-wrap.fly:hover { z-index:50; filter: drop-shadow(var(--r-shadow)); transform: translate(var(--tx), calc(var(--ty) - 1vh)) rotate(var(--rot)) scale(1.06) !important; transition: transform .25s ease, filter .25s ease; }
.cr-card-face { position:absolute; inset:0; border-radius:10px; backface-visibility:hidden; -webkit-backface-visibility:hidden; transition: transform .55s cubic-bezier(.4,0,.2,1); }
.cr-card-back { transform: rotateY(0deg); background: linear-gradient(145deg,#2A1F06,#0E1020); border:1.5px solid rgba(191,140,0,.4); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; }
.cr-card-front { transform: rotateY(180deg); background: linear-gradient(155deg, var(--card-bg-from, #1C1C1C) 0%, #0D0D14 100%); border: 1.5px solid var(--r-color); display:flex; flex-direction:column; overflow:hidden; }
.cr-card-wrap.flipped .cr-card-back { transform: rotateY(-180deg); }
.cr-card-wrap.flipped .cr-card-front { transform: rotateY(0deg); }
.cr-back-label { font-size: clamp(11px, 2.2vw, 15px); letter-spacing:.3em; color: rgba(255,209,102,.6); }
.cr-card-glow { position:absolute; inset:-1px; border-radius:10px; box-shadow: inset 0 0 12px rgba(0,0,0,.7), var(--r-shadow); pointer-events:none; z-index:10; }
.cr-card-head { display:flex; justify-content:space-between; align-items:center; padding:5px 7px 3px; background: rgba(0,0,0,.4); }
.cr-rarity-badge { font-size: clamp(6px,1.2vw,8px); font-weight:500; letter-spacing:.15em; padding:1px 5px; border-radius:3px; text-transform:uppercase; }
.cr-discipline { font-size: clamp(6px,1.1vw,8px); font-weight:600; letter-spacing:.15em; color: rgba(255,255,255,.4); text-transform:uppercase; }
.cr-art-zone { flex:1; position:relative; display:flex; align-items:center; justify-content:center; margin:4px 5px; border-radius:5px; background: rgba(0,0,0,.3); border:1px solid rgba(255,255,255,.06); overflow:hidden; }
.cr-art-bg { position:absolute; inset:0; }
.cr-art-emoji { font-size: clamp(22px,5.5vw,38px); filter: drop-shadow(0 0 10px rgba(0,0,0,.7)); z-index:2; }
.cr-grade-overlay { position:absolute; bottom:4px; right:6px; font-size: clamp(14px,3vw,20px); font-weight:700; color: var(--r-color); text-shadow: 0 0 10px var(--r-color), 0 2px 4px rgba(0,0,0,.9); z-index:3; }
.cr-name-row { display:flex; justify-content:space-between; align-items:baseline; padding:3px 6px 1px; }
.cr-athlete-name { font-size: clamp(9px,1.9vw,12px); font-weight:700; color:#fff; max-width:68%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cr-flag { font-size: clamp(7px,1.3vw,9px); color: rgba(255,255,255,.5); font-weight:600; }
.cr-quote { font-size: clamp(6px,1.1vw,7.5px); color: rgba(255,255,255,.3); font-style:italic; padding:0 6px 3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cr-stats { padding:0 5px 5px; display:flex; flex-direction:column; gap:2px; }
.cr-stat-row { display:flex; align-items:center; gap:4px; }
.cr-stat-label { font-size: clamp(5.5px,1.1vw,7.5px); width:22px; color: rgba(255,255,255,.4); }
.cr-stat-track { flex:1; height:4px; background: rgba(255,255,255,.08); border-radius:2px; overflow:hidden; }
.cr-stat-fill { height:100%; width: var(--fill); background: var(--fill-color); border-radius:2px; box-shadow:0 0 4px var(--fill-color); }
.cr-stat-val { font-size: clamp(6px,1.1vw,8px); color: rgba(255,255,255,.55); width:18px; text-align:right; }
.cr-holo { position:absolute; inset:0; border-radius:10px; pointer-events:none; z-index:9; background: linear-gradient(110deg, transparent 38%, rgba(255,255,255,.05) 44%, rgba(255,255,255,.09) 50%, transparent 56%); }
.cr-cta { position:absolute; bottom:5%; left:50%; transform: translateX(-50%); z-index:30; font-size: clamp(11px,2.2vw,14px); letter-spacing:.25em; color: rgba(255,255,255,.45); text-transform:uppercase; }
.cr-hint { position:absolute; bottom:1.5%; left:50%; transform: translateX(-50%); z-index:30; font-size: clamp(8px,1.5vw,10px); letter-spacing:.18em; color: rgba(255,255,255,.2); text-transform:uppercase; }
`;
