"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateCardDNA, captureCardElement, dataURLtoBlob, GitHubStats } from '@/lib/cardGenerator'
import GeneratedCard from '@/components/GeneratedCard'


interface SuperCardOverlayProps {
  stats: GitHubStats
  shareTarget: 'whatsapp' | 'instagram' | 'linkedin' | 'twitter' | null
  onClose: () => void
  triggerSound: (type: "tap" | "success" | "transition" | "float") => void
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

export default function SuperCardOverlay({ stats, shareTarget, onClose, triggerSound }: SuperCardOverlayProps) {
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [commits, setCommits] = useState(0)
  const [streak, setStreak] = useState(0)
  const [stars, setStars] = useState(0)

  const cardRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const targetRot = useRef({ x: 0, y: 0 })
  const currentRot = useRef({ x: 0, y: 0 })
  const rafId = useRef<number | null>(null)
  const isHovered = useRef(false)
  const reducedMotionRef = useRef(false)

  const cardDNA = useMemo(() => generateCardDNA(stats), [stats.username])
  const currentYear = new Date().getFullYear(); // Dynamic Global Year

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2500)
  }

  // AUTO-ARCHIVE CAPTURED CARD TO SERVER
  const autoArchiveCard = async () => {
    const el = captureRef.current
    if (!el) return
    try {
      // captureCardElement has a built-in delay and awaits fonts and image preloading
      await captureCardElement(el, stats.username, {
        era: cardDNA.era,
        pattern: cardDNA.pattern,
        accent: cardDNA.accent
      }, 3000);
    } catch (err) {
      console.warn("Failed to auto-archive card to server:", err)
    }
  }

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let startTimestamp: number | null = null
    const durations = { commits: 2200, streak: 1400, stars: 1600 }

    function animateCounters(timestamp: number) {
      if (!startTimestamp) startTimestamp = timestamp
      const progressCommits = (timestamp - startTimestamp) / durations.commits
      const progressStreak = (timestamp - startTimestamp) / durations.streak
      const progressStars = (timestamp - startTimestamp) / durations.stars

      if (progressCommits < 1) setCommits(Math.floor(stats.totalCommits * easeOutQuart(progressCommits)))
      else setCommits(stats.totalCommits)

      if (progressStreak < 1) setStreak(Math.floor(stats.longestStreak * easeOutQuart(progressStreak)))
      else setStreak(stats.longestStreak)

      if (progressStars < 1) setStars(Math.floor(stats.totalStars * easeOutQuart(progressStars)))
      else setStars(stats.totalStars)

      if (progressCommits < 1 || progressStreak < 1 || progressStars < 1) {
        requestAnimationFrame(animateCounters)
      } else {
        // Automatically save to server once counter animation is complete
        setTimeout(autoArchiveCard, 1000)
      }
    }
    const timer = setTimeout(() => requestAnimationFrame(animateCounters), 800)
    return () => clearTimeout(timer)
  }, [stats])

  function animateTilt() {
    const dx = Math.abs(currentRot.current.x - targetRot.current.x)
    const dy = Math.abs(currentRot.current.y - targetRot.current.y)

    if (dx < 0.01 && dy < 0.01 && !isHovered.current) {
      currentRot.current = { x: 0, y: 0 }
      if (cardRef.current) cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
      rafId.current = null
      return 
    }

    currentRot.current.x = lerp(currentRot.current.x, targetRot.current.x, 0.07)
    currentRot.current.y = lerp(currentRot.current.y, targetRot.current.y, 0.07)

    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1000px) rotateX(${currentRot.current.x}deg) rotateY(${currentRot.current.y}deg)`
    }
    rafId.current = requestAnimationFrame(animateTilt)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotionRef.current) return
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    targetRot.current = { x: dy * -10, y: dx * 14 }
    if (!rafId.current) rafId.current = requestAnimationFrame(animateTilt)
  }

  // DYNAMIC SHARE MESSAGE
  const shareText = `My GitGravity ${currentYear} Wrapped 🚀\n💻 ${stats.totalCommits} commits pushed\n🔥 ${stats.longestStreak} day streak\n⭐ ${stats.totalStars} stars earned\n→ gitgravity.vercel.app`

  const shareFile = async (): Promise<boolean> => {
    const el = captureRef.current;
    if (!el) return false;
    try {
      const dataUrl = await captureCardElement(el, stats.username, {
        era: cardDNA.era,
        pattern: cardDNA.pattern,
        accent: cardDNA.accent
      }, 500);

      if (!dataUrl) return false;

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `gitgravity-${stats.username}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My GitGravity Wrapped',
          text: shareText,
        });
        return true;
      }
    } catch (e) {
      console.warn("Native share failed:", e);
    }
    return false;
  };

  const uploadToCatbox = async (blob: Blob): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', blob, `gitgravity-${stats.username}.png`);

      const res = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) return null;
      const text = await res.text();
      // Catbox returns the direct URL as plain text
      if (text && text.startsWith('https://')) return text.trim();
      return null;
    } catch (e) {
      console.warn("Catbox upload failed:", e);
      return null;
    }
  };

  const executeShareAction = async () => {
    triggerSound("tap")
    if (!shareTarget) return

    // Try native file sharing first (great for mobile)
    const sharedNatively = await shareFile();
    if (sharedNatively) return;

    // Desktop/Fallback sharing flow:
    showToast("Uploading card for sharing...");

    // 1. Capture the card as a blob for upload
    let catboxUrl: string | null = null;
    const el = captureRef.current;
    if (el) {
      try {
        const dataUrl = await captureCardElement(el, stats.username, {
          era: cardDNA.era,
          pattern: cardDNA.pattern,
          accent: cardDNA.accent
        }, 500);

        if (dataUrl) {
          const blob = dataURLtoBlob(dataUrl);
          catboxUrl = await uploadToCatbox(blob);
        }
      } catch (e) {
        console.warn("Card capture/upload failed:", e);
      }
    }

    // 2. Also trigger local download
    downloadCard();

    // 3. Generate share link with persistent image URL
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gitgravity.vercel.app';
    const shareUrl = catboxUrl
      ? `${origin}/card/${stats.username}?img=${encodeURIComponent(catboxUrl)}`
      : `${origin}/card/${stats.username}`;
    const shareTextWithUrl = `${shareText}\n\nView Card: ${shareUrl}`;
    
    // 4. Copy the text automatically to clipboard
    try {
      await navigator.clipboard.writeText(shareTextWithUrl);
      if (shareTarget === 'instagram') {
        showToast(catboxUrl ? "Card downloaded & link copied! Paste in your Instagram Story/Bio ✨" : "Card downloaded! Upload it to your Instagram Story");
      } else {
        showToast(catboxUrl ? "Card uploaded & link copied!" : "Card downloaded & text copied!");
      }
    } catch (e) {
      console.warn("Clipboard copy failed:", e);
    }

    // 5. Open desktop intent links
    let url = ''
    if (shareTarget === 'whatsapp') url = `https://wa.me/?text=${encodeURIComponent(shareTextWithUrl)}`
    if (shareTarget === 'twitter') url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    if (shareTarget === 'linkedin') url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    if (shareTarget === 'instagram') url = 'https://www.instagram.com'
    
    if (url) {
      setTimeout(() => {
        window.open(url, '_blank', 'noopener,noreferrer')
      }, 600);
    }
  }

  async function downloadCard() {
    triggerSound("success")
    const el = captureRef.current
    if (!el) return
    try {
      // For manual user download, use a short delay since component has been visible
      const dataUrl = await captureCardElement(el, stats.username, {
        era: cardDNA.era,
        pattern: cardDNA.pattern,
        accent: cardDNA.accent
      }, 500);

      if (dataUrl) {
        const link = document.createElement('a')
        link.download = `gitgravity-${stats.username}-${currentYear}.png` // DYNAMIC FILE NAME
        link.href = dataUrl
        link.click()
      } else {
        throw new Error("Empty image captured");
      }
    } catch {
      showToast("Screenshot the card to save it")
    }
  }

  async function copyStatsText() {
    await navigator.clipboard.writeText(shareText)
    triggerSound("success")
    showToast("Copied to clipboard!")
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const buttonBg = cardDNA.accent === '#000000' ? '#1ed760' : cardDNA.accent;
  const buttonText = buttonBg === '#e8f038' || buttonBg === '#1ed760' ? '#000000' : '#ffffff';

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 overflow-y-auto flex flex-col items-center justify-start py-12 px-4">
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20 }} className="fixed top-6 left-1/2 bg-[#1ed760] text-black font-bold text-xs font-mono rounded-full px-5 py-2 z-[110]">
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={onClose} className="absolute top-6 right-6 font-mono text-zinc-500 hover:text-white text-xs p-2">[ ESC CLOSE ]</button>

      <div className="w-full max-w-sm mt-8 flex flex-col items-center">
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { isHovered.current = false; targetRot.current = { x: 0, y: 0 }; if (!rafId.current) rafId.current = requestAnimationFrame(animateTilt) }}
          onMouseEnter={() => isHovered.current = true}
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full rounded-2xl overflow-hidden"
          style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
        >
          <div ref={captureRef} id="supercard-capture" className="w-full">
            <GeneratedCard animatedCommits={commits} animatedStars={stars} animatedStreak={streak} dna={cardDNA} stats={stats}/>
          </div>
        </motion.div>

        <div className="w-full mt-8 flex flex-col gap-2.5 z-20">
          {shareTarget && (
            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={executeShareAction}
              className="w-full py-3 rounded-xl font-sans text-sm font-black border tracking-widest transition-all uppercase"
              style={{ backgroundColor: buttonBg, borderColor: buttonBg, color: buttonText, boxShadow: `0 0 20px ${buttonBg}40` }}
            >
              SHARE TO {shareTarget}
            </motion.button>
          )}

          <button onClick={downloadCard} className="w-full py-3 rounded-xl font-sans text-xs font-black bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white transition-all uppercase tracking-widest">
            DOWNLOAD GRAPHIC (.PNG)
          </button>

          <button onClick={copyStatsText} className="w-full py-3 rounded-xl font-sans text-xs font-black bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-400 hover:text-white transition-all uppercase tracking-widest">
            COPY STATS TEXT
          </button>
        </div>
      </div>
    </div>
  )
}
