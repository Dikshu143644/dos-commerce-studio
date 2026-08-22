import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';

const mockAuditLogs = [
  { id: '1', timestamp: '2024-12-18T14:32:00Z', user: 'Rajesh Kumar', action: 'created', entityType: 'product', entityId: 'SKU-1011', details: { new_values: { name: 'Thermal Sensor TS-400', sku: 'SKU-1011', price: 45.99 } } },
  { id: '2', timestamp: '2024-12-18T13:45:00Z', user: 'Priya Singh', action: 'updated', entityType: 'deal', entityId: 'DEAL-089', details: { old_values: { stage: 'proposal' }, new_values: { stage: 'negotiation' } } },
  { id: '3', timestamp: '2024-12-18T12:10:00Z', user: 'Amit Patel', action: 'created', entityType: 'purchase_order', entityId: 'PO-000089', details: { new_values: { supplier: 'MicroChip Supplies', total: 24500 } } },
  { id: '4', timestamp: '2024-12-18T11:30:00Z', user: 'Vikram Singh', action: 'updated', entityType: 'customer', entityId: 'CUST-042', details: { old_values: { credit_limit: 50000 }, new_values: { credit_limit: 75000 } } },
  { id: '5', timestamp: '2024-12-18T10:15:00Z', user: 'Anita Sharma', action: 'deleted', entityType: 'lead', entityId: 'LEAD-156', details: { old_values: { company: 'TestCo Ltd', status: 'lost' } } },
  { id: '6', timestamp: '2024-12-17T16:45:00Z', user: 'Rajesh Kumar', action: 'updated', entityType: 'user', entityId: 'USER-007', details: { old_values: { role: 'staff' }, new_values: { role: 'manager' } } },
  { id: '7', timestamp: '2024-12-17T15:20:00Z', user: 'Priya Singh', action: 'created', entityType: 'sales_order', entityId: 'SO-000142', details: { new_values: { customer: 'TechVentures Inc.', total: 12450 } } },
  { id: '8', timestamp: '2024-12-17T14:00:00Z', user: 'Amit Patel', action: 'updated', entityType: 'product', entityId: 'SKU-1005', details: { old_values: { selling_price: 72.00 }, new_values: { selling_price: 78.00 } } },
  { id: '9', timestamp: '2024-12-17T11:30:00Z', user: 'Suresh Das', action: 'created', entityType: 'stock_movement', entityId: 'MOV-2345', details: { new_values: { type: 'adjustment', quantity: -3, product: 'Steel Bearings Set' } } },
  { id: '10', timestamp: '2024-12-17T09:00:00Z', user: 'Rajesh Kumar', action: 'updated', entityType: 'settings', entityId: 'SETTINGS', details: { old_values: { email_notifications: false }, new_values: { email_notifications: true } } },
];

const actionColors: Record<string, string> = {
  created: 'bg-emerald-500/20 text-emerald-400',
  updated: 'bg-blue-500/20 text-blue-400',
  deleted: 'bg-red-500/20 text-red-400',
};

export default function AuditLogPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  const filtered = mockAuditLogs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (entityFilter !== 'all' && log.entityType !== entityFilter) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Audit Log"
        description="Track all changes and actions performed in the system"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="product">Products</SelectItem>
            <SelectItem value="customer">Customers</SelectItem>
            <SelectItem value="deal">Deals</SelectItem>
            <SelectItem value="purchase_order">Purchase Orders</SelectItem>
            <SelectItem value="sales_order">Sales Orders</SelectItem>
            <SelectItem value="user">Users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log Entries */}
      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {filtered.map((log) => (
            <div key={log.id}>
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors text-left"
              >
                <div className="flex-shrink-0">
                  {expandedId === log.id ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground w-32 flex-shrink-0">
                  {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                </span>
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    {log.user.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground flex-shrink-0">{log.user}</span>
                <Badge className={`border-0 text-[10px] ${actionColors[log.action]}`}>
                  {log.action}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {log.entityType.replace('_', ' ')}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{log.entityId}</span>
              </button>

              {expandedId === log.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-5 pb-4 pl-14"
                >
                  <div className="rounded-[12px] bg-secondary/30 p-4 space-y-2">
                    {log.details.old_values && (
                      <div>
                        <p className="text-xs font-medium text-red-400 mb-1">Previous Values:</p>
                        <pre className="text-xs text-muted-foreground bg-background/50 rounded-[8px] p-2 overflow-x-auto">
                          {JSON.stringify(log.details.old_values, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.details.new_values && (
                      <div>
                        <p className="text-xs font-medium text-emerald-400 mb-1">New Values:</p>
                        <pre className="text-xs text-muted-foreground bg-background/50 rounded-[8px] p-2 overflow-x-auto">
                          {JSON.stringify(log.details.new_values, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
