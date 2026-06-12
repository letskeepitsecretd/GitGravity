"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { Star, Code2, Globe2, X } from 'lucide-react';

export interface Language {
  name: string;
  percentage: number;
  lines?: string;
  description: string;
}

export interface Project {
  name: string;
  stars: number;
  forks: number;
  description: string;
  url: string;
  languages: Language[];
}

export interface UserData {
  username: string;
  avatarUrl?: string;
  name: string;
  followers: number;
  publicRepos: number;
  totalStars: number;
  totalCommits?: number;
  longestStreak?: number;
  totalPRs?: number;
  createdAt?: string;
  gravityTier: string;
  cosmicDescription: string;
  globalLanguages: Language[];
  projects: Project[];
  momentum?: {
    highestDay: string;
    highestCount: number;
    lowestDay: string;
    lowestCount: number;
    chartData: { day: string; count: number }[];
  };
}

const getLanguageColor = (langName: string): string => {
  const colors: Record<string, string> = {
    javascript: '#f1e05a',
    typescript: '#3178c6',
    html: '#e34c26',
    css: '#563d7c',
    rust: '#dea584',
    go: '#00add8',
    python: '#3572a5',
    java: '#b07219',
    'c++': '#f34b7d',
    c: '#555555',
    'c#': '#178600',
    php: '#4f5d95',
    ruby: '#701516',
    shell: '#89e051',
    bash: '#89e051',
    kotlin: '#a97bff',
    swift: '#f05138',
    markdown: '#083fa1',
    webassembly: '#04133b',
  };
  return colors[langName.toLowerCase()] || '#8b949e';
};

const getContrastText = (bgColor: string): string => {
  if (bgColor === '#f1e05a' || bgColor === '#89e051' || bgColor === '#00add8') {
    return 'text-neutral-950';
  }
  return 'text-white';
};

interface OrbitingNodeProps {
  lang: Language;
  idx: number;
  orbitBase: number;
  orbitStep: number;
  setFocusedLanguage: (lang: Language | null) => void;
  dashboardRef: React.RefObject<HTMLDivElement | null>;
}

