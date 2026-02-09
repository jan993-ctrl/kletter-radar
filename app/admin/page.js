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

  useEffect(() => {
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    supabaseBrowser.auth.getSession().then(({ data }) => setSession(data?.session ?? null));
    return () => subscription?.unsubscribe?.();
  }, []);

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

  const handleSave = async () => {
    if (!selected) return alert("No profile");
    setSaving(true);
    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("No access token (not signed in)");

      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(selected),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Save failed");

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
      } else {
        const err = await res.json();
        alert("Fehler: " + err.error);
      }
    } catch (error) {
      alert("Fehler: " + error.message);
    }
  };

  const handleNew = () => {
    const id = crypto.randomUUID();
    const newP = { id, name: "", notes: "", abilities: [0, 0, 0, 0, 0], styles: [0, 0, 0, 0, 0] };
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
    <main style={{ padding: 20, maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc", paddingBottom: 10 }}>
        <h1>Admin Panel</h1>
        <button onClick={signOut} style={{ padding: "5px 10px", cursor: "pointer" }}>Abmelden</button>
      </div>

      <div style={{ marginTop: 20, backgroundColor: "#f4f4f4", padding: 15, borderRadius: 8 }}>
        <label><strong>Profil wählen:</strong> </label>
        <select value={selectedId || ""} onChange={(e) => setSelectedId(e.target.value)} style={{ padding: 5 }}>
          <option value="" disabled>-- wählen --</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name || "(Unbenannt)"}</option>
          ))}
        </select>
        <button onClick={handleNew} style={{ marginLeft: 10, padding: "5px 10px", cursor: "pointer" }}>+ Neues Profil</button>
      </div>

      {!selected ? (
        <p style={{ marginTop: 20, textAlign: "center" }}>Bitte ein Profil auswählen oder neu erstellen.</p>
      ) : (
        <div style={{ display: "flex", gap: 40, marginTop: 20, flexWrap: "wrap" }}>
          
          {/* Linke Seite: Formular */}
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ marginBottom: 15 }}>
                <label style={{ display: "block", fontWeight: "bold" }}>Name:</label>
                <input
                style={{ width: '100%', padding: 8, boxSizing: "border-box" }}
                value={selected.name}
                onChange={(e) => setSelected((s) => ({ ...s, name: e.target.value }))}
                />
            </div>

            <div style={{ marginBottom: 15 }}>
                <label style={{ display: "block", fontWeight: "bold" }}>Notizen:</label>
                <textarea
                style={{ width: '100%', height: 80, padding: 8, boxSizing: "border-box" }}
                value={selected.notes}
                onChange={(e) => setSelected((s) => ({ ...s, notes: e.target.value }))}
                />
            </div>

            <h3>Fähigkeiten</h3>
            {abilityLabels.map((lab, i) => (
              <div key={lab} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{lab}</span>
                    <span>{safeAbilities[i]}</span>
                </div>
                <input type="range" min="0" max="10" step="1" style={{ width: "100%" }}
                  value={safeAbilities[i]}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setSelected(s => {
                      const a = [...s.abilities];
                      a[i] = v;
                      return { ...s, abilities: a };
                    });
                  }}
                />
              </div>
            ))}

            <h3>Stile</h3>
            {styleLabels.map((lab, i) => (
              <div key={lab} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{lab}</span>
                    <span>{safeStyles[i]}</span>
                </div>
                <input type="range" min="0" max="10" step="1" style={{ width: "100%" }}
                  value={safeStyles[i]}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setSelected(s => {
                      const a = [...s.styles];
                      a[i] = v;
                      return { ...s, styles: a };
                    });
                  }}
                />
              </div>
            ))}

            <div style={{ marginTop: 30, display: 'flex', gap: 15, paddingBottom: 50 }}>
              <button 
                onClick={handleSave} 
                disabled={saving}
                style={{ backgroundColor: '#4CAF50', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 6, cursor: 'pointer', flex: 1, fontWeight: "bold" }}
              >
                {saving ? "Speichert..." : "Speichern"}
              </button>
              
              <button 
                onClick={() => handleDelete(selected.id)}
                style={{ backgroundColor: 'transparent', color: '#f44336', padding: '12px 24px', border: '1px solid #f44336', borderRadius: 6, cursor: 'pointer', fontWeight: "bold" }}
              >
                Löschen
              </button>
            </div>
          </div>

          {/* Rechte Seite: Diagramme - Hier liegt die Lösung für den Error */}
          <div style={{ flex: "0 0 400px", display: "flex", flexDirection: "column", gap: 30 }}>
              {/* Jedes Chart bekommt einen Container mit fester Höhe und Breite */}
              <div style={{ position: "relative", width: "400px", height: "350px", overflow: "hidden", border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
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

              <div style={{ position: "relative", width: "400px", height: "350px", overflow: "hidden", border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
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
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, pw); }} style={{ maxWidth: 300, display: "flex", flexDirection: "column", gap: 10 }}>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 8 }} />
      <input placeholder="Passwort" type="password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ padding: 8 }} />
      <button type="submit" style={{ padding: 10, backgroundColor: "#007bff", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>Login</button>
    </form>
  );
}