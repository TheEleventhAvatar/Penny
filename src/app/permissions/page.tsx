import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const rules = [
  { merchant: 'Food Delivery', policy: 'Auto approve below $20' },
  { merchant: 'Amazon', policy: 'Require approval every time' },
  { merchant: 'Travel', policy: 'Always require approval' },
];

export default function PermissionsPage() {
  return (
    <main className="penny-shell mx-auto min-h-screen max-w-5xl px-6 py-8 lg:px-10">
      <Card>
        <CardHeader>
          <CardTitle>Agent permissions</CardTitle>
          <CardDescription>Configure spend limits, allowlists, denylists, and auto-approval thresholds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.merchant} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              <p className="font-medium text-white">{rule.merchant}</p>
              <p>{rule.policy}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
