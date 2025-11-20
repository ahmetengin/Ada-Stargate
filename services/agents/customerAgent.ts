
import { AgentAction, AgentTraceLog } from '../../types';

// A simple, low-cost Knowledge Base for General Inquiries
// In a real scenario, this could be a simple SQL query or a cheap LLM (Gemini Flash) call.
const WIM_INFO_DB: Record<string, string> = {
    'wifi': 'Network: **WIM_GUEST** | Pass: **Sailor2025!** (Limit: 5GB/Daily)',
    'market': 'Migros Jet: **08:00 - 22:00** (Located behind Block B)',
    'gym': 'Fitness Center: **07:00 - 23:00** (Keycard access required)',
    'taxi': 'Taxi Station: +90 212 555 1234 (Gate A pickup)',
    'eczane': 'Pharmacy: "Deniz Eczanesi" located at West Wall mall. Duty pharmacy list available at Security.',
    'restaurant': 'Available: Gunaydin, Big Chefs, Kahve Dunyasi. Closing: 00:00.',
    'fuel': 'Fuel Station (Lukoil): 24/7. Duty-free available with 24h notice.',
    'water': 'Water: Pre-paid cards available at Front Office. 1 Unit = €3.50',
    'electric': 'Electricity: 16A/32A/63A/125A available. Metered billing.',
    'laundry': 'Laundry Service: Pick-up 09:00, Delivery 18:00. Call Ch 11.',
    'garbage': 'Garbage Collection: Daily 08:00 & 16:00. Leave bags on pontoon.',
    'office': 'Front Office: 09:00 - 18:00. VHF Ch 73.',
    'atm': 'ATMs: Garanti, Is Bank, Yapi Kredi (Entrance Plaza).'
};

export const customerAgent = {
  // Lightweight Processor for General Info
  handleGeneralInquiry: async (query: string, addTrace: (t: AgentTraceLog) => void): Promise<{ text: string, actions: AgentAction[] }> => {
    
    addTrace({
        id: `trace_cust_info_${Date.now()}`,
        timestamp: new Date().toISOString(),
        node: 'ada.customer',
        step: 'THINKING',
        content: `Searching General Info Database for keywords in: "${query}"`,
        persona: 'WORKER'
    });

    const lowerQuery = query.toLowerCase();
    let response = "";
    
    // Simple Keyword Matching (Simulating a cheap search algorithm)
    const match = Object.keys(WIM_INFO_DB).find(key => lowerQuery.includes(key));

    if (match) {
        response = WIM_INFO_DB[match];
        addTrace({
            id: `trace_cust_hit_${Date.now()}`,
            timestamp: new Date().toISOString(),
            node: 'ada.customer',
            step: 'OUTPUT',
            content: `Match found for '${match}'.`,
            persona: 'WORKER'
        });
    } else {
        response = "Specific info not found. Please contact Front Office (09:00-18:00) or check the WIM App.";
        addTrace({
            id: `trace_cust_miss_${Date.now()}`,
            timestamp: new Date().toISOString(),
            node: 'ada.customer',
            step: 'OUTPUT',
            content: `No direct match found. Defaulting to Front Office contact.`,
            persona: 'WORKER'
        });
    }

    return {
        text: `**ADA CUSTOMER (INFO DESK):**\n${response}`,
        actions: []
    };
  }
};
