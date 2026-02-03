"use client";

import { useState } from "react";
import RadarChart from "./RadarChart";
import CombinedRadar from "./CombinedRadar";



const abilityLabels = ["Kraft","Beweglichkeit","Mentalität","Explosivität","Körperspannung"];
const styleLabels   = ["Crimper","Sloper","Slab","Dyno","Pocket"];

export default function ProfilesViewer({ initialProfiles = [] }) {
  const [selectedId, setSelectedId] = useState(initialProfiles[0]?.id || null);

  const selected = initialProfiles.find((p) => p.id === selectedId) || {
    abilities: [0,0,0,0,0],
    styles: [0,0,0,0,0],
    name: "",
    notes: ""
  };

  return (
    <div>
      {/* Profilauswahl */}
      <div style={{ margin: "16px 0" }}>
        <label>Profil wählen: </label>
        <select
          value={selectedId || ""}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {initialProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || "(Neues Profil)"}
            </option>
          ))}
        </select>
      </div>

      {/* Überlagerte Ansicht (responsive) */}
      <section
        style={{
          marginTop: 20,
          maxWidth: 600,
          marginLeft: "auto",
          marginRight: "auto",
          height: 320, // Containerhöhe, Chart passt sich an
        }}
      >
        <CombinedRadar
          abilities={selected.abilities}
          styles={selected.styles}
        />
      </section>

      {/* Einzel-Radare (responsive) */}
      <section
        style={{
          display: "flex",
          gap: 24,
          marginTop: 24,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: 400, maxWidth: 320, height: 280 }}>
          <RadarChart
            labels={abilityLabels}
            dataSets={[
              {
                label: "Fähigkeiten", // fixe Legende
                data: selected.abilities,
                backgroundColor: "rgba(54,162,235,0.3)",
                borderColor: "rgba(54,162,235,1)",
              },
            ]}
          />
        </div>

        <div style={{ flex: 1, minWidth: 280, maxWidth: 320, height: 280 }}>
          <RadarChart
            labels={styleLabels}
            dataSets={[
              {
                label: "Stile", // fixe Legende
                data: selected.styles,
                backgroundColor: "rgba(255,159,64,0.3)",
                borderColor: "rgba(255,159,64,1)",
              },
            ]}
          />
        </div>
      </section>

      {/* Notizen */}
      <section style={{ marginTop: 20 }}>
        <p>{selected.notes || "—"}</p>
      </section>
    </div>
  );
}
