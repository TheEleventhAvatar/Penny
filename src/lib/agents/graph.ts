import { Annotation, StateGraph } from '@langchain/langgraph';
import { asPurchaseIntent, extractPurchaseIntent } from '@/lib/agents/intent-agent';
import { createPravaClientFromEnv } from '@/lib/prava/client';
import type { PurchaseIntent, ProductOffer } from '@/lib/domain';

const CommerceState = Annotation.Root({
  userId: Annotation<string>,
  userMessage: Annotation<string>,
  intent: Annotation<PurchaseIntent | null>,
  offers: Annotation<ProductOffer[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  pravaIntentId: Annotation<string | null>,
  approvalId: Annotation<string | null>,
  transactionId: Annotation<string | null>,
  receiptUrl: Annotation<string | null>,
});

export type CommerceGraphState = typeof CommerceState.State;

export const commerceGraph = new StateGraph(CommerceState)
  .addNode('intent', async (state) => {
    const extracted = await extractPurchaseIntent(state.userMessage);
    return {
      intent: asPurchaseIntent(extracted),
    };
  })
  .addNode('approval', async (state) => {
    if (!state.intent) {
      return {};
    }

    const prava = createPravaClientFromEnv();
    const createdIntent = await prava.createPurchaseIntent({
      user_id: state.userId,
      merchant: state.intent.merchant,
      product: state.intent.product,
      amount: state.intent.amount,
      currency: state.intent.currency,
      reason: state.intent.reason,
      category: state.intent.category,
      metadata: {
        location: state.intent.location,
        limitReason: state.intent.limitReason,
      },
    });

    const approval = await prava.requestApproval(createdIntent.intent_id, state.userId);

    return {
      approvalId: approval.approval_id,
      pravaIntentId: createdIntent.intent_id,
      intent: {
        ...state.intent,
        merchant: createdIntent.merchant,
        product: createdIntent.product,
      },
    };
  })
  .addNode('purchase', async (state) => {
    if (!state.pravaIntentId) {
      return {};
    }

    const prava = createPravaClientFromEnv();
    const transaction = await prava.issueMerchantToken(state.pravaIntentId);

    return {
      transactionId: transaction.transaction_id,
    };
  })
  .addEdge('__start__', 'intent')
  .addEdge('intent', 'approval')
  .addEdge('approval', 'purchase')
  .addEdge('purchase', '__end__')
  .compile();
