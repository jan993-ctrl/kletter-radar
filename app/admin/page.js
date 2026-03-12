"use client";

import { useEffect, useState } from "react";
import RadarChart from "@/components/charts/RadarChart";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ABILITY_LABELS,
  DEFAULT_ABILITY_LEVEL,
  DEFAULT_STYLE_LEVEL,
  MAX_ABILITY_LEVEL,
  STYLE_LABELS,
  normalizeAbilities,
  normalizeStyles,
} from "@/lib/utils/profile-schema";

// Deine definierten Grade
const getStoragePathFromPublicUrl = (publicUrl) => {
  if (!publicUrl) return null;
  const marker = "/storage/v1/object/public/profiles/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
};

const GRADES = [
  "1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", 
  "4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", 
  "7a", "7b", "7c", "8a", "8b", "8c", "9a"
];

export default function AdminPage() {
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 1. Profile laden
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const r = await fetch("/api/profiles");
        const d = await r.json();
        const arr = Array.isArray(d) ? d : [];
        setProfiles(arr);
        if (arr.length > 0) setSelectedId(arr[0].id);
      } catch (e) {
        console.error("Failed to load profiles:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfiles();
  }, []);

  // 2. Auswahl synchronisieren
  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    const p = profiles.find((x) => x.id === selectedId);
    if (p) setSelected({ ...p });
  }, [selectedId, profiles]);

  const signOut = async () => {
    await supabaseBrowser.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selected) return;

    setSaving(true);
    const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `${selected.id}/${Date.now()}.${fileExt}`;

    try {
      const oldPath = getStoragePathFromPublicUrl(selected.image_url);
      if (oldPath && oldPath !== fileName) {
        const { error: removeError } = await supabaseBrowser.storage
          .from('profiles')
          .remove([oldPath]);

        if (removeError && removeError.statusCode !== '404') {
          throw removeError;
        }
      }

      const { error: uploadError } = await supabaseBrowser.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabaseBrowser.storage.from('profiles').getPublicUrl(fileName);
      setSelected({ ...selected, image_url: data.publicUrl });
      alert("Bild hochgeladen! Bitte 'Speichern' klicken.");
    } catch (err) {
      alert("Upload-Fehler: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return alert("Kein Profil ausgewählt");
    setSaving(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Save failed");
      }

      alert("Gespeichert!");
      const r = await fetch("/api/profiles");
      const d = await r.json();
      setProfiles(d);
    } catch (err) {
      alert("Fehler beim Speichern: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (profile) => {
    if (!profile.id) return alert("Dieses Profil hat keine gültige ID.");
    if (!confirm(`Willst du das Profil von ${profile.name} wirklich löschen?`)) return;
    
    try {
      const res = await fetch(`/api/profiles?id=${profile.id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Gelöscht!");
        const updatedList = profiles.filter(p => p.id !== profile.id);
        setProfiles(updatedList);
        setSelectedId(updatedList.length > 0 ? updatedList[0].id : null);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Löschen fehlgeschlagen");
      }
    } catch (error) {
      alert("Fehler: " + error.message);
    }
  };

  const handleNew = () => {
    const id = crypto.randomUUID();
    const newP = { 
      id, 
      user_id: null, 
      name: "Neuer Kletterer", 
      notes: "", 
      abilities: Array(ABILITY_LABELS.length).fill(DEFAULT_ABILITY_LEVEL),
      styles: Array(STYLE_LABELS.length).fill(DEFAULT_STYLE_LEVEL),
      image_url: "" 
    };
    setProfiles((prev) => [...prev, newP]);
    setSelectedId(id);
    setSelected(newP);
  };

  if (isLoading) return <div className="p-10 text-center">Lade Admin-Panel...</div>;

  const safeAbilities = normalizeAbilities(selected?.abilities);
  const safeStyles = normalizeStyles(selected?.styles);

  return (
    <main style={{ padding: 20, maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif", color: "#333" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc", paddingBottom: 10 }}>
        <h1 style={{ margin: 0 }}>🧗 Admin Panel</h1>
        <div>
          <button onClick={() => router.push("/")} style={{ marginRight: 10, padding: "8px 15px", cursor: "pointer", borderRadius: 4, border: "1px solid #ccc", backgroundColor: "white", color: "black" }}>← Zur Website</button>
          <button onClick={signOut} style={{ padding: "8px 15px", cursor: "pointer", backgroundColor: "#ff4d4d", color: "white", border: "none", borderRadius: 4, fontWeight: "bold" }}>Abmelden</button>
        </div>
      </div>

      <div style={{ marginTop: 20, backgroundColor: "#f4f4f4", padding: 15, borderRadius: 8, display: "flex", alignItems: "center", gap: 15 }}>
        <label><strong>Profil bearbeiten:</strong> </label>
        <select value={selectedId || ""} onChange={(e) => setSelectedId(e.target.value)} style={{ padding: "8px", borderRadius: 4, border: "1px solid #ccc", minWidth: "200px", color: "black" }}>
          <option value="" disabled>-- wählen --</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name || "(Unbenannt)"}</option>
          ))}
        </select>
        <button onClick={handleNew} style={{ padding: "8px 15px", cursor: "pointer", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: 4, fontWeight: "bold" }}>+ Neu</button>
      </div>

      {!selected ? (
        <p style={{ marginTop: 40, textAlign: "center", color: "#666" }}>Bitte ein Profil auswählen oder links auf &quot;Neu&quot; klicken.</p>
      ) : (
        <div style={{ display: "flex", gap: 40, marginTop: 30, flexWrap: "wrap" }}>
          
          <div style={{ flex: "1 1 400px" }}>
            <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: 5 }}>Name:</label>
                <input
                  style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc", boxSizing: "border-box", color: "black" }}
                  value={selected.name || ""}
                  onChange={(e) => setSelected((s) => ({ ...s, name: e.target.value }))}
                />
            </div>

            <div style={{ marginBottom: 20 }}>
                <label htmlFor="notes" style={{ display: "block", fontWeight: "bold", marginBottom: 5 }}>Notizen:</label>
                <textarea
                  id="notes"
                  style={{ width: '100%', height: 80, padding: 10, borderRadius: 4, border: "1px solid #ccc", boxSizing: "border-box", color: "black" }}
                  value={selected.notes || ""}
                  onChange={(e) => setSelected((s) => ({ ...s, notes: e.target.value }))}
                />
            </div>

            <div style={{ backgroundColor: "#fff", padding: 15, borderRadius: 8, border: "1px solid #ddd", marginBottom: 25 }}>
              <h3 style={{ marginTop: 0 }}>Profilfoto</h3>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={saving} />
              {selected.image_url && (
                <div style={{ marginTop: 15 }}>
                  <Image src={selected.image_url} alt="Vorschau" width={120} height={120} style={{ objectFit: 'cover', borderRadius: 8, border: "2px solid #ddd" }} />
                </div>
              )}
            </div>

            <h3>Fähigkeiten (Level 0-24)</h3>
            {ABILITY_LABELS.map((lab, i) => (
              <div key={lab} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span>{lab}</span>
                    <span style={{ fontWeight: "bold", color: "#007bff" }}>Level {safeAbilities[i]}</span>
                </div>
                <input type="range" min="0" max={MAX_ABILITY_LEVEL} step="1" style={{ width: "100%" }}
                  value={safeAbilities[i]}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    const a = [...safeAbilities];
                    a[i] = v;
                    setSelected({ ...selected, abilities: a });
                  }}
                />
              </div>
            ))}

            <h3 style={{ marginTop: 30 }}>Stile (Grad)</h3>
            {STYLE_LABELS.map((lab, i) => (
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
                    setSelected({ ...selected, styles: s });
                  }}
                />
              </div>
            ))}

            <div style={{ marginTop: 40, display: 'flex', gap: 15, paddingBottom: 100 }}>
              <button 
                onClick={handleSave} 
                disabled={saving}
                style={{ backgroundColor: '#28a745', color: 'white', padding: '15px 30px', border: 'none', borderRadius: 6, cursor: 'pointer', flex: 2, fontWeight: "bold", fontSize: "1rem" }}
              >
                {saving ? "Wird gespeichert..." : "Änderungen speichern"}
              </button>
              
              <button 
                onClick={() => handleDelete(selected)}
                style={{ backgroundColor: 'white', color: '#dc3545', padding: '15px 20px', border: '1px solid #dc3545', borderRadius: 6, cursor: 'pointer', fontWeight: "bold" }}
              >
                Löschen
              </button>
            </div>
          </div>

          <div style={{ flex: "0 0 400px", display: "flex", flexDirection: "column", gap: 30 }}>
              <div style={{ position: "relative", width: "400px", height: "350px", border: "1px solid #eee", borderRadius: 8, padding: 10, backgroundColor: "white" }}>
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

              <div style={{ position: "relative", width: "400px", height: "350px", border: "1px solid #eee", borderRadius: 8, padding: 10, backgroundColor: "white" }}>
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
      )}
    </main>
  );
}