"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, Zap, Clock, TrendingUp, Activity, 
  Share2, ArrowUpRight, ArrowDownRight, 
  Download, Filter, RefreshCw, Hexagon,
  DollarSign, Target, BarChart3, Wifi
} from 'lucide-react';

// --- STYLES & ANIMATIONS ---
const styles = `
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  @keyframes pulse-ring {
    0% { transform: scale(0.8); opacity: 0.5; }
    100% { transform: scale(2); opacity: 0; }
  }
  @keyframes graph-grow {
    from { height: 0; opacity: 0; }
    to { height: var(--target-height); opacity: 1; }
  }
  
  .glass-card {
    background: rgba(13, 18, 30, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .glass-card:hover {
    border-color: rgba(6, 182, 212, 0.3);
    box-shadow: 0 0 30px rgba(6, 182, 212, 0.15);
    transform: translateY(-2px);
  }

  .neon-text {
    text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
  }

  .scanline-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.3) 51%);
    background-size: 100% 4px;
    pointer-events: none;
    z-index: 10;
    opacity: 0.3;
  }

  /* Cyberpunk Corner Accents */
  .corner-accent {
    position: absolute;
    width: 8px;
    height: 8px;
    border-color: rgba(6, 182, 212, 0.5);
    transition: all 0.3s ease;
  }
  .glass-card:hover .corner-accent {
    width: 12px;
    height: 12px;
    border-color: #22d3ee;
  }
  .c-tl { top: 0; left: 0; border-top: 2px solid; border-left: 2px solid; }
  .c-tr { top: 0; right: 0; border-top: 2px solid; border-right: 2px solid; }
  .c-bl { bottom: 0; left: 0; border-bottom: 2px solid; border-left: 2px solid; }
  .c-br { bottom: 0; right: 0; border-bottom: 2px solid; border-right: 2px solid; }
`;

// --- SUB-COMPONENTS ---

