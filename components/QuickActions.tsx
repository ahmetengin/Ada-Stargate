
import React from 'react';
import { ArrowDown, ArrowUp, CircleDollarSign, AlertTriangle } from 'lucide-react';

interface QuickActionsProps {
  onAction: (text: string) => void;
  userRole: 'GUEST' | 'CAPTAIN' | 'GENERAL_MANAGER';
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction, userRole }) => {
  if (userRole === 'GUEST') return null; // Guests don't have operational actions

  const actions = [
    { label: 'Arrival', icon: ArrowDown, text: 'Process arrival for S/Y Phisedelia', roles: ['CAPTAIN', 'GENERAL_MANAGER'] },
    { label: 'Departure', icon: ArrowUp, text: 'Request departure clearance for S/Y Phisedelia', roles: ['CAPTAIN', 'GENERAL_MANAGER'] },
    { label: 'Check Debt', icon: CircleDollarSign, text: 'Check my account balance', roles: ['CAPTAIN'] },
    { label: 'Incidents', icon: AlertTriangle, text: 'List critical incidents for today', roles: ['GENERAL_MANAGER'] },
  ];

  const visibleActions = actions.filter(action => action.roles.includes(userRole));

  return (
    <div className="flex items-center sm:justify-center gap-2 mt-2 px-0 sm:px-6 overflow-x-auto custom-scrollbar no-scrollbar pb-1 w-full">
      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 uppercase font-bold whitespace-nowrap hidden sm:inline">Quick Actions:</span>
      {visibleActions.map(action => (
        <button 
          key={action.label}
          onClick={() => onAction(action.text)}
          className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-md text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <action.icon size={12} />
          {action.label}
        </button>
      ))}
    </div>
  );
};
