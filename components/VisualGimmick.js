"use client";
import { useEffect, useRef, useState } from "react";

const tasks = [
  "SYSTEM_READY",
  "NEURAL_LINK_STABLE",
  "CORE_TEMP_OPTIMAL",
  "DATA_STREAM_ACTIVE",
];

export default function VisualGimmick() {
  const canvasRef = useRef(null);
  const [currentTask, setCurrentTask] = useState(tasks[0]);

  useEffect(() => {
    const taskInterval = setInterval(() => {
      setCurrentTask(tasks[Math.floor(Math.random() * tasks.length)]);
    }, 6000);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = 800, H = 800, cx = 400, cy = 400;

    function fibSphere(n, r) {
      const pts = [], phi = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;
        const rd = Math.sqrt(Math.max(0, 1 - y * y));
        const th = phi * i;
        pts.push({ x: Math.cos(th) * rd * r, y: y * r, z: Math.sin(th) * rd * r });
      }
      return pts;
    }

    const R_OUTER = 280;
    const outerDots = fibSphere(500, R_OUTER); 
    const coreDots = fibSphere(150, R_OUTER * 0.3);

    let pulses = [];
    const spawnPulse = () => {
      pulses.push({
        ox: Math.sin(Math.acos(2 * Math.random() - 1)) * Math.cos(Math.random() * Math.PI * 2),
        oy: Math.cos(Math.acos(2 * Math.random() - 1)),
        oz: Math.sin(Math.acos(2 * Math.random() - 1)) * Math.sin(Math.random() * Math.PI * 2),
        r: 0, speed: 0.006, maxR: 0.8, life: 1,
      });
    };
    const pulseInterval = setInterval(spawnPulse, 2000);

    let rotX = 0.5, rotY = 0;
    let animationFrameId;

    const render = () => {
      rotX += 0.0005; 
      rotY += 0.0012;
      ctx.clearRect(0, 0, W, H);

      pulses.forEach(p => {
        p.r += p.speed;
        p.life = Math.max(0, 1 - p.r / p.maxR);
      });
      pulses = pulses.filter(p => p.life > 0);

      const all = [];
      [...outerDots, ...coreDots].forEach(d => {
        let x = d.x * Math.cos(rotY) + d.z * Math.sin(rotY);
        let z = -d.x * Math.sin(rotY) + d.z * Math.cos(rotY);
        let y2 = d.y * Math.cos(rotX) - z * Math.sin(rotX);
        let z2 = d.y * Math.sin(rotX) + z * Math.cos(rotX);
        
        const dep = (z2 + R_OUTER) / (2 * R_OUTER);
        all.push({ 
            sx: cx + x * (720 / (720 + z2 + 620)), 
            sy: cy + y2 * (720 / (720 + z2 + 620)), 
            z: z2, 
            a: (0.05 + 0.25 * dep) 
        });
      });

      all.sort((a, b) => a.z - b.z).forEach(p => {
        // Ein dezentes Slate-Blue statt knalligem Cyan
        ctx.fillStyle = `rgba(100, 180, 220, ${p.a})`;
        ctx.beginPath(); 
        ctx.arc(p.sx, p.sy, 1.1, 0, 7); 
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      clearInterval(taskInterval);
      clearInterval(pulseInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={containerStyle}>
      <canvas ref={canvasRef} width={800} height={800} style={canvasStyle} />
      <div style={statusStyle}>{currentTask}</div>
    </div>
  );
}

const containerStyle = {
  position: "fixed",
  bottom: "-80px",
  right: "-80px",
  width: "450px",
  height: "450px",
  pointerEvents: "none",
  zIndex: 0,
  opacity: 0.5,
};

const canvasStyle = {
  width: "100%",
  height: "100%",
};

const statusStyle = {
  position: "absolute",
  bottom: "25%",
  left: "50%",
  transform: "translateX(-50%)",
  fontFamily: "monospace",
  fontSize: "9px",
  letterSpacing: "0.4em",
  color: "rgba(100, 180, 220, 0.4)",
  textTransform: "uppercase",
};