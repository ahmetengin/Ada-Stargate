
import { AgentAction, AgentTraceLog, FlightBooking, HotelBooking, NodeName, TravelItinerary, VipTransfer } from '../../types';
import { marinaExpert } from './marinaAgent'; // Import to check fleet
import { TaskHandlerFn } from '../decomposition/types'; // Import for handlers

// Helper to create a log
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    node,
    step,
    content,
    persona
});

// --- MOCK SUB-AGENTS / PROVIDERS ---
const PROVIDERS = {
    AVIATION: 'Ada.Travel.Adriyatik (IATA)',
    HOTELS: 'Ada.Travel.Tinkon (Global)',
    GROUND: 'WIM VIP Services',
    MARINE: 'WIM Charter Fleet (Operator)'
};

// --- MOCK ITINERARY DATABASE ---
const MOCK_ITINERARIES: TravelItinerary[] = [
    {
        id: 'TRV-2025-001',
        passengerName: 'Ahmet Engin',
        tripName: 'Paris Business Trip',
        status: 'ACTIVE',
        totalCost: 4850,
        flights: [
            {
                id: 'FL-01',
                airline: 'Turkish Airlines',
                flightNumber: 'TK1821',
                departure: { airport: 'IST', time: '2025-11-25 08:30' },
                arrival: { airport: 'CDG', time: '2025-11-25 11:10' },
                status: 'TICKETED',
                provider: PROVIDERS.AVIATION // Sourced via Adriyatik
            },
            {
                id: 'FL-02',
                airline: 'Turkish Airlines',
                flightNumber: 'TK1828',
                departure: { airport: 'CDG', time: '2025-11-28 18:30' },
                arrival: { airport: 'IST', time: '2025-11-28 23:10' },
                status: 'TICKETED',
                provider: PROVIDERS.AVIATION
            }
        ],
        hotels: [
            {
                id: 'HT-01',
                hotelName: 'Mandarin Oriental Paris',
                location: '251 Rue Saint-Honoré',
                checkIn: '2025-11-25',
                checkOut: '2025-11-28',
                roomType: 'Deluxe Suite',
                status: 'CONFIRMED',
                provider: PROVIDERS.HOTELS // Sourced via Tinkon
            }
        ],
        transfers: [
            {
                id: 'TRF-01',
                type: 'CAR',
                vehicle: 'Mercedes-Maybach S580',
                pickup: { location: 'WIM VIP Gate', time: '2025-11-25 06:00' },
                dropoff: { location: 'Istanbul Airport (IST) - CIP Terminal' },
                driverName: 'Murat K.',
                status: 'SCHEDULED',
                provider: PROVIDERS.GROUND
            }
        ]
    }
];

