"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, Clock, Activity, 
  RefreshCw, Terminal, Cpu, 
  Target, MapPin, Wifi
} from 'lucide-react';

// --- PIXEL ART STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

  :root {
    --term-bg: #050a05;
    --term-grid: #1a1a1a;
    --term-border: #333;
  }

  .font-pixel { font-family: 'Press Start 2P', cursive; }
  .font-console { font-family: 'VT323', monospace; }

  /* CRT MONITOR EFFECT */
  .crt-container {
    background-color: var(--term-bg);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    color: #eee;
  }

  .scanlines {
    background: linear-gradient(
      to bottom,
      rgba(255,255,255,0),
      rgba(255,255,255,0) 50%,
      rgba(0,0,0,0.1) 50%,
      rgba(0,0,0,0.1)
    );
    background-size: 100% 4px;
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 50;
    opacity: 0.6;
  }

  /* RETRO CARD */
  .pixel-card {
    background: #0f0f0f;
    border: 2px solid #444;
    box-shadow: 4px 4px 0px #222;
    position: relative;
    transition: all 0.2s;
  }
  
  .pixel-card:hover {
    border-color: #666;
    transform: translate(-1px, -1px);
    box-shadow: 5px 5px 0px #222;
  }

  /* HEATMAP GRID */
  .heatmap-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
  }
  
  .heat-cell {
    aspect-ratio: 1;
    position: relative;
    transition: background-color 1s ease;
  }
  
  .heat-cell.stall {
    background-color: #eee;
    border: 2px solid #fff;
    box-shadow: 0 0 10px #fff;
    z-index: 10;
  }

  .heat-low { background-color: #0891b2; opacity: 0.3; }   /* Cyan */
  .heat-med { background-color: #ca8a04; opacity: 0.6; }   /* Yellow */
  .heat-high { background-color: #dc2626; opacity: 0.8; }  /* Red */

  /* UI ELEMENTS */
  .pixel-btn {
    border: 2px solid #444;
    background: #222;
    color: #eee;
    box-shadow: 2px 2px 0px #000;
    transition: all 0.1s;
    cursor: pointer;
  }
  .pixel-btn:hover {
    background: #333;
    color: #fff;
    border-color: #666;
  }

  .blink { animation: blink 1s step-end infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  .retro-bar-cyan { background: repeating-linear-gradient(45deg, #0e7490, #0e7490 2px, #22d3ee 2px, #22d3ee 4px); }
  .retro-bar-purple { background: repeating-linear-gradient(45deg, #7e22ce, #7e22ce 2px, #d8b4fe 2px, #d8b4fe 4px); }
  .retro-bar-orange { background: repeating-linear-gradient(45deg, #c2410c, #c2410c 2px, #fdba74 2px, #fdba74 4px); }
`;

// --- MOCK DATA ---
const SPONSOR_DATA = {
  name: "TechCorp",
  id: "SPON-882-X",
  category: "SOFTWARE_ENG",
  location: "ZONE_A_12",
};

const LIVE_LOGS = [
  { time: "14:32:05", msg: "USER_882 SCANNED QR", type: "SCAN", color: "text-cyan-400" },
  { time: "14:31:45", msg: "USER_104 REDEEMED SWAG", type: "REDEEM", color: "text-purple-400" },
  { time: "14:30:12", msg: "CROWD DENSITY SPIKE > 80%", type: "ALERT", color: "text-red-500 blink" },
  { time: "14:28:55", msg: "USER_993 SCANNED QR", type: "SCAN", color: "text-cyan-400" },
  { time: "14:25:20", msg: "INVENTORY SYNC COMPLETE", type: "SYS", color: "text-gray-400" },
  { time: "14:24:10", msg: "USER_771 ENTERED ZONE", type: "ENTER", color: "text-emerald-500" },
  { time: "14:22:00", msg: "USER_552 LEFT ZONE", type: "EXIT", color: "text-gray-500" },
  { time: "14:20:15", msg: "DATA_PACKET_UPLOADED", type: "SYS", color: "text-gray-400" },
];

// --- SUB-COMPONENTS ---

const KPICard = ({ label, value, sub, icon: Icon, colorClass }: any) => (
  <div className={`pixel-card p-4 flex flex-col justify-between h-28 border-l-4 ${colorClass}`}>
    <div className="flex justify-between items-start">
      <span className="text-[10px] font-pixel text-gray-400 uppercase">{label}</span>
      <Icon size={16} className="text-gray-500" />
    </div>
    <div>
      <div className="text-2xl font-console text-white tracking-widest">{value}</div>
      {sub && <div className={`text-[10px] font-console mt-1 uppercase ${colorClass.replace('border-', 'text-')}`}>{sub}</div>}
    </div>
  </div>
);

// --- HEATMAP COMPONENT ---
const StallHeatmap = () => {
  // Simulating 5x5 grid around the stall
  // Index 12 is the center (The Stall)
  const [gridData, setGridData] = useState<string[]>([]);

  useEffect(() => {
    // Generate random heat signature
    const generateHeat = () => {
      const data = Array(25).fill('').map((_, i) => {
        if (i === 12) return 'stall';
        const rand = Math.random();
        if (rand > 0.8) return 'heat-high';
        if (rand > 0.5) return 'heat-med';
        return 'heat-low';
      });
      setGridData(data);
    };

    generateHeat();
    const interval = setInterval(generateHeat, 2000); // Live update
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex justify-between items-end mb-4 border-b-2 border-[#333] pb-2">
        <h3 className="font-pixel text-xs text-orange-400">ZONE_DENSITY</h3>
        <span className="font-console text-xs text-gray-500 animate-pulse">LIVE SENSOR</span>
      </div>
      
      <div className="bg-[#050505] p-2 border-2 border-[#333] relative flex-1 flex flex-col justify-center">
        {/* Radar Line Animation */}
        <div className="absolute w-full h-[2px] bg-cyan-500/20 top-0 animate-[scanline_3s_linear_infinite] z-20 pointer-events-none"></div>

        <div className="heatmap-grid w-full max-w-[220px] mx-auto">
          {gridData.map((status, i) => (
            <div key={i} className={`heat-cell ${status}`}>
              {status === 'stall' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin size={16} className="text-black animate-bounce" fill="black" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-6 text-[8px] font-pixel text-gray-500">
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#dc2626]"></div> CRITICAL</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#ca8a04]"></div> HIGH</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#0891b2]"></div> LOW</div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function SingleSponsorPage() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="crt-container font-sans selection:bg-cyan-500 selection:text-black">
      <style>{styles}</style>
      <div className="scanlines"></div>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b-4 border-[#333] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#222] flex items-center justify-center border-2 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Terminal className="text-cyan-400" size={24} />
            </div>
            <div>
              <h1 className="font-pixel text-sm text-white uppercase">{SPONSOR_DATA.name} <span className="text-cyan-500">TERMINAL</span></h1>
              <div className="flex gap-4 mt-1 font-console text-xs text-gray-400">
                <span>ID: {SPONSOR_DATA.id}</span>
                <span>LOC: {SPONSOR_DATA.location}</span>
                <span className="text-emerald-500 animate-pulse">● ONLINE</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="pixel-btn px-4 py-2 font-pixel text-[10px] flex items-center gap-2 hover:border-cyan-500">
              <RefreshCw size={12} /> SYNC
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-20 relative z-10">
        
        {booting ? (
          <div className="h-[60vh] flex flex-col items-center justify-center font-pixel text-cyan-500 animate-pulse">
            <Cpu size={64} className="mb-4" />
            <div>ESTABLISHING UPLINK...</div>
            <div className="text-[10px] mt-2">VERIFYING CREDENTIALS</div>
          </div>
        ) : (
          <>
            {/* 1. KPI METRICS (Colorful) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <KPICard 
                label="VISITORS_TODAY" 
                value="1,240" 
                sub="+12% VS AVG" 
                icon={Users} 
                colorClass="border-l-cyan-500"
              />
              <KPICard 
                label="AVG_WAIT_TIME" 
                value="12m 30s" 
                sub="OPTIMAL FLOW" 
                icon={Clock} 
                colorClass="border-l-emerald-500"
              />
              <KPICard 
                label="LEADS_CAPTURED" 
                value="854" 
                sub="68% CONVERSION" 
                icon={Target} 
                colorClass="border-l-purple-500"
              />
              <KPICard 
                label="STALL_INTENSITY" 
                value="HIGH" 
                sub="92% CAPACITY" 
                icon={Activity} 
                colorClass="border-l-red-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 2. LEFT COL: STALL HEATMAP ONLY */}
              <div className="lg:col-span-1">
                {/* Heatmap Card */}
                <div className="pixel-card p-4 h-full min-h-[400px]">
                  <StallHeatmap />
                </div>
              </div>

              {/* 3. CENTER/RIGHT COL: ANALYTICS & FEED */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Traffic Graph */}
                <div className="pixel-card p-6 h-[280px] flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-pixel text-xs text-cyan-400">TRAFFIC_ANALYSIS</h3>
                      <p className="font-console text-xs text-gray-500">VISITORS PER HOUR</p>
                    </div>
                    <div className="text-right">
                      <div className="font-pixel text-xs text-emerald-500 animate-pulse">LIVE</div>
                    </div>
                  </div>

                  {/* Colorful Histogram */}
                  <div className="flex-1 flex items-end gap-1 border-b-2 border-l-2 border-[#333] p-2 bg-[#050505] relative">
                     <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, #333 25%, #333 26%, transparent 27%, transparent 74%, #333 75%, #333 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #333 25%, #333 26%, transparent 27%, transparent 74%, #333 75%, #333 76%, transparent 77%, transparent)', backgroundSize: '30px 30px'}}></div>
                     
                     {[20, 35, 40, 50, 80, 95, 60, 40, 30, 25, 45, 65, 85, 55, 30].map((h, i) => {
                        // Dynamic color based on height
                        let barColor = "bg-cyan-600";
                        if (h > 50) barColor = "bg-purple-600";
                        if (h > 80) barColor = "bg-red-600";

                        return (
                          <div key={i} className="flex-1 group relative h-full flex items-end">
                             <div 
                                className={`w-full hover:brightness-125 transition-all duration-500 ${barColor}`} 
                                style={{height: `${h}%`}}
                             ></div>
                             {/* Hover Value */}
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111] border border-white px-1 text-[8px] font-pixel text-white z-10">
                                {h}
                             </div>
                          </div>
                        );
                     })}
                  </div>
                </div>

                {/* Live Log Terminal (Expanded) */}
                <div className="pixel-card p-4 bg-[#050505] border-[#333] overflow-hidden flex flex-col h-64">
                  <h3 className="font-pixel text-[10px] text-gray-400 mb-2 border-b border-[#333] pb-2 flex justify-between">
                    <span>LIVE_LOGS</span>
                    <Activity size={10} className="animate-pulse" />
                  </h3>
                  <div className="flex-1 overflow-y-auto font-console text-xs space-y-2 p-1">
                      {LIVE_LOGS.map((log, i) => (
                        <div key={i} className="flex gap-2 border-b border-[#1a1a1a] pb-1 hover:bg-[#111]">
                            <span className="text-gray-600">[{log.time}]</span>
                            <span className={log.color}>
                              {log.type === 'SCAN' && '>'} {log.msg}
                            </span>
                        </div>
                      ))}
                      <div className="text-cyan-500 animate-pulse">_</div>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <footer className="mt-8 border-t-2 border-[#333] pt-4 flex justify-between items-center text-[10px] font-pixel text-gray-500">
               <div>TERM_ID: {SPONSOR_DATA.id}</div>
               <div className="flex gap-4">
                 <span>UPTIME: 04:22:15</span>
                 <span className="text-emerald-500">ENCRYPTED</span>
               </div>
            </footer>
          </>
        )}

      </main>
    </div>
  );
}