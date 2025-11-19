
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Github, Anchor, Radio, Power, Shield, User, Lock, Unlock, Key } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface SidebarProps {
  onClear: () => void;
  nodeStates: Record<string, 'connected' | 'working' | 'disconnected'>;
  activeChannel: string;
  onChannelChange: (ch: string) => void;
  isMonitoring: boolean;
  onMonitoringToggle: () => void;
  userProfile: UserProfile;
  onRoleChange: (role: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onClear, 
  nodeStates, 
  activeChannel, 
  onChannelChange, 
  isMonitoring, 
  onMonitoringToggle,
  userProfile,
  onRoleChange
}) => {
  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(240); 
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth > 180 && newWidth < 400) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Core nodes definition
  const coreNodes = [
    { id: 'ada.vhf', label: 'VHF' },
    { id: 'ada.sea', label: 'SEA' },
    { id: 'ada.marina', label: 'MARINA' },
    { id: 'ada.finance', label: 'FINANCE' },
    { id: 'ada.customer', label: 'CUSTOMER (CRM)' },
    { id: 'ada.passkit', label: 'PASS (IAM)' },
    { id: 'ada.legal', label: 'LEGAL (HUKUK)' },
    { id: 'ada.security', label: 'SECURITY (MARSHALL)' },
    { id: 'ada.weather', label: 'WX' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]';
      case 'disconnected': return 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      case 'connected': default: return 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]';
    }
  };

  const channels = ['16', '73', '12', '13', '14', '69', '06', 'SCAN'];
  const restrictedChannels = ['12', '13', '14']; // Only for GM

  return (
    <div 
      className="hidden md:flex flex-col h-full bg-zinc-950 border-r border-zinc-900 font-mono relative flex-shrink-0"
      style={{ width: sidebarWidth }}
    >
      {/* Resize Handle */}
      <div 
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-500 transition-colors z-50 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
        onMouseDown={startResizing}
      />

      {/* Header */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/50 select-none">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Anchor className="text-white" size={20} />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight text-white leading-none whitespace-nowrap">Ada</h1>
            <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase whitespace-nowrap">Orchestrator</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between bg-zinc-900/80 rounded px-2 py-1.5 border border-zinc-800 mb-4">
          <span className="text-[10px] text-zinc-500 uppercase">Tenant</span>
          <span className="text-[11px] text-indigo-400 font-semibold truncate ml-2">wim.ada.network</span>
        </div>

        {/* Vertical Node List Status */}
        <div className="space-y-1">
          {coreNodes.map((node) => (
            <div key={node.id} className="flex items-center justify-start gap-3 group cursor-default p-1.5 hover:bg-zinc-900/50 rounded-md transition-colors">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300 ${getStatusColor(nodeStates[node.id] || 'connected')}`} />
              <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${
                nodeStates[node.id] === 'working' ? 'text-yellow-200' :
                nodeStates[node.id] === 'disconnected' ? 'text-red-400' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}>
                {node.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Identity / Auth Terminal (ada.passkit) */}
      <div className="px-3 pb-3">
          <div className={`rounded-lg border p-3 transition-all duration-500 ${
              userProfile.role === 'GENERAL_MANAGER' 
              ? 'bg-indigo-950/30 border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.1)]' 
              : 'bg-zinc-900/50 border-zinc-800'
          }`}>
             <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                 <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <Shield size={10} /> Security Clearance
                 </span>
                 <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                     userProfile.role === 'GENERAL_MANAGER' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800 text-zinc-500'
                 }`}>
                    LVL {userProfile.clearanceLevel}
                 </span>
             </div>
             
             <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    userProfile.role === 'GENERAL_MANAGER' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-zinc-800 text-zinc-600'
                }`}>
                    {userProfile.role === 'GENERAL_MANAGER' ? <Unlock size={18} /> : <Lock size={18} />}
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className={`text-xs font-bold truncate ${userProfile.role === 'GENERAL_MANAGER' ? 'text-white' : 'text-zinc-400'}`}>
                        {userProfile.name}
                    </span>
                    <span className="text-[9px] text-zinc-500 truncate font-mono">
                        {userProfile.role === 'GENERAL_MANAGER' ? 'ID: GM-8821-X' : 'ID: PUBLIC-GUEST'}
                    </span>
                </div>
             </div>

             {/* Passkit Slot */}
             <div className="flex flex-col gap-1.5">
                {userProfile.role === 'GENERAL_MANAGER' ? (
                    <button 
                       onClick={() => onRoleChange('GUEST')}
                       className="flex items-center justify-center gap-2 w-full text-[10px] py-2 rounded border bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all uppercase font-bold tracking-wide"
                    >
                       <Lock size={10} /> Terminate Session
                    </button>
                ) : (
                    <button 
                       onClick={() => onRoleChange('GENERAL_MANAGER')}
                       className="flex items-center justify-center gap-2 w-full text-[10px] py-2 rounded border bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-indigo-500/30 hover:text-indigo-300 transition-all uppercase font-bold tracking-wide group"
                    >
                       <Key size={10} className="group-hover:text-indigo-400" /> Insert Passkit
                    </button>
                )}
             </div>
          </div>
      </div>
      
      {/* VHF Control Panel */}
      <div className="px-3 pb-3">
        <div className="bg-black/40 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <Radio size={12} className={isMonitoring ? "text-green-400 animate-pulse" : "text-zinc-600"} />
               <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase whitespace-nowrap">VHF Control</span>
             </div>
             <button 
               onClick={onMonitoringToggle}
               className={`p-1 rounded-full transition-all ${isMonitoring ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20' : 'text-red-400 bg-red-400/10 hover:bg-red-400/20'}`}
               title={isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
             >
               <Power size={12} />
             </button>
          </div>
          
          <div className="grid grid-cols-4 gap-1.5">
             {channels.map(ch => {
               const isRestricted = restrictedChannels.includes(ch) && userProfile.role !== 'GENERAL_MANAGER';
               return (
                <button
                  key={ch}
                  disabled={!isMonitoring || isRestricted}
                  onClick={() => onChannelChange(ch)}
                  className={`text-[10px] font-mono py-1.5 rounded border transition-all relative group ${
                      activeChannel === ch 
                      ? 'bg-indigo-600/80 border-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                  } ${restrictedChannels.includes(ch) ? 'border-l-2 border-l-yellow-500/50' : ''} ${(!isMonitoring || isRestricted) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isRestricted ? <Lock size={8} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-600" /> : ch}
                  
                  {/* Operational Dot for Internal Channels */}
                  {restrictedChannels.includes(ch) && activeChannel !== ch && !isRestricted && (
                      <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-yellow-500 rounded-full opacity-50"></span>
                  )}
                </button>
               );
             })}
          </div>
        </div>
      </div>

      {/* Reset Session Button */}
      <div className="p-3 border-t border-zinc-900">
        <button 
          onClick={onClear}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2 rounded transition-all text-xs uppercase font-medium tracking-wide whitespace-nowrap"
        >
          <Plus size={14} />
          Reset Session
        </button>
        <div className="mt-3 text-center">
            <a 
            href="https://github.com/ahmetengin/Ada" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
            <Github size={12} />
            <span className="whitespace-nowrap">v2.5.0</span>
            </a>
        </div>
      </div>
    </div>
  );
};
