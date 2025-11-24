
import React from 'react';
import { Car, CheckCircle2, Zap, Utensils, Calendar, Wind, PartyPopper } from 'lucide-react';
import { UserProfile } from '../../types';
import { wimMasterData } from '../../services/wimMasterData';

interface GuestDashboardProps {
  userProfile: UserProfile;
}

export const GuestDashboard: React.FC<GuestDashboardProps> = ({ userProfile }) => {
  const upcomingEvents = wimMasterData.event_calendar || [];

  return (
    <div className="space-y-6 font-sans text-zinc-800 dark:text-zinc-200 p-4 animate-in fade-in slide-in-from-right-4 duration-500">
        {/* Welcome & Status */}
        <div className="flex items-center justify-between">
            <div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Welcome Back</div>
                <div className="text-xl font-bold">{userProfile.name}</div>
            </div>
            <div className="text-right">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Membership</div>
                <div className="text-sm font-bold text-indigo-500">PLATINUM</div>
            </div>
        </div>

        {/* ISPARK Validation Widget */}
        <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-between items-start mb-3">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Car size={12} /> MY GARAGE (ISPARK INTEGRATION)
                </div>
                <div className="bg-emerald-500/10 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                    ACTIVE
                </div>
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer ring-1 ring-indigo-500">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="font-mono font-bold">34 XX 99</span>
                        <span className="text-xs text-zinc-500">Porsche 911</span>
                    </div>
                    <CheckCircle2 size={14} className="text-indigo-500"/>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 opacity-60">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-zinc-300 rounded-full"></div>
                        <span className="font-mono font-bold">34 AA 01</span>
                        <span className="text-xs text-zinc-500">Range Rover</span>
                    </div>
                </div>
            </div>

            <button className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                <Zap size={12} /> Validate Exit (Free)
            </button>
        </div>

        {/* Active Dining Reservation */}
        <div className="bg-zinc-900 text-white p-4 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Utensils size={64} />
            </div>
            <div className="relative z-10">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Utensils size={12} /> DINING RESERVATION
                </div>
                <div className="text-lg font-bold text-white mb-1">Poem Restaurant</div>
                <div className="flex justify-between text-xs text-zinc-300 mb-3">
                    <span>Today, 19:30</span>
                    <span>4 Guests</span>
                </div>
                <div className="bg-white/10 p-2 rounded border border-white/10 text-[10px] space-y-1">
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Pre-Order:</span>
                        <span className="text-emerald-400">Sea Bass x2</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Kitchen Status:</span>
                        <span className="text-yellow-400 animate-pulse">PREPARING</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Event Calendar */}
        <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Calendar size={12} /> Upcoming Events
            </h3>
            <div className="space-y-2">
                {upcomingEvents.map((evt: any) => (
                    <div key={evt.id} className="flex gap-3 p-3 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-indigo-500/50 transition-colors cursor-pointer">
                        <div className="flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-700 rounded p-2 min-w-[50px]">
                            <span className="text-xs font-bold text-zinc-500 uppercase">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{new Date(evt.date).getDate()}</span>
                        </div>
                        <div>
                            <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{evt.name}</div>
                            <div className="text-[10px] text-zinc-500 uppercase mt-1 flex items-center gap-1">
                                {evt.type === 'Race' ? <Wind size={10}/> : <PartyPopper size={10}/>}
                                {evt.type} • {evt.location || 'Marina'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
