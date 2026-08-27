import { ArrowRight, Boxes, FileText, PackageCheck, ShoppingCart, Truck, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { useCommerce } from '@/contexts/CommerceContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const operations = [
  { label: 'Inventory', description: 'Products, warehouses, stock and receiving', href: '/inventory/products', icon: Boxes },
  { label: 'Sales', description: 'Orders, fulfillment, invoices and payments', href: '/sales/orders', icon: ShoppingCart },
  { label: 'Procurement', description: 'Suppliers and purchase orders', href: '/procurement/orders', icon: Truck },
  { label: 'Finance', description: 'Expenses, GST, cash flow and P&L', href: '/finance/pnl', icon: Wallet },
];

export default function ERPWorkspace() {
  useDocumentTitle('ERP Workspace | DOS ONE');
  const { orders } = useCommerce();
  const pendingValue = orders.filter((order) => order.status === 'processing').reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="ERP Operations Workspace" description="Turn demand into controlled inventory, sales, procurement, fulfillment, invoicing, and finance workflows." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-xs font-bold uppercase text-muted-foreground">Incoming web orders</p><p className="mt-2 text-3xl font-black">{orders.length}</p><p className="mt-1 text-xs text-muted-foreground">From the connected storefront</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs font-bold uppercase text-muted-foreground">Pending fulfillment</p><p className="mt-2 text-3xl font-black">{orders.filter((order) => order.status === 'processing').length}</p><p className="mt-1 text-xs text-muted-foreground">Awaiting warehouse processing</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs font-bold uppercase text-muted-foreground">Order value queued</p><p className="mt-2 text-3xl font-black">₹{pendingValue.toLocaleString('en-IN')}</p><p className="mt-1 text-xs text-muted-foreground">Operational demand value</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {operations.map((operation) => {
          const Icon = operation.icon;
          return <Link key={operation.href} to={operation.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span><p className="mt-4 font-bold text-slate-900">{operation.label}</p><p className="min-h-10 text-xs text-slate-500">{operation.description}</p><ArrowRight className="mt-4 h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" /></Link>;
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Storefront fulfillment queue</CardTitle><p className="mt-1 text-sm text-muted-foreground">Orders submitted by buyers are immediately visible to operations.</p></div><Button asChild size="sm" variant="outline"><Link to="/sales/orders">Open all sales orders</Link></Button></CardHeader>
        <CardContent>
          {orders.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center"><PackageCheck className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold">No storefront orders queued</p><p className="text-sm text-muted-foreground">Complete a store checkout to populate the ERP fulfillment queue.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-muted-foreground"><th className="pb-3 font-semibold">Order</th><th className="pb-3 font-semibold">Customer</th><th className="pb-3 font-semibold">Lines</th><th className="pb-3 font-semibold">Value</th><th className="pb-3 font-semibold">Status</th></tr></thead><tbody>{orders.slice(0, 8).map((order) => <tr key={order.id} className="border-b last:border-0"><td className="py-4 font-mono font-semibold">{order.orderNumber}</td><td className="py-4">{order.customerName}</td><td className="py-4">{order.items.length}</td><td className="py-4 font-semibold">₹{order.total.toLocaleString('en-IN')}</td><td className="py-4"><Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{order.status}</Badge></td></tr>)}</tbody></table></div>}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline"><Link to="/erp/dashboard"><FileText className="mr-2 h-4 w-4" />Executive dashboard</Link></Button>
        <Button asChild variant="outline"><Link to="/inventory/receiving"><PackageCheck className="mr-2 h-4 w-4" />Receiving</Link></Button>
      </div>
    </div>
  );
}
