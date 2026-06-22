'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PravaSDK } from '@prava-sdk/core';
import type { PravaError, CardValidationState } from '@prava-sdk/core';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY || '';

interface PravaCardFormProps {
  /** Pre-created session from server action — do NOT create session inside this component */
  session: {
    session_token: string;
    iframe_url: string;
    order_id: string;
    expires_at: string;
  };
  onError?: (error: PravaError | Error) => void;
}

export default function PravaCardForm({ session, onError }: PravaCardFormProps) {
  const sdkRef = useRef<PravaSDK | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // CRITICAL: React Strict Mode double-mount guard.
  // Resets to false in cleanup so remount re-initializes.
  const hasStarted = useRef(false);

  const [loading, setLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<CardValidationState | null>(null);

  const mountSdk = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSdkReady(false);

    if (sdkRef.current) {
      sdkRef.current.destroy();
      sdkRef.current = null;
    }

    try {
      const sdk = new PravaSDK({ publishableKey: PUBLISHABLE_KEY });
      sdkRef.current = sdk;

      if (containerRef.current) {
        await sdk.collectPAN({
          sessionToken: session.session_token,
          iframeUrl: session.iframe_url,
          container: containerRef.current,
          onReady: () => { setSdkReady(true); setLoading(false); },
          onChange: (state: CardValidationState) => setValidationState(state),
          onSuccess: () => {
            // Payment completion handled by PARENT via polling.
            // Do NOT add payment-result logic here.
          },
          onError: (err: PravaError) => { setError(err.message); onError?.(err); },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      onError?.(err instanceof Error ? err : new Error(msg));
      setLoading(false);
    }
  }, [session, onError]);

  // CRITICAL: Mount with Strict Mode handling
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      mountSdk();
    }
    return () => {
      sdkRef.current?.destroy();
      sdkRef.current = null;
      hasStarted.current = false; // ← Reset so remount re-initializes
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CRITICAL: Fallback for onReady not firing.
  // MutationObserver detects iframe + 5s hard timeout.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || sdkReady) return;

    const hideLoading = () => { setSdkReady(true); setLoading(false); };

    const observer = new MutationObserver(() => {
      if (container.querySelector('iframe')) hideLoading();
    });
    observer.observe(container, { childList: true, subtree: true });

    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => { observer.disconnect(); clearTimeout(timeout); };
  }, [sdkReady]);

  return (
    <div className="w-full">
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <p className="font-medium">Error: {error}</p>
          <button
            onClick={mountSdk}
            className="mt-2 text-sm text-[#f7b267] underline underline-offset-2 hover:text-[#ffd08a]"
          >
            Try Again
          </button>
        </div>
      )}

      {loading && !sdkReady && !error && (
        <div className="flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/50 p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f7b267] border-t-transparent" />
            <p className="text-sm text-slate-400">Loading secure card form&hellip;</p>
          </div>
        </div>
      )}

      {validationState && sdkReady && (
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-400">
          <span className={validationState.cardNumber.isValid ? 'text-green-400' : ''}>
            {validationState.cardNumber.isValid ? '✓' : '○'} Card Number
          </span>
          <span className={validationState.expiry.isValid ? 'text-green-400' : ''}>
            {validationState.expiry.isValid ? '✓' : '○'} Expiry
          </span>
          <span className={validationState.cvv.isValid ? 'text-green-400' : ''}>
            {validationState.cvv.isValid ? '✓' : '○'} CVV
          </span>
          {validationState.isComplete && (
            <span className="text-green-400">All fields valid ✓</span>
          )}
        </div>
      )}

      {/* REQUIRED: iframe mounts here. Min ~400px height, overflow hidden. */}
      <div
        ref={containerRef}
        id="prava-card-form"
        className="min-h-[400px] overflow-hidden rounded-xl border border-white/10 bg-slate-950/30"
      />
    </div>
  );
}