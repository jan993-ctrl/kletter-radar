"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// --- KONSTANTEN ---
const GRADES = [
  "1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", "4a", "4b", "4c", 
  "5a", "5b", "5c", "6a", "6b", "6c", "7a", "7b", "7c", "8a", "8b", "8c", "9a"
]; [cite: 2]

const RARITY_META = {
  legendary: { label: "LEGENDARY", color: "#FFB300", shadow: "0 0 24px #FFB30088, 0 0 48px #FF8F0044", badge: "#7B5800", bgFrom: "#3D2000" },
  rare: { label: "RARE", color: "#42A5F5", shadow: "0 0 16px #42A5F566, 0 0 32px #1565C033", badge: "#0D47A1", bgFrom: "#001A3D" },
  common: { label: "COMMON", color: "#9E9E9E", shadow: "0 4px 16px rgba(0,0,0,.5)", badge: "#212121", bgFrom: "#1C1C1C" },
}; [cite: 3, 4, 68]

const SPREAD = [
  { x: -44, y: -16, rot: -24 },
  { x: -22, y: -26, rot: -11 },
  { x: 0, y: -30, rot: 1 },
  { x: 22, y: -26, rot: 13 },
  { x: 44, y: -16, rot: 23 },
]; [cite: 5, 69]

const CRUMBLE_DIRS = [
  { tx: "-55vw", ty: "60vh", rot: "-180deg" },
  { tx: "-25vw", ty: "80vh", rot: "-120deg" },
  { tx: "0vw", ty: "90vh", rot: "90deg" },
  { tx: "25vw", ty: "75vh", rot: "150deg" },
  { tx: "55vw", ty: "65vh", rot: "200deg" },
]; [cite: 6, 70, 71]

const SHARDS = [
  { clip: "polygon(0% 0%, 52% 0%, 38% 33%, 0% 22%)", tx: "-88px", ty: "-95px", rot: "-48deg", delay: "0s" },
  { clip: "polygon(52% 0%, 100% 0%, 100% 26%, 62% 29%, 38% 33%)", tx: "80px", ty: "-90px", rot: "42deg", delay: "0.07s" },
  { clip: "polygon(0% 22%, 38% 33%, 27% 60%, 0% 52%)", tx: "-95px", ty: "18px", rot: "32deg", delay: "0.12s" },
  { clip: "polygon(38% 33%, 62% 29%, 100% 26%, 100% 60%, 66% 54%, 27% 60%)", tx: "18px", ty: "-65px", rot: "-22deg", delay: "0.05s" },
  { clip: "polygon(66% 54%, 100% 60%, 100% 100%, 72% 100%)", tx: "90px", ty: "88px", rot: "58deg", delay: "0.1s" },
  { clip: "polygon(0% 52%, 27% 60%, 20% 82%, 0% 100%)", tx: "-88px", ty: "90px", rot: "-52deg", delay: "0.04s" },
  { clip: "polygon(27% 60%, 66% 54%, 72% 100%, 20% 82%)", tx: "22px", ty: "95px", rot: "38deg", delay: "0.15s" },
]; [cite: 7, 8]

