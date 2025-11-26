
import React from 'react';
import { DollarSign, TrendingUp, CreditCard, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const FinanceWidget: React.FC = () => {
  const transactions = [
    { id: 'TX-99', desc: 'Mooring: Blue Horizon', amount: 1200, status: 'SUCCESS', type: 'IN' },
    { id: 'TX-98', desc: 'Market: Guest #22', amount: 45, status: 'SUCCESS', type: 'IN' },
    { id: 'TX-97', desc: 'Fuel: Tender Alpha', amount: 350, status: 'PENDING', type: 'OUT' },
    { id: 'TX-96', desc: 'Lift: S/Y Aegeas', amount: 850, status: 'SUCCESS', type: 'IN' },
    { id: 'TX-95', desc: 'Restaurant: Poem', amount: 120, status: 'SUCCESS', type: 'IN' },
  ];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden animate-in fade-in duration-500 delay-200">
        <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
            <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} /> CASH FLOW
            </h3>
            <div className="text-[9px] font-mono text-zinc-500">LIVE STREAM</div>
        </div>

        <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-zinc-800/50 p-2 rounded text-center border border-emerald-500/10">
                    <div className="text-[9px] text-zinc-500 uppercase">Inflow</div>
                    <div className="text-sm font-bold text-emerald-400">+€12,450</div>
                </div>
                <div className="bg-zinc-800/50 p-2 rounded text-center border border-amber-500/10">
                    <div className="text-[9px] text-zinc-500 uppercase">Pending</div>
                    <div className="text-sm font-bold text-amber-400">€850</div>
                </div>
            </div>

            <div className="space-y-1.5">
                {transactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center p-2 bg-black/20 rounded border border-zinc-800 hover:border-zinc-700 transition-colors text-xs group">
                        <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-full ${tx.type === 'IN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                {tx.type === 'IN' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                            </div>
                            <span className="text-zinc-300 truncate max-w-[120px] group-hover:text-white transition-colors">{tx.desc}</span>
                        </div>
                        <div className={`font-mono font-bold ${tx.type === 'IN' ? 'text-emerald-500' : 'text-red-400'}`}>
                            {tx.type === 'IN' ? '+' : '-'}€{tx.amount}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
