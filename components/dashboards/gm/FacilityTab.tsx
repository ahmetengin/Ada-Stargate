
import React from 'react';
import { Flag, Microscope, ShieldCheck, Recycle, AlertTriangle, Droplets } from 'lucide-react';
import { wimMasterData } from '../../../services/wimMasterData';

interface FacilityTabProps {
  blueFlagStatus: any;
  zeroWasteStats: any;
}

export const FacilityTab: React.FC<FacilityTabProps> = ({ blueFlagStatus, zeroWasteStats }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* BLUE FLAG / SEA WATER HUD */}
      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f620_1px,transparent_1px),linear-gradient(to_bottom,#3b82f620_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <Flag size={14} className={blueFlagStatus?.status === 'BLUE' ? "text-blue-500 fill-blue-500 animate-pulse" : "text-red-500"} />
            BLUE FLAG STATUS
          </div>
          <div className={`text-[9px] font-bold px-2 py-0.5 rounded border ${blueFlagStatus?.status === 'BLUE' ? 'bg-blue-500 text-white border-blue-400' : 'bg-red-500 text-white border-red-400'}`}>
            {blueFlagStatus?.status === 'BLUE' ? 'FLYING' : 'LOWERED'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-black/40 p-3 rounded border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Microscope size={12} className="text-blue-400" />
              <span className="text-[10px] text-blue-300 uppercase font-bold">E. Coli Analysis</span>
            </div>
            <div className="text-2xl font-bold text-white">{blueFlagStatus?.data?.e_coli || '--'} <span className="text-[10px] text-zinc-400 font-normal">cfu/100ml</span></div>
            <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className={`h-full ${blueFlagStatus?.data?.e_coli < 100 ? 'bg-emerald-500' : 'bg-amber-500'} w-[15%]`}></div>
            </div>
          </div>

          <div className="bg-black/40 p-3 rounded border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-300 uppercase font-bold">HSE Compliance</span>
            </div>
            <div className="text-2xl font-bold text-white">100%</div>
            <div className="text-[10px] text-zinc-400">Lifeguard On Duty</div>
          </div>
        </div>
      </div>

      {/* ZERO WASTE HUD */}
      <div className="bg-emerald-900/10 border border-emerald-500/30 p-4 rounded-xl">
        <div className="flex justify-between items-start mb-4">
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <Recycle size={14} /> ZERO WASTE COMPLIANCE (SIFIR ATIK)
          </div>
          <div className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
            {wimMasterData.facility_management?.environmental_compliance.zero_waste_certificate}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-zinc-200 dark:border-zinc-700">
            <div className="text-xs text-zinc-500 mb-1">Recycling Rate</div>
            <div className="text-2xl font-bold text-emerald-500">{zeroWasteStats?.recyclingRate || 45}%</div>
            <div className="text-[9px] text-zinc-400">Target: >40%</div>
          </div>
          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-zinc-200 dark:border-zinc-700">
            <div className="text-xs text-zinc-500 mb-1">Next Audit</div>
            <div className="text-xl font-bold text-zinc-800 dark:text-zinc-200">{zeroWasteStats?.nextAudit || '2025-12-15'}</div>
            <div className="text-[9px] text-orange-500">Ministry of Env. (EÇBS)</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[9px] font-bold text-zinc-500 uppercase">Waste Separation Stream (Kg)</div>
          <div className="flex gap-1 h-4 rounded overflow-hidden">
            <div className="bg-blue-500 w-[35%]" title="Paper (Blue)"></div>
            <div className="bg-yellow-400 w-[25%]" title="Plastic (Yellow)"></div>
            <div className="bg-green-500 w-[15%]" title="Glass (Green)"></div>
            <div className="bg-gray-400 w-[10%]" title="Metal (Grey)"></div>
            <div className="bg-orange-500 w-[5%]" title="Hazardous (Orange)"></div>
            <div className="bg-zinc-800 w-[10%]" title="Domestic (Black)"></div>
          </div>
          <div className="flex justify-between text-[9px] text-zinc-400">
            <span>Paper</span>
            <span>Plastic</span>
            <span>Glass</span>
            <span>Haz.</span>
          </div>
        </div>
      </div>

      {/* Infrastructure Alerts */}
      <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Infrastructure Health</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-red-500/10 border border-red-500/20 rounded">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold">
              <AlertTriangle size={12} /> Pedestal B-12
            </div>
            <span className="text-[9px] text-red-500">BREAKER TRIP</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 text-xs">
              <Droplets size={12} /> Main Water Line C
            </div>
            <span className="text-[9px] text-emerald-500">PRESSURE NORMAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
