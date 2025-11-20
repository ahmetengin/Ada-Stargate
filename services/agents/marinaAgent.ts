// services/agents/marinaAgent.ts
import { TaskHandlerFn } from '../decomposition/types';
import { AgentAction, AgentTraceLog, KplerAisTarget, TrafficEntry, VesselIntelligenceProfile } from '../../types';
import { wimMasterData } from '../wimMasterData';

// --- MOCK FLEET DATABASE (System of Record) - Enriched with Kpler MCP-style data ---
const FLEET_DB: VesselIntelligenceProfile[] = [
    { name: 'S/Y Phisedelia', imo: '987654321', type: 'Sailing Yacht', flag: 'MT', dwt: 150, loa: 18.4, beam: 5.2, status: 'DOCKED', location: 'Pontoon C-12', coordinates: { lat: 40.9634, lng: 28.6289 }, voyage: { lastPort: 'Piraeus', nextPort: 'Sochi', eta: '2025-11-25' } },
    { name: 'M/Y Blue Horizon', imo: '123456789', type: 'Motor Yacht', flag: 'KY', dwt: 300, loa: 24.0, beam: 6.1, status: 'DOCKED', location: 'Pontoon A-05', coordinates: { lat: 40.9640, lng: 28.6295 }, voyage: { lastPort: 'Monaco', nextPort: 'WIM', eta: 'N/A' } },
    { name: 'S/Y Mistral', imo: '555666777', type: 'Sailing Yacht', flag: 'TR', dwt: 120, loa: 14.2, beam: 4.1, status: 'AT_ANCHOR', location: 'Sector Zulu', coordinates: { lat: 40.9500, lng: 28.6300 }, voyage: { lastPort: 'Bodrum', nextPort: 'WIM', eta: 'N/A' } },
    { name: 'M/Y Poseidon', imo: '888999000', type: 'Superyacht', flag: 'BS', dwt: 499, loa: 32.5, beam: 7.8, status: 'DOCKED', location: 'VIP Quay', coordinates: { lat: 40.9650, lng: 28.6270 }, voyage: { lastPort: 'Antalya', nextPort: 'Dubrovnik', eta: '2025-11-28' } },
    { name: 'Catamaran Lir', imo: '111222333', type: 'Catamaran', flag: 'FR', dwt: 90, loa: 12.0, beam: 6.5, status: 'DOCKED', location: 'Pontoon B-01', coordinates: { lat: 40.9638, lng: 28.6290 }, voyage: { lastPort: 'Thessaloniki', nextPort: 'WIM', eta: 'N/A' } },
    { name: 'S/Y Aegeas', imo: '444555666', type: 'Sailing Yacht', flag: 'GR', dwt: 140, loa: 16.0, beam: 4.8, status: 'OUTBOUND', location: 'Outbound', coordinates: { lat: 40.9550, lng: 28.6250 }, voyage: { lastPort: 'WIM', nextPort: 'Lavrion', eta: '2025-11-24' } },
    { name: 'M/Y Grand Turk', imo: '777888999', type: 'Superyacht', flag: 'PA', dwt: 650, loa: 45.0, beam: 9.0, status: 'DOCKED', location: 'VIP Quay', coordinates: { lat: 40.9652, lng: 28.6272 }, voyage: { lastPort: 'St. Tropez', nextPort: 'WIM', eta: 'N/A' } }
];

const identifyVessel: TaskHandlerFn = async (ctx, obs) => {
  const vesselName = obs.payload?.text?.match(/([A-Z/Y ]+)/)?.[0]?.trim() || 'Unknown Vessel';
  console.log(`[Agent: Marina] Identifying vessel: ${vesselName}`);
  return [{
    id: `act_${Date.now()}`,
    kind: 'internal',
    name: 'marina.vessel.identified',
    params: { vessel: vesselName, priority: 4 }, 
  }];
};

const dispatchTender: TaskHandlerFn = async (ctx, obs) => {
  console.log('[Agent: Marina] Dispatching tender...');
  const tenderId = 't1'; 
  const vesselToAssist = 'S/Y Phisedelia'; 
  return [{
    id: `act_${Date.now()}`,
    kind: 'external',
    name: 'marina.dispatchTender',
    params: { tenderId: tenderId, vessel: vesselToAssist },
  }];
};

export const marinaHandlers: Record<string, TaskHandlerFn> = {
  'marina.identifyVessel': identifyVessel,
  'marina.dispatchTender': dispatchTender,
};

