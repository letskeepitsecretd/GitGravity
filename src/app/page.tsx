"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import GitGravityInteractivePage from "@/components/GitGravity/GitGravityInteractivePage";

function HomeContent() {
  const searchParams = useSearchParams();
  const username = searchParams.get("user") || searchParams.get("username") || "";
  return <GitGravityInteractivePage initialUsername={username} />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020408] text-white flex flex-col items-center justify-center font-mono gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
        <span className="text-[10px] tracking-widest text-[#39d353] font-bold uppercase animate-pulse">Initializing Orbit System...</span>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
