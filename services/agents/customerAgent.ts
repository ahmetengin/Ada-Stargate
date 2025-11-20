// services/agents/customerAgent.ts

import { AgentAction, AgentTraceLog, NodeName, VesselIntelligenceProfile } from '../../types';

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
// In a real scenario, this could be a simple SQL query or a cheap LLM (Gemini Flash) call.
const WIM_INFO_DB: Record<string, string> = {
    'arrival': `**West Istanbul Marina - Arrival Procedure**
1.  **VHF Contact:** Before arrival, please call **"West Istanbul Marina"** on VHF Channel **72**.
2.  **Provide Info:** State your vessel's name, length (LOA), beam, and last port of call.
3.  **Follow Pilot:** Our marina tender boat will meet you and guide you to your assigned berth.
4.  **Check-in:** After mooring, please visit the Front Office with your vessel's registration papers, valid insurance policy, and passports/IDs for all crew and passengers.`,
    'procedure': `**West Istanbul Marina - Arrival Procedure**
1.  **VHF Contact:** Before arrival, please call **"West Istanbul Marina"** on VHF Channel **72**.
2.  **Provide Info:** State your vessel's name, length (LOA), beam, and last port of call.
3.  **Follow Pilot:** Our marina tender boat will meet you and guide you to your assigned berth.
4.  **Check-in:** After mooring, please visit the Front Office with your vessel's registration papers, valid insurance policy, and passports/IDs for all crew and passengers.`,
    'wifi': 'Network: **WIM_GUEST** | Pass: **Sailor2025!** (Limit: 5GB/Daily). High-speed Fiber Internet is available on all pontoons.',
    'market': 'Migros Jet: **08:00 - 22:00** (Located behind Block B). Shopping Center also available on-site.',
    'gym': 'Fitness Center: **West Life Sports Club**. Includes Sauna, Indoor & Outdoor Swimming Pools. Tennis, Basketball, and Volleyball courts available.',
    'taxi': 'Taxi Station: +90 212 555 1234 (Gate A pickup). VIP Chauffeur service also available.',
    'pharmacy': 'Pharmacy: "Deniz Eczanesi" located at West Wall mall. Duty pharmacy list available at Security.',
    'restaurant': 'Gastronomy: **Poem, Fersah, Calisto, BigChefs, Happy Moon\'s, Ella Italian, Port of Point, The Roof Kingdom** and many more. Visit **Kumsal Istanbul Street** for street food and entertainment.',
    'beach': 'Beach: **Kumsal Beach** and **Mask Beach** are available for swimming and entertainment.',
    'fuel': 'Fuel Station (Lukoil): 24/7. Duty-free available with 24h notice.',
    'water': 'Water: Pre-paid cards available at Front Office. 1 Unit = €3.50',
    'electric': 'Electricity: 16A/32A/63A/125A available. Metered billing.',
    'laundry': 'Laundry & Dishwashing service available. Pick-up 09:00, Delivery 18:00. Call Ch 11.',
    'garbage': 'Garbage Collection: Daily 08:00 & 16:00. Leave bags on pontoon. Eco-friendly waste separation active.',
    'office': 'Front Office: 09:00 - 18:00. VHF Ch 72.',
    'hours': 'Front Office: 09:00 - 18:00. Most restaurants are open until 00:00. Please check with the specific venue.',
    'atm': 'ATMs: **Garanti BBVA**, Is Bank, Yapi Kredi (Entrance Plaza).',
    'lift': 'Technical: **700 Ton Travel Lift** (Mega Yachts) and **75 Ton Travel Lift** available. 60.000m2 hardstanding area.',
    'heli': 'Helipad available for VIP transfers. Coordinate with Security on Ch 72.',
    'academy': 'Education: **Paris Saint-Germain Academy Beylikdüzü** for football. Sailing School (TYF/RYA) also available.'
};

