"use client";

import { useEffect, useRef } from "react";

// Fibonacci Sphere Punkt-Berechnung
function fibSphere(n, r) {
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y  = 1 - (i / (n - 1)) * 2;
    const rd = Math.sqrt(Math.max(0, 1 - y * y));
    const th = phi * i;
    pts.push({ x: Math.cos(th) * rd * r, y: y * r, z: Math.sin(th) * rd * r });
  }
  return pts;
}

export default function VisualGimmick({
  size = 200,
  className = "",
}) {
  const canvasRef  = useRef(null);
  const frameRef   = useRef(null);
  const stateRef   = useRef({ rotX: 0.28, rotY: 0 }); 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = size, H = size, cx = W / 2, cy = H / 2;

    // Radien angepasst auf die kleine Größe
    const R_OUTER = size * 0.35; 
    const R_MID   = R_OUTER * 0.6;
    const R_CORE  = R_OUTER * 0.3;

    const outerDots = fibSphere(400, R_OUTER); // Weniger Punkte für Performance bei kleiner Größe
    const midDots   = fibSphere(200, R_MID);
    const coreDots  = fibSphere(100, R_CORE);

    const pulses = [];

    function spawnPulse() {
      if (pulses.length > 5) return;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pulses.push({
        ox: Math.sin(ph) * Math.cos(th),
        oy: Math.cos(ph),
        oz: Math.sin(ph) * Math.sin(th),
        r: 0,
        speed: 0.012,
        maxR: 0.8,
        life: 1,
      });
    }

    const pulseTimer = setInterval(spawnPulse, 800);

    function rotate(p) {
      const { rotX, rotY } = stateRef.current;
      let x =  p.x * Math.cos(rotY) + p.z * Math.sin(rotY);
      let z = -p.x * Math.sin(rotY) + p.z * Math.cos(rotY);
      let y =  p.y;
      const y2 = y * Math.cos(rotX) - z * Math.sin(rotX);
      const z2 = y * Math.sin(rotX) + z * Math.cos(rotX);
      return { x, y: y2, z: z2 };
    }

    function pulseAt(nx, ny, nz) {
      let v = 0;
      for (const p of pulses) {
        const dot  = nx * p.ox + ny * p.oy + nz * p.oz;
        const ang  = Math.acos(Math.min(1, Math.max(-1, dot)));
        const diff = Math.abs(ang - p.r * 2);
        if (diff < 0.25) v += p.life * (1 - diff / 0.25) * 1.2;
      }
      return v;
    }

    function drawDot(rd, col, alpha, dotR) {
      const FOV = 500, ZO = size * 0.8;
      const sc  = FOV / (FOV + rd.z + ZO);
      const sx  = cx + rd.x * sc;
      const sy  = cy + rd.y * sc;
      const dr  = dotR * sc;

      ctx.globalAlpha = Math.min(1, alpha);
      ctx.fillStyle = `rgba(${col},${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.5, dr), 0, 6.28);
      ctx.fill();
    }

    function frame() {
      stateRef.current.rotX += 0.002;
      stateRef.current.rotY += 0.004;
      ctx.clearRect(0, 0, W, H);

      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].r += pulses[i].speed;
        pulses[i].life = Math.max(0, 1 - pulses[i].r / pulses[i].maxR);
        if (pulses[i].life <= 0) pulses.splice(i, 1);
      }

      const all = [];
      const addLayer = (dots, radius, baseR, colorFunc) => {
        for (const d of dots) {
          const rd = rotate(d);
          const nx = d.x / radius, ny = d.y / radius, nz = d.z / radius;
          const pe = pulseAt(nx, ny, nz);
          const dep = (rd.z + radius) / (2 * radius);
          const a = Math.min(1, 0.2 + 0.5 * dep + pe * 0.6);
          all.push({ rd, dotR: baseR, a, col: colorFunc(pe) });
        }
      };

      addLayer(outerDots, R_OUTER, 1.2, (pe) => `0, ${180 + pe * 75}, ${255}`);
      addLayer(midDots, R_MID, 1.5, (pe) => `100, ${200 + pe * 55}, 255`);
      addLayer(coreDots, R_CORE, 2, (pe) => `200, 230, 255`);

      all.sort((a, b) => a.rd.z - b.rd.z);
      for (const d of all) drawDot(d.rd, d.col, d.a, d.dotR);

      frameRef.current = requestAnimationFrame(frame);
    }

    frameRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameRef.current);
      clearInterval(pulseTimer);
    };
  }, [size]);

  return (
    <div className={className} style={{ position: "relative", width: size, height: size }}>
      {/* Hintergrund-Glow für Tiefe */}
      <div style={{
          position: "absolute",
          width: "140%",
          height: "140%",
          top: "-20%",
          left: "-20%",
          background: "radial-gradient(circle, rgba(0,150,255,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none"
      }} />
      <canvas ref={canvasRef} width={size} height={size} style={{ display: "block" }} />
    </div>
  );
}