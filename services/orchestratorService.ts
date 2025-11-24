
// services/orchestratorService.ts

import { AgentAction, AgentTraceLog, UserProfile, OrchestratorResponse, NodeName, Tender } from '../types';
import { checkBackendHealth, sendToBackend } from './api';
import { getCurrentMaritimeTime } from './utils';

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
        
        // 1. CHECK BACKEND CONNECTION
        const isBackendOnline = await checkBackendHealth();

        if (isBackendOnline) {
            // --- ENTERPRISE MODE (PYTHON BACKEND) ---
            traces.push(createLog('ada.marina', 'ROUTING', `Connected to Enterprise Core (Python/FastAPI). Routing request...`, 'ORCHESTRATOR'));
            
            try {
                const backendResponse = await sendToBackend(prompt, user);
                if (backendResponse.text) {
                    const actions = backendResponse.actions || [];
                    traces.push(createLog('ada.marina', 'OUTPUT', `Received response from Backend Node.`, 'ORCHESTRATOR'));
                    return { text: backendResponse.text, actions: actions, traces: traces };
                }
            } catch (err) {
                console.error("Backend Error, falling back to simulation:", err);
                traces.push(createLog('ada.marina', 'ERROR', `Backend connection unstable. Falling back to Local Simulation.`, 'ORCHESTRATOR'));
            }
        } else {
            traces.push(createLog('ada.marina', 'ROUTING', `Backend Offline. Using Local Simulation Protocols (TypeScript).`, 'ORCHESTRATOR'));
        }

        // --- FALLBACK: LOCAL SIMULATION ---
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
             const res = await marinaExpert.processDeparture(vesselName, tenders, t => traces.push(t));
             responseText = res.message;
             if (res.actions) actions.push(...res.actions);
        }
        else if (lower.includes('arrival') || lower.includes('arrive') || lower.includes('dock') || lower.includes('approach')) {
             // Marina Arrival Fallback
             const res = await marinaExpert.processArrival(vesselName, tenders, t => traces.push(t));
             responseText = res.message;
             if (res.actions) actions.push(...res.actions);
        }
        else if (lower.includes('scan') || lower.includes('radar')) {
             const nearby = await marinaExpert.findVesselsNear(wimMasterData.identity.location.coordinates.lat, wimMasterData.identity.location.coordinates.lng, 20, t => traces.push(t));
             responseText = `**RADAR SCAN (Local Sim):** Found ${nearby.length} targets.`;
        }
        else if (lower.includes('travel') || lower.includes('flight') || lower.includes('uçak')) {
             const res = await kitesExpert.searchFlights("IST", "LHR", "Tomorrow", t => traces.push(t));
             responseText = res.message;
        }
        
        // IMPORANT: If no local keyword matched, responseText stays empty ("").
        // This tells App.tsx to use Gemini for general conversation (e.g. "hi", "is anyone there?").
        return { text: responseText, actions, traces };
    }
};
