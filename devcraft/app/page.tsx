"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchStats, type Stats } from '../lib/api';
import Background from '../components/background'; // Ensure this path is correct
import {
  ArrowRight, QrCode, Zap, Play, Hexagon, Fingerprint, Layers,
  Activity, Globe, Lock, ChevronRight, TrendingUp, Gift, Trophy, ScanLine, Battery, Wifi
} from 'lucide-react';

// --- ANIMATIONS & UTILS ---

const customStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes glow {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-fade-in { animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
  .animate-bounce-subtle { animation: bounce-subtle 2s infinite; }
  .delay-100 { animation-delay: 100ms; }
  .delay-200 { animation-delay: 200ms; }
  .delay-300 { animation-delay: 300ms; }
  
  .glass-panel {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }
  
  .glass-panel:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.15);
  }

  /* Pokemon Specific Styles */
  .poke-silhouette {
    filter: brightness(0) grayscale(1) contrast(200%);
    opacity: 0.2;
    transition: all 0.5s ease;
  }
  .poke-revealed {
    filter: brightness(1) drop-shadow(0 0 15px rgba(255, 255, 255, 0.4));
    transform: scale(1.1);
  }

  /* Retro Grid for the Screen */
  .retro-grid {
    background-size: 20px 20px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  }
  
  .scanline-overlay {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
    background-size: 100% 4px;
    pointer-events: none;
  }
