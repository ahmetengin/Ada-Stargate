
import React from 'react';
import { UserProfile } from '../types';
import { TENANT_CONFIG } from '../services/config';
import { Radio, Search } from 'lucide-react';

interface SidebarProps {
  nodeStates: Record<string, 'connected' | 'working' | 'disconnected'>;
  activeChannel: string;
  isMonitoring: boolean;
  userProfile: UserProfile;
  onRoleChange: (role: string) => void;
  onVhfClick?: () => void;
  onScannerClick?: () => void;
  onPulseClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  nodeStates, 
  activeChannel,
  isMonitoring,
  userProfile,
  onRoleChange,
  onVhfClick,
  onScannerClick,
  onPulseClick
}) => {

  const nodes = [
    { id: 'ada.vhf', label: 'VHF' },
    { id: 'ada.sea', label: 'SEA (COLREGs)' },
    { id: 'ada.marina', label: 'MARINA (Orch)' },
    { id: 'ada.finance', label: 'FINANCE (Parasut)' },
    { id: 'ada.customer', label: 'CUSTOMER (CRM)' },
    { id: 'ada.passkit', label: 'PASSKIT (Wallet)' },
    { id: 'ada.legal', label: 'LEGAL (RAG)' },
    { id: 'ada.security', label: 'SECURITY' },
    { id: 'ada.weather', label: 'WX (Forecast)' },
  ];

  const handleNodeClick = (nodeId: string) => {
      if (nodeId === 'ada.passkit' || nodeId === 'ada.security') {
          onScannerClick?.();
      } else if (nodeId === 'ada.vhf') {
          onVhfClick?.();
      } else if (nodeId === 'ada.marina') {
          onPulseClick?.();
      }
  };

  return (
    <div className="h-full w-full bg-[#050b14] flex flex-col pb-20 lg:pb-0">
      {/* Header */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-zinc-400 mb-1 cursor-pointer hover:text-teal-400 transition-colors" onClick={onPulseClick}>
            <div className="w-2 h-2 bg-zinc-600 rounded-sm"></div>
            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-300">ADA EXPLORER</h2>
        </div>
        <div className="flex items-center justify-between text-[9px] text-zinc-600 mt-4 font-bold">
            <span className="uppercase tracking-wider">Context</span>
            <span className="text-teal-500 underline decoration-teal-500/30 underline-offset-4">{TENANT_CONFIG.network}</span>
        </div>
      </div>

      {/* Node List - HIDDEN FOR GUESTS */}
      {userProfile.role !== 'GUEST' ? (
          <div className="flex-1 px-6 py-2 space-y-5 overflow-y-auto custom-scrollbar">
            {nodes.map((node) => (
              <div 
                key={node.id} 
                className="flex items-center gap-3 group cursor-pointer min-h-[24px]" 
                onClick={() => handleNodeClick(node.id)}
              >
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${nodeStates[node.id] === 'working' ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]' : 'bg-teal-500/50 group-hover:bg-teal-400'}`} />
                <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${nodeStates[node.id] === 'working' ? 'text-zinc-200' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                  {node.label}
                </span>
              </div>
            ))}
          </div>
      ) : (
          <div className="flex-1 px-6 py-10 text-zinc-600 text-center">
              <div className="text-xs italic mb-4">Operational Nodes Hidden</div>
              <div className="text-[10px] uppercase tracking-widest">Guest View Active</div>
          </div>
      )}

      {/* VHF Control Module - UX IMPROVED */}
      {userProfile.role !== 'GUEST' && (
          <div className="px-6 py-8 mt-auto flex-shrink-0">
              <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 text-teal-500/80 cursor-pointer hover:text-teal-400 transition-colors" onClick={onVhfClick}>
                      <Radio size={14} className="animate-pulse" />
                      <span className="text-[9px] font-bold tracking-[0.2em]">VHF CONTROL</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_#10b981]"></div>
              </div>
              
              <div className="space-y-2">
                  {/* Priority Channels Row */}
                  <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={onVhfClick}
                        className={`h-10 flex flex-col items-center justify-center rounded border transition-all ${activeChannel === '16' ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-[#0a121e] border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'}`}
                      >
                          <span className="text-xs font-black">CH 16</span>
                          <span className="text-[8px] font-bold tracking-wider opacity-60">DISTRESS</span>
                      </button>
                      <button 
                        onClick={onVhfClick}
                        className={`h-10 flex flex-col items-center justify-center rounded border transition-all ${activeChannel === '72' ? 'bg-teal-500/10 border-teal-500/50 text-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.2)]' : 'bg-[#0a121e] border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'}`}
                      >
                          <span className="text-xs font-black">CH 72</span>
                          <span className="text-[8px] font-bold tracking-wider opacity-60">MARINA</span>
                      </button>
                  </div>

                  {/* Secondary Channels Row */}
                  <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={onVhfClick}
                        className="h-8 flex items-center justify-center rounded border bg-[#0a121e] border-white/5 text-zinc-600 hover:text-zinc-400 hover:border-white/10 transition-all text-[10px] font-bold"
                      >
                          CH 69
                      </button>
                      <button 
                        onClick={onVhfClick}
                        className="h-8 flex items-center justify-center rounded border bg-[#0a121e] border-white/5 text-zinc-600 hover:text-zinc-400 hover:border-white/10 transition-all text-[10px] font-bold"
                      >
                          CH 06
                      </button>
                  </div>

                  {/* Function Bar (Scan) */}
                  <button 
                    onClick={onVhfClick}
                    className="w-full h-8 mt-2 flex items-center justify-center gap-2 rounded border border-amber-500/20 bg-amber-500/5 text-amber-500/80 hover:bg-amber-500/10 hover:text-amber-400 transition-all"
                  >
                      <Search size={10} />
                      <span className="text-[9px] font-bold tracking-widest uppercase">SCAN CHANNELS</span>
                  </button>
              </div>
          </div>
      )}

      {/* RBAC Selector - ALWAYS VISIBLE */}
      <div className="px-6 py-6 border-t border-white/5 flex-shrink-0 mt-auto">
          <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-3 flex gap-2 items-center">
             <div className="w-1.5 h-1.5 border border-zinc-600 rounded-full"></div> RBAC MODE
          </div>
          <div className="space-y-1">
            {(['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'] as const).map(role => (
                <button
                    key={role}
                    onClick={() => onRoleChange(role)}
                    className={`w-full text-left text-[9px] font-bold uppercase tracking-wider py-3 px-3 rounded transition-all flex justify-between items-center ${
                        userProfile.role === role 
                        ? 'bg-[#0a1525] text-teal-400 border-l-2 border-teal-500 shadow-[0_4px_10px_rgba(0,0,0,0.3)]' 
                        : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
                    }`}
                >
                    {role.replace('_', ' ')}
                    {userProfile.role === role && <div className="w-1 h-1 bg-teal-500 rounded-full shadow-[0_0_5px_#2dd4bf]"></div>}
                </button>
            ))}
          </div>
      </div>
    </div>
  );
};
