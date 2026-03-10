"use client";

import RadarChart from "./RadarChart";
import {
  ABILITY_COUNT,
  ABILITY_LABELS,
  STYLE_COUNT,
  STYLE_LABELS,
} from "@/lib/utils/profile-schema";

export default function CombinedRadar({
  abilities = [],
  styles = [],
  height = 360,
  width = 360,
}) {
  if (!Array.isArray(abilities) || abilities.length !== ABILITY_COUNT) {
    throw new Error(`CombinedRadar erwartet abilities mit exakt ${ABILITY_COUNT} Werten.`);
  }

  if (!Array.isArray(styles) || styles.length !== STYLE_COUNT) {
    throw new Error(`CombinedRadar erwartet styles mit exakt ${STYLE_COUNT} Werten.`);
  }

  const labels = [...ABILITY_LABELS, ...STYLE_LABELS];

  const datasets = [
    {
      label: "Fähigkeiten",
      data: [...abilities, ...Array(STYLE_COUNT).fill(null)],
      backgroundColor: "rgba(54,162,235,0.25)",
      borderColor: "rgba(54,162,235,1)",
      pointBackgroundColor: "rgba(54,162,235,1)",
      borderWidth: 2,
    },
    {
      label: "Stile",
      data: [...Array(ABILITY_COUNT).fill(null), ...styles],
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
