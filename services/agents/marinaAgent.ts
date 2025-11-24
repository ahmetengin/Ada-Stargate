
import { TaskHandlerFn } from '../decomposition/types';
import { AgentAction, AgentTraceLog, VesselIntelligenceProfile, NodeName, Tender, VesselSystemsStatus } from '../../types';
import { wimMasterData } from '../wimMasterData';
import { haversineDistance, getCurrentMaritimeTime } from '../utils';
import { persistenceService, STORAGE_KEYS } from '../persistence'; 
import { checkBackendHealth, invokeAgentSkill } from '../api'; // Import API helpers

// Helper to create a log
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: getCurrentMaritimeTime(),
    node,
    step,
    content,
    persona
});

// --- DEFAULT FLEET DATA ---
const DEFAULT_FLEET: VesselIntelligenceProfile[] = [
    { 
        name: 'S/Y Phisedelia', imo: '987654321', type: 'VO65 Racing Yacht (ex-Mapfre)', flag: 'MT', 
        ownerName: 'Ahmet Engin', ownerId: '12345678901', ownerEmail: 'ahmet.engin@example.com', ownerPhone: '+905321234567',
        dwt: 150, loa: 20.4, beam: 5.6, status: 'INBOUND', location: 'Marmara Approach', 
        coordinates: { lat: 40.8500, lng: 28.6200 }, // 10nm out
        voyage: { lastPort: 'Alicante', nextPort: 'WIM', eta: 'Today 14:00' },
        paymentHistoryStatus: 'REGULAR',
        adaSeaOneStatus: 'INACTIVE', 
        utilities: { electricityKwh: 450.2, waterM3: 12.5, lastReading: 'Today 08:00', status: 'ACTIVE' }
    },
    { 
        name: 'M/Y Blue Horizon', imo: '123456789', type: 'Motor Yacht', flag: 'KY', 
        ownerName: 'Jane Smith', ownerId: '98765432109', ownerEmail: 'jane.smith@example.com', ownerPhone: '+447911123456',
        dwt: 300, loa: 24.0, beam: 6.1, status: 'DOCKED', location: 'Pontoon A-05', 
        coordinates: { lat: 40.9640, lng: 28.6295 }, 
        voyage: { lastPort: 'Monaco', nextPort: 'WIM', eta: 'N/A' },
        adaSeaOneStatus: 'ACTIVE',
        utilities: { electricityKwh: 1200.5, waterM3: 45.0, lastReading: 'Today 08:00', status: 'ACTIVE' }
    },
    { 
        name: 'S/Y Mistral', imo: '555666777', type: 'Sailing Yacht', flag: 'TR', 
        dwt: 120, loa: 14.2, beam: 4.1, status: 'AT_ANCHOR', location: 'Sector Zulu', 
        coordinates: { lat: 40.9500, lng: 28.6300 }, 
        voyage: { lastPort: 'Bodrum', nextPort: 'WIM', eta: 'N/A' },
        utilities: { electricityKwh: 0, waterM3: 0, lastReading: 'Disconnected', status: 'DISCONNECTED' }
    },
    { 
        name: 'M/Y Poseidon', imo: '888999000', type: 'Superyacht', flag: 'BS', 
        ownerName: 'Michael Johnson', ownerId: 'A123B456C',
        dwt: 499, loa: 32.5, beam: 7.8, status: 'DOCKED', location: 'VIP Quay', 
        coordinates: { lat: 40.9650, lng: 28.6270 }, 
        voyage: { lastPort: 'Antalya', nextPort: 'Dubrovnik', eta: '2025-11-28' },
        adaSeaOneStatus: 'ACTIVE',
        utilities: { electricityKwh: 3500.0, waterM3: 120.0, lastReading: 'Today 08:05', status: 'ACTIVE' }
    }
];

// --- LOAD FROM PERSISTENCE ---
let FLEET_DB: VesselIntelligenceProfile[] = persistenceService.load(STORAGE_KEYS.FLEET, DEFAULT_FLEET);
persistenceService.save(STORAGE_KEYS.FLEET, FLEET_DB);

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
  return [{
    id: `act_${Date.now()}`,
    kind: 'external',
    name: 'marina.dispatchTender',
    params: { tenderId: 'T-01', vessel: 'S/Y Phisedelia' },
  }];
};

