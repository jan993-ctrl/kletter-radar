"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import CombinedRadar from "@/components/charts/CombinedRadar";
import VisualGimmick from "@/components/VisualGimmick";

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
  const visibleClimbers = viewMode === "global" || !hasLocalContext
    ? climbers
    : climbers.filter((climber) => climber.gym_id && climber.gym_id === userGymId);

  const switchViewMode = () => {
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
          <button
            style={{
              ...gimmickToggleBtn,
              transform: viewMode === "global" ? "scale(1.06)" : "scale(1)",
            }}
            onClick={switchViewMode}
            type="button"
            aria-label={viewMode === "local" ? "Zu allen Karten wechseln" : "Zu lokalen Karten wechseln"}
            title={viewMode === "local" ? "Alle Karten anzeigen" : "Lokale Karten anzeigen"}
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
        </div>
        <div style={titleBlockStyle}>
          <h1 style={logoStyle}>
            <span style={{ fontSize: "2rem" }}>🧗</span> Climbers
          </h1>
          <p style={taglineStyle}>Deine Boulder-Community auf einen Blick</p>
        </div>
        <div>
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
            <span
              style={modeIconStyle}
              title={viewMode === "global" ? "Weltweite Ansicht" : "Lokale Ansicht"}
              aria-label={viewMode === "global" ? "Weltweite Ansicht" : "Lokale Ansicht"}
            >
              {viewMode === "global" ? "🌍" : "🏠"}
            </span>
            {viewMode === "local" && !hasLocalContext && (
              <p style={modeHintStyle}>
                Tipp: Wenn du in deinem Profil eine Heimathalle hinterlegst, funktioniert der lokale Filter automatisch.
              </p>
            )}
          </div>

          <div style={gridSwitchViewportStyle}>
            <div style={{
              ...gridSwitchTrackStyle,
              transform: viewMode === "global" ? "translateX(-50%)" : "translateX(0)",
            }}>
              <section style={gridPanelStyle}>
                <div style={gridStyle}>
                  {hasLocalContext
                    ? climbers
                      .filter((climber) => climber.gym_id && climber.gym_id === userGymId)
                      .map((c, index) => renderClimberCard(c, index, flippedCards, toggleFlip, getGradeColor))
                    : (
                      <div style={emptyStateStyle}>Lege zuerst eine Heimathalle in deinem Profil fest, um lokale Karten zu sehen.</div>
                    )}
                </div>
              </section>

              <section style={gridPanelStyle}>
                <div style={gridStyle}>
                  {climbers.map((c, index) => renderClimberCard(c, index, flippedCards, toggleFlip, getGradeColor))}
                </div>
              </section>
            </div>
          </div>

          {visibleClimbers.length === 0 && (
            <div style={emptyStateStyle}>Noch keine passenden Kletterer für diese Ansicht gefunden.</div>
          )}
        </>
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
            
            // FEHLERBEHEBUNG: Eindeutiger Key durch Kombination von ID und Index
            const dbId = c.user_id || c.id || "climber";
            const uniqueCardKey = `${dbId}-${index}`;
            const isFlipped = !!flippedCards[uniqueCardKey];

            return (<div 
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
                    <div style={rankBadgeStyle}>#{index + 1}</div>
                    
                    <div style={imgContainerStyle}>
                      <Image
                        src={c.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || "User")}&background=random&size=300`}
                        style={imgStyle}
                        alt={c.name || "Kletter-Gast"}
                        fill
                        sizes="(max-width: 768px) 100vw, 280px"
                        unoptimized
                      />
                    </div>
                    
                    <div style={{ padding: "18px" }}>
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
                      <h3 style={{ borderBottom: "1px solid #3f3f46", width: "100%", paddingBottom: "10px", marginTop: 0, textAlign: "left", color: "#f4f4f5" }}>
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
              </div>);
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
  border: "1px solid rgba(99,102,241,0.35)",
  padding: "15px 18px",
  marginBottom: "30px",
  minHeight: "110px",
  borderRadius: "22px",
  background: "linear-gradient(115deg, rgba(2,6,23,0.92) 0%, rgba(30,41,59,0.85) 60%, rgba(67,56,202,0.45) 100%)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 14px 34px rgba(15,23,42,0.34)",
  zIndex: 20,
  transition: "transform 320ms ease, opacity 260ms ease",
};
const headerAnimationStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  pointerEvents: "auto",
  opacity: 0.42,
};
const gimmickToggleBtn = {
  border: "1px solid rgba(191,219,254,0.42)",
  borderRadius: "999px",
  padding: "4px",
  background: "rgba(15,23,42,0.4)",
  cursor: "pointer",
  transition: "transform 280ms ease, box-shadow 280ms ease",
  boxShadow: "0 8px 25px rgba(59,130,246,0.22)",
};
const gimmickInner = {
  transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
  borderRadius: "50%",
};
const titleBlockStyle = { display: "flex", flexDirection: "column", gap: "6px", zIndex: 1 };
const logoStyle = { fontSize: "1.95rem", margin: 0, display: "flex", alignItems: "center", gap: "12px", color: "#f8fafc", fontWeight: "900", letterSpacing: "-0.6px" };
const taglineStyle = { margin: 0, color: "#cbd5e1", fontSize: "0.9rem", fontWeight: "600" };
const navBtnStyle = { padding: "12px 24px", borderRadius: "999px", border: "1px solid rgba(165,180,252,0.55)", background: "linear-gradient(135deg, #312e81 0%, #4338ca 100%)", color: "#f8fafc", cursor: "pointer", fontWeight: "700", boxShadow: "0 10px 20px rgba(49,46,129,0.4)" };
const loaderContainer = { textAlign: "center", marginTop: "100px", color: "#a1a1aa" };
const modeInfoStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  marginBottom: "18px",
  textAlign: "center",
};
const modeIconStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1rem",
  background: "rgba(30,41,59,0.85)",
  border: "1px solid rgba(147,197,253,0.4)",
};
const modeHintStyle = { margin: 0, color: "#64748b", fontSize: "0.85rem" };
const gridSwitchViewportStyle = {
  overflow: "hidden",
};
const gridSwitchTrackStyle = {
  width: "200%",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  transition: "transform 620ms cubic-bezier(0.22, 1, 0.36, 1)",
};
const gridPanelStyle = { padding: "12px" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" };
const emptyStateStyle = { gridColumn: "1/-1", textAlign: "center", padding: "50px", color: "#64748b", fontWeight: "600" };

const cardContainerStyle = { perspective: "1000px", WebkitPerspective: "1000px", height: "550px", cursor: "pointer" };
const cardInnerStyle = { position: "relative", width: "100%", height: "100%", transition: "transform 0.6s", transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d" };

const baseFaceStyle = {
  position: "absolute",
  width: "100%",
  height: "100%",
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
  borderRadius: "26px",
  boxShadow: "0 20px 45px rgba(15,23,42,0.42)",
  overflow: "hidden",
  background: "linear-gradient(165deg, #0b1120 0%, #18233a 46%, #0f172a 100%)",
  border: "1px solid rgba(129,140,248,0.45)"
};

const cardFrontStyle = { ...baseFaceStyle };
const cardBackStyle = {
  ...baseFaceStyle,
  transform: "rotateY(180deg)",
  background: "linear-gradient(165deg, #020617 0%, #172554 52%, #020617 100%)",
};

const rankBadgeStyle = { position: "absolute", top: "15px", left: "15px", backgroundColor: "rgba(79,70,229,0.25)", color: "#c7d2fe", padding: "6px 12px", borderRadius: "12px", fontSize: "0.9rem", fontWeight: "bold", zIndex: 10, border: "1px solid rgba(165,180,252,0.65)" };
const imgContainerStyle = { position: "relative", height: "210px", width: "100%", backgroundColor: "#27272a" };
const imgStyle = { width: "100%", height: "100%", objectFit: "cover" };
const nameStyle = { margin: "0", fontSize: "1.35rem", color: "#f8fafc", fontWeight: "800", letterSpacing: "-0.4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const powerBadge = { display: "flex", flexDirection: "column", alignItems: "center", background: "linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)", color: "#fff", padding: "8px", borderRadius: "16px", minWidth: "60px", lineHeight: "1", border: "1px solid rgba(165,180,252,0.45)" };
const mentalCenterBox = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, rgba(51,65,85,0.75), rgba(30,41,59,0.95))", padding: "12px", borderRadius: "16px", marginBottom: "20px", border: "1px solid rgba(148,163,184,0.35)" };
const mentalLabel = { fontSize: "0.7rem", fontWeight: "bold", color: "#a1a1aa", letterSpacing: "1.5px", marginBottom: "4px" };
const mentalValueDisplay = { fontSize: "1.3rem", fontWeight: "900", color: "#34d399" };
const stylesGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid #3f3f46", paddingTop: "15px" };
const styleItem = { display: "flex", flexDirection: "column" };
const styleLabelText = { fontSize: "0.65rem", color: "#a1a1aa", textTransform: "uppercase", fontWeight: "bold", marginBottom: "2px" };
const styleValueText = { fontSize: "1.2rem", fontWeight: "900" };

const chartWrapperStyle = { 
  margin: "10px 0", 
  padding: "10px", 
  backgroundColor: "#0a0a0a", 
  borderRadius: "15px" 
};

const notesAreaStyle = { 
  marginTop: "10px", 
  fontSize: "0.9rem", 
  lineHeight: "1.4", 
  color: "#e4e4e7", 
  textAlign: "left", 
  width: "100%",
  padding: "10px",
  backgroundColor: "rgba(16,185,129,0.08)",
  borderRadius: "12px",
  borderLeft: "4px solid #34d399",
  maxHeight: "120px",
  overflowY: "auto"
};
