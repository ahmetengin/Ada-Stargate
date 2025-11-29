
// services/orchestratorService.ts

import { AgentAction, AgentTraceLog, UserProfile, OrchestratorResponse, NodeName, Tender } from '../types';
import { checkBackendHealth, sendToBackend } from './api';
import { getCurrentMaritimeTime } from './utils';
import { vote, Candidate } from './voting/consensus';

// --- LEGACY IMPORTS (FALLBACK MODE) ---
import { financeExpert } from './agents/financeAgent';
import { legalExpert } from './agents/legalAgent';
import { marinaExpert } from './agents/marinaAgent';
import { customerExpert } from './agents/customerAgent';
import { technicExpert } from './agents/technicAgent';
import { kitesExpert } from './agents/travelAgent'; 
import { wimMasterData } from './wimMasterData';
import { VESSEL_KEYWORDS } from './constants';

// Helper
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: getCurrentMaritimeTime(),
    node,
    step,
    content,
    persona
});

export const orchestratorService = {
    async processRequest(prompt: string, user: UserProfile, tenders: Tender[]): Promise<OrchestratorResponse> {
        const traces: AgentTraceLog[] = [];
        
        // 1. CHECK BACKEND HEALTH (BEYOND-MCP ARCHITECTURE)
        // We prefer the Python FastMCP Experts if available.
        const isBackendOnline = await checkBackendHealth();

        if (isBackendOnline) {
            traces.push(createLog('ada.marina', 'ROUTING', `Connecting to Beyond-MCP Python Grid...`, 'ORCHESTRATOR'));
            
            try {
                // This sends the prompt to the Python FastAPI Router
                // which will then route to the FastMCP servers defined in apps/marina/mcp_marina_wim/
                const backendResponse = await sendToBackend(prompt, user);
                
                if (backendResponse && backendResponse.text) {
                    const actions = backendResponse.actions || [];
                    
                    // If backend returns trace logs (from hooks), append them
                    if (backendResponse.traces) {
                        traces.push(...backendResponse.traces);
                    } else {
                        traces.push(createLog('ada.marina', 'OUTPUT', `Expert Node Response received.`, 'EXPERT'));
                    }

                    return { text: backendResponse.text, actions: actions, traces: traces };
                }
            } catch (err) {
                console.error("Backend Error, falling back to simulation:", err);
                traces.push(createLog('ada.marina', 'ERROR', `MCP Grid Unreachable. Fallback to Local Simulation.`, 'ORCHESTRATOR'));
            }
        } else {
            traces.push(createLog('ada.marina', 'ROUTING', `MCP Offline. Using Local TypeScript Simulation.`, 'ORCHESTRATOR'));
        }

        // --- FALLBACK: LOCAL SIMULATION (Typescript Agents) ---
        // This block runs ONLY if the Python backend is down.
        
        const actions: AgentAction[] = [];
        let responseText = "";
        const lower = prompt.toLowerCase();

        const findVesselInPrompt = (p: string) => VESSEL_KEYWORDS.find(v => p.toLowerCase().includes(v));
        const vesselName = findVesselInPrompt(prompt) || (user.role === 'CAPTAIN' ? 'S/Y Phisedelia' : 's/y phisedelia');

        // PAYMENT INTENT (High Priority)
        // Checks for specific keywords indicating a desire to pay immediately
        if (lower.includes('öde') || lower.includes('pay') || lower.includes('link') || lower.includes('send link')) {
             if (user.role === 'GUEST') {
                 responseText = "**ACCESS DENIED.** Only registered Captains or Owners can settle vessel accounts.";
             } else {
                 traces.push(createLog('ada.finance', 'PLANNING', `User requested payment link. Initiating transaction protocol...`, 'EXPERT'));
                 
                 const status = await financeExpert.checkDebt(vesselName);
                 
                 if (status.status === 'DEBT') {
                     // Trigger Invoice & Link Generation
                     const finActions = await financeExpert.process({
                         intent: 'create_invoice',
                         vesselName: vesselName,
                         amount: status.amount,
                         serviceType: 'DEBT_SETTLEMENT'
                     }, user, (t) => traces.push(t));
                     
                     actions.push(...finActions);
                     
                     // Extract the link from the action to display in text
                     const linkAction = finActions.find(a => a.name === 'ada.finance.paymentLinkGenerated');
                     const linkUrl = linkAction?.params?.link?.url || '#';

                     responseText = `**PAYMENT LINK GENERATED**\n\nI have generated a secure link for your outstanding balance of **€${status.amount}**.\n\n[Click here to Pay via Iyzico 3D-Secure](${linkUrl})\n\n> *Reference: ${vesselName} Debt Settlement*`;
                 } else {
                     responseText = "**ACCOUNT CLEAR.**\n\nYou have no outstanding balance to pay at this time. Thank you.";
                 }
             }
        }
        // DEBT CHECK (Informational only)
        else if (lower.includes('invoice') || lower.includes('debt') || lower.includes('balance') || lower.includes('borç')) {
             if (user.role === 'GUEST') {
                 responseText = "**ACCESS DENIED.**";
             } else {
                 const status = await financeExpert.checkDebt(vesselName);
                 if (status.status === 'DEBT') {
                     responseText = `**FINANCIAL STATUS**\n\n**Vessel:** ${vesselName}\n**Outstanding Balance:** €${status.amount}\n**Status:** ${status.paymentHistoryStatus}\n\n*Would you like me to generate a payment link?*`;
                 }
                 else {
                     responseText = "**ACCOUNT CLEAR (Local).**\nNo outstanding invoices found.";
                 }
             }
        }
        else if (lower.includes('depart') || lower.includes('leaving') || lower.includes('çıkış')) {
             // --- CONSENSUS PROTOCOL ---
             traces.push(createLog('ada.marina', 'ROUTING', `Departure request detected. Initiating Multi-Agent Consensus Protocol...`, 'ORCHESTRATOR'));

             // 1. Finance Vote
             const debtStatus = await financeExpert.checkDebt(vesselName);
             const financeDecision = debtStatus.status === 'CLEAR' ? 'APPROVE' : 'DENY';
             traces.push(createLog('ada.finance', 'VOTING', `Vote: ${financeDecision}. Reason: ${financeDecision === 'APPROVE' ? 'Account Clear' : 'Outstanding Debt'}`, 'EXPERT'));

             // 2. Technic Vote (Jobs & Blue Card)
             const jobs = technicExpert.getActiveJobs().filter(j => j.vesselName.toLowerCase().includes(vesselName.toLowerCase()) && j.status !== 'COMPLETED');
             const criticalJob = jobs.find(j => j.jobType === 'HAUL_OUT' || j.jobType === 'ENGINE_SERVICE');
             let technicDecision = criticalJob ? 'DENY' : 'APPROVE';
             let technicReason = criticalJob ? `Active Critical Job: ${criticalJob.jobType}` : 'No active critical maintenance';

             // Check Blue Card
             const blueCard = await technicExpert.checkBlueCardStatus(vesselName, (t) => traces.push(t));
             if (blueCard.status === 'EXPIRED') {
                 technicDecision = 'CONDITIONAL'; // Warning, but not a hard block
                 technicReason = `Blue Card EXPIRED (${blueCard.daysSinceLast} days).`;
             }

             traces.push(createLog('ada.technic', 'VOTING', `Vote: ${technicDecision}. Reason: ${technicReason}`, 'EXPERT'));

             // 3. Marina Ops Vote
             const marinaDecision = 'APPROVE'; 
             traces.push(createLog('ada.marina', 'VOTING', `Vote: ${marinaDecision}.`, 'EXPERT'));

             // Aggregate
             if (financeDecision === 'DENY') {
                 responseText = `**DEPARTURE DENIED**\n\nConsensus failed. Outstanding Debt: **€${debtStatus.amount}**.\n\n> **Legal Hold:** Right of Retention exercised pursuant to **WIM Contract Article H.2**.\nPlease clear balance at Finance Office.`;
             } else if (technicDecision === 'DENY') {
                 responseText = `**DEPARTURE DENIED**\n\nConsensus failed. Safety Block: **${technicReason}**.\n\n> **Rule:** **Article E.1.8** (Seaworthiness) & **COLREGs** safety violation.`;
             } else {
                 const res = await marinaExpert.processDeparture(vesselName, tenders, t => traces.push(t));
                 responseText = res.message;
                 
                 // Append Blue Card Warning if Conditional
                 if (technicDecision === 'CONDITIONAL') {
                     responseText += `\n\n⚠️ **ENVIRONMENTAL ALERT (MAVİ KART):**\nYour Blue Card period has expired (**${blueCard.daysSinceLast} days** since last discharge). Violation of **Article F.13**.\nPlease visit the Pump-out station immediately at your next port to avoid fines.`;
                 }

                 if (res.actions) actions.push(...res.actions);
             }
        }
        else if (lower.includes('arrival') || lower.includes('arrive') || lower.includes('dock') || lower.includes('approach') || lower.includes('giriş')) {
             // Pre-Arrival Check: Finance
             const debtStatus = await financeExpert.checkDebt(vesselName);
             const res = await marinaExpert.processArrival(vesselName, tenders, debtStatus, t => traces.push(t));
             responseText = res.message;
             if (res.actions) actions.push(...res.actions);
        }
        else if (lower.includes('scan') || lower.includes('id') || lower.includes('passport')) {
             responseText = "Initiating Identity Verification Protocol...";
             // TRIGGER UI ACTION
             actions.push({
                 id: `ui_open_scanner_${Date.now()}`,
                 kind: 'internal',
                 name: 'ada.ui.openModal',
                 params: { modal: 'SCANNER' }
             });
        }
        // BLUE CARD / WASTE MANAGEMENT HANDLER
        else if (lower.includes('blue card') || lower.includes('waste') || lower.includes('pump-out') || lower.includes('atık') || lower.includes('mavi kart')) {
             if (user.role === 'GUEST') {
                 responseText = "**ACCESS DENIED.** Only Captains can request technical services.";
             } else {
                 traces.push(createLog('ada.technic', 'PLANNING', `Received Waste Discharge Request (Blue Card) for ${vesselName}...`, 'EXPERT'));
                 
                 // 1. Check Status
                 const status = await technicExpert.checkBlueCardStatus(vesselName, (t) => traces.push(t));
                 
                 // 2. Generate Response based on urgency
                 let urgencyMsg = "";
                 if (status.status === 'EXPIRED') {
                     urgencyMsg = `⚠️ **STATUS: EXPIRED** (${status.daysSinceLast} days). Immediate discharge required to avoid Coast Guard fines.\n> **Regulation:** Article F.13 (Mandatory Discharge)`;
                 } else {
                     urgencyMsg = `✅ **STATUS: VALID** (Last: ${status.daysSinceLast} days ago).`;
                 }

                 responseText = `**BLUE CARD PUMP-OUT REQUEST**\n\n${urgencyMsg}\n\n**Instructions:**\n1. Proceed to **Fuel Dock (Station 4)**.\n2. Prepare **Green Hose** connection.\n3. Digital Blue Card will be auto-updated upon completion.\n\n> *Waste Barge 'WIM-Eco' is also available on Ch 73.*`;

                 // 3. Log the Request
                 actions.push({
                    id: `bluecard_req_${Date.now()}`,
                    kind: 'internal',
                    name: 'ada.marina.log_operation',
                    params: {
                        message: `[ECO] PUMP-OUT REQUEST | VS:${vesselName} | STS:${status.status}`,
                        type: 'info'
                    }
                 });
             }
        }

        // If responseText is still empty, it means no specific agent handled it fully
        // The App.tsx logic will then forward it to the LLM (Gemini).
        
        return { text: responseText, actions: actions, traces: traces };
    }
};
