import { PravaSDK } from '@prava-sdk/core';
import type { CollectPANResult, CollectPANOptions } from '@prava-sdk/core';

// ── Configuration ────────────────────────────────────────────

export interface PravaConfig {
  publishableKey: string;   // pk_live_xxx | pk_test_xxx — for SDK
  secretKey: string;        // sk_xxx — for server-side API calls
  baseUrl?: string;         // API base URL (default: https://api.prava.space)
  iframeUrl?: string;       // Card collection iframe URL (default: https://collect.prava.space)
}

// ── Session ──────────────────────────────────────────────────

export interface SessionResponse {
  session_token: string;
  iframe_url: string;
  expires_at: string;
  user_id: string;
}

// ── Register Intent ──────────────────────────────────────────

export interface RegisterIntentParams {
  cardId: string;
  merchant: string;
  amount: number;
  currency: string;
  itemCount?: number;
  productUrl?: string;
  useLimit?: number;
  frequency?: 'one-time' | 'daily' | 'weekly' | 'monthly';
  expiresAt?: string;
}

export interface RegisterIntentResult {
  intentId: string;
  status: 'approved' | 'rejected';
  mcc: string;
  mandateId: string;
  createdAt: string;
}

// ── Invoke Intent ────────────────────────────────────────────

export interface InvokeIntentParams {
  intentId: string;
  merchant: string;
  amount: number;
  itemCount?: number;
}

export interface PaymentTokens {
  pan: string;
  expMonth: number;
  expYear: number;
  cvv: string;
}

// ── Register & Invoke ────────────────────────────────────────

export interface RegisterAndInvokeParams {
  cardId: string;
  merchant: string;
  amount: number;
  currency: string;
  itemCount?: number;
  productUrl?: string;
}

// ── Update Intent ────────────────────────────────────────────

export interface UpdateIntentParams {
  intentId: string;
  amount?: number;
  itemCount?: number;
  useLimit?: number;
  frequency?: 'one-time' | 'daily' | 'weekly' | 'monthly';
  expiresAt?: string;
}

export interface UpdateIntentResult {
  intentId: string;
  status: 'updated';
  updatedFields: string[];
}

// ── Delete Intent ────────────────────────────────────────────

export interface DeleteIntentResult {
  intentId: string;
  status: 'cancelled';
}

// ── Card Management ──────────────────────────────────────────

export interface RemoveCardResult {
  cardId: string;
  status: 'removed';
}

export interface Card {
  cardId: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  status: 'active' | 'expired' | 'removed';
}

// ── Error ────────────────────────────────────────────────────

export class PravaError extends Error {
  code: string;
  details?: Record<string, unknown>;
  requestId?: string;
  status?: number;

  constructor(
    message: string,
    code = 'PRAVA_ERROR',
    options: { details?: Record<string, unknown>; requestId?: string; status?: number } = {},
  ) {
    super(message);
    this.name = 'PravaError';
    this.code = code;
    this.details = options.details;
    this.requestId = options.requestId;
    this.status = options.status;
  }
}

// ── Prava (Server-Side Client) ────────────────────────────────
// Wraps the Prava REST API for server-side use (sessions, intents, tokens, etc.)
// Card collection is handled client-side via the PravaSDK.

export class Prava {
  private readonly publishableKey: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly iframeUrl: string;
  private sdk: PravaSDK | null = null;

  constructor(config: PravaConfig) {
    this.publishableKey = config.publishableKey;
    this.secretKey = config.secretKey;
    this.baseUrl = config.baseUrl ?? 'https://api.prava.space';
    this.iframeUrl = config.iframeUrl ?? 'https://collect.prava.space';
  }

  // ── Card Collection (client-side, via SDK) ───────────────

  /**
   * Initialize the client-side Prava SDK for card collection.
   */
  initSDK(): PravaSDK {
    if (!this.sdk) {
      this.sdk = new PravaSDK({ publishableKey: this.publishableKey });
    }
    return this.sdk;
  }

  /**
   * Securely collect card details via PCI-compliant iframe.
   * Uses @prava-sdk/core under the hood.
   *
   * @param sessionToken - Session token from createSession()
   * @param container - CSS selector or DOM element to mount the card form
   * @param callbacks - Optional event callbacks
   */
  async collectPAN(
    sessionToken: string,
    container: string | HTMLElement,
    callbacks?: Pick<CollectPANOptions, 'onReady' | 'onChange' | 'onSuccess' | 'onError'>,
  ): Promise<CollectPANResult> {
    const sdk = this.initSDK();
    return sdk.collectPAN({
      sessionToken,
      iframeUrl: this.iframeUrl,
      container,
      ...callbacks,
    });
  }

  /**
   * Clean up the SDK instance and remove the iframe.
   */
  destroySDK(): void {
    if (this.sdk) {
      this.sdk.destroy();
      this.sdk = null;
    }
  }

