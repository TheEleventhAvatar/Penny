import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const events = [
  { title: 'Discovery', payload: 'Found 12 shirts under budget across 4 merchants.' },
  { title: 'Recommendation', payload: 'Ranked by price, delivery time, and merchant confidence.' },
  { title: 'Approval', payload: 'Prava passkey authorization requested and approved.' },
  { title: 'Purchase', payload: 'Scoped token issued and checkout completed via Playwright.' },
];

export default function ReplayPage() {
  return (
    <main className="penny-shell mx-auto min-h-screen max-w-5xl px-6 py-8 lg:px-10">
      <Card>
        <CardHeader>
          <CardTitle>Replay history</CardTitle>
          <CardDescription>Observability-style timeline for every purchase run.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {events.map((event) => (
            <div key={event.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="font-medium text-white">{event.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{event.payload}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
