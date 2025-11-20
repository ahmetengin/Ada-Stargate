


import { AgentAction, AgentTraceLog } from '../../types';

// A simple, low-cost Knowledge Base for General Inquiries
// In a real scenario, this could be a simple SQL query or a cheap LLM (Gemini Flash) call.
const WIM_INFO_DB: Record<string, string> = {
    'wifi': 'Network: **WIM_GUEST** | Pass: **Sailor2025!** (Limit: 5GB/Daily). High-speed Fiber Internet is available on all pontoons.',
    'market': 'Migros Jet: **08:00 - 22:00** (Located behind Block B). Shopping Center also available on-site.',
    'gym': 'Fitness Center: **West Life Sports Club**. Includes Sauna, Indoor & Outdoor Swimming Pools. Tennis, Basketball, and Volleyball courts available.',
    'taxi': 'Taxi Station: +90 212 555 1234 (Gate A pickup). VIP Chauffeur service also available.',
    'eczane': 'Pharmacy: "Deniz Eczanesi" located at West Wall mall. Duty pharmacy list available at Security.',
    'restaurant': 'Gastronomy: **Poem, Fersah, Calisto, BigChefs, Happy Moon\'s, Ella Italian, Port of Point, The Roof Kingdom** and many more. Visit **Kumsal İstanbul Sokağı** for street food and entertainment.',
    'beach': 'Beach: **Kumsal Plajı** and **Mask Beach** are available for swimming and entertainment.',
    'fuel': 'Fuel Station (Lukoil): 24/7. Duty-free available with 24h notice.',
    'water': 'Water: Pre-paid cards available at Front Office. 1 Unit = €3.50',
    'electric': 'Electricity: 16A/32A/63A/125A available. Metered billing.',
    'laundry': 'Laundry & Dishwashing service available. Pick-up 09:00, Delivery 18:00. Call Ch 11.',
    'garbage': 'Garbage Collection: Daily 08:00 & 16:00. Leave bags on pontoon. Eco-friendly waste separation active.',
    'office': 'Front Office: 09:00 - 18:00. VHF Ch 73.',
    'atm': 'ATMs: **Garanti BBVA**, Is Bank, Yapi Kredi (Entrance Plaza).',
    'lift': 'Technical: **700 Ton Travel Lift** (Mega Yachts) and **75 Ton Travel Lift** available. 60.000m2 hardstanding area.',
    'heli': 'Helipad available for VIP transfers. Coordinate with Security on Ch 73.',
    'academy': 'Education: **Paris Saint-Germain Academy Beylikdüzü** for football. Sailing School (TYF/RYA) also available.'
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
        // Fallback to a generic helpful response if specific keyword not found, but hint at categories
        if (lowerQuery.includes('food') || lowerQuery.includes('yemek') || lowerQuery.includes('eat') || lowerQuery.includes('restaurant')) {
             response = WIM_INFO_DB['restaurant'];
        } else if (lowerQuery.includes('tech') || lowerQuery.includes('tamir') || lowerQuery.includes('lift')) {
             response = WIM_INFO_DB['lift'];
        } else if (lowerQuery.includes('swim') || lowerQuery.includes('deniz') || lowerQuery.includes('plaj')) {
             response = WIM_INFO_DB['beach'];
        } else if (lowerQuery.includes('sport') || lowerQuery.includes('futbol')) {
             response = WIM_INFO_DB['academy'];
        } else {
             response = "Specific info not found. Please contact Front Office (09:00-18:00) or check the WIM App. Available topics: Wifi, Market, Gym, Taxi, Restaurants, Fuel, Lift, Beach.";
        }
        
        addTrace({
            id: `trace_cust_miss_${Date.now()}`,
            timestamp: new Date().toISOString(),
            node: 'ada.customer',
            step: 'OUTPUT',
            content: `Direct match processed or fallback used.`,
            persona: 'WORKER'
        });
    }

    return {
        text: `**ADA CUSTOMER (INFO DESK):**\n${response}`,
        actions: []
    };
  }
};