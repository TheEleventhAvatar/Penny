import type { ProductOffer, PurchaseIntent } from '@/lib/domain';
import { asPurchaseIntent, extractPurchaseIntent } from '@/lib/agents/intent-agent';
import { createPravaClientFromEnv } from '@/lib/prava/client';

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
  const prava = createPravaClientFromEnv();
  const extracted = await extractPurchaseIntent(input.userMessage);
  const intent = asPurchaseIntent(extracted) satisfies PurchaseIntent;

  const purchaseIntent = await prava.createPurchaseIntent({
    ...intent,
    user_id: input.userId,
    conversation_id: input.conversationId,
  });

  const approval = await prava.requestApproval(purchaseIntent.intent_id, input.userId);

  return {
    purchaseIntent,
    approval,
  };
}
