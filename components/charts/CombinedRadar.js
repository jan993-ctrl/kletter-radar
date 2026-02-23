"use client";

import RadarChart from "./RadarChart";

const abilityLabels = ["Kraft", "Beweglichkeit", "Mentalität", "Explosivität", "Körperspannung"];
const styleLabels = ["Crimper", "Sloper", "Slab", "Dyno", "Pocket"];

export default function CombinedRadar({
  abilities = [],
  styles = [],
  height = 360,
  width = 360,
}) {
  // Sicherstellen, dass wir immer 5 Werte haben, falls das Profil unvollständig ist
  const safeAbilities = abilities.length === 5 ? abilities : [0, 0, 0, 0, 0];
  const safeStyles = styles.length === 5 ? styles : [0, 0, 0, 0, 0];

  const labels = [...abilityLabels, ...styleLabels];

  const datasets = [
    {
      label: "Fähigkeiten",
      // Erste 5 Werte sind Fähigkeiten, die restlichen 5 (Stile) werden mit 0 gefüllt
      data: [...safeAbilities, 0, 0, 0, 0, 0],
      backgroundColor: "rgba(54,162,235,0.25)",
      borderColor: "rgba(54,162,235,1)",
      pointBackgroundColor: "rgba(54,162,235,1)",
      borderWidth: 2,
    },
    {
      label: "Stile",
      // Erste 5 Werte (Fähigkeiten) werden mit 0 gefüllt, die restlichen 5 sind Stile
      data: [0, 0, 0, 0, 0, ...safeStyles],
      backgroundColor: "rgba(40,167,69,0.25)",
      borderColor: "rgba(40,167,69,1)",
      pointBackgroundColor: "rgba(40,167,69,1)",
      borderWidth: 2,
    },
  ];

  return (
    <div style={{ width, height, margin: "0 auto" }}>
      <RadarChart labels={labels} dataSets={datasets} />
    </div>
  );
}