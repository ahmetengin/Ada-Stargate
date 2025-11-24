import React from 'react';
import { UserProfile } from '../types';
import { TENANT_CONFIG } from '../services/config';

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
    <div className="h-full bg-[#050b14] flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2 text-zinc-400 mb-1 cursor-pointer" onClick={onPulseClick}>
            <div className="w-2 h-2 bg-zinc-600 rounded-sm"></div>
            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-300">ADA EXPLORER</h2>
        </div>
        <div className="flex items-center justify-between text-[9px] text-zinc-600 mt-4 font-bold">
            <span className="uppercase tracking-wider">Context</span>
            <span className="text-teal-500 underline decoration-teal-500/30 underline-offset-4">{TENANT_CONFIG.network}</span>
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 px-6 py-2 space-y-5 overflow-y-auto custom-scrollbar">
        {nodes.map((node) => (
          <div 
            key={node.id} 
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => handleNodeClick(node.id)}
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${nodeStates[node.id] === 'working' ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]' : 'bg-teal-500/50 group-hover:bg-teal-400'}`} />
            <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${nodeStates[node.id] === 'working' ? 'text-zinc-200' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
              {node.label}
            </span>
          </div>
        ))}
      </div>

      {/* VHF Control Module */}
      <div className="px-6 py-8 mt-auto">
          <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-teal-500/80 cursor-pointer" onClick={onVhfClick}>
                  <span className="animate-pulse">((●))</span>
                  <span className="text-[9px] font-bold tracking-[0.2em]">VHF CONTROL</span>
              </div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_5px_#10b981]"></div>
          </div>
          
          <div className="flex justify-between text-zinc-600 text-xs font-bold mb-4">
              {['16', '72', '69', '06'].map(ch => (
                  <button 
                    key={ch} 
                    onClick={onVhfClick}
                    className={`w-8 h-8 flex items-center justify-center rounded transition-all hover:bg-teal-500/20 ${activeChannel === ch ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-[0_0_10px_rgba(45,212,191,0.1)]' : 'bg-[#0a121e] border border-white/5'}`}
                  >
                      {ch}
                  </button>
              ))}
          </div>
          
          <div className="flex justify-between text-[9px] font-bold tracking-wider">
              {['12', '13', '14'].map(ch => (
                  <span key={ch} className="text-zinc-700 hover:text-zinc-500 cursor-not-allowed">{ch}</span>
              ))}
              <span className="text-amber-500 animate-pulse cursor-pointer" onClick={onScannerClick}>SCAN</span>
          </div>
      </div>

      {/* RBAC Selector */}
      <div className="px-6 py-6 border-t border-white/5">
          <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-3 flex gap-2 items-center">
             <div className="w-1.5 h-1.5 border border-zinc-600 rounded-full"></div> RBAC MODE
          </div>
          <div className="space-y-1">
            {(['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'] as const).map(role => (
                <button
                    key={role}
                    onClick={() => onRoleChange(role)}
                    className={`w-full text-left text-[9px] font-bold uppercase tracking-wider py-2 px-3 rounded transition-all flex justify-between items-center ${
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