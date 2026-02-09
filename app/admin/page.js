"use client";

import { useEffect, useState } from "react";
import RadarChart from "@components/RadarChart";
import { supabaseBrowser } from "@lib/supabase-browser";

const abilityLabels = ["Kraft", "Beweglichkeit", "Mentalität", "Explosivität", "Körperspannung"];
const styleLabels = ["Crimper", "Sloper", "Slab", "Dyno", "Pocket"];

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  // 1. Auth-Check
  useEffect(() => {
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    supabaseBrowser.auth.getSession().then(({ data }) => setSession(data?.session ?? null));
    return () => subscription?.unsubscribe?.();
  }, []);

  // 2. Profile laden
  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((d) => {
        const arr = Array.isArray(d) ? d : [];
        setProfiles(arr);
        if (arr.length > 0) setSelectedId((prev) => prev ?? arr[0].id);
      })
      .catch((e) => console.error("Failed to load profiles:", e));
  }, []);

  // 3. Auswahl synchronisieren
  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    const p = profiles.find((x) => x.id === selectedId);
    if (p) setSelected({ ...p });
  }, [selectedId, profiles]);

  const signIn = async (email, password) => {
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (error) alert("Login failed: " + error.message);
  };

  const signOut = async () => {
    await supabaseBrowser.auth.signOut();
    setSession(null);
  };

  // 4. Foto-Upload Logik
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selected) return;

    setSaving(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${selected.id}-${Date.now()}.${fileExt}`;
    const filePath = fileName; // Speichert direkt im Bucket "profiles"

    try {
      const { error: uploadError } = await supabaseBrowser.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabaseBrowser.storage.from('profiles').getPublicUrl(filePath);
      setSelected({ ...selected, image_url: data.publicUrl });
      alert("Bild erfolgreich hochgeladen! Jetzt noch 'Speichern' klicken.");
    } catch (err) {
      alert("Upload-Fehler: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 5. Daten speichern
  const handleSave = async () => {
    if (!selected) return alert("Kein Profil ausgewählt");
    setSaving(true);
    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(selected),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Save failed");
      }

      alert("Gespeichert!");
      window.location.reload(); 
    } catch (err) {
      alert("Fehler beim Speichern: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id || !confirm("Willst du dieses Profil wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/profiles?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Gelöscht!");
        window.location.reload();
      }
    } catch (error) {
      alert("Fehler: " + error.message);
    }
  };

  const handleNew = () => {
    const id = crypto.randomUUID();
    const newP = { id, name: "", notes: "", abilities: [0, 0, 0, 0, 0], styles: [0, 0, 0, 0, 0], image_url: "" };
    setProfiles((prev) => [...prev, newP]);
    setSelectedId(id);
    setSelected(newP);
  };

  if (!session) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Admin Login</h1>
        <LoginForm onSubmit={signIn} />
      </main>
    );
  }

  const safeAbilities = selected?.abilities ?? [0, 0, 0, 0, 0];
  const safeStyles = selected?.styles ?? [0, 0, 0, 0, 0];

  return (
    <main style={{ padding: 20, maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc", paddingBottom: 10 }}>
        <h1>Admin Panel</h1>
        <div>
          <button onClick={() => window.location.href = "/"} style={{ marginRight: 10, padding: "5px 10px", cursor: "pointer" }}>← Zur Website</button>
          <button onClick={signOut} style={{ padding: "5px 10px", cursor: "pointer", backgroundColor: "#eee", border: "1px solid #ccc" }}>Abmelden</button>
        </div>
      </div>

      <div style={{ marginTop: 20, backgroundColor: "#f4f4f4", padding: 15, borderRadius: 8 }}>
        <label><strong>Profil wählen:</strong> </label>
        <select value={selectedId || ""} onChange={(e) => setSelectedId(e.target.value)} style={{ padding: 5 }}>
          <option value="" disabled>-- wählen --</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name || "(Unbenannt)"}</option>
          ))}
        </select>
        <button onClick={handleNew} style={{ marginLeft: 10, padding: "5px 10px", cursor: "pointer", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: 4 }}>+ Neues Profil</button>
      </div>

      {!selected ? (
        <p style={{ marginTop: 40, textAlign: "center", color: "#666" }}>Bitte ein Profil auswählen oder neu erstellen.</p>
      ) : (
        <div style={{ display: "flex", gap: 40, marginTop: 30, flexWrap: "wrap" }}>
          
          {/* Formular-Spalte */}
          <div style={{ flex: "1 1 400px" }}>
            <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: 5 }}>Name:</label>
                <input
                  style={{ width: '100%', padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
                  value={selected.name}
                  onChange={(e) => setSelected((s) => ({ ...s, name: e.target.value }))}
                />
            </div>

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: 5 }}>Notizen:</label>
                <textarea
                  style={{ width: '100%', height: 80, padding: 10, borderRadius: 4, border: "1px solid #ccc" }}
                  value={selected.notes}
                  onChange={(e) => setSelected((s) => ({ ...s, notes: e.target.value }))}
                />
            </div>

            <div style={{ backgroundColor: "#fff", padding: 15, borderRadius: 8, border: "1px solid #ddd", marginBottom: 25 }}>
              <h3 style={{ marginTop: 0 }}>Profilfoto</h3>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={saving} />
              {selected.image_url && (
                <div style={{ marginTop: 15 }}>
                  <img src={selected.image_url} alt="Vorschau" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: "2px solid #ddd" }} />
                </div>
              )}
            </div>

            <h3>Fähigkeiten</h3>
            {abilityLabels.map((lab, i) => (
              <div key={lab} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span>{lab}</span>
                    <span style={{ fontWeight: "bold" }}>{safeAbilities[i]}</span>
                </div>
                <input type="range" min="0" max="10" step="1" style={{ width: "100%" }}
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

            <h3>Stile</h3>
            {styleLabels.map((lab, i) => (
              <div key={lab} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span>{lab}</span>
                    <span style={{ fontWeight: "bold" }}>{safeStyles[i]}</span>
                </div>
                <input type="range" min="0" max="10" step="1" style={{ width: "100%" }}
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
                {saving ? "Wird verarbeitet..." : "Profil & Foto Speichern"}
              </button>
              
              <button 
                onClick={() => handleDelete(selected.id)}
                style={{ backgroundColor: 'white', color: '#dc3545', padding: '15px 20px', border: '1px solid #dc3545', borderRadius: 6, cursor: 'pointer', fontWeight: "bold" }}
              >
                Löschen
              </button>
            </div>
          </div>

          {/* Diagramm-Spalte */}
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
                        backgroundColor: "rgba(255,159,64,0.2)",
                        borderColor: "rgba(255,159,64,1)"
                    }]} 
                />
              </div>
          </div>

        </div>
      )}
    </main>
  );
}

function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, pw); }} style={{ maxWidth: 300, display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 10, borderRadius: 4, border: "1px solid #ccc" }} />
      <input placeholder="Passwort" type="password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ padding: 10, borderRadius: 4, border: "1px solid #ccc" }} />
      <button type="submit" style={{ padding: 12, backgroundColor: "#007bff", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}>Login</button>
    </form>
  );
}