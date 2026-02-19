"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Background from '../components/background';
import {
  ArrowRight, QrCode, Zap, Play, Hexagon, Activity, Lock,
  Wifi, Battery, Terminal, Cpu, Database, Crosshair, Box, Users
} from 'lucide-react';
import { fetchStats, type Stats } from '../lib/api';

// --- STYLES & ANIMATIONS (DARK RED & BLACK THEME) ---
const customStyles = `
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

  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  @keyframes blink { 50% { opacity: 0; } }
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  
  .glass-panel {
    background: rgba(15, 5, 5, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(239, 68, 68, 0.2);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(239, 68, 68, 0.05);
    transition: all 0.3s ease;
  }
  .glass-panel:hover {
    border-color: var(--neon-red);
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.2), inset 0 0 15px rgba(239, 68, 68, 0.1);
    transform: translateY(-2px);
  }

  .scanline-overlay {
    background: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 50%);
    background-size: 100% 4px;
    pointer-events: none;
  }

  .retro-grid {
    background-image: 
      linear-gradient(to right, rgba(239, 68, 68, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(239, 68, 68, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .cyber-button {
    background: linear-gradient(45deg, transparent 5%, var(--neon-red) 5%);
    color: #000;
    box-shadow: 6px 0px 0px #7f1d1d;
    transition: all 0.2s;
  }
  .cyber-button:hover {
    background: linear-gradient(45deg, transparent 5%, #f87171 5%);
  }
  .cyber-button:active {
    box-shadow: 2px 0px 0px #7f1d1d;
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
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
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
    background: #ff0000;
    box-shadow: 0 0 15px 5px rgba(255, 0, 0, 0.6);
    animation: scanline 1.5s linear infinite;
  }
`;

// --- COMPONENTS ---

const Navbar = () => {
  const router = useRouter();

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-red-500/20 bg-[#020000]/90 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-950 border-2 border-red-500 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            <Zap className="text-red-400 w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-pixel text-[10px] text-white tracking-widest">EVENT_FLOW<span className="text-red-500 blink">_</span></span>
            <span className="font-console text-xs text-gray-500">OPERATING SYSTEM</span>
          </div>
        </div>

        <div className="flex items-center">
          <button 
            onClick={() => router.push('/organizer')}
            className="cyber-button px-8 py-3 font-pixel text-[10px] font-bold tracking-wider"
          >
            INITIATE_UPLINK
          </button>
        </div>
      </div>
    </nav>
  );
};

