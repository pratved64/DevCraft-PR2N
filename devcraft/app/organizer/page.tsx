"use client";

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Server, Wifi } from 'lucide-react';
import { fetchStats, fetchAlerts, openHeatmapSocket, type Stats, type Alert } from '../../lib/api';

export default function OrganizerPage() {
  const [stallLeaderboard, setStallLeaderboard] = useState<{ name: string, scans: number, status: string }[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // 1. Fetch stats — top_stalls gives us total historical scan counts
    fetchStats()
      .then((s) => {
        setStats(s);
        if (s.top_stalls && s.top_stalls.length > 0) {
          const mapped = s.top_stalls.map((t) => ({
            name: t.company_name,
            scans: t.scan_count,
            status: t.scan_count === 0 ? 'No Scans Yet' : 'Active',
          }));
          setStallLeaderboard(mapped);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // 2. Fetch fraud / security alerts
    fetchAlerts()
      .then(setFraudAlerts)
      .catch(console.error);

    // 3. WebSocket for Live Heatmap — updates leaderboard in real time
    const ws = openHeatmapSocket((data) => {
      setWsConnected(true);
      if (data.heatmap && data.heatmap.length > 0) {
        const updated = data.heatmap
          .map((h: any) => ({
            name: h.stall_name,
            scans: h.scan_count,   // all-time total from WS (patched backend)
            status: h.crowd_level === 'Low' ? 'Low Traffic' : 'Active',
          }))
          .sort((a: any, b: any) => b.scans - a.scans);
        setStallLeaderboard(updated);
      }
    });

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, []);

  const maxScans = stallLeaderboard.length > 0 ? Math.max(...stallLeaderboard.map(s => s.scans), 1) : 1;

  return (
    <div className="p-8 bg-gray-950 min-h-screen font-sans text-gray-100">
      <header className="mb-8 flex justify-between items-center border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="text-red-500 animate-pulse" /> "God Mode"
          </h1>
          <p className="text-gray-400 mt-1">Central Command & Logistics</p>
        </div>
        <div className="flex gap-4">
          {stats && (
            <>
              <div className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-gray-500 block uppercase tracking-wider">Attendees</span>
                  <span className="text-blue-400 text-sm font-bold">{stats.total_attendees.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-gray-500 block uppercase tracking-wider">Sponsors</span>
                  <span className="text-purple-400 text-sm font-bold">{stats.total_sponsors}</span>
                </div>
              </div>
              <div className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-gray-500 block uppercase tracking-wider">Total Scans</span>
                  <span className="text-blue-400 text-sm font-bold">{stats.total_scans.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
          <div className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full bg-green-500 animate-pulse`}></div>
            <div>
              <span className="text-xs text-gray-500 block uppercase tracking-wider">System Status</span>
              <span className="text-green-400 text-sm font-bold">Operational</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 mb-6">
        <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
        <span className="text-xs text-gray-500">{wsConnected ? 'Live WebSocket connected' : 'Connecting to live feed…'}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Leaderboard */}
        <div className="col-span-2 space-y-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
              <span className="text-blue-500">#</span> Live Stall Traffic
            </h3>
            <div className="space-y-4">
              {loading ? (
                // Skeleton rows while fetching
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg animate-pulse">
                    <div className="w-8 h-6 bg-gray-700 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                      <div className="h-1.5 bg-gray-700 rounded w-full"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-700 rounded"></div>
                  </div>
                ))
              ) : stallLeaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No stall data yet — scans will appear here in real time.</p>
                </div>
              ) : (
                stallLeaderboard.map((stall, index) => (
                  <div key={index} className="group flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition border border-transparent hover:border-gray-700">
                    <span className="text-2xl font-bold text-gray-600 w-8 group-hover:text-gray-400">#{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-bold text-gray-200">{stall.name}</h4>
                        <span className="text-sm text-gray-400 font-mono">{stall.scans.toLocaleString()} scans</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${index === 0 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-blue-600'}`}
                          style={{ width: `${Math.max((stall.scans / maxScans) * 100, stall.scans === 0 ? 0 : 3)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                        stall.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        stall.status === 'No Scans Yet' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {stall.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Side Column: Health & Fraud */}
        <div className="space-y-6">
          {/* Network Health */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Network Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 p-4 rounded-lg text-center border border-gray-800">
                <Wifi className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                <span className="block text-2xl font-bold text-white">45ms</span>
                <span className="text-xs text-gray-500">Latency</span>
              </div>
              <div className="bg-black/40 p-4 rounded-lg text-center border border-gray-800">
                <Server className="w-5 h-5 text-purple-500 mx-auto mb-2" />
                <span className="block text-2xl font-bold text-white">99.9%</span>
                <span className="text-xs text-gray-500">Sync Rate</span>
              </div>
            </div>
          </div>

          {/* Fraud Alerts */}
          <div className="bg-gray-900 rounded-xl border border-red-900/30 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
            <div className="flex items-center gap-2 mb-4 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Security Alerts</h3>
            </div>
            <div className="space-y-3">
              {fraudAlerts.map((alert) => (
                <div key={alert.id} className="bg-red-950/30 border border-red-900/30 p-3 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-red-200 text-sm">{alert.user}</span>
                    <span className="text-xs text-red-400 font-mono">{alert.time}</span>
                  </div>
                  <p className="text-xs text-red-300/80 mb-2">{alert.reason}</p>
                  <button className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 text-[10px] uppercase font-bold py-1.5 rounded transition">
                    Investigate
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}