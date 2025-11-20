
import React, { useState, useCallback, useEffect } from 'react';
import { Anchor, Radio, Power, Shield } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface SidebarProps {
  nodeStates: Record<string, 'connected' | 'working' | 'disconnected'>;
  activeChannel: string;
  onChannelChange: (ch: string) => void;
  isMonitoring: boolean;
  onMonitoringToggle: () => void;
  userProfile: UserProfile;
  onRoleChange: (role: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
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
    { id: 'ada.sea', label: 'SEA (COLREGs)' },
    { id: 'ada.marina', label: 'MARINA (Orch)' },
    { id: 'ada.finance', label: 'FINANCE (Paraşüt)' },
    { id: 'ada.customer', label: 'CUSTOMER (CRM)' },
    { id: 'ada.passkit', label: 'PASSKIT (Wallet)' },
    { id: 'ada.legal', label: 'LEGAL (RAG)' },
    { id: 'ada.security', label: 'SECURITY' },
    { id: 'ada.weather', label: 'WX (Forecast)' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]';
      case 'disconnected': return 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      case 'connected': default: return 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]';
    }
  };

  // Updated Channel List
  const channels = ['16', '73', '69', '06', '12', '13', '14', 'SCAN'];

  return (
    <div 
      className="hidden md:flex flex-col h-full bg-zinc-950 font-mono relative flex-shrink-0 select-none"
      style={{ width: sidebarWidth }}
    >
      {/* Resize Handle */}
      <div 
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-500/20 transition-colors z-50 ${isResizing ? 'bg-indigo-500/20' : 'bg-transparent'}`}
        onMouseDown={startResizing}
      />

      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2 mb-4 text-zinc-500">
            <Anchor size={14} />
            <span className="font-bold tracking-widest text-[10px] uppercase">Ada Explorer</span>
        </div>
        
        <div className="flex items-center justify-between rounded px-2 py-1 bg-zinc-900/30">
          <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Context</span>
          <span className="text-[9px] text-indigo-400 font-bold font-mono">wim.ada.network</span>
        </div>
      </div>

      {/* Vertical Node List (Explorer Style) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
        <div className="py-2">
          <div className="space-y-1">
            {coreNodes.map((node) => (
              <div key={node.id} className="flex items-center justify-start gap-3 group cursor-default px-3 py-1.5 rounded hover:bg-zinc-900/30 transition-colors">
                <div className={`w-1 h-1 rounded-full flex-shrink-0 transition-all duration-300 ${getStatusColor(nodeStates[node.id] || 'connected')}`} />
                <span className={`text-[10px] font-medium tracking-tight transition-colors duration-300 ${
                  nodeStates[node.id] === 'working' ? 'text-yellow-200' :
                  nodeStates[node.id] === 'disconnected' ? 'text-red-400' : 'text-zinc-500 group-hover:text-zinc-300'
                }`}>
                  {node.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* VHF Control Panel - Flat Design */}
        <div className="mt-6 px-2">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <Radio size={12} className={isMonitoring ? "text-green-400 animate-pulse" : "text-zinc-700"} />
                    <span className="text-[9px] font-bold text-zinc-500 tracking-wider">VHF CONTROL</span>
                </div>
                <button 
                    onClick={onMonitoringToggle}
                    className={`transition-all ${isMonitoring ? 'text-green-400 drop-shadow-[0_0_3px_rgba(74,222,128,0.5)]' : 'text-zinc-700 hover:text-red-400'}`}
                    title={isMonitoring ? "Power Off" : "Power On"}
                >
                    <Power size={12} />
                </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 p-1">
                {channels.map(ch => {
                    const isActive = activeChannel === ch;
                    return (
                        <button
                        key={ch}
                        disabled={!isMonitoring}
                        onClick={() => onChannelChange(ch)}
                        className={`text-[10px] font-mono py-2 rounded transition-all flex items-center justify-center
                        ${isActive 
                            ? 'text-indigo-400 font-bold shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
                            : ch === 'SCAN' 
                                ? 'text-yellow-600 hover:text-yellow-400' 
                                : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/30'
                        } 
                        ${!isMonitoring ? 'opacity-20 cursor-not-allowed' : ''}`}
                        >
                        {ch}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Authentication Simulator (Dev Tools) - Flat Design */}
        <div className="mt-8 px-2">
            <div className="text-[9px] font-bold text-zinc-600 uppercase mb-3 pl-1 tracking-wider flex items-center gap-2">
                <Shield size={10} /> RBAC Mode
            </div>
            <div className="space-y-0.5">
                {(['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'] as UserRole[]).map(role => {
                    const isActive = userProfile.role === role;
                    return (
                        <button
                            key={role}
                            onClick={() => onRoleChange(role)}
                            className={`w-full text-left px-3 py-2 text-[9px] rounded transition-all flex items-center justify-between group ${
                                isActive
                                ? 'text-indigo-400 font-bold bg-indigo-500/5' 
                                : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/30'
                            }`}
                        >
                            {role.replace('_', ' ')}
                            {isActive && <div className="w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_5px_rgba(99,102,241,0.8)]" />}
                        </button>
                    )
                })}
            </div>
        </div>
      </div>
    </div>
  );
};
