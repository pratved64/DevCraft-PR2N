"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, Clock, Activity, 
  RefreshCw, Terminal, Cpu, 
  MapPin, Wifi, Lock,
  Globe, Database, ShieldAlert,
  AlertTriangle, Crosshair, X, Zap
} from 'lucide-react';

// --- PIXEL ART & CYBER STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

  :root {
    --neon-cyan: #22d3ee;
    --neon-purple: #a855f7;
    --dark-bg: #020502;
    --panel-bg: #050a05;
  }

  .font-pixel { font-family: 'Press Start 2P', cursive; }
  .font-console { font-family: 'VT323', monospace; }

  /* CRT MONITOR EFFECT */
  .crt-container {
    background-color: var(--dark-bg);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    color: #eee;
  }

  .scanlines {
    background: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 50%);
    background-size: 100% 4px;
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 50;
  }

  /* CYBER CARD */
  .cyber-card {
    background: rgba(5, 15, 10, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(34, 211, 238, 0.2);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(34, 211, 238, 0.05);
    position: relative;
    transition: all 0.3s ease;
  }
  
  .cyber-card:hover {
    border-color: var(--neon-cyan);
    box-shadow: 0 0 30px rgba(34, 211, 238, 0.15), inset 0 0 15px rgba(34, 211, 238, 0.1);
  }

  /* --- MAP VISUALS --- */
  .map-grid {
    background-image: 
      linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: center;
  }

  .building-block {
    position: absolute;
    background-color: rgba(10, 20, 15, 0.6);
    border: 1px solid rgba(34, 211, 238, 0.2);
    box-shadow: inset 0 0 20px rgba(34, 211, 238, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* HEAT LEVELS */
  .heat-critical { background-color: #ef4444; box-shadow: 0 0 30px #ef4444; }
  .heat-high { background-color: #eab308; box-shadow: 0 0 20px #eab308; }
  .heat-low { background-color: #22d3ee; box-shadow: 0 0 15px #22d3ee; }

  .blink { animation: blink 1s step-end infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  /* SLIDE IN ANIMATION */
  .slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  /* CYBER BUTTON */
  .cyber-button {
    background: linear-gradient(45deg, transparent 5%, var(--neon-cyan) 5%);
    color: #000;
    box-shadow: 4px 0px 0px #00e5ff;
    transition: all 0.2s;
    font-weight: bold;
    cursor: pointer;
  }
  .cyber-button:active {
    box-shadow: 1px 0px 0px #00e5ff;
    transform: translateX(3px);
  }

  /* RETRO TABLE */
  .retro-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'VT323', monospace;
    font-size: 16px;
  }
  .retro-table th {
    text-align: left;
    padding: 12px 8px;
    color: var(--neon-cyan);
    border-bottom: 2px solid rgba(34, 211, 238, 0.3);
    text-transform: uppercase;
    font-family: 'Press Start 2P', cursive;
    font-size: 8px;
    letter-spacing: 1px;
    background: rgba(34, 211, 238, 0.05);
  }
  .retro-table td {
    padding: 12px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    color: #ccc;
  }
  .retro-table tr:hover td {
    background: rgba(34, 211, 238, 0.08);
    color: #fff;
  }
`;

// --- MOCK DATA FOR GLOBAL ORGANIZER ---
const GLOBAL_DATA = {
  id: "MASTER-CTRL-01",
  total_attendees: "15,240",
  active_nodes: 142,
  total_scans: "89,450",
  system_health: "99.9%"
};

const BUILDINGS = [
  { id: 'Z_A', top: '10%', left: '10%', width: '25%', height: '35%', label: 'ZONE A (TECH)' },
  { id: 'Z_B', top: '10%', left: '65%', width: '25%', height: '35%', label: 'ZONE B (CAREER)' },
  { id: 'Z_C', top: '55%', left: '65%', width: '25%', height: '35%', label: 'ZONE C (FOOD)' },
  { id: 'Z_D', top: '55%', left: '10%', width: '25%', height: '35%', label: 'ZONE D (RETAIL)' },
  { id: 'Z_STAGE', top: '35%', left: '40%', width: '20%', height: '30%', label: 'MAIN STAGE' },
];

// Unified Data Structure
const ALL_STALLS = [
  { id: 'ST-01', name: 'TechCorp', zone: 'Zone A', traffic: 'LOW', visitors: 1240, wait: '2m', status: 'OPTIMAL', x: 22, y: 27 },
  { id: 'ST-02', name: 'CyberSys', zone: 'Zone A', traffic: 'MED', visitors: 2100, wait: '12m', status: 'STABLE', x: 18, y: 15 },
  { id: 'ST-03', name: 'FutureHire', zone: 'Zone B', traffic: 'HIGH', visitors: 4500, wait: '28m', status: 'WARNING', x: 70, y: 20 },
  { id: 'ST-04', name: 'UniLinks', zone: 'Zone B', traffic: 'LOW', visitors: 890, wait: '1m', status: 'OPTIMAL', x: 82, y: 35 },
  { id: 'ST-05', name: 'Main Stage', zone: 'Center', traffic: 'CRITICAL', visitors: 8200, wait: '55m', status: 'BOTTLENECK', x: 50, y: 50 },
  { id: 'ST-06', name: 'Burger Town', zone: 'Zone C', traffic: 'CRITICAL', visitors: 6100, wait: '45m', status: 'BOTTLENECK', x: 70, y: 80 },
  { id: 'ST-07', name: 'Soda Pop', zone: 'Zone C', traffic: 'MED', visitors: 3200, wait: '15m', status: 'STABLE', x: 82, y: 65 },
  { id: 'ST-08', name: 'Merch Shop A', zone: 'Zone D', traffic: 'HIGH', visitors: 5100, wait: '35m', status: 'WARNING', x: 28, y: 65 },
  { id: 'ST-09', name: 'Exit Gate', zone: 'Zone D', traffic: 'LOW', visitors: 540, wait: '0m', status: 'OPTIMAL', x: 15, y: 80 },
];

const GLOBAL_LOGS = [
  { time: "14:35:10", msg: "SYS_OVERRIDE: Lure deployed at TechCorp", type: "ADMIN", color: "text-purple-400" },
  { time: "14:30:12", msg: "VENUE_ALERT: Main Stage capacity > 90%", type: "ALERT", color: "text-red-500 blink" },
  { time: "14:28:55", msg: "DATA_LAKE: 10,000th scan recorded", type: "SYS", color: "text-cyan-400" },
  { time: "14:25:20", msg: "VENUE_ALERT: Burger Town queue blocking aisle", type: "ALERT", color: "text-red-500" },
  { time: "14:20:15", msg: "SYS_HEALTH: Database sync complete", type: "SYS", color: "text-gray-400" },
];

// --- SUB-COMPONENTS ---

const KPICard = ({ label, value, sub, icon: Icon, colorClass, borderClass }: any) => (
  <div className={`cyber-card p-5 flex flex-col justify-between h-28 border-l-4 ${borderClass}`}>
    <div className="flex justify-between items-start">
      <span className="text-[10px] font-pixel text-gray-400 uppercase">{label}</span>
      <Icon size={16} className={colorClass} />
    </div>
    <div>
      <div className="text-3xl font-console text-white tracking-widest">{value}</div>
      {sub && <div className={`text-xs font-console mt-1 uppercase ${colorClass}`}>{sub}</div>}
    </div>
  </div>
);

// --- MAIN PAGE COMPONENT ---

export default function OrganizerPage() {
  const [booting, setBooting] = useState(true);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [selectedStall, setSelectedStall] = useState<typeof ALL_STALLS[0] | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const getHeatClass = (traffic: string) => {
    if (traffic === 'CRITICAL') return 'heat-critical';
    if (traffic === 'HIGH') return 'heat-high';
    return 'heat-low';
  };

  const getStatusColor = (status: string) => {
    if (status === 'BOTTLENECK') return 'text-red-500';
    if (status === 'WARNING') return 'text-yellow-500';
    return 'text-emerald-400';
  };

  return (
    <div className="crt-container font-sans selection:bg-cyan-500 selection:text-black">
      <style>{styles}</style>
      <div className="scanlines"></div>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-40 bg-[#020502]/90 backdrop-blur-md border-b border-cyan-500/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-950 border-2 border-purple-500 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              <Globe className="text-purple-400" size={20} />
            </div>
            <div>
              <h1 className="font-pixel text-sm text-white uppercase tracking-widest">
                EVENT_PULSE <span className="text-purple-500">MASTER_CTRL</span>
              </h1>
              <div className="flex gap-4 mt-1 font-console text-xs text-gray-500">
                <span>ID: {GLOBAL_DATA.id}</span>
                <span>AUTH: ROOT_ADMIN</span>
                <span className="text-emerald-400 animate-pulse">● GLOBAL UPLINK</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="cyber-button px-6 py-2 font-pixel text-[10px] flex items-center gap-2 !bg-purple-500 !shadow-[4px_0_0_#d8b4fe]">
              <ShieldAlert size={12} /> BROADCAST ALERT
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-20 relative z-10">
        
        {booting ? (
          <div className="h-[60vh] flex flex-col items-center justify-center font-pixel text-purple-500 animate-pulse">
            <Database size={64} className="mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
            <div className="tracking-widest">ESTABLISHING OMNISCIENCE...</div>
            <div className="text-[10px] mt-3 text-purple-700">AGGREGATING ALL NODES</div>
          </div>
        ) : (
          <>
            {/* 1. GLOBAL KPI METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <KPICard 
                label="TOTAL_ATTENDEES" 
                value={GLOBAL_DATA.total_attendees} 
                sub="VENUE CAPACITY: 85%" 
                icon={Users} 
                colorClass="text-cyan-400"
                borderClass="border-cyan-500"
              />
              <KPICard 
                label="TOTAL_SCANS_LOGGED" 
                value={GLOBAL_DATA.total_scans} 
                sub="~42 SCANS / MIN" 
                icon={Activity} 
                colorClass="text-purple-400"
                borderClass="border-purple-500"
              />
              <KPICard 
                label="ACTIVE_STALL_NODES" 
                value={GLOBAL_DATA.active_nodes} 
                sub="100% UPTIME" 
                icon={Wifi} 
                colorClass="text-emerald-400"
                borderClass="border-emerald-500"
              />
              <KPICard 
                label="GLOBAL_SYS_HEALTH" 
                value={GLOBAL_DATA.system_health} 
                sub="0 THREATS DETECTED" 
                icon={Cpu} 
                colorClass="text-emerald-400"
                borderClass="border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

              {/* 2. FULL WIDTH MACRO HEATMAP */}
              <div className="lg:col-span-2">
                <div className="cyber-card h-[400px] flex flex-col rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-cyan-500/20 bg-[#050a05] flex justify-between items-center z-20">
                    <h3 className="font-pixel text-[10px] text-cyan-400 tracking-wider">NETWORK_TOPOLOGY</h3>
                    <div className="font-console text-xs text-red-500 blink flex items-center gap-2">
                      <AlertTriangle size={12}/> 2 BOTTLENECKS DETECTED
                    </div>
                  </div>
                  
                  {/* Map Visualizer */}
                  <div className="flex-1 relative bg-[#010301] overflow-hidden" onClick={() => setSelectedStall(null)}>
                     <div className="absolute inset-0 map-grid"></div>
                     
                     {/* Radar Sweep */}
                     <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] rounded-full -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(34,211,238,0.05)_60deg,transparent_60deg)] animate-[spin_6s_linear_infinite] pointer-events-none"></div>

                     {/* Network Topology Lines (Connecting all to Main Stage for visual effect) */}
                     <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        {ALL_STALLS.map(stall => {
                          if (stall.id === 'ST-05') return null; // Skip main stage
                          return (
                            <line 
                              key={`line-${stall.id}`}
                              x1="50%" y1="50%" // Main Stage Center
                              x2={`${stall.x}%`} y2={`${stall.y}%`} 
                              stroke="rgba(34, 211, 238, 0.2)" 
                              strokeWidth="1" 
                              strokeDasharray="4"
                              className="animate-[dash_10s_linear_infinite]"
                            />
                          )
                        })}
                     </svg>

                     {/* Architectural Blocks */}
                     {BUILDINGS.map((b) => (
                       <div key={b.id} className="building-block" style={{ top: b.top, left: b.left, width: b.width, height: b.height }}>
                          <span className="font-pixel text-[8px] text-cyan-500/30 text-center leading-loose">{b.label}</span>
                       </div>
                     ))}

                     {/* Stalls / Nodes */}
                     {ALL_STALLS.map(stall => {
                       const isSelected = selectedStall?.id === stall.id;
                       const isHovered = hoveredPin === stall.id;

                       return (
                         <div 
                           key={stall.id}
                           className="absolute flex flex-col items-center z-20 group cursor-pointer"
                           style={{ left: `${stall.x}%`, top: `${stall.y}%`, transform: 'translate(-50%, -50%)' }}
                           onMouseEnter={() => setHoveredPin(stall.id)}
                           onMouseLeave={() => setHoveredPin(null)}
                           onClick={(e) => { e.stopPropagation(); setSelectedStall(stall); }}
                         >
                            {/* Pulsing Aura */}
                            <div className={`absolute rounded-full opacity-40 transition-all duration-300 ${getHeatClass(stall.traffic)} ${isHovered || isSelected ? 'w-24 h-24 animate-ping' : 'w-12 h-12 animate-pulse'}`}></div>

                            {/* Pin / Node Target */}
                            <div className={`
                               w-4 h-4 rounded-sm flex items-center justify-center transition-all shadow-[0_0_10px_rgba(0,0,0,0.8)] z-30
                               ${stall.traffic === 'CRITICAL' ? 'bg-red-500 border border-red-300' : stall.traffic === 'HIGH' ? 'bg-yellow-500 border border-yellow-300' : 'bg-cyan-500 border border-cyan-300'}
                               ${isSelected ? 'scale-150 rotate-45 ring-2 ring-white' : ''}
                            `}>
                               {(isHovered || isSelected) && <Crosshair size={10} className="text-black absolute -rotate-45" />}
                            </div>
                            
                            <div className={`mt-2 px-2 py-1 font-pixel text-[8px] whitespace-nowrap transition-all ${isHovered || isSelected ? 'text-white bg-black border border-cyan-500 z-40' : 'text-cyan-600 bg-black/50 border border-[#333]'}`}>
                              {stall.name}
                            </div>
                         </div>
                       )
                     })}

                     {/* IN-MAP DATA INSPECTOR PANEL (Slides in when node selected) */}
                     {selectedStall && (
                       <div className="absolute right-0 top-0 bottom-0 w-64 bg-[#050a05]/95 border-l border-cyan-500/50 backdrop-blur-md z-40 p-5 flex flex-col slide-in-right shadow-[-10px_0_30px_rgba(0,0,0,0.8)]">
                          <div className="flex justify-between items-start mb-6 border-b border-cyan-500/30 pb-2">
                             <div>
                                <div className="font-pixel text-[8px] text-cyan-500 mb-1">{selectedStall.id}</div>
                                <div className="font-bold text-lg text-white font-console uppercase tracking-wider">{selectedStall.name}</div>
                             </div>
                             <button onClick={() => setSelectedStall(null)} className="text-gray-500 hover:text-white transition-colors">
                               <X size={16} />
                             </button>
                          </div>

                          <div className="space-y-4 flex-1">
                             <div>
                               <div className="font-pixel text-[8px] text-gray-400 mb-1">LOCATION</div>
                               <div className="font-console text-sm text-cyan-400 flex items-center gap-2"><MapPin size={12}/> {selectedStall.zone}</div>
                             </div>
                             
                             <div>
                               <div className="font-pixel text-[8px] text-gray-400 mb-1">LIVE VISITORS</div>
                               <div className="font-console text-3xl text-white">{selectedStall.visitors}</div>
                             </div>

                             <div>
                               <div className="font-pixel text-[8px] text-gray-400 mb-1">AVG WAIT TIME</div>
                               <div className="font-console text-xl text-yellow-400 flex items-center gap-2"><Clock size={14}/> {selectedStall.wait}</div>
                             </div>

                             <div>
                               <div className="font-pixel text-[8px] text-gray-400 mb-1">STATUS</div>
                               <div className={`font-console text-sm px-2 py-1 inline-block border ${getStatusColor(selectedStall.status).replace('text-', 'border-')} ${getStatusColor(selectedStall.status)} ${selectedStall.status === 'BOTTLENECK' ? 'animate-pulse bg-red-900/20' : 'bg-[#111]'}`}>
                                 {selectedStall.status}
                               </div>
                             </div>
                          </div>

                          {/* Action Buttons based on status */}
                          <div className="pt-4 border-t border-cyan-500/30 mt-auto">
                            {selectedStall.status === 'BOTTLENECK' ? (
                               <button className="w-full bg-red-600 hover:bg-red-500 text-black font-pixel text-[8px] py-3 transition-colors flex justify-center items-center gap-2">
                                 <AlertTriangle size={12}/> INITIATE_REROUTE
                               </button>
                            ) : (
                               <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-pixel text-[8px] py-3 transition-colors flex justify-center items-center gap-2">
                                 <Zap size={12}/> DEPLOY_LURE_MODULE
                               </button>
                            )}
                          </div>
                       </div>
                     )}
                  </div>
                </div>
              </div>

              {/* 3. RIGHT COL: GLOBAL LOGS */}
              <div className="lg:col-span-1">
                <div className="cyber-card p-5 bg-[#020502] border-purple-500/30 overflow-hidden flex flex-col h-[400px] rounded-lg">
                  <h3 className="font-pixel text-[10px] text-purple-400 mb-3 border-b border-purple-500/30 pb-2 flex justify-between items-center tracking-wider">
                    <span>SYSTEM_EVENT_LOG</span>
                    <Activity size={12} className="animate-pulse text-purple-400" />
                  </h3>
                  <div className="flex-1 overflow-y-auto font-console text-sm space-y-1 p-1">
                      {GLOBAL_LOGS.map((log, i) => (
                        <div key={i} className="flex flex-col border-b border-white/5 pb-2 mb-2 hover:bg-white/5 transition-colors px-1">
                            <span className="text-gray-600 text-xs">[{log.time}]</span>
                            <span className={`tracking-wide ${log.color}`}>
                              {log.type === 'ALERT' ? '!!! ' : '>>> '} {log.msg}
                            </span>
                        </div>
                      ))}
                      <div className="text-purple-500 animate-pulse mt-1 px-1">_</div>
                  </div>
                </div>
              </div>

            </div>

            {/* 4. BOTTOM ROW: MASTER DATA TABLE */}
            <div className="cyber-card rounded-lg overflow-hidden">
              <div className="p-4 border-b border-cyan-500/20 bg-[#050a05] flex justify-between items-center">
                <h3 className="font-pixel text-[10px] text-cyan-400 tracking-wider flex items-center gap-2">
                  <Database size={14} /> GLOBAL_NODE_REGISTRY
                </h3>
                <span className="font-console text-xs text-gray-500">SHOWING 9/142 NODES</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="retro-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>STALL_NAME</th>
                      <th>ZONE</th>
                      <th>VISITORS</th>
                      <th>AVG_WAIT</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_STALLS.map((stall) => (
                      <tr 
                        key={stall.id} 
                        className={`cursor-pointer ${hoveredPin === stall.id || selectedStall?.id === stall.id ? 'bg-cyan-900/30 border-l-2 border-cyan-400' : 'border-l-2 border-transparent'}`}
                        onClick={() => setSelectedStall(stall)}
                        onMouseEnter={() => setHoveredPin(stall.id)}
                        onMouseLeave={() => setHoveredPin(null)}
                      >
                        <td className="text-cyan-600 font-bold">{stall.id}</td>
                        <td className="text-white">{stall.name}</td>
                        <td className="text-gray-400">{stall.zone}</td>
                        <td className="text-purple-400">{stall.visitors}</td>
                        <td className="text-gray-300">{stall.wait}</td>
                        <td className={`${getStatusColor(stall.status)} ${stall.status === 'BOTTLENECK' ? 'blink' : ''}`}>
                          {stall.status}
                        </td>
                        <td>
                          {stall.status === 'BOTTLENECK' ? (
                            <span className="text-red-500 font-pixel text-[6px]">CRITICAL</span>
                          ) : stall.status === 'OPTIMAL' ? (
                            <span className="text-cyan-500 font-pixel text-[6px]">READY</span>
                          ) : (
                            <span className="text-yellow-500 font-pixel text-[6px]">MONITOR</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <footer className="mt-8 border-t border-cyan-500/20 pt-4 flex justify-between items-center text-[10px] font-pixel text-gray-500">
               <div>AUTHORIZATION: ROOT</div>
               <div className="flex gap-6">
                 <span className="text-emerald-500 flex items-center gap-2"><Lock size={10} /> SECURE</span>
               </div>
            </footer>
          </>
        )}

      </main>
    </div>
  );
}