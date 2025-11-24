
import React, { useState, useEffect } from 'react';
import { RegistryEntry, Tender, UserProfile, CongressEvent, Delegate, AgentTraceLog } from '../../types';
import { facilityExpert } from '../../services/agents/facilityAgent';
import { congressExpert } from '../../services/agents/congressAgent';
import { hrExpert } from '../../services/agents/hrAgent';
import { commercialExpert } from '../../services/agents/commercialAgent';
import { analyticsExpert } from '../../services/agents/analyticsAgent';
import { berthExpert } from '../../services/agents/berthAgent';
import { reservationsExpert } from '../../services/agents/reservationsAgent';

import { OpsTab } from './gm/OpsTab';
import { FleetTab } from './gm/FleetTab';
import { FacilityTab } from './gm/FacilityTab';
import { CongressTab } from './gm/CongressTab';
import { BerthsTab } from './gm/BerthsTab';
import { HRTab, CommercialTab, AnalyticsTab, BookingsTab } from './gm/ManagementTabs';
import { ObserverTab } from './gm/ObserverTab';

interface GMDashboardProps {
  userProfile: UserProfile;
  logs: any[];
  registry: RegistryEntry[];
  tenders: Tender[];
  vesselsInPort: number;
  agentTraces: AgentTraceLog[];
}

export const GMDashboard: React.FC<GMDashboardProps> = ({
  userProfile,
  logs,
  registry,
  tenders,
  vesselsInPort,
  agentTraces
}) => {
  const criticalLogs = logs.filter(log => log.type === 'critical' || log.type === 'alert');
  const [activeGmTab, setActiveGmTab] = useState<'ops' | 'fleet' | 'facility' | 'congress' | 'hr' | 'commercial' | 'analytics' | 'berths' | 'bookings' | 'observer'>('ops');
  
  const [zeroWasteStats, setZeroWasteStats] = useState<any>(null);
  const [blueFlagStatus, setBlueFlagStatus] = useState<any>(null);
  const [eventDetails, setEventDetails] = useState<CongressEvent | null>(null);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [hrData, setHrData] = useState<any>(null);
  const [commercialData, setCommercialData] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [berthAllocation, setBerthAllocation] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (activeGmTab === 'facility') {
      facilityExpert.generateZeroWasteReport(() => { }).then(res => setZeroWasteStats(res));
      facilityExpert.checkSeaWaterQuality(() => { }).then(res => setBlueFlagStatus(res));
    }
    if (activeGmTab === 'congress') {
      congressExpert.getEventDetails().then(setEventDetails);
      congressExpert.getDelegates().then(setDelegates);
    }
    if (activeGmTab === 'hr') {
      hrExpert.getShiftSchedule('Security', () => { }).then(setHrData);
    }
    if (activeGmTab === 'commercial') {
      commercialExpert.getTenantLeases(() => { }).then(setCommercialData);
    }
    if (activeGmTab === 'analytics') {
      analyticsExpert.predictOccupancy('3M', () => { }).then(setAnalyticsData);
    }
    if (activeGmTab === 'berths') {
      berthExpert.findOptimalBerth({ loa: 20.4, beam: 5.6, draft: 4.7, type: 'VO65 Racing Yacht' }, () => { }).then(setBerthAllocation);
    }
    if (activeGmTab === 'bookings') {
      reservationsExpert.processBooking({ name: "S/Y Wind Chaser", type: "Sailing Yacht", loa: 16, beam: 4.5 }, { start: "2025-06-10", end: "2025-06-15" }, () => { }).then(res => setBookings([res.proposal]));
    }
  }, [activeGmTab]);

  return (
    <div className="space-y-6 text-zinc-800 dark:text-zinc-200 font-sans h-full flex flex-col p-4">
      <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-100 pb-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Executive Operations</h2>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">CONFIDENTIAL • EYES ONLY</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold bg-zinc-900 text-white px-2 py-1 rounded">GM: {userProfile.name}</div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1 flex-shrink-0 overflow-x-auto custom-scrollbar">
        {['ops', 'fleet', 'facility', 'congress', 'hr', 'commercial', 'analytics', 'berths', 'bookings', 'observer'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveGmTab(tab as any)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-t-lg transition-colors flex-shrink-0 ${activeGmTab === tab ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        {activeGmTab === 'ops' && <OpsTab vesselsInPort={vesselsInPort} registry={registry} criticalLogs={criticalLogs} />}
        {activeGmTab === 'fleet' && <FleetTab tenders={tenders} />}
        {activeGmTab === 'facility' && <FacilityTab blueFlagStatus={blueFlagStatus} zeroWasteStats={zeroWasteStats} />}
        {activeGmTab === 'congress' && <CongressTab eventDetails={eventDetails} delegates={delegates} />}
        {activeGmTab === 'hr' && <HRTab hrData={hrData} />}
        {activeGmTab === 'commercial' && <CommercialTab commercialData={commercialData} />}
        {activeGmTab === 'analytics' && <AnalyticsTab analyticsData={analyticsData} />}
        {activeGmTab === 'berths' && <BerthsTab berthAllocation={berthAllocation} />}
        {activeGmTab === 'bookings' && <BookingsTab bookings={bookings} />}
        {activeGmTab === 'observer' && <ObserverTab traces={agentTraces} />}
      </div>
    </div>
  );
};
