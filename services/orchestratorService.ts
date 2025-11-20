
import { AgentAction, AgentTraceLog, UserProfile, OrchestratorResponse, NodeName } from '../types';
import { seaAgent } from './agents/seaAgent';
import { financeAgent } from './agents/financeAgent';
import { legalAgent } from './agents/legalAgent';

// Helper to create a log
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    node,
    step,
    content
});

export const orchestratorService = {
    async processRequest(prompt: string, user: UserProfile): Promise<OrchestratorResponse> {
        const traces: AgentTraceLog[] = [];
        const actions: AgentAction[] = [];
        
        // 1. Ada Marina (The Gateway) Receives Request
        traces.push(createLog('ada.marina', 'ROUTING', `Incoming transmission from ${user.role}: "${prompt}"`));

        let responseText = "I've processed your request.";

        // 2. Intent Analysis (Simulation)
        const lowerPrompt = prompt.toLowerCase();

        if (lowerPrompt.includes('invoice') || lowerPrompt.includes('pay') || lowerPrompt.includes('debt')) {
            // Route to Finance
            traces.push(createLog('ada.marina', 'ROUTING', 'Detected Intent: FINANCIAL_TRANSACTION. Routing to ada.finance node.'));
            
            const financeActions = await financeAgent.process(
                { intent: 'create_invoice', vesselName: 'S/Y Phisedelia', amount: 1500 }, 
                user, 
                (t) => traces.push(t)
            );
            
            actions.push(...financeActions);
            
            const denied = financeActions.find(a => a.name.includes('accessDenied'));
            if (denied) {
                responseText = `**ACCESS DENIED.** \n\nUser **${user.name}** (${user.role}) does not have the required clearance for Financial Operations. Please contact the General Manager.`;
            } else {
                const link = financeActions.find(a => a.name === 'ada.finance.paymentLinkGenerated')?.params?.link?.url;
                responseText = `I have orchestrated **ada.finance** to generate an invoice via **Paraşüt**. \n\n**TRPay/Iyzico Secure Link:** [Pay Now](${link || '#'}) \n\n*Confirmation will be handled by ada.passkit.*`;
            }

        } else if (lowerPrompt.includes('collision') || lowerPrompt.includes('rule') || lowerPrompt.includes('overtaking') || lowerPrompt.includes('speed')) {
            // Route to Sea (COLREGs)
            traces.push(createLog('ada.marina', 'ROUTING', 'Detected Intent: NAVIGATION_SAFETY. Routing to ada.sea node.'));
            
            const seaActions = await seaAgent.process({ 
                situation: lowerPrompt.includes('crossing') ? 'crossing' : 'overtaking',
                mySpeed: 12,
                targetBearing: 45,
                visibility: lowerPrompt.includes('fog') ? 'low' : 'good'
            });
            actions.push(...seaActions);
            
            const maneuver = seaActions.find(a => a.name === 'ada.sea.maneuver');
            responseText = `**COLREGs ADVISORY:** \n\n${maneuver ? `**Action Required:** ${maneuver.params.action} (Rule ${maneuver.params.rule})` : 'Proceed with caution.'}`;

        } else if (lowerPrompt.includes('contract') || lowerPrompt.includes('legal') || lowerPrompt.includes('regulation')) {
            // Route to Legal
            traces.push(createLog('ada.marina', 'ROUTING', 'Detected Intent: LEGAL_CONSULTATION. Routing to ada.legal node.'));
            
            const legalActions = await legalAgent.process({ query: prompt }, user, (t) => traces.push(t));
            actions.push(...legalActions);

            const denied = legalActions.find(a => a.name.includes('accessDenied'));
            if (denied) {
                responseText = `**CLASSIFIED DATA.** \n\nAccess to **ada.legal** Knowledge Graph is restricted to GENERAL_MANAGER role only.`;
            } else {
                const advice = legalActions.find(a => a.name === 'ada.legal.consultation')?.params?.advice;
                responseText = `**Legal Opinion (WIM Regulations):**\n\n${advice}`;
            }

        } else {
            // Default Marina Orchestrator Handling
            traces.push(createLog('ada.marina', 'THINKING', 'Standard inquiry. Handling locally via LLM.'));
            // In a real app, this returns the LLM response, handled in App.tsx logic usually.
            // For this specific service method, we return a placeholder if no specific agent was invoked.
            responseText = "Orchestrator: Request acknowledged. No specific expert node required.";
        }

        // Final Synthesis
        traces.push(createLog('ada.marina', 'OUTPUT', 'Aggregating node responses and dispatching to UI.'));

        return { text: responseText, actions, traces };
    }
};