const HeroSection = () => {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20 overflow-hidden">
      <div className="absolute inset-0 retro-grid opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#020000_80%)]"></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 border border-red-500/50 bg-red-950/50 text-red-400 text-[10px] font-pixel mb-8 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <span className="w-2 h-2 bg-red-500 animate-pulse"></span>
          SYSTEM_VER: 2.4.0 ONLINE
        </div>

        {/* --- UPDATED HEADING --- */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white mb-2 uppercase">
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">EventFlow</span>
        </h1>
        <h2 className="text-2xl md:text-4xl font-bold tracking-widest uppercase mb-8">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-orange-600 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            A Pokémon Event Platform
          </span>
        </h2>

        <p className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 font-console leading-relaxed">
          <span className="text-red-500">{`>`}</span> DEPLOYING SENSOR NETWORK...<br />
          Transform chaotic crowds into actionable data streams. Real-time telemetry, spatial analytics, and automated gamification.
        </p>

        {/* --- ACCESS PORTALS --- */}
        <div className="w-full max-w-2xl bg-black/60 border border-red-900/30 p-6 rounded-xl backdrop-blur-md mb-8 shadow-2xl">
          <div className="font-pixel text-[10px] text-gray-500 mb-4 border-b border-red-900/30 pb-2">SELECT YOUR TERMINAL</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* SPONSOR BUTTON */}
            <button
              onClick={() => router.push('/sponsor')}
              className="portal-btn flex flex-col items-center p-4 border-2 border-[#111] hover:border-red-500 bg-[#050000] group"
            >
              <Terminal size={32} className="text-gray-600 group-hover:text-red-500 mb-2 transition-colors" />
              <span className="font-pixel text-[10px] text-white group-hover:text-red-500">SPONSOR / ADMIN</span>
              <span className="font-console text-xs text-gray-500 mt-1">Analytics & Heatmaps</span>
            </button>

            {/* STUDENT BUTTON */}
            <button
              onClick={() => router.push('/studentpage')}
              className="portal-btn flex flex-col items-center p-4 border-2 border-[#111] hover:border-orange-500 bg-[#050000] group"
            >
              <Users size={32} className="text-gray-600 group-hover:text-orange-500 mb-2 transition-colors" />
              <span className="font-pixel text-[10px] text-white group-hover:text-orange-500">STUDENT / ATTENDEE</span>
              <span className="font-console text-xs text-gray-500 mt-1">PokeGear & Scanner</span>
            </button>

          </div>
        </div>
      </div>

      {/* Live Telemetry Ticker */}
      <div className="absolute bottom-0 w-full border-y-2 border-red-500/30 bg-red-950/40 backdrop-blur-md py-2 overflow-hidden flex z-20">
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite] font-console text-red-500 text-lg tracking-widest">
          <span className="mx-4">SYS_STATUS: <span className="text-red-400">OPTIMAL</span></span> //
          <span className="mx-4">ACTIVE_NODES: 842</span> //
          <span className="mx-4">DATA_VEL: 2.4GB/s</span> //
          <span className="mx-4">THREAT_LEVEL: ZERO</span> //
          <span className="mx-4">CROWD_DENSITY: 68%</span> //
          <span className="mx-4">SYS_STATUS: <span className="text-red-400">OPTIMAL</span></span> //
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
    <div className="bg-[#1a0505] border-b border-red-500/30 p-2 flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-red-500/50 group-hover:bg-red-500 transition-colors shadow-[0_0_5px_red]"></div>
      <div className="w-2 h-2 rounded-full bg-orange-500/50 group-hover:bg-orange-500 transition-colors"></div>
      <div className="w-2 h-2 rounded-full bg-gray-500/50 group-hover:bg-gray-500 transition-colors"></div>
      <span className="font-console text-xs text-gray-500 ml-2">{title.toLowerCase()}.exe</span>
    </div>

    <div className="p-8 relative">
      <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500">
        <Icon size={120} />
      </div>
      <div className="w-12 h-12 bg-[#0a0000] border border-red-500/50 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
        <Icon className="text-red-500" size={24} />
      </div>
      <h3 className="font-pixel text-[10px] text-white mb-3 leading-loose">{title}</h3>
      <p className="text-gray-400 font-console text-xl leading-snug">{desc}</p>
    </div>
  </div>
);

