
import React from 'react';
import { Anchor, CheckCircle2, DollarSign } from 'lucide-react';
import { RegistryEntry } from '../../../types';

interface OpsTabProps {
  vesselsInPort: number;
  registry: RegistryEntry[];
  criticalLogs: any[];
}

export const OpsTab: React.FC<OpsTabProps> = ({ vesselsInPort, registry, criticalLogs }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Anchor size={14} />
            <span className="text-[10px] uppercase font-bold">Occupancy</span>
          </div>
          <div className="text-2xl font-bold">{vesselsInPort} <span className="text-sm font-normal text-zinc-400">/ 600</span></div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">↑ 4% vs last week</div>
        </div>
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <CheckCircle2 size={14} />
            <span className="text-[10px] uppercase font-bold">Movements</span>
          </div>
          <div className="text-2xl font-bold">{registry.length}</div>
          <div className="text-[10px] text-zinc-400 mt-1">Today's traffic</div>
        </div>
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <DollarSign size={14} />
            <span className="text-[10px] uppercase font-bold">Revenue (Est)</span>
          </div>
          <div className="text-2xl font-bold">€{(vesselsInPort * 1.5 * 100).toFixed(0)}</div>
          <div className="text-[10px] text-zinc-400 mt-1">Daily Mooring Accrual</div>
        </div>
      </div>

      {/* Critical Issues */}
      <div>
        <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-3">Critical Incidents</h3>
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg overflow-hidden">
          {criticalLogs.length > 0 ? (
            <table className="w-full text-xs text-left">
              <thead className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                <tr>
                  <th className="p-2">Time</th>
                  <th className="p-2">Source</th>
                  <th className="p-2">Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100 dark:divide-red-900/30">
                {criticalLogs.slice(0, 5).map((log, i) => (
                  <tr key={i}>
                    <td className="p-2 font-mono text-zinc-500">{log.timestamp}</td>
                    <td className="p-2 font-bold text-red-700 dark:text-red-400">{log.source}</td>
                    <td className="p-2">{typeof log.message === 'string' ? log.message : 'System Alert'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4 text-center text-zinc-500 text-sm">System Green. No critical anomalies.</div>
          )}
        </div>
      </div>
    </div>
  );
};
