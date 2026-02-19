"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Terminal, Lock, ArrowRight, Zap, 
  ShieldCheck, User, KeyRound, Cpu
} from 'lucide-react';

// --- STYLES & ANIMATIONS (DARK RED & BLACK THEME) ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

  :root {
    --neon-red: #ef4444;
    --dark-red: #991b1b;
    --dark-bg: #020202;
    --panel-bg: #0a0505;
  }

  .font-pixel { font-family: 'Press Start 2P', cursive; }
  .font-console { font-family: 'VT323', monospace; }

  @keyframes blink { 50% { opacity: 0; } }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  
  .crt-container {
    background-color: var(--dark-bg);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    color: #eee;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  .scanline-overlay {
    background: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 50%);
    background-size: 100% 4px;
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 50;
  }

  .retro-grid {
    background-image: 
      linear-gradient(to right, rgba(239, 68, 68, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(239, 68, 68, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .glass-panel {
    background: rgba(15, 5, 5, 0.85);
    backdrop-filter: blur(12px);
    border: 2px solid rgba(239, 68, 68, 0.2);
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(239, 68, 68, 0.05);
    transition: all 0.3s ease;
  }

  .cyber-input {
    background: #050000;
    border: 2px solid #331111;
    color: #fff;
    font-family: 'VT323', monospace;
    font-size: 1.25rem;
    padding: 0.75rem 1rem 0.75rem 2.5rem; /* Extra left padding for icons */
    width: 100%;
    outline: none;
    transition: all 0.2s;
  }
  .cyber-input:focus {
    border-color: var(--neon-red);
    box-shadow: inset 0 0 10px rgba(239, 68, 68, 0.2);
  }
  .cyber-input::placeholder {
    color: #555;
  }

  .cyber-button {
    background: linear-gradient(45deg, transparent 5%, var(--neon-red) 5%);
    color: #000;
    box-shadow: 6px 0px 0px #7f1d1d;
    transition: all 0.2s;
    text-transform: uppercase;
    font-weight: bold;
    letter-spacing: 2px;
    cursor: pointer;
  }
  .cyber-button:hover {
    background: linear-gradient(45deg, transparent 5%, #f87171 5%);
  }
  .cyber-button:active {
    box-shadow: 2px 0px 0px #7f1d1d;
    transform: translateX(4px);
  }
  .cyber-button:disabled {
    background: #333;
    box-shadow: 6px 0px 0px #111;
    color: #666;
    cursor: not-allowed;
  }

  .blink { animation: blink 1s step-end infinite; }
`;

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState("LOCATING NODE...");

  // Simulated Matrix decryption effect during login
  useEffect(() => {
    if (isSubmitting) {
      const texts = [
        "VERIFYING ENCRYPTION KEYS...", 
        "CHECKING DB CLEARANCE...", 
        "DECRYPTING PAYLOAD...", 
        "ACCESS GRANTED."
      ];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingText(texts[i]);
        i++;
        if (i === texts.length) {
          clearInterval(interval);
          setTimeout(() => {
             // Redirect logic would go here based on user role from DB
             // Defaulting to student page for demo
             router.push('/studentpage'); 
          }, 500);
        }
      }, 600);
      return () => clearInterval(interval);
    }
  }, [isSubmitting, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("Authenticating:", credentials);
  };

  return (
    <div className="crt-container selection:bg-red-500/30 selection:text-red-100">
      <style>{styles}</style>
      <div className="scanline-overlay"></div>
      <div className="absolute inset-0 retro-grid opacity-20 pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#020000_80%)] z-0 pointer-events-none"></div>

      {/* Header Logo */}
      <div className="relative z-10 mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-red-950 border-2 border-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] mb-4">
          <ShieldCheck className="text-red-500 w-8 h-8" />
        </div>
        <h1 className="font-pixel text-xl md:text-2xl text-white tracking-widest uppercase">
          EVENT_FLOW <span className="text-red-500">AUTH</span>
        </h1>
        <div className="font-console text-red-500/70 text-lg mt-2 tracking-widest">
          SYSTEM_LOCKED_AWAITING_CREDENTIALS<span className="blink">_</span>
        </div>
      </div>

      <div className="glass-panel w-full max-w-md p-6 md:p-10 relative z-10">
        
        {/* Loading / Decrypting Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 z-50 bg-[#020000]/95 backdrop-blur-md flex flex-col items-center justify-center">
            <Cpu size={64} className="text-red-500 animate-pulse mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
            <div className="font-console text-xl text-white tracking-widest text-center px-4">
              {loadingText}
            </div>
            <div className="w-48 h-1 bg-[#331111] mt-6 overflow-hidden">
               <div className="h-full bg-red-500 animate-[scanline_1.5s_ease-in-out_infinite] w-1/3"></div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="animate-in fade-in duration-500">
          <div className="flex items-center justify-between border-b border-[#331111] pb-4 mb-8">
            <div className="font-pixel text-[10px] text-gray-400 flex items-center gap-2">
              <Lock size={12} className="text-red-500" /> SECURE_PORTAL
            </div>
            <div className="font-pixel text-[8px] text-red-500/50">v2.4.0</div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Field */}
            <div className="relative">
              <label className="font-pixel text-[8px] text-red-500 mb-2 block tracking-widest">USER_ID (EMAIL)</label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-3 text-gray-500" />
                <input 
                  required
                  type="email" 
                  placeholder="sysadmin@eventflow.net"
                  className="cyber-input"
                  value={credentials.email}
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative">
              <label className="font-pixel text-[8px] text-red-500 mb-2 block tracking-widest flex justify-between">
                PASSKEY
                <span className="text-gray-500 hover:text-red-400 cursor-pointer transition-colors">FORGOT?</span>
              </label>
              <div className="relative flex items-center">
                <KeyRound size={16} className="absolute left-3 text-gray-500" />
                <input 
                  required
                  type="password" 
                  placeholder="••••••••••••"
                  className="cyber-input tracking-[0.3em]"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button 
                type="submit" 
                className="cyber-button w-full py-4 font-pixel text-xs flex justify-center items-center gap-3"
              >
                <Terminal size={16} /> AUTHENTICATE
              </button>
            </div>
          </form>

          {/* Navigation to Signup */}
          <div className="mt-8 pt-6 border-t border-[#331111] text-center">
            <p className="font-console text-gray-500 text-lg">
              NO ACCESS CLEARANCE?
            </p>
            <button 
              onClick={() => router.push('/signup')}
              className="mt-2 font-pixel text-[10px] text-red-400 hover:text-white transition-colors flex items-center justify-center gap-2 w-full"
            >
              INITIATE_NEW_RECORD <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 font-console text-gray-600 text-sm relative z-10 flex gap-6">
         <span className="flex items-center gap-1"><Zap size={12} /> NODE_ACTIVE</span>
         <span className="text-red-500">● ENCRYPTED_CHANNEL</span>
      </div>
    </div>
  );
}