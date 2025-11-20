
import { AgentAction, AgentTraceLog, UserProfile, OrchestratorResponse, NodeName } from '../types';
import { seaAgent } from './agents/seaAgent';
import { financeAgent } from './agents/financeAgent';
import { legalAgent } from './agents/legalAgent';
import { marinaAgent } from './agents/marinaAgent';
import { customerAgent } from './agents/customerAgent';

// Helper to create a log
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    node,
    step,
    content,
    persona
});

export const orchestratorService = {
    async processRequest(prompt: string, user: UserProfile): Promise<OrchestratorResponse> {
        const traces: AgentTraceLog[] = [];
        const actions: AgentAction[] = [];
        const lowerPrompt = prompt.toLowerCase();
        
        // 1. Ada Marina (The Gateway) Receives Request
        traces.push(createLog('ada.marina', 'ROUTING', `Signal Received: "${prompt}"`));

        let responseText = "";

        // --- INTENT: GENERAL INFO (Low Cost Routing) ---
        // Keywords that suggest a simple information lookup rather than complex reasoning
        const infoKeywords = ['wifi', 'internet', 'market', 'gym', 'taxi', 'taksi', 'eczane', 'pharmacy', 'restaurant', 'yemek', 'fuel', 'yakıt', 'water', 'su', 'electric', 'elektrik', 'laundry', 'garbage', 'office', 'saat', 'atm'];
        
        if (infoKeywords.some(kw => lowerPrompt.includes(kw))) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: GENERAL_INQUIRY. Routing to ada.customer (Low Cost Node).'));
            
            const result = await customerAgent.handleGeneralInquiry(prompt, (t) => traces.push(t));
            responseText = result.text;
            actions.push(...result.actions);
        }
        // --- INTENT: DEPARTURE / CHECK-OUT (Fast Path) ---
        else if (lowerPrompt.includes('departure') || lowerPrompt.includes('depart') || lowerPrompt.includes('check out') || lowerPrompt.includes('çıkış') || lowerPrompt.includes('ayrıl')) {
            
            const vesselName = "S/Y Phisedelia"; // Contextually this would come from UserProfile or Chat History

            traces.push(createLog('ada.marina', 'THINKING', `Intent: IMMEDIATE_DEPARTURE for ${vesselName}. Initiating Fast-Path Protocol.`, 'ORCHESTRATOR'));

            // Step A: Check Finance (Internal Instant Check)
            traces.push(createLog('ada.finance', 'TOOL_EXECUTION', `Verifying account balance for ${vesselName}...`, 'EXPERT'));
            const debtStatus = await financeAgent.checkDebt(vesselName);

            // GM OVERRIDE LOGIC
            if (debtStatus.status === 'DEBT') {
                 if (user.role === 'GENERAL_MANAGER') {
                    traces.push(createLog('ada.marina', 'PLANNING', `**OVERRIDE:** Debt detected (€${debtStatus.amount}) but User is GM. Authorizing departure with Warning.`, 'ORCHESTRATOR'));
                    // Proceed despite debt
                    const marinaActions = await marinaAgent.processDeparture(vesselName);
                    actions.push(...marinaActions);
                    const tender = marinaActions[0].params.tender;

                    responseText = `**ADA MARINA CONTROL | GM OVERRIDE**\n\nDeparture Authorized for **${vesselName}**. \n\n**WARNING:** Outstanding balance of €${debtStatus.amount} remains on ledger.\n**${tender}** is dispatched for immediate assist.`;

                 } else {
                    // Block Standard Users
                    traces.push(createLog('ada.finance', 'OUTPUT', `ALERT: Outstanding balance detected: €${debtStatus.amount}`, 'EXPERT'));
                    // Generate Invoice Link
                    const financeActions = await financeAgent.process({ intent: 'create_invoice', vesselName, amount: debtStatus.amount }, user, (t) => traces.push(t));
                    actions.push(...financeActions);
                    const link = financeActions.find(a => a.name === 'ada.finance.paymentLinkGenerated')?.params?.link?.url;

                    responseText = `**DEPARTURE DENIED**\n\nOutstanding balance of **€${debtStatus.amount}** detected. Regulations prohibit departure until settlement.\n\n[SECURE PAYMENT LINK](${link}) \n\n*Please notify once paid.*`;
                 }
            } else {
                 // Step B: Debt Clear -> Ops Immediate Action
                 traces.push(createLog('ada.finance', 'OUTPUT', `Balance: CLEAR. Authorization code generated.`, 'EXPERT'));
                 traces.push(createLog('ada.marina', 'PLANNING', `Dispatching pilotage and line handlers.`, 'EXPERT'));

                 const marinaActions = await marinaAgent.processDeparture(vesselName);
                 actions.push(...marinaActions);

                 const tender = marinaActions[0].params.tender;

                 // DIRECT ACTION RESPONSE - NO FILLER
                 responseText = `**EXIT APPROVED.**\n\n**${tender}** dispatched to your position. Switch to Ch 14 for handover.`;
            }

        } 
        // --- INTENT: FLEET QUERY (Where is X? List vessels > Y) ---
        else if (lowerPrompt.includes('nerede') || lowerPrompt.includes('burada mı') || lowerPrompt.includes('tekneleri') || lowerPrompt.includes('list') || lowerPrompt.includes('hangi') || lowerPrompt.includes('konum')) {
            
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: FLEET_INTELLIGENCE. Querying Registry Database.'));
            
            let queryResult;

            // Sub-intent: Filter by Length
            const lengthMatch = lowerPrompt.match(/(\d+)\s*(m|metre|meter)/);
            if (lengthMatch && (lowerPrompt.includes('üzeri') || lowerPrompt.includes('over') || lowerPrompt.includes('büyük'))) {
                const minLength = parseInt(lengthMatch[1]);
                queryResult = await marinaAgent.queryFleet('FILTER', { minLength }, (t) => traces.push(t));
            } 
            // Sub-intent: Specific Vessel Lookup
            else if (lowerPrompt.includes('phisedelia') || lowerPrompt.includes('mistral') || lowerPrompt.includes('blue')) {
                let name = 'S/Y Phisedelia';
                if (lowerPrompt.includes('mistral')) name = 'S/Y Mistral';
                if (lowerPrompt.includes('blue')) name = 'M/Y Blue Horizon';

                queryResult = await marinaAgent.queryFleet('LOCATE', { vesselName: name }, (t) => traces.push(t));
            }
            else {
                 // Default Listing
                 queryResult = await marinaAgent.queryFleet('FILTER', { minLength: 0 }, (t) => traces.push(t));
            }

            responseText = queryResult.text;
            actions.push(...queryResult.actions);
        }
        // --- INTENT: FINANCE ---
        else if (lowerPrompt.includes('invoice') || lowerPrompt.includes('pay') || lowerPrompt.includes('debt') || lowerPrompt.includes('borç')) {
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
                responseText = `**INVOICE GENERATED**\n\nProvider: **Paraşüt**\nLink: [Secure Pay](${link || '#'})\n\n*Awaiting confirmation.*`;
            }

        } 
        // --- INTENT: COLREGS / SEA SAFETY ---
        else if (lowerPrompt.includes('collision') || lowerPrompt.includes('rule') || lowerPrompt.includes('overtaking') || lowerPrompt.includes('speed')) {
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
        // --- INTENT: LEGAL / RAG ---
        else if (lowerPrompt.includes('contract') || lowerPrompt.includes('legal') || lowerPrompt.includes('regulation') || lowerPrompt.includes('sözleşme') || lowerPrompt.includes('kurallar')) {
            traces.push(createLog('ada.marina', 'ROUTING', 'Intent: LEGAL_CONSULTATION. Routing to Legal Agent (RAG).'));
            
            // --- NEW: Financial Status Verification for Sensitive Nodes ---
            const vesselName = "S/Y Phisedelia";
            traces.push(createLog('ada.finance', 'TOOL_EXECUTION', `Security Protocol: Verifying financial standing of ${vesselName} before granting Legal access...`, 'WORKER'));
            const debtCheck = await financeAgent.checkDebt(vesselName);

            // GM Override Logic for Legal Access
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
            // ------------------------------------------------------------

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
            // Default Marina Orchestrator Handling
            traces.push(createLog('ada.marina', 'THINKING', 'Standard inquiry. Handling locally via LLM.'));
            // Return empty string to signal "No Static Response"
            responseText = ""; 
        }

        // Final Synthesis
        traces.push(createLog('ada.marina', 'OUTPUT', 'Execution complete.'));

        return { text: responseText, actions, traces };
    }
};