const CommandPreview = () => (
  <section className="py-24 px-6 relative z-10 bg-[#020000] border-y border-white/5">
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <div className="text-center mb-16">
        <div className="font-pixel text-[10px] text-red-500 mb-4 tracking-widest">OMNISCIENT VIEW</div>
        <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter">Command <span className="text-red-500">Center</span></h2>
      </div>

      {/* Mock Dashboard UI */}
      <div className="w-full max-w-5xl bg-[#0a0505] border-2 border-[#331111] rounded-xl overflow-hidden shadow-2xl relative">
        <div className="h-8 bg-[#110505] border-b-2 border-[#331111] flex items-center px-4 gap-4">
          <span className="font-pixel text-[8px] text-gray-500">ADMIN_DASHBOARD</span>
          <div className="flex-1"></div>
          <Activity size={12} className="text-red-500 animate-pulse" />
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 border border-[#331111] bg-[#050000] relative flex items-end p-4 gap-2">
            <div className="absolute inset-0 retro-grid opacity-20"></div>
            {[40, 60, 45, 80, 55, 90, 100, 75, 40, 30].map((h, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-red-900 to-red-500 opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
            ))}
            <div className="absolute top-4 left-4 font-console text-red-500 text-lg bg-black/80 px-2 border border-red-500/30">TRAFFIC_VOLUME</div>
          </div>
          <div className="h-64 border border-[#331111] bg-[#050000] relative p-4 flex flex-col justify-between">
            <div className="font-console text-gray-400 text-lg">SYS_HEALTH</div>
            <div className="text-5xl font-bold text-red-500 font-console tracking-widest">99.9%</div>
            <div className="space-y-2">
              <div className="h-2 bg-[#111]"><div className="h-full bg-red-500 w-[85%]"></div></div>
              <div className="h-2 bg-[#111]"><div className="h-full bg-orange-500 w-[60%]"></div></div>
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
    <section className="py-32 px-6 relative z-10 bg-[#050000]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">

        <div className="flex-1 space-y-8">
          <div className="inline-block px-3 py-1 bg-[#1a0505] border border-red-500/50 text-red-500 font-pixel text-[10px] shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            BEHAVIORAL ENGINE
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tighter leading-none">
            Gamify The <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Experience</span>
          </h2>
          <p className="text-gray-400 text-xl font-console leading-relaxed">
            <span className="text-red-500">{`>`}</span> Inject digital quests into physical layouts.<br />
            <span className="text-red-500">{`>`}</span> Drive foot traffic to low-density zones.<br />
            <span className="text-red-500">{`>`}</span> Reward attendance with verifiable digital assets.
          </p>
        </div>

        {/* The Device Demo */}
        <div className="relative w-full max-w-sm">
          <div className="bg-[#110505] rounded-[2rem] p-4 border-4 border-[#331111] shadow-[0_0_50px_rgba(239,68,68,0.15)] relative">

            <div className="bg-[#020000] rounded-2xl overflow-hidden h-[450px] relative border-2 border-red-900/50">
              <div className="scanline-overlay absolute inset-0 z-20"></div>

              <div className="relative z-10 h-full flex flex-col justify-between p-4">

                {/* HUD Top */}
                <div className="flex justify-between items-start text-red-500 font-console text-sm mb-4">
                  <div className="flex flex-col">
                    <span className="font-pixel text-[8px]">UPLINK</span>
                    <span>192.168.1.1</span>
                  </div>
                  <div className="flex gap-2">
                    <Wifi size={14} /> <Battery size={14} />
                  </div>
                </div>

                {/* Viewfinder */}
                <div className="flex-1 border-2 border-red-500/30 relative flex flex-col items-center justify-center bg-[#0a0000] overflow-hidden">
                  <div className="absolute inset-0 retro-grid opacity-30"></div>

                  {/* Corner Brackets */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-red-500"></div>
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-red-500"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-red-500"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-red-500"></div>

                  {scanState === 'IDLE' && (
                    <div className="text-center opacity-50 text-red-500">
                      <Crosshair size={64} className="mx-auto mb-4" strokeWidth={1} />
                      <div className="font-pixel text-[8px]">ALIGN QR TAG</div>
                    </div>
                  )}

                  {scanState === 'SCANNING' && (
                    <>
                      <div className="scanner-laser z-30"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center z-20">
                        <div className="font-console text-2xl text-white tracking-widest bg-red-900/80 px-2 inline-block border border-red-500">
                          {decodeStr}
                        </div>
                      </div>
                    </>
                  )}

                  {scanState === 'SUCCESS' && (
                    <div className="flex flex-col items-center justify-center z-20 bg-black/80 absolute inset-0 backdrop-blur-sm">
                      <div className="w-24 h-24 bg-red-900/30 border-2 border-red-500 flex items-center justify-center rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.5)] mb-4 animate-bounce">
                        <Box size={48} className="text-red-400" />
                      </div>
                      <div className="font-pixel text-[10px] text-black bg-red-500 px-3 py-1">ASSET SECURED</div>
                      <div className="font-console text-red-400 mt-2">+500 CREDITS</div>
                    </div>
                  )}
                </div>

                {/* Interaction Button */}
                <div className="pt-4">
                  {scanState === 'SUCCESS' ? (
                    <button
                      onClick={() => setScanState('IDLE')}
                      className="w-full bg-red-600 text-black font-bold font-pixel text-[10px] py-4 border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all"
                    >
                      ACKNOWLEDGE
                    </button>
                  ) : (
                    <button
                      onClick={() => { if (scanState === 'IDLE') setScanState('SCANNING') }}
                      disabled={scanState === 'SCANNING'}
                      className={`w-full font-pixel text-[10px] font-bold py-4 border-b-4 active:border-b-0 active:translate-y-1 transition-all ${scanState === 'SCANNING' ? 'bg-orange-600 border-orange-900 text-black cursor-wait' : 'bg-red-600 border-red-900 text-black hover:bg-red-500'}`}
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
  <footer className="py-12 border-t border-white/5 bg-[#020000] text-center relative z-10">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-3 mx-auto md:mx-0">
        <Zap className="text-red-500 w-5 h-5" />
        <span className="font-pixel text-[10px] text-white">EVENT_FLOW_OS</span>
      </div>

      <div className="font-console text-gray-600 text-sm">
        SECURE CONNECTION. © 2026.
      </div>
    </div>
  </footer>
);

export default function EventPulseUltra() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="font-sans antialiased text-gray-100 min-h-screen relative overflow-x-hidden bg-[#020000] selection:bg-red-500/30 selection:text-red-100">
      <style>{customStyles}</style>

      <Background />
      <Navbar />
      <HeroSection />

      <section className="py-32 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter">Core <span className="text-red-500">Protocols</span></h2>
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