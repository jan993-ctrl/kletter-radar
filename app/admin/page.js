"use client";

import { useEffect, useState } from "react";
import RadarChart from "../components/RadarChart";

const abilityLabels = [
  "Kraft",
  "Beweglichkeit",
  "Mentalität",
  "Explosivität",
  "Körperspannung",
];

const styleLabels = ["Crimper", "Sloper", "Slab", "Dyno", "Pocket"];

export default function AdminPage() {
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  // Lade Profile vom API
  useEffect(() => {
    fetch("/api/profiles")
      .then((res) => res.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setProfiles(arr);
        if (arr.length > 0) setSelectedId(arr[0].id);
      })
      .catch((err) => {
        console.error(err);
        setProfiles([]);
      });
  }, []);

  // Aktuelles Profil anhand ID
  useEffect(() => {
    if (!selectedId) return;
    const prof = profiles.find((p) => p.id === selectedId);
    if (prof) {
      setSelected({
        ...prof,
        name: prof.name || "",
        notes: prof.notes || "",
        abilities: prof.abilities || [0, 0, 0, 0, 0],
        styles: prof.styles || [0, 0, 0, 0, 0],
      });
    }
  }, [selectedId, profiles]);

  // Slider-Handler für abilities
  const handleAbilityChange = (i, value) => {
    setSelected((prev) => {
      const newAbilities = [...prev.abilities];
      newAbilities[i] = value;
      return { ...prev, abilities: newAbilities };
    });
  };

  // Slider-Handler für styles
  const handleStyleChange = (i, value) => {
    setSelected((prev) => {
      const newStyles = [...prev.styles];
      newStyles[i] = value;
      return { ...prev, styles: newStyles };
    });
  };

  // Profil speichern
  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });
      if (!res.ok) throw new Error("Save failed");
      const updatedProfiles = await res.json();
      setProfiles(Array.isArray(updatedProfiles) ? updatedProfiles : []);
      alert("Profil gespeichert!");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern");
    }
    setSaving(false);
  };

  // Neues Profil erstellen
  const handleNewProfile = () => {
    const newProfile = {
      id: crypto.randomUUID(),
      name: "",
      notes: "",
      abilities: [0, 0, 0, 0, 0],
      styles: [0, 0, 0, 0, 0],
    };
    setProfiles((prev) => [...prev, newProfile]);
    setSelectedId(newProfile.id);
  };

  if (!selected) return <p style={{ padding: 20 }}>Lade Profil…</p>;

  const profilesList = Array.isArray(profiles) ? profiles : [];

  return (
    <main style={{ padding: 20 }}>
      <h1>Admin: Kletterprofile bearbeiten</h1>

      {/* Profilwahl */}
      <div style={{ margin: "16px 0" }}>
        <label>Profil wählen: </label>
        <select
          value={selectedId || ""}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {profilesList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || "(Neues Profil)"}
            </option>
          ))}
        </select>
        <button onClick={handleNewProfile} style={{ marginLeft: 10 }}>
          Neues Profil
        </button>
      </div>

      {/* Hauptbereich: Slider links, Charts rechts */}
      <div
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
{/* Linke Spalte: Slider */}
<div
  style={{
    flex: 1,
    minWidth: 280,
    padding: "16px 24px", // rechts ein bisschen Abstand
    marginTop: "1px",    // nach unten verschoben
  }}
>
  {/* Name & Notizen */}
  <div style={{ marginBottom: 20 }}>
    <label>
      Name:{" "}
      <input
        type="text"
        value={selected.name || ""}
        onChange={(e) =>
          setSelected((prev) => ({ ...prev, name: e.target.value }))
        }
      />
    </label>
    <br />
    <label>
      Notizen:{" "}
      <textarea
        rows={3}
        cols={40}
        value={selected.notes || ""}
        onChange={(e) =>
          setSelected((prev) => ({ ...prev, notes: e.target.value }))
        }
      />
    </label>
  </div>

  {/* Abilities */}
  <section style={{ marginBottom: 20 }}>
    <h3>Fähigkeiten</h3>
    {abilityLabels.map((lab, i) => (
      <div key={lab} style={{ marginBottom: 8 }}>
        <label>
          {lab}: {selected.abilities?.[i] ?? 0}
        </label>
        <input
          type="range"
          min="0"
          max="10"
          value={selected.abilities?.[i] ?? 0}
          onChange={(e) =>
            handleAbilityChange(i, parseInt(e.target.value))
          }
        />
      </div>
    ))}
  </section>

  {/* Styles */}
  <section style={{ marginBottom: 20 }}>
    <h3>Kletterstile</h3>
    {styleLabels.map((lab, i) => (
      <div key={lab} style={{ marginBottom: 8 }}>
        <label>
          {lab}: {selected.styles?.[i] ?? 0}
        </label>
        <input
          type="range"
          min="0"
          max="10"
          value={selected.styles?.[i] ?? 0}
          onChange={(e) =>
            handleStyleChange(i, parseInt(e.target.value))
          }
        />
      </div>
    ))}
  </section>

  <button onClick={handleSave} disabled={saving}>
    {saving ? "Speichern…" : "Speichern"}
  </button>
</div>


        {/* Rechte Spalte: Charts */}
        <div
  style={{
    flex: "0 0 380px", // etwas breiter
    display: "flex",
    flexDirection: "column",
    gap: 24,
  }}
>
  {/* Einzelchart: Abilities */}
  <div style={{ height: 300 }}> {/* Höhe erhöht */}
    <RadarChart
      labels={abilityLabels}
      dataSets={[
        {
          label: "Fähigkeiten",
          data: selected.abilities,
          backgroundColor: "rgba(54,162,235,0.25)",
          borderColor: "rgba(54,162,235,1)",
        },
      ]}
    />
  </div>

  {/* Einzelchart: Styles */}
  <div style={{ height: 300 }}> {/* Höhe erhöht */}
    <RadarChart
      labels={styleLabels}
      dataSets={[
        {
          label: "Stile",
          data: selected.styles,
          backgroundColor: "rgba(255,159,64,0.25)",
          borderColor: "rgba(255,159,64,1)",
        },
      ]}
    />
  </div>
</div>
      </div>
    </main>
  );
}
