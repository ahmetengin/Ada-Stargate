// services/agents/customerSegmentAgent.ts
import { TaskHandlerFn } from '../decomposition/types';
import { AgentContext, AgentObservation, AgentAction } from '../brain/types';
import { vote, Candidate } from '../voting/consensus';

interface DummyCustomer {
  id: string;
  segment: string;
  preferences: Record<string, boolean>;
}

function generateDummyCustomers(segment: string, num = 7): DummyCustomer[] {
  const products = ['Product1', 'Product2', 'Product3', 'Product4', 'Product5'];
  return Array.from({ length: num }).map((_, i) => ({
    id: `${segment}_dummy_${i + 1}`,
    segment,
    preferences: Object.fromEntries(
      products.map(p => [p, Math.random() > 0.5]),
    ),
  }));
}

const segmentRecommend: TaskHandlerFn = async (ctx, obs) => {
  const segment = (obs.payload?.segment ?? 'A') as string;
  const dummies = generateDummyCustomers(segment);
  const products = Object.keys(dummies[0].preferences);

  const recs: Record<string, boolean> = {};
  for (const p of products) {
    const candidates: Candidate<boolean>[] = dummies.map(d => ({
      item: d.preferences[p],
      score: d.preferences[p] ? 1 : 0,
    }));
    const result = vote(candidates, 'plurality');
    recs[p] = result;
  }

  return [{
    id: `act_${Date.now()}`,
    kind: 'internal',
    name: 'customer.segment.recommendations',
    params: { segment, recommendations: recs },
  }];
};

export const customerSegmentHandlers: Record<string, TaskHandlerFn> = {
  'customer.segmentRecommend': segmentRecommend,
};