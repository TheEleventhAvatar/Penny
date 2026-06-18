import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const merchants = [
  { merchant: 'Dominos', sessions: 12, successRate: '98%' },
  { merchant: 'Zara', sessions: 7, successRate: '92%' },
  { merchant: 'Booking.com', sessions: 4, successRate: '86%' },
];

export default function MerchantActivityPage() {
  return (
    <main className="penny-shell mx-auto min-h-screen max-w-5xl px-6 py-8 lg:px-10">
      <Card>
        <CardHeader>
          <CardTitle>Merchant activity</CardTitle>
          <CardDescription>Monitor merchant-specific sessions, approvals, and scoped token usage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {merchants.map((merchant) => (
            <div key={merchant.merchant} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              <div>
                <p className="font-medium text-white">{merchant.merchant}</p>
                <p>{merchant.sessions} sessions</p>
              </div>
              <p className="text-[#f7b267]">{merchant.successRate}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
