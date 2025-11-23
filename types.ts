
// types.ts

export enum MessageRole {
  User = 'user',
  Model = 'model',
  System = 'system'
}

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Attachment {
  mimeType: string;
  data: string; // Base64
  name?: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  attachments?: Attachment[];
  timestamp: number;
  isThinking?: boolean; // UI state for ongoing generation
  groundingSources?: GroundingSource[]; // URLs from search
  generatedImage?: string; // Base64 or URL for generated image
}

export enum ModelType {
  Flash = 'gemini-2.5-flash',
  Pro = 'gemini-3-pro-preview', // For complex reasoning
  Image = 'imagen-4.0-generate-001', // For generation
}

export interface AppState {
  messages: Message[];
  isLoading: boolean;
  selectedModel: ModelType;
  useSearch: boolean;
  useThinking: boolean;
}

export enum LiveConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Error = 'error'
}

export interface RegistryEntry {
  id: string;
  timestamp: string;
  vessel: string;
  action: 'CHECK-IN' | 'CHECK-OUT';
  location: string;
  status: 'AUTHORIZED' | 'PENDING' | 'DENIED';
}

export interface Tender {
  id: string;
  name: string;
  status: 'Idle' | 'Busy' | 'Maintenance';
  assignment?: string;
  serviceCount?: number; // Added to track how many boats this tender has served
}

export interface KplerAisTarget {
    id: string;
    vessel_name: string;
    status: 'INBOUND' | 'OUTBOUND' | 'HOLDING' | 'TAXIING' | 'DOCKED' | 'AT_ANCHOR';
    latitude: number;
    longitude: number;
    speed_knots: number;
    course_deg: number;
}


export interface TrafficEntry {
  id: string;
  vessel: string;
  status: 'INBOUND' | 'OUTBOUND' | 'HOLDING' | 'TAXIING' | 'DOCKED' | 'AT_ANCHOR';
  priority: number; 
  sector: string; 
  destination?: string;
  lat?: number;
  lng?: number;
  speedKnots?: number;
  course?: number;
  // NEW: Richer data fields inspired by Kpler MCP
  imo?: string;
  flag?: string;
  nextPort?: string;
  distanceMiles?: number; // Added for proximity search results
}

// NEW: Comprehensive vessel profile based on Kpler MCP capabilities
export interface VesselIntelligenceProfile {
    name: string;
    imo: string;
    type: string;
    flag: string;
    ownerName?: string;
    ownerId?: string;
    ownerEmail?: string;
    ownerPhone?: string;
    dwt?: number; // Deadweight Tonnage
    loa?: number; // Length Overall
    beam?: number;
    status?: string;
    location?: string;
    coordinates?: { lat: number, lng: number };
    voyage?: {
        lastPort: string;
        nextPort: string;
        eta: string;
    };
    outstandingDebt?: number; // Added to store financial status
    paymentHistoryStatus?: 'REGULAR' | 'RECENTLY_LATE' | 'CHRONICALLY_LATE';
    loyaltyScore?: number;
    loyaltyTier?: 'STANDARD' | 'SILVER' | 'GOLD' | 'PROBLEM';
    // NEW: Ada Sea ONE Subscription Status
    adaSeaOneStatus?: 'ACTIVE' | 'INACTIVE' | 'TRIAL';
    // NEW: Smart Energy Management Data
    utilities?: {
        electricityKwh: number;
        waterM3: number;
        lastReading: string;
        status: 'ACTIVE' | 'DISCONNECTED';
    };
}


export interface WeatherForecast {
  day: string; // "Today", "Tomorrow", "Monday"
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Storm' | 'Windy';
  windSpeed: number; // Knots
  windDir: string; // NW, N, S
  alertLevel?: 'NONE' | 'ADVISORY' | 'WARNING' | 'CRITICAL';
}

// --- MAINTENANCE TYPES ---
export interface MaintenanceJob {
    id: string;
    vesselName: string;
    jobType: 'HAUL_OUT' | 'ENGINE_SERVICE' | 'HULL_WASH' | 'ELECTRICAL' | 'PAINT' | 'GENERAL_REPAIR';
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED';
    scheduledDate: string;
    contractor: string; // e.g., "WIM Tech", "Bilgin Yachts", "External"
    partsStatus?: 'N/A' | 'ORDERED' | 'ARRIVED' | 'INSTALLED';
    notes?: string;
}

// --- AUTHENTICATION & ROLES ---
export type UserRole = 'GUEST' | 'CAPTAIN' | 'GENERAL_MANAGER';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  clearanceLevel: number; // 0: Public, 1: Own Asset, 5: God Mode
  legalStatus?: 'GREEN' | 'AMBER' | 'RED'; // GREEN: Good, AMBER: Warning, RED: Breach/Debt
  contractId?: string;
}

// --- NEW: CoALA (Cognition-Action-Loop-Agent) Types ---
export type MemoryType = 'working' | 'episodic' | 'semantic' | 'procedural';

export interface MemoryItem {
  id: string;
  type: MemoryType;
  timestamp: number;
  key: string;
  data: any;
  tags?: string[];
}

