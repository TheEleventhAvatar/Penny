// Re-export all types from the main client module for backward compatibility.
// New code should import directly from '@/lib/prava/client'.
export type {
  PravaConfig,
  SessionResponse,
  RegisterIntentParams,
  RegisterIntentResult,
  InvokeIntentParams,
  PaymentTokens,
  RegisterAndInvokeParams,
  UpdateIntentParams,
  UpdateIntentResult,
  DeleteIntentResult,
  RemoveCardResult,
  Card,
  PravaError,
  Prava,
} from './client';