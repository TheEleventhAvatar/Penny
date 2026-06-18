import { Annotation, StateGraph } from '@langchain/langgraph';
import { asPurchaseIntent, extractPurchaseIntent } from '@/lib/agents/intent-agent';
import { createPravaFromEnv } from '@/lib/prava/client';
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

    const prava = createPravaFromEnv();
    const result = await prava.registerIntent({
      cardId: state.userId, // will be replaced with actual enrolled card ID
      merchant: state.intent.merchant,
      amount: state.intent.amount,
      currency: state.intent.currency,
      itemCount: 1,
      useLimit: 1,
    });

    return {
      approvalId: result.intentId,
      pravaIntentId: result.intentId,
      intent: state.intent,
    };
  })
  .addNode('purchase', async (state) => {
    if (!state.pravaIntentId) {
      return {};
    }

    const prava = createPravaFromEnv();
    const tokens = await prava.invokeIntent({
      intentId: state.pravaIntentId,
      merchant: state.intent?.merchant ?? '',
      amount: state.intent?.amount ?? 0,
    });

    return {
      transactionId: `txn_${Date.now()}`,
    };
  })
  .addEdge('__start__', 'intent')
  .addEdge('intent', 'approval')
  .addEdge('approval', 'purchase')
  .addEdge('purchase', '__end__')
  .compile();
