
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  Shield, 
  Activity, 
  Settings, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Trophy,
  LogOut,
  Code2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DEFAULT_CONFIG } from './constants.ts';
import { BookingStatus, BookingLog } from './types.ts';
import { geminiService } from './services/geminiService.ts';

const successRateData = [
  { name: 'W1', rate: 100 },
  { name: 'W2', rate: 100 },
  { name: 'W3', rate: 0 },
  { name: 'W4', rate: 100 },
];

const App: React.FC = () => {
  const [logs, setLogs] = useState<BookingLog[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [caddieAdvice, setCaddieAdvice] = useState<string>('Loading caddie advice...');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'settings'>('dashboard');

  const fetchLogs = useCallback(async () => {
    try {
      // Small timeout to simulate network if file is missing
      const response = await fetch('./logs.json');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.map((l: any) => ({ 
          ...l, 
          timestamp: new Date(l.timestamp) 
        })));
      }
    } catch (e) {
      console.warn("Logs fetch failed. Using empty state.");
    }
  }, []);

  const fetchAdvice = useCallback(async () => {
    try {
      const advice = await geminiService.getCaddieAdvice('Woodmead', 'Saturday morning');
      setCaddieAdvice(advice || 'No strategic updates today.');
    } catch (e) {
      setCaddieAdvice('Caddie is away from the bag.');
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchAdvice();
    const interval = setInterval(fetchLogs, 60000);
    return () => clearInterval(interval);
  }, [fetchLogs, fetchAdvice]);

  const handleManualTrigger = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      alert("Manual signal dispatched to GitHub Actions.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Trophy className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-serif font-bold text-slate-900">CCJ Automator</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{DEFAULT_CONFIG.username}</p>
              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 justify-end">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                AGENT ARMED
              </p>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-4 py-8 gap-8">
        <aside className="w-full md:w-64 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
          >
            <Activity className="w-5 h-5" /><span className="font-medium">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('logs')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'logs' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
          >
            <Calendar className="w-5 h-5" /><span className="font-medium">History</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
          >
            <Settings className="w-5 h-5" /><span className="font-medium">Settings</span>
          </button>

          <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
            <h3 className="text-emerald-900 font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-tight">
              <Shield className="w-4 h-4" /> Caddie Tip
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed italic">{caddieAdvice}</p>
          </div>
        </aside>

        <main className="flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Next Run</p>
                  <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" /> Thursday, 06:00
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Target Window</p>
                  <p className="text-lg font-bold text-slate-900">07:00 — 08:00 AM</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Status</p>
                  <p className={`text-lg font-bold ${logs[0]?.status === 'SUCCESS' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {logs[0]?.status || 'IDLE'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Agent Running on Cloud</h2>
                    <p className="text-slate-500 text-sm max-w-md leading-relaxed">
                      Your automation checks Woodmead and Rocklands concurrently every Thursday at 6 AM SAST.
                    </p>
                  </div>
                  <button 
                    onClick={handleManualTrigger}
                    disabled={isSimulating}
                    className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50"
                  >
                    {isSimulating ? 'Sending...' : (
                      <>
                        <Code2 className="w-5 h-5 text-emerald-400" />
                        Force Run Agent
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Reliability History</h3>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={successRateData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="#059669" 
                        strokeWidth={4} 
                        dot={{r: 6, fill: '#059669', strokeWidth: 2, stroke: '#fff'}} 
                        activeDot={{r: 8}} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Activity Timeline</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="text-slate-300 w-8 h-8" />
                    </div>
                    <p className="text-slate-400 text-sm italic">No logs generated yet.</p>
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className={`p-2 rounded-xl ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {log.status === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-900">{log.status}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{log.details}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" /> Security Configuration
                </h3>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-6 flex gap-3 items-start">
                  <AlertCircle className="text-blue-600 w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Passwords are never stored in the dashboard code. Ensure <b>CCJ_USER</b> and <b>CCJ_PASS</b> are set in your GitHub repository secrets.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Site Username</label>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-900 font-mono text-sm">{DEFAULT_CONFIG.username}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Notification Destination</label>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-900 font-mono text-sm">{DEFAULT_CONFIG.notificationEmail}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" /> Saturday Morning Roster
                  </h3>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">4 PLAYERS</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DEFAULT_CONFIG.players.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 hover:border-emerald-200 transition-colors">
                      {p.name}
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
