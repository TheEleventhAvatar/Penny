// Re-export all types from the main client module for backward compatibility.
// New code should import directly from '@/lib/prava/client'.
export type {
  SessionResponse,
  CreateSessionParams,
  PaymentLineItem,
  PaymentTransaction,
  PaymentResultResponse,
  PravaConfig,
  PravaError,
  Prava,
} from './client';