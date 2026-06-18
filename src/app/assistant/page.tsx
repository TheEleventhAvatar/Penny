"use client";

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Loader2, MessageCircleMore, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
};

type AssistantResponse = {
  intent?: {
    intent_id: string;
    merchant: string;
    product: string;
    amount: number;
    currency: string;
    reason: string;
    status: string;
  };
  approval?: {
    approval_id: string;
    intent_id: string;
    approval_url: string;
    status: string;
    passkey_required: boolean;
  };
  error?: string;
};

const quickPrompts = ['Buy me a pizza', 'Buy me a red shirt under Rs 1000', 'Order a large pepperoni pizza'];

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'I can discover a product, create a Prava purchase intent, request approval, and open the approval flow. Tell me what to buy.',
  },
];

const demoUserId = 'demo-user';

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('Buy me a pizza');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<AssistantResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, lastResult]);

  async function sendRequest(prompt: string) {
    const trimmed = prompt.trim();

    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: demoUserId,
          userMessage: trimmed,
        }),
      });

      const data = (await response.json()) as AssistantResponse;

      if (!response.ok) {
        const errorMessage = data.error ?? 'Penny could not complete the request.';
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: errorMessage,
          },
        ]);
        setLastResult({ error: errorMessage });
        return;
      }

      setLastResult(data);

      const summary = data.intent
        ? `I created a Prava purchase intent for ${data.intent.product} at ${data.intent.merchant} for ${data.intent.amount} ${data.intent.currency}. Approval status: ${data.approval?.status ?? 'pending'}.`
        : 'I created your purchase flow and requested Prava approval.';

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: summary,
        },
      ]);
    } catch {
      const errorMessage = 'Network error while talking to Penny.';
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: errorMessage,
        },
      ]);
      setLastResult({ error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="penny-shell mx-auto min-h-screen max-w-7xl px-4 py-4 sm:px-6 lg:px-10 lg:py-8">
      <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden border-white/12 bg-white/[0.035]">
          <CardHeader className="border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Launch Penny</CardTitle>
                <CardDescription>Chat with an autonomous purchasing agent powered by Prava.</CardDescription>
              </div>
              <div className="rounded-full border border-[#f7b267]/20 bg-[#f7b267]/10 px-3 py-1 text-xs font-medium text-[#ffd08a]">
                Prava approval enabled
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/45 p-4 sm:p-5">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-[#f7b267] text-slate-950'
                        : message.role === 'system'
                          ? 'border border-white/10 bg-white/5 text-slate-300'
                          : 'border border-white/10 bg-slate-900/90 text-slate-100'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin text-[#f7b267]" />
                    Penny is creating the Prava purchase intent and requesting approval...
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <form
              className="rounded-3xl border border-white/10 bg-slate-950/55 p-3"
              onSubmit={(event) => {
                event.preventDefault();
                void sendRequest(input);
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={2}
                  placeholder='Try: "Buy me a pizza"'
                  className="min-h-[56px] flex-1 resize-none rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#f7b267]/40"
                />
                <Button type="submit" className="sm:min-w-36" disabled={isLoading}>
                  {isLoading ? 'Working...' : 'Send'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-white/12 bg-white/[0.04]">
            <CardHeader>
              <CardTitle>What Penny does</CardTitle>
              <CardDescription>The right side explains the current Prava-backed flow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7b267]/15 text-[#f7b267]">
                  <MessageCircleMore className="h-5 w-5" />
                </div>
                <p className="font-medium text-white">Conversational interface</p>
                <p className="mt-2">
                  Type a purchase request like “buy me a pizza” and Penny will extract the intent, create a Prava purchase intent, and request approval.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7b267]/15 text-[#f7b267]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="font-medium text-white">Prava approval</p>
                <p className="mt-2">
                  The backend calls the real Prava client. If Prava returns an approval URL, open it to continue passkey authorization.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7b267]/15 text-[#f7b267]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="font-medium text-white">Autonomous purchase flow</p>
                <p className="mt-2">
                  Discovery, comparison, intent creation, approval, and checkout are kept separate so every step stays auditable.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/12 bg-white/[0.04]">
            <CardHeader>
              <CardTitle>Latest result</CardTitle>
              <CardDescription>Shows the most recent Prava-backed response.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-300">
              {lastResult?.intent ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                  <p className="font-medium text-white">Purchase intent</p>
                  <p className="mt-2">Merchant: {lastResult.intent.merchant}</p>
                  <p>Product: {lastResult.intent.product}</p>
                  <p>Amount: {lastResult.intent.amount} {lastResult.intent.currency}</p>
                  <p>Status: {lastResult.intent.status}</p>
                </div>
              ) : null}

              {lastResult?.approval ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                  <p className="font-medium text-white">Approval</p>
                  <p className="mt-2">Status: {lastResult.approval.status}</p>
                  <p>Passkey required: {lastResult.approval.passkey_required ? 'Yes' : 'No'}</p>
                  <p>Approval ID: {lastResult.approval.approval_id}</p>
                  <a
                    href={lastResult.approval.approval_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-[#f7b267] px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-[#ffd08a]"
                  >
                    Continue Prava approval
                  </a>
                </div>
              ) : null}

              {!lastResult ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/35 p-4 text-slate-400">
                  Send a request to see the Prava intent and approval result here.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Button href="/dashboard" variant="secondary" className="w-full justify-between">
            Open dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
