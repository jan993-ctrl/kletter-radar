"use client";

import RadarChart from "./RadarChart";

const abilityLabels = [
  "Kraft",
  "Beweglichkeit",
  "Mentalität",
  "Explosivität",
  "Körperspannung",
];

const styleLabels = [
  "Crimper",
  "Sloper",
  "Slab",
  "Dyno",
  "Pocket",
];

export default function CombinedRadar({
  abilities = [0, 0, 0, 0, 0],
  styles = [0, 0, 0, 0, 0],

  // 🔹 deutlich größer
  height = 360,
  width = 360,
}) {
  const labels = [...abilityLabels, ...styleLabels];

  const abilitiesFull = [
    ...abilities,
    ...Array(styleLabels.length).fill(0),
  ];

  const stylesFull = [
    ...Array(abilityLabels.length).fill(0),
    ...styles,
  ];

  const datasets = [
    {
      label: "Fähigkeiten",
      data: abilitiesFull,
      backgroundColor: "rgba(54,162,235,0.25)",
      borderColor: "rgba(54,162,235,1)",
      pointBackgroundColor: "rgba(54,162,235,1)",
      borderWidth: 2,
    },
    {
      label: "Stile",
      data: stylesFull,
      backgroundColor: "rgba(255,159,64,0.25)",
      borderColor: "rgba(255,159,64,1)",
      pointBackgroundColor: "rgba(255,159,64,1)",
      borderWidth: 2,
    },
  ];

  return (
    <RadarChart
      labels={labels}
      dataSets={datasets}
      height={height}
      width={width}
    />
  );
}