  // ── Session Management (server-side) ─────────────────────

  async createSession(userId: string, userEmail?: string): Promise<SessionResponse> {
    const response = await fetch(`${this.baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ user_id: userId, user_email: userEmail }),
    });
    return this.handleResponse<SessionResponse>(response);
  }

  // ── Intent Management (server-side) ──────────────────────

  async registerIntent(params: RegisterIntentParams): Promise<RegisterIntentResult> {
    const response = await fetch(`${this.baseUrl}/v1/intents`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        card_id: params.cardId,
        merchant: params.merchant,
        amount: params.amount,
        currency: params.currency,
        item_count: params.itemCount,
        product_url: params.productUrl,
        use_limit: params.useLimit,
        frequency: params.frequency,
        expires_at: params.expiresAt,
      }),
    });
    const result = await this.handleResponse<RegisterIntentResult>(response);
    return result;
  }

  async invokeIntent(params: InvokeIntentParams): Promise<PaymentTokens> {
    const response = await fetch(`${this.baseUrl}/v1/intents/${params.intentId}/tokens`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        merchant: params.merchant,
        amount: params.amount,
        item_count: params.itemCount,
      }),
    });
    return this.handleResponse<PaymentTokens>(response);
  }

  async registerAndInvokeIntent(params: RegisterAndInvokeParams): Promise<PaymentTokens> {
    const response = await fetch(`${this.baseUrl}/v1/intents/register-and-invoke`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        card_id: params.cardId,
        merchant: params.merchant,
        amount: params.amount,
        currency: params.currency,
        item_count: params.itemCount,
        product_url: params.productUrl,
      }),
    });
    return this.handleResponse<PaymentTokens>(response);
  }

  async updateIntent(params: UpdateIntentParams): Promise<UpdateIntentResult> {
    const response = await fetch(`${this.baseUrl}/v1/intents/${params.intentId}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({
        amount: params.amount,
        item_count: params.itemCount,
        use_limit: params.useLimit,
        frequency: params.frequency,
        expires_at: params.expiresAt,
      }),
    });
    return this.handleResponse<UpdateIntentResult>(response);
  }

  async deleteIntent(intentId: string): Promise<DeleteIntentResult> {
    const response = await fetch(`${this.baseUrl}/v1/intents/${intentId}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    return this.handleResponse<DeleteIntentResult>(response);
  }

  // ── Card Management (server-side) ────────────────────────

  async listCards(): Promise<Card[]> {
    const response = await fetch(`${this.baseUrl}/v1/cards`, {
      method: 'GET',
      headers: this.headers(),
    });
    return this.handleResponse<Card[]>(response);
  }

  async removeCard(cardId: string): Promise<RemoveCardResult> {
    const response = await fetch(`${this.baseUrl}/v1/cards/${cardId}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    return this.handleResponse<RemoveCardResult>(response);
  }

  async getTransactionStatus(transactionId: string): Promise<{
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
  }> {
    const response = await fetch(`${this.baseUrl}/v1/transactions/${transactionId}`, {
      method: 'GET',
      headers: this.headers(),
    });
    return this.handleResponse(response);
  }

  // ── Helpers ──────────────────────────────────────────────

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Api-Key': this.secretKey,
    };
  }

  private async parseJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const payload = await this.parseJson(response);
    if (!response.ok) {
      const code = payload && typeof payload === 'object' && 'code' in (payload as object)
        ? (payload as Record<string, unknown>).code as string
        : 'PRAVA_REQUEST_FAILED';
      const message = payload && typeof payload === 'object' && 'message' in (payload as object)
        ? (payload as Record<string, unknown>).message as string
        : 'Prava request failed';
      throw new PravaError(message, code, {
        details: payload as Record<string, unknown>,
        status: response.status,
        requestId: response.headers.get('x-request-id') ?? undefined,
      });
    }
    return payload as T;
  }
}

// ── Factory ──────────────────────────────────────────────────

export function createPravaFromEnv(): Prava {
  const publishableKey = process.env.PRAVA_PUBLISHABLE_KEY || process.env.PRAVA_API_KEY;
  const secretKey = process.env.PRAVA_SECRET_KEY;

  if (!publishableKey) {
    throw new PravaError(
      'Missing PRAVA_PUBLISHABLE_KEY or PRAVA_API_KEY in environment',
      'PRAVA_CONFIG_ERROR',
    );
  }
  if (!secretKey) {
    throw new PravaError(
      'Missing PRAVA_SECRET_KEY in environment',
      'PRAVA_CONFIG_ERROR',
    );
  }

  return new Prava({
    publishableKey,
    secretKey,
    baseUrl: process.env.PRAVA_BASE_URL,
    iframeUrl: process.env.PRAVA_IFRAME_URL,
  });
}