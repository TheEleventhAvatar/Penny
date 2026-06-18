import { z } from 'zod';

export const purchaseIntentSchema = z.object({
  merchant: z.string().min(1),
  product: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().min(1),
  reason: z.string().min(1),
  category: z.string().optional(),
  location: z.string().optional(),
  limitReason: z.string().optional(),
});

export type PurchaseIntent = z.infer<typeof purchaseIntentSchema>;

export const productOfferSchema = z.object({
  merchant: z.string(),
  product: z.string(),
  price: z.number(),
  currency: z.string(),
  deliveryEstimate: z.string(),
  merchantRating: z.number().min(0).max(5),
  url: z.string().url(),
  notes: z.string().optional(),
});

export type ProductOffer = z.infer<typeof productOfferSchema>;

export type AgentEventType =
  | 'discovery'
  | 'recommendation'
  | 'intent'
  | 'approval'
  | 'purchase'
  | 'replay';
