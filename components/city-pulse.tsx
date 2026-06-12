'use client';

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Pulse {
  from: Node;
  to: Node;
  progress: number;
  speed: number;
}

const LINK_DISTANCE = 130;
const MOUSE_RADIUS = 180;

/**
 * Animated "electric city map" background: drifting intersection dots linked
 * into a street grid, brightening and bending toward the cursor, with light
 * pulses traveling along nearby connections. Pure canvas, no dependencies;
 * honors prefers-reduced-motion by rendering a static frame.
 */
export function CityPulse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mouse = { x: -9999, y: -9999 };
    let nodes: Node[] = [];
    let pulses: Pulse[] = [];
    let frame = 0;
    let running = true;

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(130, Math.floor((window.innerWidth * window.innerHeight) / 14000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));
      pulses = [];
    }

    function spawnPulse() {
      // Prefer edges near the cursor so the "electricity" follows the user.
      for (let attempt = 0; attempt < 8; attempt++) {
        const from = nodes[Math.floor(Math.random() * nodes.length)];
        if (!from) return;
        const near = nodes.filter(
          (n) => n !== from && Math.hypot(n.x - from.x, n.y - from.y) < LINK_DISTANCE,
        );
        const to = near[Math.floor(Math.random() * near.length)];
        if (!to) continue;
        const towardMouse =
          Math.hypot(from.x - mouse.x, from.y - mouse.y) < MOUSE_RADIUS * 1.5 || attempt > 4;
        if (towardMouse) {
          pulses.push({ from, to, progress: 0, speed: 0.02 + Math.random() * 0.03 });
          return;
        }
      }
    }

    function draw() {
      if (!canvas || !ctx) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      frame++;

      for (const node of nodes) {
        if (!reducedMotion) {
          node.x += node.vx;
          node.y += node.vy;
          // Cursor gravity: intersections lean gently toward the mouse.
          const dm = Math.hypot(node.x - mouse.x, node.y - mouse.y);
          if (dm < MOUSE_RADIUS && dm > 1) {
            node.x += ((mouse.x - node.x) / dm) * 0.35;
            node.y += ((mouse.y - node.y) / dm) * 0.35;
          }
          if (node.x < 0 || node.x > w) node.vx *= -1;
          if (node.y < 0 || node.y > h) node.vy *= -1;
        }
      }

      // Streets: links between nearby intersections, brighter near the cursor.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > LINK_DISTANCE) continue;
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const mouseBoost = Math.max(
            0,
            1 - Math.hypot(midX - mouse.x, midY - mouse.y) / MOUSE_RADIUS,
          );
          const alpha = (1 - d / LINK_DISTANCE) * (0.1 + mouseBoost * 0.45);
          ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
          ctx.lineWidth = 1 + mouseBoost;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const node of nodes) {
        const dm = Math.hypot(node.x - mouse.x, node.y - mouse.y);
        const glow = Math.max(0, 1 - dm / MOUSE_RADIUS);
        ctx.fillStyle = `rgba(5, 150, 105, ${0.3 + glow * 0.6})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.6 + glow * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducedMotion) {
        if (frame % 24 === 0 && pulses.length < 14) spawnPulse();
        pulses = pulses.filter((p) => p.progress <= 1);
        for (const p of pulses) {
          p.progress += p.speed;
          const x = p.from.x + (p.to.x - p.from.x) * p.progress;
          const y = p.from.y + (p.to.y - p.from.y) * p.progress;
          ctx.save();
          ctx.shadowColor = 'rgba(16, 185, 129, 0.9)';
          ctx.shadowBlur = 8;
          ctx.fillStyle = 'rgba(52, 211, 153, 0.95)';
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (running && !reducedMotion) requestAnimationFrame(draw);
    }

    function onMove(event: MouseEvent) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    }
    function onLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }
    function onVisibility() {
      running = !document.hidden;
      if (running && !reducedMotion) requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseout', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      running = false;
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
