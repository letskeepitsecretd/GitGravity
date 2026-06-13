import React, { useState, useRef } from 'react';
import { CardDNA, GitHubStats } from '@/lib/cardGenerator';

interface GeneratedCardProps {
  dna: CardDNA;
  stats: GitHubStats;
  animatedCommits: number;
  animatedStreak: number;
  animatedStars: number;
}

export default function GeneratedCard({ dna, stats, animatedCommits, animatedStreak, animatedStars }: GeneratedCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const cacheBusterRef = useRef<string | null>(null);
  if (!cacheBusterRef.current) {
    cacheBusterRef.current = Math.random().toString(36).substring(7);
  }
  
  const bgMain = dna.isLightMode ? '#f0ede6' : '#121212';
  const textMain = dna.isLightMode ? '#000000' : '#ffffff';
  
  const getPattern = (pattern: string) => {
    switch (pattern) {
      case 'CHECKER': return { backgroundImage: 'conic-gradient(#111 90deg, #fff 90deg 180deg, #111 180deg 270deg, #fff 270deg)', backgroundSize: '60px 60px' };
      case 'STRIPES': return { backgroundImage: 'repeating-linear-gradient(45deg, #111, #111 20px, #fff 20px, #fff 40px)' };
      case 'DOTS': return { backgroundImage: 'radial-gradient(#111 45%, transparent 45%)', backgroundSize: '40px 40px', backgroundColor: '#fff' };
      case 'ZIGZAG': return { backgroundImage: 'linear-gradient(135deg, #111 25%, transparent 25%), linear-gradient(225deg, #111 25%, transparent 25%), linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(315deg, #111 25%, #fff 25%)', backgroundPosition: '10px 0, 10px 0, 0 0, 0 0', backgroundSize: '20px 20px', backgroundColor: '#fff' };
      case 'GRID': return { backgroundImage: 'linear-gradient(#111 2px, transparent 2px), linear-gradient(90deg, #111 2px, transparent 2px)', backgroundSize: '30px 30px', backgroundColor: '#fff' };
      case 'HYPNOTIC': return { backgroundImage: `repeating-radial-gradient(circle at center, #111 0, #111 10px, #fff 10px, #fff 20px)` };
      case 'STARBURST': return { backgroundImage: 'repeating-conic-gradient(#111 0 15deg, #fff 15deg 30deg)' };
      case 'SOLID': return { backgroundColor: '#fff' };
      case 'WAVES': default: return { backgroundImage: 'repeating-radial-gradient(circle at 0 0, #111, #111 15px, #fff 15px, #fff 30px)' };
    }
  };

  const primaryLang = stats.topLanguages?.[0]?.name || 'Dev';
  const shortYear = dna.year.toString().slice(-2);

  const renderAvatar = (isSquare: boolean) => {
    const shapeClass = isSquare ? 'aspect-square' : 'aspect-square rounded-full';
    if (stats.avatarUrl && !imgFailed) {
      const avatarSrc = stats.avatarUrl.includes('?') 
        ? `${stats.avatarUrl}&nocache=${cacheBusterRef.current}` 
        : `${stats.avatarUrl}?nocache=${cacheBusterRef.current}`;
      return <img src={avatarSrc} crossOrigin="anonymous" onError={() => setImgFailed(true)} className={`w-full h-full object-cover ${shapeClass}`} alt="avatar" />;
    }
    return (
      <div className={`w-full h-full flex items-center justify-center bg-zinc-900 text-white ${shapeClass} p-4`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[60%] h-[60%] text-white">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.028-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
      </div>
    );
  };

  return (
    <div className="relative w-full aspect-[1/1.8] rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans tracking-tight border border-zinc-800/50" style={{ backgroundColor: bgMain, color: textMain }}>
      
      {/* 0. Top Header Overlay for Real Name and Username */}
      <div className="absolute top-4 left-6 right-6 flex justify-between items-center z-40 mix-blend-difference text-white pointer-events-none">
        <span className="text-[11px] font-black uppercase tracking-widest truncate max-w-[65%]">
          {stats.name || stats.username}
        </span>
        <span className="text-[9px] font-mono opacity-80 tracking-wider">
          @{stats.username}
        </span>
      </div>
      
      {/* 1. ERA_SPLIT (2025 Brutalist B&W) */}
      {dna.era === 'ERA_SPLIT' && (
        <>
          <div className="relative w-full h-[55%] flex items-center justify-center overflow-hidden border-b-[8px]" style={{ ...getPattern(dna.pattern), borderColor: bgMain }}>
            <div className="absolute left-[-10px] inset-y-0 flex items-center justify-center z-10">
              <span className={`font-black text-[120px] leading-none ${dna.typography}`} style={{ WebkitTextStroke: `3px ${dna.accent}`, color: 'transparent', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{dna.year}</span>
            </div>
            <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none" viewBox="0 0 200 200" preserveAspectRatio="none">
              <path d="M -20 60 Q 50 -10 100 100 T 220 40" fill="transparent" stroke={dna.accent} strokeWidth="2" />
            </svg>
            <div className="relative z-30 w-[60%] border-[8px] border-white shadow-2xl bg-white">{renderAvatar(true)}</div>
          </div>
          <div className="relative w-full h-[45%] p-6 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-[9px] uppercase font-bold mb-2 opacity-60">Top Vectors</h4>
                <ul className="space-y-1 text-[11px] font-black">
                  {stats.topLanguages.slice(0, 3).map((l, i) => <li key={i} className="truncate"><span className="mr-2">{i+1}</span>{l.name}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-[9px] uppercase font-bold mb-2 opacity-60">Metrics</h4>
                <ul className="space-y-1 text-[11px] font-black">
                  <li><span className="mr-2">1</span>{stats.longestStreak} Day Streak</li>
                  <li><span className="mr-2">2</span>{stats.totalStars} Stars</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-between items-end mt-4">
              <div>
                <h4 className="text-[9px] uppercase font-bold mb-1 opacity-60">Commits</h4>
                <div className={`text-5xl font-black tracking-tighter leading-none ${dna.typography}`}>{animatedCommits.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <h4 className="text-[9px] uppercase font-bold mb-1 opacity-60">Primary</h4>
                <div className={`text-xl font-black tracking-tight leading-none ${dna.typography}`}>{primaryLang}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. ERA_BLOCKS (Staggered Typography) */}
      {dna.era === 'ERA_BLOCKS' && (
        <div className="relative w-full h-full p-8 flex flex-col justify-center overflow-hidden">
          <div className="absolute bottom-0 right-0 w-[60%] h-[40%] opacity-80" style={getPattern(dna.pattern)} />
          <svg className="absolute top-10 left-0 w-[150%] h-full z-0 pointer-events-none opacity-40" viewBox="0 0 200 200"><path d="M 0 150 Q 100 100 200 180" fill="transparent" stroke={textMain} strokeWidth="0.5" /></svg>
          <div className="relative z-10 space-y-4">
            <h4 className="text-xs uppercase font-bold mb-6 tracking-widest">My Top Vector</h4>
            <div className="flex flex-col items-start space-y-2">
              <span className={`text-5xl font-black px-3 py-1 -rotate-2 ${dna.typography}`} style={{ backgroundColor: dna.accent, color: '#000' }}>{animatedCommits}</span>
              <span className={`text-3xl font-black px-2 py-1 ml-4 rotate-1 ${dna.typography}`} style={{ backgroundColor: textMain, color: bgMain }}>COMMITS</span>
              <span className={`text-2xl font-black px-2 py-1 ml-1 -rotate-1 ${dna.typography}`} style={{ backgroundColor: textMain, color: bgMain }}>{primaryLang}</span>
              <span className={`text-xl font-black px-2 py-1 ml-6 rotate-2 ${dna.typography}`} style={{ backgroundColor: textMain, color: bgMain }}>{animatedStreak} D STREAK</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. ERA_ARCHES (Concentric Minimal) */}
      {dna.era === 'ERA_ARCHES' && (
        <div className="relative w-full h-full p-6 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[180%] aspect-square rounded-full border-[1px] opacity-30 pointer-events-none" style={{ borderColor: dna.accent }}>
            <div className="absolute inset-[10%] rounded-full border-[1px] border-inherit" />
            <div className="absolute inset-[20%] rounded-full border-[1px] border-inherit" />
            <div className="absolute inset-[30%] rounded-full border-[1px] border-inherit" />
          </div>
          <div className="relative z-10 w-full flex flex-col items-center mt-12">
            <div className="w-[45%] mb-8 border-[4px] shadow-2xl" style={{ borderColor: dna.accent, borderRadius: '50%' }}>{renderAvatar(false)}</div>
            <div className={`bg-white/90 text-black px-6 py-2 rounded-full font-black text-xl text-center shadow-xl w-[90%] truncate border border-black/10 ${dna.typography}`}>{stats.name || `@${stats.username}`}</div>
            <div className="mt-16 text-center">
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Total Commits</p>
              <h2 className={`text-6xl font-black tracking-tighter mt-1 ${dna.typography}`}>{animatedCommits}</h2>
            </div>
          </div>
        </div>
      )}

      {/* 4. ERA_CLASSIC (Vibrant Offset Shadow) */}
      {dna.era === 'ERA_CLASSIC' && (
        <div className="relative w-full h-full p-8 flex flex-col" style={{ backgroundColor: dna.accent }}>
          <div className="relative w-full mt-8 flex justify-center z-10">
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 blur-sm transform translate-x-4 translate-y-4" />
            <div className="relative w-[75%] border-[8px] border-white shadow-2xl bg-white">{renderAvatar(true)}</div>
          </div>
          <div className="relative z-20 mt-12 grid grid-cols-2 gap-4 text-white drop-shadow-md">
            <div>
              <h4 className="text-[11px] font-bold mb-2">Top Vector</h4>
              <ul className={`space-y-1 text-sm font-black ${dna.typography}`}>
                <li>1 {primaryLang}</li>
                <li>2 {stats.topLanguages[1]?.name || 'HTML'}</li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-bold mb-2">Metrics</h4>
              <ul className={`space-y-1 text-sm font-black ${dna.typography}`}>
                <li>1 {stats.longestStreak} Streak</li>
                <li>2 {stats.totalStars} Stars</li>
              </ul>
            </div>
          </div>
          <div className="relative z-20 mt-auto text-white drop-shadow-md flex justify-between items-end">
            <div>
               <h4 className="text-[11px] font-bold mb-1">Commits</h4>
               <div className={`text-5xl font-black tracking-tighter ${dna.typography}`}>{animatedCommits}</div>
            </div>
            <div className="text-right">
               <h4 className="text-[11px] font-bold mb-1">Primary</h4>
               <div className={`text-2xl font-black tracking-tighter ${dna.typography}`}>{primaryLang}</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ERA_OVERLAP (2018 Artist Block) */}
      {dna.era === 'ERA_OVERLAP' && (
        <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: dna.accent, color: dna.accent === '#ffffff' || dna.accent === '#e8f038' ? '#000' : '#fff' }}>
          <div className="w-full h-[55%] flex justify-between p-6">
            <div className="w-1/2 pt-4">
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1 opacity-80">GitGravity / {shortYear}</p>
              <h3 className="text-xl font-black leading-tight tracking-tighter">Thanks for an amazing year,</h3>
            </div>
            <div className="w-[45%] h-[90%] border-4 border-white bg-zinc-900 z-20 shadow-2xl">{renderAvatar(true)}</div>
          </div>
          <div className="absolute top-[45%] left-0 w-full px-6 z-30 pointer-events-none mix-blend-normal">
            <h1 className={`text-[85px] leading-none tracking-tighter -ml-1 ${dna.typography}`} style={{ WebkitTextStroke: dna.isLightMode ? '2px #000' : '2px #fff', color: 'transparent' }}>{stats.username.substring(0, 6).toUpperCase()}</h1>
            <h1 className={`text-[85px] leading-none tracking-tighter -ml-1 -mt-8 ${dna.typography}`} style={{ color: dna.isLightMode ? '#000' : '#fff' }}>{stats.username.substring(0, 6).toUpperCase()}</h1>
          </div>
          <div className="w-full h-[45%] bg-[#121212] p-6 flex flex-col justify-end text-white z-10 border-t-8" style={{ borderColor: bgMain }}>
            <div className="grid grid-cols-3 gap-2 border-b border-zinc-800 pb-4 mb-4">
              <div><p className="text-[9px] uppercase font-bold opacity-60">Commits</p><p className={`text-xl font-black ${dna.typography}`}>{animatedCommits}</p></div>
              <div><p className="text-[9px] uppercase font-bold opacity-60">Streak</p><p className={`text-xl font-black ${dna.typography}`}>{animatedStreak}</p></div>
              <div><p className="text-[9px] uppercase font-bold opacity-60">Stars</p><p className={`text-xl font-black ${dna.typography}`}>{animatedStars}</p></div>
            </div>
            <p className={`text-xs font-bold uppercase tracking-widest text-center ${dna.typography}`} style={{ color: dna.accent }}>{primaryLang} Developer</p>
          </div>
        </div>
      )}

      {/* 6. ERA_SPIRAL (2021 Hypnotic Text) */}
      {dna.era === 'ERA_SPIRAL' && (
        <div className="relative w-full h-full p-6 overflow-hidden flex flex-col items-center justify-center text-center" style={{ backgroundColor: dna.isLightMode ? '#fff' : '#000' }}>
          <div className="absolute inset-[-50%] w-[200%] h-[200%] opacity-80 pointer-events-none z-0" style={{ backgroundImage: `repeating-radial-gradient(circle at center, transparent 0, transparent 40px, ${dna.accent} 40px, ${dna.accent} 80px)` }} />
          <div className="absolute inset-0 z-10 opacity-30 mix-blend-overlay bg-noise" />
          <div className="relative z-20 w-[60%] aspect-square rounded-full border-[8px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{ borderColor: dna.isLightMode ? '#000' : '#fff' }}>{renderAvatar(false)}</div>
          <div className="relative z-20 mt-12 w-[90%] py-6 px-4 border-[4px] bg-white text-black shadow-2xl transform -rotate-3" style={{ borderColor: dna.accent }}>
            <p className="text-[10px] uppercase font-bold tracking-widest mb-1">Commits in {dna.year}</p>
            <h2 className={`text-7xl leading-none ${dna.typography}`}>{animatedCommits}</h2>
            <div className="mt-4 flex justify-between px-4 border-t-2 border-black pt-2">
               <span className="text-xs font-bold uppercase">{primaryLang}</span>
               <span className="text-xs font-bold uppercase">{animatedStreak}D STREAK</span>
            </div>
          </div>
        </div>
      )}

      {/* 7. ERA_FLOATING (2021 Abstract Void) */}
      {dna.era === 'ERA_FLOATING' && (
        <div className="relative w-full h-full bg-[#050505] overflow-hidden text-white flex flex-col items-center justify-center p-8 text-center">
          <div className="absolute -top-[10%] -left-[20%] w-[60%] aspect-square rounded-full z-0" style={{ backgroundColor: dna.accent }} />
          <div className="absolute -bottom-[15%] -right-[15%] w-[70%] aspect-square rounded-full z-0 opacity-80" style={{ backgroundColor: dna.isLightMode ? '#fff' : dna.accent }} />
          <div className="absolute top-[40%] -left-[10%] w-[30%] aspect-square rotate-45 z-0" style={{ backgroundColor: '#ff4632' }} />
          <div className="relative z-10 w-[45%] aspect-square bg-zinc-900 border-4 border-white shadow-2xl mb-12 transform -rotate-6 transition-transform">{renderAvatar(true)}</div>
          <div className="relative z-20 space-y-4 w-full">
            <h2 className={`text-4xl leading-tight ${dna.typography}`}>You pushed <br/><span className="text-6xl" style={{ color: dna.accent }}>{animatedCommits}</span><br/>commits in {dna.year}.</h2>
            <p className="text-sm font-bold opacity-80 mt-4">That's more than 99.5% of other <br/> {primaryLang} developers.</p>
          </div>
          <div className="absolute bottom-6 w-full flex justify-between px-8 z-20">
             <span className="text-[10px] uppercase font-bold truncate max-w-[60%]">{stats.name || stats.username}</span>
             <span className="text-[10px] uppercase font-bold flex items-center gap-1">★ {animatedStars} STARS</span>
          </div>
        </div>
      )}

      {/* UNIVERSAL FOOTER LOGO */}
      <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center z-40 mix-blend-difference text-white opacity-80 pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
        <span className="text-[10px] font-bold uppercase tracking-widest">gitgravity.io</span>
      </div>
    </div>
  );
}
