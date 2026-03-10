"use client";

import { useState } from "react";
import RadarChart from "../charts/RadarChart";
import CombinedRadar from "../charts/CombinedRadar";



const abilityLabels = ["Kraft","Beweglichkeit","Mentalität","Explosivität","Körperspannung"];
const styleLabels   = ["Crimper","Sloper","Slab","Dyno","Pocket"];

export default function ProfilesViewer({ initialProfiles = [] }) {
  const [selectedId, setSelectedId] = useState(initialProfiles[0]?.id || null);

  const selected = initialProfiles.find((p) => p.id === selectedId) || {
    abilities: normalizeAbilities(),
    styles: normalizeStyles(),
    name: "",
    notes: "",
  };

  return (
    <div>
      <div style={{ margin: "16px 0" }}>
        <label>Profil wählen: </label>
        <select value={selectedId || ""} onChange={(e) => setSelectedId(e.target.value)}>
          {initialProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || "(Neues Profil)"}
            </option>
          ))}
        </select>
      </div>

      <section
        style={{
          marginTop: 20,
          maxWidth: 600,
          marginLeft: "auto",
          marginRight: "auto",
          height: 320,
        }}
      >
        <CombinedRadar abilities={normalizeAbilities(selected.abilities)} styles={normalizeStyles(selected.styles)} />
      </section>

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
            labels={ABILITY_LABELS}
            dataSets={[
              {
                label: "Fähigkeiten",
                data: normalizeAbilities(selected.abilities),
                backgroundColor: "rgba(54,162,235,0.3)",
                borderColor: "rgba(54,162,235,1)",
              },
            ]}
          />
        </div>

        <div style={{ flex: 1, minWidth: 280, maxWidth: 320, height: 280 }}>
          <RadarChart
            labels={STYLE_LABELS}
            dataSets={[
              {
                label: "Stile",
                data: normalizeStyles(selected.styles),
                backgroundColor: "rgba(255,159,64,0.3)",
                borderColor: "rgba(255,159,64,1)",
              },
            ]}
          />
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <p>{selected.notes || "—"}</p>
      </section>
    </div>
  );
}
