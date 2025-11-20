

export enum MessageRole {
  User = 'user',
  Model = 'model',
  System = 'system'
}

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
}

export interface WeatherForecast {
  day: string; // "Today", "Tomorrow", "Monday"
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Storm' | 'Windy';
  windSpeed: number; // Knots
  windDir: string; // NW, N, S
  alertLevel?: 'NONE' | 'ADVISORY' | 'WARNING' | 'CRITICAL';
}

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
// from src/brain/types.ts
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

// --- NEW: MDAP (Task Decomposition) Types ---
// from src/decomposition/types.ts
export interface TaskNode {
  id: string;
  description: string;
  module: 'travel' | 'payment' | 'crm' | 'sea' | 'generic';
  handler: string;
  next: string[];
}

export interface MdapGraph {
  id: string;
  name: string;
  nodes: TaskNode[];
  entryNode: string;
}

export type TaskHandlerFn = (ctx: AgentContext, obs: AgentObservation) => Promise<AgentAction[]>;


// --- NEW: Voting Types ---
// from src/voting/consensus.ts
export type VotingStrategy = 'plurality' | 'softmax_weighted';

export interface Candidate<T> {
  item: T;
  score?: number;
}

// --- NEW: Multi-Agent Observability Types ---
export type AgentPersona = 'ORCHESTRATOR' | 'EXPERT' | 'WORKER';

export interface AgentTraceLog {
  id: string;
  timestamp: string;
  persona: AgentPersona;
  step: 'PLANNING' | 'TOOL_CALL' | 'CODE_OUTPUT' | 'ANALYSIS' | 'FINAL_ANSWER';
  content: string;
  isError?: boolean;
}
