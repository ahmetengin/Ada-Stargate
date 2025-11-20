
// src/agents/registry.ts from scaffold
import { TaskHandlerFn } from '../decomposition/types';
import { travelHandlers } from './travelAgent';
import { customerSegmentHandlers } from './customerSegmentAgent';

const handlers: Record<string, TaskHandlerFn> = {
  ...travelHandlers,
  ...customerSegmentHandlers,
};

export function getTaskHandler(name: string): TaskHandlerFn {
  const h = handlers[name];
  if (!h) {
      console.warn(`Unknown task handler: '${name}'. Using a dummy handler to prevent crash.`);
      // Return a dummy function that does nothing but log the event
      return async () => {
        console.log(`Dummy handler executed for unknown task: ${name}`);
        return [{ id: `dummy_${Date.now()}`, kind: 'internal', name: 'unknown.handler.executed', params: { handlerName: name } }];
      };
  }
  return h;
}
