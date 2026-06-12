"use client";

import React, { useState, useEffect, useRef } from "react";
import { ContributionStarsGrid } from "@/components/GitGravity/GitGravityDashboard";

interface StarProps {
  id: number;
  size: number;
  left: number;
  top: number;
  duration: number;
  opacity: number;
}

interface TerminalLine {
  num: string;
  content: string;
  colorClass: string;
}

interface AstralConsoleSlideProps {
  submittedUsername: string | null;
  onPullDeck: (uname: string) => void;
}

export default function AstralConsoleSlide({
  submittedUsername,
  onPullDeck,
}: AstralConsoleSlideProps) {
  const currentYear = new Date().getFullYear();
  const shortYear = currentYear % 100;
  const [stars, setStars] = useState<StarProps[]>([]);
  const [lines, setLines] = useState<TerminalLine[]>([
    { num: "01", content: "// Waiting for user uplink...", colorClass: "italic text-white/30 tracking-wide" }
  ]);
  const [isActive, setIsActive] = useState(false);
  const lineCountRef = useRef(1);
  const terminalFeedRef = useRef<HTMLDivElement>(null);
  const lastTriggerTimeRef = useRef(0);

  // Initialize username value from parent
  useEffect(() => {
    if (submittedUsername) {
      // Pre-fill terminal logic for this username
      lineCountRef.current = 0;
      setLines([
        { num: "01", content: `[SYS] Initializing astral handshake...`, colorClass: "text-primary" },
        { num: "02", content: `> Target identified: @${submittedUsername}`, colorClass: "text-white/70" },
        { num: "03", content: `[LINK] Handshake established.`, colorClass: "text-cyber-teal" },
        { num: "04", content: `> Scraping orbital repos...`, colorClass: "text-white/40" },
        { num: "05", content: `[WARN] Extreme dev velocity detected.`, colorClass: "text-hot-pink" },
        { num: "06", content: `> Ready for matrix synthesis.`, colorClass: "text-primary font-bold" }
      ]);
      lineCountRef.current = 6;
    }
  }, [submittedUsername]);

  // Generate Starfield
  useEffect(() => {
    const starCount = 100;
    const generatedStars: StarProps[] = [];
    for (let i = 0; i < starCount; i++) {
      generatedStars.push({
        id: i,
        size: Math.random() * 2 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: Math.random() * 3 + 2,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    setStars(generatedStars);
  }, []);

  // Scroll terminal to bottom locally (does not scroll page/slide)
  useEffect(() => {
    const feed = terminalFeedRef.current;
    if (feed) {
      feed.scrollTop = feed.scrollHeight;
    }
  }, [lines]);

  const addLine = (content: string, colorClass = "text-white/50") => {
    lineCountRef.current += 1;
    const lineNum = lineCountRef.current.toString().padStart(2, '0');
    setLines((prev) => [
      ...prev,
      { num: lineNum, content, colorClass }
    ]);
  };

  const handleTriggerClick = () => {
    const now = Date.now();
    if (now - lastTriggerTimeRef.current < 1000) return;
    lastTriggerTimeRef.current = now;

    console.log("[ASTRAL_CONSOLE] handleTriggerClick called, username:", submittedUsername);
    const name = submittedUsername || "UNIDENTIFIED_ENTITY";
    
    // Reset terminal feed to compilation baseline
    lineCountRef.current = 6;
    setLines([
      { num: "01", content: `[SYS] Initializing astral handshake...`, colorClass: "text-primary" },
      { num: "02", content: `> Target identified: @${name}`, colorClass: "text-white/70" },
      { num: "03", content: `[LINK] Handshake established.`, colorClass: "text-cyber-teal" },
      { num: "04", content: `> Scraping orbital repos...`, colorClass: "text-white/40" },
      { num: "05", content: `[WARN] Extreme dev velocity detected.`, colorClass: "text-hot-pink" },
      { num: "06", content: `> Ready for matrix synthesis.`, colorClass: "text-primary font-bold" }
    ]);

    setTimeout(() => {
      addLine(`[CORE] Executing gravity pull...`, "text-white font-bold");
      addLine(`[SYNC] COMPILING @${name.toUpperCase()}'S ${currentYear} DECK...`, "text-primary font-bold animate-pulse");
    }, 100);

    // Haptic/Visual feedback
    setIsActive(true);
    setTimeout(() => setIsActive(false), 150);

    // Trigger deck synthesis transition after compiling feedback
    setTimeout(() => {
      onPullDeck(submittedUsername || "");
    }, 1600);
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#020408] text-[#dde4dd] antialiased flex flex-col justify-center items-center p-4 md:p-6 overflow-hidden select-none">
      {/* Immersive Cosmic Background */}
      <div className="stars-container">
        {/* Nebula Blobs */}
        <div className="nebula w-[800px] h-[800px] bg-primary top-[-20%] left-[-10%]"></div>
        <div className="nebula w-[700px] h-[700px] bg-cyber-teal bottom-[-20%] right-[-10%] [animation-delay:-10s]"></div>
        <div className="nebula w-[600px] h-[600px] bg-hot-pink top-[20%] right-[10%] [animation-delay:-20s]"></div>
        
        {/* Starfield Generator */}
        <div id="starfield">
          {stars.map((star) => (
            <div
              key={star.id}
              className="star"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                // @ts-ignore
                "--duration": `${star.duration}s`,
                // @ts-ignore
                "--opacity": star.opacity,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Background Contribution Star Grid for the star theme */}
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-45">
        <ContributionStarsGrid />
      </div>

      {/* Main Container */}
      <section className="w-full max-w-4xl relative z-10 flex flex-col items-center justify-between h-full max-h-[90vh] py-2 md:py-6">
        {/* Header Section */}
        <div className="text-center space-y-2 md:space-y-3">
          <div className="inline-flex items-center gap-3 px-4 py-1 border border-primary/20 rounded-full font-mono text-[9px] md:text-[10px] text-primary uppercase tracking-[0.4em] bg-primary/5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="font-bold">System Status // Gravity_Optimal</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold text-white italic uppercase tracking-tighter leading-[0.9]">
            Explore <br className="hidden md:inline" /> Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyber-teal">Orbit.</span>
          </h1>
          
          <p className="text-white/50 max-w-lg mx-auto text-xs md:text-sm font-medium leading-relaxed font-body">
            Deconstruct your cosmic development matrix. Authenticate with GitHub to synthesize your {currentYear} developer deck.
          </p>
        </div>

        {/* Astral Console */}
        <div className="w-full astral-glass liquid-border rounded-[2rem] overflow-hidden my-3 md:my-4 flex-1 flex flex-col justify-center min-h-0">
          <div className="flex flex-col md:flex-row h-full min-h-0">
            {/* Interaction Zone */}
            <div className="flex-1 p-6 md:p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5">
              <div className="space-y-6 md:space-y-8">
                <div className="space-y-4">
                  {/* Locked username input copied from landing without lock icons or badges */}
                  <div className="relative group">
                    <input
                      type="text"
                      id="gh-username"
                      readOnly
                      className="w-full px-6 py-3 rounded-xl bg-[#0a0f0b]/80 border border-primary/25 text-white/50 font-mono text-xs tracking-wider cursor-not-allowed focus:outline-none text-center"
                      value={submittedUsername || ""}
                      placeholder="No Uplink Detected"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Pull My Wrapped Deck inside a tube properly */}
                  <div className="bg-black/60 border border-white/10 p-1 rounded-2xl flex items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerClick();
                      }}
                      className={`hardware-trigger w-full font-display bg-primary text-black font-extrabold uppercase italic text-base md:text-lg tracking-tighter py-3.5 px-6 rounded-xl flex items-center justify-center hover:bg-white transition-all duration-500 group cursor-pointer ${
                        isActive ? "bg-white" : ""
                      }`}
                      id="trigger-btn"
                    >
                      Pull My Wrapped Deck
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 font-mono text-[9px] text-white/30 tracking-widest uppercase">
                      <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
                      OAuth Secured
                    </div>
                    <div className="w-px h-3 bg-white/10"></div>
                    <div className="flex items-center gap-2 font-mono text-[9px] text-white/30 tracking-widest uppercase">
                      <span className="material-symbols-outlined text-sm text-primary">data_object</span>
                      No Data Stored
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seamless Terminal */}
            <div className="flex-1 p-6 md:p-10 flex flex-col justify-between bg-black/40 min-h-[220px] md:min-h-0">
              <div className="flex flex-col h-full space-y-3 min-h-0">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                    <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
                    <span className="w-2 h-2 rounded-full bg-green-500/80"></span>
                  </div>
                  <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">
                    Astral Feed v2.{shortYear}
                  </span>
                </div>

                <div
                  ref={terminalFeedRef}
                  id="terminal-feed"
                  className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2.5 pr-2 scroll-smooth hide-scrollbar min-h-0 max-h-[180px] md:max-h-none"
                >
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex gap-2.5 animate-in fade-in slide-in-from-left-1 duration-300">
                      <span className="text-white/10 select-none font-bold">{line.num}</span>
                      <span className={`${line.colorClass} font-medium leading-relaxed`}>{line.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="font-mono text-[9px] text-white/20 uppercase tracking-[0.4em] animate-pulse text-center">
          Establishing Secure Handshake with GitHub API
        </div>
      </section>
    </div>
  );
}
