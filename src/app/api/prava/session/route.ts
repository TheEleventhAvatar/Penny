import { NextResponse } from 'next/server';
import { createPravaFromEnv } from '@/lib/prava/client';
import type { CreateSessionParams } from '@/lib/prava/client';

export async function POST(request: Request) {
  const body = (await request.json()) as CreateSessionParams;

  if (!body.userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const prava = createPravaFromEnv();
  const session = await prava.createSession(body);

  return NextResponse.json(session);
}
