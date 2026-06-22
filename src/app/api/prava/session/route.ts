import { NextRequest, NextResponse } from 'next/server';
import { createPravaFromEnv } from '@/lib/prava/client';
import type { CreateSessionParams } from '@/lib/prava/client';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreateSessionParams>;

    if (!body.userId || !body.userEmail) {
      return NextResponse.json(
        { error: { code: 'VAL_2001', message: 'userId and userEmail are required' } },
        { status: 400 },
      );
    }

    const prava = createPravaFromEnv();
    const session = await prava.createSession({
      userId: body.userId,
      userEmail: body.userEmail,
      totalAmount: body.totalAmount,
      currency: body.currency,
      description: body.description,
      callbackUrl: body.callbackUrl,
      purchaseContext: body.purchaseContext,
    });

    return NextResponse.json(session);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create session';
    const status =
      message.includes('Invalid API key') || message.includes('AUTH_1001') ? 401 :
      message.includes('Invalid request') ? 400 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}