// --- HELPER FUNKTIONEN ---
const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "K")}&background=2A1F06&color=FFD166&size=300`; [cite: 9]

const toPercent = (val) => Math.round((Math.min(24, Math.max(0, Number(val) || 0)) / 24) * 100); [cite: 9]

const getPowerScore = (abilities) => {
  const safe = Array.isArray(abilities) && abilities.length === 7 ? abilities : [0, 0, 0, 0, 0, 0, 0]; [cite: 11]
  return Math.round((safe.reduce((a, b) => a + b, 0) / (7 * 24)) * 100); [cite: 12]
};

const getRarity = (powerScore) => {
  if (powerScore >= 92) return "legendary";
  if (powerScore >= 75) return "rare";
  return "common";
}; [cite: 13]

const getGrade = (powerScore) => {
  const idx = Math.max(0, Math.min(GRADES.length - 1, Math.round((powerScore / 100) * (GRADES.length - 1))));
  return GRADES[idx]; [cite: 14]
};

// --- KOMPONENTE ---
export default function ClimberPackOpening({ cards = [], packTheme = {}, ownedIds = new Set(), onDone, onDismiss }) {
  const [phase, setPhase] = useState("idle"); [cite: 16, 72]
  const [activeCards, setActive] = useState([]); [cite: 16, 73]
  const [launched, setLaunched] = useState([]); [cite: 16, 73]
  const [revealed, setRevealed] = useState([]); [cite: 16, 73]
  const [exitModes, setExitModes] = useState({}); [cite: 17, 73]
  const [gatherPos, setGatherPos] = useState({}); [cite: 17, 74]
  const [bagOffsets, setBagOffsets] = useState({}); [cite: 17, 74]
  const [bagVisible, setBagVisible] = useState(false); [cite: 17, 75]
  
  const timeouts = useRef([]); [cite: 18, 75]

  const clear = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }; [cite: 18, 75]

  const later = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timeouts.current.push(id);
    return id;
  }; [cite: 18, 19, 76]

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

    setPhase("shake"); [cite: 19, 77]
    later(() => setPhase("slice"), 650); [cite: 19, 77]
    later(() => setPhase("open"), 1150); [cite: 19, 78]
    later(() => {
      setActive(cards);
      setPhase("cards"); [cite: 19, 78]
      cards.forEach((_, i) => later(() => setLaunched((prev) => [...prev, i]), i * 130));
    }, 1750); [cite: 19, 78]
    later(() => setPhase("done"), 3600); [cite: 19, 79]
  }, [cards]); [cite: 20, 79]

  const triggerExit = useCallback(() => {
    const modes = {};
    const newCards = [];
    const shatterCards = [];

    activeCards.forEach((card, i) => {
      const cardKey = card.originalId || card.id;
      const isDupe = ownedIds.has(cardKey); [cite: 20, 79]
      modes[i] = isDupe ? "shatter" : "gather"; [cite: 20, 79]
      if (!isDupe) newCards.push(i);
      else shatterCards.push(i);
    });

    setExitModes(modes); [cite: 20, 80]
    onDone?.(newCards.map((i) => activeCards[i]).filter(Boolean));

    const CARD_W = 148;
    const GAP = 12;
    const total = newCards.length;
    const gp = {};
    const Y_OFFSET = -110; [cite: 20, 80, 81]

    if (total <= 3) {
      newCards.forEach((cardIdx, j) => {
        gp[cardIdx] = { gx: (j - (total - 1) / 2) * (CARD_W + GAP), gy: Y_OFFSET };
      }); [cite: 21, 81]
    } else {
      const radius = 140 + total * 8; [cite: 22, 82]
      newCards.forEach((cardIdx, j) => {
        const angle = (j / total) * 2 * Math.PI - Math.PI / 2; [cite: 23, 83]
        gp[cardIdx] = { 
          gx: Math.cos(angle) * radius, 
          gy: Math.sin(angle) * radius + Y_OFFSET 
        }; [cite: 23, 84]
      });
    }

    setGatherPos(gp); [cite: 24, 84]

    const BAG_X_VW = 0;
    const BAG_Y_VH = 31; [cite: 24, 86]
    const bo = {};

    shatterCards.forEach((i) => {
      const sp = SPREAD[i] || SPREAD[0]; [cite: 25, 87]
      // KORRIGIERTE SYNTAX OHNE BACKSLASHES
      bo[i] = { 
        bx: `${BAG_X_VW - sp.x}vw`, 
        by: `${BAG_Y_VH - sp.y}vh` 
      }; [cite: 25, 87]
    });

    setBagOffsets(bo); [cite: 26, 88]
    if (shatterCards.length > 0) setBagVisible(true); [cite: 26, 88]
    setPhase("exit"); [cite: 26, 89]

    const hasSomeGather = newCards.length > 0;
    const delay = hasSomeGather ? 2800 : 2400; [cite: 89]

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
    }, delay); [cite: 26, 90]
  }, [activeCards, onDismiss, onDone, ownedIds]); [cite: 27, 90]

  useEffect(() => () => clear(), []); [cite: 27, 91]

  const allRevealed = activeCards.length > 0 && revealed.length === activeCards.length; [cite: 27, 91]

  const toggleReveal = (i) => {
    if (phase !== "done") return; [cite: 29, 93]
    setRevealed((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])); [cite: 30, 93]
  };

  const handleRootClick = () => {
    if (phase === "idle") {
      startAnimation();
      return;
    } [cite: 31, 94]
    if (phase === "done" && allRevealed) {
      triggerExit();
    } [cite: 31, 32, 94]
  };

  return (
    <div className={`cr-root phase-${phase}`} onClick={handleRootClick}>
      {/* Hier folgen die Karten-Mappings und UI-Elemente wie in der Notiz beschrieben [cite: 32, 95] */}
    </div>
  );
}
