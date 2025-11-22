import React from 'react';
import { GitBranch, RefreshCw, Wifi, AlertCircle, User, HardDrive } from 'lucide-react';
import { UserProfile } from '../types';

interface StatusBarProps {
  userProfile: UserProfile;
  onToggleAuth: () => void;
  nodeHealth: string;
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

  const Item = ({ children, border = true, hover = true }: { children: React.ReactNode, border?: boolean, hover?: boolean }) => (
    <div className={`flex items-center h-full gap-2 px-3 ${border ? 'border-r border-border-light dark:border-border-dark' : ''} ${hover ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer' : ''}`}>
        {children}
    </div>
  )

  return (
    <div className="h-7 w-full flex items-center justify-between select-none font-mono text-xs bg-panel-light dark:bg-panel-dark border-t border-border-light dark:border-border-dark text-zinc-500 dark:text-zinc-400 z-50 transition-colors duration-300">
      
      {/* LEFT: System Info */}
      <div className="flex items-center h-full">
        <Item border={true}>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">wim/main</span>
          <GitBranch size={12} />
        </Item>
        
        <Item border={true}>
           <RefreshCw size={12} className={nodeHealth === 'working' ? 'animate-spin' : ''} />
           <span>v3.2.0</span>
        </Item>

        <Item border={false} hover={false}>
            <span className="text-zinc-400 dark:text-zinc-600">VHF</span>
            <span className="text-indigo-500 font-bold">CH {activeChannel}</span>
        </Item>
      </div>

      {/* RIGHT: Metrics & User */}
      <div className="flex items-center h-full">
        
        {/* Latency */}
        <Item border={true}>
           <span>{latency}ms</span>
           <Wifi size={12} />
        </Item>
        
        <Item border={true}>
           <HardDrive size={12} />
           <span>OK</span>
        </Item>

        {/* Auth Trigger */}
         <button 
           onClick={onToggleAuth}
           className={`flex items-center gap-2 px-3 h-full border-r border-border-light dark:border-border-dark hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all uppercase font-bold tracking-wider ${
             isLegalRed ? 'text-red-500 bg-red-500/10' : isGM ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'
           }`}
           title="Switch Identity"
         >
            <User size={12} />
            <span>{userProfile.name}</span>
         </button>

        {/* Notifications */}
        <Item border={false}>
           <AlertCircle size={12} className={isLegalRed ? 'text-red-500 animate-pulse' : 'text-zinc-500 dark:text-zinc-400'} />
        </Item>

      </div>
    </div>
  );
};