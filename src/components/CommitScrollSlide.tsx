"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Flame, Star, GitPullRequest, Code2 } from "lucide-react";
import { ContributionStarsGrid } from "@/components/GitGravity/GitGravityDashboard";

interface CommitScrollSlideProps {
  totalCommits: number;
  longestStreak: number;
  totalStars: number;
  totalPRs: number;
}

export default function CommitScrollSlide({
  totalCommits,
  longestStreak,
  totalStars,
  totalPRs,
}: CommitScrollSlideProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [displayCommits, setDisplayCommits] = useState(0);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const mousePosRef = useRef({ x: -1000, y: -1000 });

  // IntersectionObserver to detect when component is scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
        }
      },
      { threshold: 0.02 } // Trigger when 2% visible (highly responsive)
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Count up animation for commits
  useEffect(() => {
    if (!hasBeenVisible) return;
    let startTimestamp: number | null = null;
    const duration = 1500;
    const target = totalCommits || 0;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayCommits(Math.floor(progress * target));
      if (progress < 1) {
        animId = window.requestAnimationFrame(step);
      }
    };

    animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [totalCommits, hasBeenVisible]);

  // Particle Big Bang simulation
  useEffect(() => {
    if (!hasBeenVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = canvas.offsetWidth || canvas.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 800);
    let height = canvas.offsetHeight || canvas.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 600);
    canvas.width = width;
    canvas.height = height;

    const colors = [
      "rgba(16, 185, 129, ", // emerald #10b981
      "rgba(20, 184, 166, ", // teal #14b8a6
      "rgba(245, 158, 11, ", // amber #f59e0b
    ];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseX: number;
      baseY: number;
      size: number;
      color: string;
      alpha: number;
      angle: number;
      speed: number;
      orbitRadius: number;
      currentOrbitRadius: number;
      orbitSpeed: number;
      phase: "singularity" | "exploding" | "orbiting";
      explosionTimer: number;
    }

    const particles: Particle[] = [];
    const numParticles = 180;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 2.2; // Slower explosion speed as requested
      const orbitRadius = 80 + Math.random() * 260; // Keep the larger orbit circle size
      const orbitSpeed = (0.005 + Math.random() * 0.012) * (Math.random() > 0.5 ? 1 : -1);

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        baseX: centerX,
        baseY: centerY,
        size: 1 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0,
        angle,
        speed,
        orbitRadius,
        currentOrbitRadius: 0, // Starts at 0, smoothly relaxes to orbitRadius
        orbitSpeed,
        phase: "singularity",
        explosionTimer: Math.random() * 15,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    let frame = 0;
    const tick = () => {
      frame++;

      const currentWidth = canvas.offsetWidth || canvas.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 800);
      const currentHeight = canvas.offsetHeight || canvas.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 600);
      if (currentWidth !== width || currentHeight !== height) {
        width = currentWidth;
        height = currentHeight;
        canvas.width = width;
        canvas.height = height;
      }

      ctx.fillStyle = "rgba(2, 4, 8, 0.2)"; // faint tail trail
      ctx.fillRect(0, 0, width, height);

      const currentCenterX = width / 2;
      const currentCenterY = height / 2;

      particles.forEach((p) => {
        const mx = mousePosRef.current.x;
        const my = mousePosRef.current.y;

        if (p.phase === "singularity") {
          p.x = currentCenterX;
          p.y = currentCenterY;
          p.alpha = Math.min(1, p.alpha + 0.1);
          if (frame > p.explosionTimer + 10) {
            p.phase = "exploding";
          }
        } else if (p.phase === "exploding") {
          p.x += p.vx;
          p.y += p.vy;
          // Apply cosmic friction (damping factor)
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.alpha = Math.min(1, p.alpha + 0.05);

          // Settle into orbit after decelerating
          const dx = p.x - currentCenterX;
          const dy = p.y - currentCenterY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Transition to orbiting when speed slows down, setting currentOrbitRadius to actual settled distance
          if (Math.abs(p.vx) < 0.25 && Math.abs(p.vy) < 0.25) {
            p.phase = "orbiting";
            p.currentOrbitRadius = dist;
            p.angle = Math.atan2(dy, dx);
          }

          // Mouse interaction (running away / pushing away slightly while exploding)
          if (mx !== -1000 && my !== -1000) {
            const mdx = p.x - mx;
            const mdy = p.y - my;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 100) {
              const force = (100 - mdist) / 100;
              p.x += (mdx / mdist) * force * 5;
              p.y += (mdy / mdist) * force * 5;
            }
          }
        } else if (p.phase === "orbiting") {
          p.angle += p.orbitSpeed;
          // Smoothly relax/expand the current orbit radius towards the target orbit radius
          p.currentOrbitRadius += (p.orbitRadius - p.currentOrbitRadius) * 0.02;

          let targetX = currentCenterX + Math.cos(p.angle) * p.currentOrbitRadius;
          let targetY = currentCenterY + Math.sin(p.angle) * p.currentOrbitRadius;

          // Mouse interaction (running away / repelling target coordinates so they evade cursor but maintain orbital motion)
          if (mx !== -1000 && my !== -1000) {
            const mdx = targetX - mx;
            const mdy = targetY - my;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 140) {
              const force = (140 - mdist) / 140;
              // Repel the orbital coordinates away from the cursor
              targetX += (mdx / mdist) * force * 120;
              targetY += (mdy / mdist) * force * 120;
            }
          }

          // Smoothly attract to (potentially warped) orbital coordinates
          p.x += (targetX - p.x) * 0.08;
          p.y += (targetY - p.y) * 0.08;
          p.alpha = 0.55 + Math.sin(frame * 0.02 + p.orbitRadius) * 0.35; // gentle twinkling
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.max(0.1, p.alpha) + ")";
        ctx.fill();

        // Core glow for bigger particles
        if (p.size > 2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = p.color + Math.max(0.02, p.alpha * 0.15) + ")";
          ctx.fill();
        }
      });

      // Draw faint connections between orbiting stars for a constellations/neural net look
      ctx.lineWidth = 0.35;
      ctx.strokeStyle = "rgba(16, 185, 129, 0.05)";
      ctx.beginPath();
      // Only connect brighter stars to improve visual clarity and reduce calculations by 90%
      const brightStars = particles.filter(p => p.phase === "orbiting" && p.size > 1.8);
      for (let i = 0; i < brightStars.length; i++) {
        const p1 = brightStars[i];
        for (let j = i + 1; j < brightStars.length; j++) {
          const p2 = brightStars[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          // Squared distance check to avoid Math.sqrt calls
          if (dx * dx + dy * dy < 5625) { // 75 * 75
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
        }
      }
      ctx.stroke();

      animId = window.requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animId);
    };
  }, [hasBeenVisible]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hasBeenVisible) {
      setHasBeenVisible(true);
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleMouseLeave = () => {
    mousePosRef.current = { x: -1000, y: -1000 };
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 w-full h-full bg-[#020408] flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16 p-8 md:p-16 overflow-hidden select-none"
    >
      {/* Background Interactive Starburst Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Background Contribution Star Grid for the star theme */}
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-45">
        <ContributionStarsGrid />
      </div>

      {/* Left Column: Stat Details */}
      <div className="flex flex-col justify-center text-left md:w-1/2 space-y-8 w-full z-10 relative">
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/60 border border-emerald-800/40 rounded-full w-fit"
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase font-mono">
            01 // Commit Velocity
          </span>
        </motion.div>

        <motion.h2
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none font-sans"
        >
          You left your mark <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400">
            on the cloud.
          </span>
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-sm text-neutral-400 leading-relaxed max-w-md"
        >
          Your monthly dev footprint, tracked across {new Date().getFullYear()} spacetime coordinates. The mass of your commits has shaped the gravity of the cloud.
        </motion.p>

        {/* Small detail cards */}
        <div className="grid grid-cols-3 gap-4 pt-4 max-w-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex flex-col p-3 rounded-xl bg-[#161b22]/50 border border-neutral-800 backdrop-blur-sm"
          >
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider font-mono">Streak</span>
            <span className="text-sm font-extrabold text-amber-400 mt-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-500/20 text-amber-400" />
              {longestStreak}d
            </span>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="flex flex-col p-3 rounded-xl bg-[#161b22]/50 border border-neutral-800 backdrop-blur-sm"
          >
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider font-mono">Stars</span>
            <span className="text-sm font-extrabold text-emerald-400 mt-1 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-emerald-500/20 text-emerald-400" />
              {totalStars}
            </span>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="flex flex-col p-3 rounded-xl bg-[#161b22]/50 border border-neutral-800 backdrop-blur-sm"
          >
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider font-mono">PRs</span>
            <span className="text-sm font-extrabold text-teal-400 mt-1 flex items-center gap-1">
              <GitPullRequest className="w-3.5 h-3.5 text-teal-400" />
              {totalPRs}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Giant Singularity Counter and 3D Orbiting Rings */}
      <div className="flex flex-col items-center justify-center md:w-1/2 w-full h-full relative z-10">
        <div
          className="relative flex items-center justify-center"
          style={{
            perspective: "400px",
            transformStyle: "preserve-3d",
            position: "relative",
            width: "320px",
            height: "320px",
          }}
        >
          {/* Nebula dust behind the counter */}
          <div className="absolute bg-emerald-500/10 blur-3xl w-48 h-48 rounded-full z-0 pointer-events-none" />

          {/* Central Counter */}
          <div className="absolute flex flex-col items-center justify-center text-center z-10 select-none pointer-events-none">
            <span className="text-6xl md:text-7xl font-black text-white tracking-tight drop-shadow-[0_0_35px_rgba(16,185,129,0.35)] font-mono">
              {displayCommits}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mt-3 font-mono">
              Total Commits
            </span>
          </div>


        </div>
      </div>
    </div>
  );
}
