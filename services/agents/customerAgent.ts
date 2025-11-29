
import { AgentAction, AgentTraceLog, NodeName, VesselIntelligenceProfile } from '../../types';
import { wimMasterData } from '../wimMasterData'; // Import for Event Data

// Helper to create a log (copied from orchestratorService.ts for local use)
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    node,
    step,
    content,
    persona
});


// A simple, low-cost Knowledge Base for General Inquiries
const WIM_INFO_DB: Record<string, string> = {
    'arrival': `**West Istanbul Marina - Arrival Procedure**
1.  **VHF Contact:** Before arrival, please call **"West Istanbul Marina"** on VHF Channel **72**.
2.  **Provide Info:** State your vessel's name, length (LOA), beam, and last port of call.
3.  **Follow Pilot:** Our marina tender boat will meet you and guide you to your assigned berth.
4.  **Check-in:** After mooring, please visit the Front Office with your vessel's registration papers, valid insurance policy, and passports/IDs for all crew and passengers.`,
    'wifi': 'Network: **WIM_GUEST** | Pass: **Sailor2025!** (Limit: 5GB/Daily). High-speed Fiber Internet is available on all pontoons.',
    'market': 'Migros Jet: **08:00 - 22:00** (Located behind Block B). Shopping Center also available on-site.',
    'gym': 'Fitness Center: **West Life Sports Club**. Includes Sauna, Indoor & Outdoor Swimming Pools. Tennis, Basketball, and Volleyball courts available.',
    'taxi': 'Taxi Station: +90 212 555 1234 (Gate A pickup). VIP Chauffeur service also available.',
    'pharmacy': 'Pharmacy: "Deniz Eczanesi" located at West Wall mall. Duty pharmacy list available at Security.',
    'restaurant': 'Gastronomy: **Poem, Fersah, Calisto, BigChefs, Happy Moon\'s, Ella Italian, Port of Point, Can Samimiyet, The Roof Kingdom** and many more. Visit **Kumsal Istanbul Street** for street food and entertainment.',
    'fuel': 'Fuel Station (Lukoil): 24/7. Duty-free available with 24h notice.',
    'lift': 'Technical: **700 Ton Travel Lift** (Mega Yachts) and **75 Ton Travel Lift** available. 60.000m2 hardstanding area.',
    'parking': 'Parking: Managed by **ISPARK** in strategic partnership with WIM. 550 vehicle capacity. Marina customers receive complimentary exit validation tokens.'
};

