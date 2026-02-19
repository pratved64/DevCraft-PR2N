"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Zap, Clock, TrendingUp, Activity,
  Share2, ArrowUpRight, ArrowDownRight,
  Download, RefreshCw,
  DollarSign, Target, BarChart3, Wifi,
  Terminal, Cpu, MapPin, QrCode, X, CheckCircle
} from 'lucide-react';
import {
  fetchAnalytics, fetchStalls, fetchHourlyTraffic, scanCandidate,
  type AnalyticsResponse, type StallInfo, type HourlyTrafficEntry, type ScanCandidateResponse,
} from '../../lib/api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

  :root { --term-bg: #050a05; --term-grid: #1a1a1a; --term-border: #333; }

  .font-pixel { font-family: 'Press Start 2P', cursive; }
  .font-console { font-family: 'VT323', monospace; }

  .crt-container {
    background-color: var(--term-bg);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    color: #eee;
  }

  .scanlines {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1));
    background-size: 100% 4px;
    position: fixed; inset: 0; pointer-events: none; z-index: 50; opacity: 0.6;
  }

  .glass-card {
    background: rgba(15,15,15,0.8);
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(12px);
    position: relative; overflow: hidden;
  }

  .pixel-card {
    background: #0f0f0f; border: 2px solid #444;
    box-shadow: 4px 4px 0px #222; position: relative; transition: all 0.2s;
  }
  .pixel-card:hover { border-color: #666; transform: translate(-1px,-1px); box-shadow: 5px 5px 0px #222; }

  @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  .animate-fade-in { animation: fadeInUp 0.6s cubic-bezier(0.2,0.8,0.2,1) both; }

  .corner-accent { position:absolute; width:8px; height:8px; border-color:rgba(255,255,255,0.15); border-style:solid; }
  .c-tl { top:10px; left:10px; border-width:1px 0 0 1px; }
  .c-tr { top:10px; right:10px; border-width:1px 1px 0 0; }
  .c-br { bottom:10px; right:10px; border-width:0 1px 1px 0; }

  .scanline-overlay {
    position:absolute; inset:0;
    background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3) 51%);
    background-size: 100% 4px; pointer-events:none; z-index:0;
  }

  .retro-grid {
    background-size: 20px 20px;
    background-image: linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
  }

  .heatmap-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:4px; }
  .heat-cell { aspect-ratio:1; position:relative; transition:background-color 1s ease; }
  .heat-cell.stall { background-color:#eee; border:2px solid #fff; box-shadow:0 0 10px #fff; z-index:10; }
  .heat-low  { background-color:#0891b2; opacity:0.3; }
  .heat-med  { background-color:#ca8a04; opacity:0.6; }
  .heat-high { background-color:#dc2626; opacity:0.8; }

  .pixel-btn { border:2px solid #444; background:#222; color:#eee; box-shadow:2px 2px 0px #000; transition:all 0.1s; cursor:pointer; }
  .pixel-btn:hover { background:#333; color:#fff; border-color:#666; }

  .blink { animation: blink 1s step-end infinite; }
  @keyframes blink { 50% { opacity:0; } }
`;

const SPONSOR_DATA = { name: "TechCorp", id: "SPON-882-X", category: "SOFTWARE_ENG", location: "ZONE_A_12" };

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
  </div>
);

const KPICard = ({ label, value, trend, trendUp, icon: Icon, delay }: any) => (
  <div className="glass-card rounded-2xl p-5 flex flex-col justify-between h-32 animate-fade-in" style={{ animationDelay: delay }}>
    <div className="corner-accent c-tl"></div>
    <div className="corner-accent c-br"></div>
    <div className="flex justify-between items-start">
      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">{label}</span>
      <Icon size={14} className="text-gray-600" />
    </div>
    <div>
      <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-2">
        {value}
        {trend && (
          <span className={`text-xs font-medium flex items-center px-1.5 py-0.5 rounded ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {trendUp ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
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
      <div className={`h-full ${color} transition-all duration-1000 relative`} style={{ width: `${value}%` }}>
        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white opacity-50 shadow-[0_0_10px_white]"></div>
      </div>
    </div>
  </div>
);

const StallHeatmap = () => {
  const [gridData, setGridData] = useState<string[]>([]);

  useEffect(() => {
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
    const interval = setInterval(generateHeat, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex justify-between items-end mb-4 border-b-2 border-[#333] pb-2">
        <h3 className="font-pixel text-xs text-orange-400">ZONE_DENSITY</h3>
        <span className="font-console text-xs text-gray-500 animate-pulse">LIVE SENSOR</span>
      </div>
      <div className="bg-[#050505] p-2 border-2 border-[#333] relative flex-1 flex flex-col justify-center">
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
        <div className="flex justify-center gap-4 mt-6 text-[8px] font-pixel text-gray-500">
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#dc2626]"></div> CRITICAL</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#ca8a04]"></div> HIGH</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#0891b2]"></div> LOW</div>
        </div>
      </div>
    </div>
  );
};

export default function SponsorPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [stalls, setStalls] = useState<StallInfo[]>([]);
  const [selectedStallId, setSelectedStallId] = useState<string>('');
  const [hourlyTraffic, setHourlyTraffic] = useState<HourlyTrafficEntry[]>([]);

  // Resume scan state
  const [scanInput, setScanInput] = useState('');
  const [candidate, setCandidate] = useState<ScanCandidateResponse | null>(null);
  const [scanError, setScanError] = useState('');
  const [scanLoading, setScanLoading] = useState(false);

  const loadAnalytics = (stallId: string) => {
    setLoading(true);
    setHourlyTraffic([]);
    Promise.all([
      fetchAnalytics(stallId),
      fetchHourlyTraffic(stallId),
    ])
      .then(([data, traffic]) => {
        setAnalytics(data);
        setHourlyTraffic(traffic);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleResumeScan = async () => {
    if (!scanInput.trim()) return;
    setScanLoading(true);
    setScanError('');
    setCandidate(null);
    try {
      const result = await scanCandidate(scanInput.trim());
      setCandidate(result);
    } catch (e: any) {
      setScanError(e?.message?.includes('404') ? 'Student not found.' : 'Scan failed — try again.');
    } finally {
      setScanLoading(false);
    }
  };

  useEffect(() => {
    fetchStalls()
      .then((data) => {
        setStalls(data);
        if (data.length > 0) {
          setSelectedStallId(data[0].stall_id);
          loadAnalytics(data[0].stall_id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="crt-container font-sans selection:bg-cyan-500 selection:text-black">
      <style>{styles}</style>
      <div className="scanlines"></div>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 rounded-full blur-[120px]"></div>
      </div>

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
          <div className="flex items-center gap-3">
            {stalls.length > 0 && (
              <select
                value={selectedStallId}
                onChange={(e) => { setSelectedStallId(e.target.value); loadAnalytics(e.target.value); }}
                className="px-3 py-2 border-2 border-[#444] bg-[#222] text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
              >
                {stalls.map((s) => (
                  <option key={s.stall_id} value={s.stall_id}>{s.company_name}</option>
                ))}
              </select>
            )}
            <button className="pixel-btn px-4 py-2 font-pixel text-[10px] flex items-center gap-2 hover:border-cyan-500">
              <RefreshCw size={12} /> SYNC
            </button>
            <button className="pixel-btn px-4 py-2 font-pixel text-[10px] flex items-center gap-2 hover:border-cyan-500">
              <Download size={12} /> EXPORT
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10 pb-20 relative z-10">
        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center font-pixel text-cyan-500 animate-pulse">
            <Cpu size={64} className="mb-4" />
            <div>ESTABLISHING UPLINK...</div>
            <div className="text-[10px] mt-2">VERIFYING CREDENTIALS</div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  Command Center
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 border border-white/10 text-gray-400 uppercase tracking-widest">v2.4.0</span>
                </h1>
                <p className="text-gray-400 max-w-xl">
                  Real-time telemetry and ROI attribution for{' '}
                  <span className="text-white font-medium">{analytics ? analytics.stall_name : 'EventFlow 2026'}</span>.
                </p>
              </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard label="Total Footfall" value={analytics ? analytics.total_footfall.toLocaleString() : '14,205'} trend={analytics?.peak_traffic_hour != null ? `Peak hr: ${analytics.peak_traffic_hour}:00` : '12% vs last hr'} trendUp={true} icon={Users} delay="0ms" />
              <KPICard label="Cost Per Interaction" value={analytics?.cost_per_interaction != null ? `$${analytics.cost_per_interaction.toFixed(2)}` : '$0.42'} trend="Target: $0.50" trendUp={true} icon={DollarSign} delay="100ms" />
              <KPICard label="Avg Dwell Time" value={analytics?.avg_wait_time || '18m 24s'} trend="4m vs avg" trendUp={true} icon={Clock} delay="200ms" />
              <KPICard label="Cross Pollination" value={analytics?.cross_pollination != null ? `${analytics.cross_pollination.toFixed(1)}%` : '34.2%'} trend={analytics?.flash_sale_lift != null ? `Flash lift: ${analytics.flash_sale_lift.toFixed(1)}%` : '—'} trendUp={analytics?.flash_sale_lift != null ? analytics.flash_sale_lift > 0 : false} icon={Share2} delay="300ms" />
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-1">
                <div className="pixel-card p-4 h-full min-h-[400px]"><StallHeatmap /></div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                {/* ── REAL Traffic Chart ── */}
                <div className="glass-card rounded-3xl p-6 min-h-[220px]">
                  <div className="corner-accent c-tr"></div>
                  <div className="scanline-overlay"></div>
                  <CardHeader title="Traffic Velocity & Peak Hours" sub="Hourly scan count from live DB" icon={Activity} highlight={true} />
                  {hourlyTraffic.length > 0 ? (() => {
                    const maxScans = Math.max(...hourlyTraffic.map(h => h.scans), 1);
                    return (
                      <>
                        <div className="h-[140px] w-full flex items-end justify-between gap-1 pt-4 relative">
                          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                            {[0,1,2,3].map(i => <div key={i} className="w-full h-px border-t border-dashed border-gray-500"></div>)}
                          </div>
                          {hourlyTraffic.map((entry) => {
                            const pct = Math.round((entry.scans / maxScans) * 100);
                            return (
                              <div key={entry.hour} className="relative flex-1 h-full flex items-end group/bar">
                                <div
                                  className={`w-full rounded-t-sm transition-all duration-300 group-hover/bar:bg-cyan-400 ${entry.is_peak ? 'bg-gradient-to-t from-cyan-900 to-cyan-400 opacity-90' : 'bg-white/10'}`}
                                  style={{ height: `${Math.max(pct, 2)}%` }}
                                />
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity z-30 pointer-events-none whitespace-nowrap">
                                  <span className="text-[10px] text-gray-300 font-mono">
                                    {entry.label}{entry.is_peak ? ' 🔥' : ''} • {entry.scans} scans
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between mt-3 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                          <span>{hourlyTraffic[0]?.label}</span>
                          <span className="text-cyan-400">
                            {hourlyTraffic.find(h => h.is_peak)?.label ?? ''} PEAK
                          </span>
                          <span>{hourlyTraffic[hourlyTraffic.length - 1]?.label}</span>
                        </div>
                      </>
                    );
                  })() : (
                    // Skeleton while loading
                    <div className="h-[140px] w-full flex items-end justify-between gap-1 pt-4">
                      {Array.from({length: 13}).map((_, i) => (
                        <div key={i} className="flex-1 bg-white/5 rounded-t-sm animate-pulse" style={{ height: `${20 + Math.random()*60}%` }} />
                      ))}
                    </div>
                  )}
                </div>
                {/* Live Logs */}
                <div className="pixel-card p-4 bg-[#050505] border-[#333] overflow-hidden flex flex-col h-48">
                  <h3 className="font-pixel text-[10px] text-gray-400 mb-2 border-b border-[#333] pb-2 flex justify-between">
                    <span>LIVE_LOGS</span><Activity size={10} className="animate-pulse" />
                  </h3>
                  <div className="flex-1 overflow-y-auto font-console text-xs space-y-2 p-1">
                    {LIVE_LOGS.map((log, i) => (
                      <div key={i} className="flex gap-2 border-b border-[#1a1a1a] pb-1 hover:bg-[#111]">
                        <span className="text-gray-600">[{log.time}]</span>
                        <span className={log.color}>{log.type === 'SCAN' && '>'} {log.msg}</span>
                      </div>
                    ))}
                    <div className="text-cyan-500 animate-pulse">_</div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Demographics */}
              <div className="glass-card rounded-3xl p-6">
                <div className="corner-accent c-tl"></div>
                <CardHeader title="Target Demographics" sub="Anonymous persona identification" icon={Target} />
                <div className="flex items-center justify-center py-4">
                  <div className="w-40 h-40 rounded-full border-[14px] border-gray-800 relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[14px] border-cyan-500 border-r-transparent border-b-transparent rotate-45 opacity-80"></div>
                    <div className="absolute inset-0 rounded-full border-[14px] border-purple-500 border-l-transparent border-b-transparent -rotate-12 opacity-80"></div>
                    <div className="text-center z-10">
                      <div className="text-3xl font-bold text-white">84%</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-widest">Match Rate</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 mt-2">
                  {analytics && Object.keys(analytics.demographics).length > 0
                    ? Object.entries(analytics.demographics).sort(([,a],[,b]) => (b as number)-(a as number)).slice(0,4).map(([major, count], i) => {
                        const total = Object.values(analytics.demographics).reduce((s:number,v) => s+(v as number), 0);
                        const pct = total > 0 ? Math.round(((count as number)/total)*100) : 0;
                        const colors = ['bg-cyan-500','bg-purple-500','bg-emerald-500','bg-yellow-500'];
                        return <ProgressBar key={major} label={major} value={pct} color={colors[i]||'bg-gray-500'} />;
                      })
                    : <>
                        <ProgressBar label="Tech Professionals" value={45} color="bg-cyan-500" />
                        <ProgressBar label="University Students" value={32} color="bg-purple-500" />
                        <ProgressBar label="Venture Capitalists" value={15} color="bg-emerald-500" />
                        <ProgressBar label="Media / Press" value={8} color="bg-yellow-500" />
                      </>
                  }
                </div>
              </div>

              {/* Flash Sale */}
              <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
                <div className="corner-accent c-tl"></div>
                <CardHeader title="Flash Sale Impact" sub={analytics?.flash_sale_lift != null ? `${analytics.flash_sale_lift.toFixed(1)}% of scans during low-crowd events` : 'Legendary spawn conversion rate'} icon={Zap} highlight={true} />
                {/* Real data: stacked bar of flash vs normal scans */}
                {analytics != null ? (
                  <div className="mt-4 space-y-3">
                    {/* Visual proportion bar */}
                    <div className="w-full h-8 rounded overflow-hidden flex relative border border-white/10">
                      <div
                        className="h-full bg-yellow-500 flex items-center justify-center text-[10px] font-bold text-black transition-all duration-1000"
                        style={{ width: `${Math.max(analytics.flash_sale_lift ?? 0, 2)}%` }}
                      >
                        {(analytics.flash_sale_lift ?? 0) > 8 ? `${(analytics.flash_sale_lift ?? 0).toFixed(1)}%` : ''}
                      </div>
                      <div className="flex-1 h-full bg-white/5 flex items-center justify-end pr-2 text-[10px] text-gray-500">
                        Normal
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                        <div className="text-2xl font-bold text-yellow-400">{(analytics.flash_sale_lift ?? 0).toFixed(1)}%</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Flash Scans</div>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-200">{(100 - (analytics.flash_sale_lift ?? 0)).toFixed(1)}%</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Normal Scans</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      <strong className="text-yellow-400">Insight:</strong> {(analytics.flash_sale_lift ?? 0) > 15
                        ? 'Strong flash-sale effect. Legendary spawns are driving significant traffic to this stall.'
                        : 'Low-crowd legendary triggers are active. Increasing spawn frequency may boost this metric.'}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 h-24 animate-pulse bg-white/5 rounded-xl" />
                )}
              </div>

              {/* Stall Distribution */}
              <div className="glass-card rounded-3xl p-6">
                <CardHeader title="Stall Engagement" sub="All-time total scans per stall" icon={BarChart3} />
                <div className="space-y-4">
                  {stalls.length > 0
                    ? stalls.sort((a,b)=>b.total_scan_count-a.total_scan_count).slice(0,4).map((stall,i) => {
                        const maxVal = Math.max(...stalls.map(s=>s.total_scan_count),1);
                        const pct = Math.round((stall.total_scan_count/maxVal)*100);
                        const colors = ['bg-white','bg-cyan-400','bg-cyan-600','bg-cyan-800'];
                        const codes = ['Z-01','Z-02','Z-03','Z-04'];
                        return (
                          <div key={stall.stall_id} className="flex items-center gap-4">
                            <div className="font-mono text-xs text-gray-500 w-8">{codes[i]}</div>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-300 font-medium">{stall.company_name}</span>
                                <span className="font-bold text-white">{stall.total_scan_count} scans</span>
                              </div>
                              <div className="h-2 bg-gray-800 rounded-sm overflow-hidden">
                                <div className={`h-full ${colors[i]}`} style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    : [
                        {name:'Main Stage Area',val:92,code:'Z-01',color:'bg-white'},
                        {name:'VR Experience Hall',val:78,code:'Z-04',color:'bg-cyan-400'},
                        {name:'Refreshment Lounge',val:65,code:'Z-02',color:'bg-cyan-600'},
                        {name:'Merch Booth A',val:45,code:'Z-09',color:'bg-cyan-800'},
                      ].map((zone,i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="font-mono text-xs text-gray-500 w-8">{zone.code}</div>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-300 font-medium">{zone.name}</span>
                              <span className="font-bold text-white">{zone.val}%</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-sm overflow-hidden">
                              <div className={`h-full ${zone.color}`} style={{ width: `${zone.val}%` }}></div>
                            </div>
                          </div>
                        </div>
                      ))
                  }
                </div>
                <div className="mt-6 bg-black/20 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wifi size={20} className="text-emerald-500" />
                    <div>
                      <div className="text-2xl font-mono font-bold text-white">{analytics?.avg_wait_time || '04:12'}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-widest">Avg Wait Time</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-400 text-right">
                    {analytics ? `Peak: ${analytics.peak_traffic_hour ?? 'N/A'}:00` : 'Running 12% faster than capacity.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── RESUME SCAN PANEL ── */}
            <div className="mt-6 glass-card rounded-3xl p-6">
              <CardHeader title="Resume Scanner" sub="Scan student badge to view profile & hiring intel" icon={QrCode} highlight={true} />
              <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Input */}
                <div className="flex gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleResumeScan()}
                    placeholder="Paste student User ID..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-cyan-500 min-w-[260px]"
                  />
                  <button
                    onClick={handleResumeScan}
                    disabled={scanLoading}
                    className="px-5 py-2 bg-cyan-500 text-black font-bold text-sm rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-all"
                  >
                    {scanLoading ? '...' : 'SCAN'}
                  </button>
                </div>

                {/* Error */}
                {scanError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <X size={14} /> {scanError}
                  </div>
                )}
              </div>

              {/* Candidate Card */}
              {candidate && (
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                  {/* Identity */}
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                        <Users size={18} className="text-cyan-400" />
                      </div>
                      <div>
                        <div className="font-bold text-white">{candidate.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{candidate.email}</div>
                      </div>
                    </div>
                    {candidate.resume_url && (
                      <a
                        href={candidate.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors mt-2"
                      >
                        <Download size={12} /> View Resume
                      </a>
                    )}
                  </div>

                  {/* Demographics */}
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Demographics</div>
                    {Object.entries(candidate.demographics).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0">
                        <span className="text-gray-400 capitalize">{k.replace('_', ' ')}</span>
                        <span className="text-gray-200 font-mono">{String(v)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Skills</div>
                    {candidate.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill) => (
                          <span key={skill} className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No skills listed.</span>
                    )}
                    <button
                      onClick={() => setCandidate(null)}
                      className="mt-4 w-full text-[10px] text-gray-500 hover:text-white border border-white/5 hover:border-white/20 py-1.5 rounded transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            <footer className="mt-12 border-t border-white/5 pt-8 pb-4 flex justify-between items-center text-xs text-gray-500">
              <div>SYSTEM ID: <span className="font-mono text-gray-400">SPON-882-X</span></div>
              <div className="flex gap-4">
                <span>Data updated: Real-time</span>
                <span className="text-emerald-500">● Live Connection</span>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
