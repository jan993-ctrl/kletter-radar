"use client";

import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const GRADES = [
  "1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", 
  "4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", 
  "7a", "7b", "7c", "8a", "8b", "8c", "9a"
];

export default function RadarChart({ labels = [], dataSets = [] }) {
  const data = {
    labels,
    datasets: dataSets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 24, // Alles läuft jetzt einheitlich auf 24
        ticks: {
          display: false,
          stepSize: 4,
        },
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        angleLines: { color: "rgba(0, 0, 0, 0.1)" },
        pointLabels: {
          font: { size: 12, weight: "bold" },
          color: "#444",
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: { usePointStyle: true, boxWidth: 12 }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.raw;

            // Wenn es Stile sind, zeige den Grad (1a-9a)
            if (label.includes("Stile")) {
              return `${label}: ${GRADES[Math.round(value)] || "1a"}`;
            }
            // Wenn es Fähigkeiten sind, zeige das Level (0-24)
            return `${label}: Level ${value} / 24`;
          },
        },
      },
    },
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Radar data={data} options={options} />
    </div>
  );
}