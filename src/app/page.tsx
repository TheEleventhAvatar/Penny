import { ArrowRight, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    title: 'Intent-Based Payments',
    description: 'Convert a natural request into a structured purchase intent before any checkout can begin.',
    icon: Wand2,
  },
  {
    title: 'Passkey Approval',
    description: 'Every purchase is gated by explicit user approval and Prava passkey authorization.',
    icon: ShieldCheck,
  },
  {
    title: 'Merchant-Locked Tokens',
    description: 'Scoped credentials are tied to a merchant, amount, and approval window.',
    icon: Sparkles,
  },
];

const flow = [
  'Discover products',
  'Compare options',
  'Create purchase intent',
  'Request approval',
  'Authenticate via Prava',
  'Execute checkout',
  'Return confirmation',
];

export default function HomePage() {
  return (
    <main className="penny-shell mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10">
      <header className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-glow backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.32em] text-[#f7b267]">Penny</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Your AI assistant that actually completes purchases.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-300">
            Powered by Prava&apos;s agentic payment infrastructure. Penny discovers, compares, requests approval, and executes checkout only after explicit user authorization.
          </p>
        </div>

        <div className="flex gap-3">
          <Button href="/dashboard" className="min-w-40">Open dashboard</Button>
          <Button href="/replay" variant="secondary" className="min-w-40">View replay</Button>
        </div>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle>Demo scenario</CardTitle>
            <CardDescription>Buy me a red shirt under Rs 1000.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7b267]/15 text-[#f7b267]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-base font-semibold text-white">{feature.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{feature.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-[#f7b267]/20 bg-[#f7b267]/10 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#ffd08a]">Purchase flow</p>
              <ol className="mt-4 grid gap-2 text-sm text-slate-100 md:grid-cols-2">
                {flow.map((step, index) => (
                  <li key={step} className="flex items-center gap-3 rounded-xl border border-white/8 bg-slate-950/35 px-3 py-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs text-white">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prava-first architecture</CardTitle>
            <CardDescription>Intent creation, approval, and checkout all route through Prava.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="font-medium text-white">Security rules</p>
              <ul className="mt-3 space-y-2">
                <li>Never store card numbers.</li>
                <li>Never expose payment credentials.</li>
                <li>All purchases require Prava authorization.</li>
                <li>All transactions are auditable and replayable.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="font-medium text-white">Deployment</p>
              <p className="mt-2">Frontend: Vercel. Backend: Convex. Automation: Playwright. Payment orchestration: Prava.</p>
            </div>

            <Button href="/assistant" className="w-full justify-between">
              Launch Penny <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
