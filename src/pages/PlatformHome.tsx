import { ArrowRight, Building2, Contact, LayoutGrid, ShoppingCart, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCommerce } from '@/contexts/CommerceContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const workspaceCards = [
  {
    title: 'Commerce',
    eyebrow: 'Customer experience',
    description: 'Run the public DOS-SHOP storefront, buyer cart, checkout, order history, invoices, and delivery tracking.',
    href: '/store',
    action: 'Open storefront',
    icon: Store,
    accent: 'from-orange-500 to-amber-400',
    links: [
      { label: 'Buyer cart', href: '/portal/cart' },
      { label: 'Client orders', href: '/portal/orders' },
    ],
  },
  {
    title: 'CRM',
    eyebrow: 'Revenue relationships',
    description: 'Turn commerce demand into customer context, activities, leads, deals, quotations, and follow-ups.',
    href: '/crm',
    action: 'Open CRM workspace',
    icon: Contact,
    accent: 'from-purple-600 to-indigo-500',
    links: [
      { label: 'Customers', href: '/crm/customers' },
      { label: 'Pipeline', href: '/crm/deals' },
    ],
  },
  {
    title: 'ERP',
    eyebrow: 'Connected operations',
    description: 'Fulfill web orders through inventory, sales, procurement, invoicing, payments, and financial control.',
    href: '/erp',
    action: 'Open ERP workspace',
    icon: Building2,
    accent: 'from-blue-600 to-cyan-500',
    links: [
      { label: 'Inventory', href: '/inventory/products' },
      { label: 'Sales orders', href: '/sales/orders' },
    ],
  },
];

export default function PlatformHome() {
  useDocumentTitle('DOS ONE | Commerce, CRM & ERP');
  const { cartItemCount, orders, activities } = useCommerce();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-6 py-10 text-white shadow-xl md:px-10 md:py-14">
        <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-purple-600/30 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <Badge className="mb-5 border-white/15 bg-white/10 text-white hover:bg-white/10">
            <LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> One connected business platform
          </Badge>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">Commerce, CRM, and ERP—working as one.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
            Sell through DOS-SHOP, understand every customer interaction, and fulfill demand through connected operations without switching systems.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild className="bg-orange-500 text-white hover:bg-orange-600">
              <Link to="/store">Visit DOS-SHOP <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link to="/erp">Enter operations</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 bg-white"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Items in buyer carts</p><p className="mt-2 text-3xl font-black text-slate-900">{cartItemCount}</p></CardContent></Card>
        <Card className="border-slate-200 bg-white"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Storefront orders</p><p className="mt-2 text-3xl font-black text-slate-900">{orders.length}</p></CardContent></Card>
        <Card className="border-slate-200 bg-white"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cross-module events</p><p className="mt-2 text-3xl font-black text-slate-900">{activities.length}</p></CardContent></Card>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-900">Choose a workspace</h2>
          <p className="text-sm text-slate-500">Each workspace has its own focus while sharing the same commerce lifecycle.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {workspaceCards.map((workspace) => {
            const Icon = workspace.icon;
            return (
              <Card key={workspace.title} className="overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className={`h-1.5 bg-gradient-to-r ${workspace.accent}`} />
                <CardContent className="p-6">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${workspace.accent} text-white shadow-md`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{workspace.eyebrow}</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-900">{workspace.title}</h3>
                  <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{workspace.description}</p>
                  <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4 text-xs font-semibold">
                    {workspace.links.map((link) => <Link key={link.href} to={link.href} className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200">{link.label}</Link>)}
                  </div>
                  <Button asChild className="mt-5 w-full">
                    <Link to={workspace.href}>{workspace.action}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {orders[0] && (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white"><ShoppingCart className="h-5 w-5" /></span><div><p className="font-bold text-slate-900">Latest connected order: {orders[0].orderNumber}</p><p className="text-sm text-slate-600">Visible to the buyer, CRM team, and ERP sales operation.</p></div></div>
            <Button asChild variant="outline" className="border-emerald-300 bg-white"><Link to="/sales/orders">Review in ERP</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