const CardHeader = ({ title, icon: Icon, sub, highlight }: any) => (
  <div className="flex justify-between items-start mb-6 relative z-20">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${highlight ? 'text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-gray-400'}`}>
        <Icon size={18} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">{title}</h3>
        {sub && <p className="text-[10px] text-gray-500 font-mono mt-0.5">{sub}</p>}
      </div>
    </div>
    <div className="flex gap-1">
       <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
       <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
    </div>
  </div>
);

const KPICard = ({ label, value, trend, trendUp, icon: Icon, delay }: any) => (
  <div className={`glass-card rounded-2xl p-5 flex flex-col justify-between h-32 animate-fade-in`} style={{animationDelay: delay}}>
    <div className="corner-accent c-tl"></div>
    <div className="corner-accent c-br"></div>
    
    <div className="flex justify-between items-start">
      <span className="text-xs font-mono text-gray-400 uppercase">{label}</span>
      <Icon size={16} className="text-gray-500" />
    </div>
    
    <div>
      <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-2">
        {value}
        {trend && (
          <span className={`text-xs font-medium flex items-center px-1.5 py-0.5 rounded ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {trendUp ? <ArrowUpRight size={10} className="mr-1"/> : <ArrowDownRight size={10} className="mr-1"/>}
            {trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

const ProgressBar = ({ label, value, color = "bg-cyan-500", track = "bg-gray-800" }: any) => (
  <div className="group cursor-pointer">
    <div className="flex justify-between text-xs mb-1.5">
      <span className="text-gray-400 group-hover:text-white transition-colors">{label}</span>
      <span className="font-mono text-gray-500 group-hover:text-cyan-400 transition-colors">{value}%</span>
    </div>
    <div className={`h-1.5 w-full ${track} rounded-full overflow-hidden`}>
      <div 
        className={`h-full ${color} transition-all duration-1000 relative`} 
        style={{ width: `${value}%` }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white opacity-50 shadow-[0_0_10px_white]"></div>
      </div>
    </div>
  </div>
);

// --- MAIN PAGE COMPONENT ---

export default function SponsorPage() {
  const [loading, setLoading] = useState(true);

  // Simulate initial data load effect
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden pb-20">
      <style>{styles}</style>
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      {/* --- NAV / HEADER --- */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/20">
              <Hexagon className="text-white w-4 h-4 fill-white/20" />
            </div>
            <span className="font-bold text-lg tracking-tight">EventPulse <span className="text-cyan-500 font-normal">Sponsor</span></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-mono text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              SYSTEM ONLINE
            </div>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <RefreshCw size={18} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700"></div>
          </div>
        </div>
      </header>

      {/* --- DASHBOARD CONTENT --- */}
      <main className="max-w-7xl mx-auto px-6 pt-10 relative z-10">
        
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              Command Center
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 border border-white/10 text-gray-400 uppercase tracking-widest">
                v2.4.0
              </span>
            </h1>
            <p className="text-gray-400 max-w-xl">
              Real-time telemetry and ROI attribution for <span className="text-white font-medium">Neon Nights 2026</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-all flex items-center gap-2">
              <Filter size={14} /> Filter View
            </button>
            <button className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2">
              <Download size={14} /> Export Report
            </button>
          </div>
        </div>

        {/* 1. KPI GRID (Top Row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard 
            label="Total Footfall" 
            value="14,205" 
            trend="12% vs last hr" 
            trendUp={true} 
            icon={Users} 
            delay="0ms" 
          />
          <KPICard 
            label="Cost Per Interaction" 
            value="$0.42" 
            trend="Target: $0.50" 
            trendUp={true} 
            icon={DollarSign} 
            delay="100ms" 
          />
          <KPICard 
            label="Avg Dwell Time" 
            value="18m 24s" 
            trend="4m vs avg" 
            trendUp={true} 
            icon={Clock} 
            delay="200ms" 
          />
          <KPICard 
            label="Cross Pollination" 
            value="34.2%" 
            trend="2.1% decrease" 
            trendUp={false} 
            icon={Share2} 
            delay="300ms" 
          />
        </div>

        {/* 2. MAIN BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">

          {/* A. TRAFFIC VELOCITY (Large Chart) */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-6 min-h-[400px]">
            <div className="corner-accent c-tr"></div>
            <div className="scanline-overlay"></div>
            
            <CardHeader 
              title="Traffic Velocity & Peak Hours" 
              sub="Real-time localized density heatmap" 
              icon={Activity} 
              highlight={true}
            />

            <div className="h-[300px] w-full flex items-end justify-between gap-1 pt-8 relative group">
                {/* Y-Axis Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="w-full h-px border-t border-dashed border-gray-500"></div>
                  <div className="w-full h-px border-t border-dashed border-gray-500"></div>
                  <div className="w-full h-px border-t border-dashed border-gray-500"></div>
                  <div className="w-full h-px border-t border-dashed border-gray-500"></div>
                </div>

                {/* Bars */}
                {[35, 45, 30, 60, 75, 50, 85, 95, 65, 45, 30, 55, 70, 40, 25, 35, 50, 65, 80, 60, 40, 30, 20, 15].map((h, i) => (
                  <div key={i} className="relative flex-1 h-full flex items-end group/bar">
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-300 group-hover/bar:bg-cyan-400 group-hover/bar:shadow-[0_0_20px_rgba(34,211,238,0.5)] ${i >= 6 && i <= 9 ? 'bg-gradient-to-t from-cyan-900 to-cyan-400 opacity-90' : 'bg-white/10'}`}
                      style={{ height: `${h}%` }}
                    ></div>
                    
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity z-30 pointer-events-none whitespace-nowrap">
                      <span className="text-[10px] text-gray-300 font-mono">{(i + 8) % 12 || 12}:00 • {h * 12} Visitors</span>
                    </div>
                  </div>
                ))}
            </div>
            
            <div className="flex justify-between mt-4 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
              <span>08:00 AM</span>
              <span>12:00 PM (PEAK)</span>
              <span>08:00 PM</span>
            </div>
          </div>

          {/* B. DEMOGRAPHICS (Stacked) */}
          <div className="glass-card rounded-3xl p-6">
            <div className="corner-accent c-tl"></div>
            <CardHeader 
              title="Target Demographics" 
              sub="Anonymous persona identification" 
              icon={Target} 
            />

            <div className="flex items-center justify-center py-6 relative">
              {/* Donut Chart Simulation */}
              <div className="w-48 h-48 rounded-full border-[16px] border-gray-800 relative flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-[16px] border-cyan-500 border-r-transparent border-b-transparent rotate-45 opacity-80"></div>
                 <div className="absolute inset-0 rounded-full border-[16px] border-purple-500 border-l-transparent border-b-transparent -rotate-12 opacity-80"></div>
                 
                 <div className="text-center z-10">
                   <div className="text-3xl font-bold text-white">84%</div>
                   <div className="text-[10px] text-gray-400 uppercase tracking-widest">Match Rate</div>
                 </div>
              </div>
            </div>

            <div className="space-y-4 mt-2">
              <ProgressBar label="Tech Professionals" value={45} color="bg-cyan-500" />
              <ProgressBar label="University Students" value={32} color="bg-purple-500" />
              <ProgressBar label="Venture Capitalists" value={15} color="bg-emerald-500" />
              <ProgressBar label="Media / Press" value={8} color="bg-yellow-500" />
            </div>
          </div>

          {/* C. FLASH SALE IMPACT (Graph) */}
          <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
            <CardHeader 
              title="Flash Sale Impact" 
              sub="Conversion spike during 15m window" 
              icon={Zap} 
              highlight={true}
            />
            
            <div className="relative h-40 w-full mt-4 flex items-end px-2">
              {/* Grid Background */}
              <div className="absolute inset-0 retro-grid opacity-10"></div>
              
              {/* The Graph Line */}
              <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
                 <path 
                    d="M0,150 L50,140 L100,145 L150,120 L200,130 L220,50 L240,40 L260,60 L300,120 L350,130 L400,140" 
                    fill="none" 
                    stroke="url(#gradient)" 
                    strokeWidth="3"
                    className="drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                 />
                 <defs>
                   <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#4b5563" />
                     <stop offset="40%" stopColor="#4b5563" />
                     <stop offset="50%" stopColor="#eab308" />
                     <stop offset="70%" stopColor="#eab308" />
                     <stop offset="100%" stopColor="#4b5563" />
                   </linearGradient>
                 </defs>
              </svg>

              {/* The Spike Highlight */}
              <div className="absolute left-[52%] top-[10%] -translate-x-1/2 flex flex-col items-center">
                 <div className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 px-3 py-1 rounded text-xs font-bold mb-2 backdrop-blur-md animate-bounce">
                   +400% SPIKE
                 </div>
                 <div className="w-px h-20 border-l border-dashed border-yellow-500/50"></div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
              <strong className="text-yellow-400">Insight:</strong> The 2:00 PM push notification resulted in the highest conversion rate of the day. Recommend repeating at 6:00 PM.
            </p>
          </div>

          {/* D. STALL DISTRIBUTION (Leaderboard) */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-6">
            <CardHeader 
              title="Stall Engagement Distribution" 
              sub="% of unique users scanned per zone" 
              icon={BarChart3} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  {[
                    { name: 'Main Stage Area', val: 92, code: 'Z-01', color: 'bg-white' },
                    { name: 'VR Experience Hall', val: 78, code: 'Z-04', color: 'bg-cyan-400' },
                    { name: 'Refreshment Lounge', val: 65, code: 'Z-02', color: 'bg-cyan-600' },
                    { name: 'Merch Booth A', val: 45, code: 'Z-09', color: 'bg-cyan-800' },
                  ].map((zone, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                       <div className="font-mono text-xs text-gray-500 w-8">{zone.code}</div>
                       <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                             <span className="text-gray-300 font-medium">{zone.name}</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-sm overflow-hidden">
                             <div className={`h-full ${zone.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} style={{width: `${zone.val}%`}}></div>
                          </div>
                       </div>
                       <div className="text-xs font-bold text-white w-8 text-right">{zone.val}%</div>
                    </div>
                  ))}
               </div>

               {/* Wait Time Visual */}
               <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
                  <Wifi size={24} className="text-emerald-500 mb-2" />
                  <div className="text-4xl font-mono font-bold text-white mb-1">04:12</div>
                  <div className="text-xs text-gray-400 uppercase tracking-widest mb-4">Avg Wait Time</div>
                  <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[80%]"></div>
                  </div>
                  <p className="text-[10px] text-emerald-400 mt-2">
                    Running 12% faster than estimated capacity.
                  </p>
               </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/5 pt-8 pb-12 flex justify-between items-center text-xs text-gray-500">
           <div>
             SYSTEM ID: <span className="font-mono text-gray-400">SPON-882-X</span>
           </div>
           <div className="flex gap-4">
             <span>Data updated: Real-time</span>
             <span className="text-emerald-500">● Live Connection</span>
           </div>
        </footer>

      </main>
    </div>
  );
}