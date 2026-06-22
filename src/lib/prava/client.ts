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
  status: 'pending' | 'awaiting_result' | 'completed' | 'failed' | string;
  line_items: PaymentLineItem[];
  error?: { code: string; message: string };
}

export interface PaymentResultResponse {
  session_id: string;
  order_id: string | null;
  status: 'pending' | 'awaiting_result' | 'completed' | 'failed' | string;
  transactions: PaymentTransaction[];
}

// ── Config ───────────────────────────────────────────────────

export interface PravaConfig {
  secretKey: string;
  baseUrl?: string;
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
    this.baseUrl = config.baseUrl ?? 'https://api.prava.space';
  }

  // ── Session Management ────────────────────────────────────

  async createSession(params: CreateSessionParams): Promise<SessionResponse> {
    const {
      userId,
      userEmail,
      totalAmount = '99.99',
      currency = 'USD',
      description = 'Purchase',
      callbackUrl,
      purchaseContext,
    } = params;

    const body: Record<string, unknown> = {
      user_id: userId,
      user_email: userEmail,
      total_amount: totalAmount,
      currency,
      description,
      purchase_context: purchaseContext || [
        {
          merchant_details: {
            name: 'Penny AI',
            url: 'https://penny.prava.space',
            country_code_iso2: 'US',
            category_code: '5734',
            category: 'Software Services',
          },
          product_details: [
            {
              description: description || 'Purchase',
              unit_price: totalAmount,
              quantity: 1,
            },
          ],
          effective_until_minutes: 15,
        },
      ],
    };

    if (callbackUrl) {
      body.callback_url = callbackUrl;
    }

    const response = await fetch(`${this.baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await this.parseJson(response);
      const err =
        errorData && typeof errorData === 'object'
          ? ((errorData as Record<string, unknown>).error as Record<string, unknown>) ?? {}
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
      const err =
        errorData && typeof errorData === 'object'
          ? ((errorData as Record<string, unknown>).error as Record<string, unknown>) ?? {}
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
      Authorization: `Bearer ${this.secretKey}`,
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
  const secretKey = process.env.MERCHANT_SECRET_KEY;

  if (!secretKey) {
    throw new PravaError(
      'Missing MERCHANT_SECRET_KEY. Set it in .env.local (server-side only).',
      'PRAVA_CONFIG_ERROR',
    );
  }

  return new Prava({
    secretKey,
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.prava.space',
  });
}