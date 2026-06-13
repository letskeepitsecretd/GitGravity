"use client";
import { useState, useEffect } from 'react';
import { Activity, HardDrive, Database, Download, RefreshCw, LayoutGrid, Search, Trash2 } from 'lucide-react';
import JSZip from 'jszip';

export default function Dashboard() {
  const [sys, setSys] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const [renderId, setRenderId] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchData = () => fetch('/api/admin/metrics').then(r => r.json()).then(setSys);
  useEffect(() => { 
    fetchData(); 
    setRenderId(Math.random().toString(36).substring(7));
  }, []);

  const handleDeleteCard = async (username: string) => {
    if (!confirm(`Are you sure you want to permanently delete the card for @${username}?`)) {
      return;
    }

    setIsDeleting(username);
    try {
      const res = await fetch('/api/admin/delete-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete card');
      }

      fetchData(); // Refresh list
    } catch (err: any) {
      alert(`Error deleting card: ${err.message || err}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExport = async () => {
    if (!sys?.cards || isExporting) return;
    const exportable = sys.cards.filter((card: any) => !card.isPlaceholder);
    if (exportable.length === 0) {
      alert("No synced card coordinates available to export.");
      return;
    }
    
    setIsExporting(true);
    setExportStatus('0%');
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < exportable.length; i++) {
        const card = exportable[i];
        setExportStatus(`${Math.round((i / exportable.length) * 100)}%`);
        
        const response = await fetch(`/api/admin/card-image?username=${card.username}`);
        if (!response.ok) {
          console.warn(`Failed to fetch card image for ${card.username}`);
          continue;
        }
        const blob = await response.blob();
        zip.file(`${card.username}_gitgravity.png`, blob);
      }
      
      setExportStatus('100%');
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gitgravity_synced_cards.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to package and export deck. Please try again.");
    } finally {
      setIsExporting(false);
      setExportStatus('');
    }
  };

  if (!sys) {
    return (
      <div className="bg-[#050505] text-green-500 h-screen flex flex-col gap-4 items-center justify-center font-mono">
        <div className="w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <div className="animate-pulse tracking-[0.2em] text-xs">INITIALIZING SECURE SYSTEMS...</div>
      </div>
    );
  }

  // Show only generated cards (non-placeholders) that match the search query
  const filteredCards = sys.cards.filter((c: any) =>
    !c.isPlaceholder && c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeArtifactsCount = filteredCards.length;

  return (
    <div className="bg-[#030303] min-h-screen text-zinc-100 p-8 sm:p-12 font-mono relative overflow-x-hidden">
      
      {/* Background Matrix Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      
      {/* Inject custom keyframe scanline animation */}
      <style>{`
        @keyframes cyberScanLine {
          0% { transform: translateY(0); opacity: 0.1; }
          50% { transform: translateY(180px); opacity: 0.6; }
          100% { transform: translateY(0); opacity: 0.1; }
        }
        .animate-cyber-scan {
          animation: cyberScanLine 4s linear infinite;
        }
      `}</style>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col">
        <nav className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-12 border-b border-zinc-900 pb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-widest text-green-500 flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
              GITGRAVITY // SUPERADMIN
            </h1>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Air-Gapped Operational Control Core</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="border border-zinc-800 p-3 bg-zinc-950/80 hover:bg-zinc-900 hover:border-green-500/50 hover:text-green-500 text-zinc-400 transition-all rounded-lg flex items-center justify-center cursor-pointer">
              <RefreshCw size={16} />
            </button>
            <button 
              onClick={handleExport} 
              disabled={isExporting}
              className="bg-green-950/20 border border-green-500/30 hover:border-green-500 hover:bg-green-950/40 text-xs px-5 py-3 text-green-500 font-bold transition-all rounded-lg flex gap-2.5 items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <span>EXPORTING {exportStatus}...</span>
                </>
              ) : (
                <>
                  <Download size={14} /> EXPORT {activeArtifactsCount} SYNCED DECK(S)
                </>
              )}
            </button>
          </div>
        </nav>

        {/* HUD Metrics Panel */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <MetricCard label="ACTIVE CONNECTIONS" val={sys.connections} icon={<Activity className="text-green-500/50"/>} desc="Total connected client vectors" />
          <MetricCard label="COMPILING QUEUE" val={sys.queue} icon={<Database className="text-amber-500/50"/>} desc="Background rendering thread load" />
          <MetricCard label="HARDWARE LOAD" val={sys.load} icon={<HardDrive className="text-cyan-500/50"/>} desc="Multi-core compute capacity" />
          <MetricCard label="TOTAL ARCHIVE" val={sys.issued} icon={<LayoutGrid className="text-purple-500/50"/>} desc="Artifact entries in filesystem" />
        </section>

        {/* Gallery Section */}
        <section className="bg-zinc-950/45 border border-zinc-900 rounded-xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <h3 className="text-zinc-400 flex items-center gap-2.5 text-sm tracking-widest uppercase font-bold">
              <LayoutGrid size={16} className="text-green-500" /> Live Artifact Gallery
            </h3>
            
            {/* HUD Search Input */}
            <div className="relative w-full md:max-w-xs">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                placeholder="QUERY USERNAME..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 text-green-500 px-10 py-2.5 rounded-lg text-xs tracking-wider placeholder-zinc-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-500 hover:text-green-400 font-bold"
                >
                  [CLEAR]
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredCards.length === 0 ? (
              <div className="col-span-full border border-dashed border-zinc-900 p-16 text-center text-zinc-500 bg-zinc-950/20 rounded-lg">
                <LayoutGrid size={32} className="mx-auto text-zinc-800 mb-4 animate-pulse" />
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">NO MATCHING ARTIFACT CORRELATIONS</p>
                <p className="text-[10px] text-zinc-600 mt-2 font-mono">Check spelling or generate coordinates for "@ {searchQuery}"</p>
              </div>
            ) : (
              filteredCards.map((c: any) => (
                <div key={c.id} className="group flex flex-col gap-2.5">
                  {/* Synced high-fidelity visual preview */}
                  <div className="relative w-full aspect-[1/1.8] bg-zinc-950 overflow-hidden border border-zinc-900 rounded-lg group-hover:border-green-500/60 transition-all flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                    <img 
                      src={`/api/admin/card-image?username=${c.username}&t=${c.timestamp}&r=${renderId}`} 
                      alt={`${c.username}'s Card`} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 group-hover:opacity-10 transition-opacity pointer-events-none" />
                    
                    {/* Synced Overlay pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/85 px-2 py-0.5 border border-green-500/30 rounded-full select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[7px] text-green-400 font-mono tracking-widest uppercase">SYNCED</span>
                    </div>
 
                    {/* Floating hover actions overlay */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-30">
                      <a 
                        href={`/api/admin/card-image?username=${c.username}&t=${c.timestamp}&r=${renderId}`} 
                        download={`${c.username}_gitgravity.png`}
                        className="p-1.5 bg-black/90 border border-zinc-800 hover:border-green-500 hover:text-green-500 text-zinc-400 rounded-md transition-colors block cursor-pointer"
                        title="Download Graphic"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download size={12} />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(c.username);
                        }}
                        disabled={isDeleting !== null}
                        className="p-1.5 bg-black/90 border border-zinc-800 hover:border-red-500 hover:text-red-500 text-zinc-400 rounded-md transition-colors block cursor-pointer disabled:opacity-50"
                        title="Delete Card"
                      >
                        {isDeleting === c.username ? (
                          <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Username and File Info Footer */}
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] text-zinc-400 group-hover:text-green-400 transition-colors truncate font-bold uppercase tracking-wider">
                      @{c.username}
                    </span>
                    <span className="text-[8px] tracking-widest font-mono uppercase text-green-500/60">
                      [ONLINE]
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, val, icon, desc }: any) {
  return (
    <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-xl relative overflow-hidden flex flex-col group hover:border-zinc-800/80 transition-all">
      <div className="absolute top-6 right-6 opacity-30 group-hover:opacity-60 transition-opacity">{icon}</div>
      <p className="text-[9px] text-zinc-500 mb-1 tracking-widest uppercase font-bold">{label}</p>
      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter my-1.5">{val}</h2>
      <p className="text-[8px] text-zinc-600 uppercase tracking-wide leading-none">{desc}</p>
    </div>
  );
}
