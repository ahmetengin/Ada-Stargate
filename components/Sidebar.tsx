
import React, { useState, useCallback, useEffect } from 'react';
import { Anchor, Radio } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface SidebarProps {
  nodeStates: Record<string, 'connected' | 'working' | 'disconnected'>;
  activeChannel: string;
  onChannelChange: (ch: string) => void;
  isMonitoring: boolean;
  onMonitoringToggle: () => void;
  userProfile: UserProfile;
  onRoleChange: (role: UserRole) => void;
  onNodeClick: (nodeId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  nodeStates, 
  activeChannel,
  onChannelChange,
  isMonitoring,
  onMonitoringToggle,
  userProfile,
  onRoleChange,
  onNodeClick 
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
    { id: 'ada.marina', label: 'MARINA' },
    { id: 'ada.vhf', label: 'VHF' },
    { id: 'ada.sea', label: 'SEA' },
    { id: 'ada.technic', label: 'TECHNIC' },
    { id: 'ada.finance', label: 'FINANCE' },
    { id: 'ada.customer', label: 'CUSTOMER' },
    { id: 'ada.passkit', label: 'PASSKIT' },
    { id: 'ada.legal', label: 'LEGAL' },
    { id: 'ada.security', label: 'SECURITY' },
    { id: 'ada.weather', label: 'WX' },
  ];

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      case 'connected': default: return 'bg-emerald-500';
    }
  };

  return (
    <div 
      className="hidden md:flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-900 font-mono relative flex-shrink-0 select-none transition-colors duration-300"
      style={{ width: sidebarWidth }}
    >
      {/* Resize Handle */}
      <div 
        className={`absolute top-0 right-0 w-[2px] h-full cursor-col-resize hover:bg-indigo-500/50 transition-colors z-50 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
        onMouseDown={startResizing}
      />

      {/* Header */}
      <div className="p-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-600">
            <Anchor size={16} />
            <span className="font-bold tracking-[0.2em] text-xs uppercase">Ada Explorer</span>
        </div>
      </div>

      {/* Context Label */}
      <div className="px-6 pb-6">
          <div className="text-[9px] text-indigo-500 dark:text-indigo-400/70 font-bold font-mono tracking-widest">
            wim.ada.network
          </div>
      </div>

      {/* Vertical Node List (Ultra Flat) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6">
        <div className="py-2 space-y-3">
            {coreNodes.map((node) => (
              <button 
                key={node.id} 
                onClick={() => onNodeClick(node.id)}
                className="w-full flex items-center justify-start gap-4 group cursor-pointer transition-all text-left"
              >
                {/* Minimal Status Dot */}
                <div className={`w-1 h-1 rounded-full flex-shrink-0 transition-all duration-300 group-hover:scale-125 ${getStatusDotColor(nodeStates[node.id] || 'connected')}`} />
                
                <span className={`text-[10px] tracking-widest uppercase transition-all duration-300 ${
                  nodeStates[node.id] === 'working' ? 'text-yellow-600 dark:text-yellow-200' :
                  nodeStates[node.id] === 'disconnected' ? 'text-red-600 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
                }`}>
                  {node.label}
                </span>
              </button>
            ))}
        </div>

        {/* RBAC Mode */}
        <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-900/50">
            <div className="text-[9px] font-bold text-zinc-300 dark:text-zinc-700 uppercase mb-4 tracking-[0.2em]">
                IDENTITY
            </div>
            <div className="space-y-3">
                {(['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'] as UserRole[]).map(role => {
                    const isActive = userProfile.role === role;
                    return (
                        <button
                            key={role}
                            onClick={() => onRoleChange(role)}
                            className={`w-full text-left text-[9px] transition-all flex items-center justify-between group uppercase tracking-wide ${
                                isActive
                                ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
                                : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400'
                            }`}
                        >
                            {role.replace('_', ' ')}
                            {isActive && <div className="w-1 h-1 bg-indigo-500 rounded-full" />}
                        </button>
                    )
                })}
            </div>
        </div>
      </div>

      {/* VHF Control Panel (Super Compact Bottom Bar) */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-900/50">
          <div className="flex items-center justify-between text-[9px]">
              <div className="flex items-center gap-2 text-zinc-500">
                   <button onClick={onMonitoringToggle} className={`transition-colors text-red-500 ${isMonitoring ? 'animate-pulse' : ''}`}>
                      <Radio size={12} />
                  </button>
                  <span className="font-bold tracking-widest">VHF</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-zinc-400">
                  {['16', '72', '69', '13', '14', 'SCAN'].map((ch, idx, arr) => (
                      <React.Fragment key={ch}>
                          <button 
                              onClick={() => ch === 'SCAN' ? null : onChannelChange(ch)}
                              className={`hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors ${
                                  activeChannel === ch ? 'text-indigo-500 font-bold' : 
                                  ch === 'SCAN' ? 'text-amber-600 dark:text-amber-500' : ''
                              }`}
                          >
                              {ch}
                          </button>
                          {idx < arr.length - 1 && <span className="text-zinc-200 dark:text-zinc-800">|</span>}
                      </React.Fragment>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};
