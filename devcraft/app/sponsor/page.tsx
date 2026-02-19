"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, Clock, Activity, 
  RefreshCw, Terminal, Cpu, 
  Share2, MapPin, Wifi, Crosshair
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

  /* --- MAP VISUALS --- */
  .map-grid {
    background-image: radial-gradient(#333 15%, transparent 16%);
    background-size: 20px 20px;
    opacity: 0.4;
  }

  .building-block {
    position: absolute;
    background-color: #1a1a1a;
    box-shadow: 4px 4px 0px #0a0a0a; 
    border: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* HEAT LEVELS */
  .heat-critical { background-color: #dc2626; box-shadow: 0 0 15px #dc2626; }
  .heat-high { background-color: #ca8a04; box-shadow: 0 0 10px #ca8a04; }
  .heat-low { background-color: #0891b2; }

  /* CONNECTION LINE */
  .path-line {
    stroke-dasharray: 4;
    animation: dash 1s linear infinite;
  }
  @keyframes dash { to { stroke-dashoffset: -8; } }

  .blink { animation: blink 1s step-end infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  .retro-bar-cyan { background: repeating-linear-gradient(45deg, #0e7490, #0e7490 2px, #22d3ee 2px, #22d3ee 4px); }
`;

// --- MOCK DATA ---
const SPONSOR_DATA = {
  name: "TechCorp",
  id: "SPON-882-X",
  loc: { x: 25, y: 25 }, // Hardcoded to match Zone A center
  location: "ZONE_A"
};

// Map Buildings (Zones)
const BUILDINGS = [
  { id: 'Z_A', top: '10%', left: '10%', width: '30%', height: '30%', label: 'ZONE A' },
  { id: 'Z_B', top: '10%', left: '60%', width: '30%', height: '30%', label: 'ZONE B' },
  { id: 'Z_C', top: '60%', left: '60%', width: '30%', height: '30%', label: 'ZONE C' },
  { id: 'Z_D', top: '60%', left: '10%', width: '30%', height: '30%', label: 'ZONE D' },
  { id: 'Z_STAGE', top: '40%', left: '40%', width: '20%', height: '20%', label: 'STAGE' },
];

// Stalls mapped EXACTLY to the centers of the BUILDINGS above
const STALLS = [
  { id: 'S1', name: 'TECHCORP (YOU)', traffic: 'LOW', x: 25, y: 25, isSelf: true }, // Center of Z_A
  { id: 'S2', name: 'FOOD COURT', traffic: 'HIGH', x: 75, y: 25, shared_audience: 65 }, // Center of Z_B
  { id: 'S3', name: 'MERCH SHOP', traffic: 'MED', x: 75, y: 75, shared_audience: 45 }, // Center of Z_C
  { id: 'S4', name: 'AI LABS', traffic: 'LOW', x: 25, y: 75, shared_audience: 78 }, // Center of Z_D
  { id: 'S5', name: 'MAIN STAGE', traffic: 'CRITICAL', x: 50, y: 50, shared_audience: 92 }, // Center of STAGE
];

const LIVE_LOGS = [
  { time: "14:32:05", msg: "USER_882 SCANNED QR AT TECHCORP", type: "SCAN", color: "text-cyan-400" },
  { time: "14:31:45", msg: "USER_104 REDEEMED 'TECHCORP STICKER'", type: "REDEEM", color: "text-purple-400" },
  { time: "14:30:12", msg: "VENUE_ALERT: MAIN STAGE CROWD SPIKE > 90%", type: "ALERT", color: "text-red-500 blink" },
  { time: "14:28:55", msg: "USER_993 SCANNED QR AT TECHCORP", type: "SCAN", color: "text-cyan-400" },
  { time: "14:25:20", msg: "INVENTORY DB SYNC COMPLETE", type: "SYS", color: "text-gray-400" },
  { time: "14:24:10", msg: "GLOBAL_STAT: CROSS-POLLINATION +12%", type: "SYS", color: "text-emerald-500" },
  { time: "14:22:00", msg: "USER_552 EXITED VENUE", type: "SYS", color: "text-gray-600" },
  { time: "14:20:15", msg: "USER_112 SCANNED QR AT TECHCORP", type: "SCAN", color: "text-cyan-400" },
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

// --- MAIN PAGE COMPONENT ---

export default function SingleSponsorPage() {
  const [booting, setBooting] = useState(true);
  const [selectedStall, setSelectedStall] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const getHeatClass = (traffic: string) => {
    if (traffic === 'CRITICAL') return 'heat-critical';
    if (traffic === 'HIGH' || traffic === 'MED') return 'heat-high';
    return 'heat-low';
  };

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
                <span>ZONE: {SPONSOR_DATA.location}</span>
                <span className="text-emerald-500 animate-pulse">● LIVE UPLINK</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="pixel-btn px-4 py-2 font-pixel text-[10px] flex items-center gap-2 hover:border-cyan-500">
              <RefreshCw size={12} /> REFRESH_DATA
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
            <div className="text-[10px] mt-2 text-gray-500">FETCHING MACRO TELEMETRY</div>
          </div>
        ) : (
          <>
            {/* 1. KPI METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <KPICard 
                label="YOUR_VISITORS" 
                value="1,240" 
                sub="+12% VS AVG" 
                icon={Users} 
                colorClass="border-l-cyan-500"
              />
              <KPICard 
                label="AVG_DWELL_TIME" 
                value="12m 30s" 
                sub="OPTIMAL FLOW" 
                icon={Clock} 
                colorClass="border-l-emerald-500"
              />
              <KPICard 
                label="CROSS_POLLINATION" 
                value="68%" 
                sub="VISITED >2 ZONES" 
                icon={Share2} 
                colorClass="border-l-purple-500"
              />
              <KPICard 
                label="VENUE_STATUS" 
                value="CRITICAL" 
                sub="MAIN STAGE PEAKING" 
                icon={Activity} 
                colorClass="border-l-red-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 2. LEFT COL: MACRO HEATMAP */}
              <div className="lg:col-span-1 space-y-6">
                
                <div className="pixel-card h-[450px] flex flex-col">
                  <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#050505]">
                    <h3 className="font-pixel text-[10px] text-cyan-400">MACRO_HEATMAP</h3>
                    <Wifi size={12} className="text-emerald-500 animate-pulse" />
                  </div>
                  
                  {/* Map Visualizer */}
                  <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden cursor-crosshair" onClick={() => setSelectedStall(null)}>
                     <div className="absolute inset-0 map-grid"></div>

                     {/* Architectural Blocks */}
                     {BUILDINGS.map((b) => (
                       <div key={b.id} className="building-block" style={{ top: b.top, left: b.left, width: b.width, height: b.height }}>
                          <span className="font-pixel text-[8px] text-[#333] opacity-50">{b.label}</span>
                       </div>
                     ))}

                     {/* Dynamic Connection Line */}
                     {selectedStall && !selectedStall.isSelf && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                          <line 
                            x1={`${SPONSOR_DATA.loc.x}%`} y1={`${SPONSOR_DATA.loc.y}%`} 
                            x2={`${selectedStall.x}%`} y2={`${selectedStall.y}%`} 
                            stroke="#a855f7" 
                            strokeWidth="2" 
                            className="path-line"
                          />
                        </svg>
                     )}

                     {/* Stalls / Nodes */}
                     {STALLS.map(stall => (
                       <div 
                         key={stall.id}
                         onClick={(e) => { e.stopPropagation(); setSelectedStall(stall); }}
                         className="absolute flex flex-col items-center z-20 group"
                         style={{ left: `${stall.x}%`, top: `${stall.y}%`, transform: 'translate(-50%, -50%)' }}
                       >
                          {/* Pulsing Aura */}
                          <div className={`absolute w-8 h-8 rounded-full opacity-30 animate-pulse ${getHeatClass(stall.traffic)}`}></div>

                          {/* Pin / Node */}
                          <div className={`
                             w-4 h-4 border-2 flex items-center justify-center transition-all
                             ${stall.isSelf ? 'border-cyan-400 bg-[#111] z-30' : 'border-[#444] bg-[#222] hover:bg-[#444]'}
                             ${selectedStall?.id === stall.id ? 'scale-150 ring-2 ring-purple-500' : ''}
                          `}>
                             {stall.isSelf && <Crosshair size={8} className="text-cyan-400" />}
                          </div>
                          
                          {/* Label */}
                          <div className={`mt-2 px-1 font-pixel text-[6px] whitespace-nowrap bg-black/80 border ${stall.isSelf ? 'text-cyan-400 border-cyan-500/50' : 'text-gray-400 border-[#333]'}`}>
                            {stall.name}
                          </div>
                       </div>
                     ))}
                  </div>

                  {/* Info Panel Bottom */}
                  <div className="h-24 bg-[#050505] border-t border-[#333] p-3 relative shadow-inner">
                     {selectedStall ? (
                       <div className="flex h-full gap-4">
                          <div className="flex-1">
                             <div className="font-pixel text-[8px] text-gray-400 mb-1">TARGET: <span className="text-white">{selectedStall.name}</span></div>
                             <div className="font-console text-xs text-gray-500">TRAFFIC: <span className={selectedStall.traffic === 'CRITICAL' ? 'text-red-500' : 'text-yellow-500'}>{selectedStall.traffic}</span></div>
                          </div>
                          {!selectedStall.isSelf && (
                            <div className="w-24 border-l border-[#333] pl-3 flex flex-col justify-center">
                               <div className="font-pixel text-[6px] text-purple-400 mb-1">SHARED AUDIENCE</div>
                               <div className="text-xl font-console text-white">{selectedStall.shared_audience}%</div>
                            </div>
                          )}
                       </div>
                     ) : (
                       <div className="h-full flex items-center justify-center font-pixel text-[8px] text-gray-600 opacity-50">
                          SELECT NODE FOR INTEL
                       </div>
                     )}
                  </div>
                </div>

              </div>

              {/* 3. CENTER/RIGHT COL: ANALYTICS & FEED */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Traffic Graph */}
                <div className="pixel-card p-6 h-[250px] flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-pixel text-xs text-cyan-400">YOUR_TRAFFIC_VELOCITY</h3>
                      <p className="font-console text-xs text-gray-500">SCANS PER HOUR</p>
                    </div>
                    <div className="text-right">
                      <div className="font-pixel text-xs text-emerald-500 animate-pulse">LIVE_SYNC</div>
                    </div>
                  </div>

                  {/* Histogram */}
                  <div className="flex-1 flex items-end gap-1 border-b-2 border-l-2 border-[#333] p-2 bg-[#050505] relative">
                     <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, #333 25%, #333 26%, transparent 27%, transparent 74%, #333 75%, #333 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #333 25%, #333 26%, transparent 27%, transparent 74%, #333 75%, #333 76%, transparent 77%, transparent)', backgroundSize: '30px 30px'}}></div>
                     
                     {[10, 20, 15, 30, 45, 60, 40, 50, 85, 70, 55, 30, 20, 15].map((h, i) => {
                        let barColor = "bg-cyan-600";
                        if (h > 60) barColor = "bg-cyan-400 retro-bar-cyan";

                        return (
                          <div key={i} className="flex-1 group relative h-full flex items-end">
                             <div 
                                className={`w-full hover:brightness-125 transition-all duration-300 ${barColor}`} 
                                style={{height: `${h}%`}}
                             ></div>
                             {/* Hover Value */}
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111] border border-cyan-500 px-1 text-[8px] font-pixel text-cyan-400 z-10">
                                {h}
                             </div>
                          </div>
                        );
                     })}
                  </div>
                </div>

                {/* Live Log Terminal (Full Width Bottom) */}
                <div className="pixel-card p-4 bg-[#050505] border-[#333] overflow-hidden flex flex-col flex-1 min-h-[175px]">
                  <h3 className="font-pixel text-[10px] text-gray-400 mb-2 border-b border-[#333] pb-2 flex justify-between">
                    <span>SYSTEM_EVENT_LOG</span>
                    <Activity size={10} className="animate-pulse text-cyan-500" />
                  </h3>
                  <div className="flex-1 overflow-y-auto font-console text-xs space-y-2 p-1">
                      {LIVE_LOGS.map((log, i) => (
                        <div key={i} className="flex gap-3 border-b border-[#1a1a1a] pb-1 hover:bg-[#111]">
                            <span className="text-gray-600 w-20">[{log.time}]</span>
                            <span className={`flex-1 ${log.color}`}>
                              {log.type === 'SCAN' ? '>>> ' : '--- '} {log.msg}
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