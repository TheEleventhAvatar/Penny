import { z } from 'zod';
import { createOpenAIClient } from '@/lib/openai';
import { purchaseIntentSchema, type PurchaseIntent } from '@/lib/domain';

const intentResponseSchema = purchaseIntentSchema.extend({
  category: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  limitReason: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
});

export type IntentExtractionResult = z.infer<typeof intentResponseSchema>;

export async function extractPurchaseIntent(userMessage: string): Promise<IntentExtractionResult> {
  const client = createOpenAIClient();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    input: [
      {
        role: 'system',
        content:
          'Extract a structured purchase intent from the user\'s request. Return only JSON matching the schema. Infer merchant when explicitly named or obvious, and set reason to a concise explanation.',
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'purchase_intent',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            merchant: { type: 'string' },
            product: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            reason: { type: 'string' },
            category: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            location: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            limitReason: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            confidence: { type: 'number' },
          },
          required: ['merchant', 'product', 'amount', 'currency', 'reason', 'category', 'location', 'limitReason', 'confidence'],
        },
      },
    },
  });

  const text = response.output_text;

  if (!text) {
    throw new Error('OpenAI did not return a purchase intent');
  }

  return intentResponseSchema.parse(JSON.parse(text));
}

export function asPurchaseIntent(input: IntentExtractionResult): PurchaseIntent {
  const { confidence: _confidence, ...rest } = input;
  return {
    merchant: rest.merchant,
    product: rest.product,
    amount: rest.amount,
    currency: rest.currency,
    reason: rest.reason,
    category: rest.category ?? undefined,
    location: rest.location ?? undefined,
    limitReason: rest.limitReason ?? undefined,
  };
}
