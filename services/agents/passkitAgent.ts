
import { AgentAction, AgentTraceLog, UserProfile, NodeName } from '../../types';
import { wimMasterData } from '../wimMasterData';

// Helper to create a log
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    node,
    step,
    content,
    persona
});

export const passkitAgent = {
    // Skill: Issue Digital Pass
    issuePass: async (vesselName: string, ownerName: string, type: 'GUEST' | 'OWNER' | 'CREW', addTrace: (t: AgentTraceLog) => void): Promise<{ success: boolean, passUrl?: string, qrCode?: string, message: string }> => {
        
        addTrace(createLog('ada.passkit', 'THINKING', `Request to issue ${type} PASS for ${vesselName} (${ownerName}). Verifying credentials...`, 'EXPERT'));

        // 1. Simulated Security Check
        if (type === 'OWNER') {
             addTrace(createLog('ada.passkit', 'TOOL_EXECUTION', `Querying Biometric Database... Match Confirmed.`, 'WORKER'));
        }

        // 2. Generate Token
        const passId = `PK-${Math.floor(Math.random() * 100000)}`;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + (type === 'GUEST' ? 1 : 365));
        
        const passData = {
            id: passId,
            holder: ownerName,
            vessel: vesselName,
            accessLevel: type === 'OWNER' ? 'ALL_AREAS' : 'PONTOON_ONLY',
            validUntil: expiry.toISOString().split('T')[0]
        };

        addTrace(createLog('ada.passkit', 'CODE_OUTPUT', `Pass Token Generated: ${JSON.stringify(passData)}`, 'WORKER'));

        // 3. "Sign" the pass (Simulation)
        const passUrl = `https://wallet.wim.network/p/${passId}`;
        
        addTrace(createLog('ada.passkit', 'OUTPUT', `Digital Key generated. Push notification sent to owner device.`, 'EXPERT'));

        return {
            success: true,
            passUrl: passUrl,
            qrCode: "QR_DATA_SIMULATION",
            message: `${type} Pass (${passId}) issued for ${ownerName}. Valid until ${passData.validUntil}.`
        };
    }
};
