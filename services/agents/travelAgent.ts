
// src/agents/travelAgent.ts from scaffold
import { TaskHandlerFn } from '../decomposition/types';
import { AgentContext, AgentObservation, AgentAction } from '../brain/types';

const dateDestinationCheck: TaskHandlerFn = async (ctx, obs) => {
  return [{ id: `act_${Date.now()}`, kind: 'internal', name: 'travel.dateDestination.ok', params: { status: 'ok' } }];
};

const generateFlights: TaskHandlerFn = async (ctx, obs) => {
  return [{ id: `act_${Date.now()}`, kind: 'external', name: 'travel.flight.search', params: { from: 'IST', to: 'CDG', date: '2025-12-24' } }];
};

const matchHotelTransfer: TaskHandlerFn = async (ctx, obs) => {
  return [{ id: `act_${Date.now()}`, kind: 'external', name: 'travel.hotel_transfer.match', params: { hotelStars: 4, transferType: 'private' } }];
};

const buildReservation: TaskHandlerFn = async (ctx, obs) => {
  return [{ id: `act_${Date.now()}`, kind: 'internal', name: 'travel.reservation.build', params: { pnr: 'XXT123', status: 'draft' } }];
};

export const travelHandlers: Record<string, TaskHandlerFn> = {
  'travel.dateDestinationCheck': dateDestinationCheck,
  'travel.generateFlights': generateFlights,
  'travel.matchHotelTransfer': matchHotelTransfer,
  'travel.buildReservation': buildReservation,
};
