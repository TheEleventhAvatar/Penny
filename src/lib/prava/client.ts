import { z } from 'zod';
import { PravaSDK } from '@prava-sdk/core';
import type {
  PravaApiError,
  PravaApprovalRequest,
  PravaAuthResponse,
  PravaPurchaseIntent,
  PravaSessionResponse,
  PravaTransactionStatus,
  PravaTransactionToken,
  PurchaseIntentInput,
  PravaRetryOptions,
} from './types';
import { withRetry } from './retry';
import { pravaPurchaseIntentRequestSchema, pravaPurchaseIntentSchema } from './types';

const authResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_at: z.string(),
  scope: z.array(z.string()).optional(),
});

const sessionResponseSchema = z.object({
  session_token: z.string(),
  iframe_url: z.string().url(),
  expires_at: z.string(),
  user_id: z.string(),
});

const intentResponseSchema = z.object({
  intent_id: z.string(),
  merchant: z.string(),
  product: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'completed']),
  reason: z.string(),
  approval_required: z.boolean(),
  approval_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  expires_at: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const approvalResponseSchema = z.object({
  approval_id: z.string(),
  intent_id: z.string(),
  user_id: z.string(),
  approval_url: z.string().url(),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']),
  passkey_required: z.literal(true),
  requested_at: z.string(),
  approved_at: z.string().optional(),
});

const transactionTokenSchema = z.object({
  transaction_id: z.string(),
  intent_id: z.string(),
  merchant: z.string(),
  status: z.enum(['pending', 'authorized', 'captured', 'failed']),
  token_type: z.literal('merchant_scoped'),
  merchant_token: z.object({
    pan: z.string(),
    exp_month: z.number(),
    exp_year: z.number(),
    cvv: z.string(),
    network: z.string(),
    last4: z.string(),
  }),
  requested_at: z.string(),
});

const transactionStatusSchema = z.object({
  transaction_id: z.string(),
  intent_id: z.string(),
  merchant: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'authorized', 'captured', 'failed', 'voided']),
  authorization_code: z.string().optional(),
  receipt_url: z.string().url().optional(),
  failure_reason: z.string().optional(),
  updated_at: z.string(),
});

function toPravaError(status: number, payload: unknown, requestId?: string): PravaApiError {
  const details = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : undefined;
  return {
    code: typeof details?.code === 'string' ? details.code : 'PRAVA_REQUEST_FAILED',
    message: typeof details?.message === 'string' ? details.message : 'Prava request failed',
    details,
    status,
    requestId,
  };
}

export class PravaClientError extends Error {
  code: string;
  details?: Record<string, unknown>;
  requestId?: string;

  constructor(message: string, code = 'PRAVA_ERROR', options: { details?: Record<string, unknown>; requestId?: string } = {}) {
    super(message);
    this.name = 'PravaClientError';
    this.code = code;
    this.details = options.details;
    this.requestId = options.requestId;
  }
}

export interface PravaClientConfig {
  apiKey: string;
  secretKey: string;
  baseUrl?: string;
  retry?: PravaRetryOptions;
}

export class PravaClient {
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly retry: PravaRetryOptions;

  constructor(config: PravaClientConfig) {
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
    this.baseUrl = config.baseUrl ?? process.env.PRAVA_BASE_URL ?? 'https://api.prava.space';
    this.retry = config.retry ?? { retries: 2, delayMs: 300, backoffFactor: 2 };
  }

  async authenticate(): Promise<PravaAuthResponse> {
    return withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/v1/auth/token`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ grantType: 'client_credentials' }),
      });

      const payload = await this.parseJson(response);
      if (!response.ok) {
        throw toPravaError(response.status, payload, response.headers.get('x-request-id') ?? undefined);
      }

      return authResponseSchema.parse(payload);
    }, this.retry);
  }

  async createSession(userId: string, userEmail?: string): Promise<PravaSessionResponse> {
    return withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/v1/sessions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId, userEmail }),
      });

      const payload = await this.parseJson(response);
      if (!response.ok) {
        throw toPravaError(response.status, payload, response.headers.get('x-request-id') ?? undefined);
      }

      return sessionResponseSchema.parse(payload);
    }, this.retry);
  }

  async createPurchaseIntent(input: PurchaseIntentInput): Promise<PravaPurchaseIntent> {
    return withRetry(async () => {
      const validatedInput = pravaPurchaseIntentRequestSchema.parse(input);
      const response = await fetch(`${this.baseUrl}/v1/intents`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...validatedInput,
          channel: 'agentic-commerce',
        }),
      });

      const payload = await this.parseJson(response);
      if (!response.ok) {
        throw toPravaError(response.status, payload, response.headers.get('x-request-id') ?? undefined);
      }

      return intentResponseSchema.parse(payload);
    }, this.retry);
  }

  async requestApproval(intentId: string, userId: string): Promise<PravaApprovalRequest> {
    return withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/v1/intents/${intentId}/approvals`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId, approvalMode: 'passkey' }),
      });

      const payload = await this.parseJson(response);
      if (!response.ok) {
        throw toPravaError(response.status, payload, response.headers.get('x-request-id') ?? undefined);
      }

      return approvalResponseSchema.parse(payload);
    }, this.retry);
  }

  async getApprovalStatus(intentId: string): Promise<PravaApprovalRequest> {
    return withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/v1/intents/${intentId}/approvals/latest`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const payload = await this.parseJson(response);
      if (!response.ok) {
        throw toPravaError(response.status, payload, response.headers.get('x-request-id') ?? undefined);
      }

      return approvalResponseSchema.parse(payload);
    }, this.retry);
  }

  async issueMerchantToken(intentId: string): Promise<PravaTransactionToken> {
    return withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/v1/intents/${intentId}/token`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      const payload = await this.parseJson(response);
      if (!response.ok) {
        throw toPravaError(response.status, payload, response.headers.get('x-request-id') ?? undefined);
      }

      return transactionTokenSchema.parse(payload);
    }, this.retry);
  }

  async getTransactionStatus(transactionId: string): Promise<PravaTransactionStatus> {
    return withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/v1/transactions/${transactionId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const payload = await this.parseJson(response);
      if (!response.ok) {
        throw toPravaError(response.status, payload, response.headers.get('x-request-id') ?? undefined);
      }

      return transactionStatusSchema.parse(payload);
    }, this.retry);
  }

  createBrowserCollector(config: {
    publishableKey: string;
    sessionToken: string;
    iframeUrl: string;
    container: string | HTMLElement;
  }) {
    const sdk = new PravaSDK({ publishableKey: config.publishableKey });

    return {
      collectPAN: () => sdk.collectPAN({ sessionToken: config.sessionToken, iframeUrl: config.iframeUrl, container: config.container }),
      destroy: () => sdk.destroy(),
    };
  }

  private getHeaders(includeSecret = false): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Api-Key': this.apiKey,
      ...(includeSecret ? { Authorization: `Bearer ${this.secretKey}` } : {}),
    };
  }

  private async parseJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
}

export function createPravaClientFromEnv() {
  const apiKey = process.env.PRAVA_API_KEY;
  const secretKey = process.env.PRAVA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('Missing PRAVA_API_KEY or PRAVA_SECRET_KEY');
  }

  return new PravaClient({
    apiKey,
    secretKey,
    baseUrl: process.env.PRAVA_BASE_URL,
  });
}