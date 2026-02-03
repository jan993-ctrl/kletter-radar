"use client";

console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0,10)+"...");

import { useEffect, useState } from "react";
import RadarChart from "@components/RadarChart";
import { supabaseBrowser } from "@lib/supabase-browser";


const abilityLabels = [
  "Kraft",
  "Beweglichkeit",
  "Mentalität",
  "Explosivität",
  "Körperspannung",
];

const styleLabels = ["Crimper", "Sloper", "Slab", "Dyno", "Pocket"];

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Listen to auth changes
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    // initial session
    supabaseBrowser.auth.getSession().then(({ data }) => setSession(data?.session ?? null));

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    // load profiles (public)
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((d) => {
        const arr = Array.isArray(d) ? d : [];
        setProfiles(arr);
        if (arr.length > 0) setSelectedId((prev) => prev ?? arr[0].id);
      })
      .catch((e) => {
        console.error("Failed to load profiles:", e);
        setProfiles([]);
      });
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
    if (error) {
      alert("Login failed: " + error.message);
    }
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
      if (!res.ok) {
        const msg = payload?.error || payload?.message || "Save failed";
        throw new Error(msg);
      }

      // payload expected to be updated list (or single object); handle both
      if (Array.isArray(payload)) {
        setProfiles(payload);
        const updated = payload.find((p) => p.id === selected.id);
        if (updated) setSelected({ ...updated });
      } else if (payload && payload.id) {
        // if server returns the saved profile
        setProfiles((prev) => {
          const idx = prev.findIndex((p) => p.id === payload.id);
          if (idx === -1) return [...prev, payload];
          const copy = [...prev];
          copy[idx] = payload;
          return copy;
        });
        setSelected({ ...payload });
      }

      alert("Saved");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Error saving: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleNew = () => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`;
    const newP = { id, name: "", notes: "", abilities: [0, 0, 0, 0, 0], styles: [0, 0, 0, 0, 0] };
    setProfiles((prev) => [...prev, newP]);
    setSelectedId(id);
    setSelected(newP);
  };

  // If not signed in, show login
  if (!session) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Admin Login</h1>
        <LoginForm onSubmit={signIn} />
        <p style={{ marginTop: 12 }}>
          Hinweis: Du musst in Supabase einen Admin-Benutzer anlegen (siehe Anleitung).
        </p>
      </main>
    );
  }

  // safe arrays to avoid undefined
  const safeAbilities = selected?.abilities ?? [0, 0, 0, 0, 0];
  const safeStyles = selected?.styles ?? [0, 0, 0, 0, 0];

  return (
    <main style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Admin</h1>
        <div>
          <button onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>
          Profil wählen:
          <select value={selectedId || ""} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="" disabled>
              -- wählen --
            </option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || "(neu)"}
              </option>
            ))}
          </select>
        </label>
        <button onClick={handleNew} style={{ marginLeft: 8 }}>
          Neues Profil
        </button>
      </div>

      {!selected ? (
        <p>Lade…</p>
      ) : (
        <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <label>
              Name:{" "}
              <input
                value={selected.name}
                onChange={(e) => setSelected((s) => ({ ...s, name: e.target.value }))}
              />
            </label>
            <br />
            <label>
              Notizen:{" "}
              <textarea
                value={selected.notes}
                onChange={(e) => setSelected((s) => ({ ...s, notes: e.target.value }))}
              />
            </label>

            <h3>Fähigkeiten</h3>
            {abilityLabels.map((lab, i) => (
              <div key={lab}>
                <label>
                  {lab}: {safeAbilities[i]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={safeAbilities[i]}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setSelected((s) => {
                      const a = [...(s.abilities ?? [0, 0, 0, 0, 0])];
                      a[i] = v;
                      return { ...s, abilities: a };
                    });
                  }}
                />
              </div>
            ))}

            <h3>Kletterstile</h3>
            {styleLabels.map((lab, i) => (
              <div key={lab}>
                <label>
                  {lab}: {safeStyles[i]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={safeStyles[i]}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setSelected((s) => {
                      const a = [...(s.styles ?? [0, 0, 0, 0, 0])];
                      a[i] = v;
                      return { ...s, styles: a };
                    });
                  }}
                />
              </div>
            ))}

            <div style={{ marginTop: 12 }}>
              <button onClick={handleSave} disabled={saving}>
                {saving ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>

          <div style={{ flex: "0 0 360px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ height: 300 }}>
              <RadarChart
                labels={abilityLabels}
                dataSets={[
                  {
                    label: "Fähigkeiten",
                    data: safeAbilities,
                    backgroundColor: "rgba(54,162,235,0.25)",
                    borderColor: "rgba(54,162,235,1)",
                  },
                ]}
              />
            </div>
            <div style={{ height: 300 }}>
              <RadarChart
                labels={styleLabels}
                dataSets={[
                  {
                    label: "Stile",
                    data: safeStyles,
                    backgroundColor: "rgba(255,159,64,0.25)",
                    borderColor: "rgba(255,159,64,1)",
                  },
                ]}
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email, pw);
      }}
    >
      <label>
        Email: <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <br />
      <label>
        Password: <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
      </label>
      <br />
      <button type="submit">Login</button>
    </form>
  );
}
