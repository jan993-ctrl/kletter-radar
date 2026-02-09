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
        min: 0, // Festes Minimum statt "suggested"
        max: 10, // Festes Maximum statt "suggested"
        ticks: { stepSize: 1 },
      },
    },
    plugins: {
      legend: { position: "top" },
    },
  };

  return (
    // Der wichtigste Teil: Ein Container mit festem Layout-Verhalten
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 0 }}>
      <Radar data={data} options={options} />
    </div>
  );
}