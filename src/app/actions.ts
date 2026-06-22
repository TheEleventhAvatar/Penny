'use server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.prava.space';
const MERCHANT_SECRET_KEY = process.env.MERCHANT_SECRET_KEY;

export interface SessionResponse {
  session_id: string;
  session_token: string;
  expires_at: string;
  iframe_url: string;
  order_id: string;
}

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

interface CreateSessionParams {
  userId: string;
  userEmail: string;
  totalAmount?: string;
  currency?: string;
  description?: string;
  callbackUrl?: string;
  purchaseContext?: Array<{
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
  }>;
}

export async function createPravaSession({
  userId,
  userEmail,
  totalAmount = '99.99',
  currency = 'USD',
  description,
  callbackUrl,
  purchaseContext,
}: CreateSessionParams): Promise<SessionResponse> {
  if (!MERCHANT_SECRET_KEY || MERCHANT_SECRET_KEY.includes('YOUR_SECRET_KEY')) {
    throw new Error(
      'MERCHANT_SECRET_KEY not configured. Add it to .env.local:\n' +
      'MERCHANT_SECRET_KEY=sk_test_your_key_here'
    );
  }

  const res = await fetch(`${BACKEND_URL}/v1/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MERCHANT_SECRET_KEY}`,
    },
    body: JSON.stringify({
      user_id: userId,
      user_email: userEmail,
      total_amount: totalAmount,
      currency,
      description: description || 'Purchase',
      ...(callbackUrl && { callback_url: callbackUrl }),
      purchase_context: purchaseContext || [{
        merchant_details: {
          name: 'Penny AI',
          url: 'https://penny.prava.space',
          country_code_iso2: 'US',
          category_code: '5734',
          category: 'Software Services',
        },
        product_details: [{
          description: description || 'Purchase',
          unit_price: totalAmount,
          quantity: 1,
        }],
        effective_until_minutes: 15,
      }],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(errorData.error?.message || `Failed to create session (HTTP ${res.status})`);
  }

  return res.json();
}

export async function pollPaymentResult(sessionId: string): Promise<PaymentResultResponse> {
  if (!MERCHANT_SECRET_KEY) throw new Error('MERCHANT_SECRET_KEY not configured.');

  const res = await fetch(
    `${BACKEND_URL}/v1/sessions/${sessionId}/payment-result?_t=${Date.now()}`,
    {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${MERCHANT_SECRET_KEY}` },
      cache: 'no-store',
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    if (res.status === 404) throw new Error('Session not found');
    const errorData = await res.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(errorData.error?.message || `Failed to poll result (HTTP ${res.status})`);
  }

  return res.json();
}

export async function checkPravaHealth(): Promise<{ healthy: boolean }> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { cache: 'no-store' });
    return { healthy: res.ok };
  } catch {
    return { healthy: false };
  }
}