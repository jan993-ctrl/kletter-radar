"use client";

import { useEffect, useState } from "react";
import RadarChart from "@/components/charts/RadarChart";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ABILITY_LABELS,
  ABILITY_COUNT,
  DEFAULT_ABILITY_LEVEL,
  DEFAULT_STYLE_LEVEL,
  MAX_ABILITY_LEVEL,
  STYLE_LABELS,
  normalizeAbilities,
  normalizeStyles,
} from "@/lib/utils/profile-schema";

// Deine definierten Grade
const GRADES = [
  "1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", 
  "4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", 
  "7a", "7b", "7c", "8a", "8b", "8c", "9a"
];

const ABILITY_CONFIG = [
  { label: ABILITY_LABELS[0], desc: "Fingerkraft (Relativ) & Schulter", key: "kraft" },
  { label: ABILITY_LABELS[1], desc: "Schnelligkeit, Dynos" },
  { label: ABILITY_LABELS[2], desc: "Präzision, Flagg, Smearing, Hook's, Fußarbeit" },
  { label: ABILITY_LABELS[3], desc: "Overhang, Toe Hooks, Compression" },
  { label: ABILITY_LABELS[4], desc: "Flexibilität, Hüftöffnung" },
  { label: ABILITY_LABELS[5], desc: "Postural Control" },
  { label: ABILITY_LABELS[6], desc: "Headgame, Fokus, Mut" },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();
        
        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabaseBrowser
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setProfile({
            user_id: user.id,
            name: user.email?.split('@')[0] || "Kletterer",
            weight: 75,
            height: 180,
            arm_span: 185,
            notes: "",
            abilities: Array(ABILITY_COUNT).fill(DEFAULT_ABILITY_LEVEL),
            ability_details: { finger_kg: 0, pullups: 10 },
            styles: Array(STYLE_LABELS.length).fill(DEFAULT_STYLE_LEVEL),
            image_url: ""
          });
        } else {
          const loadedProfile = { ...data };
          if (!loadedProfile.ability_details) loadedProfile.ability_details = { finger_kg: 0, pullups: 10 };
          if (!loadedProfile.weight) loadedProfile.weight = 75;
          loadedProfile.abilities = normalizeAbilities(loadedProfile.abilities);
          loadedProfile.styles = normalizeStyles(loadedProfile.styles);
          setProfile(loadedProfile);
        }
      } catch (err) {
        console.error("Fehler beim Laden:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const signOut = async () => {
    await supabaseBrowser.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !profile?.user_id) return;

    setSaving(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.user_id}/${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabaseBrowser.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabaseBrowser.storage.from('profiles').getPublicUrl(fileName);
      setProfile({ ...profile, image_url: data.publicUrl });
      alert("Bild bereit! Bitte unten 'Speichern' klicken.");
    } catch (err) {
      alert("Upload-Fehler: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Speichern fehlgeschlagen");
      }

      alert("Dein Profil wurde gespeichert!");
      router.refresh();
    } catch (err) {
      alert("Fehler: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStrengthDetails = (key, val) => {
    const newVal = parseFloat(val) || 0;
    const newDetails = { ...profile.ability_details, [key]: newVal };
    
    const fingerLevel = profile.weight > 0 ? (newDetails.finger_kg / profile.weight) * MAX_ABILITY_LEVEL : 0;
    const shoulderLevel = (newDetails.pullups / 30) * MAX_ABILITY_LEVEL;
    const totalStrength = Math.round(Math.min(MAX_ABILITY_LEVEL, Math.max(0, (fingerLevel + shoulderLevel) / 2)));
    
    const newAbilities = [...profile.abilities];
    newAbilities[0] = totalStrength;

    setProfile({ ...profile, ability_details: newDetails, abilities: newAbilities });
  };

  if (loading) return null; // Das Layout zeigt bereits das Gimmick während der kurzen Ladezeit

  const safeAbilities = normalizeAbilities(profile.abilities);
  const safeStyles = normalizeStyles(profile.styles);

  return (
    <main style={{ padding: 20, maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif", color: "#333", backgroundColor: "transparent", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid rgba(0,0,0,0.05)", paddingBottom: 15, marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "800" }}>👤 Mein Profil</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            onClick={() => router.push("/")} 
            style={secondaryButtonStyle}
            onMouseEnter={(e) => {
                e.target.style.borderColor = "#cbd5e0";
                e.target.style.backgroundColor = "#f8fafc";
            }}
            onMouseLeave={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.backgroundColor = "#fff";
            }}
          >
            ← Zur Website
          </button>
          
          <button 
            onClick={signOut} 
            style={dangerButtonStyle}
            onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#fff5f5";
                e.target.style.borderColor = "#fc8181";
            }}
            onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#fff";
                e.target.style.borderColor = "#feb2b2";
            }}
          >
            Abmelden
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 40, marginTop: 30, flexWrap: "wrap" }}>
        
        <div style={{ flex: "1 1 400px" }}>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: 5 }}>Name:</label>
            <input
              style={inputStyle}
              value={profile.name || ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>

          <div style={glassCardSmallStyle}>
            <div>
              <label style={smallLabel}>Gewicht (kg)</label>
              <input type="number" style={inputStyle} value={profile.weight || ""} onChange={(e) => setProfile({...profile, weight: parseFloat(e.target.value) || 0})} />
            </div>
            <div>
              <label style={smallLabel}>Größe (cm)</label>
              <input type="number" style={inputStyle} value={profile.height || ""} onChange={(e) => setProfile({...profile, height: parseFloat(e.target.value) || 0})} />
            </div>
            <div>
              <label style={smallLabel}>Spannweite (cm)</label>
              <input type="number" style={inputStyle} value={profile.arm_span || ""} onChange={(e) => setProfile({...profile, arm_span: parseFloat(e.target.value) || 0})} />
            </div>
          </div>

          <h3>Körperliche Eigenschaften (Level 0-24)</h3>
          {ABILITY_CONFIG.map((cfg, i) => (
            <div key={cfg.label} style={{ marginBottom: 18, padding: "12px", borderRadius: "12px", backgroundColor: expandedKey === cfg.key ? "rgba(240, 253, 244, 0.7)" : "rgba(249, 249, 249, 0.6)", border: "1px solid rgba(0,0,0,0.05)", backdropFilter: "blur(4px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <span style={{ fontWeight: "bold", display: "block" }}>{cfg.label}</span>
                  <span style={{ fontSize: "0.75rem", color: "#666" }}>{cfg.desc}</span>
                  {cfg.key === "kraft" && (
                    <button onClick={() => setExpandedKey(expandedKey === "kraft" ? null : "kraft")} style={detailBtnStyle}>
                      {expandedKey === "kraft" ? "▲ Messwerte schließen" : "▼ Messwerte eintragen"}
                    </button>
                  )}
                </div>
                <span style={{ fontWeight: "bold", color: "#059669" }}>Level {safeAbilities[i]}</span>
              </div>

              {expandedKey === "kraft" && cfg.key === "kraft" ? (
                <div style={detailBoxStyle}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={smallLabel}>Zusatzgewicht 10mm Leiste (kg) für 5s</label>
                    <input type="number" style={inputStyle} value={profile.ability_details?.finger_kg || 0} 
                      onChange={(e) => updateStrengthDetails("finger_kg", e.target.value)} />
                  </div>
                  <div>
                    <label style={smallLabel}>Max. Klimmzüge (Anzahl)</label>
                    <input type="number" style={inputStyle} value={profile.ability_details?.pullups || 0} 
                      onChange={(e) => updateStrengthDetails("pullups", e.target.value)} />
                  </div>
                </div>
              ) : (
                <input type="range" min="0" max={MAX_ABILITY_LEVEL} step="1" style={{ width: "100%", marginTop: 5 }}
                  value={safeAbilities[i]}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    const a = [...safeAbilities];
                    a[i] = v;
                    setProfile({ ...profile, abilities: a });
                  }}
                />
              )}
            </div>
          ))}

          <h3 style={{ marginTop: 30 }}>Stile (Grad)</h3>
          {STYLE_LABELS.map((lab, i) => (
            <div key={lab} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span>{lab}</span>
                <span style={{ fontWeight: "bold", color: "#d97706" }}>{GRADES[safeStyles[i]] || "1a"}</span>
              </div>
              <input type="range" min="0" max={GRADES.length - 1} step="1" style={{ width: "100%" }}
                value={safeStyles[i]}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  const s = [...safeStyles];
                  s[i] = v;
                  setProfile({ ...profile, styles: s });
                }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 20, marginTop: 30 }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: 5 }}>Notizen & Ziele:</label>
            <textarea
              style={{ width: '100%', height: 80, padding: 10, borderRadius: 10, border: "1px solid #ccc", boxSizing: "border-box", color: "#333", backgroundColor: "rgba(255,255,255,0.8)" }}
              value={profile.notes || ""}
              onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
            />
          </div>

          <div style={{ backgroundColor: "rgba(249, 249, 249, 0.6)", padding: 15, borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)", marginBottom: 25, backdropFilter: "blur(4px)" }}>
            <h3 style={{ marginTop: 0 }}>Profilfoto</h3>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={saving} />
            {profile.image_url && (
              <div style={{ marginTop: 15 }}>
                <Image src={profile.image_url} alt="Vorschau" width={120} height={120} style={{ objectFit: 'cover', borderRadius: 8, border: "1px solid #ddd" }} />
              </div>
            )}
          </div>

          <div style={{ marginTop: 40, paddingBottom: 100 }}>
            <button 
              onClick={handleSave} 
              disabled={saving}
              style={{ backgroundColor: '#10b981', color: '#fff', padding: '15px 30px', border: 'none', borderRadius: 10, cursor: 'pointer', width: '100%', fontWeight: "bold", fontSize: "1rem" }}
            >
              {saving ? "Wird gespeichert..." : "Profil speichern"}
            </button>
          </div>
        </div>

        <div style={{ flex: "0 0 400px", display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={chartBoxStyle}>
            <RadarChart 
              labels={ABILITY_LABELS} 
              dataSets={[{ 
                label: "Fähigkeiten", 
                data: safeAbilities, 
                backgroundColor: "rgba(54,162,235,0.2)",
                borderColor: "rgba(54,162,235,1)"
              }]} 
            />
          </div>

          <div style={chartBoxStyle}>
            <RadarChart 
              labels={STYLE_LABELS} 
              dataSets={[{ 
                label: "Stile", 
                data: safeStyles, 
                backgroundColor: "rgba(40,167,69,0.2)",
                borderColor: "rgba(40,167,69,1)"
              }]} 
            />
          </div>
        </div>
      </div>
    </main>
  );
}

// STYLES
const inputStyle = { width: '100%', padding: 10, borderRadius: 10, border: "1px solid #ccc", boxSizing: "border-box", color: "#333", backgroundColor: "rgba(255,255,255,0.8)", marginTop: "5px" };
const smallLabel = { fontSize: "0.75rem", fontWeight: "bold", color: "#666" };
const detailBtnStyle = { display: "block", marginTop: "5px", background: "#fff", border: "1px solid #10b981", color: "#10b981", cursor: "pointer", fontSize: "0.7rem", borderRadius: "8px", padding: "4px 8px" };
const detailBoxStyle = { marginTop: "15px", padding: "15px", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" };
const chartBoxStyle = { position: "relative", width: "400px", height: "350px", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 12, padding: 10, backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" };
const glassCardSmallStyle = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: 25, backgroundColor: "rgba(249, 249, 249, 0.6)", padding: "15px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.05)", backdropFilter: "blur(4px)" };

const secondaryButtonStyle = { 
  padding: "10px 18px", 
  cursor: "pointer", 
  borderRadius: "12px", 
  border: "2px solid #e2e8f0", 
  backgroundColor: "#fff", 
  color: "#4a5568", 
  fontSize: "0.9rem", 
  fontWeight: "600", 
  transition: "all 0.2s",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
};

const dangerButtonStyle = { 
  padding: "10px 18px", 
  cursor: "pointer", 
  backgroundColor: "#fff", 
  color: "#e53e3e", 
  border: "2px solid #feb2b2", 
  borderRadius: "12px", 
  fontSize: "0.9rem", 
  fontWeight: "700", 
  transition: "all 0.2s",
  boxShadow: "0 2px 4px rgba(229, 62, 62, 0.05)"
};