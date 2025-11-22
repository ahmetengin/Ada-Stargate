
// services/orchestratorService.ts

import { AgentAction, AgentTraceLog, UserProfile, OrchestratorResponse, NodeName, VesselIntelligenceProfile, Tender } from '../types';
import { seaExpert } from './agents/seaAgent';
import { financeExpert } from './agents/financeAgent';
import { legalExpert } from './agents/legalAgent';
import { marinaExpert } from './agents/marinaAgent';
import { customerExpert } from './agents/customerAgent';
import { technicExpert } from './agents/technicAgent';
import { passkitExpert } from './agents/passkitAgent'; // Import passkitExpert
import { wimMasterData } from './wimMasterData';
import { dmsToDecimal } from './utils';
import { generateComplianceSystemMessage } from './prompts';
import { VESSEL_KEYWORDS } from './constants';

// --- TYPES FOR BIG 3 ARCHITECTURE (TS Implementation) ---

type ExpertName = 'FINANCE' | 'TECHNIC' | 'LEGAL' | 'MARINA' | 'CUSTOMER';

interface RouterIntent {
    target: ExpertName;
    confidence: number;
    reasoning: string;
}

// Helper to create a log
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    node,
    step,
    content,
    persona
});

// --- LEVEL 1: THE ROUTER (The Brain) ---
// Decides which Expert should handle the request based on keywords/regex (Heuristic)
class Router {
    static route(prompt: string, user: UserProfile): RouterIntent {
        const lower = prompt.toLowerCase();

        if (lower.includes('invoice') || lower.includes('pay') || lower.includes('debt') || lower.includes('balance')) {
            return { target: 'FINANCE', confidence: 0.9, reasoning: 'Financial keywords detected.' };
        }
        if (lower.includes('repair') || lower.includes('service') || lower.includes('technic') || lower.includes('haul') || lower.includes('job')) {
            return { target: 'TECHNIC', confidence: 0.9, reasoning: 'Technical service keywords detected.' };
        }
        if (lower.includes('contract') || lower.includes('legal') || lower.includes('rule') || lower.includes('regulation') || lower.includes('kvkk')) {
            return { target: 'LEGAL', confidence: 0.9, reasoning: 'Legal/Regulatory keywords detected.' };
        }
        if (lower.includes('wifi') || lower.includes('restaurant') || lower.includes('taxi') || lower.includes('market') || lower.includes('plan')) {
            return { target: 'CUSTOMER', confidence: 0.8, reasoning: 'General inquiry/Customer service keywords.' };
        }
        
        return { target: 'MARINA', confidence: 0.5, reasoning: 'Defaulting to Marina Operations.' };
    }
}

