"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  Star, 
  GitPullRequest, 
  Code2, 
  Terminal, 
  Share2, 
  Layers, 
  ChevronRight, 
  Volume2, 
  VolumeX 
} from "lucide-react";

// Inline custom GitHub SVG Icon to ensure 100% compilation safety across lucide environments
const GithubIcon = ({ className }: { className?: string }) => (
  <svg 
    role="img" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);
import PhysicsOverlay from "@/components/PhysicsOverlay";
import { GithubLogo3D } from "@/components/ui/github-logo-3d";
import { mockGitHubData } from "@/lib/mock-data";
import { fetchGitHubStats, type GitHubStats } from "@/lib/github";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

// 7 seconds per slide, just like Spotify Wrapped
const SLIDE_DURATION = 7000;
const TOTAL_SLIDES = 5;

// Cached shared AudioContext to prevent latency and memory/context leaks
let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  // Resume context if suspended (common in browser user-gesture policies)
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
};

// Web Audio API Sound Synth for beautiful micro-interactions
const playSynthSound = (type: "tap" | "success" | "transition" | "float") => {
  try {
    const ctx = getAudioContext();
    if (!ctx || ctx.state === "closed") return;
    
    switch (type) {
      case "tap": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
        break;
      }
      case "transition": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        break;
      }
      case "success": {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1); // G5
        
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.35);
        osc2.stop(ctx.currentTime + 0.35);
        break;
      }
    }
  } catch (e) {
    console.warn("Web Audio not supported or blocked by browser policies", e);
  }
};

