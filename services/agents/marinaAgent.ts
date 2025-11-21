// services/agents/marinaAgent.ts
import { TaskHandlerFn } from '../decomposition/types';
import { AgentAction, AgentTraceLog, KplerAisTarget, TrafficEntry, VesselIntelligenceProfile } from '../../types';
import { wimMasterData } from '../wimMasterData';
import { financeAgent } from './financeAgent'; // Import financeAgent
import { haversineDistance } from '../utils';

// --- MOCK FLEET DATABASE (System of Record) - Enriched with Kpler MCP-style data ---
let FLEET_DB: VesselIntelligenceProfile[] = [
    { 
        name: 'S/Y Phisedelia', imo: '987654321', type: 'Sailing Yacht', flag: 'MT', 
        ownerName: 'Ahmet Engin', ownerId: '12345678901', ownerEmail: 'ahmet.engin@example.com', ownerPhone: '+905321234567',
        dwt: 150, loa: 18.4, beam: 5.2, status: 'DOCKED', location: 'Pontoon C-12', 
        coordinates: { lat: 40.9634, lng: 28.6289 }, 
        voyage: { lastPort: 'Piraeus', nextPort: 'Sochi', eta: '2025-11-25' },
        paymentHistoryStatus: 'RECENTLY_LATE'
    },
    { 
        name: 'M/Y Blue Horizon', imo: '123456789', type: 'Motor Yacht', flag: 'KY', 
        ownerName: 'Jane Smith', ownerId: '98765432109', ownerEmail: 'jane.smith@example.com', ownerPhone: '+447911123456',
        dwt: 300, loa: 24.0, beam: 6.1, status: 'DOCKED', location: 'Pontoon A-05', 
        coordinates: { lat: 40.9640, lng: 28.6295 }, 
        voyage: { lastPort: 'Monaco', nextPort: 'WIM', eta: 'N/A' } 
    },
    { 
        name: 'S/Y Mistral', imo: '555666777', type: 'Sailing Yacht', flag: 'TR', 
        dwt: 120, loa: 14.2, beam: 4.1, status: 'AT_ANCHOR', location: 'Sector Zulu', 
        coordinates: { lat: 40.9500, lng: 28.6300 }, 
        voyage: { lastPort: 'Bodrum', nextPort: 'WIM', eta: 'N/A' } 
    },
    { 
        name: 'M/Y Poseidon', imo: '888999000', type: 'Superyacht', flag: 'BS', 
        ownerName: 'Michael Johnson', ownerId: 'A123B456C',
        dwt: 499, loa: 32.5, beam: 7.8, status: 'DOCKED', location: 'VIP Quay', 
        coordinates: { lat: 40.9650, lng: 28.6270 }, 
        voyage: { lastPort: 'Antalya', nextPort: 'Dubrovnik', eta: '2025-11-28' } 
    },
    { 
        name: 'Catamaran Lir', imo: '111222333', type: 'Catamaran', flag: 'FR', 
        dwt: 90, loa: 12.0, beam: 6.5, status: 'DOCKED', location: 'Pontoon B-01', 
        coordinates: { lat: 40.9638, lng: 28.6290 }, 
        voyage: { lastPort: 'Thessaloniki', nextPort: 'WIM', eta: 'N/A' } 
    },
    { 
        name: 'S/Y Aegeas', imo: '444555666', type: 'Sailing Yacht', flag: 'GR', 
        dwt: 140, loa: 16.0, beam: 4.8, status: 'OUTBOUND', location: 'Outbound', 
        coordinates: { lat: 40.9550, lng: 28.6250 }, 
        voyage: { lastPort: 'WIM', nextPort: 'Lavrion', eta: '2025-11-24' } 
    },
    { 
        name: 'M/Y Grand Turk', imo: '777888999', type: 'Superyacht', flag: 'PA', 
        dwt: 650, loa: 45.0, beam: 9.0, status: 'DOCKED', location: 'VIP Quay', 
        coordinates: { lat: 40.9652, lng: 28.6272 }, 
        voyage: { lastPort: 'St. Tropez', nextPort: 'WIM', eta: 'N/A' } 
    }
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

// --- DIRECT AGENT INTERFACE (Ada.marina.wim Node) ---
export const marinaAgent = {
    isContractedVessel: (imo: string): boolean => {
        if (!imo) return false;
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

    // Skill: Vessel Intelligence Briefing (Kpler MCP)
    getVesselIntelligence: async (vesselName: string): Promise<VesselIntelligenceProfile | null> => {
        const targetName = vesselName.toLowerCase();
        const vessel = FLEET_DB.find(v => v.name.toLowerCase().includes(targetName));
        if (!vessel) return null;

        // Enrich with live financial data
        const debtStatus = await financeAgent.checkDebt(vessel.name);
        return {
            ...vessel,
            outstandingDebt: debtStatus.amount,
            paymentHistoryStatus: debtStatus.paymentHistoryStatus
        };
    },

    // Skill: Expose entire fleet for UI display
    getAllFleetVessels: (): VesselIntelligenceProfile[] => {
        return FLEET_DB;
    },

    // Skill: Register New Vessel
    registerVessel: async (name: string, imo: string, type: string, flag: string, loa?: number, beam?: number): Promise<{ success: boolean, message: string, vessel?: VesselIntelligenceProfile }> => {
        if (!name || !imo || !type || !flag) {
            return { success: false, message: "Error: Vessel name, IMO, type, and flag are required for registration." };
        }

        const existingVessel = FLEET_DB.find(v => v.imo === imo);
        if (existingVessel) {
            return { success: false, message: `Error: Vessel with IMO ${imo} is already registered as ${existingVessel.name}.` };
        }

        const newVessel: VesselIntelligenceProfile = {
            name,
            imo,
            type,
            flag,
            loa: loa || undefined,
            beam: beam || undefined,
            dwt: (loa && beam) ? Math.round(loa * beam * 0.4) : undefined,
            status: 'REGISTERED',
            location: 'Not yet assigned',
            coordinates: wimMasterData.identity.location.coordinates,
            voyage: { lastPort: 'N/A', nextPort: 'N/A', eta: 'N/A' },
            outstandingDebt: 0,
            loyaltyScore: 500, // Starting score
            loyaltyTier: 'STANDARD',
            paymentHistoryStatus: 'REGULAR'
        };

        FLEET_DB.push(newVessel);
        return { success: true, message: `Vessel ${name} (IMO: ${imo}) successfully registered.`, vessel: newVessel };
    },
    
    // Skill: Update Vessel Profile (for loyalty updates etc.)
    updateVesselProfile: async (imo: string, updates: Partial<VesselIntelligenceProfile>): Promise<boolean> => {
        const vesselIndex = FLEET_DB.findIndex(v => v.imo === imo);
        if (vesselIndex === -1) {
            return false;
        }
        FLEET_DB[vesselIndex] = { ...FLEET_DB[vesselIndex], ...updates };
        return true;
    },

    // Skill: Fleet Query
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
                 const mapLink = `https://www.google.com/maps/search/?api=1&query=${vessel.coordinates?.lat},${vessel.coordinates?.lng}`;
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
            const results = FLEET_DB.filter(v => v.loa && v.loa > minLength);
            if (results.length === 0) return { text: "No vessels found matching criteria.", actions: [] };
            
            let report = `**FLEET REPORT (LOA > ${minLength}m)**\n\n`;
            report += `| Vessel Name | LOA | Location | Map |\n|---|---|---|---|\n`;
            results.forEach(v => {
                const link = `[📍View](https://www.google.com/maps/search/?api=1&query=${v.coordinates?.lat},${v.coordinates?.lng})`;
                report += `| **${v.name}** | ${v.loa}m | ${v.location} | ${link} |\n`;
            });
            return { text: report, actions: [] };
        }
        return { text: "Query not understood.", actions: [] };
    },

    // Skill: AIS Monitor (Kpler Live Feed Simulation)
    fetchLiveAisData: async (): Promise<TrafficEntry[]> => {
        try {
            // Simulate querying the Kpler MCP: https://api.kpler.com/v1/ais/wim-region/live
            const mockApiData = FLEET_DB.map((v, i) => ({
                id: `kpler-${v.imo}`,
                vessel_name: v.name,
                status: v.status as any,
                latitude: v.coordinates?.lat + (Math.random() - 0.5) * 0.005 || wimMasterData.identity.location.coordinates.lat + (Math.random() - 0.5) * 0.005,
                longitude: v.coordinates?.lng + (Math.random() - 0.5) * 0.005 || wimMasterData.identity.location.coordinates.lng + (Math.random() - 0.5) * 0.005,
                speed_knots: v.status === 'DOCKED' ? 0 : Math.random() * 8 + 2,
                course_deg: Math.random() * 360,
                imo: v.imo,
                flag: v.flag,
                nextPort: v.voyage?.nextPort
            }));
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
    },

    // NEW Skill: Find Vessels Near a Coordinate
    findVesselsNear: async (centerLat: number, centerLng: number, radiusMiles: number, addTrace: (t: AgentTraceLog) => void): Promise<(TrafficEntry & { distanceMiles: number })[]> => {
        addTrace({
            id: `trace_vessel_proximity_${Date.now()}`,
            timestamp: new Date().toISOString(),
            node: 'ada.marina',
            step: 'TOOL_EXECUTION',
            content: `Searching for vessels within ${radiusMiles} miles of Lat: ${centerLat}, Lng: ${centerLng}...`,
            persona: 'WORKER'
        });

        const allAisTargets = await marinaAgent.fetchLiveAisData();
        const vesselsInProximity: (TrafficEntry & { distanceMiles: number })[] = [];

        for (const target of allAisTargets) {
            if (target.lat !== undefined && target.lng !== undefined) {
                const distance = haversineDistance(centerLat, centerLng, target.lat, target.lng);
                if (distance <= radiusMiles) {
                    vesselsInProximity.push({ ...target, distanceMiles: parseFloat(distance.toFixed(2)) });
                }
            }
        }
        addTrace({
            id: `trace_vessel_proximity_results_${Date.now()}`,
            timestamp: new Date().toISOString(),
            node: 'ada.marina',
            step: 'CODE_OUTPUT',
            content: `Found ${vesselsInProximity.length} vessels in proximity.`,
            persona: 'WORKER'
        });
        return vesselsInProximity;
    },

    // Skill: Berth Allocation (Rule-Based Logic)
    // Input: LOA, Beam, Draft
    // Output: Berth Assignment + Maneuver Notes
    executeSkill_BerthAllocation: async (specs: { loa: number, beam: number, draft: number }, addTrace: (t: AgentTraceLog) => void): Promise<{ berth: string, notes: string }> => {
        
        addTrace({
            id: `trace_berth_algo_${Date.now()}`,
            timestamp: new Date().toISOString(),
            node: 'ada.marina',
            step: 'THINKING',
            content: `Executing Berth Allocation Algorithm v2.1 for specs: ${specs.loa}m x ${specs.beam}m (Draft: ${specs.draft}m)`,
            persona: 'EXPERT'
        });

        const berths = wimMasterData.assets.berth_map;
        
        // Logic: Check VIP first if large
        if (specs.loa > 40) {
             if (berths.VIP.status === 'AVAILABLE' && berths.VIP.depth >= specs.draft) {
                 return { berth: "VIP Quay (V-01)", notes: "Direct approach via main fairway. Pilot mandatory." };
             }
        }
        
        // Logic: Check Pontoons
        if (specs.loa <= 15 && berths.C.status !== 'FULL') return { berth: "Pontoon C-08", notes: "Stern-to mooring. Lazylines available." };
        if (specs.loa <= 20 && berths.B.status !== 'FULL') return { berth: "Pontoon B-12", notes: "Standard stern-to." };
        if (specs.loa <= 25 && berths.A.status !== 'FULL') return { berth: "Pontoon A-04", notes: "Starboard side-to possible." };
        if (specs.loa <= 40 && berths.T.status === 'AVAILABLE') return { berth: "T-Head (T-02)", notes: "Exposed to SW swell. Check weather." };

        // Default/Fallback
        addTrace({
            id: `trace_berth_fail_${Date.now()}`,
            timestamp: new Date().toISOString(),
            node: 'ada.marina',
            step: 'PLANNING',
            content: `Standard berths saturated. Checking overflow capacity...`,
            persona: 'WORKER'
        });

        return { berth: "Transit Quay (Tr-05)", notes: "Temporary allocation. Move required within 24h." };
    }
};