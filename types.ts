
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

// NEW: Dedicated VHF Log Type
export interface VhfLog {
    id: string;
    timestamp: string;
    channel: string;
    speaker: 'VESSEL' | 'CONTROL';
    message: string;
}

export interface Tender {
  id: string;
  name: string;
  callsign?: string; // Added for display
  status: 'Idle' | 'Busy' | 'Maintenance';
  assignment?: string;
  serviceCount?: number; 
}

export interface AisTarget {
    name: string;
    type: string;
    distance: string;
    squawk: string;
    status: string;
    coordinates: { lat: number; lng: number; };
    speed: string;
    course?: number;
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
  imo?: string;
  flag?: string;
  nextPort?: string;
  distanceMiles?: number; 
}

// --- CRM & ASSET MANAGEMENT TYPES (UPDATED) ---

// 1. The Customer (Cari Hesap / Gerçek veya Tüzel Kişi)
export interface CustomerProfile {
    id: string; // "CUST_001"
    name: string;
    type: 'INDIVIDUAL' | 'COMPANY';
    contact: { phone: string; email: string };
    loyaltyScore: number;
    status: 'ACTIVE' | 'BLACKLISTED';
}

// 2. The Contract (Hukuki Bağ)
export interface Contract {
    id: string; // "CNT-2025-001"
    type: 'MOORING' | 'LIFTING' | 'COMMERCIAL_LEASE';
    status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'CANCELLED';
    dateRange: { start: string; end: string }; // e.g., 12 months
    vesselImo: string; // Links to Asset
    
    // Many-to-Many Ownership / Signatories
    signatories: {
        customerId: string;
        role: 'OWNER' | 'PARTNER' | 'CAPTAIN' | 'PAYER';
        sharePercentage?: number; // e.g., 50%
    }[];

    financialStatus: 'PAID' | 'PARTIAL' | 'DEBT';
    notes?: string;
}

// 3. The Asset (Vessel Intelligence - Expanded)
export interface VesselIntelligenceProfile {
    name: string;
    imo: string;
    type: string;
    flag: string;
    
    // Ownership Structure (Reflects CRM links)
    partners?: { name: string; share: number }[]; 
    primaryContactId?: string; 

    // Legacy fields kept for compatibility
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
    
    // Active Contract Reference
    activeContractId?: string; 

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
export interface MaintenanceLogEntry {
    timestamp: string;
    stage: 'SCHEDULED' | 'PARTS_ORDERED' | 'PARTS_ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    details: string;
    user?: string; // Who triggered it
}

export interface MaintenanceJob {
    id: string;
    vesselName: string;
    jobType: 'HAUL_OUT' | 'ENGINE_SERVICE' | 'HULL_WASH' | 'ELECTRICAL' | 'PAINT' | 'GENERAL_REPAIR';
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED';
    scheduledDate: string;
    contractor: string; // e.g., "WIM Tech", "Bilgin Yachts", "External"
    partsStatus?: 'N/A' | 'ORDERED' | 'ARRIVED' | 'INSTALLED';
    notes?: string;
    logs: MaintenanceLogEntry[]; // Detailed transaction history
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
  step: 'ROUTING' | 'THINKING' | 'TOOL_EXECUTION' | 'OUTPUT' | 'ERROR' | 'TOOL_CALL' | 'CODE_OUTPUT' | 'PLANNING' | 'FINAL_ANSWER' | 'WARNING' | 'VOTING';
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

// --- NEW: GUEST IDENTITY TYPES (LAW 1774) ---
export interface GuestProfile {
    id: string; // Passport or TCKN
    fullName: string;
    nationality: string;
    dob: string;
    vesselName: string; // The host vessel
    status: 'CHECKED_IN' | 'CHECKED_OUT';
    entryDate: string;
    kbsNotificationId?: string; // KBS: Kimlik Bildirim Sistemi ID
}

export interface CheckInRecord {
    id: string;
    guest: GuestProfile;
    timestamp: string;
    gate: string;
    passKitUrl?: string;
}