export const marinaHandlers: Record<string, TaskHandlerFn> = {
  'marina.identifyVessel': identifyVessel,
  'marina.dispatchTender': dispatchTender,
};

// --- DIRECT AGENT INTERFACE ---
export const marinaExpert = {
    
    getAllFleetVessels: (): VesselIntelligenceProfile[] => {
        return FLEET_DB;
    },
    
    getVesselIntelligence: async (vesselName: string): Promise<VesselIntelligenceProfile | undefined> => {
        if (!vesselName) return undefined;
        return FLEET_DB.find(v => v.name.toLowerCase().includes(vesselName.toLowerCase()));
    },

    // --- HYBRID TELEMETRY FETCH (PYTHON FIRST, MOCK FALLBACK) ---
    getVesselTelemetry: async (vesselName: string): Promise<VesselSystemsStatus | null> => {
        
        // 1. Try Python Backend (Real IoT/Database)
        const isBackendUp = await checkBackendHealth();
        if (isBackendUp) {
            const remoteData = await invokeAgentSkill('marina', 'get_telemetry', { vessel_name: vesselName });
            if (remoteData) {
                console.log(`[Telemetry] Received live data for ${vesselName} from Python backend.`);
                return remoteData as VesselSystemsStatus;
            }
        }

        // 2. Local Simulation Fallback
        console.info(`[Telemetry] Backend offline. Using local simulation for ${vesselName}.`);
        
        return {
            battery: { serviceBank: 25.4, engineBank: 26.1, status: 'DISCHARGING' },
            tanks: { fuel: 45, freshWater: 80, blackWater: 15 },
            bilge: { forward: 'DRY', aft: 'DRY', pumpStatus: 'AUTO' },
            shorePower: { connected: true, voltage: 228, amperage: 12.5 },
            // IoT Status (Ada Sea ONE)
            comfort: {
                climate: { zone: 'Salon', setPoint: 21, currentTemp: 24, mode: 'OFF', fanSpeed: 'LOW' },
                lighting: { salon: false, deck: false, underwater: false },
                security: { mode: 'ARMED', camerasActive: true }
            }
        };
    },

    // To update status locally for the demo
    activateAdaSeaOne: async (vesselName: string) => {
        const idx = FLEET_DB.findIndex(v => v.name.toLowerCase().includes(vesselName.toLowerCase()));
        if (idx >= 0) {
            FLEET_DB[idx].adaSeaOneStatus = 'ACTIVE';
            persistenceService.save(STORAGE_KEYS.FLEET, FLEET_DB);
        }
    },

    // ATC Radar Scan (20nm radius + Ambarlı Commercial Traffic)
    scanSector: async (lat: number, lng: number, radiusMiles: number, addTrace: (t: AgentTraceLog) => void): Promise<any[]> => {
        addTrace(createLog('ada.marina', 'TOOL_EXECUTION', `Scanning Radar Sector: ${radiusMiles}nm radius around ${lat}, ${lng}...`, 'WORKER'));
        
        // 1. WIM Fleet (AIS)
        const fleet = FLEET_DB.filter(v => {
            if (!v.coordinates) return false;
            const dist = haversineDistance(lat, lng, v.coordinates.lat, v.coordinates.lng);
            return dist <= radiusMiles;
        }).map(v => ({
            name: v.name,
            type: v.type,
            distance: haversineDistance(lat, lng, v.coordinates!.lat, v.coordinates!.lng).toFixed(1),
            squawk: '1200', // VFR Standard
            status: v.status,
            coordinates: v.coordinates
        }));

        // 2. Ambarlı Commercial Traffic (Simulated Injection)
        const commercialTraffic = [
            { name: "M/V MSC Gulsun", type: "Container Ship", distance: "4.2", squawk: "7700", status: "CROSSING", speed: "14kn", coordinates: { lat: 40.9200, lng: 28.6100 } },
            { name: "M/T Torm Republican", type: "Chemical Tanker", distance: "6.5", squawk: "2305", status: "ANCHORED", speed: "0kn", coordinates: { lat: 40.9000, lng: 28.6000 } }
        ];

        addTrace(createLog('ada.marina', 'OUTPUT', `Radar Contact: ${fleet.length} WIM vessels + ${commercialTraffic.length} Commercial Targets (Ambarlı).`, 'WORKER'));
        
        return [...fleet, ...commercialTraffic];
    },

    // Alias for findVesselsNear to use scanSector logic
    findVesselsNear: async (lat: number, lng: number, radiusMiles: number, addTrace: (t: AgentTraceLog) => void): Promise<any[]> => {
        return marinaExpert.scanSector(lat, lng, radiusMiles, addTrace);
    },

    // NEW: Capability to check WIM Charter Fleet Availability for Kites Travel
    checkCharterFleetAvailability: async (type: string, date: string, addTrace: (t: AgentTraceLog) => void): Promise<any[]> => {
        addTrace(createLog('ada.marina', 'THINKING', `Checking availability of Marina-owned charter assets for ${date}...`, 'EXPERT'));
        
        // In a real system, this would check a booking calendar database.
        // Here we filter wimMasterData.assets.charter_fleet
        
        const fleet = wimMasterData.assets.charter_fleet || [];
        const available = fleet.filter(boat => boat.status === 'Available');
        
        addTrace(createLog('ada.marina', 'OUTPUT', `Found ${available.length} available charter vessels in WIM Registry.`, 'WORKER'));
        return available;
    },

    // Proactive Hailing Logic - The "Welcome Home" Protocol
    generateProactiveHail: async (vesselName: string): Promise<string> => {
        // This simulates checking the "Concierge Database"
        const profile = await marinaExpert.getVesselIntelligence(vesselName);
        const berth = profile?.location || "C-12"; 
        
        // The "WIM Gold Standard" Message
        return `**PROACTIVE HAIL [CH 72]:**
> **"West Istanbul Marina calling ${vesselName}. Welcome home, Captain."**
> "We have visual on AIS at 20nm. Your berth at **${berth}** is prepped, shore power is ready, and your linesmen are standing by."
> "Tender **ada.sea.wimBravo** has been dispatched to escort you in for a seamless entry. Do you require a golf cart at the pontoon. Over."`;
    },

    // ATC Priority Calculator
    calculateTrafficPriority: (vessel: VesselIntelligenceProfile | undefined, context?: { isMedical?: boolean, isFuelCritical?: boolean }): number => {
        if (context?.isMedical) return 1; // LEVEL 1: Emergency
        if (context?.isFuelCritical) return 2; // LEVEL 2: Distress
        
        if (!vessel) return 5;
        if (vessel.type.includes('VO65') || vessel.type === 'Superyacht') return 4; // VIP & Racing
        if (vessel.type === 'State' || vessel.type === 'Coast Guard') return 1; 
        return 5; // Standard Pleasure Craft
    },

    // ATC Departure Protocol (Strict)
    processDeparture: async (vesselName: string, currentTenders: Tender[], addTrace: (t: AgentTraceLog) => void): Promise<{ success: boolean, message: string, actions: AgentAction[], tender?: Tender, squawk?: string }> => {
        
        const vesselProfile = await marinaExpert.getVesselIntelligence(vesselName);
        const priority = marinaExpert.calculateTrafficPriority(vesselProfile);
        const squawk = Math.floor(4000 + Math.random() * 1000).toString(); // ATC Assigns discrete code

        addTrace(createLog('ada.marina', 'THINKING', `[ATC] FLIGHT PLAN: ${vesselName} | REQ: DEPARTURE | PRIORITY: ${priority}`, 'EXPERT'));

        // 1. Check Commercial Traffic (Ambarlı Conflict)
        const commercialTraffic = await marinaExpert.scanSector(wimMasterData.identity.location.coordinates.lat, wimMasterData.identity.location.coordinates.lng, 5, () => {});
        if (commercialTraffic.some(t => t.type.includes('Container') && parseFloat(t.distance) < 2)) {
             addTrace(createLog('ada.marina', 'WARNING', `[ATC] CONFLICT ALERT: Heavy traffic in Fairway. Holding departure.`, 'WORKER'));
             return {
                 success: false,
                 message: "NEGATIVE. Traffic Conflict. Heavy commercial traffic (Ambarlı) in departure sector. Hold position.",
                 actions: []
             };
        }

        // 2. Find Tender
        const availableTender = currentTenders.find(t => t.status === 'Idle');
        if (!availableTender) {
            addTrace(createLog('ada.marina', 'WARNING', `[ATC-GND] GROUND STOP: No Tenders available.`, 'WORKER'));
            return {
                success: false,
                message: "NEGATIVE. Ground Stop. All assets engaged. Standby for sequence.",
                actions: []
            };
        }

        addTrace(createLog('ada.marina', 'TOOL_EXECUTION', `[ATC-GND] Reserving ${availableTender.name} for ${vesselName} maneuver.`, 'WORKER'));

        const actions: AgentAction[] = [];
        actions.push({
            id: `marina_dept_${Date.now()}`,
            kind: 'external',
            name: 'ada.marina.tenderReserved',
            params: { 
                tenderId: availableTender.id,
                tenderName: availableTender.name, 
                mission: 'DEPARTURE_ASSIST',
                vessel: vesselName
            }
        });

        actions.push({
            id: `marina_traffic_${Date.now()}`,
            kind: 'internal',
            name: 'ada.marina.updateTrafficStatus',
            params: {
                vessel: vesselName,
                status: 'TAXIING',
                destination: 'SEA',
                squawk: squawk,
                priority: priority
            }
        });

        // Log the Tender Reservation explicitly
        actions.push({
            id: `marina_log_${Date.now()}`,
            kind: 'internal',
            name: 'ada.marina.log_operation',
            params: {
                message: `[ATC-DEP] TENDER RESERVED | AST:${availableTender.name.toUpperCase()} -> VS:${vesselName.toUpperCase()} | CH:14`,
                type: 'info'
            }
        });

        return {
            success: true,
            message: "Cleared for Departure.",
            tender: availableTender,
            squawk: squawk,
            actions: actions
        };
    },

    // ATC Arrival Protocol
    processArrival: async (vesselName: string, currentTenders: Tender[], addTrace: (t: AgentTraceLog) => void): Promise<{ success: boolean, message: string, actions: AgentAction[], tender?: Tender, squawk?: string }> => {
        
        const vesselProfile = await marinaExpert.getVesselIntelligence(vesselName);
        const priority = marinaExpert.calculateTrafficPriority(vesselProfile);
        const squawk = Math.floor(1000 + Math.random() * 8999).toString(); 
        const berth = "Pontoon C-12"; 

        addTrace(createLog('ada.marina', 'THINKING', `[ATC-APP] RADAR CONTACT: ${vesselName} | RANGE: 5nm | INBOUND`, 'EXPERT'));

        const availableTender = currentTenders.find(t => t.status === 'Idle');

        if (!availableTender) {
             addTrace(createLog('ada.marina', 'WARNING', `[ATC-APP] No approach assets. Diverting to Sector Zulu.`, 'WORKER'));
             return {
                 success: false,
                 message: `NEGATIVE. Approach denied. Proceed to **Sector Zulu** (Holding Area). Monitor Ch 14.`,
                 actions: []
             };
        }

        addTrace(createLog('ada.marina', 'TOOL_EXECUTION', `[ATC-APP] Reserving ${availableTender.name} for arrival escort.`, 'WORKER'));

        const actions: AgentAction[] = [];
        actions.push({
            id: `marina_arr_${Date.now()}`,
            kind: 'external',
            name: 'ada.marina.tenderReserved',
            params: { 
                tenderId: availableTender.id,
                tenderName: availableTender.name, 
                mission: 'ARRIVAL_PILOT',
                vessel: vesselName
            }
        });

        actions.push({
            id: `marina_traffic_arr_${Date.now()}`,
            kind: 'internal',
            name: 'ada.marina.updateTrafficStatus',
            params: {
                vessel: vesselName,
                status: 'INBOUND',
                destination: berth,
                squawk: squawk,
                priority: priority
            }
        });

        actions.push({
            id: `marina_log_arr_${Date.now()}`,
            kind: 'internal',
            name: 'ada.marina.log_operation',
            params: {
                message: `[ATC-ARR] TENDER RESERVED | AST:${availableTender.name.toUpperCase()} -> VS:${vesselName.toUpperCase()} | GATE:${berth}`,
                type: 'info'
            }
        });

        return {
            success: true,
            message: "Cleared for Approach.",
            tender: availableTender,
            squawk: squawk,
            actions: actions
        };
    }
};
