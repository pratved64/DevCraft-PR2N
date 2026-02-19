"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Battery, Wifi, Search, ArrowRightLeft, QrCode, MapPin, Map } from 'lucide-react';
import { fetchRewards, fetchMyHistory, redeemReward, fetchStalls, type RewardItem, type HistoryResponse, type StallInfo } from '../../lib/api';

// --- PIXEL ART STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

  :root {
    --gb-bg: #8bac0f;
    --gb-dark: #0f380f;
    --gb-light: #9bbc0f;
    --gb-accent: #306230;
    --poke-red: #DC0A2D;
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
    z-index: 10;
  }

  .screen-flicker {
    animation: flicker 0.15s infinite;
    opacity: 0.05;
    background: white;
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 11;
  }

  @keyframes flicker {
    0% { opacity: 0.02; }
    50% { opacity: 0.05; }
    100% { opacity: 0.02; }
  }

  .sprite {
    image-rendering: pixelated;
    filter: drop-shadow(4px 4px 0px rgba(15, 56, 15, 0.4));
  }
  
  .pixel-scrollbar::-webkit-scrollbar { width: 8px; }
  .pixel-scrollbar::-webkit-scrollbar-track { bg: var(--gb-light); }
  .pixel-scrollbar::-webkit-scrollbar-thumb { background: var(--gb-dark); border: 2px solid var(--gb-light); }

  .pixel-qr {
    image-rendering: pixelated;
    mix-blend-mode: multiply;
  }
