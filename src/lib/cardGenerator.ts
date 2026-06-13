import { toPng } from 'html-to-image';

export interface GitHubStats {
  username: string;
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

  const eraIdx = (hash + new Date().getMonth()) % ERAS.length;
  const patternIdx = (hash + commitFactor) % PATTERNS.length;
  const accentIdx = (hash + langSeed) % ACCENTS.length;
  const typoIdx = (hash + currentYear) % TYPOGRAPHY.length;
  
  const isLightMode = (hash % 2 === 0);
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
          placeholder.style.color = '#ffffff';
          placeholder.style.fontWeight = '900';
          placeholder.style.fontSize = '2.5rem';
          placeholder.innerText = username.substring(0, 2).toUpperCase();
          
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
