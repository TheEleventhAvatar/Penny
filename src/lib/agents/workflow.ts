import type { ProductOffer, PurchaseIntent } from '@/lib/domain';
import { asPurchaseIntent, extractPurchaseIntent } from '@/lib/agents/intent-agent';
import { createPravaFromEnv } from '@/lib/prava/client';

export type DiscoveryResult = {
  intent: PurchaseIntent;
  offers: ProductOffer[];
};

export type ApprovalSummary = {
  approved: boolean;
  approvalId?: string;
  transactionId?: string;
};

export async function runCommerceAssistant(input: {
  userId: string;
  userMessage: string;
  conversationId?: string;
}) {
  const prava = createPravaFromEnv();
  const extracted = await extractPurchaseIntent(input.userMessage);
  const intent = asPurchaseIntent(extracted) satisfies PurchaseIntent;

  const result = await prava.registerIntent({
    cardId: input.userId, // will be replaced with actual enrolled card ID
    merchant: intent.merchant,
    amount: intent.amount,
    currency: intent.currency,
    itemCount: 1,
    useLimit: 1,
  });

  return {
    intentId: result.intentId,
    status: result.status,
    mcc: result.mcc,
    mandateId: result.mandateId,
    createdAt: result.createdAt,
  };
}
