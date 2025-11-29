
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

        if (lower.includes('invoice') || lower.includes('pay') || lower.includes('debt') || lower.includes('balance')) {
             if (user.role === 'GUEST') {
                 responseText = "**ACCESS DENIED.**";
             } else {
                 const status = await financeExpert.checkDebt(vesselName);
                 if (status.status === 'DEBT') responseText = `**FINANCE ALERT (Local):** ${vesselName} has debt: €${status.amount}`;
                 else responseText = "**ACCOUNT CLEAR (Local).**";
             }
        }
        else if (lower.includes('depart') || lower.includes('leaving')) {
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
                 responseText = `**DEPARTURE DENIED**\n\nConsensus failed. Outstanding Debt: **€${debtStatus.amount}**. Please clear balance before departure.`;
             } else if (technicDecision === 'DENY') {
                 responseText = `**DEPARTURE DENIED**\n\nConsensus failed. Safety Block: **${technicReason}**.`;
             } else {
                 const res = await marinaExpert.processDeparture(vesselName, tenders, t => traces.push(t));
                 responseText = res.message;
                 
                 // Append Blue Card Warning if Conditional
                 if (technicDecision === 'CONDITIONAL') {
                     responseText += `\n\n⚠️ **ENVIRONMENTAL ALERT (MAVİ KART):**\nYour Blue Card period has expired (**${blueCard.daysSinceLast} days** since last discharge). Please visit the Pump-out station immediately at your next port to avoid Coast Guard fines.`;
                 }

                 if (res.actions) actions.push(...res.actions);
             }
        }
        else if (lower.includes('arrival') || lower.includes('arrive') || lower.includes('dock') || lower.includes('approach')) {
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

        // If responseText is still empty, it means no specific agent handled it fully
        // The App.tsx logic will then forward it to the LLM (Gemini).
        
        return { text: responseText, actions: actions, traces: traces };
    }
};
