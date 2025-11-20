
import React, { useState, useCallback, useEffect } from 'react';
import { Anchor, Radio, Power, Lock, RefreshCw, Users, Shield } from 'lucide-react';
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
  const restrictedChannels = ['08']; // Military/Coast Guard only

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
      <div className="p-3 border-b border-zinc-900 bg-zinc-950/50 select-none">
        <div className="flex items-center gap-2 mb-3 text-zinc-300">
            <Anchor size={16} />
            <span className="font-bold tracking-tight text-xs uppercase">Ada Explorer</span>
        </div>
        
        <div className="flex items-center justify-between bg-zinc-900/50 rounded px-2 py-1.5 border border-zinc-800 mb-2">
          <span className="text-[9px] text-zinc-500 uppercase">Context</span>
          <span className="text-[10px] text-indigo-400 font-semibold truncate ml-2">wim.ada.network</span>
        </div>
      </div>

      {/* Vertical Node List (Explorer Style) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 py-2">
          <div className="text-[9px] font-bold text-zinc-500 uppercase mb-2 pl-1 tracking-wider">Distributed Nodes</div>
          <div className="space-y-0.5">
            {coreNodes.map((node) => (
              <div key={node.id} className="flex items-center justify-start gap-3 group cursor-default px-2 py-1.5 hover:bg-zinc-900 rounded transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300 ${getStatusColor(nodeStates[node.id] || 'connected')}`} />
                <span className={`text-[10px] font-medium tracking-tight transition-colors duration-300 ${
                  nodeStates[node.id] === 'working' ? 'text-yellow-200' :
                  nodeStates[node.id] === 'disconnected' ? 'text-red-400' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}>
                  {node.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* VHF Control Panel */}
        <div className="px-3 py-2 mt-2">
            <div className="text-[9px] font-bold text-zinc-500 uppercase mb-2 pl-1 tracking-wider">VHF Controller</div>
            <div className="bg-black/20 border border-zinc-800/50 rounded-lg p-2">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                <Radio size={10} className={isMonitoring ? "text-green-400 animate-pulse" : "text-zinc-600"} />
                <span className="text-[9px] font-bold text-zinc-400">RX/TX {activeChannel}</span>
                </div>
                <button 
                onClick={onMonitoringToggle}
                className={`p-1 rounded hover:bg-zinc-800 transition-all ${isMonitoring ? 'text-green-400' : 'text-red-400'}`}
                title={isMonitoring ? "Power Off" : "Power On"}
                >
                <Power size={10} />
                </button>
            </div>
            
            <div className="grid grid-cols-4 gap-1">
                {channels.map(ch => {
                    return (
                        <button
                        key={ch}
                        disabled={!isMonitoring}
                        onClick={() => onChannelChange(ch)}
                        className={`text-[9px] font-mono py-1.5 rounded border transition-all relative flex items-center justify-center ${
                            activeChannel === ch 
                            ? 'bg-indigo-600 text-white border-indigo-500' 
                            : ch === 'SCAN' ? 'bg-zinc-800 text-yellow-400 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                        } ${!isMonitoring ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                        {ch}
                        </button>
                    );
                })}
            </div>
            </div>
        </div>

        {/* Authentication Simulator (Dev Tools) */}
        <div className="px-3 py-2 mt-4 border-t border-zinc-900/50">
            <div className="text-[9px] font-bold text-zinc-500 uppercase mb-2 pl-1 tracking-wider flex items-center gap-2">
                <Shield size={10} /> Access Control (RBAC)
            </div>
            <div className="space-y-1">
                {(['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'] as UserRole[]).map(role => (
                    <button
                        key={role}
                        onClick={() => onRoleChange(role)}
                        className={`w-full text-left px-2 py-1.5 text-[9px] rounded border transition-colors flex items-center justify-between ${
                            userProfile.role === role 
                            ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-200' 
                            : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-900'
                        }`}
                    >
                        {role.replace('_', ' ')}
                        {userProfile.role === role && <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />}
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