`;

// --- COMPONENTS ---

const FloatingNavbar = () => (
  <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4 animate-fade-in">
    <nav className="glass-panel rounded-full px-6 py-3 flex items-center gap-8 max-w-3xl w-full justify-between">
      <div className="flex items-center gap-2 cursor-pointer group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all duration-300">
          <Zap className="text-white w-4 h-4 fill-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-wide">EventPulse</span>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <Link href="/studentpage" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          Student
        </Link>
        <Link href="/sponsor" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          Sponsor
        </Link>
        <Link href="/redeem" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          Redeem
        </Link>
        <Link href="/organizer" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          Organizer
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/studentpage" className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-cyan-50 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
          Get Access
        </Link>
      </div>
    </nav>
  </div>
);

const MetricCard = ({ label, value, trend, delay }: { label: string, value: string, trend?: string, delay: string }) => (
  <div className={`glass-panel p-4 rounded-xl flex flex-col gap-1 opacity-0 animate-fade-in ${delay}`}>
    <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
    <div className="text-2xl font-bold text-white">{value}</div>
    {trend && (
      <div className="text-xs font-medium text-emerald-400 flex items-center gap-1">
        <TrendingUp size={12} /> {trend}
      </div>
    )}
  </div>
);

const Hero = ({ stats }: { stats: Stats | null }) => (
  <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-cyan-300 text-xs font-bold mb-8 uppercase tracking-widest backdrop-blur-md animate-fade-in">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
      System Online v2.4
    </div>

    <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-8 animate-fade-in delay-100 drop-shadow-2xl">
      Flow Data.
    </h1>

    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in delay-200">
      The operating system for physical spaces. Visualize crowd currents
      like liquid in real-time.
    </p>

    <div className="flex flex-col sm:flex-row justify-center gap-5 mb-24 animate-fade-in delay-300 relative z-20">
      <button className="group relative px-8 py-4 bg-cyan-500 text-black rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.6)]">
        <span className="relative z-10 flex items-center gap-2">
          Start Measuring <ArrowRight size={18} />
        </span>
      </button>
      <button className="px-8 py-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-lg backdrop-blur-md transition-all flex items-center gap-2 group">
        <Play size={18} className="fill-white/50 group-hover:fill-white transition-colors" />
        Watch Demo
      </button>
    </div>

    <div className="absolute bottom-12 left-12 hidden lg:flex gap-4">
      <MetricCard label="Total Attendees" value={stats ? stats.total_attendees.toLocaleString() : '...'} trend={stats ? `${stats.total_sponsors} sponsors` : ''} delay="delay-300" />
      <MetricCard label="Scans Logged" value={stats ? stats.total_scans.toLocaleString() : '...'} trend={stats ? `${stats.legendary_count} legendaries` : ''} delay="delay-300" />
    </div>
  </section>
);

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay?: string }) => (
  <div className={`glass-panel p-8 rounded-3xl group transition-all duration-500 hover:-translate-y-2 opacity-0 animate-fade-in ${delay}`}>
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-6 group-hover:border-cyan-500/50 transition-colors">
      <Icon className="text-gray-300 group-hover:text-cyan-400 transition-colors" size={24} />
    </div>
    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-200 transition-colors">{title}</h3>
    <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-300">{desc}</p>
    <div className="mt-6 flex items-center gap-2 text-cyan-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
      Learn more <ChevronRight size={14} />
    </div>
  </div>
);

// --- NEW COMPONENT: GAMIFICATION SECTION (RETRO RED EDITION) ---

const GamificationSection = () => {
  const [scans, setScans] = useState(0);

  // Logic configurations
  const tier1 = 3; // Unlocks Pikachu
  const tier2 = 6; // Unlocks Charizard
  const maxScans = 6;

  const handleScan = () => {
    if (scans < maxScans) {
      setScans(prev => prev + 1);
    } else {
      setScans(0);
    }
  };

  const progress = (scans / maxScans) * 100;

  return (
    <section className="py-24 px-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* The Outer Shell: Looks like a device */}
        <div className="rounded-3xl p-1 bg-gradient-to-br from-red-600 via-red-700 to-red-900 shadow-[0_0_80px_rgba(220,38,38,0.25)] border border-red-500/50 relative">

          {/* Inner "Chassis" */}
          <div className="bg-[#1a0505] rounded-[22px] p-8 md:p-12 relative overflow-hidden">

            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#5c1212 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="flex flex-col lg:flex-row gap-16 items-center relative z-10">

              {/* Left Side: Copy */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  {/* Device "Power LED" */}
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse"></div>
                  <span className="font-mono text-red-400 text-xs tracking-[0.2em] uppercase">System_Ready</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  Gotta Scan <span className="text-red-500 text-shadow-glow">'Em All</span>
                </h2>

                <p className="text-gray-400 text-lg leading-relaxed font-light">
                  Turn passive attendance into an active quest. Configure logic gates where
                  <span className="text-white font-bold"> $N$ number of scans </span>
                  automatically unlocks real-world rewards.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-lg flex items-center gap-3">
                    <Trophy className="text-red-500" size={20} />
                    <span className="text-gray-300 text-sm">Unlock VIP Areas</span>
                  </div>
                  <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-lg flex items-center gap-3">
                    <Gift className="text-red-500" size={20} />
                    <span className="text-gray-300 text-sm">Reward Digital Assets</span>
                  </div>
                </div>
              </div>

              {/* Right Side: The Pokedex Interface */}
              <div className="flex-1 w-full max-w-md relative">

                {/* Device Bezel */}
                <div className="bg-gradient-to-b from-red-600 to-red-800 rounded-t-2xl rounded-b-lg p-1 shadow-2xl transform transition-transform hover:scale-[1.01] duration-500 border-b-8 border-red-900">

                  {/* Top Hardware Details */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-red-900/30 bg-black/10">
                    {/* The "Lens" */}
                    <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white/20 shadow-[0_0_15px_rgba(59,130,246,0.6)] relative overflow-hidden">
                      <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-60"></div>
                    </div>
                    {/* Indicators */}
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-900"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                      <div className="w-2 h-2 rounded-full bg-green-700"></div>
                    </div>
                  </div>

                  {/* The Screen Area */}
                  <div className="bg-gray-200 p-4 rounded-b-lg rounded-tr-[30px]"> {/* Beveled corner */}
                    <div className="bg-[#111] border-4 border-gray-600 rounded-lg p-4 relative overflow-hidden h-64 flex flex-col justify-between shadow-inner">

                      {/* Screen Overlay Effects */}
                      <div className="absolute inset-0 retro-grid opacity-30"></div>
                      <div className="absolute inset-0 scanline-overlay opacity-20"></div>

                      {/* Header Status */}
                      <div className="flex justify-between items-center text-[10px] font-mono text-cyan-500 mb-4 z-10">
                        <div className="flex items-center gap-1"><Wifi size={10} /> ONLINE</div>
                        <div className="flex items-center gap-1"><Battery size={10} /> 84%</div>
                      </div>

                      {/* Pokemon Visuals */}
                      <div className="flex justify-around items-end z-10 h-full pb-2">
                        {/* Sprite 1 */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="relative">
                            {scans >= tier1 && <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 animate-pulse"></div>}
                            <img
                              src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif"
                              alt="Pikachu"
                              className={`w-16 h-16 object-contain relative z-10 ${scans >= tier1 ? 'poke-revealed' : 'poke-silhouette'}`}
                            />
                          </div>
                          <span className={`text-[10px] font-mono uppercase px-1 rounded ${scans >= tier1 ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-600'}`}>
                            {scans >= tier1 ? 'UNLOCKED' : 'Lv. 3'}
                          </span>
                        </div>

                        {/* Sprite 2 */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="relative">
                            {scans >= tier2 && <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse"></div>}
                            <img
                              src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/6.gif"
                              alt="Charizard"
                              className={`w-24 h-24 object-contain -mb-2 relative z-10 ${scans >= tier2 ? 'poke-revealed' : 'poke-silhouette'}`}
                            />
                          </div>
                          <span className={`text-[10px] font-mono uppercase px-1 rounded ${scans >= tier2 ? 'bg-red-500/20 text-red-400' : 'text-gray-600'}`}>
                            {scans >= tier2 ? 'UNLOCKED' : 'Lv. 6'}
                          </span>
                        </div>
                      </div>

                      {/* XP Bar */}
                      <div className="relative z-10 mt-2">
                        <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1 uppercase">
                          <span>Exp Points</span>
                          <span>{scans}/{maxScans}</span>
                        </div>
                        <div className="h-3 bg-gray-800 border border-gray-600 rounded-sm overflow-hidden p-[1px]">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Control Pad Area (Simulated) */}
                    <div className="mt-4 flex justify-between items-center px-2">
                      {/* D-Pad Decoration */}
                      <div className="w-16 h-16 relative opacity-80">
                        <div className="absolute top-0 left-1/3 w-1/3 h-full bg-gray-800 rounded-sm shadow-sm"></div>
                        <div className="absolute top-1/3 left-0 w-full h-1/3 bg-gray-800 rounded-sm shadow-sm"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-700 rounded-full inset-shadow"></div>
                        </div>
                      </div>

                      {/* Functional Button */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleScan}
                          className="group relative px-6 py-2 bg-blue-600 rounded-full text-white font-bold text-xs shadow-[0_4px_0_#1e3a8a] active:shadow-none active:translate-y-[4px] transition-all flex items-center gap-2 overflow-hidden"
                        >
                          <span className="relative z-10 font-mono tracking-wider">
                            {scans >= maxScans ? 'RESET' : 'SCAN_TAG'}
                          </span>
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        </button>
                        <div className="flex justify-center gap-2">
                          <div className="w-8 h-2 bg-red-900 rounded-full"></div>
                          <div className="w-8 h-2 bg-blue-900 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


const FeaturesGrid = () => (
  <section className="py-32 relative z-10 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="mb-20 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Intelligence from <span className="text-cyan-400 underline decoration-cyan-500/30 underline-offset-8">Chaos</span>
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          We treat crowd movement like fluid dynamics. Our sensors map the flow, density, and pressure of your event in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <FeatureCard
          icon={QrCode}
          title="Frictionless Entry"
          desc="Replace barcode scanners with NFC flow gates. 400% faster throughput with military-grade encryption."
          delay=""
        />
        <FeatureCard
          icon={Activity}
          title="Heatmap Analytics"
          desc="Watch the venue breathe. See live hotspots, bottlenecks, and dwell times projected on a 3D twin."
          delay="delay-100"
        />
        <FeatureCard
          icon={Lock}
          title="Fraud Prevention"
          desc="AI pattern recognition detects ticket cloning and pass-backs instantly without slowing down the line."
          delay="delay-200"
        />
        <FeatureCard
          icon={Globe}
          title="Global Sync"
          desc="Managing a multi-city tour? Control access policies for Tokyo, London, and NY from one dashboard."
          delay="delay-300"
        />
        <div className="md:col-span-2 glass-panel rounded-3xl p-8 relative overflow-hidden group opacity-0 animate-fade-in delay-300">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 h-full">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500/30 bg-yellow-900/10 text-yellow-400 text-xs font-bold mb-4">
                <Zap size={12} fill="currentColor" /> NEW FEATURE
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Predictive Crowd Control</h3>
              <p className="text-gray-400 mb-6">
                Our AI predicts stampede risks 15 minutes before they happen, automatically alerting security teams and adjusting digital signage to redirect flow.
              </p>
              <button className="text-white border-b border-cyan-500 pb-1 hover:text-cyan-400 transition-colors">Read the Case Study</button>
            </div>
            <div className="flex-1 w-full h-48 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden">
              {/* Abstract visualization graphic */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-50">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="w-2 bg-cyan-500 rounded-full animate-pulse" style={{
                    height: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`
                  }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-white/5 bg-black/20 backdrop-blur-md pt-20 pb-10 relative z-10">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <Zap className="text-white w-4 h-4" />
        </div>
        <span className="text-xl font-bold text-white">EventPulse</span>
      </div>
      <div className="text-gray-500 text-sm">
        Designed for the unseen. © 2026
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
    <div className="font-sans antialiased text-gray-100 min-h-screen relative overflow-x-hidden selection:bg-cyan-500/30">
      <style>{customStyles}</style>

      {/* Background Component: Fixed and behind everything */}
      <Background />

      {/* Main Content */}
      <FloatingNavbar />
      <Hero stats={stats} />
      <FeaturesGrid />
      <GamificationSection />
      <Footer />
    </div>
  );
}