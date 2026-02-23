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

const abilityLabels = ["Kraft", "Beweglichkeit", "Mentalität", "Explosivität", "Körperspannung"];
const styleLabels = ["Crimper", "Sloper", "Slab", "Dyno", "Pocket"];

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          // Initialwerte bei neuem Profil (Level 12 als Standard)
          setProfile({
            user_id: user.id,
            name: user.email?.split('@')[0] || "Kletterer",
            notes: "",
            abilities: [12, 12, 12, 12, 12],
            styles: [12, 12, 12, 12, 12],
            image_url: ""
          });
        } else {
          setProfile(data);
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

  if (loading) return <div style={{ padding: 50, textAlign: "center" }}>Lade Profil...</div>;
  if (!profile) return <div style={{ padding: 50, textAlign: "center" }}>Fehler beim Laden der Profildaten.</div>;

  // WICHTIG: Die Fallbacks sorgen dafür, dass die Slider nicht abstürzen
  const safeAbilities = Array.isArray(profile.abilities) && profile.abilities.length === 5 
    ? profile.abilities 
    : [12, 12, 12, 12, 12];

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
        
        {/* Formular-Spalte */}
        <div style={{ flex: "1 1 400px" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: 5 }}>Name:</label>
            <input
              style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc", boxSizing: "border-box", color: "black" }}
              value={profile.name || ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
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

          <h3>Fähigkeiten (Level 0-24)</h3>
          {abilityLabels.map((lab, i) => (
            <div key={lab} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span>{lab}</span>
                <span style={{ fontWeight: "bold", color: "#007bff" }}>Level {safeAbilities[i]}</span>
              </div>
              <input type="range" min="0" max="24" step="1" style={{ width: "100%" }}
                value={safeAbilities[i]}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  const a = [...safeAbilities];
                  a[i] = v;
                  setProfile({ ...profile, abilities: a });
                }}
              />
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

        {/* Chart-Spalte: Behält beide einzelnen Grafiken bei */}
        <div style={{ flex: "0 0 400px", display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={{ position: "relative", width: "400px", height: "350px", border: "1px solid #eee", borderRadius: 8, padding: 10, backgroundColor: "white" }}>
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

          <div style={{ position: "relative", width: "400px", height: "350px", border: "1px solid #eee", borderRadius: 8, padding: 10, backgroundColor: "white" }}>
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