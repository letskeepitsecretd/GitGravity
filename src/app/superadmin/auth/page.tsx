"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Auth() {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase })
    });
    
    if (res.ok) {
      router.push('/superadmin');
      router.refresh();
    } else {
      setError(true);
      setPassphrase('');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono text-green-500">
      <form onSubmit={login} className="border border-zinc-800 bg-black p-8 w-96 shadow-2xl">
        <h1 className="mb-6 text-xl font-bold tracking-widest uppercase border-b border-zinc-800 pb-4">
          Root Access
        </h1>
        <input 
          type="password" 
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)} 
          className="bg-black border-b border-zinc-700 focus:border-green-500 w-full mb-6 outline-none py-2 text-green-500 placeholder-zinc-700 transition-colors" 
          autoFocus 
          placeholder="Enter Passphrase..." 
        />
        {error && <p className="text-red-500 text-xs mb-4">ACCESS DENIED. INCORRECT PASSPHRASE.</p>}
        <button className="bg-green-500 hover:bg-green-400 text-black w-full font-bold py-3 uppercase tracking-widest transition-colors">
          Initialize
        </button>
      </form>
    </div>
  );
}
