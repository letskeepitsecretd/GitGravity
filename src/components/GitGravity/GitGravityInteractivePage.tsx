"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GitGravityDashboard, { UserData, ContributionStarsGrid } from "./GitGravityDashboard";
import { TelemetryUserData } from "./CommitGravityAnalytics";
import { Layers, ArrowRight } from "lucide-react";
import CommitScrollSlide from "@/components/CommitScrollSlide";
import AstralConsoleSlide from "@/components/AstralConsoleSlide";
import { FlickeringGlowGrid } from "@/components/ui/flickering-glow-grid";
import WrappedDeck from "./WrappedDeck";
import { generateCardDNA, GitHubStats, captureCardElement, dataURLtoBlob } from "@/lib/cardGenerator";
import GeneratedCard from "@/components/GeneratedCard";
import { toPng } from 'html-to-image';

interface GitGravityInteractivePageProps {
  initialUsername?: string;
  onBack?: () => void;
}

export default function GitGravityInteractivePage({
  initialUsername = "",
  onBack,
  }: GitGravityInteractivePageProps) {
  const [username, setUsername] = useState(initialUsername);
  const [submittedUsername, setSubmittedUsername] = useState<string | null>(initialUsername ? initialUsername : null);
  const [loading, setLoading] = useState(initialUsername ? true : false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const captureBgRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [showWrappedDeck, setShowWrappedDeck] = useState(false);
  const [hasAutoSaved, setHasAutoSaved] = useState(false);

  const telemetryData: TelemetryUserData | null = userData
    ? {
        ...userData,
        totalCommits: userData.totalCommits || 0,
        longestStreak: userData.longestStreak || 0,
        totalPRs: userData.totalPRs || 0,
        highestCommitDay: userData.momentum?.highestDay || "Tuesday",
        highestCommitCount: userData.momentum?.highestCount || 24,
        lowestCommitDay: userData.momentum?.lowestDay || "Saturday",
        lowestCommitCount: userData.momentum?.lowestCount || 2,
        weeklyCommits: userData.momentum?.chartData?.map((item: any) => item.count) || [5, 18, 25, 32, 20, 14, 2],
      }
    : null;

  const stats = useMemo<GitHubStats | null>(() => {
    if (!userData) return null;
    return {
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
    };
  }, [userData]);

  const cardDNA = useMemo(() => {
    if (!stats) return null;
    return generateCardDNA(stats);
  }, [stats]);

  useEffect(() => {
    if (hasAutoSaved || !userData || !cardDNA || !stats) return;

    const autoSaveInBg = async () => {
      const el = captureBgRef.current;
      if (!el) return;
      try {
        // captureCardElement has a built-in delay (defaulting to 3.5s here) and awaits fonts and image preloading
        const dataUrl = await captureCardElement(el, userData.username, {
          era: cardDNA.era,
          pattern: cardDNA.pattern,
          accent: cardDNA.accent
        }, 3500);

        if (dataUrl) {
          setHasAutoSaved(true);
        }
      } catch (err) {
        console.warn("Background auto-archiving failed:", err);
      }
    };
    autoSaveInBg();
  }, [userData, hasAutoSaved, cardDNA, stats]);

  useEffect(() => {
    if (initialUsername) {
      triggerFetch(initialUsername);
    }
  }, [initialUsername]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop > 10) {
        setShowScrollHint(false);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [userData, loading]);


  const triggerFetch = async (uname: string) => {
    setLoading(true);
    setSubmittedUsername(uname);
    setError(null);
    setShowWrappedDeck(false);
    setHasAutoSaved(false);

    let fetchedData: UserData | null = null;
    let fetchError: string | null = null;

    try {
      const res = await fetch(`/api/wrapped?username=${uname}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        fetchError = errData.error || "Invalid username or account not found";
      } else {
        fetchedData = await res.json();
      }
    } catch (err: any) {
      fetchError = err.message || "Invalid username or account not found";
    }

    if (fetchError) {
      setError(fetchError);
      setUserData(null);
      setLoading(false);
      setSubmittedUsername(null);
    } else {
      setUserData(fetchedData);
      setError(null);
      setTimeout(() => {
        setLoading(false);
      }, 4500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    triggerFetch(username);
  };

  const handleGenerateCard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      console.log("Starting card generation process...");
      
      // 1. Verify username input exists
      if (!username) {
        alert("Please enter a valid GitHub username first.");
        return;
      }

      setLoading(true);
      setSubmittedUsername(username);
      setError(null);
      setShowWrappedDeck(false);
      setHasAutoSaved(false);

      // 1.5. Fetch the live user data first
      console.log("Fetching live GitHub data...");
      let fetchedData: UserData | null = null;
      try {
        const res = await fetch(`/api/wrapped?username=${username}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Invalid username or account not found");
        }
        fetchedData = await res.json();
      } catch (fetchErr: any) {
        const errMsg = fetchErr.message || "Invalid username or account not found";
        setError(errMsg);
        setUserData(null);
        setLoading(false);
        setSubmittedUsername(null);
        alert(`Failed to fetch GitHub stats: ${errMsg}`);
        return;
      }

      // Set user data to render the card in the DOM
      setUserData(fetchedData);
      
      // Wait for Next.js to render the card in the DOM (loading screen is shown)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 2. Your canvas capturing logic (html-to-image / toPng)
      // Wrap it tightly to check if the browser canvas engine is crashing
      let dataUrl;
      try {
        const cardElement = document.getElementById('git-card-element');
        if (!cardElement) {
          throw new Error("Card capture element not found in the DOM.");
        }
        dataUrl = await toPng(cardElement, {
          cacheBust: true,
          style: { transform: 'scale(1)' }
        });
      } catch (canvasErr: any) {
        setLoading(false);
        alert(`frontend canvas capture failed: ${canvasErr.message || canvasErr}`);
        return;
      }

      if (!dataUrl) {
        setLoading(false);
        alert("Generated data URL is completely empty. Canvas extraction failed.");
        return;
      }

      console.log("Canvas captured successfully. Uploading to Cloud Storage client-side...");

      // 2.5. Upload to Catbox client-side first (highly reliable, bypasses Vercel network restrictions)
      let catboxUrl = "";
      try {
        const blob = dataURLtoBlob(dataUrl);
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', blob, `gitgravity-${username}.png`);

        const catboxRes = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: formData,
        });
        if (catboxRes.ok) {
          const text = await catboxRes.text();
          if (text && text.startsWith('https://')) {
            catboxUrl = text.trim();
          }
        }
      } catch (uploadErr: any) {
        console.warn("Client-side cloud upload failed, letting backend fallback try:", uploadErr);
      }

      console.log("Handoff to backend proxy starting...");

      // 3. Post to your backend endpoint
      const response = await fetch('/api/admin/save-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username,
          style: { era: fetchedData?.gravityTier ? 'modern' : 'classic', pattern: 'grid', accent: 'green' },
          imageString: dataUrl,
          url: catboxUrl
        }),
      });

      // 4. Handle HTTP Status codes explicitly
      if (!response.ok) {
        const errText = await response.text();
        setLoading(false);
        alert(`Server rejected request! Status: ${response.status}. Details: ${errText}`);
        return;
      }

      const result = await response.json();
      
      // Let the loader finish animating for smooth transition
      setTimeout(() => {
        setLoading(false);
      }, 2000);

      alert(`Success! Card saved dynamically. Cloud URL: ${result.url}`);
      
    } catch (globalError: any) {
      setLoading(false);
      // This will catch any silent CORS blocks, network dropouts, or Vercel timeouts
      alert(`CRITICAL PIPELINE CRASH: ${globalError.message || globalError}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white overflow-x-hidden relative flex flex-col justify-center">
      {/* Green GitHub grid background — always shown on landing */}
      {!submittedUsername && <FlickeringGlowGrid />}
      {/* Fixed Cosmic Space Background — shown after submit */}
      {submittedUsername && !loading && !error && (
        <ContributionStarsGrid />
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Landing Input Form */}
        {!submittedUsername && (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto w-full px-6 text-center z-10 font-mono flex flex-col items-center"
          >
            {/* Structured Premium Black Card Box */}
            <div className="w-full bg-[#0d1117]/90 backdrop-blur-xl border border-[#30363d] p-8 sm:p-10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col items-center">
              {/* GitHub logo in a box */}
              <div className="mb-6 inline-flex p-3 rounded-2xl bg-[#161b22] border border-[#30363d] text-[#39d353]">
                <svg 
                  role="img" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-8 h-8 animate-pulse"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </div>
              <h1 className="text-3xl font-black tracking-wider text-white">
                Discover your <span className="text-[#39d353]">GitGravity</span>
              </h1>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                Weigh your code repository mass, align system coordinates, and capture your 3D development orbit.
              </p>

              <form onSubmit={handleGenerateCard} className="mt-8 flex flex-col gap-4 w-full">
              <div className="w-full flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Enter GitHub username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full px-5 py-4 text-sm rounded-xl bg-[#161b22] border border-[#30363d] text-white focus:outline-none focus:border-emerald-500 transition text-center font-mono placeholder-slate-600"
                />
                {error && (
                  <p className="text-xs text-[#ff7b72] font-semibold text-center font-mono animate-pulse">
                    {error}
                  </p>
                )}
              </div>
                <div className="flex gap-3 w-full items-center">
                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="px-5 py-3 rounded-full border border-[#30363d] hover:bg-[#161b22] transition-all font-bold text-sm text-white cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  <div className="flex-1 bg-black/60 border border-[#30363d] p-1 rounded-full flex items-center">
                    <button
                      type="submit"
                      className="w-full py-3 text-xs font-semibold uppercase tracking-widest text-white bg-white/5 hover:bg-white/10 active:bg-white/15 backdrop-blur-md border border-white/5 rounded-full transition duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] cursor-pointer text-center"
                    >
                      Generate Wrapped
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Step 2: GitHub Green Blocks Loading Screen */}
        {submittedUsername && loading && (
          <motion.div
            key="loading-compiler"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0d1117] flex flex-col items-center justify-center text-white z-50 font-mono"
          >
            {/* Radial ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0e4429_0%,_#0d1117_70%)] opacity-40 pointer-events-none" />

            {/* 4×4 GitHub contribution grid */}
            <div className="relative w-40 h-40 grid grid-cols-4 grid-rows-4 gap-1.5 border border-[#30363d] p-3 bg-[#161b22] rounded-xl shadow-[0_0_40px_rgba(35,134,54,0.2)] z-10">
              {Array.from({ length: 16 }).map((_, i) => {
                const delays = [0.1, 0.4, 0.2, 0.7, 0.5, 0.9, 0.3, 0.6, 0.8, 1.1, 0.4, 0.7, 1.2, 0.3, 0.9, 0.5];
                return (
                  <motion.div
                    key={i}
                    className="w-full h-full rounded-[2px]"
                    initial={{ backgroundColor: "#161b22" }}
                    animate={{
                      backgroundColor: ["#161b22", "#0e4429", "#26a641", "#39d353", "#161b22"]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: delays[i]
                    }}
                  />
                );
              })}
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 text-center z-10"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-[#39d353] animate-spin" />
                <span className="text-[10px] tracking-[0.3em] text-[#39d353] font-bold uppercase">Compiling Commit Grid...</span>
              </div>
              <h3 className="text-lg font-bold text-white">@{submittedUsername}&apos;s Spacetime Core</h3>
              <p className="text-[10px] text-slate-500 italic mt-2">Constructing orbital gravity map models</p>
            </motion.div>
          </motion.div>
        )}

        {/* Step 3: Immersive Viewport Renderers */}
        {submittedUsername && !loading && userData && !error && (
          <motion.div
            key="active-wrapped-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-30"
          >
            {/* Scrollable Snap Container */}
            <div
              ref={containerRef}
              className="h-screen w-full overflow-y-auto snap-y snap-mandatory scroll-smooth relative"
            >
              {/* Slide 1: GitGravity Orbit Dashboard */}
              <div className="h-screen w-full snap-start snap-always relative flex flex-col justify-between bg-[#020408]">
                <div className="flex-1 overflow-hidden bg-[#020408]">
                  <GitGravityDashboard
                    data={userData}
                    onBack={onBack || (() => {
                      setSubmittedUsername(null);
                      setUserData(null);
                      setError(null);
                      setShowWrappedDeck(false);
                    })}
                  />
                </div>
                {/* Scroll Down Indicator — fades out after first scroll */}
                <AnimatePresence>
                  {showScrollHint && (
                    <motion.div
                      key="scroll-hint"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, y: 8, transition: { duration: 0.5, ease: "easeOut" } }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-50 pointer-events-none animate-bounce"
                    >
                      <span className="text-[9px] tracking-widest text-[#39d353] font-bold uppercase">SCROLL DOWN FOR COMMIT GRAVITY</span>
                      <svg className="w-4 h-4 text-[#39d353]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Slide 2: CommitScrollSlide */}
              {telemetryData && (
                <>
                  <div className="h-screen w-full snap-start snap-always relative">
                    <CommitScrollSlide
                      totalCommits={telemetryData.totalCommits}
                      longestStreak={telemetryData.longestStreak || 0}
                      totalStars={telemetryData.totalStars}
                      totalPRs={telemetryData.totalPRs || 0}
                    />
                  </div>
                  {/* Slide 3: Astral Console */}
                  <div className="h-screen w-full snap-start snap-always relative">
                    <AstralConsoleSlide
                      submittedUsername={submittedUsername}
                      onPullDeck={() => {
                        console.log("[INTERACTIVE_PAGE] onPullDeck callback triggered, setting showWrappedDeck to true");
                        setShowWrappedDeck(true);
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Wrapped Deck Overlay */}
            <AnimatePresence>
              {showWrappedDeck && (
                <motion.div
                  key="wrapped-deck-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-50 bg-[#0d1117] overflow-y-auto"
                >
                  <WrappedDeck
                    userData={userData}
                    onBack={() => setShowWrappedDeck(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Step 4: Elegant Error / Warning Sorry Screen */}
        {submittedUsername && !loading && error && (
          <motion.div
            key="error-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto w-full px-6 text-center z-10 font-mono"
          >
            <div className="mb-6 inline-flex p-4 rounded-2xl bg-[#1c1212] border border-[#ff7b72]/30 text-[#ff7b72] shadow-[0_0_20px_rgba(255,123,114,0.1)]">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-8 h-8 animate-pulse">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
            </div>

            <h1 className="text-lg font-black tracking-widest text-[#ff7b72] uppercase">
              COSMIC SYNC ERROR
            </h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed border border-[#30363d] bg-[#0d1117]/80 p-5 rounded-xl shadow-inner">
              We could not establish spacetime coordinates for the profile <span className="text-white font-extrabold">@{submittedUsername}</span>.
              <br /><br />
              <span className="text-[#ff7b72] font-black uppercase text-[10px] block border-t border-[#30363d]/50 pt-2 mt-2 font-mono">
                REASON: {error}
              </span>
            </p>

            <button
              onClick={onBack || (() => {
                setSubmittedUsername(null);
                setUserData(null);
                setError(null);
                setUsername("");
              })}
              className="mt-6 w-full py-3 rounded-xl border border-[#ff7b72]/30 hover:border-[#ff7b72] bg-[#0d1117] hover:bg-[#1c1212]/30 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-md"
            >
              Re-enter Coordinates
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {userData && stats && cardDNA && (
        <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -100, opacity: 0.99, pointerEvents: 'none' }}>
          <div ref={captureBgRef} id="git-card-element" style={{ width: '380px' }}>
            <GeneratedCard
              animatedCommits={userData.totalCommits || 0}
              animatedStars={userData.totalStars || 0}
              animatedStreak={userData.longestStreak || 0}
              dna={cardDNA}
              stats={stats}
            />
          </div>
        </div>
      )}
    </div>
  );
}
