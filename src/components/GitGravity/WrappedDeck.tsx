"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { UserData } from "./GitGravityDashboard";
import SuperCardOverlay from "./SuperCardOverlay";
import { generateCardDNA, GitHubStats } from "@/lib/cardGenerator";
import GeneratedCard from "@/components/GeneratedCard";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { toPng } from "html-to-image";

interface WrappedDeckProps {
  userData: UserData;
  onBack: () => void;
}

export default function WrappedDeck({ userData, onBack }: WrappedDeckProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const card1Ref = useRef<HTMLDivElement | null>(null);
  const card2Ref = useRef<HTMLDivElement | null>(null);
  const card3Ref = useRef<HTMLDivElement | null>(null);
  const card4Ref = useRef<HTMLDivElement | null>(null);
  const card5Ref = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");
  const [currentYear, setCurrentYear] = useState(2026);
  const [showSuperCardOverlay, setShowSuperCardOverlay] = useState(false);
  const [shareTarget, setShareTarget] = useState<'whatsapp' | 'instagram' | 'linkedin' | 'twitter' | null>(null);
  const [hasAutoSaved, setHasAutoSaved] = useState(false);

  const triggerSound = (type: "tap" | "success" | "transition" | "float") => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === "tap") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "success") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        
        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
        gain1.gain.setValueAtTime(0.12, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc1.start();
        osc1.stop(ctx.currentTime + 0.25);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.35);
      } else if (type === "transition") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "float") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (err) {
      console.warn("Failed to play sound:", err);
    }
  };

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const shortYear = currentYear % 100;

  // Starfield Particle System
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    interface Star {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
    }

    let stars: Star[] = [];

    const initStars = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      stars = [];
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2,
          speed: Math.random() * 0.5 + 0.1,
          opacity: Math.random(),
        });
      }
    };

    let animId: number;

    const drawStars = () => {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        star.y -= star.speed;
        if (star.y < 0) star.y = height;
      });
      animId = requestAnimationFrame(drawStars);
    };

    window.addEventListener("resize", initStars);
    initStars();
    drawStars();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", initStars);
    };
  }, []);

  const [showInstagramModal, setShowInstagramModal] = useState(false);

  // Drag to scroll horizontal track with smooth inertia
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    let velocity = 0;
    let lastX = 0;
    let animId: number;

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      scrollContainer.style.cursor = "grabbing";
      startX = e.pageX - scrollContainer.offsetLeft;
      scrollLeft = scrollContainer.scrollLeft;
      lastX = e.pageX;
      velocity = 0;
      cancelAnimationFrame(animId);
    };

    const handleMouseLeave = () => {
      if (isDown) {
        isDown = false;
        scrollContainer.style.cursor = "grab";
        applyInertia();
      }
    };

    const handleMouseUp = () => {
      if (isDown) {
        isDown = false;
        scrollContainer.style.cursor = "grab";
        applyInertia();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scrollContainer.offsetLeft;
      const walk = (x - startX) * 1.3;
      scrollContainer.scrollLeft = scrollLeft - walk;
      
      // Calculate velocity
      velocity = e.pageX - lastX;
      lastX = e.pageX;
    };

    const applyInertia = () => {
      if (Math.abs(velocity) > 0.5) {
        scrollContainer.scrollLeft -= velocity;
        velocity *= 0.95; // damping
        animId = requestAnimationFrame(applyInertia);
      }
    };

    scrollContainer.addEventListener("mousedown", handleMouseDown);
    scrollContainer.addEventListener("mouseleave", handleMouseLeave);
    scrollContainer.addEventListener("mouseup", handleMouseUp);
    scrollContainer.addEventListener("mousemove", handleMouseMove);

    scrollContainer.style.cursor = "grab";

    return () => {
      cancelAnimationFrame(animId);
      scrollContainer.removeEventListener("mousedown", handleMouseDown);
      scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
      scrollContainer.removeEventListener("mouseup", handleMouseUp);
      scrollContainer.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // 3D Tilt & Holographic Foil Effect Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const container = e.currentTarget;
    const card = container.querySelector(".tilt-card") as HTMLDivElement;
    if (!card) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

    // Calculate percentage coordinates for holographic shine position
    const shineX = (x / rect.width) * 100;
    const shineY = (y / rect.height) * 100;
    card.style.setProperty("--shine-x", `${shineX}%`);
    card.style.setProperty("--shine-y", `${shineY}%`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const card = container.querySelector(".tilt-card") as HTMLDivElement;
    if (card) {
      card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
      card.style.setProperty("--shine-x", "50%");
      card.style.setProperty("--shine-y", "50%");
    }
  };

  // dynamic stats from github profile coordinates
  const commits = userData.totalCommits || 0;
  const topLanguage = userData.globalLanguages?.[0]?.name || "TypeScript";
  const streak = userData.longestStreak || 0;
  const pullRequests = userData.totalPRs || 0;
  const starsGained = userData.totalStars || 0;
  const activeRepo = userData.projects?.[0]?.name || "git-gravity";
  const ranking = userData.gravityTier || "Stellar Comet";

  const stats = useMemo<GitHubStats>(() => ({
    username: userData.username || "anonymous",
    totalCommits: userData.totalCommits || 0,
    longestStreak: userData.longestStreak || 0,
    totalStars: userData.totalStars || 0,
    totalPRs: userData.totalPRs || 0,
    topLanguages: (userData.globalLanguages || []).map((lang: any) => ({
      name: lang.name,
      percent: lang.percentage || lang.percent || 0
    })),
    avatarUrl: userData.avatarUrl || `https://avatars.githubusercontent.com/u/9919?v=4`
  }), [userData]);

  const cardDNA = useMemo(() => generateCardDNA(stats), [stats]);

  // dynamic percentile based on commits/stars
  const percentile =
    commits > 500
      ? "Top 0.1%"
      : commits > 200
      ? "Top 1%"
      : commits > 75
      ? "Top 5%"
      : "Top 10%";

  const getShareUrl = () => {
    return typeof window !== 'undefined' 
      ? `${window.location.origin}/?user=${userData.username}` 
      : `https://gitgravity.io/?user=${userData.username}`;
  };

  const shareText = `Check out my @GitHub Wrapped on GitGravity! 🌌 Commits: ${commits}, Stars: ${starsGained}, Max Streak: ${streak} days. Rank: ${ranking} (${percentile})! See yours at:`;

  const handleShareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(getShareUrl())}`;
    window.open(url, "_blank");
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      shareText + " " + getShareUrl()
    )}`;
    window.open(url, "_blank");
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      getShareUrl()
    )}`;
    window.open(url, "_blank");
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(shareText + " " + getShareUrl());
    alert("Achievements copied to clipboard! Share it in your Stories!");
  };

  const captureElementToBlob = async (node: HTMLElement | null, delayMs: number = 500) => {
    if (!node) return null;
    try {
      if (typeof window !== 'undefined' && document.fonts) {
        try {
          await document.fonts.ready;
        } catch (e) {
          console.warn("Fonts ready promise failed:", e);
        }
      }
      
      const imgs = Array.from(node.getElementsByTagName('img'));
      await Promise.all(imgs.map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }));

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const dataUrl = await toPng(node, {
        cacheBust: true,
        skipFonts: true,
        style: {
          transform: 'scale(1) rotateX(0deg) rotateY(0deg)',
          animation: 'none',
          transition: 'none',
        },
      });

      if (!dataUrl) return null;
      const response = await fetch(dataUrl);
      return await response.blob();
    } catch (error) {
      console.error('Capture element failed:', error);
      return null;
    }
  };

  const handleDownloadDeck = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    triggerSound("transition");
    setDownloadProgress("0%");

    try {
      const zip = new JSZip();

      // Card 1
      setDownloadProgress("20%");
      const blob1 = await captureElementToBlob(card1Ref.current, 300);
      if (blob1) zip.file("01_commits_wrapped.png", blob1);

      // Card 2
      setDownloadProgress("40%");
      const blob2 = await captureElementToBlob(card2Ref.current, 300);
      if (blob2) zip.file("02_streak_wrapped.png", blob2);

      // Card 3
      setDownloadProgress("60%");
      const blob3 = await captureElementToBlob(card3Ref.current, 300);
      if (blob3) zip.file("03_languages_wrapped.png", blob3);

      // Card 4
      setDownloadProgress("80%");
      const blob4 = await captureElementToBlob(card4Ref.current, 300);
      if (blob4) zip.file("04_ranking_wrapped.png", blob4);

      // Card 5 (Custom profile card)
      setDownloadProgress("90%");
      const blob5 = await captureElementToBlob(card5Ref.current, 500);
      if (blob5) zip.file("05_cosmic_profile.png", blob5);

      setDownloadProgress("100%");
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${stats.username || 'gitgravity'}_wrapped_deck.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerSound("success");
    } catch (error) {
      console.error("Deck download failed:", error);
      alert("Failed to download deck ZIP. Please try again.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress("");
    }
  };

  return (
    <div className="font-body text-body-md min-h-screen w-full flex flex-col overflow-x-hidden bg-[#0d1117] text-[#dde4dd] relative select-none">
      {/* Starfield Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none opacity-50"
      />

      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#0d1117]/60 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 py-4">
        <div
          onClick={onBack}
          className="font-hero-display text-lg font-extrabold tracking-tighter text-white cursor-pointer hover:opacity-80 transition flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-neon-lime text-xl font-bold">arrow_back</span>
          GitGravity <span className="text-neon-lime">{currentYear}</span>
        </div>
        <div className="flex gap-4">
          <span
            onClick={() => {
              triggerSound("transition");
              setShareTarget('instagram');
              setShowSuperCardOverlay(true);
            }}
            className="material-symbols-outlined text-[#bbcabf] hover:text-[#ccff00] transition-colors cursor-pointer"
          >
            share
          </span>
          {isDownloading ? (
            <div className="flex items-center gap-1.5 text-neon-lime text-xs font-mono font-bold animate-pulse">
              <div className="w-3.5 h-3.5 border-2 border-neon-lime border-t-transparent rounded-full animate-spin" />
              <span>{downloadProgress}</span>
            </div>
          ) : (
            <span
              onClick={handleDownloadDeck}
              className="material-symbols-outlined text-[#bbcabf] hover:text-[#ccff00] transition-colors cursor-pointer"
              title="Download Full Deck"
            >
              download
            </span>
          )}
          <span
            onClick={onBack}
            className="material-symbols-outlined text-[#bbcabf] hover:text-[#ccff00] transition-colors cursor-pointer"
          >
            close
          </span>
        </div>
      </header>

      <main className="flex-1 mt-24 mb-20 px-6 max-w-full overflow-hidden relative z-10 flex flex-col justify-center">
        <div className="mb-8 max-w-4xl">
          <h1 className="font-hero-display text-4xl md:text-6xl leading-none text-white mb-2 font-black italic uppercase tracking-tighter">
            Year in Review
          </h1>
          <p className="font-body text-sm md:text-base text-white/60">
            Quantifying @{userData.username}&apos;s impact across the cosmic dev-sphere.
          </p>
        </div>

        {/* Horizontal Scroll Track Container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-8 pb-12 hide-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {/* CARD 1: LIME */}
          <div
            className="tilt-container entrance-stagger-1 shrink-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div ref={card1Ref} className="tilt-card float-card-1 flex-none w-[310px] sm:w-[340px] aspect-[9/16] rounded-[32px] bg-gradient-to-br from-[#0e1610]/95 to-[#050806]/98 relative overflow-hidden snap-center group border border-[#ccff00]/15 cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
              <div className="holo-shine"></div>
              {/* Twinkling Space Dust Particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 z-0">
                <div className="absolute top-[10%] left-[20%] w-24 h-24 rounded-full bg-[#ccff00]/8 blur-[40px] animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[10%] w-32 h-32 rounded-full bg-[#ccff00]/5 blur-[60px] animate-pulse [animation-delay:2s]"></div>
              </div>
              <div className="pattern-overlay text-[#ccff00] concentric-rings opacity-[0.04]"></div>
              {/* Watermark Year */}
              <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 font-hero-display text-[120px] leading-none vertical-text font-black select-none opacity-[0.06] tracking-[0.1em] pointer-events-none z-0 stroke-text text-[#ccff00]">
                {currentYear}
              </div>
              <div className="absolute inset-0 p-8 sm:p-9 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <span className="font-stat-label text-[#ccff00] text-[10px] tracking-[0.2em] font-bold font-mono">
                    PULSE // {currentYear}
                  </span>
                  <span className="material-symbols-outlined text-[#ccff00] text-2xl group-hover:scale-125 transition-transform duration-300">
                    terminal
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="font-stat-label text-white/40 text-[9px] tracking-widest font-mono">
                    TOTAL COMMITS
                  </div>
                  <div className="font-hero-display text-5xl sm:text-6xl leading-none font-black text-[#ccff00] glow-text">
                    {commits}
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mt-1">
                    Genesis: {userData.createdAt ? new Date(userData.createdAt).getFullYear() : currentYear}
                  </div>
                </div>

                {/* New Feature: Interactive Language Breakdown bar */}
                <div className="mt-4 pt-5 border-t border-white/10">
                  <div className="font-stat-label text-white/45 text-[9px] tracking-widest font-mono mb-2.5">
                    TOP LANGUAGES
                  </div>
                  {/* Language segmented bar */}
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden flex mb-3.5">
                    {userData.globalLanguages?.slice(0, 3).map((lang, idx) => {
                      const colors = ['#ccff00', '#00f5ff', '#ff0080'];
                      return (
                        <div
                          key={lang.name}
                          style={{ width: `${lang.percentage}%`, backgroundColor: colors[idx % colors.length] }}
                          className="h-full first:rounded-l-full last:rounded-r-full"
                        />
                      );
                    })}
                  </div>
                  {/* Language names & % list */}
                  <div className="space-y-1.5">
                    {userData.globalLanguages?.slice(0, 3).map((lang, idx) => {
                      const colors = ['bg-[#ccff00]', 'bg-[#00f5ff]', 'bg-[#ff0080]'];
                      return (
                        <div key={lang.name} className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${colors[idx % colors.length]}`}></span>
                            <span className="text-white/85 font-mono font-medium">{lang.name}</span>
                          </div>
                          <span className="text-white/50 font-mono font-bold">{lang.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: HOT PINK */}
          <div
            className="tilt-container entrance-stagger-2 shrink-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div ref={card2Ref} className="tilt-card float-card-2 flex-none w-[310px] sm:w-[340px] aspect-[9/16] rounded-[32px] bg-gradient-to-br from-[#160a10]/95 to-[#080205]/98 relative overflow-hidden snap-center group border border-[#ff0080]/15 cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
              <div className="holo-shine"></div>
              {/* Twinkling Space Dust Particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 z-0">
                <div className="absolute top-[20%] right-[20%] w-24 h-24 rounded-full bg-[#ff0080]/8 blur-[40px] animate-pulse"></div>
                <div className="absolute bottom-[10%] left-[10%] w-32 h-32 rounded-full bg-[#ff0080]/5 blur-[60px] animate-pulse [animation-delay:1.5s]"></div>
              </div>
              <div className="pattern-overlay text-[#ff0080] stripes opacity-[0.03]"></div>
              {/* Watermark Year */}
              <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 font-hero-display text-[120px] leading-none vertical-text font-black select-none opacity-[0.06] tracking-[0.1em] pointer-events-none z-0 stroke-text text-[#ff0080]">
                {currentYear}
              </div>
              <div className="absolute inset-0 p-8 sm:p-9 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <span className="font-stat-label text-[#ff0080] text-[10px] tracking-[0.2em] font-bold font-mono">
                    SURGE // {currentYear}
                  </span>
                  <span className="material-symbols-outlined text-[#ff0080] text-2xl group-hover:scale-125 transition-transform duration-300">
                    bolt
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="font-stat-label text-white/40 text-[9px] tracking-widest font-mono">
                    MAX COMMIT STREAK
                  </div>
                  <div className="font-hero-display text-5xl sm:text-6xl leading-none font-black text-[#ff0080] glow-text flex items-baseline gap-1">
                    {streak}<span className="text-xl font-bold">DAYS</span>
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mt-1">
                    PRs Merged: {pullRequests}
                  </div>
                </div>

                {/* New Feature: Weekly Commit Velocity chart */}
                <div className="mt-4 pt-5 border-t border-white/10">
                  <div className="font-stat-label text-white/45 text-[9px] tracking-widest font-mono mb-3">
                    WEEKLY VELOCITY WAVE
                  </div>
                  {/* Grid Sparkline chart */}
                  <div className="h-14 flex items-end gap-1.5 w-full bg-white/5 border border-white/5 p-2 rounded-xl mb-3">
                    {(userData.momentum?.chartData || [
                      { day: "Sun", count: 2 },
                      { day: "Mon", count: 12 },
                      { day: "Tue", count: 24 },
                      { day: "Wed", count: 18 },
                      { day: "Thu", count: 21 },
                      { day: "Fri", count: 9 },
                      { day: "Sat", count: 2 }
                    ]).map((dayData, idx) => {
                      const maxCount = Math.max(...(userData.momentum?.chartData?.map(d => d.count) || [24])) || 24;
                      const heightPercent = Math.max(8, Math.min(100, (dayData.count / maxCount) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group/bar">
                          <div 
                            style={{ height: `${heightPercent}%` }}
                            className="w-full bg-[#ff0080] rounded-sm shadow-[0_0_8px_rgba(255,0,128,0.4)] group-hover/bar:bg-white transition-all duration-300"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/60 font-mono">
                    <span>Peak Day: {userData.momentum?.highestDay || "Tuesday"}</span>
                    <span className="font-bold text-[#ff0080]">{userData.momentum?.highestCount || 24} commits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: CYBER TEAL */}
          <div
            className="tilt-container entrance-stagger-3 shrink-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div ref={card3Ref} className="tilt-card float-card-3 flex-none w-[310px] sm:w-[340px] aspect-[9/16] rounded-[32px] bg-gradient-to-br from-[#06141a]/95 to-[#02070a]/98 relative overflow-hidden snap-center group border border-[#00f5ff]/15 cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
              <div className="holo-shine"></div>
              {/* Twinkling Space Dust Particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 z-0">
                <div className="absolute top-[30%] left-[10%] w-24 h-24 rounded-full bg-[#00f5ff]/8 blur-[40px] animate-pulse"></div>
                <div className="absolute bottom-[15%] right-[20%] w-32 h-32 rounded-full bg-[#00f5ff]/5 blur-[60px] animate-pulse [animation-delay:2.5s]"></div>
              </div>
              <div className="pattern-overlay text-[#00f5ff] dot-grid opacity-[0.03]"></div>
              {/* Watermark Year */}
              <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 font-hero-display text-[120px] leading-none vertical-text font-black select-none opacity-[0.06] tracking-[0.1em] pointer-events-none z-0 stroke-text text-[#00f5ff]">
                {currentYear}
              </div>
              <div className="absolute inset-0 p-8 sm:p-9 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <span className="font-stat-label text-[#00f5ff] text-[10px] tracking-[0.2em] font-bold font-mono">
                    NETWORK // {currentYear}
                  </span>
                  <span className="material-symbols-outlined text-[#00f5ff] text-2xl group-hover:scale-125 transition-transform duration-300">
                    lan
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="font-stat-label text-white/40 text-[9px] tracking-widest font-mono">
                    STARS ACCUMULATED
                  </div>
                  <div className="font-hero-display text-5xl sm:text-6xl leading-none font-black text-[#00f5ff] glow-text">
                    {starsGained}
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mt-1">
                    Followers count: {userData.followers}
                  </div>
                </div>

                {/* New Feature: Portfolio Top Projects List */}
                <div className="mt-4 pt-5 border-t border-white/10 flex-1 flex flex-col justify-end">
                  <div className="font-stat-label text-white/45 text-[9px] tracking-widest font-mono mb-2.5">
                    TOP REPOSITORIES
                  </div>
                  <div className="space-y-2.5">
                    {userData.projects?.slice(0, 2).map((project, idx) => (
                      <div 
                        key={project.name}
                        className="bg-white/[0.03] border border-white/5 p-2.5 rounded-2xl flex flex-col justify-between hover:bg-white/[0.06] transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-black text-white truncate max-w-[75%] uppercase tracking-wide italic font-mono">
                            {project.name}
                          </h4>
                          <span className="text-[9px] text-[#00f5ff] font-bold font-mono flex items-center gap-0.5">
                            ★ {project.stars}
                          </span>
                        </div>
                        <p className="text-[9px] text-white/50 font-mono line-clamp-1 mt-0.5 leading-relaxed">
                          {project.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: NEON ORANGE */}
          <div
            className="tilt-container entrance-stagger-4 shrink-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div ref={card4Ref} className="tilt-card float-card-4 flex-none w-[310px] sm:w-[340px] aspect-[9/16] rounded-[32px] bg-gradient-to-br from-[#1c0c03]/95 to-[#0b0401]/98 relative overflow-hidden snap-center group border border-[#ff6d00]/15 cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
              <div className="holo-shine"></div>
              {/* Twinkling Space Dust Particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 z-0">
                <div className="absolute top-[15%] right-[15%] w-24 h-24 rounded-full bg-[#ff6d00]/8 blur-[40px] animate-pulse"></div>
                <div className="absolute bottom-[25%] left-[20%] w-32 h-32 rounded-full bg-[#ff6d00]/5 blur-[60px] animate-pulse [animation-delay:1.2s]"></div>
              </div>
              <div
                className="absolute inset-0 pattern-overlay opacity-[0.02] text-[#ff6d00]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 50% 50%, currentColor 2px, transparent 2.5px)",
                  backgroundSize: "15px 15px",
                }}
              ></div>
              {/* Watermark Year */}
              <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 font-hero-display text-[120px] leading-none vertical-text font-black select-none opacity-[0.06] tracking-[0.1em] pointer-events-none z-0 stroke-text text-[#ff6d00]">
                {currentYear}
              </div>
              <div className="absolute inset-0 p-8 sm:p-9 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <span className="font-stat-label text-[#ff6d00] text-[10px] tracking-[0.2em] font-bold font-mono">
                    STATUS // {currentYear}
                  </span>
                  <span className="material-symbols-outlined text-[#ff6d00] text-2xl group-hover:scale-125 transition-transform duration-300">
                    star
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="font-stat-label text-white/40 text-[9px] tracking-widest font-mono">
                    COSMIC CLASSIFICATION
                  </div>
                  <div className="font-hero-display text-2xl sm:text-3xl leading-tight font-black text-[#ff6d00] glow-text uppercase italic">
                    {ranking}
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mt-1">
                    Percentile ranking: {percentile}
                  </div>
                </div>

                {/* New Feature: Glowing Classification Emblem & Description */}
                <div className="mt-4 pt-5 border-t border-white/10 flex-1 flex flex-col justify-between min-h-0">
                  <div className="flex-1 flex flex-col justify-center items-center py-2 relative">
                    {/* SVG Rotating Cosmic Rings */}
                    <svg className="w-16 h-16 text-[#ff6d00]/40 animate-spin [animation-duration:15s]" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" />
                      <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="10 4" />
                      <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
                      <circle cx="50" cy="50" r="6" fill="currentColor" className="animate-ping" />
                    </svg>
                    <div className="absolute w-4 h-4 rounded-full bg-[#ff6d00] shadow-[0_0_15px_#ff6d00] z-20"></div>
                  </div>

                  <p className="text-[10px] text-white/70 italic leading-relaxed text-center font-mono mt-3 line-clamp-3">
                    &ldquo;{userData.cosmicDescription}&rdquo;
                  </p>

                  <div className="flex justify-between items-center text-[9px] font-mono text-white/40 pt-4 border-t border-white/5 mt-3">
                    <span>COSMIC MASS INDEX</span>
                    <span className="font-bold text-[#ff6d00]">{(userData.publicRepos * 3) + (userData.totalStars * 8) + (userData.followers * 4)} GM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Sharing Section */}
        <section className="mt-16 py-12 border-t border-white/5 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="font-hero-display text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">
              Share Your {currentYear} Code Gravity
            </h2>
            <p className="font-body text-sm md:text-base text-white/60">
              Broadcast your cosmic achievements to your orbit.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {/* WhatsApp */}
            <button
              onClick={() => {
                triggerSound("transition");
                setShareTarget('whatsapp');
                setShowSuperCardOverlay(true);
              }}
              className="group relative flex items-center justify-between p-6 bg-[#25D366] text-white rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-green-500/20 overflow-hidden cursor-pointer"
            >
              <div className="flex flex-col items-start z-10">
                <span className="font-stat-label text-[10px] opacity-70 uppercase tracking-widest mb-1 font-mono">
                  WhatsApp
                </span>
                <span className="font-hero-display text-lg font-black italic">
                  MESSAGE
                </span>
              </div>
              <svg
                className="w-10 h-10 z-10 fill-current group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </button>

            {/* X / Twitter */}
            <button
              onClick={() => {
                triggerSound("transition");
                setShareTarget('twitter');
                setShowSuperCardOverlay(true);
              }}
              className="group relative flex items-center justify-between p-6 bg-white text-black rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-white/10 overflow-hidden cursor-pointer"
            >
              <div className="flex flex-col items-start z-10">
                <span className="font-stat-label text-[10px] opacity-70 uppercase tracking-widest mb-1 font-mono">
                  X // Twitter
                </span>
                <span className="font-hero-display text-lg font-black italic">
                  POST
                </span>
              </div>
              <svg
                className="w-9 h-9 z-10 fill-current group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
              >
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"></path>
              </svg>
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity"></div>
            </button>

            {/* LinkedIn */}
            <button
              onClick={() => {
                triggerSound("transition");
                setShareTarget('linkedin');
                setShowSuperCardOverlay(true);
              }}
              className="group relative flex items-center justify-between p-6 bg-[#0077B5] text-white rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-blue-500/20 overflow-hidden cursor-pointer"
            >
              <div className="flex flex-col items-start z-10">
                <span className="font-stat-label text-[10px] opacity-70 uppercase tracking-widest mb-1 font-mono">
                  LinkedIn
                </span>
                <span className="font-hero-display text-lg font-black italic">
                  NETWORK
                </span>
              </div>
              <svg
                className="w-10 h-10 z-10 fill-current group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.981 0 1.771-.773 1.771-1.729V1.729C24 .774 23.207 0 22.225 0z"></path>
              </svg>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </button>

            {/* Instagram */}
            <button
              onClick={() => {
                triggerSound("transition");
                setShareTarget('instagram');
                setShowSuperCardOverlay(true);
              }}
              className="group relative flex items-center justify-between p-6 instagram-gradient text-white rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-purple-500/20 overflow-hidden cursor-pointer"
            >
              <div className="flex flex-col items-start z-10">
                <span className="font-stat-label text-[10px] opacity-70 uppercase tracking-widest mb-1 font-mono">
                  Instagram
                </span>
                <span className="font-hero-display text-lg font-black italic">
                  STORY
                </span>
              </div>
              <svg
                className="w-10 h-10 z-10 fill-current group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.981 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path>
              </svg>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </button>
          </div>

          <div className="flex flex-col items-center mt-12 gap-4">
            <button
              onClick={handleDownloadDeck}
              disabled={isDownloading}
              className="pulse-btn px-12 py-5 bg-white text-black rounded-full font-hero-display text-lg font-black uppercase italic tracking-tighter hover:bg-[#ccff00] transition-all duration-300 active:scale-95 shadow-2xl flex items-center gap-3 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>DOWNLOADING DECK ({downloadProgress})...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl font-bold">
                    download
                  </span>
                  <span>Download Full Deck</span>
                </>
              )}
            </button>
            <p className="font-stat-label text-[10px] text-white/30 uppercase tracking-[0.4em] font-mono">
              WWW.GITGRAVITY.IO/WRAPPED
            </p>
          </div>
        </section>
      </main>



      {/* Instagram Story Sharing Modal */}
      {showInstagramModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0d1117] border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(214,36,159,0.25)] flex flex-col relative animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button 
              onClick={() => setShowInstagramModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined font-bold">close</span>
            </button>

            {/* Icon */}
            <div className="mx-auto mb-5 p-4 rounded-2xl instagram-gradient text-white shadow-lg shadow-purple-500/20">
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.981 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path>
              </svg>
            </div>

            <h3 className="font-hero-display text-xl font-black text-center text-white italic uppercase tracking-tight">
              Share on Instagram Story
            </h3>
            <p className="text-xs text-center text-white/50 mt-2 font-mono">
              Instagram does not support web API sharing directly. Follow these steps to post your stats:
            </p>

            <div className="my-6 space-y-4 text-xs font-mono">
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-[#ccff00] text-black font-extrabold flex items-center justify-center shrink-0">1</span>
                <p className="text-slate-300">Take a screenshot or print your favorite card in the review deck above.</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-[#ff0080] text-white font-extrabold flex items-center justify-center shrink-0">2</span>
                <p className="text-slate-300">Click below to copy your review summary link and statistics to the clipboard.</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-[#00f5ff] text-black font-extrabold flex items-center justify-center shrink-0">3</span>
                <p className="text-slate-300">Open Instagram, create a Story, add your screenshot, and paste the clipboard details!</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareText + " " + getShareUrl());
                  alert("Copied achievements to clipboard! Ready to paste.");
                }}
                className="w-full py-4 bg-white hover:bg-[#ccff00] text-black font-hero-display text-xs font-black uppercase italic tracking-wider rounded-xl transition duration-300 shadow-lg cursor-pointer"
              >
                Copy Stats & Link
              </button>

              <button
                onClick={() => {
                  window.open("https://instagram.com", "_blank");
                }}
                className="w-full py-3 border border-white/10 hover:bg-white/5 text-white font-hero-display text-xs font-extrabold uppercase italic tracking-wider rounded-xl transition duration-300 cursor-pointer"
              >
                Open Instagram
              </button>
            </div>
          </div>
        </div>
      )}


      {showSuperCardOverlay && (
        <SuperCardOverlay
          stats={stats}
          shareTarget={shareTarget}
          onClose={() => setShowSuperCardOverlay(false)}
          triggerSound={triggerSound}
        />
      )}

      {/* Hidden container for 5th card capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
        <div ref={card5Ref} style={{ width: '340px', height: '604.44px' }}>
          <GeneratedCard
            animatedCommits={commits}
            animatedStars={starsGained}
            animatedStreak={streak}
            dna={cardDNA}
            stats={stats}
          />
        </div>
      </div>
    </div>
  );
}
