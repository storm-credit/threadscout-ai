import { sha256 } from './versioning.mjs';
import { FIXTURE_RESEARCH_POLICY, validateResearchPolicy } from './research-policy.mjs';

function cleanText(value, maxLength) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function validDate(value) {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

export function createSourceRecord(input, policy = FIXTURE_RESEARCH_POLICY) {
  const policyValidation = validateResearchPolicy(policy);
  if (!policyValidation.ok) throw new Error(`Invalid research policy: ${policyValidation.errors.join(' | ')}`);

  const sourceUrl = new URL(input.url);
  if (!policy.allowedSchemes.includes(sourceUrl.protocol)) throw new Error(`Source scheme is not allowed: ${sourceUrl.protocol}`);
  if (!policy.allowedSourceTypes.includes(input.sourceType)) throw new Error(`Source type is not allowed: ${input.sourceType}`);

  const base = {
    sourceVersion: 1,
    id: input.id,
    sourceType: input.sourceType,
    url: sourceUrl.toString(),
    title: cleanText(input.title, 300),
    excerpt: cleanText(input.excerpt, policy.maxExcerptChars),
    observedAt: input.observedAt,
    retrievedAt: input.retrievedAt,
    synthetic: true,
    networkFetched: false,
    policyId: policy.id,
    rightsStatus: input.rightsStatus ?? 'observation_only',
    retentionClass: policy.retentionClass,
    redaction: {
      personalDataRemoved: true,
      rawPayloadStored: false
    },
    productMentions: (input.productMentions ?? []).map((mention) => ({
      name: cleanText(mention.name, 200),
      brand: cleanText(mention.brand, 100),
      model: cleanText(mention.model, 100),
      variant: cleanText(mention.variant, 100)
    })),
    purchaseSignals: {
      whereToBuy: Number(input.purchaseSignals?.whereToBuy ?? 0),
      priceQuestion: Number(input.purchaseSignals?.priceQuestion ?? 0),
      linkRequest: Number(input.purchaseSignals?.linkRequest ?? 0),
      stockQuestion: Number(input.purchaseSignals?.stockQuestion ?? 0),
      variantQuestion: Number(input.purchaseSignals?.variantQuestion ?? 0)
    },
    commerce: input.commerce ? {
      priceStatus: input.commerce.priceStatus,
      amount: input.commerce.amount ?? null,
      currency: input.commerce.currency ?? null,
      stockStatus: input.commerce.stockStatus,
      sellerName: cleanText(input.commerce.sellerName, 200),
      variantName: cleanText(input.commerce.variantName, 200)
    } : null
  };
  const contentHash = sha256(base);
  const record = { ...base, contentHash };
  const validation = validateSourceRecord(record, policy);
  if (!validation.ok) throw new Error(`Invalid source record: ${validation.errors.join(' | ')}`);
  return Object.freeze(record);
}

export function validateSourceRecord(record, policy = FIXTURE_RESEARCH_POLICY) {
  const errors = [];
  if (!record || typeof record !== 'object') return { ok: false, errors: ['Source record must be an object.'] };
  if (record.sourceVersion !== 1) errors.push('Unsupported sourceVersion.');
  if (typeof record.id !== 'string' || !record.id) errors.push('Source id is required.');
  if (!policy.allowedSourceTypes.includes(record.sourceType)) errors.push('Source type is not allowed.');
  try {
    const url = new URL(record.url);
    if (!policy.allowedSchemes.includes(url.protocol)) errors.push('Source URL scheme is not allowed.');
  } catch {
    errors.push('Source URL is invalid.');
  }
  if (!validDate(record.observedAt) || !validDate(record.retrievedAt)) errors.push('Observed and retrieved timestamps are required.');
  if (record.synthetic !== true || record.networkFetched !== false) errors.push('Phase 2E records must be synthetic and non-networked.');
  if (record.redaction?.personalDataRemoved !== true || record.redaction?.rawPayloadStored !== false) {
    errors.push('Source redaction status is invalid.');
  }
  const clean = { ...record };
  delete clean.contentHash;
  if (record.contentHash !== sha256(clean)) errors.push('Source content hash mismatch.');
  return { ok: errors.length === 0, errors };
}

export function purchaseIntentScore(record) {
  const signals = record.purchaseSignals ?? {};
  return Math.min(100,
    signals.whereToBuy * 12 +
    signals.priceQuestion * 8 +
    signals.linkRequest * 15 +
    signals.stockQuestion * 7 +
    signals.variantQuestion * 6
  );
}
