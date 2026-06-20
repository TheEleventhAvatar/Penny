// ── Session Types ────────────────────────────────────────────

export interface SessionResponse {
  session_id: string;
  session_token: string;
  expires_at: string;
  iframe_url: string;
  order_id: string;
}

export interface CreateSessionParams {
  userId: string;
  userEmail: string;
  totalAmount?: string;
  currency?: string;
  description?: string;
  callbackUrl?: string;
  purchaseContext?: PurchaseContextItem[];
}

interface PurchaseContextItem {
  merchant_details: {
    name: string;
    url: string;
    country_code_iso2: string;
    category_code?: string;
    category?: string;
  };
  product_details: Array<{
    description: string;
    unit_price: string;
    quantity?: number;
  }>;
  effective_until_minutes?: number;
}

// ── Payment Result Types ─────────────────────────────────────

export interface PaymentLineItem {
  txn_ref_id: string;
  merchant_name: string;
  merchant_url: string;
  total_amount: string;
  status: string;
  token: string | null;
  dynamic_cvv: string | null;
  expiry_month: string | null;
  expiry_year: string | null;
  products: Array<{
    product_ref_id: string;
    external_product_id: string | null;
    name: string;
    unit_price: string;
    quantity: number;
  }>;
}

export interface PaymentTransaction {
  txn_id: string;
  status: 'pending' | 'awaiting_result' | 'completed' | 'failed';
  line_items: PaymentLineItem[];
  error?: { code: string; message: string };
}

export interface PaymentResultResponse {
  session_id: string;
  order_id: string | null;
  status: 'pending' | 'awaiting_result' | 'completed' | 'failed';
  transactions: PaymentTransaction[];
}

// ── Config ───────────────────────────────────────────────────

export interface PravaConfig {
  secretKey: string;       // sk_test_xxx — for server-side API calls (Api-Key + Authorization)
  baseUrl?: string;        // API base URL (default: https://sandbox.api.prava.space)
}

// ── Error ────────────────────────────────────────────────────

export class PravaError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code = 'PRAVA_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'PravaError';
    this.code = code;
    this.details = details;
  }
}

// ── Prava Client ─────────────────────────────────────────────

export class Prava {
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(config: PravaConfig) {
    this.secretKey = config.secretKey;
    this.baseUrl = config.baseUrl ?? 'https://sandbox.api.prava.space';
  }

  // ── Session Management ────────────────────────────────────

  async createSession(userId: string, userEmail?: string): Promise<SessionResponse> {
    const body = { userId, userEmail };
    console.log('[Prava] POST /v1/sessions', {
      url: `${this.baseUrl}/v1/sessions`,
      headers: this.authHeaders(),
      body,
    });
    const response = await fetch(`${this.baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await this.parseJson(response);
      const err = errorData && typeof errorData === 'object'
        ? (errorData as Record<string, unknown>).error as Record<string, unknown> ?? {}
        : {};
      throw new PravaError(
        (err.message as string) || `Failed to create session (HTTP ${response.status})`,
        (err.code as string) || 'SESSION_CREATE_ERROR',
        errorData as Record<string, unknown>,
      );
    }

    return response.json();
  }

  async pollPaymentResult(sessionId: string): Promise<PaymentResultResponse> {
    const response = await fetch(
      `${this.baseUrl}/v1/sessions/${sessionId}/payment-result?_t=${Date.now()}`,
      {
        method: 'GET',
        headers: this.authHeaders(),
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new PravaError('Session not found', 'SESSION_NOT_FOUND');
      }
      const errorData = await this.parseJson(response);
      const err = errorData && typeof errorData === 'object'
        ? (errorData as Record<string, unknown>).error as Record<string, unknown> ?? {}
        : {};
      throw new PravaError(
        (err.message as string) || `Failed to poll payment result (HTTP ${response.status})`,
        (err.code as string) || 'POLL_ERROR',
        errorData as Record<string, unknown>,
      );
    }

    return response.json();
  }

  async checkHealth(): Promise<{ healthy: boolean }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { cache: 'no-store' });
      return { healthy: res.ok };
    } catch {
      return { healthy: false };
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  private authHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Api-Key': this.secretKey,
      'Authorization': `Bearer ${this.secretKey}`,
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

// ── Factory ──────────────────────────────────────────────────

export function createPravaFromEnv(): Prava {
  const secretKey = process.env.MERCHANT_SECRET_KEY || process.env.PRAVA_SECRET_KEY;

  if (!secretKey) {
    throw new PravaError(
      'Missing secret key. Set MERCHANT_SECRET_KEY or PRAVA_SECRET_KEY in env.',
      'PRAVA_CONFIG_ERROR',
    );
  }

  return new Prava({
    secretKey,
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.PRAVA_BASE_URL,
  });
}