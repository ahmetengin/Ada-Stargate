
import React from 'react';
import { Radio, Anchor, Globe, Shield, Zap, Briefcase, Users, FileText, Moon, ScanLine } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { TENANT_CONFIG } from '../services/config';

interface SidebarProps {
  nodeStates: Record<string, 'connected' | 'working' | 'disconnected'>;
  activeChannel: string;
  onChannelChange: (ch: string) => void;
  isMonitoring: boolean;
  onMonitoringToggle: () => void;
  userProfile: UserProfile;
  onRoleChange: (role: UserRole) => void;
  onNodeClick: (nodeId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isPanel: boolean; 
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

  const nodes = [
    { id: 'ada.vhf', label: 'VHF', color: 'bg-emerald-500' },
    { id: 'ada.sea', label: 'SEA (COLREGS)', color: 'bg-emerald-500' },
    { id: 'ada.marina', label: 'MARINA (Orch)', color: 'bg-emerald-500' },
    { id: 'ada.finance', label: 'FINANCE (Parasut)', color: 'bg-emerald-500' },
    { id: 'ada.customer', label: 'CUSTOMER (CRM)', color: 'bg-emerald-500' },
    { id: 'ada.passkit', label: 'PASSKIT (Wallet)', color: 'bg-emerald-500' },
    { id: 'ada.legal', label: 'LEGAL (RAG)', color: 'bg-emerald-500' },
    { id: 'ada.security', label: 'SECURITY', color: 'bg-emerald-500' },
    { id: 'ada.weather', label: 'WX (Forecast)', color: 'bg-emerald-500' },
  ];

  return (
    <div className="flex flex-col h-full text-zinc-400 font-sans select-none">
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-[0.2em] flex items-center gap-2">
               <Anchor size={14} className="text-zinc-500" /> ADA EXPLORER
            </h2>
            <Moon size={12} className="text-zinc-600" />
        </div>
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
            <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">CONTEXT</div>
            <div className="text-[9px] font-mono text-indigo-400 font-bold">{TENANT_CONFIG.network}</div>
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto px-6 space-y-4 pt-2">
        {nodes.map(node => (
            <div key={node.id} className="flex items-center gap-3 group cursor-pointer hover:text-zinc-200 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full ${node.color} shadow-[0_0_5px_rgba(16,185,129,0.4)]`}></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{node.label}</span>
            </div>
        ))}
      </div>

      {/* VHF Control */}
      <div className="px-6 py-6 border-t border-zinc-800/50">
          <div className="flex items-center justify-between mb-4">
              <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="animate-pulse">((●))</span> VHF CONTROL
              </div>
              <button onClick={onMonitoringToggle}>
                  <div className={`w-3 h-3 rounded-full border ${isMonitoring ? 'border-emerald-500 bg-emerald-500/20' : 'border-zinc-600'}`}></div>
              </button>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mb-4">
              {['16', '72', '69', '06'].map(ch => (
                  <button 
                    key={ch}
                    onClick={() => onChannelChange(ch)}
                    className={`h-8 rounded text-[10px] font-bold font-mono transition-all ${
                        activeChannel === ch 
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                        : 'bg-zinc-900/50 text-zinc-600 border border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                      {ch}
                  </button>
              ))}
          </div>
          
          <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1 h-8 flex items-center justify-center text-[10px] font-mono text-zinc-600">12</div>
              <div className="col-span-1 h-8 flex items-center justify-center text-[10px] font-mono text-zinc-600">13</div>
              <div className="col-span-1 h-8 flex items-center justify-center text-[10px] font-mono text-zinc-600">14</div>
              <button className="col-span-1 h-8 rounded text-[10px] font-bold font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20">SCAN</button>
          </div>
      </div>

      {/* RBAC */}
      <div className="px-6 py-4 border-t border-zinc-800/50">
          <div className="text-[9px] font-mono text-zinc-600 uppercase mb-2 flex gap-2">
              <Users size={10} /> RBAC MODE
          </div>
          <div className="space-y-1">
              {(['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'] as UserRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => onRoleChange(role)}
                    className={`w-full text-left px-3 py-2 rounded text-[9px] font-bold uppercase tracking-widest transition-all flex justify-between ${
                        userProfile.role === role 
                        ? 'bg-indigo-900/20 text-indigo-300 border border-indigo-500/30' 
                        : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                      {role.replace('_', ' ')}
                      {userProfile.role === role && <div className="w-1 h-1 bg-indigo-400 rounded-full mt-1"></div>}
                  </button>
              ))}
          </div>
      </div>
    </div>
  );
};