export const customerExpert = {
  // Lightweight Processor for General Info
  handleGeneralInquiry: async (query: string, addTrace: (t: AgentTraceLog) => void): Promise<{ text: string, actions: AgentAction[] }> => {
    
    addTrace(createLog('ada.customer', 'THINKING', `Searching General Info Database for keywords in: "${query}"`, 'WORKER'));

    const lowerQuery = query.toLowerCase();
    let response = "";
    
    const match = Object.keys(WIM_INFO_DB).find(key => lowerQuery.includes(key));

    if (match) {
        response = WIM_INFO_DB[match];
        addTrace(createLog('ada.customer', 'OUTPUT', `Match found for '${match}'.`, 'WORKER'));
    } else {
        if (lowerQuery.includes('food') || lowerQuery.includes('eat') || lowerQuery.includes('restaurant')) response = WIM_INFO_DB['restaurant'];
        else if (lowerQuery.includes('tech') || lowerQuery.includes('repair') || lowerQuery.includes('lift')) response = WIM_INFO_DB['lift'];
        else if (lowerQuery.includes('park') || lowerQuery.includes('car')) response = WIM_INFO_DB['parking'];
        else response = "Specific info not found. Please contact Front Office (09:00-18:00).";
        
        addTrace(createLog('ada.customer', 'OUTPUT', `Direct match processed or fallback used.`, 'WORKER'));
    }

    return {
        text: `**ADA CUSTOMER (INFO DESK):**\n${response}`,
        actions: []
    };
  },

  // Skill: Issue Parking Validation
  issueParkingValidation: async (plateNumber: string | null, addTrace: (t: AgentTraceLog) => void): Promise<{ success: boolean, message: string, actions: AgentAction[] }> => {
      const plate = plateNumber || "34 XX 99";
      addTrace(createLog('ada.customer', 'THINKING', `Processing ISPARK Validation request for Plate: ${plate}...`, 'EXPERT'));
      
      const validationCode = `ISP-${Math.floor(Math.random() * 10000)}-WIM`;
      
      addTrace(createLog('ada.customer', 'TOOL_EXECUTION', `Connecting to ISPARK Gateway... Validation Token Generated.`, 'WORKER'));

      const actions: AgentAction[] = [];
      actions.push({
          id: `ispark_val_${Date.now()}`,
          kind: 'external',
          name: 'ada.external.ispark.validate',
          params: { plate, code: validationCode, status: 'VALID' }
      });

      return {
          success: true,
          message: `**PARKING VALIDATED**\n\nVehicle (**${plate}**) authorized for complimentary exit.\n> **Code:** \`${validationCode}\``,
          actions
      };
  },

  // Skill: Get Upcoming Events
  getUpcomingEvents: async (addTrace: (t: AgentTraceLog) => void): Promise<any[]> => {
      addTrace(createLog('ada.customer', 'THINKING', `Retrieving Social Calendar from Yacht Club Database...`, 'EXPERT'));
      return wimMasterData.event_calendar || [];
  },

  // Skill: Manage Dining Reservations
  manageDiningReservation: async (venueName: string, guests: number, time: string, preOrder: string | null, addTrace: (t: AgentTraceLog) => void): Promise<{ success: boolean, message: string }> => {
      addTrace(createLog('ada.customer', 'THINKING', `Checking availability at ${venueName}...`, 'EXPERT'));
      
      // Special logic for "Can Samimiyet" or others without direct API
      if (venueName.toLowerCase().includes('can samimiyet') || venueName.toLowerCase().includes('samimiyet')) {
          addTrace(createLog('ada.customer', 'OUTPUT', `Manual Concierge Protocol required for ${venueName}.`, 'WORKER'));
          return { 
              success: true, 
              message: `**CONCIERGE REQUEST RECEIVED**\n\nWe do not have a direct digital link with **${venueName}**, but I have instructed the Concierge Desk to call them immediately on your behalf.\n\n> **Action:** Calling +90 53X XXX XX XX\n> **Request:** Table for ${guests} at ${time}.\n\n*You will receive a confirmation SMS shortly.*` 
          };
      }

      // Default Mock for Partners (Poem, Fersah, etc.)
      return { success: true, message: `**RESERVATION CONFIRMED**\n\n📍 **Venue:** ${venueName}\n👥 **Guests:** ${guests}\n⏰ **Time:** ${time}\n\n*Table reserved via Ada.Dining.*` };
  },

  // Skill: Calculate Loyalty Score
  calculateLoyaltyScore: async (imo: string, actionType: string, currentProfile: VesselIntelligenceProfile, addTrace: (t: AgentTraceLog) => void): Promise<{ newScore: number, newTier: any, actions: AgentAction[] }> => {
    let score = currentProfile.loyaltyScore || 500;
    addTrace(createLog('ada.customer', 'THINKING', `Updating loyalty score. Action: ${actionType}`, 'EXPERT'));
    if (actionType === 'PAYMENT_CLEAR') score += 100;
    return { newScore: score, newTier: 'GOLD', actions: [] };
  },

  // Skill: Propose Payment Plan
  proposePaymentPlan: async (vesselProfile: VesselIntelligenceProfile, addTrace: (t: AgentTraceLog) => void): Promise<AgentAction[]> => {
      addTrace(createLog('ada.customer', 'THINKING', `Analyzing payment plan request...`, 'EXPERT'));
      return [{
          id: `cust_pay_plan_${Date.now()}`,
          kind: 'internal',
          name: 'ada.finance.proposePaymentPlan',
          params: { vesselName: vesselProfile.name }
      }];
  },

  // Skill: Check CRM Status (Blacklist Check) - CRITICAL FOR RIGHT OF REFUSAL
  checkBlacklistStatus: async (nameOrId: string, addTrace: (t: AgentTraceLog) => void): Promise<{ status: 'ACTIVE' | 'BLACKLISTED', reason?: string }> => {
      addTrace(createLog('ada.customer', 'THINKING', `Running deep background check on identity: "${nameOrId}" in CRM...`, 'EXPERT'));
      
      // Simulation Logic: Keywords that trigger a blacklist match
      // In production, this queries the CRM/ERP database
      const riskyKeywords = ['problem', 'kara', 'ban', 'debt', 'illegal', 'istenmeyen'];
      const isBlacklisted = riskyKeywords.some(kw => nameOrId.toLowerCase().includes(kw));

      if (isBlacklisted) {
          const reason = "Persona Non Grata: Previous behavioral incident (Article F.5 violation) or Outstanding Debt Write-off.";
          addTrace(createLog('ada.customer', 'WARNING', `BLACKLIST MATCH FOUND. ID: ${nameOrId}. Reason: ${reason}`, 'WORKER'));
          return { status: 'BLACKLISTED', reason };
      }

      addTrace(createLog('ada.customer', 'OUTPUT', `CRM Status: ACTIVE (Clean Record).`, 'WORKER'));
      return { status: 'ACTIVE' };
  }
};
