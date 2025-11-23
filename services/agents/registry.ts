
// services/agents/registry.ts
import { TaskHandlerFn } from '../decomposition/types';
import { travelHandlers } from './travelAgent';
import { customerSegmentHandlers } from './customerSegmentAgent';
import { genericHandlers } from './genericAgent';
import { marinaHandlers } from './marinaAgent';
import { weatherHandlers } from './weatherAgent';
import { technicHandlers } from './technicAgent';
import { passkitExpert } from './passkitAgent'; // Import passkit
import { securityHandlers } from './securityAgent'; // Import security

// Define a wrapper handler for passkit as it wasn't originally designed with TaskHandlerFn in mind
const passkitIssueHandler: TaskHandlerFn = async (ctx, obs) => {
    const { vesselName, ownerName, type } = obs.payload;
    // Just a wrapper to make it compatible with the brain executor if needed
    const result = await passkitExpert.issuePass(vesselName, ownerName || 'Unknown', type || 'GUEST', () => {});
    return [{
        id: `act_pk_${Date.now()}`,
        kind: 'external',
        name: 'passkit.issued',
        params: result
    }];
};

const handlers: Record<string, TaskHandlerFn> = {
  ...travelHandlers,
  ...customerSegmentHandlers,
  ...genericHandlers,
  ...marinaHandlers,
  ...weatherHandlers,
  ...technicHandlers,
  ...securityHandlers, // Register Security
  'passkit.issue': passkitIssueHandler, 
};

export function getTaskHandler(name: string): TaskHandlerFn {
  const h = handlers[name];
  if (!h) {
      console.warn(`Unknown task handler: '${name}'. Using a dummy handler to prevent crash.`);
      return async () => {
        console.log(`Dummy handler executed for unknown task: ${name}`);
        return [{ id: `dummy_${Date.now()}`, kind: 'internal', name: 'unknown.handler.executed', params: { handlerName: name } }];
      };
  }
  return h;
}
