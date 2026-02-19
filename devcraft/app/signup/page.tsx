"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Terminal, Users, Building2, ArrowLeft, 
  Zap, Crosshair, MapPin, Database, Cpu 
} from 'lucide-react';

// --- STYLES & ANIMATIONS (DARK RED & BLACK THEME) ---
const styles = `
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

  @keyframes blink { 50% { opacity: 0; } }
  
  .crt-container {
    background-color: var(--dark-bg);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    color: #eee;
  }

  .scanline-overlay {
    background: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 50%);
    background-size: 100% 4px;
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 50;
  }

  .retro-grid {
    background-image: 
      linear-gradient(to right, rgba(239, 68, 68, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(239, 68, 68, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .glass-panel {
    background: rgba(15, 5, 5, 0.85);
    backdrop-filter: blur(12px);
    border: 2px solid rgba(239, 68, 68, 0.2);
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(239, 68, 68, 0.05);
    transition: all 0.3s ease;
  }

  .cyber-input {
    background: #050000;
    border: 2px solid #331111;
    color: #fff;
    font-family: 'VT323', monospace;
    font-size: 1.25rem;
    padding: 0.75rem 1rem;
    width: 100%;
    outline: none;
    transition: all 0.2s;
  }
  .cyber-input:focus {
    border-color: var(--neon-red);
    box-shadow: inset 0 0 10px rgba(239, 68, 68, 0.2);
  }
  .cyber-input::placeholder {
    color: #444;
  }

  .role-card {
    background: #0a0505;
    border: 2px solid #331111;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  .role-card:hover {
    border-color: var(--neon-red);
    background: #110505;
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(239, 68, 68, 0.15);
  }
  .role-card.active {
    border-color: var(--neon-red);
    background: #1a0505;
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.2), inset 0 0 15px rgba(239, 68, 68, 0.1);
  }

  .cyber-button {
    background: linear-gradient(45deg, transparent 5%, var(--neon-red) 5%);
    color: #000;
    box-shadow: 6px 0px 0px #7f1d1d;
    transition: all 0.2s;
    text-transform: uppercase;
    font-weight: bold;
    letter-spacing: 2px;
  }
  .cyber-button:hover {
    background: linear-gradient(45deg, transparent 5%, #f87171 5%);
  }
  .cyber-button:active {
    box-shadow: 2px 0px 0px #7f1d1d;
    transform: translateX(4px);
  }
  .cyber-button:disabled {
    background: #333;
    box-shadow: 6px 0px 0px #111;
    color: #666;
    cursor: not-allowed;
  }

  .blink { animation: blink 1s step-end infinite; }
`;

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<'STUDENT' | 'SPONSOR' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState("ENCRYPTING...");

  // Form States matching the schemas
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    major: '',
    grad_year: ''
  });

  const [sponsorData, setSponsorData] = useState({
    company_name: '',
    category: 'Software',
    x_coord: '',
    y_coord: ''
  });

  // Simulated Matrix decoding effect during submission
  useEffect(() => {
    if (isSubmitting) {
      const texts = ["ENCRYPTING PAYLOAD...", "ESTABLISHING UPLINK...", "WRITING TO DB...", "ACCESS GRANTED."];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingText(texts[i]);
        i++;
        if (i === texts.length) {
          clearInterval(interval);
          setTimeout(() => {
             // Redirect based on role
             if (role === 'STUDENT') router.push('/studentpage');
             if (role === 'SPONSOR') router.push('/sponsor');
          }, 500);
        }
      }, 600);
      return () => clearInterval(interval);
    }
  }, [isSubmitting, role, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (role === 'STUDENT') {
      const payload = {
        name: studentData.name,
        email: studentData.email,
        demographics: {
          major: studentData.major,
          grad_year: parseInt(studentData.grad_year, 10)
        }
      };
      console.log("Submitting Student Schema:", payload);
    } else {
      const payload = {
        company_name: sponsorData.company_name,
        category: sponsorData.category,
        map_location: {
          x_coord: parseInt(sponsorData.x_coord, 10),
          y_coord: parseInt(sponsorData.y_coord, 10)
        }
      };
      console.log("Submitting Sponsor Schema:", payload);
    }
  };

  return (
    <div className="crt-container selection:bg-red-500/30 selection:text-red-100 flex flex-col items-center justify-center p-6">
      <style>{styles}</style>
      <div className="scanline-overlay"></div>
      <div className="absolute inset-0 retro-grid opacity-20 pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#020000_80%)] z-0 pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-red-950 border-2 border-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] mb-4">
          <Zap className="text-red-500 w-8 h-8" />
        </div>
        <h1 className="font-pixel text-xl md:text-2xl text-white tracking-widest uppercase">
          EVENT_FLOW <span className="text-red-500">INIT</span>
        </h1>
        <div className="font-console text-red-500/70 text-lg mt-2 tracking-widest">
          AWAITING_IDENTITY_REGISTRATION<span className="blink">_</span>
        </div>
      </div>

      <div className="glass-panel w-full max-w-2xl p-6 md:p-10 relative z-10">
        
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 z-50 bg-[#020000]/90 backdrop-blur-md flex flex-col items-center justify-center">
            <Cpu size={64} className="text-red-500 animate-pulse mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
            <div className="font-console text-2xl text-white tracking-widest">{loadingText}</div>
            <div className="w-64 h-1 bg-[#331111] mt-6 overflow-hidden">
               <div className="h-full bg-red-500 animate-[scanline_2s_ease-in-out_infinite] w-1/2"></div>
            </div>
          </div>
        )}

        {!role ? (
          /* --- STEP 1: ROLE SELECTION --- */
          <div className="animate-in fade-in duration-500">
            <h2 className="font-pixel text-xs text-gray-400 mb-6 border-b border-[#331111] pb-2">SELECT_NODE_TYPE</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onClick={() => setRole('STUDENT')}
                className="role-card p-8 flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 bg-[#1a0505] border border-red-900/50 rounded-full flex items-center justify-center mb-6 group-hover:border-red-500 transition-colors">
                  <Users size={32} className="text-gray-500 group-hover:text-red-500 transition-colors" />
                </div>
                <h3 className="font-pixel text-sm text-white mb-2">STUDENT</h3>
                <p className="font-console text-gray-500 text-lg">Register for PokeGear tracking, gamification, and digital rewards.</p>
              </div>

              <div 
                onClick={() => setRole('SPONSOR')}
                className="role-card p-8 flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 bg-[#1a0505] border border-red-900/50 rounded-full flex items-center justify-center mb-6 group-hover:border-red-500 transition-colors">
                  <Building2 size={32} className="text-gray-500 group-hover:text-red-500 transition-colors" />
                </div>
                <h3 className="font-pixel text-sm text-white mb-2">SPONSOR</h3>
                <p className="font-console text-gray-500 text-lg">Establish stall telemetry, access live heatmaps, and deploy lures.</p>
              </div>
            </div>
          </div>
        ) : (
          /* --- STEP 2: REGISTRATION FORM --- */
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between border-b border-[#331111] pb-4 mb-6">
              <button 
                onClick={() => setRole(null)}
                className="text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2 font-pixel text-[10px]"
              >
                <ArrowLeft size={14} /> BACK
              </button>
              <div className="font-pixel text-[10px] text-red-500 flex items-center gap-2">
                <Terminal size={14} /> NEW_{role}_RECORD
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {role === 'STUDENT' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="font-pixel text-[8px] text-red-500 mb-2 block">FULL_NAME</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Alex Mercer"
                        className="cyber-input"
                        value={studentData.name}
                        onChange={(e) => setStudentData({...studentData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="font-pixel text-[8px] text-red-500 mb-2 block">EDU_EMAIL</label>
                      <input 
                        required
                        type="email" 
                        placeholder="alex.m@college.edu"
                        className="cyber-input"
                        value={studentData.email}
                        onChange={(e) => setStudentData({...studentData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-[#110505] border border-[#331111] p-4 mt-4 relative">
                    <div className="absolute top-0 left-0 bg-red-900/50 text-red-400 font-pixel text-[6px] px-2 py-1 -mt-2 ml-4">DEMOGRAPHICS_OBJ</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div>
                        <label className="font-pixel text-[8px] text-gray-500 mb-2 block">MAJOR</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Computer Engineering"
                          className="cyber-input !border-[#220a0a] focus:!border-red-500"
                          value={studentData.major}
                          onChange={(e) => setStudentData({...studentData, major: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="font-pixel text-[8px] text-gray-500 mb-2 block">GRAD_YEAR</label>
                        <input 
                          required
                          type="number" 
                          placeholder="2027"
                          min="2024" max="2030"
                          className="cyber-input !border-[#220a0a] focus:!border-red-500"
                          value={studentData.grad_year}
                          onChange={(e) => setStudentData({...studentData, grad_year: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {role === 'SPONSOR' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="font-pixel text-[8px] text-red-500 mb-2 block">COMPANY_NAME</label>
                      <input 
                        required
                        type="text" 
                        placeholder="TechCorp Solutions"
                        className="cyber-input"
                        value={sponsorData.company_name}
                        onChange={(e) => setSponsorData({...sponsorData, company_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="font-pixel text-[8px] text-red-500 mb-2 block">CATEGORY</label>
                      <div className="relative">
                        <select 
                          className="cyber-input appearance-none cursor-pointer"
                          value={sponsorData.category}
                          onChange={(e) => setSponsorData({...sponsorData, category: e.target.value})}
                        >
                          <option value="Software">Software</option>
                          <option value="Hardware">Hardware</option>
                          <option value="F&B">Food & Beverage</option>
                          <option value="Recruiting">Recruiting / Career</option>
                          <option value="Retail">Merch / Retail</option>
                          <option value="Event">Event / Stage</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-red-500">▼</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#110505] border border-[#331111] p-4 mt-4 relative">
                    <div className="absolute top-0 left-0 bg-red-900/50 text-red-400 font-pixel text-[6px] px-2 py-1 -mt-2 ml-4 flex items-center gap-1">
                      <MapPin size={8}/> MAP_LOCATION_OBJ
                    </div>
                    <p className="font-console text-gray-500 text-sm mb-4 pt-2">Enter grid coordinates for telemetry tracking (0-1000).</p>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="font-pixel text-[8px] text-gray-500 mb-2 block flex items-center gap-1">X_COORD <Crosshair size={10}/></label>
                        <input 
                          required
                          type="number" 
                          placeholder="120"
                          className="cyber-input !border-[#220a0a] focus:!border-red-500"
                          value={sponsorData.x_coord}
                          onChange={(e) => setSponsorData({...sponsorData, x_coord: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="font-pixel text-[8px] text-gray-500 mb-2 block flex items-center gap-1">Y_COORD <Crosshair size={10}/></label>
                        <input 
                          required
                          type="number" 
                          placeholder="450"
                          className="cyber-input !border-[#220a0a] focus:!border-red-500"
                          value={sponsorData.y_coord}
                          onChange={(e) => setSponsorData({...sponsorData, y_coord: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-6 border-t border-[#331111]">
                <button type="submit" className="cyber-button w-full py-4 font-pixel text-xs flex justify-center items-center gap-3">
                  <Database size={16} /> INITIALIZE_RECORD
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="mt-8 font-console text-gray-600 text-sm relative z-10 flex gap-4">
         <span>SECURE_CONNECTION</span>
         <span className="text-red-500">● ENCRYPTED</span>
      </div>
    </div>
  );
}