export interface AgentObservation {
  source: 'user' | 'api' | 'sensor' | 'internal';
  payload: any;
  timestamp: number;
}

export interface AgentAction {
  id: string;
  kind: 'internal' | 'external';
  name: string;
  params: any;
}

export interface DecisionStepLog {
  step: number;
  observation: AgentObservation;
  chosenAction: AgentAction;
  reasoningTrace?: string;
}

export interface AgentContext {
  workingMemory: MemoryItem[];
  episodicMemory: MemoryItem[];
  semanticMemory: MemoryItem[];
  proceduralMemory: MemoryItem[];
}

// --- NEW: Agent Orchestration Types ---
export type NodeName = 'ada.marina' | 'ada.finance' | 'ada.legal' | 'ada.sea' | 'ada.customer' | 'ada.passkit' | 'ada.vhf' | 'ada.security' | 'ada.weather' | 'ada.technic' | 'ada.travel' | 'ada.congress' | 'ada.facility' | 'ada.hr' | 'ada.commercial' | 'ada.analytics' | 'ada.berth' | 'ada.reservations';

export type AgentPersona = 'ORCHESTRATOR' | 'EXPERT' | 'WORKER';

export interface AgentTraceLog {
  id: string;
  timestamp: string;
  node: NodeName;
  step: 'ROUTING' | 'THINKING' | 'TOOL_EXECUTION' | 'OUTPUT' | 'ERROR' | 'TOOL_CALL' | 'CODE_OUTPUT' | 'PLANNING' | 'FINAL_ANSWER' | 'WARNING';
  content: string;
  metadata?: any;
  isError?: boolean;
  persona?: AgentPersona;
}

export interface OrchestratorResponse {
    text: string;
    actions: AgentAction[];
    traces: AgentTraceLog[];
}

// --- NEW: Finance Types ---
export interface Invoice {
    id: string;
    provider: 'PARASUT';
    amount: number;
    currency: 'TRY' | 'EUR';
    status: 'DRAFT' | 'PAID' | 'OVERDUE';
    vesselId: string;
}

export interface PaymentLink {
    id: string;
    provider: 'IYZICO';
    url: string;
    status: 'PENDING' | 'SUCCESS';
}

export interface PassKit {
    id: string;
    holder: string;
    vessel: string;
    accessLevel: string;
    validUntil: string;
    qrCode?: string;
}

export interface VesselSystemsStatus {
    battery: {
        serviceBank: number; // Volts
        engineBank: number; // Volts
        status: 'CHARGING' | 'DISCHARGING' | 'CRITICAL';
    };
    tanks: {
        fuel: number; // Percentage
        freshWater: number; // Percentage
        blackWater: number; // Percentage
    };
    bilge: {
        forward: 'DRY' | 'WET';
        aft: 'DRY' | 'WET';
        pumpStatus: 'AUTO' | 'RUNNING';
    };
    shorePower: {
        connected: boolean;
        voltage: number;
        amperage: number;
    };
    // NEW: Comfort & Security Controls (Ada Sea ONE)
    comfort?: {
        climate: {
            zone: string;
            setPoint: number;
            currentTemp: number;
            mode: 'COOL' | 'HEAT' | 'AUTO' | 'OFF';
            fanSpeed: 'LOW' | 'MED' | 'HIGH';
        };
        lighting: {
            salon: boolean;
            deck: boolean;
            underwater: boolean;
        };
        security: {
            mode: 'ARMED' | 'DISARMED' | 'STAY';
            camerasActive: boolean;
        };
    };
}

// --- NEW: TRAVEL TYPES ---
export interface FlightBooking {
    id: string;
    airline: string;
    flightNumber: string;
    departure: { airport: string, time: string };
    arrival: { airport: string, time: string };
    status: 'CONFIRMED' | 'TICKETED' | 'PENDING';
    provider?: string; // e.g. 'ada.travel.adriyatik'
}

export interface HotelBooking {
    id: string;
    hotelName: string;
    location: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
    status: 'CONFIRMED' | 'PENDING';
    provider?: string; // e.g. 'ada.travel.tinkon'
}

export interface VipTransfer {
    id: string;
    type: 'CAR' | 'HELICOPTER' | 'BOAT';
    vehicle: string;
    pickup: { location: string, time: string };
    dropoff: { location: string };
    driverName?: string;
    status: 'SCHEDULED' | 'EN_ROUTE' | 'COMPLETED';
    provider?: string;
}

export interface TravelItinerary {
    id: string;
    passengerName: string;
    tripName: string;
    flights: FlightBooking[];
    hotels: HotelBooking[];
    transfers: VipTransfer[];
    status: 'ACTIVE' | 'DRAFT' | 'COMPLETED';
    totalCost?: number;
}

// --- NEW: CONGRESS TYPES ---
export interface CongressEvent {
    id: string;
    name: string;
    dates: { start: string, end: string };
    venues: string[];
    status: 'PLANNING' | 'LIVE' | 'COMPLETED';
    delegateCount: number;
}

export interface Delegate {
    id: string;
    name: string;
    company: string;
    status: 'REGISTERED' | 'CHECKED_IN' | 'IN_TRANSIT' | 'NO_SHOW';
    location: string;
}