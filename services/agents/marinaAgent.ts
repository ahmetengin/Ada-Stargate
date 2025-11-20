// services/agents/marinaAgent.ts
import { TaskHandlerFn } from '../decomposition/types';

const identifyVessel: TaskHandlerFn = async (ctx, obs) => {
  const vesselName = obs.payload?.text?.match(/([A-Z/Y ]+)/)?.[0]?.trim() || 'Unknown Vessel';
  console.log(`[Agent: Marina] Identifying vessel: ${vesselName}`);
  return [{
    id: `act_${Date.now()}`,
    kind: 'internal',
    name: 'marina.vessel.identified',
    params: { vessel: vesselName, priority: 4 }, // Default priority
  }];
};

const dispatchTender: TaskHandlerFn = async (ctx, obs) => {
  console.log('[Agent: Marina] Dispatching tender...');
  // In a real system, this would find an available tender.
  const tenderId = 't1'; 
  const vesselToAssist = 'S/Y Phisedelia'; // This would be derived from context in a real scenario
  return [{
    id: `act_${Date.now()}`,
    kind: 'external',
    name: 'marina.dispatchTender',
    params: { tenderId: tenderId, vessel: vesselToAssist },
  }];
};

export const marinaHandlers: Record<string, TaskHandlerFn> = {
  'marina.identifyVessel': identifyVessel,
  'marina.dispatchTender': dispatchTender,
};