// --- ORCHESTRATOR SERVICE (The Body) ---
export const orchestratorService = {
    async processRequest(prompt: string, user: UserProfile, tenders: Tender[]): Promise<OrchestratorResponse> {
        const traces: AgentTraceLog[] = [];
        const actions: AgentAction[] = [];
        let responseText = "";

        // 1. LOG INCOMING SIGNAL
        traces.push(createLog('ada.marina', 'ROUTING', `Signal Received: "${prompt}"`));

        // 2. HYBRID CHECK: Try to call Python Backend first (Sidecar Pattern)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 500); // 500ms timeout for backend check
            
            const backendRes = await fetch('http://localhost:8000/api/v1/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, user_role: user.role }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (backendRes.ok) {
                const data = await backendRes.json();
                traces.push(createLog('ada.marina', 'ROUTING', 'Handed off to Python Backend (Core Engine).', 'ORCHESTRATOR'));
                // If backend works, we use its response. 
                // NOTE: In this demo, we just log it and proceed to local fallback for safety unless data is perfect.
                // To fully switch, we would return data here.
            }
        } catch (e) {
            // Backend not running? No problem. We use local TypeScript logic.
            // Silent fail.
        }

        // 3. LOCAL ROUTING (The "Big 3" TS Implementation)
        const intent = Router.route(prompt, user);
        traces.push(createLog('ada.marina', 'ROUTING', `Routing to ${intent.target} Expert (Confidence: ${intent.confidence})`, 'ORCHESTRATOR'));

        // Helper to find vessel
        const findVesselInPrompt = (p: string) => VESSEL_KEYWORDS.find(v => p.toLowerCase().includes(v));
        const vesselName = findVesselInPrompt(prompt) || 's/y phisedelia'; // Default context

        // --- DISPATCH TO EXPERTS ---

        switch (intent.target) {
            case 'FINANCE':
                // RBAC
                if (user.role === 'GUEST') {
                    responseText = `**ACCESS DENIED**\n\nFinancial operations require authorized clearance.`;
                    traces.push(createLog('ada.finance', 'ERROR', 'Unauthorized access attempt.', 'EXPERT'));
                } else {
                    // Finance Workflow
                    if (prompt.toLowerCase().includes('debt') || prompt.toLowerCase().includes('balance')) {
                        const status = await financeExpert.checkDebt(vesselName);
                        responseText = status.status === 'DEBT' 
                            ? `**FINANCE ALERT:** ${vesselName} has an outstanding balance of **€${status.amount}**.` 
                            : `**ACCOUNT CLEAR:** ${vesselName} is in good standing.`;
                        traces.push(createLog('ada.finance', 'OUTPUT', `Debt check complete.`, 'EXPERT'));
                    } else if (prompt.toLowerCase().includes('pay') || prompt.toLowerCase().includes('invoice') || prompt.toLowerCase().includes('confirm')) {
                        let payAmount = 1500;
                        // If confirm payment intent
                        if (prompt.toLowerCase().includes('confirm') || prompt.toLowerCase().includes('received')) {
                             // Trigger processPayment directly via a mock loop
                             const res = await financeExpert.processPayment(vesselName, "MANUAL-OVERRIDE", 850, t => traces.push(t));
                             actions.push(...res);
                             responseText = `**PAYMENT CONFIRMED**\n\nAccount for ${vesselName} is now settled. Loyalty score updated.`;
                        } else {
                             // Create Invoice
                             const res = await financeExpert.process({ intent: 'create_invoice', vesselName, amount: payAmount, serviceType: 'GENERAL' }, user, t => traces.push(t));
                             actions.push(...res);
                             const link = res.find(a => a.name.includes('paymentLink'))?.params?.link?.url;
                             responseText = `**INVOICE GENERATED**\n\n[Pay Securely via Iyzico](${link})`;
                             responseText += `\n\n${generateComplianceSystemMessage('CREDIT_CARD_DISCLAIMER')}`;
                        }
                    }
                }
                break;

            case 'TECHNIC':
                // Technic Workflow
                if (prompt.toLowerCase().includes('schedule') || prompt.toLowerCase().includes('book')) {
                     if (user.role === 'GUEST') {
                        responseText = `**ACCESS DENIED**\n\nTechnical scheduling restricted to Captains/GM.`;
                     } else {
                        const date = new Date().toISOString().split('T')[0];
                        const res = await technicExpert.scheduleService(vesselName, 'HAUL_OUT', date, t => traces.push(t));
                        responseText = res.message;
                     }
                } else if (prompt.toLowerCase().includes('status')) {
                    responseText = await technicExpert.checkStatus(vesselName, t => traces.push(t));
                }
                break;

            case 'LEGAL':
                // Legal Workflow
                const resLegal = await legalExpert.process({ query: prompt }, user, t => traces.push(t));
                actions.push(...resLegal);
                const advice = resLegal.find(a => a.name === 'ada.legal.consultation')?.params?.advice;
                responseText = advice || "Access Denied or No Info.";
                if (prompt.toLowerCase().includes('kvkk')) responseText += `\n\n${generateComplianceSystemMessage('PII_MASKING_DISCLAIMER')}`;
                break;

            case 'CUSTOMER':
                // Customer Workflow
                if (prompt.toLowerCase().includes('payment plan')) {
                     const intel = await marinaExpert.getVesselIntelligence(vesselName);
                     if (intel) {
                         const res = await customerExpert.proposePaymentPlan(intel, t => traces.push(t));
                         actions.push(...res);
                         responseText = `**PAYMENT PLAN PROPOSAL**\n\nSubmitted to GM for review based on loyalty tier: **${intel.loyaltyTier}**.`;
                     }
                } else {
                    const res = await customerExpert.handleGeneralInquiry(prompt, t => traces.push(t));
                    responseText = res.text;
                }
                break;

            case 'MARINA':
            default:
                // Fallback / Marina Ops / Navigation / AIS
                if (prompt.toLowerCase().includes('scan') || prompt.toLowerCase().includes('radar')) {
                     // Proximity Logic
                     const nearby = await marinaExpert.findVesselsNear(wimMasterData.identity.location.coordinates.lat, wimMasterData.identity.location.coordinates.lng, 20, t => traces.push(t));
                     responseText = `**RADAR SCAN (20nm Sector):**\nFound ${nearby.length} contacts.`;
                     
                     // WELCOME HOME PROTOCOL CHECK
                     const inboundVessel = nearby.find(v => v.name.toLowerCase().includes('phisedelia') || v.name.toLowerCase().includes('blue horizon'));
                     
                     if (inboundVessel) {
                         responseText += `\n\n**AUTO-IDENTIFICATION MATCH:** ${inboundVessel.name.toUpperCase()} (WIM FLEET)`;
                         
                         const hailMessage = await marinaExpert.generateProactiveHail(inboundVessel.name);
                         responseText += `\n\n${hailMessage}`;
                         
                         // AUTOMATIC LOGGING FOR LOGBOOK
                         actions.push({
                             id: `log_hail_${Date.now()}`,
                             kind: 'internal',
                             name: 'ada.marina.log_operation',
                             params: {
                                 message: `[OP] PROACTIVE HAIL | VS:${inboundVessel.name.toUpperCase()} | LOC:${inboundVessel.distance}nm | STS:WELCOME`,
                                 type: 'info'
                             }
                         });
                         traces.push(createLog('ada.marina', 'TOOL_EXECUTION', 'Welcome Home Protocol Executed. Hail Logged.', 'ORCHESTRATOR'));
                     }
                } 
                else if (prompt.toLowerCase().includes('intel') && vesselName) {
                     const intel = await marinaExpert.getVesselIntelligence(vesselName);
                     if (intel) {
                         responseText = `**INTELLIGENCE: ${intel.name}**\nIMO: ${intel.imo} | Flag: ${intel.flag} | Status: ${intel.status}`;
                         traces.push(createLog('ada.marina', 'OUTPUT', 'Profile loaded.', 'WORKER'));
                     }
                }
                // --- DEPARTURE PROCEDURE (ATC PROTOCOL) ---
                else if (prompt.toLowerCase().includes('depart') || prompt.toLowerCase().includes('leaving') || prompt.toLowerCase().includes('exit')) {
                     if (user.role === 'GUEST') {
                         responseText = "**ACCESS DENIED.** Departure requests restricted to Vessel Command.";
                     } else {
                         // 1. Finance Check
                         const debt = await financeExpert.checkDebt(vesselName);
                         
                         if (debt.status === 'DEBT' && user.role !== 'GENERAL_MANAGER') {
                             // Block departure if debt exists
                             responseText = `**DEPARTURE DENIED**\n\n**Financial Hold Active:** ${vesselName} has an outstanding balance of **€${debt.amount}**.\nPlease settle accounts at the Finance Office before requesting pilotage.`;
                             traces.push(createLog('ada.marina', 'ERROR', 'Departure blocked by Finance.', 'EXPERT'));
                         } else {
                             // 2. Tender Allocation & Clearance (Pass tenders array)
                             const departureResult = await marinaExpert.processDeparture(vesselName, tenders, t => traces.push(t));
                             
                             if (departureResult.success) {
                                 actions.push(...departureResult.actions);
                                 const tenderName = departureResult.tender?.name || "Marina Tender";
                                 const squawk = departureResult.squawk || "1200";
                                 
                                 // ATC Style Response (Strict Phraseology)
                                 responseText = `**CLEARED FOR DEPARTURE**\n\n`;
                                 responseText += `> **[ATC - GND]:** ${vesselName.toUpperCase()}, CLRD PUSH-BACK GATE C-12. ${tenderName.toUpperCase()} ASSIGNED. TAXI VIA FAIRWAY ALPHA.\n`;
                                 responseText += `> **[ATC - TWR]:** ${vesselName.toUpperCase()}, CONTACT DEPARTURE CH 14. SQUAWK ${squawk}. WIND NW 12. GOOD DAY.`;
                                 
                             } else {
                                 responseText = `**DEPARTURE DELAYED**\n\n${departureResult.message}`;
                             }
                         }
                     }
                }
                // --- ARRIVAL PROCEDURE (ATC PROTOCOL) ---
                else if (prompt.toLowerCase().includes('arrival') || prompt.toLowerCase().includes('enter') || prompt.toLowerCase().includes('inbound') || prompt.toLowerCase().includes('docking')) {
                     // Arrival logic
                     const arrivalResult = await marinaExpert.processArrival(vesselName, tenders, t => traces.push(t));
                     
                     if (arrivalResult.success) {
                         actions.push(...arrivalResult.actions);
                         const tenderName = arrivalResult.tender?.name || "Marina Tender";
                         const squawk = arrivalResult.squawk || "1200";

                         responseText = `**APPROACH CLEARED**\n\n`;
                         responseText += `> **[ATC - TOWER]:** ${vesselName.toUpperCase()}, RADAR CONTACT. SQUAWK ${squawk}. PROCEED DIRECT BREAKWATER. MAINTAIN 3 KNOTS.\n`;
                         responseText += `> **[ATC - GND]:** ${tenderName.toUpperCase()} SCRAMBLED FOR INTERCEPT. SWITCH TO **CHANNEL 14**. WELCOME HOME.`;
                     } else {
                         responseText = `**APPROACH DENIED**\n\n${arrivalResult.message}`;
                     }
                }
                else {
                    // Use LLM for chat
                    return { text: "", actions: [], traces }; 
                }
                break;
        }

        // --- ACTION POST-PROCESSING (Orchestration Layer) ---
        // Check for specific chain reactions requested by Experts
        const passkitAction = actions.find(a => a.name === 'ada.passkit.issuePass');
        if (passkitAction) {
             const { vesselName, type } = passkitAction.params;
             // Execute PassKit Logic
             const passResult = await passkitExpert.issuePass(vesselName, "Owner/Captain", type, t => traces.push(t));
             actions.push({
                 id: `passkit_res_${Date.now()}`,
                 kind: 'external',
                 name: 'ada.passkit.generated',
                 params: passResult
             });
             responseText += `\n\n**ACCESS GRANTED:** Digital Pass sent to wallet.`;
        }

        traces.push(createLog('ada.marina', 'OUTPUT', 'Orchestration complete.'));
        return { text: responseText, actions, traces };
    }
};
