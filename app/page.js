"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import CombinedRadar from "@/components/charts/CombinedRadar";
import Image from "next/image";
import {
  ABILITY_COUNT,
  MAX_ABILITY_LEVEL,
  STYLE_LABELS,
  normalizeAbilities,
  normalizeStyles,
} from "@/lib/utils/profile-schema";

const GRADES = [
  "1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", 
  "4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", 
  "7a", "7b", "7c", "8a", "8b", "8c", "9a"
];

export default function Frontpage() {
  const [climbers, setClimbers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState({});

  const ADMIN_EMAIL = "janstoll1993@googlemail.com";

  useEffect(() => {
    const initPage = async () => {
      try {
        const [authRes, profileRes] = await Promise.all([
          supabaseBrowser.auth.getUser(),
          fetch("/api/profiles").then(res => res.json())
        ]);

        setUser(authRes.data?.user ?? null);

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

  return (
    <main style={mainStyle}>
      <header style={headerStyle}>
        <h1 style={logoStyle}>
          <span style={{ fontSize: "2rem" }}>🧗</span> Kletter-Quartett
        </h1>
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
        <div style={gridStyle}>
          {climbers.length > 0 ? climbers.map((c, index) => {
            const safeAbilities = normalizeAbilities(c.abilities);
            const safeStyles = normalizeStyles(c.styles);
            const sumAbilities = safeAbilities.reduce((a, b) => a + b, 0);
            const denominator = ABILITY_COUNT * MAX_ABILITY_LEVEL;
            const powerScore = Math.round((sumAbilities / denominator) * 100);
            const mentalValue = safeAbilities[2];
            
            const cardId = c.user_id || c.id || "climber";
            const cardInstanceId = `${cardId}-${index}`;
            const isFlipped = !!flippedCards[cardInstanceId];
            const avatarSrc = c.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'User')}&background=random&size=300`;
            const isFallbackAvatar = !c.image_url;

            return (
              <div 
                key={cardInstanceId} 
                style={cardContainerStyle} 
                onClick={() => toggleFlip(cardInstanceId)}
              >
                <div style={{
                  ...cardInnerStyle,
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                }}>
                  
                  {/* VORDERSEITE */}
                  <div style={cardFrontStyle}>
                    <div style={rankBadgeStyle}>#{index + 1}</div>
                    
                    <div style={imgContainerStyle}>
                      <Image
                        src={avatarSrc}
                        style={imgStyle}
                        alt={c.name || "Kletter-Gast"}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized={isFallbackAvatar}
                      />
                    </div>
                    
                    <div style={{ padding: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
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
                        {STYLE_LABELS.map((label, i) => (
                          <div key={label} style={styleItem}>
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
                      <h3 style={{ borderBottom: "1px solid #eee", width: "100%", paddingBottom: "10px", marginTop: 0, textAlign: "left" }}>
                        Statistik & Notizen
                      </h3>
                      
                      {/* Die kombinierte Chart */}
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

                      <div style={{ marginTop: "auto", fontSize: "0.7rem", color: "#bbb" }}>
                        ↻ Klicken zum Umdrehen
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          }) : (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "50px", color: "#888" }}>
              Noch keine Kletterer angemeldet.
            </div>
          )}
        </div>
      )}
    </main>
  );
}

// STYLES
const mainStyle = { padding: "20px", fontFamily: "'Inter', sans-serif", maxWidth: "1200px", margin: "0 auto", backgroundColor: "#f4f7f6", minHeight: "100vh" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e0e0e0", paddingBottom: "15px", marginBottom: "30px" };
const logoStyle = { fontSize: "1.8rem", margin: 0, display: "flex", alignItems: "center", gap: "12px", color: "#2c3e50", fontWeight: "900" };
const navBtnStyle = { padding: "12px 24px", borderRadius: "30px", border: "none", backgroundColor: "#007bff", color: "white", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 12px rgba(0,123,255,0.25)" };
const loaderContainer = { textAlign: "center", marginTop: "100px", color: "#666" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" };

const cardContainerStyle = { perspective: "1000px", height: "550px", cursor: "pointer" };
const cardInnerStyle = { position: "relative", width: "100%", height: "100%", transition: "transform 0.6s", transformStyle: "preserve-3d" };

const baseFaceStyle = {
  position: "absolute",
  width: "100%",
  height: "100%",
  backfaceVisibility: "hidden",
  borderRadius: "24px",
  boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
  overflow: "hidden",
  backgroundColor: "white",
  border: "1px solid rgba(0,0,0,0.05)"
};

const cardFrontStyle = { ...baseFaceStyle };
const cardBackStyle = { ...baseFaceStyle, transform: "rotateY(180deg)", backgroundColor: "#fff" };

const rankBadgeStyle = { position: "absolute", top: "15px", left: "15px", backgroundColor: "rgba(0,0,0,0.8)", color: "white", padding: "6px 12px", borderRadius: "12px", fontSize: "0.9rem", fontWeight: "bold", zIndex: 10 };
const imgContainerStyle = { height: "210px", width: "100%", backgroundColor: "#e9ecef", position: "relative" };
const imgStyle = { width: "100%", height: "100%", objectFit: "cover" };
const nameStyle = { margin: "0", fontSize: "1.4rem", color: "#1a1a1a", fontWeight: "800", letterSpacing: "-0.5px" };
const powerBadge = { display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "#1a1a1a", color: "#fff", padding: "8px", borderRadius: "16px", minWidth: "60px", lineHeight: "1" };
const mentalCenterBox = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "16px", marginBottom: "20px", border: "1px solid #f0f0f0" };
const mentalLabel = { fontSize: "0.7rem", fontWeight: "bold", color: "#888", letterSpacing: "1.5px", marginBottom: "4px" };
const mentalValueDisplay = { fontSize: "1.3rem", fontWeight: "900", color: "#007bff" };
const stylesGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid #eee", paddingTop: "15px" };
const styleItem = { display: "flex", flexDirection: "column" };
const styleLabelText = { fontSize: "0.65rem", color: "#bbb", textTransform: "uppercase", fontWeight: "bold", marginBottom: "2px" };
const styleValueText = { fontSize: "1.2rem", fontWeight: "900" };

const chartWrapperStyle = { 
  margin: "10px 0", 
  padding: "10px", 
  backgroundColor: "#fcfcfc", 
  borderRadius: "15px" 
};

const notesAreaStyle = { 
  marginTop: "10px", 
  fontSize: "0.9rem", 
  lineHeight: "1.4", 
  color: "#444", 
  textAlign: "left", 
  width: "100%",
  padding: "10px",
  backgroundColor: "#f0f7ff",
  borderRadius: "12px",
  borderLeft: "4px solid #007bff",
  maxHeight: "120px",
  overflowY: "auto"
};
