"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Added for routing
import Background from '../components/background'; 
import {
  ArrowRight, QrCode, Zap, Play, Hexagon, Activity, Lock,
  Wifi, Battery, Terminal, Cpu, Database, Crosshair, Box, Users
} from 'lucide-react';

// --- STYLES & ANIMATIONS ---
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

  :root {
    --neon-cyan: #22d3ee;
    --neon-purple: #a855f7;
    --dark-bg: #050a05;
  }

  .font-pixel { font-family: 'Press Start 2P', cursive; }
  .font-console { font-family: 'VT323', monospace; }

  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  @keyframes blink { 50% { opacity: 0; } }
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  
  .glass-panel {
    background: rgba(5, 15, 10, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(34, 211, 238, 0.2);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(34, 211, 238, 0.05);
    transition: all 0.3s ease;
  }
  .glass-panel:hover {
    border-color: var(--neon-cyan);
    box-shadow: 0 0 30px rgba(34, 211, 238, 0.15), inset 0 0 15px rgba(34, 211, 238, 0.1);
    transform: translateY(-2px);
  }

  .scanline-overlay {
    background: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 50%);
    background-size: 100% 4px;
    pointer-events: none;
  }

  .retro-grid {
    background-image: 
      linear-gradient(to right, rgba(34, 211, 238, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(34, 211, 238, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .cyber-button {
    background: linear-gradient(45deg, transparent 5%, var(--neon-cyan) 5%);
    color: #000;
    box-shadow: 6px 0px 0px #00e5ff;
    transition: all 0.2s;
  }
  .cyber-button:active {
    box-shadow: 2px 0px 0px #00e5ff;
    transform: translateX(4px);
  }

  /* Portal Buttons */
  .portal-btn {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  .portal-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: all 0.5s ease;
  }
  .portal-btn:hover::before {
    left: 100%;
  }

  /* Scanner effects */
  .scanner-laser {
    position: absolute;
    width: 100%;
    height: 2px;
    background: #ff0055;
    box-shadow: 0 0 15px 5px rgba(255, 0, 85, 0.5);
    animation: scanline 1.5s linear infinite;
  }
`;

// --- COMPONENTS ---

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 border-b border-cyan-500/20 bg-[#020502]/90 backdrop-blur-md px-6 py-4">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-cyan-950 border-2 border-cyan-500 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          <Zap className="text-cyan-400 w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-pixel text-[10px] text-white tracking-widest">EVENT_PULSE<span className="text-cyan-500 blink">_</span></span>
          <span className="font-console text-xs text-gray-500">OPERATING SYSTEM</span>
        </div>
      </div>

      <div className="flex gap-6 items-center">
        <button className="hidden md:block font-console text-xl text-gray-400 hover:text-cyan-400 transition-colors">/DOCS</button>
        <button className="cyber-button px-8 py-3 font-pixel text-[10px] font-bold tracking-wider">
          INITIATE_UPLINK
        </button>
      </div>
    </div>
  </nav>
);

const HeroSection = () => {
  const router = useRouter(); // Initialize router

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20 overflow-hidden">
      <div className="absolute inset-0 retro-grid opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#020502_80%)]"></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 border border-cyan-500/50 bg-cyan-950/50 text-cyan-400 text-[10px] font-pixel mb-8 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          <span className="w-2 h-2 bg-cyan-400 animate-pulse"></span>
          SYSTEM_VER: 2.4.0 ONLINE
        </div>

        <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-white mb-6 uppercase">
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">Master The</span><br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            Physical Grid
          </span>
        </h1>

        <p className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 font-console leading-relaxed">
          <span className="text-cyan-500">{`>`}</span> DEPLOYING SENSOR NETWORK...<br />
          Transform chaotic crowds into actionable data streams. Real-time telemetry, spatial analytics, and automated gamification.
        </p>

        {/* --- NEW: ACCESS PORTALS --- */}
        <div className="w-full max-w-2xl bg-black/50 border border-white/10 p-6 rounded-xl backdrop-blur-md mb-8">
          <div className="font-pixel text-[10px] text-gray-500 mb-4 border-b border-white/10 pb-2">SELECT YOUR TERMINAL</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* SPONSOR BUTTON */}
            <button 
              onClick={() => router.push('/sponsor')}
              className="portal-btn flex flex-col items-center p-4 border-2 border-[#111] hover:border-cyan-500 bg-[#050505] group"
            >
              <Terminal size={32} className="text-gray-600 group-hover:text-cyan-400 mb-2 transition-colors" />
              <span className="font-pixel text-[10px] text-white group-hover:text-cyan-400">SPONSOR / ADMIN</span>
              <span className="font-console text-xs text-gray-500 mt-1">Analytics & Heatmaps</span>
            </button>

            {/* STUDENT BUTTON */}
            <button 
              onClick={() => router.push('/studentpage')}
              className="portal-btn flex flex-col items-center p-4 border-2 border-[#111] hover:border-[#8bac0f] bg-[#050505] group"
            >
              <Users size={32} className="text-gray-600 group-hover:text-[#8bac0f] mb-2 transition-colors" />
              <span className="font-pixel text-[10px] text-white group-hover:text-[#8bac0f]">STUDENT / ATTENDEE</span>
              <span className="font-console text-xs text-gray-500 mt-1">PokeGear & Scanner</span>
            </button>

          </div>
        </div>
      </div>

      {/* Live Telemetry Ticker */}
      <div className="absolute bottom-0 w-full border-y-2 border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md py-2 overflow-hidden flex z-20">
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite] font-console text-cyan-400 text-lg tracking-widest">
          <span className="mx-4">SYS_STATUS: <span className="text-emerald-400">OPTIMAL</span></span> //
          <span className="mx-4">ACTIVE_NODES: 842</span> //
          <span className="mx-4">DATA_VEL: 2.4GB/s</span> //
          <span className="mx-4">THREAT_LEVEL: ZERO</span> //
          <span className="mx-4">CROWD_DENSITY: 68%</span> //
          <span className="mx-4">SYS_STATUS: <span className="text-emerald-400">OPTIMAL</span></span> //
          <span className="mx-4">ACTIVE_NODES: 842</span> //
          <span className="mx-4">DATA_VEL: 2.4GB/s</span> //
          <span className="mx-4">THREAT_LEVEL: ZERO</span> //
          <span className="mx-4">CROWD_DENSITY: 68%</span> //
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }: any) => (
  <div className={`glass-panel rounded-lg overflow-hidden flex flex-col group animate-fade-in ${delay}`}>
    {/* Terminal Header */}
    <div className="bg-[#0f1f15] border-b border-cyan-500/30 p-2 flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-red-500/50 group-hover:bg-red-500 transition-colors"></div>
      <div className="w-2 h-2 rounded-full bg-yellow-500/50 group-hover:bg-yellow-500 transition-colors"></div>
      <div className="w-2 h-2 rounded-full bg-green-500/50 group-hover:bg-green-500 transition-colors"></div>
      <span className="font-console text-xs text-gray-500 ml-2">{title.toLowerCase()}.exe</span>
    </div>

    <div className="p-8 relative">
      <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500">
        <Icon size={120} />
      </div>
      <div className="w-12 h-12 bg-[#051405] border border-cyan-500/50 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
        <Icon className="text-cyan-400" size={24} />
      </div>
      <h3 className="font-pixel text-[10px] text-white mb-3 leading-loose">{title}</h3>
      <p className="text-gray-400 font-console text-xl leading-snug">{desc}</p>
    </div>
  </div>
);

const CommandPreview = () => (
  <section className="py-24 px-6 relative z-10 bg-[#020502] border-y border-white/10">
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <div className="text-center mb-16">
        <div className="font-pixel text-[10px] text-cyan-500 mb-4">OMNISCIENT VIEW</div>
        <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter">Command <span className="text-cyan-400">Center</span></h2>
      </div>

      {/* Mock Dashboard UI */}
      <div className="w-full max-w-5xl bg-[#0a0a0a] border-2 border-[#333] rounded-xl overflow-hidden shadow-2xl relative">
        <div className="h-8 bg-[#111] border-b-2 border-[#333] flex items-center px-4 gap-4">
          <span className="font-pixel text-[8px] text-gray-500">ADMIN_DASHBOARD</span>
          <div className="flex-1"></div>
          <Activity size={12} className="text-cyan-500 animate-pulse" />
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 border border-[#333] bg-[#050505] relative flex items-end p-4 gap-2">
            <div className="absolute inset-0 retro-grid opacity-20"></div>
            {[40, 60, 45, 80, 55, 90, 100, 75, 40, 30].map((h, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-cyan-900 to-cyan-400 opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
            ))}
            <div className="absolute top-4 left-4 font-console text-cyan-500 text-lg bg-black/50 px-2 border border-cyan-500/30">TRAFFIC_VOLUME</div>
          </div>
          <div className="h-64 border border-[#333] bg-[#050505] relative p-4 flex flex-col justify-between">
            <div className="font-console text-gray-400 text-lg">SYS_HEALTH</div>
            <div className="text-5xl font-bold text-emerald-400 font-console tracking-widest">99.9%</div>
            <div className="space-y-2">
              <div className="h-2 bg-[#111]"><div className="h-full bg-cyan-500 w-[85%]"></div></div>
              <div className="h-2 bg-[#111]"><div className="h-full bg-purple-500 w-[60%]"></div></div>
              <div className="h-2 bg-[#111]"><div className="h-full bg-yellow-500 w-[95%]"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const InteractiveScanner = () => {
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  const [decodeStr, setDecodeStr] = useState("AWAITING TARGET...");

  useEffect(() => {
    if (scanState === 'SCANNING') {
      const interval = setInterval(() => {
        setDecodeStr(Math.random().toString(16).substr(2, 12).toUpperCase());
      }, 50);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setScanState('SUCCESS');
      }, 2500);

      return () => { clearInterval(interval); clearTimeout(timeout); };
    } else if (scanState === 'IDLE') {
      setDecodeStr("AWAITING TARGET...");
    }
  }, [scanState]);

  return (
    <section className="py-32 px-6 relative z-10 bg-[#050a05]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">

        <div className="flex-1 space-y-8">
          <div className="inline-block px-3 py-1 bg-[#1a0a2a] border border-purple-500/50 text-purple-400 font-pixel text-[10px] shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            BEHAVIORAL ENGINE
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tighter leading-none">
            Gamify The <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Experience</span>
          </h2>
          <p className="text-gray-400 text-xl font-console leading-relaxed">
            <span className="text-purple-500">{`>`}</span> Inject digital quests into physical layouts.<br />
            <span className="text-purple-500">{`>`}</span> Drive foot traffic to low-density zones.<br />
            <span className="text-purple-500">{`>`}</span> Reward attendance with verifiable digital assets.
          </p>
        </div>

        {/* The Device Demo */}
        <div className="relative w-full max-w-sm">
          <div className="bg-[#1a1a1a] rounded-[2rem] p-4 border-8 border-[#333] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">

            <div className="bg-[#020502] rounded-2xl overflow-hidden h-[450px] relative border-4 border-black">
              <div className="scanline-overlay absolute inset-0 z-20"></div>

              <div className="relative z-10 h-full flex flex-col justify-between p-4">

                {/* HUD Top */}
                <div className="flex justify-between items-start text-cyan-500 font-console text-sm mb-4">
                  <div className="flex flex-col">
                    <span className="font-pixel text-[8px]">UPLINK</span>
                    <span>192.168.1.1</span>
                  </div>
                  <div className="flex gap-2">
                    <Wifi size={14} /> <Battery size={14} />
                  </div>
                </div>

                {/* Viewfinder */}
                <div className="flex-1 border-2 border-cyan-500/30 relative flex flex-col items-center justify-center bg-[#0a1a1a] overflow-hidden">
                  <div className="absolute inset-0 retro-grid opacity-30"></div>

                  {/* Corner Brackets */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-500"></div>
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-500"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-500"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-500"></div>

                  {scanState === 'IDLE' && (
                    <div className="text-center opacity-50 text-cyan-500">
                      <Crosshair size={64} className="mx-auto mb-4" strokeWidth={1} />
                      <div className="font-pixel text-[8px]">ALIGN QR TAG</div>
                    </div>
                  )}

                  {scanState === 'SCANNING' && (
                    <>
                      <div className="scanner-laser z-30"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center z-20">
                        <div className="font-console text-2xl text-red-500 tracking-widest bg-black/80 px-2 inline-block">
                          {decodeStr}
                        </div>
                      </div>
                    </>
                  )}

                  {scanState === 'SUCCESS' && (
                    <div className="flex flex-col items-center justify-center z-20 bg-black/60 absolute inset-0 backdrop-blur-sm">
                      <div className="w-24 h-24 bg-purple-900/30 border-2 border-purple-500 flex items-center justify-center rounded-lg shadow-[0_0_30px_rgba(168,85,247,0.5)] mb-4 animate-bounce">
                        <Box size={48} className="text-purple-300" />
                      </div>
                      <div className="font-pixel text-[10px] text-white bg-purple-600 px-3 py-1">ASSET SECURED</div>
                      <div className="font-console text-purple-300 mt-2">+500 CREDITS</div>
                    </div>
                  )}
                </div>

                {/* Interaction Button */}
                <div className="pt-4">
                  {scanState === 'SUCCESS' ? (
                    <button
                      onClick={() => setScanState('IDLE')}
                      className="w-full bg-purple-600 text-white font-pixel text-[10px] py-4 border-b-4 border-purple-900 active:border-b-0 active:translate-y-1 transition-all"
                    >
                      ACKNOWLEDGE
                    </button>
                  ) : (
                    <button
                      onClick={() => { if (scanState === 'IDLE') setScanState('SCANNING') }}
                      disabled={scanState === 'SCANNING'}
                      className={`w-full font-pixel text-[10px] py-4 border-b-4 active:border-b-0 active:translate-y-1 transition-all ${scanState === 'SCANNING' ? 'bg-red-600 border-red-900 text-white cursor-wait' : 'bg-cyan-600 border-cyan-900 text-black hover:bg-cyan-500'}`}
                    >
                      {scanState === 'SCANNING' ? 'DECRYPTING...' : 'INITIATE SCAN'}
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};


const Footer = () => (
  <footer className="py-12 border-t border-white/10 bg-[#020502] text-center relative z-10">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-3">
        <Zap className="text-cyan-500 w-5 h-5" />
        <span className="font-pixel text-[10px] text-white">EVENT_PULSE_OS</span>
      </div>

      <div className="font-console text-gray-500 text-sm flex gap-6">
        <a href="#" className="hover:text-cyan-400">/DOCS</a>
        <a href="#" className="hover:text-cyan-400">/API</a>
        <a href="#" className="hover:text-cyan-400">/TERMS</a>
      </div>

      <div className="font-console text-gray-600 text-sm">
        SECURE CONNECTION. © 2026.
      </div>
    </div>
  </footer>
);

export default function EventPulseUltra() {
  return (
    <div className="font-sans antialiased text-gray-100 min-h-screen relative overflow-x-hidden bg-[#020502] selection:bg-cyan-500/30 selection:text-cyan-100">
      <style>{customStyles}</style>

      <Background />
      <Navbar />
      <HeroSection />

      <section className="py-32 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter">Core <span className="text-cyan-400">Protocols</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={QrCode}
            title="NFC_FLOW_GATES"
            desc="Frictionless entry protocol. Scans process in <200ms with military-grade crypto."
            delay=""
          />
          <FeatureCard
            icon={Activity}
            title="SPATIAL_RADAR"
            desc="Live density heatmaps projected onto digital twins. Predict bottlenecks before they form."
            delay="animation-delay-100"
          />
          <FeatureCard
            icon={Database}
            title="DATA_LAKE_SYNC"
            desc="Unify multi-city tours into a single dashboard. Real-time ROI and lead attribution."
            delay="animation-delay-200"
          />
        </div>
      </section>

      <CommandPreview />
      <InteractiveScanner />
      <Footer />
    </div>
  );
}