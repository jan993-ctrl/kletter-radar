"use client";

import { useEffect, useState } from "react";
import RadarChart from "@/components/charts/RadarChart";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Deine definierten Grade
const GRADES = [
  "1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", 
  "4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", 
  "7a", "7b", "7c", "8a", "8b", "8c", "9a"
];

// Die 7 körperlichen Eigenschaften
const ABILITY_CONFIG = [
  { label: "Kraft", desc: "Fingerkraft (Relativ) & Schulter", key: "kraft" },
  { label: "Explosive Strength", desc: "Schnelligkeit, Dynos" },
  { label: "Technik", desc: "Präzision, Flagg, Smiring, Hook's, Fußarbeit" },
  { label: "Körperspannung", desc: "Overhang, Toe Hooks, Compression" },
  { label: "Mobilität", desc: "Flexibilität, Hüftöffnung" },
  { label: "Balance", desc: "Postural Control" },
  { label: "Mentalität", desc: "Headgame, Fokus, Mut" }
];

const abilityLabels = ABILITY_CONFIG.map(a => a.label);
const styleLabels = ["Crimper", "Sloper", "Slab", "Dyno", "Pocket"];

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
            abilities: [12, 12, 12, 12, 12, 12, 12],
            ability_details: { finger_kg: 0, pullups: 10 },
            styles: [12, 12, 12, 12, 12],
            image_url: ""
          });
        } else {
          // Fallback falls neue Felder in DB noch leer sind
          const loadedProfile = { ...data };
          if (!loadedProfile.ability_details) loadedProfile.ability_details = { finger_kg: 0, pullups: 10 };
          if (!loadedProfile.weight) loadedProfile.weight = 75;
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

  // Berechnung der Kraft-Logik (Relativkraft)
  const updateStrengthDetails = (key, val) => {
    const newVal = parseFloat(val) || 0;
    const newDetails = { ...profile.ability_details, [key]: newVal };
    
    // Fingerkraft Level: (Zusatzgewicht / Körpergewicht * 24)
    const fingerLevel = profile.weight > 0 ? (newDetails.finger_kg / profile.weight) * 24 : 0;
    // Schulterkraft Level: (Klimmzüge / 30 * 24)
    const shoulderLevel = (newDetails.pullups / 30) * 24;

    const totalStrength = Math.round(Math.min(24, Math.max(0, (fingerLevel + shoulderLevel) / 2)));
    
    const newAbilities = [...(profile.abilities || [12,12,12,12,12,12,12])];
    newAbilities[0] = totalStrength;

    setProfile({ ...profile, ability_details: newDetails, abilities: newAbilities });
  };

  if (loading) return <div style={{ padding: 50, textAlign: "center" }}>Lade Profil...</div>;
  if (!profile) return <div style={{ padding: 50, textAlign: "center" }}>Fehler beim Laden der Profildaten.</div>;

  const safeAbilities = Array.isArray(profile.abilities) && profile.abilities.length === 7 
    ? profile.abilities 
    : [12, 12, 12, 12, 12, 12, 12];

  const safeStyles = Array.isArray(profile.styles) && profile.styles.length === 5 
    ? profile.styles 
    : [12, 12, 12, 12, 12];

  return (
    <main style={{ padding: 20, maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif", color: "#333" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc", paddingBottom: 10 }}>
        <h1 style={{ margin: 0 }}>👤 Mein Profil</h1>
        <div>
          <button onClick={() => router.push("/")} style={{ marginRight: 10, padding: "8px 15px", cursor: "pointer", borderRadius: 4, border: "1px solid #ccc", backgroundColor: "white", color: "black" }}>← Zur Website</button>
          <button onClick={signOut} style={{ padding: "8px 15px", cursor: "pointer", backgroundColor: "#ff4d4d", color: "white", border: "none", borderRadius: 4, fontWeight: "bold" }}>Abmelden</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 40, marginTop: 30, flexWrap: "wrap" }}>
        
        {/* Linke Spalte: Formular */}
        <div style={{ flex: "1 1 400px" }}>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: 5 }}>Name:</label>
            <input
              style={inputStyle}
              value={profile.name || ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>

          {/* Körperdaten Sektion */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: 25, backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "8px", border: "1px solid #eee" }}>
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
            <div key={cfg.label} style={{ marginBottom: 18, padding: "10px", borderRadius: "8px", backgroundColor: expandedKey === cfg.key ? "#f0f7ff" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <span style={{ fontWeight: "bold", display: "block" }}>{cfg.label}</span>
                  <span style={{ fontSize: "0.75rem", color: "#888" }}>{cfg.desc}</span>
                  {cfg.key === "kraft" && (
                    <button onClick={() => setExpandedKey(expandedKey === "kraft" ? null : "kraft")} style={detailBtnStyle}>
                      {expandedKey === "kraft" ? "▲ Messwerte schließen" : "▼ Messwerte eintragen"}
                    </button>
                  )}
                </div>
                <span style={{ fontWeight: "bold", color: "#007bff" }}>Level {safeAbilities[i]}</span>
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
                <input type="range" min="0" max="24" step="1" style={{ width: "100%", marginTop: 5 }}
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
          {styleLabels.map((lab, i) => (
            <div key={lab} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span>{lab}</span>
                <span style={{ fontWeight: "bold", color: "#28a745" }}>{GRADES[safeStyles[i]] || "1a"}</span>
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
              style={{ width: '100%', height: 80, padding: 10, borderRadius: 4, border: "1px solid #ccc", boxSizing: "border-box", color: "black" }}
              value={profile.notes || ""}
              onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
            />
          </div>

          <div style={{ backgroundColor: "#fff", padding: 15, borderRadius: 8, border: "1px solid #ddd", marginBottom: 25 }}>
            <h3 style={{ marginTop: 0 }}>Profilfoto</h3>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={saving} />
            {profile.image_url && (
              <div style={{ marginTop: 15 }}>
                <img src={profile.image_url} alt="Vorschau" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: "2px solid #ddd" }} />
              </div>
            )}
          </div>

          <div style={{ marginTop: 40, paddingBottom: 100 }}>
            <button 
              onClick={handleSave} 
              disabled={saving}
              style={{ backgroundColor: '#28a745', color: 'white', padding: '15px 30px', border: 'none', borderRadius: 6, cursor: 'pointer', width: '100%', fontWeight: "bold", fontSize: "1rem" }}
            >
              {saving ? "Wird gespeichert..." : "Profil speichern"}
            </button>
          </div>
        </div>

        {/* Rechte Spalte: Charts */}
        <div style={{ flex: "0 0 400px", display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={chartBoxStyle}>
            <RadarChart 
              labels={abilityLabels} 
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
              labels={styleLabels} 
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

// Interne Styles für bessere Übersicht
const inputStyle = { width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc", boxSizing: "border-box", color: "black", marginTop: "5px" };
const smallLabel = { fontSize: "0.75rem", fontWeight: "bold", color: "#666" };
const detailBtnStyle = { display: "block", marginTop: "5px", background: "none", border: "1px solid #007bff", color: "#007bff", cursor: "pointer", fontSize: "0.7rem", borderRadius: "4px", padding: "2px 6px" };
const detailBoxStyle = { marginTop: "15px", padding: "15px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #d0e7ff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" };
const chartBoxStyle = { position: "relative", width: "400px", height: "350px", border: "1px solid #eee", borderRadius: 8, padding: 10, backgroundColor: "white" };