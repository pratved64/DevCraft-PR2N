"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, Clock, Activity,
  RefreshCw, Terminal, Cpu,
  Share2, Wifi, Crosshair
} from 'lucide-react';
import { fetchSponsorAnalytics, fetchStalls, type AnalyticsResponse, type StallInfo } from '../../lib/api';

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

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
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
    border: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.02);
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
  
  .pixel-btn {
    background: #111;
    border: 2px solid #333;
    color: #ccc;
    cursor: pointer;
    transition: all 0.2s;
  }
  .pixel-btn:hover {
    border-color: #22d3ee;
    color: #fff;
    box-shadow: 0 0 10px rgba(34,211,238,0.2);
  }
`;

// Map Buildings (Zones) - Visual Layout
const BUILDINGS = [
  { id: 'Z_A', top: '10%', left: '10%', width: '30%', height: '30%', label: 'ZONE A' },
  { id: 'Z_B', top: '10%', left: '60%', width: '30%', height: '30%', label: 'ZONE B' },
  { id: 'Z_C', top: '60%', left: '60%', width: '30%', height: '30%', label: 'ZONE C' },
  { id: 'Z_D', top: '60%', left: '10%', width: '30%', height: '30%', label: 'ZONE D' },
  { id: 'Z_STAGE', top: '40%', left: '40%', width: '20%', height: '20%', label: 'STAGE' },
];

const LIVE_LOGS = [
  { time: "14:32:05", msg: "USER_882 SCANNED QR AT TECHCORP", type: "SCAN", color: "text-cyan-400" },
  { time: "14:31:45", msg: "USER_104 REDEEMED 'TECHCORP STICKER'", type: "REDEEM", color: "text-purple-400" },
  { time: "14:30:12", msg: "VENUE_ALERT: MAIN STAGE CROWD SPIKE > 90%", type: "ALERT", color: "text-red-500 blink" },
  { time: "14:28:55", msg: "USER_993 SCANNED QR AT TECHCORP", type: "SCAN", color: "text-cyan-400" },
  { time: "14:25:20", msg: "INVENTORY DB SYNC COMPLETE", type: "SYS", color: "text-gray-400" },
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
      {sub && <div className={`text-[10px] font-console mt-1 uppercase text-gray-400`}>{sub}</div>}
    </div>
  </div>
);

// --- MAIN PAGE COMPONENT ---

export default function SponsorPage() {
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);

  // Data State
  const [stalls, setStalls] = useState<StallInfo[]>([]);
  const [selectedStall, setSelectedStall] = useState<SpreadStall | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  // Derived Type for UI mapping
  interface SpreadStall extends StallInfo {
    x: number;
    y: number;
    traffic: 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
  }

  useEffect(() => {
    // 1. Boot Sequence
    const timer = setTimeout(() => setBooting(false), 1200);

    // 2. Fetch Stalls
    fetchStalls().then(data => {
      setStalls(data);
      if (data.length > 0) {
        // Select first one by default for the dashboard view
        handleSelectStall(data[0].stall_id, data);
      }
    }).catch(console.error);

    return () => clearTimeout(timer);
  }, []);

  const handleSelectStall = (id: string, allStalls: StallInfo[] = stalls) => {
    setLoading(true);
    const stall = allStalls.find(s => s.stall_id === id);

    fetchSponsorAnalytics(id).then(data => {
      setAnalytics(data);
      setLoading(false);

      if (stall) {
        // Map stall to visual properties
        const mapped: SpreadStall = {
          ...stall,
          x: Math.min(90, Math.max(10, (stall.map_location.x_coord / 900) * 100)),
          y: Math.min(90, Math.max(10, (stall.map_location.y_coord / 900) * 100)),
          traffic: stall.crowd_level === 'High' ? 'CRITICAL' : stall.crowd_level === 'Medium' ? 'MED' : 'LOW'
        };
        setSelectedStall(mapped);
      }
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

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
              <h1 className="font-pixel text-sm text-white uppercase">
                {selectedStall ? selectedStall.company_name : 'SPONSOR'} <span className="text-cyan-500">TERMINAL</span>
              </h1>
              <div className="flex gap-4 mt-1 font-console text-xs text-gray-400">
                <span>ID: {selectedStall?.stall_id || '---'}</span>
                <span>ZONE: {selectedStall?.category || '---'}</span>
                <span className="text-emerald-500 animate-pulse">● LIVE UPLINK</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {stalls.length > 0 && (
              <select
                className="bg-[#111] text-gray-300 font-console text-xs border border-[#333] p-2 focus:border-cyan-500 outline-none"
                value={selectedStall?.stall_id || ''}
                onChange={(e) => handleSelectStall(e.target.value)}
              >
                {stalls.map(s => <option key={s.stall_id} value={s.stall_id}>{s.company_name}</option>)}
              </select>
            )}
            <button className="pixel-btn px-4 py-2 font-pixel text-[10px] flex items-center gap-2 hover:border-cyan-500" onClick={() => selectedStall && handleSelectStall(selectedStall.stall_id)}>
              <RefreshCw size={12} /> REFRESH
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
                label="TOTAL_VISITORS"
                value={analytics?.total_footfall.toLocaleString() || '---'}
                sub={analytics?.peak_traffic_hour ? `PEAK: ${analytics.peak_traffic_hour}:00` : '---'}
                icon={Users}
                colorClass="border-l-cyan-500"
              />
              <KPICard
                label="AVG_DWELL_TIME"
                value={analytics?.avg_wait_time || '---'}
                sub="OPTIMAL FLOW"
                icon={Clock}
                colorClass="border-l-emerald-500"
              />
              <KPICard
                label="CROSS_POLLINATION"
                value={analytics ? `${analytics.cross_pollination.toFixed(1)}%` : '---'}
                sub="VISITED MULTIPLE ZONES"
                icon={Share2}
                colorClass="border-l-purple-500"
              />
              <KPICard
                label="COST_PER_TOUCH"
                value={analytics ? `$${analytics.cost_per_interaction.toFixed(2)}` : '---'}
                sub="ROI TARGET MET"
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
                  <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
                    <div className="absolute inset-0 map-grid"></div>

                    {/* Architectural Blocks */}
                    {BUILDINGS.map((b) => (
                      <div key={b.id} className="building-block" style={{ top: b.top, left: b.left, width: b.width, height: b.height }}>
                        <span className="font-pixel text-[8px] text-[#333] opacity-50">{b.label}</span>
                      </div>
                    ))}

                    {/* Stalls / Nodes */}
                    {stalls.map(stall => {
                      const x = Math.min(90, Math.max(10, (stall.map_location.x_coord / 900) * 100));
                      const y = Math.min(90, Math.max(10, (stall.map_location.y_coord / 900) * 100));
                      const isSelected = selectedStall?.stall_id === stall.stall_id;

                      return (
                        <div
                          key={stall.stall_id}
                          className="absolute flex flex-col items-center z-20 group"
                          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                        >
                          {/* Pulsing Aura */}
                          <div className={`absolute w-8 h-8 rounded-full opacity-30 animate-pulse ${stall.crowd_level === 'High' ? 'heat-critical' : 'heat-low'}`}></div>

                          {/* Pin / Node */}
                          <div className={`
                                 w-4 h-4 border-2 flex items-center justify-center transition-all
                                 ${isSelected ? 'border-cyan-400 bg-[#111] z-30 scale-125' : 'border-[#444] bg-[#222]'}
                              `}>
                            {isSelected && <Crosshair size={8} className="text-cyan-400" />}
                          </div>

                          {/* Label */}
                          {isSelected && (
                            <div className={`mt-2 px-1 font-pixel text-[6px] whitespace-nowrap bg-black/80 border text-cyan-400 border-cyan-500/50`}>
                              {stall.company_name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Info Panel Bottom */}
                  <div className="h-24 bg-[#050505] border-t border-[#333] p-3 relative shadow-inner">
                    {selectedStall ? (
                      <div className="flex h-full gap-4">
                        <div className="flex-1">
                          <div className="font-pixel text-[8px] text-gray-400 mb-1">TARGET: <span className="text-white">{selectedStall.company_name}</span></div>
                          <div className="font-console text-xs text-gray-500">Network: <span className="text-white">{selectedStall.category}</span></div>
                        </div>
                        <div className="w-24 border-l border-[#333] pl-3 flex flex-col justify-center">
                          <div className="font-pixel text-[6px] text-purple-400 mb-1">RETENTION</div>
                          <div className="text-xl font-console text-white">
                            {analytics?.flash_sale_lift ? `+${analytics.flash_sale_lift}%` : '---'}
                          </div>
                        </div>
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

                  {/* Histogram using real data would go here, continuing with mock for visual style */}
                  <div className="flex-1 flex items-end gap-1 border-b-2 border-l-2 border-[#333] p-2 bg-[#050505] relative">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, #333 25%, #333 26%, transparent 27%, transparent 74%, #333 75%, #333 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #333 25%, #333 26%, transparent 27%, transparent 74%, #333 75%, #333 76%, transparent 77%, transparent)', backgroundSize: '30px 30px' }}></div>

                    {[10, 20, 15, 30, 45, 60, 40, 50, 85, 70, 55, 30, 20, 15].map((h, i) => {
                      let barColor = "bg-cyan-600";
                      if (h > 60) barColor = "bg-cyan-400 retro-bar-cyan";

                      return (
                        <div key={i} className="flex-1 group relative h-full flex items-end">
                          <div
                            className={`w-full hover:brightness-125 transition-all duration-300 ${barColor}`}
                            style={{ height: `${h}%` }}
                          ></div>
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
          </>
        )}

      </main>
    </div>
  );
}