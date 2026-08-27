import { ArrowRight, Contact, History, ShoppingCart, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useCommerce } from '@/contexts/CommerceContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const crmActions = [
  { label: 'Customers', description: 'Accounts and contacts', href: '/crm/customers', icon: Users },
  { label: 'Leads', description: 'Qualify new demand', href: '/crm/leads', icon: UserPlus },
  { label: 'Deals', description: 'Manage pipeline value', href: '/crm/deals', icon: Contact },
  { label: 'Activities', description: 'Track every touchpoint', href: '/crm/activities', icon: History },
];

export default function CRMWorkspace() {
  useDocumentTitle('CRM Workspace | DOS ONE');
  const { orders, activities, cartItemCount } = useCommerce();
  const orderRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="CRM Workspace" description="Connect storefront intent, customer relationships, pipeline, quotations, and follow-up in one revenue workspace." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-xs font-bold uppercase text-muted-foreground">Commerce signals</p><p className="mt-2 text-3xl font-black">{activities.length}</p><p className="mt-1 text-xs text-muted-foreground">Cart and order events</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs font-bold uppercase text-muted-foreground">Open cart units</p><p className="mt-2 text-3xl font-black">{cartItemCount}</p><p className="mt-1 text-xs text-muted-foreground">Potential buyer follow-up</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs font-bold uppercase text-muted-foreground">Web order value</p><p className="mt-2 text-3xl font-black">₹{orderRevenue.toLocaleString('en-IN')}</p><p className="mt-1 text-xs text-muted-foreground">Storefront-attributed revenue</p></CardContent></Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {crmActions.map((action) => {
          const Icon = action.icon;
          return <Link key={action.href} to={action.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple-300 hover:shadow-md"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><Icon className="h-5 w-5" /></span><p className="mt-4 font-bold text-slate-900">{action.label}</p><p className="text-xs text-slate-500">{action.description}</p><ArrowRight className="mt-4 h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-purple-600" /></Link>;
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Commerce activity feed</CardTitle><p className="mt-1 text-sm text-muted-foreground">Live customer intent shared from DOS-SHOP.</p></div><Button asChild variant="outline" size="sm"><Link to="/crm/activities">All CRM activities</Link></Button></CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center"><ShoppingCart className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold">No commerce activity yet</p><p className="text-sm text-muted-foreground">Add an item in the storefront to create the first shared signal.</p><Button asChild className="mt-4" size="sm"><Link to="/store">Open store</Link></Button></div>
          ) : (
            <div className="space-y-3">{activities.slice(0, 6).map((activity) => <div key={activity.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4"><span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600"><ShoppingCart className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{activity.title}</p><Badge variant="outline" className="bg-white text-[10px]">{activity.type}</Badge></div><p className="text-sm text-slate-600">{activity.description}</p></div><span className="whitespace-nowrap text-xs text-slate-400">{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span></div>)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
