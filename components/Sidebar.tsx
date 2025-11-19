
import React, { useState, useCallback, useEffect } from 'react';
import { Anchor, Radio, Power, Lock } from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  nodeStates: Record<string, 'connected' | 'working' | 'disconnected'>;
  activeChannel: string;
  onChannelChange: (ch: string) => void;
  isMonitoring: boolean;
  onMonitoringToggle: () => void;
  userProfile: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  nodeStates, 
  activeChannel, 
  onChannelChange, 
  isMonitoring, 
  onMonitoringToggle,
  userProfile
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
    { id: 'ada.customer', label: 'CUSTOMER' },
    { id: 'ada.passkit', label: 'PASSKIT' },
    { id: 'ada.legal', label: 'LEGAL' },
    { id: 'ada.security', label: 'SECURITY' },
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
          <div className="text-[9px] font-bold text-zinc-500 uppercase mb-2 pl-1 tracking-wider">Running Processes</div>
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
                <span className="text-[9px] font-bold text-zinc-400">RX/TX</span>
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
                const isRestricted = restrictedChannels.includes(ch) && userProfile.role !== 'GENERAL_MANAGER';
                return (
                    <button
                    key={ch}
                    disabled={!isMonitoring || isRestricted}
                    onClick={() => onChannelChange(ch)}
                    className={`text-[9px] font-mono py-1.5 rounded border transition-all relative flex items-center justify-center ${
                        activeChannel === ch 
                        ? 'bg-indigo-600 text-white border-indigo-500' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                    } ${restrictedChannels.includes(ch) ? 'border-l-2 border-l-yellow-500/20' : ''} ${(!isMonitoring || isRestricted) ? 'opacity-40' : ''}`}
                    >
                    {isRestricted ? <Lock size={8} /> : ch}
                    </button>
                );
                })}
            </div>
            </div>
        </div>
      </div>
      
    </div>
  );
};
