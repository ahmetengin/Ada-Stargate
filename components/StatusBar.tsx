import React from 'react';
import { GitBranch, RefreshCw, Wifi, Radio, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface StatusBarProps {
  userProfile: UserProfile;
  onToggleAuth: () => void;
  nodeHealth: string; // 'operational' | 'degraded'
  latency: number;
  activeChannel: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  userProfile, 
  onToggleAuth, 
  nodeHealth, 
  latency,
  activeChannel
}) => {
  const isGM = userProfile.role === 'GENERAL_MANAGER';
  const isLegalRed = userProfile.legalStatus === 'RED';

  return (
    <div className="h-6 w-full flex items-center justify-between px-2 select-none font-mono text-[10px] bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 text-zinc-500 z-50 transition-colors duration-300">
      
      {/* LEFT: System Info */}
      <div className="flex items-center h-full gap-4">
        <div className="flex items-center gap-1.5 hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-colors">
          <GitBranch size={10} />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {/* Green dot for wim/main status */}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">wim/main</span>
        </div>
        
        <div className="flex items-center gap-1.5 hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-colors">
           <RefreshCw size={10} className={nodeHealth === 'working' ? 'animate-spin' : ''} />
           <span>v2.5.0</span>
        </div>
      </div>

      {/* RIGHT: Metrics & User */}
      <div className="flex items-center h-full">
        
        {/* Channel Indicator */}
        <div className="flex items-center gap-1.5 px-3 h-full border-l border-zinc-200 dark:border-zinc-900/50">
           <Radio size={10} className={activeChannel === '16' ? 'text-red-500' : ''}/>
           <span className={activeChannel === '16' ? 'text-red-500 dark:text-red-400 font-bold' : ''}>
              CH {activeChannel}
           </span>
        </div>

        {/* Latency */}
        <div className="hidden md:flex items-center gap-1.5 px-3 h-full border-l border-zinc-200 dark:border-zinc-900/50 min-w-[60px]">
           <Wifi size={10} />
           <span>{latency}ms</span>
        </div>

        {/* Auth Trigger */}
         <button 
           onClick={onToggleAuth}
           className={`flex items-center gap-2 px-3 h-full border-l border-zinc-200 dark:border-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all uppercase font-bold tracking-wider ${
             isLegalRed ? 'text-red-500' : isGM ? 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
           }`}
           title={isGM ? "Click to Logout" : "Click to Login"}
         >
            {isGM ? userProfile.name : "LOGIN"}
         </button>

        {/* Notifications */}
        <div className="flex items-center gap-1.5 px-3 h-full border-l border-zinc-200 dark:border-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">
           <AlertCircle size={10} className={isLegalRed ? 'text-red-500 animate-pulse' : ''} />
        </div>
      </div>
    </div>
  );
};