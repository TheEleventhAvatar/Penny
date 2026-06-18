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
    const session = await prava.createSession({
      userId: state.userId,
      userEmail: `${state.userId}@penny.app`,
      totalAmount: String(state.intent.amount),
      currency: state.intent.currency,
      description: `${state.intent.product} from ${state.intent.merchant} — ${state.intent.reason}`,
    });

    return {
      pravaIntentId: session.session_id,
      approvalId: session.session_token,
      intent: state.intent,
    };
  })
  .addNode('purchase', async (state) => {
    if (!state.pravaIntentId) {
      return {};
    }

    const prava = createPravaFromEnv();
    const result = await prava.pollPaymentResult(state.pravaIntentId);

    return {
      transactionId: result.transactions[0]?.txn_id ?? null,
      receiptUrl: result.transactions[0]?.line_items?.[0]?.token ?? null,
    };
  })
  .addEdge('__start__', 'intent')
  .addEdge('intent', 'approval')
  .addEdge('approval', 'purchase')
  .addEdge('purchase', '__end__')
  .compile();
