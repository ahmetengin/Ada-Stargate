import React from 'react';
import { BrainCircuit, Radio, X, Plane, Activity, HardHat, Users, Store, TrendingUp } from 'lucide-react';
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
  isPanel: boolean; // New prop to control rendering mode
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  nodeStates, 
  activeChannel,
  onChannelChange,
  isMonitoring,
  onMonitoringToggle,
  userProfile,
  onRoleChange,
  onNodeClick,
  isOpen,
  onClose,
  isPanel
}) => {

  const allNodes = [
    // External Ops
    { id: 'ada.marina', label: 'MARINA', roles: ['CAPTAIN', 'GENERAL_MANAGER'] },
    { id: 'ada.vhf', label: 'VHF', roles: ['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'] },
    { id: 'ada.sea', label: 'SEA', roles: ['CAPTAIN', 'GENERAL_MANAGER'] },
    { id: 'ada.technic', label: 'TECHNIC', roles: ['CAPTAIN', 'GENERAL_MANAGER'] },
    { id: 'ada.weather', label: 'WX', roles: ['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'] },
    // Business Ops
    { id: 'ada.finance', label: 'FINANCE', roles: ['CAPTAIN', 'GENERAL_MANAGER'] },
    { id: 'ada.customer', label: 'CUSTOMER', roles: ['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'] },
    { id: 'ada.travel', label: 'KITES', icon: Plane, roles: ['GUEST', 'CAPTAIN', 'GENERAL_MANAGER']},
    { id: 'ada.congress', label: 'EVENT', icon: Activity, roles: ['GENERAL_MANAGER', 'GUEST'] },
    // Internal & Strategic Ops (GM Only)
    { id: 'ada.facility', label: 'FACILITY', icon: HardHat, roles: ['GENERAL_MANAGER'] },
    { id: 'ada.passkit', label: 'PASSKIT', roles: ['GENERAL_MANAGER'] },
    { id: 'ada.legal', label: 'LEGAL', roles: ['GENERAL_MANAGER'] },
    { id: 'ada.security', label: 'SECURITY', roles: ['GENERAL_MANAGER'] },
    { id: 'ada.hr', label: 'HR', icon: Users, roles: ['GENERAL_MANAGER'] },
    { id: 'ada.commercial', label: 'COMMERCIAL', icon: Store, roles: ['GENERAL_MANAGER'] },
    { id: 'ada.analytics', label: 'ANALYTICS', icon: TrendingUp, roles: ['GENERAL_MANAGER'] },
  ];

  // Filter nodes based on current role
  const visibleNodes = allNodes.filter(node => node.roles.includes(userProfile.role));

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-yellow-400 shadow-[0_0_4px_theme(colors.yellow.400)]';
      case 'disconnected': return 'bg-red-500 shadow-[0_0_4px_theme(colors.red.500)]';
      case 'connected': default: return 'bg-emerald-500 shadow-[0_0_4px_theme(colors.emerald.500)]';
    }
  };

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
            <BrainCircuit size={16} />
            <span className="font-bold tracking-[0.2em] text-xs uppercase">Explorer</span>
        </div>
         {/* Close Button (for drawer) */}
        {!isPanel && (
            <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-200 lg:hidden" aria-label="Close menu">
               <X size={18} />
            </button>
        )}
      </div>

      {/* Context Label */}
      <div className="px-4 pt-4 pb-2">
          <div className="text-[9px] text-indigo-500 dark:text-indigo-400/70 font-bold font-mono tracking-widest">
            {TENANT_CONFIG.network}
          </div>
      </div>

      {/* Vertical Node List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
        <div className="space-y-1">
            {visibleNodes.map((node) => (
              <button 
                key={node.id} 
                onClick={() => onNodeClick(node.id)}
                className="w-full flex items-center justify-start gap-4 group cursor-pointer transition-all text-left p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300 group-hover:scale-125 ${getStatusDotColor(nodeStates[node.id] || 'connected')}`} />
                <span className={`text-[10px] tracking-widest uppercase font-semibold transition-all duration-300 ${
                  nodeStates[node.id] === 'working' ? 'text-yellow-500' :
                  nodeStates[node.id] === 'disconnected' ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
                }`}>
                  {node.label}
                </span>
              </button>
            ))}
        </div>

        {/* RBAC Mode */}
        <div className="mt-6 pt-4 border-t border-border-light dark:border-border-dark mx-2">
            <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase mb-4 tracking-[0.2em]">
                Identity
            </div>
            <div className="space-y-2">
                {(['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'] as UserRole[]).map(role => {
                    const isActive = userProfile.role === role;
                    return (
                        <button
                            key={role}
                            onClick={() => onRoleChange(role)}
                            className={`w-full text-left text-xs transition-all flex items-center justify-between group uppercase tracking-wide p-2 rounded-md ${
                                isActive
                                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10' 
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                            }`}
                        >
                            {role.replace('_', ' ')}
                            {isActive && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                        </button>
                    )
                })}
            </div>
        </div>
      </div>

      {/* VHF Control Panel */}
      <div className="p-4 border-t border-border-light dark:border-border-dark flex-shrink-0">
          <div className="flex items-center justify-between text-[9px] mb-3">
              <div className="flex items-center gap-2">
                  <button onClick={onMonitoringToggle} className={`p-1 transition-colors rounded-full ${isMonitoring ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-zinc-500 hover:bg-zinc-800'}`}>
                      <Radio size={12} />
                  </button>
                  <span className={`font-bold tracking-widest ${isMonitoring ? 'text-zinc-300' : 'text-zinc-600'}`}>VHF MONITOR</span>
              </div>
              <div className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded font-bold font-mono">
                CTRL: CH 72
              </div>
          </div>
          
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-2">
              <span className="text-zinc-500 text-[9px] uppercase tracking-wider font-sans">Listen:</span>
              <div className="flex items-center gap-1.5">
                  {['72', '16', '69', '13', '14'].map((ch) => (
                      <button 
                          key={ch}
                          onClick={() => onChannelChange(ch)}
                          className={`px-1.5 py-0.5 rounded transition-colors ${
                              activeChannel === ch ? 'text-indigo-500 font-black bg-indigo-500/10' : 'hover:text-zinc-900 dark:hover:text-zinc-100'
                          }`}
                      >
                          {ch}
                      </button>
                  ))}
                  <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
                  <button className="text-amber-600 dark:text-amber-500 font-bold">SCAN</button>
              </div>
          </div>
      </div>
    </>
  );

  const baseClasses = `flex flex-col bg-panel-light dark:bg-panel-dark border-r border-border-light dark:border-border-dark font-mono select-none transition-all duration-300`;

  if (isPanel) {
    return (
        <aside className={`${baseClasses} ${isOpen ? 'w-[280px]' : 'w-0 hidden'}`}>
            <SidebarContent />
        </aside>
    );
  }

  // --- DRAWER MODE ---
  return (
    <>
        <div 
            className={`fixed inset-0 bg-black/60 z-40 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
            aria-hidden="true"
        />
        <div 
            className={`
            ${baseClasses}
            fixed top-0 left-0 h-full
            w-[280px] z-50 transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            <SidebarContent />
        </div>
    </>
  );
};