import { Package, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your inventory and CRM metrics" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Products"
          value="1,284"
          icon={Package}
          trend={{ value: 12.5, isPositive: true }}
          description="vs last month"
        />
        <KPICard
          label="Active Customers"
          value="847"
          icon={Users}
          trend={{ value: 8.2, isPositive: true }}
          description="vs last month"
        />
        <KPICard
          label="Pending Orders"
          value="23"
          icon={ShoppingCart}
          trend={{ value: 3.1, isPositive: false }}
          description="vs last week"
        />
        <KPICard
          label="Revenue"
          value="$48.2K"
          icon={TrendingUp}
          trend={{ value: 15.3, isPositive: true }}
          description="vs last month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed will be displayed here with real-time updates.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Low stock and reorder alerts will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
