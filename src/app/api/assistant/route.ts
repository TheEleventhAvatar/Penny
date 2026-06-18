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

    const session = await prava.createSession({
      userId: body.userId,
      userEmail: `${body.userId}@penny.app`,
      totalAmount: String(intent.amount),
      currency: intent.currency,
      description: `${intent.product} from ${intent.merchant} — ${intent.reason}`,
    });

    return NextResponse.json({
      sessionId: session.session_id,
      sessionToken: session.session_token,
      iframeUrl: session.iframe_url,
      orderId: session.order_id,
    });
  } catch (error) {
    if (error instanceof PravaError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.code === 'PRAVA_CONFIG_ERROR' ? 500 : 502 },
      );
    }

    const message = error instanceof Error ? error.message : 'Unexpected assistant failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}