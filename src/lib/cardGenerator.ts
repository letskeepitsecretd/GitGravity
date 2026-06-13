import { toPng } from 'html-to-image';

export interface GitHubStats {
  username: string;
  name: string;
  totalCommits: number;
  longestStreak: number;
  totalStars: number;
  totalPRs: number;
  topLanguages: Array<{ name: string; percent: number }>;
  avatarUrl?: string;
}

export interface CardDNA {
  era: string;
  pattern: string;
  accent: string;
  typography: string;
  isLightMode: boolean;
  year: number;
}

// 7 Master Eras
export const ERAS = ['ERA_SPLIT', 'ERA_BLOCKS', 'ERA_ARCHES', 'ERA_CLASSIC', 'ERA_OVERLAP', 'ERA_SPIRAL', 'ERA_FLOATING'];

// 9 Background Patterns
export const PATTERNS = ['CHECKER', 'STRIPES', 'DOTS', 'WAVES', 'ZIGZAG', 'GRID', 'HYPNOTIC', 'STARBURST', 'SOLID'];

// 12 Hyper-Vibrant Accents
export const ACCENTS = ['#1ed760', '#ff4632', '#7a68fa', '#e8f038', '#ff82a8', '#000000', '#0ea5e9', '#f97316', '#14b8a6', '#ffffff', '#ec4899', '#84cc16'];

// 5 Typography Styles
export const TYPOGRAPHY = ['font-sans', 'font-mono', 'font-serif', 'font-black', 'font-bold'];

export function generateCardDNA(stats: GitHubStats): CardDNA {
  const hash = stats.username.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const currentYear = new Date().getFullYear();
  
  const commitFactor = Math.floor(stats.totalCommits / 50);
  const langSeed = stats.topLanguages.length > 0 ? stats.topLanguages[0].name.charCodeAt(0) : 42;

  // Era depends on username, month, primary language, commits, stars, and streak for high variety
  const eraIdx = (hash + new Date().getMonth() + langSeed + commitFactor + stats.totalStars + stats.longestStreak) % ERAS.length;
  // Pattern depends on commits, streak, and primary language
  const patternIdx = (hash + commitFactor + stats.longestStreak + langSeed) % PATTERNS.length;
  // Accent depends on language, commits, and stars
  const accentIdx = (hash + langSeed + commitFactor + stats.totalStars) % ACCENTS.length;
  // Typography depends on year and streak
  const typoIdx = (hash + currentYear + stats.longestStreak) % TYPOGRAPHY.length;
  
  // Light mode selection depends on multiple metrics for variety
  const isLightMode = ((hash + commitFactor + langSeed) % 2 === 0);
  const finalAccent = (ACCENTS[accentIdx] === '#000000' && !isLightMode) ? '#1ed760' : ACCENTS[accentIdx];

  return {
    era: ERAS[eraIdx],
    pattern: PATTERNS[patternIdx],
    accent: finalAccent,
    typography: TYPOGRAPHY[typoIdx],
    isLightMode,
    year: currentYear
  };
}

export function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export const captureCardElement = async (
  node: HTMLElement | null, 
  username: string, 
  metadata?: { era?: string; pattern?: string; accent?: string },
  delayMs: number = 2500
) => {
  if (!node) return;

  try {
    // 1. Wait for fonts and imagery assets to stabilize completely
    if (typeof document !== 'undefined' && document.fonts) {
      try {
        await document.fonts.ready;
      } catch (e) {
        console.warn("Fonts ready promise failed:", e);
      }
    }
    
    // Wait for all images inside the element to load
    const imgs = Array.from(node.getElementsByTagName('img'));
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }));

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs)); // Wait for full layout paint
    }

    // 2. Capture configuration with CORS and performance safety flags
    let dataUrl = '';
    try {
      dataUrl = await toPng(node, {
        cacheBust: true,
        skipFonts: true, // Skip fonts to prevent browser hanging issues
        style: {
          transform: 'scale(1)', // Ensure no 3D parallax distortion during snapshot
        },
      });
    } catch (captureErr) {
      console.warn("Standard capture failed (likely CORS). Attempting fallback capture by replacing external images...", captureErr);
      
      const imgElements = Array.from(node.getElementsByTagName('img'));
      const swappedPlaceholders: Array<{ parent: HTMLElement; placeholder: HTMLElement; originalImg: HTMLElement }> = [];
      
      for (const img of imgElements) {
        const parent = img.parentElement;
        if (parent) {
          const placeholder = document.createElement('div');
          placeholder.className = img.className;
          placeholder.style.backgroundColor = '#18181b'; // bg-zinc-900
          placeholder.style.display = 'flex';
          placeholder.style.alignItems = 'center';
          placeholder.style.justifyContent = 'center';
          placeholder.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 55%; height: 55%; color: white;">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.028-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          `;
          
          parent.replaceChild(placeholder, img);
          swappedPlaceholders.push({ parent, placeholder, originalImg: img });
        }
      }

      try {
        dataUrl = await toPng(node, {
          cacheBust: true,
          skipFonts: true,
          style: {
            transform: 'scale(1)',
          },
        });
      } catch (fallbackErr) {
        console.error("Fallback capture also failed:", fallbackErr);
        // Restore elements before throwing
        for (const { parent, placeholder, originalImg } of swappedPlaceholders) {
          parent.replaceChild(originalImg, placeholder);
        }
        throw fallbackErr;
      }

      // Restore original image elements
      for (const { parent, placeholder, originalImg } of swappedPlaceholders) {
        parent.replaceChild(originalImg, placeholder);
      }
    }

    if (!dataUrl) {
      throw new Error("Captured image data is empty");
    }

    // 3. Upload to Catbox client-side (extremely reliable, bypasses serverless timeouts)
    let catboxUrl = '';
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
    } catch (e) {
      console.warn("Client-side Catbox upload failed during card save:", e);
    }

    // 4. Post to backend to save the clean file
    await fetch('/api/admin/save-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username, 
        image: dataUrl,
        url: catboxUrl,
        era: metadata?.era,
        pattern: metadata?.pattern,
        accent: metadata?.accent
      }),
    });

    console.log('Card rendered and saved successfully.');
    return dataUrl;
  } catch (error) {
    console.error('Snapshot generation crashed:', error);
  }
};