// --- DIRECT AGENT INTERFACE ---
export const marinaAgent = {
    // FIX: Add missing isContractedVessel method to resolve error in App.tsx
    isContractedVessel: (imo: string): boolean => {
        if (!imo) return false;
        // A vessel is considered "contracted" if it exists in our master fleet database.
        return FLEET_DB.some(v => v.imo === imo);
    },

    processDeparture: async (vesselName: string): Promise<AgentAction[]> => {
        const assignedTender = "Tender Alpha";
        return [{
            id: `marina_dept_${Date.now()}`,
            kind: 'external',
            name: 'ada.marina.tenderDispatched',
            params: { 
                tender: assignedTender, 
                mission: 'DEPARTURE_ASSIST',
                vessel: vesselName
            }
        }];
    },

    // NEW: Vessel Intelligence Briefing Skill
    getVesselIntelligence: async (vesselName: string): Promise<VesselIntelligenceProfile | null> => {
        // Simulates calling the Kpler MCP endpoint: wimMasterData.api_integrations.kpler_ais.endpoint_vessel_intel
        const targetName = vesselName.toLowerCase();
        const vessel = FLEET_DB.find(v => v.name.toLowerCase().includes(targetName));
        return vessel || null;
    },

    queryFleet: async (queryType: 'LOCATE' | 'FILTER', params: any, addTrace: (t: AgentTraceLog) => void): Promise<{ text: string, actions: AgentAction[] }> => {
        
        if (queryType === 'LOCATE') {
            const targetName = params.vesselName.toLowerCase();
            const vessel = FLEET_DB.find(v => v.name.toLowerCase().includes(targetName));
            
            addTrace({
                id: `trace_fleet_lookup_${Date.now()}`,
                timestamp: new Date().toISOString(),
                node: 'ada.marina',
                step: 'TOOL_EXECUTION',
                content: `Querying Fleet Database for: "${targetName}"`,
                persona: 'WORKER'
            });

            if (vessel) {
                 const mapLink = `https://www.google.com/maps/search/?api=1&query=${vessel.coordinates.lat},${vessel.coordinates.lng}`;
                 return {
                     text: `**STATUS REPORT: ${vessel.name}**\n\n**Status:** ${vessel.status}\n**Location:** ${vessel.location}\n**Specs:** ${vessel.loa}m / ${vessel.type}\n\n[📍 LIVE LOCATION](${mapLink})`,
                     actions: []
                 };
            } else {
                 return {
                     text: `**Negative Contact.** Vessel matching "${params.vesselName}" is not currently logged in the WIM Registry system.`,
                     actions: []
                 };
            }
        }

        if (queryType === 'FILTER') {
            const minLength = params.minLength || 0;
            addTrace({
                id: `trace_fleet_filter_${Date.now()}`,
                timestamp: new Date().toISOString(),
                node: 'ada.marina',
                step: 'CODE_OUTPUT',
                content: `Executing Filter: LOA > ${minLength}m`,
                persona: 'WORKER'
            });

            const results = FLEET_DB.filter(v => v.loa > minLength);
            
            if (results.length === 0) return { text: "No vessels found matching criteria.", actions: [] };

            // Format as a Markdown Table
            let report = `**FLEET REPORT (LOA > ${minLength}m)**\n\n`;
            report += `| Vessel Name | LOA | Location | Map |\n|---|---|---|---|\n`;
            results.forEach(v => {
                const link = `[📍View](https://www.google.com/maps/search/?api=1&query=${v.coordinates.lat},${v.coordinates.lng})`;
                report += `| **${v.name}** | ${v.loa}m | ${v.location} | ${link} |\n`;
            });

            return { text: report, actions: [] };
        }

        return { text: "Query not understood.", actions: [] };
    },

    fetchLiveAisData: async (): Promise<TrafficEntry[]> => {
        try {
            // --- MOCK API DATA GENERATION (from enriched DB) ---
            const mockApiData = FLEET_DB.map((v, i) => ({
                id: `kpler-${v.imo}`,
                vessel_name: v.name,
                status: v.status as any,
                latitude: v.coordinates.lat + (Math.random() - 0.5) * 0.005,
                longitude: v.coordinates.lng + (Math.random() - 0.5) * 0.005,
                speed_knots: v.status === 'DOCKED' ? 0 : Math.random() * 8 + 2,
                course_deg: Math.random() * 360,
                imo: v.imo,
                flag: v.flag,
                nextPort: v.voyage.nextPort
            }));
            // --- END MOCK DATA ---

            // Transform the API data into the format our application uses (MCP pattern)
            return mockApiData.map(target => ({
                id: target.id,
                vessel: target.vessel_name,
                status: target.status,
                priority: 5, 
                sector: 'WIM Approach',
                lat: target.latitude,
                lng: target.longitude,
                speedKnots: Math.round(target.speed_knots * 10) / 10,
                course: Math.round(target.course_deg),
                imo: target.imo,
                flag: target.flag,
                nextPort: target.nextPort
            }));
            
        } catch (error) {
            console.error('[marinaAgent] Failed to fetch live AIS data:', error);
            return [];
        }
    }
};