function OrbitingNode({
  lang,
  idx,
  orbitBase,
  orbitStep,
  setFocusedLanguage,
  dashboardRef,
}: OrbitingNodeProps) {
  const orbitRadius = orbitBase + idx * orbitStep;
  const speed = 12 + idx * 4; 
  const langColor = getLanguageColor(lang.name);
  const textColor = getContrastText(langColor);

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const elRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const accumulatedTimeRef = useRef(idx * 2.0);
  const lastSystemTimeRef = useRef(0);

  const initialAngle = (accumulatedTimeRef.current * (2 * Math.PI)) / speed;
  const initialX = Math.cos(initialAngle) * orbitRadius;
  const initialY = Math.sin(initialAngle) * orbitRadius;

  // Local Animation Loop using delta time accumulation (keeps motion continuous after release)
  useEffect(() => {
    lastSystemTimeRef.current = Date.now() / 1000;
    let animId: number;
    const tick = () => {
      const now = Date.now() / 1000;
      const dt = now - lastSystemTimeRef.current;
      lastSystemTimeRef.current = now;

      if (!isDraggingRef.current) {
        accumulatedTimeRef.current += dt;
        const angle = (accumulatedTimeRef.current * (2 * Math.PI)) / speed;
        const x = Math.cos(angle) * orbitRadius;
        const y = Math.sin(angle) * orbitRadius;

        if (elRef.current) {
          elRef.current.style.transform = `translate(${x}px, ${y}px)`;
        }
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [orbitRadius, speed]);

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;

    // Reset delta time base to prevent a jump on the next animation frame
    lastSystemTimeRef.current = Date.now() / 1000;

    // Smooth, slow gravitational spring-back return
    animate(dragX, 0, {
      type: "spring",
      stiffness: 6, // very slow returning speed (looks like gentle gravitational pull)
      damping: 15,
    });
    animate(dragY, 0, {
      type: "spring",
      stiffness: 6,
      damping: 15,
    });
  };

  return (
    <div
      ref={elRef}
      style={{
        position: 'absolute',
        transform: `translate(${initialX}px, ${initialY}px)`,
      }}
      className="z-10 pointer-events-none"
    >
      <motion.div
        drag
        style={{ x: dragX, y: dragY }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.2, zIndex: 100 }}
        onClick={(e) => {
          e.stopPropagation();
          setFocusedLanguage(lang);
        }}
        className="cursor-grab active:cursor-grabbing flex flex-col items-center pointer-events-auto"
      >
        <div 
          className="w-8 h-8 rounded flex flex-col items-center justify-center shadow-lg border hover:scale-110 transition-all duration-200"
          style={{ 
            backgroundColor: langColor,
            borderColor: langColor,
            boxShadow: `0 0 12px ${langColor}60`
          }}
        >
          <span className={`text-[9px] font-black tracking-tight ${textColor}`}>{lang.percentage}%</span>
        </div>
        <span className="text-[8px] bg-[#161b22] border border-[#30363d] text-slate-300 px-1.5 py-0.5 rounded mt-0.5 shadow-md select-none">
          {lang.name}
        </span>
      </motion.div>
    </div>
  );
}

interface DashboardProps {
  data: UserData;
  onBack?: () => void;
}

export default function GitGravityDashboard({ data, onBack }: DashboardProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null); 
  const [focusedLanguage, setFocusedLanguage] = useState<Language | null>(null);
  const [screenSize, setScreenSize] = useState({ width: 1200, isMobile: false });
  const dashboardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        isMobile: window.innerWidth < 768
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const width = screenSize.width;
  let orbitBase = 60;
  let orbitStep = 30;
  
  if (width >= 1280) {
    orbitBase = 110;
    orbitStep = 55;
  } else if (width >= 1024) {
    orbitBase = 85;
    orbitStep = 45;
  } else if (width >= 640) {
    orbitBase = 75;
    orbitStep = 38;
  }

  const activeLanguages = selectedProject 
    ? selectedProject.languages 
    : (data.globalLanguages || []);

  const focusedLangColor = focusedLanguage ? getLanguageColor(focusedLanguage.name) : '#161b22';
  const focusedLangTextColor = focusedLanguage ? getContrastText(focusedLangColor) : 'text-white';
  const isFocusedLangDarkText = focusedLangTextColor === 'text-neutral-950';

  return (
    <div 
      ref={dashboardRef}
      className="h-full w-full bg-[#020408] text-[#c9d1d9] relative overflow-hidden flex flex-col font-mono"
    >
      <ContributionStarsGrid />


      {/* Embedded UI Header */}
      <header className="w-full border-b border-[#21262d] bg-[#0d1117]/85 backdrop-blur-md px-6 py-3 flex justify-between items-center z-40 relative">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-2 px-2.5 py-1 bg-[#161b22] hover:bg-[#21262d] text-slate-300 hover:text-white transition-all rounded border border-[#30363d] font-bold cursor-pointer text-[10px]"
            >
              ← INPUT
            </button>
          )}
          <div className="w-3 h-3 rounded-full bg-[#39d353] animate-pulse" />
          <h1 className="text-xs font-bold tracking-widest text-white">
            GITGRAVITY // <span className="text-[#39d353]">@{data.username}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 text-[10px]">
          <div className="hidden md:flex items-center gap-1.5 bg-[#161b22] px-2.5 py-1 rounded-full border border-[#30363d] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#238636]" />
            <span>Class: {data.gravityTier}</span>
          </div>
          {selectedProject && (
            <button 
              onClick={() => { setSelectedProject(null); setFocusedLanguage(null); }}
              className="px-2.5 py-1 bg-[#238636] hover:bg-[#2ea043] text-white transition-all rounded font-bold cursor-pointer"
            >
              RESET TO GLOBAL
            </button>
          )}
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch p-4 overflow-hidden relative z-30">
        
        {/* Left Side: Real repositories */}
        <div className="lg:col-span-3 flex flex-col gap-2 overflow-y-auto max-h-[250px] lg:max-h-[calc(100vh-140px)]">
          <div className="border-b border-[#21262d] pb-1.5">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">GRAVITY CORES</span>
            <h3 className="text-[11px] font-bold text-slate-300 mt-0.5">Real Account Repos</h3>
          </div>
          
          <div className="flex flex-col gap-2">
            {data.projects.map((project) => {
              const isActive = selectedProject?.name === project.name;
              return (
                <div
                  key={project.name}
                  onClick={() => { setSelectedProject(project); setFocusedLanguage(null); }}
                  className={`p-3 rounded-lg cursor-pointer border transition-all relative overflow-hidden ${
                    isActive 
                      ? 'bg-[#161b22] border-[#39d353]' 
                      : 'bg-[#0d1117]/60 border-[#30363d] hover:border-[#8b949e]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-[10px] font-black text-white truncate max-w-[80%]">{project.name}</h4>
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5">★ {project.stars}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 line-clamp-2">{project.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Full-Screen Language Orbit system */}
        <div className="lg:col-span-6 flex flex-col justify-center items-center relative min-h-[250px] lg:max-h-[calc(100vh-140px)] z-20">
          <div className="absolute text-center top-0">
            <h2 className="text-[11px] font-bold text-white">
              {selectedProject ? `Project Map: ${selectedProject.name}` : "Global System Footprint"}
            </h2>
          </div>

          <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[460px] lg:h-[460px] xl:w-[580px] xl:h-[580px] flex items-center justify-center rounded-full border border-[#21262d]/45">
            {/* Center Vector SVG GitHub Logo */}
            <div 
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#161b22] border-2 border-[#39d353] flex items-center justify-center z-20 shadow-[0_0_20px_rgba(57,211,83,0.3)] cursor-pointer"
              onClick={() => { setSelectedProject(null); setFocusedLanguage(null); }}
            >
              <svg viewBox="0 0 16 16" className="w-6 h-6 sm:w-8 sm:h-8 fill-[#c9d1d9] hover:fill-[#39d353] transition-colors">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.35 3.12.88.01.64.01 1.25.01 1.48 0 .21-.15.48-.55.38A8.013 8.013 0 0 1 0 8c0-4.42 3.58-8 8-8z" />
              </svg>
            </div>

            {/* Orbit concentric lines matching exact language orbits */}
            {activeLanguages.map((_, idx) => {
              const radius = orbitBase + idx * orbitStep;
              return (
                <div 
                  key={idx}
                  style={{ width: radius * 2, height: radius * 2 }}
                  className="absolute border border-[#21262d]/45 rounded-full pointer-events-none z-0"
                />
              );
            })}

            {/* Orbiting Language Nodes */}
            <AnimatePresence mode="popLayout">
              {activeLanguages.map((lang, idx) => (
                <OrbitingNode
                  key={lang.name}
                  lang={lang}
                  idx={idx}
                  orbitBase={orbitBase}
                  orbitStep={orbitStep}
                  setFocusedLanguage={setFocusedLanguage}
                  dashboardRef={dashboardRef}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Language logs */}
        <div className="lg:col-span-3 flex flex-col gap-2 overflow-y-auto lg:max-h-[calc(100vh-140px)]">
          <div className="border-b border-[#21262d] pb-1.5">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">TELEMETRY DETECTOR</span>
            <h3 className="text-xs font-bold text-slate-300 mt-0.5">Spacetime Logs</h3>
          </div>

          <AnimatePresence mode="wait">
            {focusedLanguage ? (
              <motion.div
                key={focusedLanguage.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="backdrop-blur-md border p-4 rounded-xl relative text-[10px] shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all"
                style={{
                  backgroundColor: focusedLangColor,
                  borderColor: focusedLangColor,
                  color: isFocusedLangDarkText ? '#0a0a0a' : '#ffffff',
                  boxShadow: `0 0 25px ${focusedLangColor}30`
                }}
              >
                <button 
                  onClick={() => setFocusedLanguage(null)}
                  className={`absolute top-3 right-3 ${isFocusedLangDarkText ? 'text-neutral-800 hover:text-black' : 'text-slate-200 hover:text-white'} transition-colors cursor-pointer`}
                >
                  <X className="w-4 h-4" />
                </button>
                
                <span className="text-[8px] font-black uppercase tracking-widest block mb-1 opacity-70">
                  DATA ELEMENT
                </span>
                <h4 className="text-sm font-extrabold flex items-center gap-1.5 border-b pb-2" style={{ borderColor: isFocusedLangDarkText ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' }}>
                  <Code2 className="w-4 h-4" /> {focusedLanguage.name}
                </h4>

                <div className="mt-3 space-y-2.5">
                  <div className="flex justify-between border-b pb-1.5" style={{ borderColor: isFocusedLangDarkText ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                    <span className="opacity-70">Weight:</span>
                    <span className="font-black text-xs">{focusedLanguage.percentage}%</span>
                  </div>
                  {focusedLanguage.lines && (
                    <div className="flex justify-between border-b pb-1.5" style={{ borderColor: isFocusedLangDarkText ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                      <span className="opacity-70">Total Mass:</span>
                      <span className="font-extrabold text-xs">{focusedLanguage.lines}</span>
                    </div>
                  )}
                  <div className="pt-1">
                    <span className="opacity-70 block font-bold">Details:</span>
                    <p className="text-[10px] leading-relaxed mt-1 opacity-90">{focusedLanguage.description}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#0d1117]/30 border border-[#21262d]/50 p-4 rounded-xl flex flex-col items-center justify-center text-center h-32">
                <Globe2 className="w-6 h-6 text-slate-700 mb-1 animate-pulse" />
                <p className="text-[9px] text-slate-500">
                  Select an orbiting language node or toggle repositories to decode development outputs.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function ContributionGridBackground() {
  const [grid, setGrid] = useState<string[]>([]);

  useEffect(() => {
    const tempGrid = [];
    const colorLevels = ['bg-[#0e4429]/10', 'bg-[#006d21]/20', 'bg-[#26a641]/30', 'bg-[#39d353]/40'];
    for (let i = 0; i < 200; i++) {
      const activeColor = Math.random() > 0.75 
        ? colorLevels[Math.floor(Math.random() * colorLevels.length)] 
        : 'bg-[#161b22]/40';
      tempGrid.push(activeColor);
    }
    setGrid(tempGrid);
  }, []);

  return (
    <div 
      className="absolute inset-0 grid gap-1.5 p-4 opacity-30 z-0 pointer-events-none overflow-hidden select-none"
      style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}
    >
      {grid.map((color, i) => (
        <motion.div
          key={i}
          className={`aspect-square rounded-[2px] border border-[#21262d]/20 ${color}`}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: 2 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  );
}

// Background Star Grid
export function ContributionStarsGrid() {
  const [mounted, setMounted] = useState(false);
  const [stars, setStars] = useState<Array<{ id: number; delay: number; top: string; left: string; size: string }>>([]);
  const [shootingStars, setShootingStars] = useState<Array<{ id: string }>>([]);

  useEffect(() => {
    setMounted(true);
    const tempStars = [];
    for (let i = 0; i < 70; i++) {
      tempStars.push({
        id: i,
        delay: Math.random() * 3,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() > 0.5 ? '1px' : '2px',
      });
    }
    setStars(tempStars);

    // Initial shooting stars
    const initialShooting = [];
    for (let i = 0; i < 3; i++) {
      initialShooting.push({ id: Math.random().toString(36).substring(2, 11) });
    }
    setShootingStars(initialShooting);

    // Create shooting stars periodically
    const interval = setInterval(() => {
      setShootingStars(prev => {
        const next = prev.length > 8 ? prev.slice(prev.length - 4) : [...prev];
        next.push({ id: Math.random().toString(36).substring(2, 11) });
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#020408]">
      {/* Blinking stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            width: star.size,
            height: star.size,
            top: star.top,
            left: star.left,
          }}
          animate={{
            opacity: [0.1, 1, 0.1],
            scale: [0.7, 1.2, 0.7],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Shooting stars */}
      {shootingStars.map((sstar) => (
        <SpaceShootingStarInner key={sstar.id} />
      ))}
    </div>
  );
}

const SpaceShootingStarInner = () => {
  const [config] = useState(() => {
    const startsFromTop = Math.random() > 0.5;
    const startLeft = Math.random() * 100;
    const startTop = Math.random() * 100;
    const startPosition = startsFromTop
      ? { top: "0%", left: `${startLeft}%` }
      : { top: `${startTop}%`, left: "0%" };

    const endPosition = startsFromTop
      ? { top: "110%", left: `${startLeft + 40}%` }
      : { top: `${startTop + 40}%`, left: "110%" };
      
    const duration = Math.random() * 1.5 + 1.2;
    return { startPosition, endPosition, duration };
  });

  return (
    <motion.div
      className="absolute bg-white rounded-full"
      style={{
        width: "2px",
        height: "2px",
        ...config.startPosition,
        boxShadow: "0 0 0 1px #ffffff10, 0 0 0 2px #ffffff10, 0 0 20px #ffffff50",
      }}
      animate={{
        top: config.endPosition.top,
        left: config.endPosition.left,
      }}
      transition={{
        duration: config.duration,
        ease: "linear",
      }}
    />
  );
};
