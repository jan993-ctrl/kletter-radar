"use client";
import { useEffect, useState, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import CombinedRadar from "@/components/charts/CombinedRadar";
import VisualGimmick from "@/components/VisualGimmick";
import ClimberPackOpening from "@/components/ClimberPackOpening";

const GRADES = [
  "1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", 
  "4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", 
  "7a", "7b", "7c", "8a", "8b", "8c", "9a"
];

const styleLabels = ["Crimper", "Sloper", "Slab", "Dyno", "Pocket"];

export default function Frontpage() {
  const [climbers, setClimbers] = useState([]);
  const [user, setUser] = useState(null);
  const [userGymId, setUserGymId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState({});
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState("local");
  const [inventoryIds, setInventoryIds] = useState([]);
  const [fragments, setFragments] = useState(0);
  const [isPackOpen, setIsPackOpen] = useState(false);
  const [pendingPackCards, setPendingPackCards] = useState([]);
  const [currentPackCards, setCurrentPackCards] = useState([]);
  const [packStock, setPackStock] = useState(99);

  const ADMIN_EMAIL = "janstoll1993@googlemail.com";

  useEffect(() => {
    const initPage = async () => {
      try {
        const [authRes, profileRes] = await Promise.all([
          supabaseBrowser.auth.getUser(),
          fetch("/api/profiles").then(res => res.json())
        ]);

        const currentUser = authRes.data?.user ?? null;
        setUser(currentUser);
        setViewMode(currentUser ? "local" : "global");

        const inventoryKey = `inventory:${currentUser?.id ?? "anon"}`;
        const fragmentKey = `fragments:${currentUser?.id ?? "anon"}`;
        const packStockKey = `pack-stock:${currentUser?.id ?? "anon"}`;

        const cachedInventory = JSON.parse(localStorage.getItem(inventoryKey) || "[]");
        const cachedFragments = Number(localStorage.getItem(fragmentKey) || 0);
        const cachedPackStock = Number(localStorage.getItem(packStockKey) || 99);

        setInventoryIds(Array.isArray(cachedInventory) ? cachedInventory : []);
        setFragments(Number.isFinite(cachedFragments) ? cachedFragments : 0);
        setPackStock(Number.isFinite(cachedPackStock) ? cachedPackStock : 99);

        if (Array.isArray(profileRes) && currentUser?.id) {
          const ownProfile = profileRes.find((profile) => profile.user_id === currentUser.id);
          setUserGymId(ownProfile?.gym_id ?? null);
        }

        if (Array.isArray(profileRes)) {
          const sorted = profileRes.sort((a, b) => {
            const sumA = (a.abilities || []).reduce((acc, val) => acc + val, 0);
            const sumB = (b.abilities || []).reduce((acc, val) => acc + val, 0);
            return sumB - sumA;
          });
          setClimbers(sorted);
        }
      } catch (err) {
        console.error("Initialisierungsfehler:", err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setIsHeaderCollapsed(window.scrollY > 35);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user && viewMode !== "global") {
      setViewMode("global");
      setFlippedCards({});
    }
  }, [user, viewMode]);

  const toggleFlip = (id) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getGradeColor = (index) => {
    if (index < 6) return "#a5a5a5"; 
    if (index < 12) return "#28a745"; 
    if (index < 15) return "#ffc107"; 
    if (index < 18) return "#fd7e14"; 
    if (index < 21) return "#dc3545"; 
    if (index < 24) return "#8e44ad"; 
    return "#2c3e50"; 
  };

  const profileLink = user?.email === ADMIN_EMAIL ? "/admin" : "/profile";
  const hasLocalContext = Boolean(userGymId);
  const isGuestUser = !user;
  
  const localVisibleClimbers = useMemo(() => {
    return hasLocalContext
      ? climbers.filter((climber) => climber.gym_id && climber.gym_id === userGymId)
      : [];
  }, [climbers, userGymId, hasLocalContext]);

  const rarityWeight = (power) => {
    if (power >= 92) return 0;
    if (power >= 75) return 1;
    return 2;
  };

  const isRegisteredUserCard = (climber) => Boolean(climber?.user_id);

  const sortedInventoryClimbers = useMemo(() => {
    return climbers
      .filter((climber) => inventoryIds.includes(climber.user_id || climber.id))
      .sort((a, b) => {
        const powerA = Math.round(((a.abilities || []).reduce((acc, val) => acc + val, 0) / 120) * 100);
        const powerB = Math.round(((b.abilities || []).reduce((acc, val) => acc + val, 0) / 120) * 100);
        const rarityDiff = rarityWeight(powerA) - rarityWeight(powerB);
        if (rarityDiff !== 0) return rarityDiff;
        return powerB - powerA;
      });
  }, [climbers, inventoryIds]);

  const toPackAthlete = (climber) => {
    const abilities = climber.abilities || [0, 0, 0, 0, 0];
    const power = Math.round((abilities.reduce((a, b) => a + b, 0) / 120) * 100);
    const rarity = power >= 92 ? "legendary" : power >= 75 ? "rare" : "common";
    const gradeIndex = Math.max(0, Math.min(GRADES.length - 1, Math.round((power / 100) * (GRADES.length - 1))));

    return {
      id: climber.user_id || climber.id,
      name: climber.name || "Kletter-Gast",
      country: climber.gym_name || "GYM",
      flag: "🧗",
      grade: GRADES[gradeIndex],
      discipline: "Boulder",
      stats: {
        power,
        tech: Math.max(35, Math.round(((abilities[0] + abilities[1]) / 24) * 100)),
        endurance: Math.max(35, Math.round(((abilities[3] + abilities[4]) / 24) * 100)),
      },
      rarity,
      emoji: rarity === "legendary" ? "🔥" : rarity === "rare" ? "⚡" : "🪨",
      quote: climber.notes || "Keep climbing.",
      image_url: climber.image_url
    };
  };

  const packAthletes = useMemo(() => {
    return climbers.filter(isRegisteredUserCard).map(toPackAthlete);
  }, [climbers]);

  const maxPackCards = Math.min(5, packAthletes.length);

  const drawPackCards = (pool, count) => {
    const copy = [...pool];
    const result = [];

    const getPower = (card) => Number(card?.stats?.power) || 0;
    const getDrawWeight = (card) => Math.max(1, 101 - getPower(card));

    while (result.length < count && copy.length > 0) {
      const totalWeight = copy.reduce((sum, card) => sum + getDrawWeight(card), 0);
      let threshold = Math.random() * totalWeight;
      let selectedIndex = copy.length - 1;

      for (let i = 0; i < copy.length; i += 1) {
        threshold -= getDrawWeight(copy[i]);
        if (threshold <= 0) {
          selectedIndex = i;
          break;
        }
      }

      const [pick] = copy.splice(selectedIndex, 1);
      result.push(pick);
    }

    return result;
  };

  const onPackDone = (drawnCards) => {
    setPendingPackCards(drawnCards || []);
  };

  const closePackOverlay = () => {
    if (pendingPackCards.length > 0) {
      const inventoryKey = `inventory:${user?.id ?? "anon"}`;
      const fragmentKey = `fragments:${user?.id ?? "anon"}`;
      const packStockKey = `pack-stock:${user?.id ?? "anon"}`;

      const existing = new Set(inventoryIds);
      let duplicateCount = 0;

      pendingPackCards.forEach((card) => {
        if (existing.has(card.id)) {
          duplicateCount += 1;
        } else {
          existing.add(card.id);
        }
      });

      const nextInventory = Array.from(existing);
      const nextFragments = fragments + duplicateCount * (1 / 20);

      setInventoryIds(nextInventory);
      setFragments(nextFragments);
      localStorage.setItem(inventoryKey, JSON.stringify(nextInventory));
      localStorage.setItem(fragmentKey, String(nextFragments));

      const nextPackStock = Math.max(0, packStock - 1);
      setPackStock(nextPackStock);
      localStorage.setItem(packStockKey, String(nextPackStock));
    }

    setPendingPackCards([]);
    setCurrentPackCards([]);
    setIsPackOpen(false);
  };

  const switchViewMode = () => {
    if (!user) return;
    setViewMode((prev) => (prev === "local" ? "global" : "local"));
    setFlippedCards({});
  };

  return (
    <div style={pageWrapperStyle}>
      <main style={mainStyle}>
      <header style={{
        ...headerStyle,
        transform: isHeaderCollapsed ? "translateY(-130%)" : "translateY(0)",
        opacity: isHeaderCollapsed ? 0 : 1,
      }}>
        <div style={headerAnimationStyle}>
          {isGuestUser ? (
            <div
              style={{
                ...gimmickToggleBtn,
                opacity: 0.65,
                cursor: "default",
              }}
              aria-hidden="true"
            >
              <div style={gimmickInner}>
                <VisualGimmick size={100} showLabel={false} />
              </div>
            </div>
          ) : (
            <button
              style={{
                ...gimmickToggleBtn,
                transform: viewMode === "global" ? "scale(1.06)" : "scale(1)",
              }}
              onClick={switchViewMode}
              type="button"
              aria-label={viewMode === "local" ? "Zu allen Karten wechseln" : "Zu lokalen Karten wechseln"}
            >
              <div
                style={{
                  ...gimmickInner,
                  transform: viewMode === "global" ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <VisualGimmick size={100} showLabel={false} />
              </div>
            </button>
          )}
        </div>
        <div style={titleBlockStyle}>
          <h1 style={logoStyle}>
            <span style={{ fontSize: "2rem" }}>🧗</span> Climbers
          </h1>
          <p style={taglineStyle}>Deine Boulder-Community auf einen Blick</p>
        </div>
        <div>
          {viewMode === "global" && (
            <button
              type="button"
              onClick={() => {
                if (packStock > 0 && packAthletes.length > 0) {
                  const drawn = drawPackCards(packAthletes, maxPackCards);
                  setCurrentPackCards(drawn);
                  setPendingPackCards([]);
                  setIsPackOpen(true);
                }
              }}
              style={{
                ...navBtnStyle,
                marginRight: "10px",
                opacity: packStock <= 0 ? 0.5 : 1,
                cursor: packStock <= 0 ? "not-allowed" : "pointer",
              }}
            >
              🃏 Karten
            </button>
          )}
          <Link href={user ? profileLink : "/login"}>
            <button style={navBtnStyle}>
              {user ? "Mein Profil" : "Login"}
            </button>
          </Link>
        </div>
      </header>

      {loading ? (
        <div style={loaderContainer}>
          <p>Lade Kletterer-Community...</p>
        </div>
      ) : (
        <>
          <div style={modeInfoStyle}>
            <span style={modeIconStyle}>
              {viewMode === "global" ? "🌍" : "🏠"}
            </span>
            {viewMode === "global" ? (
              <>
                <span style={inventoryMetaStyle}>Inventar: {sortedInventoryClimbers.length} Karten · Fragmente: {fragments.toFixed(2)}</span>
                <span style={inventoryHintStyle}>Packs verfügbar: {packStock} / 99</span>
              </>
            ) : (
              <span style={inventoryMetaStyle}>Lokale Karten aus deiner Heimathalle</span>
            )}
          </div>

          {isGuestUser ? (
            <section style={gridPanelStyle}>
              <div style={gridStyle}>
                {sortedInventoryClimbers.map((c, index) => renderClimberCard(c, index, flippedCards, toggleFlip, getGradeColor))}
              </div>
              {sortedInventoryClimbers.length === 0 && (
                <div style={emptyStateStyle}>Noch keine Karten im Inventar. Öffne ein Pack über 🃏 Karten.</div>
              )}
            </section>
          ) : (
            <div style={gridSwitchViewportStyle}>
              <div style={{
                ...gridSwitchTrackStyle,
                transform: viewMode === "global" ? "translateX(-50%)" : "translateX(0)",
              }}>
                <section style={gridPanelStyle}>
                  <div style={gridStyle}>
                    {hasLocalContext
                      ? localVisibleClimbers.map((c, index) => renderClimberCard(c, index, flippedCards, toggleFlip, getGradeColor))
                      : <div style={emptyStateStyle}>Lege zuerst eine Heimathalle in deinem Profil fest, um lokale Karten zu sehen.</div>}
                  </div>
                </section>

                <section style={gridPanelStyle}>
                  <div style={gridStyle}>
                    {sortedInventoryClimbers.map((c, index) => renderClimberCard(c, index, flippedCards, toggleFlip, getGradeColor))}
                  </div>
                  {sortedInventoryClimbers.length === 0 && (
                    <div style={emptyStateStyle}>Noch keine Karten im Inventar. Öffne ein Pack über 🃏 Karten.</div>
                  )}
                </section>
              </div>
            </div>
          )}
        </>
      )}
      {isPackOpen && (
        <div style={packOverlayStyle}>
          <button type="button" style={packCloseBtnStyle} onClick={closePackOverlay}>✕</button>
          <ClimberPackOpening
            cards={currentPackCards}
            onDone={onPackDone}
            onDismiss={closePackOverlay}
          />
        </div>
      )}
      </main>
    </div>
  );
}

function renderClimberCard(c, index, flippedCards, toggleFlip, getGradeColor) {
  const safeAbilities = c.abilities || [0, 0, 0, 0, 0];
  const safeStyles = c.styles || [0, 0, 0, 0, 0];
  const sumAbilities = safeAbilities.reduce((a, b) => a + b, 0);
  const powerScore = Math.round((sumAbilities / 120) * 100);
  const mentalValue = safeAbilities[2];
  
  const dbId = c.user_id || c.id || "climber";
  const uniqueCardKey = `${dbId}-${index}`;
  const isFlipped = !!flippedCards[uniqueCardKey];
  const tierLabel = powerScore >= 92 ? "Legend" : powerScore >= 75 ? "Elite" : "Rookie";
  const gymName = c.gym_name || "Unbekannte Halle";

  return (
    <div 
      key={uniqueCardKey}
      style={cardContainerStyle}
      onClick={() => toggleFlip(uniqueCardKey)}
    >
      <div
        style={{
          ...cardInnerStyle,
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* VORDERSEITE */}
        <div style={cardFrontStyle}>
          <div style={cardGlowOrbStyle} />
          <div style={rankBadgeStyle}>#{index + 1}</div>
          <div style={tierBadgeStyle}>{tierLabel}</div>
          
          <div style={imgContainerStyle}>
            <Image
              src={c.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || "User")}&background=random&size=300`}
              style={imgStyle}
              alt={c.name || "Kletterer"}
              fill
              sizes="(max-width: 768px) 100vw, 280px"
              unoptimized
            />
          </div>
          
          <div style={{ padding: "18px" }}>
            <div style={gymTagStyle}>{gymName}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", gap: "12px" }}>
              <h2 style={nameStyle}>{c.name || "Kletter-Gast"}</h2>
              <div style={powerBadge}>
                <span style={{ fontSize: "0.55rem", fontWeight: "bold", color: "#aaa" }}>POWER</span>
                <div style={{ fontSize: "1.3rem" }}>{powerScore}</div>
              </div>
            </div>
            
            <div style={mentalCenterBox}>
              <div style={mentalLabel}>MENTALITÄT</div>
              <div style={mentalValueDisplay}>Level {mentalValue}</div>
            </div>

            <div style={stylesGrid}>
              {styleLabels.map((label, i) => (
                <div key={`${uniqueCardKey}-${label}`} style={styleItem}>
                  <span style={styleLabelText}>{label}</span>
                  <span style={{ 
                    ...styleValueText, 
                    color: getGradeColor(safeStyles[i]) 
                  }}>
                    {GRADES[safeStyles[i]] || "1a"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RÜCKSEITE */}
        <div style={cardBackStyle}>
          <div style={{ padding: "20px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 style={{ borderBottom: "1px solid rgba(148,163,184,0.3)", width: "100%", paddingBottom: "10px", marginTop: 0, textAlign: "left", color: "#f4f4f5" }}>
              Statistik & Notizen
            </h3>
            
            <div style={chartWrapperStyle}>
              <CombinedRadar 
                abilities={safeAbilities} 
                styles={safeStyles} 
                width={240} 
                height={240} 
              />
            </div>

            <div style={notesAreaStyle}>
              <strong style={{ fontSize: "0.75rem", color: "#888", display: "block", marginBottom: "5px" }}>ÜBER {c.name?.toUpperCase()}:</strong>
              {c.notes ? c.notes : "Keine besonderen Notizen oder Ziele hinterlegt."}
            </div>

            <div style={{ marginTop: "auto", fontSize: "0.7rem", color: "#a1a1aa" }}>
              ↻ Klicken zum Umdrehen
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// STYLES
const pageWrapperStyle = {
  minHeight: "100vh",
  width: "100%",
  padding: "20px",
  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
};

const mainStyle = { fontFamily: "'Inter', sans-serif", maxWidth: "1200px", margin: "0 auto", backgroundColor: "transparent", minHeight: "100vh", color: "#f4f4f5" };

const headerStyle = {
  position: "sticky",
  top: "0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "15px 18px",
  marginBottom: "30px",
  minHeight: "110px",
  borderRadius: "22px",
  background: "linear-gradient(115deg, rgba(2,6,23,0.92) 0%, rgba(30,41,59,0.85) 60%, rgba(67,56,202,0.45) 100%)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 14px 34px rgba(0,0,0,0.4)",
  zIndex: 20,
  transition: "transform 320ms ease, opacity 260ms ease",
};

const headerAnimationStyle = { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "auto", opacity: 0.42 };

const gimmickToggleBtn = { border: "1px solid rgba(255,255,255,0.1)", borderRadius: "999px", padding: "4px", background: "rgba(15,23,42,0.4)", cursor: "pointer", transition: "transform 280ms ease" };

const gimmickInner = { transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)", borderRadius: "50%" };

const titleBlockStyle = { display: "flex", flexDirection: "column", gap: "6px", zIndex: 1 };

const logoStyle = { fontSize: "1.95rem", margin: 0, display: "flex", alignItems: "center", gap: "12px", color: "#f8fafc", fontWeight: "900", letterSpacing: "-0.6px" };

const taglineStyle = { margin: 0, color: "#cbd5e1", fontSize: "0.9rem", fontWeight: "600" };

const navBtnStyle = { padding: "12px 24px", borderRadius: "999px", border: "none", background: "linear-gradient(135deg, #312e81 0%, #4338ca 100%)", color: "#f8fafc", cursor: "pointer", fontWeight: "700", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" };

const loaderContainer = { textAlign: "center", marginTop: "100px", color: "#a1a1aa" };

const modeInfoStyle = { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "18px", textAlign: "center" };

const modeIconStyle = { width: "32px", height: "32px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };

const inventoryMetaStyle = { color: "#cbd5e1", fontSize: "0.82rem", fontWeight: 700 };

const inventoryHintStyle = { color: "#fbbf24", fontSize: "0.75rem", fontWeight: 700 };

const packOverlayStyle = { position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" };

const packCloseBtnStyle = { position: "fixed", top: "20px", right: "20px", width: "42px", height: "42px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "1.1rem", cursor: "pointer", zIndex: 1300 };

const gridSwitchViewportStyle = { overflow: "hidden" };

const gridSwitchTrackStyle = { width: "200%", display: "grid", gridTemplateColumns: "1fr 1fr", transition: "transform 620ms cubic-bezier(0.22, 1, 0.36, 1)" };

const gridPanelStyle = { padding: "12px" };

const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" };

const emptyStateStyle = { gridColumn: "1/-1", textAlign: "center", padding: "50px", color: "#94a3b8", fontWeight: "600" };

const cardContainerStyle = { perspective: "1000px", height: "550px", cursor: "pointer" };

const cardInnerStyle = { position: "relative", width: "100%", height: "100%", transition: "transform 0.72s cubic-bezier(0.22, 1, 0.36, 1)", transformStyle: "preserve-3d" };

const baseFaceStyle = {
  position: "absolute",
  width: "100%",
  height: "100%",
  backfaceVisibility: "hidden",
  borderRadius: "26px",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow: "0 24px 55px rgba(2,6,23,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
  overflow: "hidden",
  background: "linear-gradient(158deg, #0f172a 0%, #1e1b4b 48%, #020617 100%)"
};

const cardFrontStyle = { ...baseFaceStyle };

const cardBackStyle = {
  ...baseFaceStyle,
  transform: "rotateY(180deg)",
  background: "radial-gradient(circle at 18% 12%, rgba(56,189,248,0.2), transparent 35%), linear-gradient(165deg, #020617 0%, #172554 52%, #020617 100%)",
};

const rankBadgeStyle = { position: "absolute", top: "15px", left: "15px", backgroundColor: "rgba(15,23,42,0.72)", color: "#fff", padding: "7px 13px", borderRadius: "999px", fontSize: "0.78rem", letterSpacing: "0.4px", fontWeight: "800", zIndex: 10, border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" };

const tierBadgeStyle = { position: "absolute", top: "15px", right: "15px", padding: "7px 13px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase", color: "#fde68a", letterSpacing: "0.8px", zIndex: 10, border: "1px solid rgba(253,230,138,0.45)", background: "rgba(120,53,15,0.45)", backdropFilter: "blur(5px)" };

const cardGlowOrbStyle = { position: "absolute", width: "230px", height: "230px", borderRadius: "999px", top: "-70px", right: "-70px", background: "radial-gradient(circle, rgba(129,140,248,0.4) 0%, rgba(129,140,248,0) 72%)", pointerEvents: "none", zIndex: 1 };

const imgContainerStyle = { position: "relative", height: "210px", width: "100%", backgroundColor: "#000" };

const imgStyle = { width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.1) contrast(1.06)" };

const gymTagStyle = { display: "inline-flex", marginBottom: "12px", padding: "6px 11px", borderRadius: "999px", border: "1px solid rgba(148,163,184,0.3)", background: "rgba(15,23,42,0.55)", color: "#bfdbfe", fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.5px", textTransform: "uppercase" };

const nameStyle = { margin: "0", fontSize: "1.35rem", color: "#fff", fontWeight: "800", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

const powerBadge = { display: "flex", flexDirection: "column", alignItems: "center", background: "linear-gradient(145deg, rgba(59,130,246,0.24), rgba(30,41,59,0.7))", border: "1px solid rgba(125,211,252,0.35)", color: "#fff", padding: "8px", borderRadius: "16px", minWidth: "60px" };

const mentalCenterBox = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.58)", border: "1px solid rgba(148,163,184,0.18)", padding: "12px", borderRadius: "16px", marginBottom: "20px" };

const mentalLabel = { fontSize: "0.7rem", fontWeight: "bold", color: "#666", letterSpacing: "1.5px", marginBottom: "4px" };

const mentalValueDisplay = { fontSize: "1.3rem", fontWeight: "900", color: "#34d399" };

const stylesGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "15px" };

const styleItem = { display: "flex", flexDirection: "column" };

const styleLabelText = { fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "bold" };

const styleValueText = { fontSize: "1.2rem", fontWeight: "900" };

const chartWrapperStyle = { margin: "10px 0", padding: "10px", backgroundColor: "rgba(15,23,42,0.65)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "15px" };

const notesAreaStyle = { 
  marginTop: "10px", 
  fontSize: "0.9rem", 
  lineHeight: "1.4", 
  color: "#a1a1aa", 
  textAlign: "left", 
  width: "100%",
  padding: "10px",
  backgroundColor: "rgba(15,23,42,0.55)",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: "12px",
  maxHeight: "120px",
  overflowY: "auto"
};
