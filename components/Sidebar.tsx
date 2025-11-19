import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Github, Anchor, Radio, Power } from 'lucide-react';

interface SidebarProps {
  onClear: () => void;
  nodeStates: Record<string, 'connected' | 'working' | 'disconnected'>;
  activeChannel: string;
  onChannelChange: (ch: string) => void;
  isMonitoring: boolean;
  onMonitoringToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onClear, 
  nodeStates, 
  activeChannel, 
  onChannelChange, 
  isMonitoring, 
  onMonitoringToggle 
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
    { id: 'ada.customer', label: 'CRM' },
    { id: 'ada.passkit', label: 'PASS' },
    { id: 'ada.legal', label: 'LEGAL' },
    { id: 'ada.weather', label: 'WX' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]';
      case 'disconnected': return 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      case 'connected': default: return 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]';
    }
  };

  const channels = ['16', '73', '06', 'SCAN'];

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
        <div className="space-y-2">
          {coreNodes.map((node) => (
            <div key={node.id} className="flex items-center justify-between group cursor-default">
              <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${
                nodeStates[node.id] === 'working' ? 'text-yellow-200' :
                nodeStates[node.id] === 'disconnected' ? 'text-red-400' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}>
                {node.label}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${getStatusColor(nodeStates[node.id] || 'connected')}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>
      
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
          
          <div className="grid grid-cols-2 gap-1.5">
             {channels.map(ch => (
               <button
                 key={ch}
                 disabled={!isMonitoring}
                 onClick={() => onChannelChange(ch)}
                 className={`text-[10px] font-mono py-1.5 rounded border transition-all ${
                    activeChannel === ch 
                    ? 'bg-indigo-600/80 border-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                 } ${!isMonitoring ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 {ch}
               </button>
             ))}
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