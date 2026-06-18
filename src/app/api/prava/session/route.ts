import { NextResponse } from 'next/server';
import { createPravaFromEnv } from '@/lib/prava/client';

export async function POST(request: Request) {
  const body = (await request.json()) as { userId?: string; userEmail?: string };

  if (!body.userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const prava = createPravaFromEnv();
  const session = await prava.createSession(body.userId, body.userEmail);

  return NextResponse.json(session);
}
