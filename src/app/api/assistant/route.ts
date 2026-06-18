import { NextResponse } from 'next/server';
import { asPurchaseIntent, extractPurchaseIntent } from '@/lib/agents/intent-agent';
import { PravaClientError, createPravaClientFromEnv } from '@/lib/prava/client';
import { purchaseIntentSchema } from '@/lib/domain';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userMessage?: string; userId?: string; conversationId?: string };

    if (!body.userMessage || !body.userId) {
      return NextResponse.json({ error: 'userMessage and userId are required' }, { status: 400 });
    }

    const prava = createPravaClientFromEnv();
    const extracted = await extractPurchaseIntent(body.userMessage);
    const intent = purchaseIntentSchema.parse(asPurchaseIntent(extracted));

    const purchaseIntent = await prava.createPurchaseIntent({
      ...intent,
      user_id: body.userId,
      conversation_id: body.conversationId,
    });

    const approval = await prava.requestApproval(purchaseIntent.intent_id, body.userId);

    return NextResponse.json({
      intent: purchaseIntent,
      approval,
    });
  } catch (error) {
    if (error instanceof PravaClientError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          requestId: error.requestId,
        },
        { status: error.code === 'PRAVA_CONFIG_ERROR' ? 500 : 502 },
      );
    }

    const message = error instanceof Error ? error.message : 'Unexpected assistant failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
