import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const purchases = [
  { merchant: 'Dominos', item: 'Large Pepperoni Pizza', status: 'Settled', amount: '$18.99' },
  { merchant: 'Zara', item: 'Red Shirt', status: 'Checkout running', amount: 'Rs 899' },
  { merchant: 'Amazon', item: 'Birthday gift for mom', status: 'Waiting approval', amount: '$49' },
];

export default function PurchasesPage() {
  return (
    <main className="penny-shell mx-auto min-h-screen max-w-5xl px-6 py-8 lg:px-10">
      <Card>
        <CardHeader>
          <CardTitle>Purchases</CardTitle>
          <CardDescription>Track every purchase intent through approval and settlement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {purchases.map((purchase) => (
            <div key={purchase.item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              <div>
                <p className="font-medium text-white">{purchase.item}</p>
                <p>{purchase.merchant}</p>
              </div>
              <div className="text-right">
                <p className="text-[#f7b267]">{purchase.status}</p>
                <p>{purchase.amount}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
