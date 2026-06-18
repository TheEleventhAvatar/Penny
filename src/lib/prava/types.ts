import { z } from 'zod';
import { purchaseIntentSchema } from '@/lib/domain';

export const pravaEnvironmentSchema = z.enum(['sandbox', 'production']);

export type PravaEnvironment = z.infer<typeof pravaEnvironmentSchema>;

export interface PravaRetryOptions {
  retries?: number;
  delayMs?: number;
  backoffFactor?: number;
}

export interface PravaApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status?: number;
  requestId?: string;
}

export interface PravaAuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_at: string;
  scope?: string[];
}

export interface PurchaseIntentInput {
  user_id: string;
  conversation_id?: string;
  merchant: string;
  product: string;
  amount: number;
  currency: string;
  reason: string;
  category?: string;
  items?: Array<{ name: string; quantity: number; sku?: string; category?: string; url?: string }>;
  delivery_address?: string;
  metadata?: Record<string, unknown>;
}

export interface PravaSessionResponse {
  session_token: string;
  iframe_url: string;
  expires_at: string;
  user_id: string;
}

export interface PravaApprovalRequest {
  approval_id: string;
  intent_id: string;
  user_id: string;
  approval_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  passkey_required: true;
  requested_at: string;
  approved_at?: string;
}

export interface PravaTransactionToken {
  transaction_id: string;
  intent_id: string;
  merchant: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed';
  token_type: 'merchant_scoped';
  merchant_token: {
    pan: string;
    exp_month: number;
    exp_year: number;
    cvv: string;
    network: 'visa' | 'mastercard' | 'amex' | 'discover' | string;
    last4: string;
  };
  requested_at: string;
}

export interface PravaTransactionStatus {
  transaction_id: string;
  intent_id: string;
  merchant: string;
  amount: number;
  currency: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'voided';
  authorization_code?: string;
  receipt_url?: string;
  failure_reason?: string;
  updated_at: string;
}

export const pravaSessionSchema = z.object({
  session_token: z.string(),
  iframe_url: z.string().url(),
  expires_at: z.string().optional(),
});

export type PravaSession = z.infer<typeof pravaSessionSchema>;

export const pravaApprovalStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'expired',
  'processing',
]);

export type PravaApprovalStatus = z.infer<typeof pravaApprovalStatusSchema>;

export const pravaApprovalSchema = z.object({
  approval_id: z.string(),
  intent_id: z.string(),
  status: pravaApprovalStatusSchema,
  passkey_required: z.boolean().optional(),
  approved_at: z.string().nullable().optional(),
  rejected_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  merchant_locked_token_id: z.string().optional(),
});

export type PravaApproval = z.infer<typeof pravaApprovalSchema>;

export const pravaTransactionStatusSchema = z.enum([
  'created',
  'authorized',
  'submitted',
  'settled',
  'failed',
  'cancelled',
]);

export const pravaTransactionSchema = z.object({
  transaction_id: z.string(),
  intent_id: z.string(),
  status: pravaTransactionStatusSchema,
  merchant: z.string(),
  amount: z.number(),
  currency: z.string(),
  receipt_url: z.string().url().nullable().optional(),
  authorized_at: z.string().nullable().optional(),
  settled_at: z.string().nullable().optional(),
  error_code: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
});

export type PravaTransaction = z.infer<typeof pravaTransactionSchema>;

export const pravaReceiptSchema = z.object({
  receipt_id: z.string(),
  transaction_id: z.string(),
  merchant: z.string(),
  amount: z.number(),
  currency: z.string(),
  issued_at: z.string(),
  receipt_url: z.string().url().nullable().optional(),
});

export const pravaPurchaseIntentRequestSchema = purchaseIntentSchema.extend({
  conversation_id: z.string().optional(),
  user_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type PravaPurchaseIntentRequest = z.infer<typeof pravaPurchaseIntentRequestSchema>;

export const pravaPurchaseIntentSchema = purchaseIntentSchema.extend({
  intent_id: z.string(),
  approval_id: z.string().optional(),
  approval_required: z.boolean(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'completed']),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PravaPurchaseIntent = z.infer<typeof pravaPurchaseIntentSchema>;

export const pravaErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  requestId: z.string().optional(),
});

export type PravaErrorBody = z.infer<typeof pravaErrorSchema>;
