
import { AgentAction, AgentTraceLog, NodeName } from '../../types';

// Helper to create a log
const createLog = (node: NodeName, step: AgentTraceLog['step'], content: string, persona: 'ORCHESTRATOR' | 'EXPERT' | 'WORKER' = 'ORCHESTRATOR'): AgentTraceLog => ({
    id: `trace_${Date.now()}_${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    node,
    step,
    content,
    persona
});

export const securityExpert = {
    
    // Skill: Review CCTV Footage (Simulated)
    reviewCCTV: async (location: string, timeWindow: string, addTrace: (t: AgentTraceLog) => void): Promise<{ confirmed: boolean, evidenceId: string, details: string }> => {
        addTrace(createLog('ada.security', 'THINKING', `Accessing Surveillance Network (NVR-04). Requesting playback for ${location} @ ${timeWindow}...`, 'EXPERT'));
        
        // Simulation delay
        await new Promise(resolve => setTimeout(resolve, 800));

        addTrace(createLog('ada.security', 'TOOL_EXECUTION', `Running Object Detection (YOLOv10) on footage...`, 'WORKER'));
        addTrace(createLog('ada.security', 'CODE_OUTPUT', `Detected: Vessel Contact. Force Impact > 2kN. Vector: Portside Stern.`, 'WORKER'));

        return {
            confirmed: true,
            evidenceId: `EVD-${Date.now()}`,
            details: "Visual confirmation of hull contact by maneuvering vessel."
        };
    },

    // Skill: Dispatch Security Unit
    dispatchGuard: async (location: string, priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY', addTrace: (t: AgentTraceLog) => void): Promise<AgentAction[]> => {
        addTrace(createLog('ada.security', 'TOOL_EXECUTION', `Dispatching Mobile Patrol to ${location}. Priority: ${priority}`, 'WORKER'));
        
        return [{
            id: `sec_dispatch_${Date.now()}`,
            kind: 'external',
            name: 'ada.security.dispatch',
            params: { unit: 'Patrol-1', location, priority }
        }];
    },

    // Skill: Flag Vessel (Security Hold)
    flagVessel: async (vesselName: string, reason: string, addTrace: (t: AgentTraceLog) => void): Promise<AgentAction[]> => {
        addTrace(createLog('ada.security', 'THINKING', `Initiating Block Protocol for ${vesselName}. Reason: ${reason}`, 'EXPERT'));
        
        return [{
            id: `sec_flag_${Date.now()}`,
            kind: 'internal',
            name: 'ada.security.flagVessel',
            params: { vesselName, status: 'RED', restriction: 'DEPARTURE_BAN' }
        }];
    }
};

export const securityHandlers = {
    'security.reviewCCTV': async (ctx: any, obs: any) => {
        // Wrapper for decomposition layer if needed
        return [];
    }
};
