import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const transactions = [
  { id: '#TX-1001', merchant: 'Dominos', status: 'Settled', receipt: 'receipt://dominos-1001' },
  { id: '#TX-1002', merchant: 'Zara', status: 'Authorized', receipt: 'receipt://zara-1002' },
  { id: '#TX-1003', merchant: 'Booking.com', status: 'Processing', receipt: 'receipt://booking-1003' },
];

export default function TransactionsPage() {
  return (
    <main className="penny-shell mx-auto min-h-screen max-w-5xl px-6 py-8 lg:px-10">
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Auditable payment activity produced from Prava-scoped credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              <div>
                <p className="font-medium text-white">{transaction.id}</p>
                <p>{transaction.merchant}</p>
              </div>
              <div className="text-right">
                <p className="text-[#f7b267]">{transaction.status}</p>
                <p>{transaction.receipt}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
