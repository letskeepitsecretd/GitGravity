"use client";

import React, { useEffect, useRef, useCallback } from "react";
import Matter from "matter-js";

interface PhysicsOverlayProps {
  /** Labels to spawn as floating physics bodies */
  labels?: string[];
  /** Whether the physics simulation is active */
  active?: boolean;
}

// Curated neon color palette for the floating bodies
const BODY_COLORS = [
  "#a78bfa", // violet-400
  "#818cf8", // indigo-400
  "#60a5fa", // blue-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#f87171", // red-400
  "#f472b6", // pink-400
  "#2dd4bf", // teal-400
];

/**
 * <PhysicsOverlay />
 *
 * An isolated, full-screen Matter.js 2D physics canvas that renders
 * floating, interactive bodies with anti-gravity. Users can drag
 * and throw objects with their cursor.
 *
 * The canvas sits behind text content (z-index: 1) but in front of
 * the background gradient, with a fully transparent background.
 */
function PhysicsOverlay({
  labels = ["JS", "Python", "Rust", "1205", "⭐", "🔥", "PR", "Commit"],
  active = true,
}: PhysicsOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  /**
   * Spawns a random floating body (circle or rounded rectangle)
   * at a random position along the bottom of the screen so it
   * floats upward due to anti-gravity.
   */
  const spawnBody = useCallback(
    (world: Matter.World, width: number, height: number, label: string) => {
      const x = Math.random() * (width - 120) + 60;
      const y = height + 60; // start just below the viewport
      const color = BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)];
      const isCircle = Math.random() > 0.4;

      let body: Matter.Body;

      if (isCircle) {
        const radius = 22 + Math.random() * 26;
        body = Matter.Bodies.circle(x, y, radius, {
          restitution: 0.7,
          friction: 0.05,
          frictionAir: 0.01,
          density: 0.001,
          label,
          render: {
            fillStyle: color,
            strokeStyle: "rgba(255,255,255,0.15)",
            lineWidth: 2,
          },
        });
      } else {
        const w = 50 + Math.random() * 40;
        const h = 30 + Math.random() * 20;
        body = Matter.Bodies.rectangle(x, y, w, h, {
          chamfer: { radius: 10 },
          restitution: 0.7,
          friction: 0.05,
          frictionAir: 0.01,
          density: 0.001,
          label,
          render: {
            fillStyle: color,
            strokeStyle: "rgba(255,255,255,0.15)",
            lineWidth: 2,
          },
        });
      }

      // Give an initial random horizontal nudge
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 4,
        y: -(Math.random() * 3 + 1),
      });

      Matter.Composite.add(world, body);
      return body;
    },
    []
  );

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // ── Engine ──────────────────────────────────────────
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: -0.1, scale: 0.001 },
    });
    engineRef.current = engine;

    // ── Render ──────────────────────────────────────────
    const render = Matter.Render.create({
      element: container,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: "transparent",
        pixelRatio: window.devicePixelRatio || 1,
      },
    });
    renderRef.current = render;

    // ── Walls (invisible boundary box) ──────────────────
    const wallThickness = 60;
    const wallOptions = {
      isStatic: true,
      render: { visible: false },
      restitution: 1,
    };

    const walls = [
      // top
      Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width + 200, wallThickness, wallOptions),
      // bottom
      Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width + 200, wallThickness, wallOptions),
      // left
      Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height + 200, wallOptions),
      // right
      Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height + 200, wallOptions),
    ];
    Matter.Composite.add(engine.world, walls);

    // ── Mouse Constraint ────────────────────────────────
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false,
        },
      },
    });
    Matter.Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // ── Spawn Bodies with staggered delay ───────────────
    const spawnTimers: NodeJS.Timeout[] = [];
    labels.forEach((label, i) => {
      const timer = setTimeout(() => {
        spawnBody(engine.world, width, height, label);
      }, i * 350 + 200);
      spawnTimers.push(timer);
    });

    // ── Custom afterRender: draw labels on bodies ───────
    Matter.Events.on(render, "afterRender", () => {
      const ctx = render.context;
      const bodies = Matter.Composite.allBodies(engine.world);

      bodies.forEach((body) => {
        if (body.isStatic || !body.label || body.label === "Body") return;

        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        ctx.font = "bold 11px 'Inter', system-ui, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillText(body.label, 0, 0);
        ctx.restore();
      });
    });

    // ── Start ───────────────────────────────────────────
    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    // ── Handle Resize ───────────────────────────────────
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      render.canvas.width = w;
      render.canvas.height = h;
      render.options.width = w;
      render.options.height = h;

      // Reposition walls
      Matter.Body.setPosition(walls[0], { x: w / 2, y: -wallThickness / 2 });
      Matter.Body.setPosition(walls[1], { x: w / 2, y: h + wallThickness / 2 });
      Matter.Body.setPosition(walls[2], { x: -wallThickness / 2, y: h / 2 });
      Matter.Body.setPosition(walls[3], { x: w + wallThickness / 2, y: h / 2 });
    };
    window.addEventListener("resize", handleResize);

    // ── Cleanup ─────────────────────────────────────────
    return () => {
      spawnTimers.forEach(clearTimeout);
      window.removeEventListener("resize", handleResize);
      Matter.Events.off(render, "afterRender", () => {});
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Composite.clear(engine.world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
    };
  }, [active, labels, spawnBody]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[1] pointer-events-auto"
      style={{ touchAction: "none" }}
      aria-hidden="true"
    />
  );
}

// Optimized wrapper using memoization and deep array checks to prevent re-renders on page state progress updates
const MemoizedPhysicsOverlay = React.memo(PhysicsOverlay, (prevProps, nextProps) => {
  if (prevProps.active !== nextProps.active) return false;
  if (prevProps.labels === nextProps.labels) return true;
  if (!prevProps.labels || !nextProps.labels) return false;
  if (prevProps.labels.length !== nextProps.labels.length) return false;
  for (let i = 0; i < prevProps.labels.length; i++) {
    if (prevProps.labels[i] !== nextProps.labels[i]) return false;
  }
  return true;
});

export default MemoizedPhysicsOverlay;
