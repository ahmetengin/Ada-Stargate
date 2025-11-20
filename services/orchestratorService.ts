// services/orchestratorService.ts



import { AgentAction, AgentTraceLog, UserProfile, OrchestratorResponse, NodeName, VesselIntelligenceProfile } from '../types';
import { seaAgent } from './agents/seaAgent';
import { financeAgent } from './agents/financeAgent';
import { legalAgent } from './agents/legalAgent';
import { marinaAgent } from './agents/marinaAgent';
import { customerAgent } from './agents/customerAgent';
import { wimMasterData } from './wimMasterData';

// Helper to create a log
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    node,
    step,
    content,
    persona
});

const VESSEL_KEYWORDS = ['phisedelia', 'mistral', 'blue horizon', 'poseidon', 'grand turk', 'aegeas', 'lir'];

export const orchestratorService = {
    async processRequest(prompt: string, user: UserProfile): Promise<OrchestratorResponse> {
        const traces: AgentTraceLog[] = [];
        const actions: AgentAction[] = [];
        const lowerPrompt = prompt.toLowerCase();
        
        traces.push(createLog('ada.marina', 'ROUTING', `Signal Received: "${prompt}"`));

        let responseText = "";

        // Helper to find a vessel name in the prompt
        const findVesselInPrompt = (p: string) => VESSEL_KEYWORDS.find(v => p.includes(v));

        const infoKeywords = ['wifi', 'internet', 'market', 'gym', 'taxi', 'pharmacy', 'restaurant', 'fuel', 'water', 'electric', 'laundry', 'garbage', 'office', 'hours', 'atm', 'arrival', 'procedure'];
        
        if (infoKeywords.some(kw => lowerPrompt.includes(kw))) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: GENERAL_INQUIRY. Routing to ada.customer (Low Cost Node).'));
            
            const result = await customerAgent.handleGeneralInquiry(prompt, (t) => traces.push(t));
            responseText = result.text;
            actions.push(...result.actions);
        }
        else if (lowerPrompt.includes('departure') || lowerPrompt.includes('depart') || lowerPrompt.includes('check out') || lowerPrompt.includes('leave')) {
            
            const vesselName = "S/Y Phisedelia"; 

            traces.push(createLog('ada.marina', 'THINKING', `Intent: IMMEDIATE_DEPARTURE for ${vesselName}. Initiating Fast-Path Protocol.`, 'ORCHESTRATOR'));
            traces.push(createLog('ada.finance', 'TOOL_EXECUTION', `Verifying account balance for ${vesselName}...`, 'EXPERT'));
            const debtStatus = await financeAgent.checkDebt(vesselName);

            if (debtStatus.status === 'DEBT') {
                 if (user.role === 'GENERAL_MANAGER') {
                    traces.push(createLog('ada.marina', 'PLANNING', `**OVERRIDE:** Debt detected (€${debtStatus.amount}) but User is GM. Authorizing departure with Warning.`, 'ORCHESTRATOR'));
                    const marinaActions = await marinaAgent.processDeparture(vesselName);
                    actions.push(...marinaActions);
                    const tender = marinaActions[0].params.tender;
                    responseText = `**ADA MARINA CONTROL | GM OVERRIDE**\n\nDeparture Authorized for **${vesselName}**. \n\n**WARNING:** Outstanding balance of €${debtStatus.amount} remains on ledger.\n**${tender}** is dispatched for immediate assist.`;
                 } else {
                    traces.push(createLog('ada.finance', 'OUTPUT', `ALERT: Outstanding balance detected: €${debtStatus.amount}`, 'EXPERT'));
                    const financeActions = await financeAgent.process({ intent: 'create_invoice', vesselName, amount: debtStatus.amount }, user, (t) => traces.push(t));
                    actions.push(...financeActions);
                    const link = financeActions.find(a => a.name === 'ada.finance.paymentLinkGenerated')?.params?.link?.url;
                    responseText = `**DEPARTURE DENIED**\n\nOutstanding balance of **€${debtStatus.amount}** detected. Regulations prohibit departure until settlement.\n\n[SECURE PAYMENT LINK](${link}) \n\n*Please notify once paid.*`;
                 }
            } else {
                 traces.push(createLog('ada.finance', 'OUTPUT', `Balance: CLEAR. Authorization code generated.`, 'EXPERT'));
                 traces.push(createLog('ada.marina', 'PLANNING', `Dispatching pilotage and line handlers.`, 'EXPERT'));
                 const marinaActions = await marinaAgent.processDeparture(vesselName);
                 actions.push(...marinaActions);
                 const tender = marinaActions[0].params.tender;
                 responseText = `**EXIT APPROVED.**\n\n**${tender}** dispatched to your position. Switch to Ch 14 for handover.`;
            }

        } 
        else if (lowerPrompt.includes('phone') || lowerPrompt.includes('contact')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: MARINA_PHONE_NUMBER. Retrieving WIM contact data.'));
            const { phone } = wimMasterData.identity.contact;
            responseText = `**ADA MARINA | Contact:**\n\nPhone: **${phone}**\n\n*You can also reach us on VHF Channel 73 (Callsign: West Istanbul Marina).*`;
        }
        else if (lowerPrompt.includes('marine traffic') || lowerPrompt.includes('ais')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: LIVE_TRAFFIC_LINK. Providing MarineTraffic URL.'));
            const marineTrafficUrl = "https://www.marinetraffic.com/en/ais/home/centerx:28.665/centery:40.955/zoom:15";
            responseText = `**Live AIS Data (MarineTraffic):**\n\nYou can view the live vessel traffic around West Istanbul Marina via the link below.\n\n[📡 View Live Marine Traffic](${marineTrafficUrl})`;
        }
        else if ((lowerPrompt.includes('location') || lowerPrompt.includes('where')) && 
                 !VESSEL_KEYWORDS.some(v => lowerPrompt.includes(v))) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: MARINA_LOCATION. Retrieving WIM master data.'));
            const { name, location, contact } = wimMasterData.identity;
            const mapLink = `https://www.google.com/maps/search/?api=1&query=${location.coordinates.lat},${location.coordinates.lng}`;
            responseText = `**${name} Location & Contact:**\n\nLatitude: ${location.coordinates.lat}\nLongitude: ${location.coordinates.lng}\n\n[📍 View on Google Maps](${mapLink})\n\nPhone: **${contact.phone}**\nVHF: Channel ${contact.vhf_channels.public[0]} (Callsign: ${contact.call_sign})`;
        }
        // --- NEW INTENT: VESSEL INTELLIGENCE BRIEFING ---
        else if (lowerPrompt.includes('intel') || lowerPrompt.includes('briefing') || lowerPrompt.includes('details') || lowerPrompt.includes('give info')) {
            const vesselName = findVesselInPrompt(lowerPrompt);
            if(vesselName) {
                traces.push(createLog('ada.marina', 'ROUTING', `Intent: VESSEL_INTELLIGENCE. Querying MCP for "${vesselName}".`, 'ORCHESTRATOR'));
                
                const intel: VesselIntelligenceProfile | null = await marinaAgent.getVesselIntelligence(vesselName);
                
                if (intel) {
                    traces.push(createLog('ada.marina', 'TOOL_EXECUTION', `Internal DB: Found IMO "${intel.imo}" for vessel "${intel.name}".`, 'WORKER'));
                    traces.push(createLog('ada.marina', 'TOOL_EXECUTION', `Querying Kpler MCP with IMO: ${intel.imo}...`, 'EXPERT'));
                    traces.push(createLog('ada.marina', 'CODE_OUTPUT', `MCP Response received for IMO ${intel.imo}`, 'WORKER'));
                    responseText = `**INTELLIGENCE BRIEFING: ${intel.name.toUpperCase()}**
| Parameter | Value |
|---|---|
| **IMO** | \`${intel.imo}\` |
| **Flag** | ${intel.flag} |
| **Type** | ${intel.type} |
| **Specs** | ${intel.loa}m LOA / ${intel.beam}m Beam / ${intel.dwt} DWT |
| **Status** | **${intel.status}** at ${intel.location} |
| **Last Port** | ${intel.voyage.lastPort} |
| **Next Port** | **${intel.voyage.nextPort}** (ETA: ${intel.voyage.eta}) |
`;
                } else {
                     responseText = `**Negative Contact.** No intelligence data available for a vessel matching "${vesselName}".`;
                }
            } else {
                 responseText = "Please specify a vessel name for the intelligence briefing (e.g., 'intel on Phisedelia').";
            }
        }
        else if (lowerPrompt.includes('where is') || lowerPrompt.includes('nerede') || lowerPrompt.includes('burada mı') || lowerPrompt.includes('tekneleri') || lowerPrompt.includes('list') || lowerPrompt.includes('hangi') || lowerPrompt.includes('konum') || lowerPrompt.includes('location of')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: FLEET_INTELLIGENCE. Querying Registry Database.'));
            let queryResult;
            const lengthMatch = lowerPrompt.match(/(\d+)\s*(m|metre|meter)/);
            if (lengthMatch && (lowerPrompt.includes('üzeri') || lowerPrompt.includes('over') || lowerPrompt.includes('büyük') || lowerPrompt.includes('larger than'))) {
                const minLength = parseInt(lengthMatch[1]);
                queryResult = await marinaAgent.queryFleet('FILTER', { minLength }, (t) => traces.push(t));
            } 
            else {
                const vesselName = findVesselInPrompt(lowerPrompt);
                if (vesselName) {
                    queryResult = await marinaAgent.queryFleet('LOCATE', { vesselName }, (t) => traces.push(t));
                } else {
                    queryResult = await marinaAgent.queryFleet('FILTER', { minLength: 0 }, (t) => traces.push(t));
                }
            }
            responseText = queryResult.text;
            actions.push(...queryResult.actions);
        }
        else if (lowerPrompt.includes('invoice') || lowerPrompt.includes('pay') || lowerPrompt.includes('debt')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: FINANCIAL_TRANSACTION. Handing over to Finance Agent.'));
            
            const financeActions = await financeAgent.process(
                { intent: 'create_invoice', vesselName: 'S/Y Phisedelia', amount: 1500 }, 
                user, 
                (t) => traces.push(t)
            );
            
            actions.push(...financeActions);
            
            const denied = financeActions.find(a => a.name.includes('accessDenied'));
            if (denied) {
                responseText = `**ACCESS DENIED** \n\nUser **${user.name}** (${user.role}) does not have the required clearance for Financial Operations. Please contact the General Manager.`;
            } else {
                const link = financeActions.find(a => a.name === 'ada.finance.paymentLinkGenerated')?.params?.link?.url;
                responseText = `**INVOICE GENERATED**\n\nProvider: **Parasut**\nLink: [Secure Pay](${link || '#'})\n\n*Awaiting confirmation.*`;
            }

        } 
        else if (lowerPrompt.includes('collision') || lowerPrompt.includes('rule') || lowerPrompt.includes('overtaking') || lowerPrompt.includes('speed') || lowerPrompt.includes('navigation')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: NAVIGATION_SAFETY. Routing to Sea Agent (COLREGs).'));
            
            const seaActions = await seaAgent.process({ 
                situation: lowerPrompt.includes('crossing') ? 'crossing' : 'overtaking',
                mySpeed: 12,
                targetBearing: 45,
                visibility: lowerPrompt.includes('fog') ? 'low' : 'good'
            });
            actions.push(...seaActions);
            
            const maneuver = seaActions.find(a => a.name === 'ada.sea.maneuver');
            responseText = `**COLREGs ADVISORY:** \n\n${maneuver ? `**Action Required:** ${maneuver.params.action} (Rule ${maneuver.params.rule})` : 'Proceed with caution.'}`;

        } 
        else if (lowerPrompt.includes('contract') || lowerPrompt.includes('legal') || lowerPrompt.includes('regulation')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: LEGAL_CONSULTATION. Routing to Legal Agent (RAG).'));
            const vesselName = "S/Y Phisedelia";
            traces.push(createLog('ada.finance', 'TOOL_EXECUTION', `Security Protocol: Verifying financial standing of ${vesselName} before granting Legal access...`, 'WORKER'));
            const debtCheck = await financeAgent.checkDebt(vesselName);

            if (debtCheck.status === 'DEBT' && user.role !== 'GENERAL_MANAGER') {
                 traces.push(createLog('ada.marina', 'ERROR', `Access Denied: Vessel has outstanding debt of €${debtCheck.amount}.`, 'ORCHESTRATOR'));
                 responseText = `**ACCESS DENIED**\n\nAccess to **ada.legal** services is suspended due to an outstanding balance of **€${debtCheck.amount}**.\n\nPlease settle your account via **ada.finance** before requesting legal consultations.`;
                 return { text: responseText, actions: [], traces };
            }
            
            if (debtCheck.status === 'DEBT' && user.role === 'GENERAL_MANAGER') {
                 traces.push(createLog('ada.marina', 'PLANNING', `GM Override: Granting Legal Access despite debt.`, 'ORCHESTRATOR'));
            } else {
                 traces.push(createLog('ada.finance', 'OUTPUT', `Financial Status: GREEN. Access Granted.`, 'WORKER'));
            }

            const legalActions = await legalAgent.process({ query: prompt }, user, (t) => traces.push(t));
            actions.push(...legalActions);

            const denied = legalActions.find(a => a.name.includes('accessDenied'));
            if (denied) {
                responseText = `**CLASSIFIED DATA** \n\nAccess to **ada.legal** Knowledge Graph is restricted to GENERAL_MANAGER role only.`;
            } else {
                const advice = legalActions.find(a => a.name === 'ada.legal.consultation')?.params?.advice;
                responseText = `**Legal Opinion (WIM Regulations):**\n\n${advice}`;
            }

        } else {
            traces.push(createLog('ada.marina', 'THINKING', 'Standard inquiry. Handling locally via LLM.'));
            responseText = ""; 
        }

        traces.push(createLog('ada.marina', 'OUTPUT', 'Execution complete.'));

        return { text: responseText, actions, traces };
    }
};