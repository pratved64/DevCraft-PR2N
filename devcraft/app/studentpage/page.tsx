"use client";

import React, { useState, useEffect } from 'react';
import { Scan, Map, Trophy, Wifi, Battery, AlertTriangle, Sparkles, Navigation, X, ArrowRight, Building2, Users, SignalHigh, HelpCircle, Utensils, Monitor, Briefcase, Music } from 'lucide-react';
import { fetchStalls, fetchLeaderboard, fetchNotifications, scanStall, fetchMyHistory, type StallInfo, type LeaderboardEntry, type NotificationItem } from '../../lib/api';

// --- PIXEL ART STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

  :root {
    --gb-bg: #8bac0f;
    --gb-dark: #0f380f;
    --gb-light: #9bbc0f;
    --gb-accent: #306230;
  }

  .font-pixel { font-family: 'Press Start 2P', cursive; }
  .font-console { font-family: 'VT323', monospace; }

  .gb-screen-container {
    background-color: var(--gb-bg);
    box-shadow: inset 0 0 40px rgba(0,0,0,0.4);
    position: relative;
    overflow: hidden;
  }

  .scanlines {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1));
    background-size: 100% 4px;
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 50;
  }

  /* --- MAP VISUALS --- */
  .map-grid {
    background-image: radial-gradient(#0f380f 15%, transparent 16%);
    background-size: 12px 12px;
    opacity: 0.15;
  }

  /* Zones / Carpets */
  .zone-carpet {
    position: absolute;
    background: rgba(48, 98, 48, 0.3);
    border: 1px dashed #0f380f;
  }

  .radar-sweep {
    position: absolute;
    top: 50%; left: 50%;
    width: 150%; height: 150%;
    background: conic-gradient(from 0deg, transparent 0deg, rgba(15, 56, 15, 0.05) 60deg, transparent 60deg);
    animation: spin 6s linear infinite;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 1;
  }
  @keyframes spin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }

  /* --- PIN ANIMATIONS --- */
  .zone-pulse-red {
    position: absolute;
    border-radius: 50%;
    border: 1px dashed #d32f2f;
    background: rgba(211, 47, 47, 0.1);
    transform: translate(-50%, -50%);
    animation: ripple-red 1.5s infinite;
    z-index: 5;
  }
  @keyframes ripple-red {
    0% { width: 0; height: 0; opacity: 0.8; }
    100% { width: 60px; height: 60px; opacity: 0; }
  }

  .zone-pulse-gold {
    position: absolute;
    border-radius: 50%;
    border: 2px solid #f57f17;
    transform: translate(-50%, -50%);
    animation: ripple-gold 2s infinite;
    z-index: 5;
  }
  @keyframes ripple-gold {
    0% { width: 0; height: 0; opacity: 1; }
    100% { width: 80px; height: 80px; opacity: 0; }
  }

  .player-bounce { animation: bounce 1s infinite; }
  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

  .path-line {
    stroke-dasharray: 6;
    animation: dash 1s linear infinite;
  }
  @keyframes dash { to { stroke-dashoffset: -12; } }

  /* UI UTILS */
  .blink { animation: blink 1s step-end infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  
  .slide-up { animation: slideUp 0.3s ease-out; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

  @keyframes scan {
    0%, 100% { top: 10%; }
    50% { top: 90%; }
  }
  @keyframes marquee {
    from { transform: translateX(100vw); }
    to   { transform: translateX(-100%); }
  }
  /* zoom-in for scan result modal */
  @keyframes zoomIn {
    from { transform: scale(0.85); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }
  .animate-in { animation-fill-mode: both; animation-duration: 300ms; }
  .zoom-in    { animation-name: zoomIn; }
  .duration-300 { animation-duration: 300ms; }
  .sprite { image-rendering: pixelated; }
  .silhouette { filter: brightness(0) opacity(0.7); }
  
  .zone-label {
    position: absolute;
    font-family: 'Press Start 2P', cursive;
    font-size: 6px;
    color: #0f380f;
    opacity: 0.5;
    pointer-events: none;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

// --- EXPANDED SPONSOR DATA ---
const MOCK_SPONSORS = [
  // ZONE A: TECH (Top Left)
  { _id: 'sp_1', company_name: 'TechCorp', category: 'Software', map_location: { x: 15, y: 15 }, current_pokemon_spawn: { name: 'Mewtwo', rarity: 'Legendary' } },
  { _id: 'sp_2', company_name: 'CyberSys', category: 'Hardware', map_location: { x: 35, y: 15 }, current_pokemon_spawn: { name: 'Magnemite', rarity: 'Normal' } },
  { _id: 'sp_3', company_name: 'AI Labs', category: 'AI Research', map_location: { x: 15, y: 30 }, current_pokemon_spawn: { name: 'Porygon', rarity: 'Normal' } },

  // ZONE B: CAREER (Top Right)
  { _id: 'sp_4', company_name: 'FutureHire', category: 'Recruiting', map_location: { x: 65, y: 15 }, current_pokemon_spawn: { name: 'Meowth', rarity: 'Normal' } },
  { _id: 'sp_5', company_name: 'UniLinks', category: 'Education', map_location: { x: 85, y: 15 }, current_pokemon_spawn: { name: 'Bulbasaur', rarity: 'Normal' } },
  { _id: 'sp_6', company_name: 'GradNetwork', category: 'Networking', map_location: { x: 85, y: 30 }, current_pokemon_spawn: { name: 'Eevee', rarity: 'Normal' } },

  // ZONE C: FOOD COURT (Bottom Right)
  { _id: 'sp_7', company_name: 'Burger Town', category: 'F&B', map_location: { x: 70, y: 65 }, current_pokemon_spawn: { name: 'Snorlax', rarity: 'Normal' } }, // High Traffic implicit
  { _id: 'sp_8', company_name: 'Soda Pop', category: 'F&B', map_location: { x: 90, y: 65 }, current_pokemon_spawn: { name: 'Squirtle', rarity: 'Normal' } },

  // ZONE D: MAIN STAGE / CENTER
  { _id: 'sp_9', company_name: 'Main Stage', category: 'Event', map_location: { x: 50, y: 50 }, current_pokemon_spawn: { name: 'Jigglypuff', rarity: 'Normal' } }, // Critical

  // ZONE E: LOGISTICS / ENTRY (Bottom Left)
  { _id: 'sp_10', company_name: 'Reg Desk', category: 'Logistics', map_location: { x: 20, y: 70 }, current_pokemon_spawn: { name: 'Rattata', rarity: 'Normal' } },
  { _id: 'sp_11', company_name: 'Merch A', category: 'Retail', map_location: { x: 40, y: 70 }, current_pokemon_spawn: { name: 'Charmander', rarity: 'Normal' } },
  { _id: 'sp_12', company_name: 'Exit Gate', category: 'Logistics', map_location: { x: 50, y: 90 }, current_pokemon_spawn: { name: 'Zubat', rarity: 'Normal' } },
];

const ZONES = [
  { label: 'ZONE A - TECH', top: '5%', left: '5%', width: '40%', height: '35%' },
  { label: 'ZONE B - CAREER', top: '5%', left: '55%', width: '40%', height: '35%' },
  { label: 'MAIN STAGE', top: '42%', left: '42%', width: '16%', height: '16%' },
  { label: 'ZONE C - FOOD', top: '55%', left: '60%', width: '35%', height: '30%' },
  { label: 'ZONE D - HALL', top: '60%', left: '10%', width: '40%', height: '25%' },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'RED', score: 9999, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png' },
  { rank: 2, name: 'ASH', score: 8400, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
  { rank: 3, name: 'YOU', score: 4500, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
];

export default function StudentDashboard() {
  const [view, setView] = useState<'SCAN' | 'MAP' | 'RANK'>('MAP');
  const [activeSponsor, setActiveSponsor] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedMon, setScannedMon] = useState<any>(null);
  const [booting, setBooting] = useState(true);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [flashAlert, setFlashAlert] = useState<any>(null);

  // Persist a user id across the session (first user returned from /my-history)
  const [userId, setUserId] = useState<string>('');

  // Live data from API (with mock fallback)
  const [sponsors, setSponsors] = useState<any[]>(MOCK_SPONSORS);
  const [leaderboard, setLeaderboard] = useState<any[]>(MOCK_LEADERBOARD);

  // Player enters from bottom
  const userPos = { x: 50, y: 95 };

  useEffect(() => {
    setTimeout(() => setBooting(false), 1500);

    // Fetch live data from backend
    fetchStalls()
      .then((stalls) => {
        const mapped = stalls.map((s) => ({
          _id: s.stall_id,
          company_name: s.company_name,
          category: s.category,
          map_location: {
            x: Math.min(95, Math.max(5, (s.map_location.x_coord / 900) * 100)),
            y: Math.min(95, Math.max(5, (s.map_location.y_coord / 900) * 100)),
          },
          current_pokemon_spawn: s.current_pokemon_spawn,
          crowd_level: s.crowd_level,
        }));
        if (mapped.length > 0) {
          setSponsors(mapped);
          setApiLoaded(true);
        }
      })
      .catch(console.error);

    // Resolve user id for this session (grab the first user from history)
    fetchMyHistory()
      .then((data) => { if (data.user_id) setUserId(data.user_id); })
      .catch(console.error);

    fetchLeaderboard()
      .then((lb) => {
        const mapped = lb.slice(0, 10).map((e, i) => ({
          rank: e.rank,
          name: e.name.split(' ')[0].toUpperCase().slice(0, 8),
          score: e.points,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${(i + 1) * 6}.png`,
        }));
        if (mapped.length > 0) setLeaderboard(mapped);
      })
      .catch(console.error);

    // Fetch notifications for flash events
    fetchNotifications()
      .then((notifs) => {
        const legendaryAlert = notifs.find((n) => n.type === 'legendary_alert');
        if (legendaryAlert) {
          setTimeout(() => {
            setFlashAlert({
              stall: legendaryAlert.stall_name,
              rarity: 'LEGENDARY',
            });
          }, 3000);
        }
      })
      .catch(console.error);
  }, []);

  const handleScan = async () => {
    if (!activeSponsor) return;
    if (!apiLoaded) {
      alert('Still loading stall data from server...');
      return;
    }
    setScanning(true);
    try {
      const result = await scanStall(activeSponsor._id, userId || undefined);
      setScanning(false);
      // Map pokemon number from name for sprite URL
      const POKEMON_NAME_TO_ID: Record<string, number> = {
        Pikachu: 25, Bulbasaur: 1, Squirtle: 7, Charmander: 4, Eevee: 133,
        Snorlax: 143, Jigglypuff: 39, Psyduck: 54, Magikarp: 129, Rattata: 19,
        Mewtwo: 150, Rayquaza: 384, Charizard: 6, Dragonite: 149, Gengar: 94,
        Articuno: 144, Zapdos: 145, Moltres: 146, Lugia: 249, 'Ho-Oh': 250,
      };
      const spriteId = POKEMON_NAME_TO_ID[result.pokemon.name] ?? Math.floor(Math.random() * 150) + 1;
      setScannedMon({
        name: result.pokemon.name.toUpperCase(),
        stall: result.stall_name,
        points: result.points_earned,
        rarity: result.pokemon.rarity,
        isLegendary: result.pokemon.rarity === 'Legendary',
        isFlashSale: result.is_flash_sale,
        img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${spriteId}.gif`,
      });
    } catch {
      setScanning(false);
      // Fallback to mock scan
      setScannedMon({
        name: 'MEWTWO',
        stall: activeSponsor?.company_name || 'Unknown',
        points: 1000,
        rarity: 'Legendary',
        isLegendary: true,
        isFlashSale: false,
        img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/150.gif',
      });
    }
  };

  // Helper: Status Logic
  const getStatus = (sponsor: any) => {
    if (!sponsor) return 'NORMAL';
    if (sponsor.current_pokemon_spawn?.rarity === 'Legendary') return 'RECOMMENDED';
    // Use real crowd_level from API when available
    if (sponsor.crowd_level === 'High') return 'CRITICAL';
    if (sponsor.crowd_level === 'Low') return 'RECOMMENDED';
    return 'NORMAL';
  };

  // Helper: Icon Logic
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'F&B': return <Utensils size={10} />;
      case 'Software': case 'Hardware': case 'AI Research': return <Monitor size={10} />;
      case 'Event': return <Music size={10} />;
      case 'Recruiting': case 'Networking': case 'Education': return <Briefcase size={10} />;
      default: return <Building2 size={10} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-4 selection:bg-[#8bac0f] selection:text-[#0f380f]">
      <style>{styles}</style>

      <div className="relative w-full max-w-md bg-[#DC0A2D] rounded-3xl shadow-[0_0_60px_rgba(220,10,45,0.2)] border-8 border-[#8B0000] overflow-hidden">

        {/* HEADER */}
        <div className="h-12 bg-[#8B0000] flex justify-between items-center px-6 border-b-4 border-[#5e0000]">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#111] border border-white/20"></div>
            <div className="w-3 h-3 rounded-full bg-[#111] border border-white/20"></div>
          </div>
          <div className="font-pixel text-[8px] text-[#ff9999]">CROWD NAV v5.0</div>
        </div>

        {/* SCREEN */}
        <div className="p-4 bg-[#DC0A2D]">
          <div className="bg-[#505050] rounded-t-xl rounded-b-3xl p-4 shadow-[inset_0_5px_10px_rgba(0,0,0,0.5)] border-4 border-[#303030]">

            <div className="gb-screen-container border-4 border-[#0f380f] rounded-lg h-[550px] relative flex flex-col">
              <div className="scanlines"></div>

              {booting ? (
                <div className="flex-1 flex flex-col items-center justify-center font-pixel text-[#0f380f] animate-pulse gap-4">
                  <Wifi size={48} className="animate-ping" />
                  <div className="text-center">
                    <div>LOADING MAP...</div>
                    <div className="text-[8px] mt-2">CALIBRATING GPS</div>
                  </div>
                </div>
              ) : (
                <>
                  {/* STATUS BAR */}
                  <div className="bg-[#0f380f] text-[#9bbc0f] p-1 flex justify-between items-center px-2 z-20 shadow-md">
                    <span className="font-pixel text-[8px] flex items-center gap-1">
                      <Navigation size={8} /> {sponsors.length} STALLS ACTIVE
                    </span>
                    <div className="flex gap-2">
                      <span className="font-console">842 ONLINE</span>
                      <Battery size={10} />
                    </div>
                  </div>

                  {/* --- VIEW: MAP --- */}
                  {view === 'MAP' && (
                    <div className="flex-1 flex flex-col bg-[#9bbc0f] relative overflow-hidden">

                      {/* 1. MAP VISUALIZER (75%) */}
                      <div className="relative flex-1 border-b-4 border-[#0f380f] cursor-crosshair" onClick={() => setActiveSponsor(null)}>

                        {/* Layer 1: Floor & Radar */}
                        <div className="absolute inset-0 map-grid"></div>
                        <div className="radar-sweep"></div>

                        {/* Layer 2: Zones (Carpets) & Labels */}
                        {ZONES.map((zone, i) => (
                          <div key={i} className="zone-carpet" style={{ top: zone.top, left: zone.left, width: zone.width, height: zone.height }}>
                            <div className="zone-label" style={{ top: '-12px', left: '0' }}>{zone.label}</div>
                          </div>
                        ))}

                        {/* Layer 3: Dynamic Path */}
                        {(activeSponsor || sponsors.find(s => s.current_pokemon_spawn.rarity === 'Legendary')) && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            <line
                              x1={`${userPos.x}%`} y1={`${userPos.y}%`}
                              x2={`${activeSponsor?.map_location.x || sponsors.find(s => s.current_pokemon_spawn.rarity === 'Legendary')?.map_location.x}%`}
                              y2={`${activeSponsor?.map_location.y || sponsors.find(s => s.current_pokemon_spawn.rarity === 'Legendary')?.map_location.y}%`}
                              stroke={getStatus(activeSponsor) === 'CRITICAL' ? '#d32f2f' : '#0f380f'}
                              strokeWidth="2"
                              strokeDasharray="4"
                              className="path-line"
                            />
                          </svg>
                        )}

                        {/* Layer 4: Player Marker */}
                        <div className="absolute z-30 flex flex-col items-center" style={{ left: `${userPos.x}%`, top: `${userPos.y}%`, transform: 'translate(-50%, -50%)' }}>
                          <div className="w-3 h-3 bg-[#0f380f] rounded-full player-bounce"></div>
                          <span className="font-pixel text-[6px] mt-1 bg-[#0f380f] text-[#9bbc0f] px-1 rounded">YOU</span>
                        </div>

                        {/* Layer 5: Sponsors Pins */}
                        {sponsors.map(sp => {
                          const status = getStatus(sp);
                          const isActive = activeSponsor?._id === sp._id;
                          return (
                            <div
                              key={sp._id}
                              onClick={(e) => { e.stopPropagation(); setActiveSponsor(sp); }}
                              className="absolute flex flex-col items-center z-20 group"
                              style={{ left: `${sp.map_location.x}%`, top: `${sp.map_location.y}%`, transform: 'translate(-50%, -50%)' }}
                            >
                              {/* Zones */}
                              {status === 'CRITICAL' && <div className="zone-pulse-red"></div>}
                              {status === 'RECOMMENDED' && <div className="zone-pulse-gold"></div>}

                              {/* Pin Icon */}
                              <div className={`
                                      w-4 h-4 md:w-5 md:h-5 flex items-center justify-center border border-[#0f380f] shadow-[1px_1px_0px_rgba(0,0,0,0.5)] transition-all
                                      ${status === 'CRITICAL' ? 'bg-[#d32f2f] text-white' : ''}
                                      ${status === 'RECOMMENDED' ? 'bg-[#f57f17] text-[#0f380f]' : 'bg-[#8bac0f]'}
                                      ${isActive ? 'bg-white scale-150 z-50 ring-2 ring-[#0f380f]' : 'hover:scale-125'}
                                   `}>
                                {status === 'CRITICAL' && <AlertTriangle size={8} />}
                                {status === 'RECOMMENDED' && <Sparkles size={8} />}
                                {status === 'NORMAL' && getCategoryIcon(sp.category)}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 2. INFO PANE (25%) - STALL INFO ONLY */}
                      <div className="h-36 bg-[#0f380f] p-1 border-t-4 border-[#306230]">
                        <div className="h-full bg-[#9bbc0f] border border-[#8bac0f] p-3 font-pixel text-[#0f380f] relative shadow-inner">
                          {activeSponsor ? (
                            <div className="flex gap-4 h-full">
                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  {/* Company Name */}
                                  <div className="text-xs font-bold mb-1 border-b border-[#0f380f] pb-1 uppercase tracking-wide truncate">
                                    {activeSponsor.company_name}
                                  </div>

                                  {/* Industry / Category */}
                                  <div className="font-console text-sm flex items-center gap-2 mt-1">
                                    <Building2 size={12} />
                                    <span className="uppercase">{activeSponsor.category}</span>
                                  </div>

                                  {/* Crowd Status */}
                                  <div className="font-console text-sm flex items-center gap-2 mt-1">
                                    <Users size={12} />
                                    <span className={getStatus(activeSponsor) === 'CRITICAL' ? 'text-red-700 blink' : ''}>
                                      {getStatus(activeSponsor) === 'CRITICAL' ? 'HIGH CROWD (>45m)' : 'LOW CROWD (<5m)'}
                                    </span>
                                  </div>
                                </div>

                                {/* Tactical Advice Badge */}
                                {getStatus(activeSponsor) === 'CRITICAL' ? (
                                  <div className="bg-[#d32f2f] text-white px-2 py-1 text-[8px] text-center animate-pulse border border-[#0f380f]">
                                    ⚠️ AVOID AREA
                                  </div>
                                ) : (
                                  <div className="bg-[#0f380f] text-[#9bbc0f] px-2 py-1 text-[8px] text-center">
                                    ✅ RECOMMENDED
                                  </div>
                                )}
                              </div>

                              {/* Signal Scanner (Hidden Reward) */}
                              <div className="w-24 border-l-2 border-[#0f380f] pl-2 flex flex-col items-center justify-center bg-[#8bac0f] opacity-80">
                                <span className="text-[8px] mb-1">SIGNAL</span>
                                <div className="w-12 h-12 bg-[#0f380f]/10 rounded-full flex items-center justify-center border border-[#0f380f]/20">
                                  {activeSponsor.current_pokemon_spawn.rarity === 'Legendary'
                                    ? <Sparkles size={20} className="animate-spin text-[#f57f17]" />
                                    : <SignalHigh size={20} />
                                  }
                                </div>
                                <span className="text-[8px] mt-1 text-center leading-tight uppercase">
                                  {activeSponsor.current_pokemon_spawn.rarity}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                              <Map size={32} className="mb-2" />
                              <div className="text-[8px]">SELECT A PIN<br />FOR INTEL</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- VIEW: SCANNER --- */}
                  {view === 'SCAN' && (
                    <div className="flex-1 relative flex flex-col bg-[#8bac0f]/30">
                      <div className="flex-1 m-4 border-4 border-[#0f380f] relative p-2 flex flex-col items-center justify-center bg-[#8bac0f] shadow-inner">
                        {scanning ? (
                          <div className="flex flex-col items-center">
                            <div className="w-full h-1 bg-[#0f380f] absolute top-10 animate-[scan_2s_infinite]"></div>
                            <div className="font-pixel text-[8px] animate-pulse mt-4">SYNCING...</div>
                          </div>
                        ) : (
                          <div className="text-center opacity-60">
                            <Scan size={64} className="mx-auto mb-2 text-[#0f380f]" />
                            <div className="font-pixel text-[8px]">LOCATE QR CODE</div>
                          </div>
                        )}
                      </div>
                      <div className="p-4 pt-0">
                        <button onClick={handleScan} className="w-full bg-[#0f380f] text-[#9bbc0f] font-pixel text-xs py-4 border-b-4 border-[#051c05] active:translate-y-1 active:border-b-0">
                          INITIATE SCAN
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- VIEW: LEADERBOARD --- */}
                  {view === 'RANK' && (
                    <div className="flex-1 overflow-y-auto pixel-scrollbar p-2 bg-[#9bbc0f]">
                      <div className="text-center font-pixel text-[10px] py-2 border-b-4 border-[#0f380f] mb-2 bg-[#8bac0f]">
                        RIVAL RANKINGS
                      </div>
                      {leaderboard.map((user, idx) => (
                        <div key={user.name} className={`flex items-center gap-3 p-3 border-b-2 border-[#306230] mb-2 ${user.name === 'YOU' ? 'bg-[#0f380f] text-[#9bbc0f] border-l-4 border-l-yellow-500' : 'bg-[#8bac0f]'}`}>
                          <div className="font-pixel text-lg w-8">#{user.rank}</div>
                          <div className="w-10 h-10 border-2 border-[#0f380f] bg-[#9bbc0f] flex items-center justify-center">
                            <img src={user.sprite} className="w-8 h-8 sprite" />
                          </div>
                          <div className="flex-1">
                            <div className="font-pixel text-xs">{user.name}</div>
                            <div className="font-console text-sm opacity-80">{user.score} PTS</div>
                          </div>
                          {idx === 0 && <Trophy size={20} className="text-yellow-700" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* GLOBAL TICKER */}
                  <div className="bg-[#0f380f] text-[#9bbc0f] py-1 border-t-4 border-[#0f380f] relative z-20">
                    <div className="whitespace-nowrap overflow-hidden">
                      <div className="inline-block animate-[marquee_10s_linear_infinite] font-console text-sm">
                        ⚠️ CROWD ALERT: MAIN STAGE (HIGH TRAFFIC) DETOUR TO TECHCORP FOR FASTER ENTRY! ⚠️
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* --- FLASH EVENT MODAL (Anonymous) --- */}
              {flashAlert && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-end justify-center slide-up backdrop-blur-sm">
                  <div className="bg-[#f8f8f8] w-full m-4 border-[6px] border-[#0f380f] rounded-lg shadow-2xl overflow-hidden">
                    <div className="bg-[#d32f2f] text-white font-pixel text-center py-2 text-[10px] animate-pulse">
                      🚨 CROWD CONTROL EVENT 🚨
                    </div>
                    <div className="p-4 bg-[#9bbc0f] flex flex-col items-center text-center">
                      <div className="font-pixel text-[8px] mb-2">TRAFFIC BALANCING REWARD</div>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="text-xs font-console line-through opacity-50">Main Stage</div>
                        <ArrowRight size={16} />
                        <div className="text-xs font-console font-bold">{flashAlert.stall}</div>
                      </div>

                      {/* Hidden Silhouette Question Mark */}
                      <div className="w-24 h-24 flex items-center justify-center border-4 border-[#0f380f] rounded-full bg-[#0f380f]/10 mb-2">
                        <HelpCircle size={48} className="text-[#0f380f] animate-bounce" />
                      </div>

                      <div className="font-pixel text-sm font-bold mb-1">{flashAlert.rarity} SPAWN DETECTED!</div>
                      <button onClick={() => { setFlashAlert(null); setView('MAP'); setActiveSponsor(sponsors.find(s => s.current_pokemon_spawn.rarity === 'Legendary')) }} className="bg-[#0f380f] text-[#9bbc0f] w-full py-3 font-pixel text-[10px] hover:bg-[#306230] mt-2">
                        ROUTE TO STALL
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NAVIGATION BUTTONS */}
            <div className="flex justify-between mt-4 gap-1">
              <button onClick={() => setView('SCAN')} className={`flex-1 py-4 border-b-4 rounded-lg font-pixel text-[8px] flex flex-col items-center gap-1 transition-all ${view === 'SCAN' ? 'bg-[#9bbc0f] text-[#0f380f] border-[#0f380f] translate-y-1' : 'bg-[#303030] text-gray-400 border-[#1a1a1a]'}`}>
                <Scan size={20} />
              </button>
              <button onClick={() => setView('MAP')} className={`flex-1 py-4 border-b-4 rounded-lg font-pixel text-[8px] flex flex-col items-center gap-1 transition-all ${view === 'MAP' ? 'bg-[#9bbc0f] text-[#0f380f] border-[#0f380f] translate-y-1' : 'bg-[#303030] text-gray-400 border-[#1a1a1a]'}`}>
                <Map size={20} />
              </button>
              <button onClick={() => setView('RANK')} className={`flex-1 py-4 border-b-4 rounded-lg font-pixel text-[8px] flex flex-col items-center gap-1 transition-all ${view === 'RANK' ? 'bg-[#9bbc0f] text-[#0f380f] border-[#0f380f] translate-y-1' : 'bg-[#303030] text-gray-400 border-[#1a1a1a]'}`}>
                <Trophy size={20} />
              </button>
            </div>

          </div>
        </div>

        {/* BOTTOM DECORATION */}
        <div className="h-8 bg-[#8B0000] flex justify-center items-center gap-4 border-t-4 border-[#5e0000]">
          <div className="w-16 h-2 bg-[#5e0000] rounded-full"></div>
        </div>

      </div>

      {/* --- SUCCESS MODAL --- */}
      {scannedMon && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in zoom-in duration-300">
          <div className="bg-[#f8f8f8] border-[6px] border-[#0f380f] rounded-lg w-full max-w-sm overflow-hidden shadow-2xl">
            <div className={`${scannedMon.isLegendary ? 'bg-yellow-600' : 'bg-[#0f380f]'} text-[#9bbc0f] p-2 font-pixel text-[10px] text-center flex justify-between items-center`}>
              <span>{scannedMon.isLegendary ? '✨ LEGENDARY ENCOUNTER!' : 'ENCOUNTER!'}</span>
              <X size={14} onClick={() => setScannedMon(null)} />
            </div>
            <div className="bg-[#9bbc0f] p-6 flex flex-col items-center relative h-64 border-b-4 border-[#0f380f]">
              <div className="scanlines opacity-50"></div>
              {scannedMon.isLegendary && (
                <div className="absolute inset-0 bg-yellow-400/10 animate-pulse pointer-events-none"></div>
              )}
              <div className="flex-1 flex items-center justify-center">
                <img src={scannedMon.img} className="w-32 h-32 sprite animate-bounce" />
              </div>
            </div>
            <div className="p-4 bg-white font-pixel text-[10px] leading-relaxed">
              <p className="mb-1">Gotcha! <span className="font-bold">{scannedMon.name}</span> was caught!</p>
              <p className="mb-1 text-[#306230]">At: {scannedMon.stall}</p>
              {scannedMon.isFlashSale && (
                <p className="mb-1 text-red-600 blink">⚡ FLASH SALE BONUS!</p>
              )}
              <p className="font-bold text-[#0f380f]">+{scannedMon.points} PTS</p>
              <button onClick={() => setScannedMon(null)} className="mt-4 w-full bg-[#0f380f] text-[#9bbc0f] py-3 hover:bg-[#306230] animate-pulse">CONTINUE ➤</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}