
import React from 'react';
import { AlertTriangle, ShieldAlert, Target, Lock } from 'lucide-react';

export const BreachRadar: React.FC = () => {
  const breaches = [
    { id: 'BR-01', vessel: 'Speedboat X', issue: 'Restricted Zone', severity: 'CRITICAL', time: '10:42' },
    { id: 'BR-02', vessel: 'S/Y Mistral', issue: 'Overstay (48h)', severity: 'MEDIUM', time: '09:15' },
    { id: 'BR-03', vessel: 'JetSki-04', issue: 'Speeding (8kn)', severity: 'HIGH', time: '11:05' },
  ];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden animate-in fade-in duration-500 delay-100">
        <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} className="animate-pulse" /> BREACH RADAR
            </h3>
            <div className="text-[9px] font-mono text-zinc-500">ACTIVE SCAN</div>
        </div>

        <div className="flex-1 p-4 flex flex-col items-center justify-center">
            <div className="flex items-center gap-6 w-full h-full">
                
                {/* RADAR ANIMATION */}
                <div className="relative w-24 h-24 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full border border-zinc-700 bg-zinc-900/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"></div>
                    <div className="absolute inset-[15%] rounded-full border border-zinc-800/50"></div>
                    <div className="absolute inset-[35%] rounded-full border border-zinc-800/50"></div>
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800/50"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-800/50"></div>
                    
                    {/* Scanning Line */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div className="w-1/2 h-1/2 bg-gradient-to-br from-transparent to-red-500/30 absolute top-0 left-1/2 origin-bottom-left animate-spin-slow" style={{ animationDuration: '3s' }}></div>
                    </div>

                    {/* Blips */}
                    <div className="absolute top-[20%] left-[60%] w-1.5 h-1.5 bg-red-500 rounded-full animate-ping shadow-[0_0_5px_red]"></div>
                    <div className="absolute bottom-[30%] right-[30%] w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                </div>

                {/* BREACH LIST */}
                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar h-full max-h-[140px]">
                    {breaches.map(b => (
                        <div key={b.id} className="flex items-center justify-between p-2 bg-red-950/10 border border-red-900/20 rounded text-xs hover:bg-red-900/20 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-2">
                                <div className={`p-1 rounded-full ${b.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                    {b.severity === 'CRITICAL' ? <ShieldAlert size={10} /> : <AlertTriangle size={10} />}
                                </div>
                                <div>
                                    <div className="font-bold text-zinc-300 group-hover:text-white">{b.vessel}</div>
                                    <div className="text-[9px] text-red-400 uppercase">{b.issue}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${b.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-600/20 text-amber-500'}`}>{b.severity}</div>
                                <div className="text-[9px] text-zinc-600 mt-0.5 font-mono">{b.time}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};
