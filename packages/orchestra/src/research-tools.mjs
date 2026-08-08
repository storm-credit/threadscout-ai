import { buildCandidateEvidence } from './candidate-evidence.mjs';
import { createFixtureResearchAdapter } from './fixture-research-adapter.mjs';

export function createFixtureResearchToolHandlers({ adapter = createFixtureResearchAdapter() } = {}) {
  return {
    public_search: async ({ query, limit }) => adapter.search(query, { limit }),
    topic_search: async ({ topic, limit }) => adapter.search(topic, { limit, sourceTypes: ['thread_observation'] }),
    trend_lookup: async ({ query }) => {
      const records = await adapter.search(query);
      return {
        query,
        sourceCount: records.length,
        totalPurchaseSignals: records.reduce((sum, record) => sum + Object.values(record.purchaseSignals).reduce((a, b) => a + b, 0), 0),
        synthetic: true
      };
    },
    candidate_normalization: async ({ records }) => buildCandidateEvidence(records),
    official_source_lookup: async ({ productQuery }) => adapter.search(productQuery, { sourceTypes: ['product_listing'] }),
    listing_lookup: async ({ productQuery }) => adapter.search(productQuery, { sourceTypes: ['product_listing'] }),
    cross_source_check: async ({ records }) => buildCandidateEvidence(records),
    rights_check: async ({ sourceIds }) => Promise.all(sourceIds.map(async (id) => {
      const source = await adapter.getById(id);
      return { sourceId: id, rightsStatus: source?.rightsStatus ?? 'unresolved', synthetic: true };
    })),
    price_stock_snapshot: async ({ productQuery }) => {
      const [listing] = await adapter.search(productQuery, { sourceTypes: ['product_listing'], limit: 1 });
      return listing ? { ...listing.commerce, observedAt: listing.observedAt, sourceId: listing.id, synthetic: true } : {
        priceStatus: 'unavailable', stockStatus: 'unknown', observedAt: new Date(0).toISOString(), sourceId: null, synthetic: true
      };
    }
  };
}