export const kitesExpert = {
    
    // Skill: Get Active Itineraries for UI
    getActiveItineraries: async (passengerName: string = "Ahmet Engin"): Promise<TravelItinerary[]> => {
        return MOCK_ITINERARIES;
    },

    // Skill: Search Flights (Amadeus / Adriyatik Integration)
    searchFlights: async (origin: string, dest: string, date: string, addTrace: (t: AgentTraceLog) => void): Promise<{ success: boolean, results: any[] }> => {
        addTrace(createLog('ada.travel', 'THINKING', `KITES: Requesting flight options from sub-agent '${PROVIDERS.AVIATION}' for ${origin}-${dest}...`, 'EXPERT'));
        
        // Simulate sub-agent interaction
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addTrace(createLog('ada.travel', 'TOOL_EXECUTION', `ADRIYATIK: Querying Amadeus GDS... Found 3 routes.`, 'WORKER'));
        addTrace(createLog('ada.travel', 'OUTPUT', `KITES: Filtered results. Presenting best options.`, 'EXPERT'));

        return {
            success: true,
            results: [
                { airline: 'THY', flight: 'TK1951', price: 1200, class: 'Business', provider: PROVIDERS.AVIATION },
                { airline: 'Private Jet', flight: 'C560XL', price: 12500, class: 'Private', provider: PROVIDERS.AVIATION }
            ]
        };
    },

    // Skill: Book Yacht Charter (Cross-Domain with Marina)
    bookYachtCharter: async (date: string, type: string, addTrace: (t: AgentTraceLog) => void): Promise<{ success: boolean, options: any[], message: string }> => {
        addTrace(createLog('ada.travel', 'THINKING', `KITES: Client requested Yacht Charter for ${date}. Querying WIM Charter Fleet...`, 'EXPERT'));
        
        // 1. Call Marina Agent to find assets (Cross-Agent Call)
        const availableBoats = await marinaExpert.checkCharterFleetAvailability(type, date, addTrace);
        
        if (availableBoats.length === 0) {
            addTrace(createLog('ada.travel', 'ERROR', `No WIM fleet assets available for ${date}.`, 'WORKER'));
            return { success: false, options: [], message: "No charter vessels available for the selected date." };
        }

        // 2. Package as a Travel Product
        const offers = availableBoats.map(boat => ({
            ...boat,
            price_daily: boat.length === '24m' ? 5000 : 2500,
            provider: PROVIDERS.MARINE
        }));

        addTrace(createLog('ada.travel', 'OUTPUT', `KITES: Generated ${offers.length} charter proposals.`, 'EXPERT'));

        const message = `**YACHT CHARTER PROPOSAL**\n\n` +
                        `I have located the following vessels from the **West Istanbul Marina Charter Fleet** available for rental on ${date}:\n\n` +
                        offers.map((o: any) => `1. **${o.name}** (${o.type}, ${o.length})\n   *Capacity: ${o.capacity} Pax*\n   *Rate: €${o.price_daily}/day + VAT*`).join('\n') +
                        `\n\n*All charters are operated by WIM and ticketed by Kites Travel (TÜRSAB A-2648).*`;

        return { success: true, options: offers, message };
    },

    // Skill: Emergency Extraction Protocol (The "Alesta Scenario")
    arrangeEmergencyExit: async (currentLocation: {lat: number, lng: number}, destinationCity: string, addTrace: (t: AgentTraceLog) => void): Promise<{ success: boolean, plan: any, message: string }> => {
        addTrace(createLog('ada.travel', 'THINKING', `🚨 EMERGENCY EXTRACTION: Calculating fastest route to ${destinationCity} from current coordinates...`, 'EXPERT'));

        // 1. Determine Nearest Port (Geo-calc simulation)
        // Assume boat is near Gocek/Fethiye
        const nearestPort = "D-Marin Göcek (Tender Dock)";
        const etaToDock = "45 mins";
        
        addTrace(createLog('ada.travel', 'PLANNING', `Optimal Extraction Point: ${nearestPort}. Directing Vessel Node to divert course.`, 'ORCHESTRATOR'));

        // 2. Find Next Flight
        addTrace(createLog('ada.travel', 'TOOL_EXECUTION', `Scanning flights DLM -> ${destinationCity === 'Istanbul' ? 'IST' : 'SAW'} departing > 90 mins from now...`, 'WORKER'));
        const flight = { airline: "Turkish Airlines", number: "TK2559", time: "21:40", airport: "Dalaman (DLM)" };

        // 3. Arrange Ground Transfer
        addTrace(createLog('ada.travel', 'TOOL_EXECUTION', `Dispatching VIP Mercedes Vito to ${nearestPort}. Driver: Hakan (0532...)`, 'WORKER'));

        const message = `**🚨 EXTRACTION PLAN CONFIRMED**\n\n` +
                        `I have arranged your immediate return to ${destinationCity}.\n\n` +
                        `1. **Course Change:** Captain advised. Diverting to **${nearestPort}**. ETA: ${etaToDock}.\n` +
                        `2. **Ground Transfer:** VIP Transfer (Plate 34 AA 001) will meet you at the pier. Travel time to DLM: 25 mins.\n` +
                        `3. **Flight:** Ticketed on **${flight.airline} ${flight.number}** departing **${flight.time}**.\n\n` +
                        `*Everything is taken care of. Please prepare for disembarkation.*`;

        return { success: true, plan: { flight, nearestPort }, message };
    },

    // Skill: Check TÜRSAB Compliance
    checkCompliance: async (addTrace: (t: AgentTraceLog) => void): Promise<boolean> => {
        addTrace(createLog('ada.travel', 'THINKING', `Verifying TÜRSAB License (No. A-2648) and Travel Insurance status...`, 'EXPERT'));
        // Logic to check compulsory insurance
        return true;
    }
};

// --- Handlers for the Brain ---
export const travelHandlers: Record<string, TaskHandlerFn> = {
    'travel.searchFlights': async (ctx: any, obs: any) => {
        const { origin, dest, date } = obs.payload;
        const result = await kitesExpert.searchFlights(origin, dest, date, () => {});
        return [{
            id: `act_travel_flights_${Date.now()}`,
            kind: 'internal',
            name: 'travel.flightResults',
            params: result
        }];
    },
    'travel.dateDestinationCheck': async (ctx: any, obs: any) => [],
    'travel.generateFlights': async (ctx: any, obs: any) => [],
    'travel.matchHotelTransfer': async (ctx: any, obs: any) => [],
    'travel.buildReservation': async (ctx: any, obs: any) => []
};