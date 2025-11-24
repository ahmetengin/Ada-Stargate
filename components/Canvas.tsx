import React from 'react';
import { RegistryEntry, Tender } from '../types';
import { ExternalLink, Radar, List, Database, Cloud, Globe } from 'lucide-react';

interface CanvasProps {
  vesselsInPort: number;
  registry: RegistryEntry[];
  tenders: Tender[];
}

export const Canvas: React.FC<CanvasProps> = ({ 
  vesselsInPort, 
  registry,
  tenders
}) => {

  return (
    <div className="h-full bg-[#050b14] text-zinc-300 flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pl-2">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">OPERATIONS DECK</h2>
          <div className="flex gap-3 text-zinc-600">
              <ExternalLink size={12} className="hover:text-teal-400 cursor-pointer transition-colors" />
              <Radar size={12} className="text-teal-500 shadow-[0_0_8px_rgba(45,212,191,0.4)]" />
              <List size={12} className="hover:text-teal-400 cursor-pointer transition-colors" />
              <Database size={12} className="hover:text-teal-400 cursor-pointer transition-colors" />
              <Cloud size={12} className="hover:text-teal-400 cursor-pointer transition-colors" />
              <Globe size={12} className="hover:text-teal-400 cursor-pointer transition-colors" />
          </div>
      </div>

      {/* Big Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="text-center">
              <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">VESSELS</div>
              <div className="text-3xl font-bold text-indigo-400 tabular-nums tracking-tighter drop-shadow-lg">{vesselsInPort}</div>
          </div>
          <div className="text-center border-x border-white/5">
              <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">MOVEMENTS</div>
              <div className="text-3xl font-bold text-zinc-200 tabular-nums tracking-tighter">{registry.length}</div>
          </div>
          <div className="text-center">
              <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">OCCUPANCY</div>
              <div className="text-3xl font-bold text-emerald-500 tabular-nums tracking-tighter">92%</div>
          </div>
      </div>

      {/* Tender Operations */}
      <div className="mb-8 pl-1">
          <h3 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4">TENDER OPERATIONS</h3>
          <div className="space-y-4">
              {tenders.map(tender => (
                  <div key={tender.id} className="flex justify-between items-center group">
                      <div>
                          <div className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{tender.callsign || tender.name}</div>
                          <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-wide">{tender.assignment || 'Station'}</div>
                      </div>
                      <div className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          tender.status === 'Idle' ? 'text-emerald-500 bg-emerald-500/5 border border-emerald-500/20' : 
                          tender.status === 'Busy' ? 'text-amber-500 bg-amber-500/5 border border-amber-500/20 animate-pulse' : 'text-red-500 bg-red-500/5 border border-red-500/20'
                      }`}>
                          {tender.status}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Port Activity */}
      <div className="mb-8 pl-1">
          <h3 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4">PORT ACTIVITY (REGISTRY)</h3>
          <div className="space-y-3">
              {registry.length === 0 ? (
                  <div className="text-[10px] text-zinc-700 italic">No recent movements log.</div>
              ) : registry.map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center group">
                      <div className="text-[10px] font-mono text-zinc-500">{entry.timestamp.split(' ')[0]}</div>
                      <div className="font-bold text-[11px] text-teal-400/80 group-hover:text-teal-400 transition-colors">{entry.vessel}</div>
                      <div className="text-[9px] font-bold text-zinc-600 text-right uppercase tracking-wide">{entry.location}</div>
                  </div>
              ))}
          </div>
      </div>

      {/* Fleet Roster Search */}
      <div className="flex-1 flex flex-col min-h-0 pl-1">
          <h3 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4">FLEET ROSTER</h3>
          
          <div className="relative mb-4 group">
              <input 
                type="text" 
                placeholder="Search vessel by name, IMO, or flag..." 
                className="w-full bg-[#0a121e] text-zinc-400 text-[10px] font-mono py-2.5 px-3 rounded border border-white/5 focus:border-teal-500/30 focus:outline-none transition-all placeholder:text-zinc-700"
              />
              <div className="absolute right-3 top-2.5 text-zinc-700 group-hover:text-zinc-500 transition-colors">
                  <Radar size={12} />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {[
                  { name: 'S/Y Phisedelia', imo: '987654321', flag: 'MT', status: 'DOCKED' },
                  { name: 'M/Y Blue Horizon', imo: '123456789', flag: 'KY', status: 'DOCKED' },
                  { name: 'S/Y Mistral', imo: '555666777', flag: 'TR', status: 'AT_ANCHOR' },
                  { name: 'M/Y Poseidon', imo: '888999000', flag: 'BS', status: 'DOCKED' },
                  { name: 'Catamaran Lir', imo: '111222333', flag: 'FR', status: 'DOCKED' },
                  { name: 'S/Y Aegeas', imo: '444555666', flag: 'GR', status: 'OUTBOUND' },
                  { name: 'M/Y Grand Turk', imo: '777888999', flag: 'PA', status: 'DOCKED' },
              ].map((vessel, i) => (
                  <div key={i} className="flex justify-between items-start">
                      <div>
                          <div className="text-[11px] font-bold text-zinc-300">{vessel.name}</div>
                          <div className="text-[9px] text-zinc-600 font-mono mt-0.5">IMO: {vessel.imo} | Flag: {vessel.flag}</div>
                      </div>
                      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{vessel.status}</div>
                  </div>
              ))}
          </div>
      </div>

    </div>
  );
};