'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import PravaCardForm from '@/components/PravaCardForm';
import { createPravaSession, pollPaymentResult } from '@/app/actions';
import type { SessionResponse, PaymentResultResponse } from '@/app/actions';

export default function CheckoutPage() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResultResponse | null>(null);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isIdle = !session && !paymentResult && !loading;
  const isCardEntry = !!session && !paymentResult;
  const isCompleted = paymentResult?.status === 'completed';
  const isFailed = paymentResult?.status === 'failed';
  const completedTxn = isCompleted ? paymentResult.transactions[0] ?? null : null;
  const completedLineItem = completedTxn?.line_items?.[0] ?? null;

  const stopPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    setPolling(false);
  }, []);

  const startPolling = (sessionId: string) => {
    setPolling(true);
    const doPoll = async () => {
      try {
        const result = await pollPaymentResult(sessionId);
        if (result.status === 'completed' || result.status === 'failed') {
          setPaymentResult(result);
          stopPolling();
        }
      } catch {
        // Keep polling on transient errors
      }
    };
    doPoll();
    pollingRef.current = setInterval(doPoll, 3000);
  };

  const handleCheckout = async () => {
    setLoading(true); setError(null); setPaymentResult(null);
    try {
      // ADAPT: Get userId/userEmail from your auth system, totalAmount from your cart/product
      const s = await createPravaSession({
        userId: 'user_123',
        userEmail: 'user@example.com',
        totalAmount: '49.99',
        currency: 'USD',
      });
      setSession(s);
      startPolling(s.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally { setLoading(false); }
  };

  const handleReset = () => { stopPolling(); setSession(null); setPaymentResult(null); setError(null); };

  useEffect(() => { return () => { if (pollingRef.current) clearInterval(pollingRef.current); }; }, []);

  return (
    <main className="penny-shell mx-auto min-h-screen max-w-3xl px-6 py-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-glow backdrop-blur-xl">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Checkout</h1>
        <p className="mb-6 text-sm text-slate-400">Complete your payment securely with Prava.</p>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {isIdle && (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="text-slate-300">Ready to complete your purchase?</p>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#f7b267] px-6 text-sm font-medium text-slate-950 shadow-[0_12px_40px_rgba(247,178,103,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ffd08a] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? 'Creating session…' : 'Pay $49.99'}
            </button>
          </div>
        )}

        {isCardEntry && session && (
          <div>
            <PravaCardForm session={session} onError={(err) => setError(err.message)} />
            {polling && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#f7b267] border-t-transparent" />
                Waiting for payment completion&hellip;
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleReset}
                className="text-sm text-slate-500 underline underline-offset-2 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isCompleted && completedLineItem && (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Payment Complete</h2>
            <div className="mx-auto max-w-sm space-y-2 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Network Token</span>
                <span className="font-mono text-white">{completedLineItem.token}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dynamic CVV</span>
                <span className="font-mono text-white">{completedLineItem.dynamic_cvv}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expiry</span>
                <span className="text-white">{completedLineItem.expiry_month}/{completedLineItem.expiry_year}</span>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#f7b267] px-6 text-sm font-medium text-slate-950 shadow-[0_12px_40px_rgba(247,178,103,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ffd08a]"
            >
              New Checkout
            </button>
          </div>
        )}

        {isFailed && (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Payment Failed</h2>
            <p className="text-sm text-slate-400">
              {paymentResult?.transactions[0]?.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={handleReset}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#f7b267] px-6 text-sm font-medium text-slate-950 shadow-[0_12px_40px_rgba(247,178,103,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ffd08a]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}