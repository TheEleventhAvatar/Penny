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

  const session = await prava.createSession({
    userId: input.userId,
    userEmail: `${input.userId}@penny.app`,
  });

  return {
    sessionId: session.session_id,
    sessionToken: session.session_token,
    iframeUrl: session.iframe_url,
    orderId: session.order_id,
  };
}