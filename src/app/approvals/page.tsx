import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const approvals = [
  { merchant: 'Dominos', status: 'Approved', intent: 'Large Pepperoni Pizza', amount: '$18.99' },
  { merchant: 'Zara', status: 'Pending', intent: 'Red Shirt', amount: 'Rs 899' },
  { merchant: 'Booking.com', status: 'Requires passkey', intent: 'Hotel in Dubai', amount: '$142' },
];

export default function ApprovalsPage() {
  return (
    <main className="penny-shell mx-auto min-h-screen max-w-5xl px-6 py-8 lg:px-10">
      <Card>
        <CardHeader>
          <CardTitle>Approvals</CardTitle>
          <CardDescription>All purchases wait for explicit user approval and Prava authorization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {approvals.map((approval) => (
            <div key={approval.intent} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              <div>
                <p className="font-medium text-white">{approval.intent}</p>
                <p>{approval.merchant}</p>
              </div>
              <div className="text-right">
                <p className="text-[#f7b267]">{approval.status}</p>
                <p>{approval.amount}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
