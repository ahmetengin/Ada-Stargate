
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

// NEW: Traffic Control (ATC)
export interface TrafficEntry {
  id: string;
  vessel: string;
  status: 'INBOUND' | 'OUTBOUND' | 'HOLDING' | 'TAXIING' | 'DOCKED';
  priority: number; // 1 (Emergency) - 5 (Pleasure)
  sector: string; // e.g., "Entrance", "Sector Zulu"
}

// NEW: Weather Station
export interface WeatherForecast {
  day: string; // "Today", "Tomorrow", "Monday"
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Storm' | 'Windy';
  windSpeed: number; // Knots
  windDir: string; // NW, N, S
  alertLevel?: 'NONE' | 'ADVISORY' | 'WARNING' | 'CRITICAL';
}

// NEW: Identity & Access Management
export type UserRole = 'GUEST' | 'CAPTAIN' | 'GENERAL_MANAGER';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  clearanceLevel: number; // 0: Public, 1: Own Asset, 5: God Mode
  legalStatus?: 'GREEN' | 'AMBER' | 'RED'; // GREEN: Good, AMBER: Warning, RED: Breach/Debt
  contractId?: string;
}
