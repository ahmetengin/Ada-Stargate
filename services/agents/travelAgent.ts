// services/agents/travelAgent.ts
import { TaskHandlerFn } from '../decomposition/types';
import { AgentAction } from '../brain/types';

const dateDestinationCheck: TaskHandlerFn = async (ctx, obs) => {
  console.log('[Agent: Travel] Checking dates and destination...', obs.payload);
  return [{ id: `act_${Date.now()}`, kind: 'internal', name: 'travel.dateDestination.ok', params: { status: 'ok', detail: 'Dates and destination seem valid.' } }];
};

const generateFlights: TaskHandlerFn = async (ctx, obs) => {
  console.log('[Agent: Travel] Searching for flights...');
  return [{ id: `act_${Date.now()}`, kind: 'external', name: 'travel.flight.search', params: { from: 'IST', to: 'CDG', date: '2025-12-24', results: 3 } }];
};

const matchHotelTransfer: TaskHandlerFn = async (ctx, obs) => {
  console.log('[Agent: Travel] Matching hotels and transfers...');
  return [{ id: `act_${Date.now()}`, kind: 'external', name: 'travel.hotel_transfer.match', params: { hotelStars: 4, transferType: 'private' } }];
};

const buildReservation: TaskHandlerFn = async (ctx, obs) => {
  console.log('[Agent: Travel] Building final reservation object...');
  return [{ id: `act_${Date.now()}`, kind: 'internal', name: 'travel.reservation.build', params: { pnr: 'XXT123', status: 'draft', totalCost: 4500 } }];
};

export const travelHandlers: Record<string, TaskHandlerFn> = {
  'travel.dateDestinationCheck': dateDestinationCheck,
  'travel.generateFlights': generateFlights,
  'travel.matchHotelTransfer': matchHotelTransfer,
  'travel.buildReservation': buildReservation,
};