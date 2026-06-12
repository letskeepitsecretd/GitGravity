"use client";

import React, { useEffect, useRef } from "react";

interface FlickeringGlowGridProps {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  maxOpacity?: number;
  color?: string; // hex color e.g., "#39d353" (green)
  glowColor?: string; // rgb color for glow e.g., "57, 211, 83"
}

export function FlickeringGlowGrid({
  squareSize = 14,
  gridGap = 6,
  flickerChance = 0.003,
  maxOpacity = 0.4,
  color = "#39d353",
  glowColor = "57, 211, 83"
}: FlickeringGlowGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const step = squareSize + gridGap;
    let cols = Math.floor(width / step) + 1;
    let rows = Math.floor(height / step) + 1;

    interface Cell {
      opacity: number;
      targetOpacity: number;
      speed: number;
    }

    let cells: Cell[] = [];
    const initCells = () => {
      cells = [];
      for (let i = 0; i < cols * rows; i++) {
        const initialOpacity = Math.random() * maxOpacity * 0.15;
        cells.push({
          opacity: initialOpacity,
          targetOpacity: initialOpacity,
          speed: 0.008 + Math.random() * 0.015,
        });
      }
    };
    initCells();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cols = Math.floor(width / step) + 1;
      rows = Math.floor(height / step) + 1;
      initCells();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Convert hex to rgb helper
    const hexToRgb = (hexStr: string) => {
      const hex = hexStr.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    };
    const rgbBase = hexToRgb(color);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw grid squares
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (idx >= cells.length) continue;

          const cell = cells[idx];

          // Randomly trigger flickering
          if (Math.random() < flickerChance) {
            cell.targetOpacity = Math.random() * maxOpacity;
          }

          // Interpolate opacity
          cell.opacity += (cell.targetOpacity - cell.opacity) * cell.speed;

          if (Math.abs(cell.opacity - cell.targetOpacity) < 0.01) {
            cell.targetOpacity = Math.random() * maxOpacity * 0.15;
          }

          const x = c * step;
          const y = r * step;

          // Spotlight check
          const dx = x + squareSize / 2 - mouseRef.current.x;
          const dy = y + squareSize / 2 - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let hoverGlow = 0;
          const maxDist = 200;
          if (dist < maxDist) {
            hoverGlow = (1 - dist / maxDist) * 0.5;
          }

          const drawOpacity = Math.min(maxOpacity + hoverGlow, cell.opacity + hoverGlow);

          ctx.fillStyle = `rgba(${rgbBase}, ${drawOpacity})`;
          ctx.fillRect(x, y, squareSize, squareSize);
        }
      }

      // 2. Draw ambient radial glow following mouse
      if (mouseRef.current.x > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const gradient = ctx.createRadialGradient(
          mouseRef.current.x,
          mouseRef.current.y,
          0,
          mouseRef.current.x,
          mouseRef.current.y,
          250
        );
        gradient.addColorStop(0, `rgba(${glowColor}, 0.22)`);
        gradient.addColorStop(0.5, `rgba(${glowColor}, 0.08)`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, [squareSize, gridGap, flickerChance, maxOpacity, color, glowColor]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full block bg-[#0d1117] pointer-events-none z-0"
    />
  );
}