`;

// --- STATIC METADATA LOOKUP (Frontend Asset Map) ---
// The DB stores "Charizard", frontend maps that to assets.
const POKEMON_METADATA: Record<string, any> = {
   "Bulbasaur": { dex: '#001', img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png", desc: "A strange seed was planted on its back at birth." },
   "Charmander": { dex: '#004', img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png", desc: "Obviously prefers hot places. Rain creates steam." },
   "Squirtle": { dex: '#007', img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png", desc: "Shoots water at prey while in the water." },
   "Pikachu": { dex: '#025', img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png", desc: "Keeps its tail raised to monitor surroundings." },
   "Charizard": { dex: '#006', img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png", desc: "Spits fire that is hot enough to melt boulders." },
   "Mewtwo": { dex: '#150', img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png", desc: "Created by a scientist after years of splicing." },
};

// --- MOCK DATABASE STATE ---

const MOCK_USER = {
   _id: "u_123",
   name: "Alex Mercer",
   email: "alex.m@college.edu",
   demographics: { major: "Computer Engineering", grad_year: 2027 },
   wallet: { total_points: 1450, legendaries_caught: 2 }
};

const MOCK_SCAN_EVENTS = [
   { _id: "evt_1", student_id: "u_123", sponsor_id: "sp_1", timestamp: "2026-02-18T10:30:00Z", pokemon: { name: "Bulbasaur", type: "Grass", rarity: "Normal" }, points_awarded: 50 },
   { _id: "evt_2", student_id: "u_123", sponsor_id: "sp_2", timestamp: "2026-02-18T12:15:00Z", pokemon: { name: "Charmander", type: "Fire", rarity: "Normal" }, points_awarded: 50 },
   { _id: "evt_3", student_id: "u_123", sponsor_id: "sp_3", timestamp: "2026-02-18T14:30:00Z", pokemon: { name: "Charizard", type: "Fire", rarity: "Legendary" }, points_awarded: 500 },
   { _id: "evt_4", student_id: "u_123", sponsor_id: "sp_4", timestamp: "2026-02-18T16:00:00Z", pokemon: { name: "Pikachu", type: "Electric", rarity: "Normal" }, points_awarded: 100 },
];

const MOCK_REWARDS = [
   { _id: "rew_1", item_name: "Premium Food Coupon", category: "F&B", cost_in_points: 500, requires_legendary: false, stock_remaining: 150 },
   { _id: "rew_2", item_name: "TechCorp Internship Fast-Track", category: "Career", cost_in_points: 0, requires_legendary: true, stock_remaining: 5 },
   { _id: "rew_3", item_name: "University Hoodie", category: "Merch", cost_in_points: 1000, requires_legendary: false, stock_remaining: 40 },
   { _id: "rew_4", item_name: "Free Coffee", category: "F&B", cost_in_points: 150, requires_legendary: false, stock_remaining: 200 },
];

// Mapped sponsor data for map view – coordinates are % of container (0-100)
const MOCK_SPONSORS = [
   { _id: "sp_1", name: "TechCorp",   loc: { x: 13, y: 50 } },
   { _id: "sp_2", name: "DevStudio",  loc: { x: 33, y: 22 } },
   { _id: "sp_3", name: "AI Labs",    loc: { x: 55, y: 40 } },
   { _id: "sp_4", name: "FutureHire", loc: { x: 72, y: 65 } },
   { _id: "sp_5", name: "Burger Town",loc: { x: 85, y: 30 } },
];

export default function PokemonDash() {
   const [view, setView] = useState<'DEX' | 'LINK' | 'MART' | 'MAP'>('DEX');
   const [user, setUser] = useState(MOCK_USER);
   const [scans, setScans] = useState(MOCK_SCAN_EVENTS);
   const [rewards, setRewards] = useState(MOCK_REWARDS);
   const [mapStalls, setMapStalls] = useState<StallInfo[]>([]);

   const [selectedMon, setSelectedMon] = useState<any>(null);
   const [selectedReward, setSelectedReward] = useState<any>(null);
   const [generatedVoucher, setGeneratedVoucher] = useState<any>(null);
   const [booting, setBooting] = useState(true);
   const [apiUserId, setApiUserId] = useState<string>('');

   // Boot Effect + data fetch
   useEffect(() => {
      setTimeout(() => setBooting(false), 1500);

      // Fetch rewards from API
      fetchRewards()
         .then((data) => {
            setRewards(data.map(r => ({
               _id: r.id,
               item_name: r.item_name,
               category: r.category,
               cost_in_points: r.cost_in_points,
               requires_legendary: r.requires_legendary,
               stock_remaining: r.stock_remaining,
            })));
         })
         .catch(console.error);

      // Fetch live stall map data
      fetchStalls()
         .then((stalls) => { if (stalls.length > 0) setMapStalls(stalls); })
         .catch(console.error);

      // Fetch user history from API
      fetchMyHistory()
         .then((data) => {
            setUser(prev => ({
               ...prev,
               _id: data.user_id,
               name: data.name,
               wallet: { total_points: data.total_points, legendaries_caught: data.legendaries_caught },
            }));
            setApiUserId(data.user_id);
            if (data.pokedex && data.pokedex.length > 0) {
               setScans(data.pokedex.map((p: any, i: number) => {
                  // DB stores the pokemon info under "pokemon_caught" key
                  const pokemonInfo = p.pokemon_caught || p.pokemon || {};
                  return {
                     _id: p._id || `evt_${i}`,
                     student_id: data.user_id,
                     sponsor_id: p.sponsor_id || '',
                     timestamp: p.timestamp || new Date().toISOString(),
                     pokemon: {
                        name: pokemonInfo.name || 'Unknown',
                        type: pokemonInfo.type || 'Normal',
                        rarity: pokemonInfo.rarity || 'Normal',
                     },
                     points_awarded: p.points_awarded || 10,
                  };
               }));
            }
         })
         .catch(console.error);
   }, []);

   // --- HELPERS ---

   // Merge DB Data with Static Metadata
   const getFullPokemonData = (scanEvent: any) => {
      const meta = POKEMON_METADATA[scanEvent.pokemon.name] || { dex: '???', img: '', desc: 'Unknown Data' };
      return { ...scanEvent, ...meta };
   };

   // Filter rewards based on view logic
   const martItems = rewards.filter(r => !r.requires_legendary);
   const tradeItems = rewards.filter(r => r.requires_legendary);

   // Purchase Logic (Points) — calls backend
   const handlePurchase = async (item: any) => {
      if (user.wallet.total_points >= item.cost_in_points) {
         try {
            const result = await redeemReward(item._id, apiUserId || undefined);
            if (result.success) {
               setUser(prev => ({ ...prev, wallet: { ...prev.wallet, total_points: result.remaining_points } }));
               // Refresh rewards list to update stock counts
               fetchRewards(apiUserId || undefined)
                  .then((data) => {
                     setRewards(data.map(r => ({
                        _id: r.id,
                        item_name: r.item_name,
                        category: r.category,
                        cost_in_points: r.cost_in_points,
                        requires_legendary: r.requires_legendary,
                        stock_remaining: r.stock_remaining,
                     })));
                  })
                  .catch(console.error);
               generateVoucher(item, 'PURCHASED', result.voucher_code || undefined);
            } else {
               alert(result.message);
            }
         } catch {
            // Fallback: local deduction
            setUser(prev => ({ ...prev, wallet: { ...prev.wallet, total_points: prev.wallet.total_points - item.cost_in_points } }));
            generateVoucher(item, 'PURCHASED');
         }
      }
   };

   // Trade Logic (Legendary Sacrifice)
   const handleLegendaryTrade = async (scanToSacrifice: any) => {
      try {
         // Call backend to redeem the legendary reward
         const result = await redeemReward(selectedReward._id, apiUserId || undefined);
         if (result.success) {
            // Remove from local Pokedex
            setScans(prev => prev.filter(s => s._id !== scanToSacrifice._id));
            // Update Wallet Stats from server
            setUser(prev => ({
               ...prev,
               wallet: {
                  total_points: result.remaining_points,
                  legendaries_caught: prev.wallet.legendaries_caught - 1,
               },
            }));
            setSelectedReward(null);
            generateVoucher(selectedReward, `TRADED: ${scanToSacrifice.pokemon.name}`, result.voucher_code || undefined);
         } else {
            alert(result.message);
         }
      } catch {
         // Fallback: local-only trade
         setScans(prev => prev.filter(s => s._id !== scanToSacrifice._id));
         setUser(prev => ({ ...prev, wallet: { ...prev.wallet, legendaries_caught: prev.wallet.legendaries_caught - 1 } }));
         setSelectedReward(null);
         generateVoucher(selectedReward, `TRADED: ${scanToSacrifice.pokemon.name}`);
      }
   };

   const generateVoucher = (item: any, type: string, serverCode?: string) => {
      setGeneratedVoucher({
         title: item.item_name,
         code: serverCode || `${type.substring(0, 3)}-${Math.floor(Math.random() * 99999)}`,
         desc: type
      });
   };

   return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4 selection:bg-red-900 selection:text-white">
         <style>{styles}</style>

         {/* --- THE DEVICE --- */}
         <div className="relative w-full max-w-md bg-[#DC0A2D] rounded-xl shadow-[0_20px_50px_rgba(220,10,45,0.3)] border-b-[12px] border-r-[8px] border-[#8B0000] overflow-hidden transition-all duration-300">

            {/* TOP BEZEL DECORATION */}
            <div className="h-20 bg-[#DC0A2D] border-b-4 border-[#8B0000]/50 flex items-center px-8 gap-4 shadow-lg relative z-20">
               <div className="w-14 h-14 rounded-full bg-blue-500 border-4 border-[#dedede] shadow-[inset_2px_2px_8px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                  <div className="absolute top-2 left-2 w-4 h-4 bg-white rounded-full opacity-60 blur-[1px]"></div>
                  <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity"></div>
               </div>
               <div className="flex gap-2 mt-[-20px]">
                  <div className="w-3 h-3 rounded-full bg-red-900 border border-black/30 shadow-inner"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 border border-black/30 shadow-inner animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-green-700 border border-black/30 shadow-inner"></div>
               </div>
            </div>

            {/* SCREEN AREA */}
            <div className="p-6 pt-2 bg-[#DC0A2D]">
               <div className="bg-[#b0b0b0] rounded-bl-[40px] rounded-br-[10px] rounded-t-[10px] p-6 pb-8 border-b-4 border-r-4 border-[#757575] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.4)]">

                  {/* SCREEN HEADER */}
                  <div className="flex justify-between items-center mb-3 text-[10px] font-pixel text-[#505050] px-2">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                        <span>{user.name.split(' ')[0]}_LOGGED</span>
                     </div>
                     <div className="flex gap-3">
                        <span className="flex items-center gap-1"><Wifi size={10} /> ON</span>
                        <span className="flex items-center gap-1"><Battery size={10} /> 82%</span>
                     </div>
                  </div>

                  {/* LCD DISPLAY */}
                  <div className="gb-screen-container border-[6px] border-[#4a4a4a] rounded-md h-[420px] relative">
                     <div className="scanlines"></div>
                     <div className="screen-flicker"></div>

                     {booting ? (
                        <div className="h-full flex flex-col items-center justify-center font-pixel text-[#0f380f] text-xs gap-4">
                           <div className="w-12 h-12 border-4 border-[#0f380f] rounded-full border-t-transparent animate-spin"></div>
                           <div>SYNCING DB...</div>
                        </div>
                     ) : (
                        <div className="h-full flex flex-col relative z-20">

                           {/* TOP BAR */}
                           <div className="bg-[#0f380f] text-[#9bbc0f] p-2 flex justify-between items-center border-b-2 border-[#306230]">
                              <div className="font-pixel text-[10px]">
                                 {view}
                              </div>
                              <div className="font-pixel text-[10px]">
                                 PTS: {user.wallet.total_points}
                              </div>
                           </div>

                           {/* CONTENT AREA */}
                           <div className="flex-1 overflow-y-auto pixel-scrollbar p-2">

                              {/* 1. VIEW: POKEDEX (scans collection) */}
                              {view === 'DEX' && (
                                 <div className="space-y-2">
                                    {scans.length === 0 && <div className="text-center font-pixel text-[8px] mt-10 opacity-70">NO DATA.</div>}

                                    {scans.map((scan) => {
                                       const data = getFullPokemonData(scan);
                                       return (
                                          <div key={scan._id} onClick={() => setSelectedMon(data)} className="flex items-center gap-2 p-2 border-b-2 border-[#306230] hover:bg-[#0f380f] hover:text-[#9bbc0f] group cursor-pointer transition-colors">
                                             <div className={`w-8 h-8 flex items-center justify-center bg-[#9bbc0f] border border-[#0f380f] rounded-sm group-hover:border-[#9bbc0f] ${data.pokemon.rarity === 'Legendary' ? 'border-yellow-400' : ''}`}>
                                                <img src={data.img} className="w-6 h-6 sprite" />
                                             </div>
                                             <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                   <span className={`font-pixel text-[10px] ${data.pokemon.rarity === 'Legendary' ? 'text-yellow-900 group-hover:text-yellow-400' : ''}`}>{data.pokemon.name}</span>
                                                   <span className="font-pixel text-[8px] bg-[#0f380f] text-[#9bbc0f] px-1 rounded">{data.pokemon.type}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1 opacity-70">
                                                   <span className="font-console text-sm text-[10px]">+{data.points_awarded}pts</span>
                                                   <span className="font-console text-[10px]">{new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                              )}

                              {/* 2. VIEW: MART (Points Spending) */}
                              {view === 'MART' && (
                                 <div className="grid grid-cols-2 gap-2">
                                    {martItems.map((item) => (
                                       <div key={item._id} className="border-2 border-[#0f380f] p-2 flex flex-col items-center text-center hover:bg-[#0f380f] hover:text-[#9bbc0f] group transition-colors relative">
                                          <div className="font-pixel text-[8px] h-8 overflow-hidden leading-tight mb-1">{item.item_name}</div>
                                          <div className="font-pixel text-[10px] font-bold mt-auto mb-1">PTS: {item.cost_in_points}</div>
                                          <div className="font-console text-[10px]">Stock: {item.stock_remaining}</div>
                                          <button
                                             onClick={() => handlePurchase(item)}
                                             disabled={user.wallet.total_points < item.cost_in_points}
                                             className="w-full mt-2 bg-[#0f380f] text-[#9bbc0f] text-[8px] font-pixel py-1 group-hover:bg-[#9bbc0f] group-hover:text-[#0f380f] disabled:opacity-50"
                                          >
                                             BUY
                                          </button>
                                       </div>
                                    ))}
                                 </div>
                              )}

                              {/* 3. VIEW: LINK (Legendary Trading) */}
                              {view === 'LINK' && (
                                 <div className="space-y-3">
                                    <div className="p-2 border-2 border-dashed border-[#0f380f] text-center mb-4">
                                       <p className="font-pixel text-[8px] leading-relaxed">
                                          LEGENDARY EXCHANGE<br />SACRIFICE RARE POKEMON FOR EXCLUSIVE PERKS
                                       </p>
                                    </div>

                                    {tradeItems.map((trade) => (
                                       <div key={trade._id} className="border-2 border-[#0f380f] bg-[#9bbc0f] p-2 relative">
                                          <div className="flex justify-between items-start mb-2">
                                             <div>
                                                <div className="font-pixel text-[10px] font-bold">{trade.item_name}</div>
                                                <div className="font-pixel text-[8px] text-[#306230] mt-1">REQ: 1 LEGENDARY</div>
                                             </div>
                                          </div>
                                          <button
                                             onClick={() => setSelectedReward(trade)}
                                             className="w-full bg-[#0f380f] text-[#9bbc0f] font-pixel text-[8px] py-2 hover:bg-[#306230] active:translate-y-1"
                                          >
                                             INITIATE TRADE
                                          </button>
                                       </div>
                                    ))}
                                 </div>
                              )}

                              {/* 4. VIEW: MAP (Sponsors — live data) */}
                              {view === 'MAP' && (
                                 <div className="h-full relative bg-[#e0f8cf] border border-[#0f380f] overflow-hidden">
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#0f380f 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                                    {/* Status legend */}
                                    <div className="absolute top-1 left-1 z-20 flex gap-1">
                                       <span className="font-pixel text-[5px] bg-[#f57f17] text-[#0f380f] px-1">✨ LEGEND</span>
                                       <span className="font-pixel text-[5px] bg-[#d32f2f] text-white px-1">🔥 HIGH</span>
                                    </div>
                                    {(mapStalls.length > 0 ? mapStalls : MOCK_SPONSORS.map(s => ({
                                       stall_id: s._id, company_name: s.name,
                                       map_location: { x_coord: s.loc.x * 9, y_coord: s.loc.y * 9 },
                                       current_pokemon_spawn: { name: 'Pikachu', rarity: 'Normal' },
                                       crowd_level: 'Normal', scan_count_10m: 0, total_scan_count: 0, category: '',
                                    }))).map((sp: any) => {
                                       const x = sp.map_location ? Math.min(90, Math.max(5, (sp.map_location.x_coord / 900) * 100)) : sp.loc?.x ?? 50;
                                       const y = sp.map_location ? Math.min(90, Math.max(5, (sp.map_location.y_coord / 900) * 100)) : sp.loc?.y ?? 50;
                                       const isLegendary = sp.current_pokemon_spawn?.rarity === 'Legendary';
                                       const isHigh = sp.crowd_level === 'High';
                                       return (
                                          <div key={sp.stall_id || sp._id} className="absolute flex flex-col items-center" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}>
                                             <MapPin
                                                size={isLegendary ? 20 : 14}
                                                className={`${isLegendary ? 'text-[#f57f17] animate-bounce' : isHigh ? 'text-[#d32f2f]' : 'text-[#0f380f]'}`}
                                                fill={isLegendary ? '#f57f17' : isHigh ? '#d32f2f' : '#0f380f'}
                                             />
                                             <span className="font-pixel text-[5px] bg-[#0f380f] text-[#9bbc0f] px-1 max-w-[50px] truncate text-center">
                                                {(sp.company_name || sp.name || '').slice(0, 8)}
                                             </span>
                                             {isLegendary && <span className="font-pixel text-[5px] text-[#f57f17]">✨</span>}
                                          </div>
                                       );
                                    })}
                                 </div>
                              )}

                           </div>

                           {/* BOTTOM TABS */}
                           <div className="flex border-t-2 border-[#306230]">
                              <button onClick={() => setView('DEX')} className={`flex-1 py-3 font-pixel text-[8px] flex flex-col items-center gap-1 ${view === 'DEX' ? 'bg-[#0f380f] text-[#9bbc0f]' : 'hover:bg-[#306230]/20'}`}>
                                 <Search size={12} /> DEX
                              </button>
                              <button onClick={() => setView('MART')} className={`flex-1 py-3 font-pixel text-[8px] flex flex-col items-center gap-1 ${view === 'MART' ? 'bg-[#0f380f] text-[#9bbc0f]' : 'hover:bg-[#306230]/20'}`}>
                                 <ShoppingBag size={12} /> MART
                              </button>
                              <button onClick={() => setView('LINK')} className={`flex-1 py-3 font-pixel text-[8px] flex flex-col items-center gap-1 ${view === 'LINK' ? 'bg-[#0f380f] text-[#9bbc0f]' : 'hover:bg-[#306230]/20'}`}>
                                 <ArrowRightLeft size={12} /> LINK
                              </button>
                              <button onClick={() => setView('MAP')} className={`flex-1 py-3 font-pixel text-[8px] flex flex-col items-center gap-1 ${view === 'MAP' ? 'bg-[#0f380f] text-[#9bbc0f]' : 'hover:bg-[#306230]/20'}`}>
                                 <Map size={12} /> MAP
                              </button>
                           </div>

                        </div>
                     )}
                  </div>

                  {/* BRANDING */}
                  <div className="flex justify-between items-center mt-3 px-2">
                     <div className="flex gap-1">
                        <span className="w-1.5 h-6 bg-[#757575] rounded-full rotate-12 block"></span>
                        <span className="w-1.5 h-6 bg-[#757575] rounded-full rotate-12 block"></span>
                        <span className="w-1.5 h-6 bg-[#757575] rounded-full rotate-12 block"></span>
                     </div>
                     <div className="font-sans font-bold italic text-[#757575] text-lg tracking-wider">
                        Nintendo <span className="text-xs font-normal">GAME BOY</span>
                     </div>
                  </div>

               </div>
            </div>

            {/* BOTTOM CONTROLS */}
            <div className="bg-[#DC0A2D] p-8 relative">
               <div className="flex justify-between items-end">
                  <div className="w-28 h-28 relative">
                     <div className="absolute top-0 left-1/3 w-1/3 h-full bg-[#111] rounded shadow-md"></div>
                     <div className="absolute top-1/3 left-0 w-full h-1/3 bg-[#111] rounded shadow-md"></div>
                     <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-[#1a1a1a] shadow-inner opacity-50"></div></div>
                  </div>
                  <div className="w-32 h-16 relative transform rotate-[-15deg] mb-4">
                     <div className="absolute right-0 top-0 w-12 h-12 bg-[#2d2d2d] rounded-full shadow-lg flex items-center justify-center active:translate-y-1"><span className="font-pixel text-[10px] text-[#555] mt-14 ml-8">A</span></div>
                     <div className="absolute left-0 bottom-0 w-12 h-12 bg-[#2d2d2d] rounded-full shadow-lg flex items-center justify-center active:translate-y-1"><span className="font-pixel text-[10px] text-[#555] mt-14 ml-8">B</span></div>
                  </div>
               </div>
            </div>

         </div>

         {/* --- MODAL: POKEMON INFO --- */}
         {selectedMon && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
               <div className="bg-[#f8f8f8] border-[6px] border-[#2d2d2d] rounded-lg p-1 w-full max-w-sm relative shadow-2xl">
                  <button onClick={() => setSelectedMon(null)} className="absolute -top-4 -right-4 bg-red-600 text-white rounded-full p-2 border-2 border-black hover:scale-110 transition-transform"><X size={16} /></button>
                  <div className="bg-[#9bbc0f] p-4 border-2 border-[#0f380f] relative overflow-hidden">
                     <div className="scanlines opacity-50"></div>
                     <div className="flex justify-between items-end border-b-2 border-[#0f380f] pb-2 mb-4">
                        <h2 className="font-pixel text-sm">{selectedMon.pokemon.name}</h2>
                        <span className="font-pixel text-[10px]">{selectedMon.dex}</span>
                     </div>
                     <div className="flex gap-4 mb-4">
                        <div className="w-24 h-24 bg-[#0f380f] flex items-center justify-center border-2 border-[#306230]"><img src={selectedMon.img} className="w-20 h-20 sprite" /></div>
                        <div className="flex-1 font-pixel text-[8px] space-y-2 py-1">
                           <div>TYPE: <span className="bg-[#0f380f] text-[#9bbc0f] px-1">{selectedMon.pokemon.type}</span></div>
                           <div>RARITY: {selectedMon.pokemon.rarity}</div>
                           <div>DATE: {new Date(selectedMon.timestamp).toLocaleDateString()}</div>
                        </div>
                     </div>
                     <p className="font-console text-lg leading-tight opacity-90 border-t-2 border-[#0f380f] pt-2">{selectedMon.desc}</p>
                  </div>
               </div>
            </div>
         )}

         {/* --- MODAL: SELECT LEGENDARY TO TRADE --- */}
         {selectedReward && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in">
               <div className="bg-[#f8f8f8] border-[6px] border-[#2d2d2d] rounded-lg p-1 w-full max-w-sm relative">
                  <button onClick={() => setSelectedReward(null)} className="absolute -top-4 -right-4 bg-red-600 text-white rounded-full p-2 border-2 border-black hover:scale-110"><X size={16} /></button>

                  <div className="bg-[#9bbc0f] p-4 border-2 border-[#0f380f] h-[400px] flex flex-col">
                     <div className="text-center border-b-2 border-[#0f380f] pb-2 mb-2">
                        <div className="font-pixel text-[10px] mb-1">TRADING FOR:</div>
                        <div className="font-pixel text-sm font-bold">{selectedReward.item_name}</div>
                     </div>

                     <div className="font-pixel text-[8px] mb-2 text-center bg-[#306230] text-[#9bbc0f] py-1">
                        SELECT LEGENDARY TO SACRIFICE:
                     </div>

                     <div className="flex-1 overflow-y-auto pixel-scrollbar border-2 border-[#0f380f] bg-[#8bac0f] p-1">
                        {scans.filter(s => s.pokemon.rarity === 'Legendary').length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                              <X size={32} className="mb-2" />
                              <p className="font-pixel text-[8px]">NO LEGENDARIES<br />IN STORAGE.</p>
                           </div>
                        ) : (
                           scans.filter(s => s.pokemon.rarity === 'Legendary').map(scan => {
                              const meta = getFullPokemonData(scan);
                              return (
                                 <div key={scan._id} onClick={() => handleLegendaryTrade(scan)} className="flex items-center gap-2 p-2 border-b border-[#306230] cursor-pointer hover:bg-[#0f380f] hover:text-[#9bbc0f] group">
                                    <img src={meta.img} className="w-6 h-6 sprite" />
                                    <div className="font-pixel text-[8px]">{scan.pokemon.name}</div>
                                 </div>
                              );
                           })
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* --- MODAL: GENERATED VOUCHER --- */}
         {generatedVoucher && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-md animate-in zoom-in duration-300">
               <div className="bg-white text-black w-full max-w-xs relative p-4 shadow-[0_0_50px_rgba(255,255,255,0.2)]" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
                  <div className="border-4 border-black p-4 text-center">
                     <div className="font-pixel text-lg font-bold mb-2">VOUCHER</div>
                     <div className="font-pixel text-[10px] mb-4 text-gray-500">{generatedVoucher.title}</div>

                     <div className="w-48 h-48 bg-black mx-auto mb-4 p-2 relative pixel-qr">
                        <div className="w-full h-full bg-white flex items-center justify-center">
                           <QrCode size={150} />
                        </div>
                     </div>

                     <div className="font-console text-2xl tracking-widest font-bold mb-2">{generatedVoucher.code}</div>
                     <div className="font-pixel text-[8px] text-gray-400">TYPE: {generatedVoucher.desc}</div>

                     <button
                        onClick={() => setGeneratedVoucher(null)}
                        className="mt-6 w-full bg-black text-white font-pixel text-[10px] py-3 hover:bg-gray-800"
                     >
                        CLOSE & SAVE
                     </button>
                  </div>

                  <div className="absolute -left-2 top-1/2 w-4 h-8 bg-[#1a1a1a] rounded-r-full transform -translate-y-1/2"></div>
                  <div className="absolute -right-2 top-1/2 w-4 h-8 bg-[#1a1a1a] rounded-l-full transform -translate-y-1/2"></div>
               </div>
            </div>
         )}

      </div>
   );
}