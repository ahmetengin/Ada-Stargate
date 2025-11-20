// services/agents/registry.ts
import { TaskHandlerFn } from '../decomposition/types';
import { travelHandlers } from './travelAgent';
import { customerSegmentHandlers } from './customerSegmentAgent';
import { genericHandlers } from './genericAgent';
import { marinaHandlers } from './marinaAgent';
import { weatherHandlers } from './weatherAgent';

const handlers: Record<string, TaskHandlerFn> = {
  ...travelHandlers,
  ...customerSegmentHandlers,
  ...genericHandlers,
  ...marinaHandlers,
  ...weatherHandlers,
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