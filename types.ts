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
}

export interface TrafficEntry {
  id: string;
  vessel: string;
  status: 'INBOUND' | 'OUTBOUND' | 'HOLDING' | 'TAXIING' | 'DOCKED';
  priority: number; // 1 (Emergency) - 5 (Pleasure)
  sector: string; // e.g., "Entrance", "Sector Zulu"
  destination?: string;
}

export interface WeatherForecast {
  day: string; // "Today", "Tomorrow", "Monday"
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Storm' | 'Windy';
  windSpeed: number; // Knots
  windDir: string; // NW, N, S
  alertLevel?: 'NONE' | 'ADVISORY' | 'WARNING' | 'CRITICAL';
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
export type NodeName = 'ada.marina' | 'ada.finance' | 'ada.legal' | 'ada.sea' | 'ada.customer' | 'ada.passkit';

export type AgentPersona = 'ORCHESTRATOR' | 'EXPERT' | 'WORKER';

export interface AgentTraceLog {
  id: string;
  timestamp: string;
  node: NodeName;
  step: 'ROUTING' | 'THINKING' | 'TOOL_EXECUTION' | 'OUTPUT' | 'ERROR' | 'TOOL_CALL' | 'CODE_OUTPUT' | 'PLANNING' | 'FINAL_ANSWER';
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