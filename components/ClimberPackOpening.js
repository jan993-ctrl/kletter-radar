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
bo[i] = { bx: `${BAG\_X\_VW - sp.x}vw\`, by: \`${BAG_Y_VH - sp.y}vh` };
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
{activeCards.map((card, i) => (
