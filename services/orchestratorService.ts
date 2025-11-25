
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

             // 2. Technic Vote
             const jobs = technicExpert.getActiveJobs().filter(j => j.vesselName.toLowerCase().includes(vesselName.toLowerCase()) && j.status !== 'COMPLETED');
             const criticalJob = jobs.find(j => j.jobType === 'HAUL_OUT' || j.jobType === 'ENGINE_SERVICE');
             const technicDecision = criticalJob ? 'DENY' : 'APPROVE';
             traces.push(createLog('ada.technic', 'VOTING', `Vote: ${technicDecision}.`, 'EXPERT'));

             // 3. Marina Ops Vote
             const marinaDecision = 'APPROVE'; 
             traces.push(createLog('ada.marina', 'VOTING', `Vote: ${marinaDecision}.`, 'EXPERT'));

             // Aggregate
             if (financeDecision === 'DENY' || technicDecision === 'DENY') {
                 responseText = `**DEPARTURE DENIED**\n\nConsensus failed. Outstanding issues detected via local simulation.`;
             } else {
                 const res = await marinaExpert.processDeparture(vesselName, tenders, t => traces.push(t));
                 responseText = res.message;
                 if (res.actions) actions.push(...res.actions);
             }
        }
        else if (lower.includes('arrival') || lower.includes('arrive') || lower.includes('dock') || lower.includes('approach')) {
             const res = await marinaExpert.processArrival(vesselName, tenders, t => traces.push(t));
             responseText = res.message;
             if (res.actions) actions.push(...res.actions);
        }
        else if (lower.includes('scan') || lower.includes('id') || lower.includes('passport')) {
             responseText = "Please use the **Passport Scanner** module in the Sidebar for identity verification.";
        }

        // If responseText is still empty, it means no specific agent handled it fully
        // The App.tsx logic will then forward it to the LLM (Gemini).
        
        return { text: responseText, actions: actions, traces: traces };
    }
};
