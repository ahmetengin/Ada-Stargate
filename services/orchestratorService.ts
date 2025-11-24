
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
             // --- CONSENSUS PROTOCOL ---
             traces.push(createLog('ada.marina', 'ROUTING', `Departure request detected. Initiating Multi-Agent Consensus Protocol...`, 'ORCHESTRATOR'));

             // 1. Finance Vote (Weighted 10 - Veto Power)
             const debtStatus = await financeExpert.checkDebt(vesselName);
             const financeDecision = debtStatus.status === 'CLEAR' ? 'APPROVE' : 'DENY';
             const financeScore = 10; // High weight

             traces.push(createLog('ada.finance', 'VOTING', `Vote: ${financeDecision} (Weight: ${financeScore}). Reason: ${financeDecision === 'APPROVE' ? 'Account Clear' : 'Outstanding Debt'}`, 'EXPERT'));

             // 2. Technic Vote (Weighted 5)
             const jobs = technicExpert.getActiveJobs().filter(j => j.vesselName.toLowerCase().includes(vesselName.toLowerCase()) && j.status !== 'COMPLETED');
             const criticalJob = jobs.find(j => j.jobType === 'HAUL_OUT' || j.jobType === 'ENGINE_SERVICE');
             const technicDecision = criticalJob ? 'DENY' : 'APPROVE';
             const technicScore = 5;

             traces.push(createLog('ada.technic', 'VOTING', `Vote: ${technicDecision} (Weight: ${technicScore}). Reason: ${criticalJob ? 'Critical Maintenance Active' : 'Systems Nominal'}`, 'EXPERT'));

             // 3. Marina Ops Vote (Weighted 8)
             // Simple check for demonstration
             const marinaDecision = 'APPROVE'; 
             const marinaScore = 8;
             traces.push(createLog('ada.marina', 'VOTING', `Vote: ${marinaDecision} (Weight: ${marinaScore}). Reason: Traffic Permitting`, 'EXPERT'));

             // AGGREGATE VOTES
             // We aggregate the weights for APPROVE vs DENY
             const scoreMap = { 'APPROVE': 0, 'DENY': 0 };
             if (financeDecision === 'APPROVE') scoreMap['APPROVE'] += financeScore; else scoreMap['DENY'] += financeScore;
             if (technicDecision === 'APPROVE') scoreMap['APPROVE'] += technicScore; else scoreMap['DENY'] += technicScore;
             if (marinaDecision === 'APPROVE') scoreMap['APPROVE'] += marinaScore; else scoreMap['DENY'] += marinaScore;

             // Create candidates for the vote function
             const finalCandidates: Candidate<string>[] = [
                 { item: 'APPROVE', score: scoreMap['APPROVE'] },
                 { item: 'DENY', score: scoreMap['DENY'] }
             ];

             // Execute Vote
             const finalDecision = vote(finalCandidates, 'plurality'); // Highest score wins

             traces.push(createLog('ada.marina', 'VOTING', `Consensus Result: ${finalDecision} (Approve: ${scoreMap.APPROVE}, Deny: ${scoreMap.DENY})`, 'ORCHESTRATOR'));

             if (finalDecision === 'APPROVE') {
                 const res = await marinaExpert.processDeparture(vesselName, tenders, t => traces.push(t));
                 responseText = res.message;
                 if (res.actions) actions.push(...res.actions);
             } else {
                 responseText = `**DEPARTURE REQUEST DENIED (Consensus)**\n\nThe Multi-Agent Council has blocked this request.\n\n**Votes against:**\n` +
                    (financeDecision === 'DENY' ? `- **Finance:** Outstanding Debt (€${debtStatus.amount})\n` : '') +
                    (technicDecision === 'DENY' ? `- **Technic:** Critical Maintenance Active\n` : '');
             }
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
        else if (lower.includes('identity verified') || lower.includes('process check-in')) {
             // Handle Passport Scanner Input
             responseText = `**IDENTITY CONFIRMED**\n\n**User:** AHMET ENGIN\n**ID:** U12345678\n**Clearance:** LEVEL 5 (OWNER)\n**Status:** CHECK-IN COMPLETE.\n\nAccess granted to facility nodes.`;
             actions.push({
                id: `sec_checkin_${Date.now()}`,
                kind: 'internal',
                name: 'ada.marina.log_operation',
                params: {
                    message: `[SEC] BIO-SCAN: AHMET ENGIN | ID: U12345678 | GATE: A`,
                    type: 'info'
                }
             });
        }
        else if (lower.includes('payment method verified')) {
             // Handle Credit Card Scanner Input - HOTEL PROVISION STYLE
             responseText = `**PROVISION SECURED**\n\n**Method:** VISA **** **** **** 1234\n**Holder:** AHMET ENGIN\n**Block Amount:** €1,000.00 (Incidentals)\n**Status:** PRE-AUTH SUCCESS.\n\nCheck-in financial requirements met.`;
             actions.push({
                id: `fin_prov_scan_${Date.now()}`,
                kind: 'internal',
                name: 'ada.marina.log_operation',
                params: {
                    message: `[FIN] PROVISION: VISA **** 1234 | AMT: €1000 | CODE: AUTH-9921`,
                    type: 'info'
                }
             });
        }
        
        // IMPORANT: If no local keyword matched, responseText stays empty ("").
        // This tells App.tsx to use Gemini for general conversation (e.g. "hi", "is anyone there?").
        return { text: responseText, actions, traces };
    }
};