export const customerAgent = {
  // Lightweight Processor for General Info
  handleGeneralInquiry: async (query: string, addTrace: (t: AgentTraceLog) => void): Promise<{ text: string, actions: AgentAction[] }> => {
    
    addTrace(createLog('ada.customer', 'THINKING', `Searching General Info Database for keywords in: "${query}"`, 'WORKER'));

    const lowerQuery = query.toLowerCase();
    let response = "";
    
    // Simple Keyword Matching (Simulating a cheap search algorithm)
    const match = Object.keys(WIM_INFO_DB).find(key => lowerQuery.includes(key));

    if (match) {
        response = WIM_INFO_DB[match];
        addTrace(createLog('ada.customer', 'OUTPUT', `Match found for '${match}'.`, 'WORKER'));
    } else {
        // Fallback to a generic helpful response if specific keyword not found, but hint at categories
        if (lowerQuery.includes('food') || lowerQuery.includes('eat') || lowerQuery.includes('restaurant')) {
             response = WIM_INFO_DB['restaurant'];
        } else if (lowerQuery.includes('tech') || lowerQuery.includes('repair') || lowerQuery.includes('lift')) {
             response = WIM_INFO_DB['lift'];
        } else if (lowerQuery.includes('swim') || lowerQuery.includes('beach')) {
             response = WIM_INFO_DB['beach'];
        } else if (lowerQuery.includes('sport') || lowerQuery.includes('football')) {
             response = WIM_INFO_DB['academy'];
        } else {
             response = "Specific info not found. Please contact Front Office (09:00-18:00) or check the WIM App. Available topics: Wifi, Market, Gym, Taxi, Restaurants, Fuel, Lift, Beach.";
        }
        
        addTrace(createLog('ada.customer', 'OUTPUT', `Direct match processed or fallback used.`, 'WORKER'));
    }

    return {
        text: `**ADA CUSTOMER (INFO DESK):**\n${response}`,
        actions: []
    };
  },

  // Skill: Propose Payment Plan (New)
  proposePaymentPlan: async (vesselProfile: VesselIntelligenceProfile, addTrace: (t: AgentTraceLog) => void): Promise<AgentAction[]> => {
      addTrace(createLog('ada.customer', 'THINKING', `Analyzing payment plan request for ${vesselProfile.name}...`, 'EXPERT'));

      let recommendationToGM = "Standard payment plan (3 installments).";
      let customerMessage = `We understand you are facing difficulties. We can offer a payment plan for your outstanding balance.`;

      // Simulate logic based on payment history and loyalty (once added to profile)
      if (vesselProfile.paymentHistoryStatus === 'OVERDUE') {
          recommendationToGM = "Strict payment plan (immediate deposit, 2 installments).";
          customerMessage = `Due to your overdue status, we require an immediate deposit to initiate a payment plan.`;
      } else if (vesselProfile.paymentHistoryStatus === 'RECENTLY_LATE') {
          recommendationToGM = "Flexible payment plan (4 installments, 30-day grace period).";
          customerMessage = `Considering your recent payment history, we can offer a more flexible payment plan to assist you.`;
      }
      
      // Add loyalty tier considerations (once loyaltyTier is added to VesselIntelligenceProfile)
      if (vesselProfile.loyaltyTier === 'VIP') {
          recommendationToGM = "Highly flexible payment plan (6 installments, extended grace period).";
          customerMessage = `As a valued VIP customer, we are pleased to offer a highly flexible payment plan.`;
      }

      const actions: AgentAction[] = [];
      actions.push({
          id: `cust_pay_plan_${Date.now()}`,
          kind: 'internal',
          name: 'ada.finance.proposePaymentPlan', // This action would trigger finance to formalize the plan
          params: {
              vesselName: vesselProfile.name,
              loyaltyTier: vesselProfile.loyaltyTier || 'Standard',
              paymentHistoryStatus: vesselProfile.paymentHistoryStatus || 'REGULAR',
              recommendation: recommendationToGM,
              customerMessage: customerMessage
          }
      });
      addTrace(createLog('ada.customer', 'OUTPUT', `Proposed payment plan for ${vesselProfile.name}.`, 'EXPERT'));
      return actions;
  }
};