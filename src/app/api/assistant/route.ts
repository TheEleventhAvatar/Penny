import { NextResponse } from 'next/server';
import { asPurchaseIntent, extractPurchaseIntent } from '@/lib/agents/intent-agent';
import { PravaError, createPravaFromEnv } from '@/lib/prava/client';
import { purchaseIntentSchema } from '@/lib/domain';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userMessage?: string; userId?: string; conversationId?: string };

    if (!body.userMessage || !body.userId) {
      return NextResponse.json({ error: 'userMessage and userId are required' }, { status: 400 });
    }

    const prava = createPravaFromEnv();
    const extracted = await extractPurchaseIntent(body.userMessage);
    const intent = purchaseIntentSchema.parse(asPurchaseIntent(extracted));

    const result = await prava.registerIntent({
      cardId: body.userId, // will be replaced with actual enrolled card ID
      merchant: intent.merchant,
      amount: intent.amount,
      currency: intent.currency,
      itemCount: 1,
      useLimit: 1,
    });

    return NextResponse.json({
      intentId: result.intentId,
      status: result.status,
      mcc: result.mcc,
      mandateId: result.mandateId,
      createdAt: result.createdAt,
    });
  } catch (error) {
    if (error instanceof PravaError) {
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
