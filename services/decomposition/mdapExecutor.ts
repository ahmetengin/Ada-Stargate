
// src/decomposition/mdapExecutor.ts from scaffold
import { MdapGraph, TaskHandlerFn } from './types';
import { AgentContext, AgentObservation, AgentAction } from '../brain/types';
import { getTaskHandler } from '../agents/registry';

const graphs: Record<string, MdapGraph> = {
  'travel_booking_v1': {
    id: 'travel_booking_v1',
    name: 'Travel Booking Decomposition',
    entryNode: 'date_destination_check',
    nodes: [
      { id: 'date_destination_check', description: 'Check dates and destination', module: 'travel', handler: 'travel.dateDestinationCheck', next: ['flight_options'] },
      { id: 'flight_options', description: 'Generate flights', module: 'travel', handler: 'travel.generateFlights', next: ['hotel_transfer_match'] },
      { id: 'hotel_transfer_match', description: 'Match hotel and transfer', module: 'travel', handler: 'travel.matchHotelTransfer', next: ['reservation_generation'] },
      { id: 'reservation_generation', description: 'Create reservation', module: 'travel', handler: 'travel.buildReservation', next: [] },
    ],
  },
};

export async function runMdapGraph(
  graphId: string,
  ctx: AgentContext,
  obs: AgentObservation,
): Promise<AgentAction[]> {
  const g = graphs[graphId];
  if (!g) throw new Error(`Unknown MDAP graph: ${graphId}`);

  const actions: AgentAction[] = [];
  let currentId: string | null = g.entryNode;

  while (currentId) {
    const node = g.nodes.find(n => n.id === currentId);
    if (!node) break;

    const handler: TaskHandlerFn = getTaskHandler(node.handler);
    const produced = await handler(ctx, obs);
    actions.push(...produced);

    // For demo, we just follow the first path
    currentId = node.next[0] ?? null;
  }

  return actions;
}