export default function GitGravityStory() {
  const [appState, setAppState] = useState<"input" | "loading" | "story" | "error">("input");
  const [usernameInput, setUsernameInput] = useState("");
  const [patInput, setPatInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [githubData, setGithubData] = useState<GitHubStats | null>(null);
  const [loadingStage, setLoadingStage] = useState("Connecting to GitHub...");

  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollDirection, setScrollDirection] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [physicsActive, setPhysicsActive] = useState(true);
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Active statistics set (live data or fallback mock data)
  const stats = githubData || mockGitHubData;

  // Trigger synth sounds on navigation
  const triggerSound = (type: "tap" | "success" | "transition" | "float") => {
    if (soundEnabled) {
      playSynthSound(type);
    }
  };

  const startLoadingStages = () => {
    setLoadingStage("Connecting to GitHub API...");
    const t1 = setTimeout(() => setLoadingStage("Analyzing repository orbits..."), 800);
    const t2 = setTimeout(() => setLoadingStage("Measuring language gravity..."), 1600);
    const t3 = setTimeout(() => setLoadingStage("Suspending particles in zero-g..."), 2400);
    const t4 = setTimeout(() => setLoadingStage("Launching GitGravity engine..."), 3200);
    return [t1, t2, t3, t4];
  };

  const handleGenerate = async (username: string, pat: string) => {
    if (!username.trim()) return;
    triggerSound("transition");
    setAppState("loading");
    setErrorMsg("");
    const timers = startLoadingStages();

    try {
      const fetched = await fetchGitHubStats(username, pat);
      // Wait for stages to complete visually
      await new Promise((resolve) => setTimeout(resolve, 3600));
      setGithubData(fetched);
      setAppState("story");
      setCurrentSlide(0);
      setProgress(0);
      setIsPlaying(true);
      triggerSound("success");
    } catch (err: any) {
      timers.forEach(clearTimeout);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setAppState("error");
    }
  };

  const handleDemo = () => {
    triggerSound("success");
    setGithubData(null); // fallback to mockGitHubData
    setAppState("story");
    setCurrentSlide(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleBackToInput = () => {
    triggerSound("tap");
    setAppState("input");
    setIsPlaying(false);
    setProgress(0);
  };

  // Handle auto-progressing slides
  useEffect(() => {
    if (!isPlaying || appState !== "story") {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return;
    }

    const animate = (time: number) => {
      if (previousTimeRef.current !== null) {
        const deltaTime = time - previousTimeRef.current;
        setProgress((prev) => {
          const nextProgress = prev + (deltaTime / SLIDE_DURATION) * 100;
          if (nextProgress >= 100) {
            // Move to next slide
            setScrollDirection(1);
            setCurrentSlide((prevSlide) => {
              const nextSlide = (prevSlide + 1) % TOTAL_SLIDES;
              if (nextSlide === 0) {
                triggerSound("success");
              } else {
                triggerSound("transition");
              }
              return nextSlide;
            });
            return 0;
          }
          return nextProgress;
        });
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      previousTimeRef.current = null;
    };
  }, [isPlaying, currentSlide, soundEnabled, appState]);

  // Navigate manually
  const handleNext = () => {
    triggerSound("tap");
    setProgress(0);
    previousTimeRef.current = null;
    setScrollDirection(1);
    setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
  };

  const handlePrev = () => {
    triggerSound("tap");
    setProgress(0);
    previousTimeRef.current = null;
    setScrollDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
  };

  const handleReset = () => {
    triggerSound("success");
    setProgress(0);
    previousTimeRef.current = null;
    setScrollDirection(-1);
    setCurrentSlide(0);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      playSynthSound("tap");
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (appState !== "story") return;
    const now = Date.now();
    if (now - lastScrollTime.current < 900) return;

    if (e.deltaY > 20) {
      handleNext();
      lastScrollTime.current = now;
    } else if (e.deltaY < -20) {
      handlePrev();
      lastScrollTime.current = now;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (appState !== "story") return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (appState !== "story" || touchStartX.current === null || touchStartY.current === null) return;

    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 60) {
        handlePrev();
      } else if (diffX < -60) {
        handleNext();
      }
    } else {
      if (diffY > 60) {
        handlePrev();
      } else if (diffY < -60) {
        handleNext();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const copyToClipboard = () => {
    triggerSound("success");
    navigator.clipboard.writeText("Check out my GitGravity 2025 Wrapped! Floating commits, active repos, and clean anti-gravity logic. 🚀");
    setShowShareNotification(true);
    setTimeout(() => {
      setShowShareNotification(false);
    }, 3000);
  };

  // Get labels for Matter.js Physics overlay per slide (memoized to prevent recreation of array reference)
  const physicsLabels = useMemo(() => {
    switch (currentSlide) {
      case 1:
        return [
          `${stats.totalCommits}`,
          "COMMITS",
          `🔥 ${stats.longestStreak} DAYS`,
          `⭐ ${stats.totalStars}`,
          `PRs: ${stats.totalPRs}`,
          "PUSH",
          "COMMIT",
          "CODE",
        ];
      case 2:
        return [
          ...stats.topLanguages.map((l) => l.name),
          "TS",
          "JS",
          "PY",
          "RS",
          "REACT",
          "NODE",
          "COMPILER",
        ];
      case 3:
        return [
          stats.mostActiveRepo.split("-")[0],
          "ENGINE",
          "CORE",
          "BRANCH",
          "MERGE",
          "GRAVITY",
          "ACTIVE",
        ];
      case 4:
        return [
          "2025",
          "WRAPPED",
          "GIT",
          "GRAVITY",
          "🚀",
          "🔥",
          "⭐",
          "💻",
        ];
      default:
        return [];
    }
  }, [currentSlide, stats]);

  // Check if Physics should be rendered on current slide
  // Slide 0 has no physics overlay (intro), slides 1, 2, 3, 4 do.
  const isPhysicsActive = physicsActive && currentSlide > 0 && appState === "story";

  // Slide transition variants mapped to scroll direction with spring physics and 3D rotation
  const slideVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? "100vh" : "-100vh",
      rotateX: dir > 0 ? 45 : -45,
      scale: 0.78,
      opacity: 0,
    }),
    center: {
      y: 0,
      rotateX: 0,
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 90,
        damping: 18,
        mass: 0.85
      }
    },
    exit: (dir: number) => ({
      y: dir > 0 ? "-100vh" : "100vh",
      rotateX: dir > 0 ? -45 : 45,
      scale: 0.78,
      opacity: 0,
      transition: {
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1] as any
      }
    })
  };

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-slate-100 font-sans selection:bg-purple-500/30"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Beautiful interactive fluid WebGL shader background */}
      <div className="absolute inset-0 opacity-40 z-0 pointer-events-none">
        <WebGLShader />
      </div>

      {/* Dynamic atmospheric grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-radial-[circle_at_center] from-purple-900/10 via-transparent to-transparent blur-3xl pointer-events-none z-[2]" />



      {/* Matter.js zero-gravity physics overlay */}
      <AnimatePresence mode="wait">
        {isPhysicsActive && (
          <PhysicsOverlay 
            key={`physics-${currentSlide}`}
            labels={physicsLabels} 
            active={isPhysicsActive} 
          />
        )}
      </AnimatePresence>

      {/* Screen Tap Interaction Zones */}
      {appState === "story" && (
        <div className="absolute inset-0 flex select-none z-[10] pointer-events-none">
          <div 
            onClick={handlePrev}
            className="w-[30%] h-full pointer-events-auto cursor-w-resize"
            title="Previous Slide"
          />
          <div 
            onClick={handleNext}
            className="w-[70%] h-full pointer-events-auto cursor-e-resize"
            title="Next Slide"
          />
        </div>
      )}

      {/* Share Toast Notification */}
      <AnimatePresence>
        {showShareNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="absolute top-20 z-50 px-6 py-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-xl text-emerald-400 text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-950/20"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            Copied stats wrap text to clipboard! Share it!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Wrapped Story Shell Container */}
      <div className="relative w-full h-screen flex flex-col justify-between overflow-hidden z-[20] pointer-events-auto">
        
        {/* 1. INPUT PANEL (Full Screen Centered) */}
        {appState === "input" && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="flex flex-col items-center justify-center h-full w-full px-6 z-[30]"
          >
            <div className="w-full max-w-md p-8 rounded-3xl border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-2xl shadow-[0_0_80px_-15px_rgba(168,85,247,0.25)]">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-4 animate-pulse">
                  <GithubIcon className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-white via-neutral-100 to-purple-400 bg-clip-text text-transparent leading-[1.15] mb-2">
                  GitGravity
                </h1>
                <p className="text-sm text-neutral-400 max-w-[280px] leading-relaxed">
                  Your 2025 code journey, untangled from gravity. Enter your GitHub username.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-widest block mb-1">
                    GitHub Username
                  </label>
                  <input 
                    type="text" 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. torvalds"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900/60 border border-neutral-850 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition duration-300 font-semibold"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGenerate(usernameInput, patInput);
                    }}
                  />
                </div>

                {/* Advanced Settings for PAT */}
                <div className="border border-neutral-800/80 rounded-xl overflow-hidden bg-neutral-950/20">
                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full px-4 py-3 flex justify-between items-center text-xs font-bold text-neutral-400 uppercase tracking-wider hover:bg-neutral-900/40 transition"
                  >
                    <span>Advanced Options</span>
                    <span className={`transform transition duration-300 ${showAdvanced ? "rotate-90" : ""}`}>
                      ▶
                    </span>
                  </button>
                  {showAdvanced && (
                    <div className="p-4 pt-0 border-t border-neutral-800/40 space-y-2">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                        Personal Access Token (PAT)
                      </label>
                      <input 
                        type="password" 
                        value={patInput}
                        onChange={(e) => setPatInput(e.target.value)}
                        placeholder="ghp_..."
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900/40 border border-neutral-800 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-purple-500/80 transition"
                      />
                      <p className="text-[9px] text-neutral-500 leading-normal">
                        Required only for private repositories or if you encounter GitHub API rate limits. Tokens are processed only in your browser.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <LiquidButton
                  onClick={() => handleGenerate(usernameInput, patInput)}
                  className="w-full py-4 text-white border border-neutral-800 rounded-full"
                  size="xl"
                  disabled={!usernameInput.trim()}
                >
                  <span className="font-bold tracking-wider text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-pulse text-purple-400" />
                    Generate Wrapped
                  </span>
                </LiquidButton>

                <button 
                  onClick={handleDemo}
                  className="w-full py-2.5 text-xs font-semibold text-neutral-500 hover:text-purple-400 transition"
                >
                  Or explore with Demo Stats
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. LOADING PANEL (Full Screen Space Orbit) */}
        {appState === "loading" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full w-full px-6 z-[30] text-center"
          >
            {/* 3D Rotating GitHub Logo WebGL Canvas */}
            <div className="relative w-40 h-40 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-purple-500/10 animate-pulse duration-1500 blur-xl scale-75" />
              <GithubLogo3D />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={loadingStage}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                className="space-y-2"
              >
                <h3 className="text-sm font-semibold tracking-widest text-purple-400 uppercase">
                  CALCULATING
                </h3>
                <p className="text-xl font-bold text-white max-w-[280px] mx-auto min-h-[56px] flex items-center justify-center leading-snug">
                  {loadingStage}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="w-48 h-1 bg-neutral-900 rounded-full overflow-hidden mt-8">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500" 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3.5, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* 3. ERROR PANEL (Full Screen Centered) */}
        {appState === "error" && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="flex flex-col items-center justify-center h-full w-full px-6 z-[30]"
          >
            <div className="w-full max-w-md p-8 rounded-3xl border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-2xl shadow-[0_0_80px_-15px_rgba(239,68,68,0.2)]">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
                  <Flame className="w-10 h-10 animate-bounce" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white mb-3">
                  Orbit Failure
                </h2>
                <div className="px-5 py-4 rounded-2xl bg-neutral-900/60 border border-neutral-850 w-full">
                  <p className="text-xs text-neutral-400 leading-relaxed font-semibold">
                    {errorMsg}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <LiquidButton
                  onClick={() => setAppState("input")}
                  className="w-full py-4 text-white border border-neutral-800 rounded-full"
                  size="xl"
                >
                  <span className="font-bold tracking-wider text-xs">Try Again</span>
                </LiquidButton>

                <button 
                  onClick={handleDemo}
                  className="w-full py-2.5 text-xs font-semibold text-neutral-500 hover:text-purple-400 transition"
                >
                  Or use Demo Stats
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 4. STORY VIEW (Full Screen Dashboard Layout) */}
        {appState === "story" && (
          <>
            {/* Story Progress Bar and Controls (Floating Dyn Island at Top) */}
            <div className="fixed top-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-6 z-[40]">
              <div className="p-4 rounded-2xl border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md shadow-lg flex flex-col gap-3">
                {/* Progress Segments */}
                <div className="flex gap-1.5 w-full">
                  {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
                    <div 
                      key={idx} 
                      className="h-1 flex-1 bg-neutral-800/80 rounded-full overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerSound("tap");
                        setScrollDirection(idx > currentSlide ? 1 : -1);
                        setCurrentSlide(idx);
                        setProgress(0);
                        previousTimeRef.current = null;
                      }}
                    >
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-75 ease-linear rounded-full"
                        style={{
                          width: idx < currentSlide 
                            ? "100%" 
                            : idx === currentSlide 
                              ? `${progress}%` 
                              : "0%"
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Top Bar Navigation / Header */}
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <GithubIcon className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
                      GitGravity // 2025
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Sound Toggle */}
                    <button 
                      onClick={toggleSound}
                      className="p-1.5 rounded-full hover:bg-neutral-800/60 text-neutral-400 hover:text-white transition"
                      title={soundEnabled ? "Mute Sound Effects" : "Enable Sound Effects"}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-600" />}
                    </button>

                    {/* Toggle Physics */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerSound("tap");
                        setPhysicsActive(!physicsActive);
                      }}
                      className={`p-1.5 rounded-full hover:bg-neutral-800/60 transition ${physicsActive ? "text-purple-400" : "text-neutral-600"}`}
                      title="Toggle Antigravity Engine"
                    >
                      <Layers className="w-4 h-4" />
                    </button>

                    {/* Pause/Play */}
                    <button 
                      onClick={togglePlay}
                      className="p-1.5 rounded-full hover:bg-neutral-800/60 text-neutral-400 hover:text-white transition"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    {/* Restart */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      className="p-1.5 rounded-full hover:bg-neutral-800/60 text-neutral-400 hover:text-white transition"
                      title="Restart Stories"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Back to Username Search */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleBackToInput(); }}
                      className="p-1.5 rounded-full hover:bg-neutral-800/60 text-neutral-400 hover:text-white transition"
                      title="Search Another Username"
                    >
                      <GithubIcon className="w-4 h-4 text-purple-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stories AnimatePresence Viewport (Full Screen Stack) */}
            <div className="flex-1 relative w-full h-full flex flex-col justify-center items-center overflow-hidden z-[20]" style={{ perspective: "1500px", transformStyle: "preserve-3d" }}>
              <AnimatePresence custom={scrollDirection}>
                <motion.div
                  key={currentSlide}
                  custom={scrollDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0 p-8 flex flex-col justify-between max-w-6xl mx-auto mt-36 mb-12 w-full"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  
                  {/* Slide Content Router */}
                  {(() => {
                    switch (currentSlide) {
                      case 0:
                        return (
                          <div className="flex flex-col md:flex-row items-center justify-between h-full w-full gap-10 md:gap-20">
                            <div className="flex flex-col justify-center text-left md:w-1/2 space-y-6">
                              <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex w-fit items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                Git Wrapped Experience
                              </motion.div>

                              <motion.h1 
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-white via-neutral-100 to-purple-400 bg-clip-text text-transparent leading-[1.15]"
                              >
                                Your Code, <br />
                                <span className="text-purple-400">Untangled</span> <br />
                                From Gravity.
                              </motion.h1>

                              <motion.p
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-base text-neutral-400 leading-relaxed max-w-md"
                              >
                                Hey <span className="font-semibold text-neutral-200">@{stats.username}</span>, we parsed your 2025 digital footprint and set it free into space.
                              </motion.p>

                              {/* Elegant, premium starting button */}
                              <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="z-[30] pt-2"
                              >
                                <LiquidButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNext();
                                  }}
                                  className="text-white border border-neutral-800 rounded-full w-full max-w-sm py-4"
                                  size="xl"
                                >
                                  <span className="font-bold tracking-wider text-xs">Launch GitGravity</span>
                                </LiquidButton>
                              </motion.div>
                            </div>

                            <div className="flex items-center justify-center md:w-1/2 w-full select-none pointer-events-none">
                              {/* Big floating visual elements */}
                              <div className="relative w-72 h-72 rounded-full border border-purple-500/10 bg-purple-500/5 shadow-[0_0_60px_rgba(168,85,247,0.08)] flex items-center justify-center animate-pulse">
                                <GithubIcon className="w-24 h-24 text-purple-400/50" />
                              </div>
                            </div>

                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.9 }}
                              className="absolute bottom-2 left-6 flex items-center gap-2 text-xs text-neutral-500 font-medium select-none"
                            >
                              <span>Scroll, swipe or tap next to navigate</span>
                              <ChevronRight className="w-3.5 h-3.5 animate-bounce-horizontal" />
                            </motion.div>
                          </div>
                        );

                      case 1:
                        return (
                          <div className="flex flex-col md:flex-row items-center justify-between h-full w-full gap-10 md:gap-16">
                            <div className="flex flex-col justify-center text-left md:w-1/2 space-y-6">
                              <motion.span
                                initial={{ y: 15, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-xs font-semibold tracking-wider text-purple-400 uppercase"
                              >
                                01 // Commit Velocity
                              </motion.span>
                              
                              <motion.h2 
                                initial={{ y: 25, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.25 }}
                                className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight"
                              >
                                You left your mark <br />
                                on the cloud.
                              </motion.h2>

                              <motion.p 
                                initial={{ y: 25, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.35 }}
                                className="text-sm text-neutral-400 leading-relaxed max-w-md"
                              >
                                Your commits are floating around in space. Drag, click, and throw elements on the canvas to see them interact with zero-gravity kinetics.
                              </motion.p>
                            </div>

                            <div className="flex flex-col items-center justify-center md:w-1/2 w-full gap-6">
                              {/* Giant floating stat banner */}
                              <motion.div
                                initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.4 }}
                                className="relative flex flex-col items-center justify-center p-8 rounded-full border border-purple-500/20 bg-purple-500/5 shadow-[0_0_50px_rgba(168,85,247,0.15)] w-56 h-56 md:w-64 md:h-64"
                              >
                                <span className="text-6xl md:text-7xl font-black text-white tracking-tight drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                                  {stats.totalCommits}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-widest text-purple-300 mt-2">
                                  Commits
                                </span>
                                <Flame className="w-6 h-6 text-amber-400 absolute top-6 right-6 animate-bounce" />
                              </motion.div>

                              <motion.div 
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 20, stiffness: 90, delay: 0.55 }}
                                className="grid grid-cols-3 gap-3 bg-neutral-900/40 border border-neutral-850 p-4 rounded-2xl backdrop-blur-md w-full max-w-md"
                              >
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Streak</span>
                                  <span className="text-base font-bold text-amber-400 mt-1">{stats.longestStreak}d</span>
                                </div>
                                <div className="flex flex-col items-center border-x border-neutral-850">
                                  <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">PRs</span>
                                  <span className="text-base font-bold text-violet-400 mt-1">{stats.totalPRs}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Stars</span>
                                  <span className="text-base font-bold text-yellow-400 mt-1">{stats.totalStars}</span>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        );

                      case 2:
                        return (
                          <div className="flex flex-col md:flex-row items-center justify-between h-full w-full gap-10 md:gap-16">
                            <div className="flex flex-col justify-center text-left md:w-1/2 space-y-6">
                              <motion.span
                                initial={{ y: 15, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-xs font-semibold tracking-wider text-teal-400 uppercase"
                              >
                                02 // Dialect of Choice
                              </motion.span>
                              
                              <motion.h2 
                                initial={{ y: 25, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.25 }}
                                className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight"
                              >
                                Your voice, <br />
                                written in syntax.
                              </motion.h2>

                              <motion.p 
                                initial={{ y: 25, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.35 }}
                                className="text-sm text-neutral-400 leading-relaxed max-w-md"
                              >
                                Every line of code written in 2025 forms a language footprint. These are the languages that dominated your commits and project builds.
                              </motion.p>
                            </div>

                            <div className="flex flex-col justify-center md:w-1/2 w-full space-y-5">
                              {stats.topLanguages.map((lang, index) => (
                                <motion.div 
                                  key={lang.name}
                                  initial={{ x: -40, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ type: "spring", damping: 15, stiffness: 100, delay: index * 0.15 + 0.4 }}
                                  className="relative overflow-hidden bg-neutral-900/40 border border-neutral-850 p-5 rounded-2xl backdrop-blur-md flex items-center justify-between shadow-md"
                                >
                                  <div className="flex items-center gap-3.5 z-10">
                                    <span 
                                      className="w-4 h-4 rounded-full shadow-[0_0_12px_currentColor]" 
                                      style={{ color: lang.color, backgroundColor: lang.color }}
                                    />
                                    <span className="font-extrabold text-base text-neutral-100">{lang.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 z-10">
                                    <span className="text-sm font-bold text-neutral-400">{lang.percentage}%</span>
                                  </div>
                                  
                                  {/* Glowing slider fill indicator */}
                                  <div 
                                    className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-60 rounded-full transition-all"
                                    style={{ 
                                      width: `${lang.percentage}%`,
                                      boxShadow: "0 0 16px rgba(20,184,166,0.4)" 
                                    }}
                                  />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        );

                      case 3:
                        return (
                          <div className="flex flex-col md:flex-row items-center justify-between h-full w-full gap-10 md:gap-16">
                            <div className="flex flex-col justify-center text-left md:w-1/2 space-y-6">
                              <motion.span
                                initial={{ y: 15, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-xs font-semibold tracking-wider text-amber-400 uppercase"
                              >
                                03 // Gravitational Center
                              </motion.span>
                              
                              <motion.h2 
                                initial={{ y: 25, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.25 }}
                                className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight"
                              >
                                The codebase that <br />
                                kept you pulling.
                              </motion.h2>

                              <motion.p 
                                initial={{ y: 25, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.35 }}
                                className="text-sm text-neutral-400 leading-relaxed max-w-md"
                              >
                                You refactored files, merged pull requests, and pushed commit updates to this workspace node, making it your primary workspace gravity center.
                              </motion.p>
                            </div>

                            <div className="flex items-center justify-center md:w-1/2 w-full">
                              <motion.div
                                initial={{ y: 35, rotateX: 12, scale: 0.92, opacity: 0 }}
                                animate={{ y: 0, rotateX: 0, scale: 1, opacity: 1 }}
                                transition={{ type: "spring", damping: 18, stiffness: 95, delay: 0.4 }}
                                className="bg-radial from-neutral-900/90 to-neutral-950 border border-neutral-850 p-8 rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden w-full max-w-md group"
                                style={{ transformStyle: "preserve-3d" }}
                              >
                                {/* Decorative ambient light */}
                                <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500" />
                                
                                <div className="flex items-center gap-3.5 mb-5">
                                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                    <Terminal className="w-6 h-6" />
                                  </div>
                                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Active Workspace Focus</span>
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-amber-300 transition">
                                  {stats.mostActiveRepo}
                                </h3>
                                
                                <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                                  Your digital footprint was highly active in this repository space, serving as your hub of daily commits and revisions.
                                </p>

                                <div className="flex justify-between items-center border-t border-neutral-800/80 pt-5">
                                  <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Repository Share</span>
                                  <span className="text-base font-extrabold text-amber-400">{stats.mostActiveRepoCommits} Commits</span>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        );

                      case 4:
                        return (
                          <div className="flex flex-col md:flex-row items-center justify-between h-full w-full gap-10 md:gap-16">
                            <div className="flex flex-col justify-center text-left md:w-1/2 space-y-6">
                              <motion.span
                                initial={{ y: 15, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-xs font-semibold tracking-wider text-fuchsia-400 uppercase"
                              >
                                04 // Final Report
                              </motion.span>
                              
                              <motion.h2 
                                initial={{ y: 25, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.25 }}
                                className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight"
                              >
                                Your 2025 Core.
                              </motion.h2>

                              <motion.p 
                                initial={{ y: 25, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.35 }}
                                className="text-sm text-neutral-400 leading-relaxed max-w-md"
                              >
                                Your entire developer trajectory, mapped and floating in zero-g. Ready to share with your friends, colleagues, and followers?
                              </motion.p>

                              {/* Interactive Sharing Footer Buttons */}
                              <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.45 }}
                                className="flex gap-3 pt-2 z-[30] w-full max-w-sm"
                              >
                                <LiquidButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowShareModal(true);
                                  }}
                                  className="flex-1 text-white border border-neutral-800 rounded-xl py-4 bg-purple-600/10 hover:bg-purple-600/20"
                                  size="xl"
                                >
                                  <span className="flex items-center justify-center gap-2 font-bold text-xs tracking-wider uppercase">
                                    <Share2 className="w-4 h-4 text-purple-400" />
                                    Share Stats Wrap
                                  </span>
                                </LiquidButton>
                                
                                <LiquidButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReset();
                                  }}
                                  className="px-5 text-white border border-neutral-800 rounded-xl"
                                  size="xl"
                                  title="Replay Story"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </LiquidButton>
                              </motion.div>
                            </div>

                            <div className="flex items-center justify-center md:w-1/2 w-full">
                              {/* Beautiful Spotify-Wrapped style summarized poster */}
                              <motion.div
                                initial={{ scale: 0.82, rotateY: -12, rotateX: 8, y: 30, opacity: 0 }}
                                animate={{ scale: 1, rotateY: 0, rotateX: 0, y: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.45 }}
                                className="bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-purple-950/20 border border-neutral-800 p-6 rounded-3xl relative overflow-hidden w-full max-w-sm shadow-xl"
                                style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
                              >
                                {/* Atmospheric details */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl" />
                                
                                <div className="flex items-center gap-4 border-b border-neutral-800/60 pb-5 mb-5">
                                  <img 
                                    src={stats.avatarUrl} 
                                    alt="Avatar" 
                                    className="w-12 h-12 rounded-full border border-purple-500/30 bg-neutral-800 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                                  />
                                  <div>
                                    <h4 className="font-extrabold text-base text-white">@{stats.username}</h4>
                                    <p className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">GitGravity Wrapped</p>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400 font-medium">Total Commits</span>
                                    <span className="font-bold text-white flex items-center gap-1.5">
                                      {stats.totalCommits}
                                      <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400 font-medium">Primary Language</span>
                                    <span className="font-bold text-purple-400">
                                      {stats.topLanguages[0]?.name}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400 font-medium">Key Repository</span>
                                    <span className="font-bold text-white max-w-[160px] truncate text-right">
                                      {stats.mostActiveRepo}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400 font-medium">Stars & PRs</span>
                                    <span className="font-bold text-yellow-400 flex items-center gap-1.5">
                                      {stats.totalStars} <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/20" />
                                      <span className="text-neutral-500 font-normal">/</span>
                                      <span className="text-violet-400">{stats.totalPRs}</span> <GitPullRequest className="w-3.5 h-3.5 text-violet-400" />
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        );

                      default:
                        return null;
                    }
                  })()}

                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* 5. SPOTIFY-STYLE SHARE OVERLAY MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[50] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-3xl bg-neutral-950/70 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 md:gap-12 shadow-[0_0_80px_-10px_rgba(168,85,247,0.25)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-900 text-neutral-400 hover:text-white transition"
              >
                ✕
              </button>

              {/* Left Side: Spotify Wrapped Summary Poster Card */}
              <div className="flex items-center justify-center md:w-1/2">
                <div 
                  id="gitgravity-poster"
                  className="w-72 h-[460px] rounded-3xl bg-gradient-to-b from-purple-900 via-neutral-950 to-neutral-950 border-2 border-purple-500/30 p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl"
                >
                  {/* Decorative glowing backdrops */}
                  <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-purple-500/10 pb-3">
                    <div className="flex items-center gap-2">
                      <GithubIcon className="w-5 h-5 text-purple-400" />
                      <span className="text-[10px] font-bold tracking-widest text-neutral-300 uppercase">
                        GitGravity Wrapped
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-purple-400 font-bold tracking-wider">
                      2025
                    </span>
                  </div>

                  {/* User Profile */}
                  <div className="flex items-center gap-3.5 mt-4">
                    <img 
                      src={stats.avatarUrl} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-full border-2 border-purple-500/30 bg-neutral-800 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    />
                    <div>
                      <h4 className="font-extrabold text-base text-white tracking-tight">@{stats.username}</h4>
                      <p className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">Quantum Coder</p>
                    </div>
                  </div>

                  {/* Stats list */}
                  <div className="space-y-4 my-6">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-medium">Total Commits</span>
                      <span className="font-bold text-white flex items-center gap-1">
                        {stats.totalCommits}
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-medium">Longest Streak</span>
                      <span className="font-bold text-amber-400">{stats.longestStreak} days</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-medium">Language Dialect</span>
                      <span className="font-bold text-purple-400">{stats.topLanguages[0]?.name}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-medium">Core Repository</span>
                      <span className="font-bold text-white max-w-[120px] truncate text-right">{stats.mostActiveRepo}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-medium">Stars / Pulls</span>
                      <span className="font-bold text-yellow-400 flex items-center gap-1.5">
                        {stats.totalStars} ★ <span className="text-neutral-500 font-normal">/</span> <span className="text-violet-400">{stats.totalPRs} PRs</span>
                      </span>
                    </div>
                  </div>

                  {/* Footer branding */}
                  <div className="border-t border-purple-500/10 pt-4 flex flex-col items-center text-center">
                    <p className="text-[8px] text-neutral-500 font-semibold tracking-widest uppercase">
                      gitgravity.vercel.app // zero-g stats
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side: sharing options */}
              <div className="flex flex-col justify-between md:w-1/2 py-2">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                    Share Your Code Gravity
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                    Show off your 2025 stats wrapped in zero-gravity. Share this poster directly to your friends and networks!
                  </p>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Share on WhatsApp */}
                    <button
                      onClick={() => {
                        triggerSound("success");
                        const text = encodeURIComponent(`Check out my GitGravity 2025 Wrapped! I made ${stats.totalCommits} commits, code in ${stats.topLanguages[0]?.name || "TypeScript"}, and hit a ${stats.longestStreak}-day streak! 🚀 Try it here:`);
                        window.open(`https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(window.location.origin)}`, "_blank");
                      }}
                      className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 transition duration-300 font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      <Share2 className="w-5 h-5 text-emerald-400" />
                      WhatsApp
                    </button>

                    {/* Share on X / Twitter */}
                    <button
                      onClick={() => {
                        triggerSound("success");
                        const text = encodeURIComponent(`My 2025 code gravity stats are in! 🌌\n\n💻 Commits: ${stats.totalCommits}\n🔥 Streak: ${stats.longestStreak} days\n🛠 Language: ${stats.topLanguages[0]?.name || "TypeScript"}\n\nCheck your GitGravity Wrapped at `);
                        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.origin)}`, "_blank");
                      }}
                      className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 hover:scale-105 transition duration-300 font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      X / Twitter
                    </button>

                    {/* Instagram Story Instruction */}
                    <div className="col-span-2 p-4 rounded-2xl bg-pink-500/5 border border-pink-500/15 text-pink-300 text-xs leading-normal">
                      <div className="font-extrabold uppercase tracking-widest text-[10px] text-pink-400 mb-1.5 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        Instagram / Stories Tip
                      </div>
                      Take a screenshot of the poster card on the left to add directly to your Instagram Story or Snap, and tag <span className="font-bold text-pink-200">#GitGravity</span>!
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-neutral-800/80 pt-6">
                  <LiquidButton
                    onClick={() => {
                      triggerSound("success");
                      navigator.clipboard.writeText(`My GitGravity 2025 Wrapped:\n- Commits: ${stats.totalCommits}\n- Streak: ${stats.longestStreak} days\n- Language: ${stats.topLanguages[0]?.name || "TypeScript"}\n- Top Repo: ${stats.mostActiveRepo}\n🚀 Calculate your code gravity stats at ${window.location.origin}`);
                      setShowShareNotification(true);
                      setTimeout(() => setShowShareNotification(false), 3000);
                    }}
                    className="w-full py-4 text-white border border-neutral-800 rounded-full"
                    size="xl"
                  >
                    <span className="font-bold tracking-wider text-xs flex items-center justify-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      Copy Stats Text
                    </span>
                  </LiquidButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Subtle Signature bottom info */}
      <div className="text-[10px] text-neutral-600 font-semibold tracking-widest uppercase select-none pointer-events-none mt-2 z-[20]">
        Powered by Next.js & Matter.js
      </div>
    </main>
  );
}
