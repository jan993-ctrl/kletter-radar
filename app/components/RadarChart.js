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
    maintainAspectRatio: false, // <- wichtig für responsive Charts
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 10,
        ticks: { stepSize: 1 },
      },
    },
    plugins: {
      legend: { position: "top" },
    },
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Radar data={data} options={options} />
    </div>
  );
}
