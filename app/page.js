"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@lib/supabase-browser";
import Link from "next/link";

// Die Liste bis 9a
const GRADES = [
  "1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", 
  "4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", 
  "7a", "7b", "7c", "8a", "8b", "8c", "9a"
];

export default function Frontpage() {
  const [climbers, setClimbers] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = "janstoll1993@googlemail.com";

  useEffect(() => {
    // Session laden
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null);
    });
    
    // Profile laden
    fetch("/api/profiles")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Sortierung nach Gesamtstärke (Summe abilities)
          const sorted = data.sort((a, b) => {
            const sumA = a.abilities?.reduce((acc, val) => acc + val, 0) || 0;
            const sumB = b.abilities?.reduce((acc, val) => acc + val, 0) || 0;
            return sumB - sumA;
          });
          setClimbers(sorted);
        }
      })
      .catch(err => console.error("Fehler:", err))
      .finally(() => setLoading(false));
  }, []);

  // Hilfsfunktion für Farben der Grade
  const getGradeColor = (index) => {
    if (index < 12) return "#28a745"; // bis 4c: Grün
    if (index < 15) return "#ffc107"; // 5er: Gelb
    if (index < 18) return "#fd7e14"; // 6er: Orange
    if (index < 21) return "#dc3545"; // 7er: Rot
    return "#343a40"; // 8a - 9a: Schwarz
  };

  const profileLink = session?.user?.email === ADMIN_EMAIL ? "/admin" : "/profile";

  return (
    <main style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "1200px", margin: "0 auto", backgroundColor: "#fbfbfb", minHeight: "100vh" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #eee", paddingBottom: "15px", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "1.8rem", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "2rem" }}>🧗</span> Kletter-Quartett
        </h1>
        <div>
          {session ? (
            <Link href={profileLink}><button style={navBtnStyle}>Mein Profil</button></Link>
          ) : (
            <Link href="/admin"><button style={navBtnStyle}>Login</button></Link>
          )}
        </div>
      </header>

      {loading ? (
        <p style={{ textAlign: "center", marginTop: "50px", color: "#666" }}>Lade Kletterer-Community...</p>
      ) : (
        <div style={gridStyle}>
          {climbers.map((c, index) => {
            const safeAbilities = c.abilities || [0,0,0,0,0];
            const safeStyles = c.styles || [0];
            const gradeIdx = safeStyles[0];

            return (
              <div key={c.id || index} style={cardStyle}>
                {/* Ranking oben links */}
                <div style={rankBadgeStyle}>#{index + 1}</div>

                {/* Profilbild Bereich */}
                <div style={imgContainerStyle}>
                  <img 
                    src={c.image_url || `https://ui-avatars.com/api/?name=${c.name || 'User'}&background=random&size=300`} 
                    style={imgStyle} 
                    alt={c.name} 
                  />
                </div>
                
                <div style={{ padding: "15px" }}>
                  <h2 style={{ margin: "0 0 15px 0", fontSize: "1.4rem", color: "#333" }}>{c.name || "Kletter-Gast"}</h2>
                  
                  {/* Stats mit kleinen Balken */}
                  <div style={statsStyle}>
                    {[
                      { label: "Kraft", val: safeAbilities[0], color: "#ff4757" },
                      { label: "Bewegl.", val: safeAbilities[1], color: "#2ed573" },
                      { label: "Mental", val: safeAbilities[2], color: "#1e90ff" }
                    ].map(stat => (
                      <div key={stat.label} style={{ marginBottom: "8px" }}>
                        <div style={statLine}>
                          <span>{stat.label}</span>
                          <b>{stat.val * 10}</b>
                        </div>
                        <div style={progressBg}><div style={{ ...progressFill, width: `${stat.val * 10}%`, backgroundColor: stat.color }}></div></div>
                      </div>
                    ))}
                  </div>

                  {/* Grad-Badge unten */}
                  <div style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px" }}>Best Onsight</div>
                    <div style={{ 
                      display: "inline-block",
                      padding: "5px 20px",
                      borderRadius: "20px",
                      backgroundColor: getGradeColor(gradeIdx),
                      color: (gradeIdx >= 12 && gradeIdx < 15) ? "#000" : "#fff",
                      fontWeight: "900",
                      fontSize: "1.2rem",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                    }}>
                      {GRADES[gradeIdx] || "1a"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

// Styles
const navBtnStyle = { padding: "10px 22px", borderRadius: "25px", border: "none", backgroundColor: "#007bff", color: "white", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 10px rgba(0,123,255,0.3)" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "30px", marginTop: "10px" };
const cardStyle = { position: "relative", borderRadius: "20px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.08)", border: "1px solid #eee", backgroundColor: "white", transition: "transform 0.2s" };
const rankBadgeStyle = { position: "absolute", top: "12px", left: "12px", backgroundColor: "rgba(0,0,0,0.75)", color: "white", padding: "5px 10px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: "bold", zIndex: 10, backdropFilter: "blur(4px)" };
const imgContainerStyle = { height: "220px", width: "100%", backgroundColor: "#f0f0f0" };
const imgStyle = { width: "100%", height: "100%", objectFit: "cover" };
const statsStyle = { display: "flex", flexDirection: "column" };
const statLine = { display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "3px" };
const progressBg = { height: "6px", backgroundColor: "#eee", borderRadius: "3px", overflow: "hidden" };
const progressFill = { height: "100%", borderRadius: "3px", transition: "width 0.5s ease-out" };