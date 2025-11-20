
// services/agents/marinaAgent.ts
import { TaskHandlerFn } from '../decomposition/types';
import { AgentAction, AgentTraceLog } from '../../types';

// --- MOCK FLEET DATABASE (System of Record) ---
const FLEET_DB = [
    { name: 'S/Y Phisedelia', loa: 18.4, beam: 5.2, status: 'DOCKED', location: 'Pontoon C-12', lat: 40.9634, lng: 28.6289, type: 'Sailing Yacht' },
    { name: 'M/Y Blue Horizon', loa: 24.0, beam: 6.1, status: 'DOCKED', location: 'Pontoon A-05', lat: 40.9640, lng: 28.6295, type: 'Motor Yacht' },
    { name: 'S/Y Mistral', loa: 14.2, beam: 4.1, status: 'AT_ANCHOR', location: 'Sector Zulu', lat: 40.9500, lng: 28.6300, type: 'Sailing Yacht' },
    { name: 'M/Y Poseidon', loa: 32.5, beam: 7.8, status: 'DOCKED', location: 'VIP Quay', lat: 40.9650, lng: 28.6270, type: 'Superyacht' },
    { name: 'Catamaran Lir', loa: 12.0, beam: 6.5, status: 'DOCKED', location: 'Pontoon B-01', lat: 40.9638, lng: 28.6290, type: 'Catamaran' },
    { name: 'S/Y Aegeas', loa: 16.0, beam: 4.8, status: 'TRANSIT', location: 'Outbound', lat: 40.9550, lng: 28.6250, type: 'Sailing Yacht' },
    { name: 'M/Y Grand Turk', loa: 45.0, beam: 9.0, status: 'DOCKED', location: 'VIP Quay', lat: 40.9652, lng: 28.6272, type: 'Superyacht' }
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

    // NEW: Fleet Intelligence Capability
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
                 const mapLink = `https://www.google.com/maps/search/?api=1&query=${vessel.lat},${vessel.lng}`;
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
                const link = `[📍View](https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng})`;
                report += `| **${v.name}** | ${v.loa}m | ${v.location} | ${link} |\n`;
            });

            return { text: report, actions: [] };
        }

        return { text: "Query not understood.", actions: [] };
    }
};
