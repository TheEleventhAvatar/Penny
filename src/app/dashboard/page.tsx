import { Activity, ShieldCheck, History, Wallet, Sparkles, Layers3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  { label: 'Purchases', value: '18', delta: '+4 this week', icon: Wallet },
  { label: 'Approvals', value: '14', delta: '2 pending', icon: ShieldCheck },
  { label: 'Replay events', value: '386', delta: '+61 today', icon: History },
  { label: 'Agent runs', value: '92', delta: '8 active', icon: Activity },
];

const permissions = [
  ['Food Delivery', 'Auto approve below $20'],
  ['Amazon', 'Require approval every time'],
  ['Travel', 'Always require approval'],
];

const purchases = [
  ['Dominos', 'Large Pepperoni Pizza', 'Approved', '$18.99'],
  ['Zara', 'Red Shirt', 'Pending approval', 'Rs 899'],
  ['Booking.com', 'Hotel in Dubai', 'In progress', '$142'],
];

export default function DashboardPage() {
  return (
    <main className="penny-shell mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{stat.delta}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-[#f7b267]">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Purchases</CardTitle>
            <CardDescription>Track intent lifecycle from discovery to settlement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {purchases.map(([merchant, item, status, amount]) => (
              <div key={`${merchant}-${item}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{merchant}</p>
                  <p className="text-sm text-slate-300">{item}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#f7b267]">{status}</p>
                  <p className="text-sm text-slate-300">{amount}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Permissions</CardTitle>
              <CardDescription>Configure spend limits and merchant policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              {permissions.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="font-medium text-white">{label}</p>
                  <p className="mt-1">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Replay history</CardTitle>
              <CardDescription>Reasoning, approval events, screenshots, and checkout actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="font-medium text-white">PurchaseIntent #4182</p>
                <p className="mt-1">Discovery, ranking, intent generation, Prava approval, merchant checkout, receipt storage.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="font-medium text-white">PurchaseIntent #4176</p>
                <p className="mt-1">Hotel booking replay with approval chain and transaction verification.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>System map</CardTitle>
            <CardDescription>Discovery, recommendation, intent, approval, purchase, and replay are separate auditable layers.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {[
              ['Discovery', 'Find products, prices, delivery estimates, and merchant metadata.'],
              ['Approval', 'Show intent summary and trigger Prava passkey authorization.'],
              ['Purchase', 'Use merchant-locked scoped credentials to complete checkout.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7b267]/15 text-[#f7b267]">
                  <Layers3 className="h-5 w-5" />
                </div>
                <p className="font-medium text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
