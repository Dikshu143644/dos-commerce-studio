import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, Mail, Phone, MapPin, Building2, DollarSign, ShoppingBag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { useCustomers, useCreateCustomer } from '@/hooks/useCustomers';
import type { Customer, CustomerType } from '@/types/database';

const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required').or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  customer_type: z.enum(['regular', 'wholesale', 'retail', 'distributor'] as const),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

function CustomerDetailPanel({ customer }: { customer: Customer }) {
  return (
    <div className="space-y-6 p-6 overflow-y-auto h-full">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{customer.name}</h3>
          <Badge variant={customer.is_active ? 'default' : 'secondary'}>
            {customer.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        {customer.company && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" /> {customer.company}
          </p>
        )}
        <Badge variant="info" className="capitalize">{customer.customer_type}</Badge>
      </div>

      {/* Contact Info */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Contact Information</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          {customer.email && (
            <p className="flex items-center gap-2">
              <Mail className="h-3 w-3" /> {customer.email}
            </p>
          )}
          {customer.phone && (
            <p className="flex items-center gap-2">
              <Phone className="h-3 w-3" /> {customer.phone}
            </p>
          )}
          {(customer.address || customer.city || customer.country) && (
            <p className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              {[customer.address, customer.city, customer.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Lifetime Value */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Purchase Summary</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[12px] bg-card border border-border p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">
                  ${customer.total_spent.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">Lifetime Value</p>
              </div>
            </div>
          </div>
          <div className="rounded-[12px] bg-card border border-border p-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">{customer.total_orders}</p>
                <p className="text-[10px] text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {customer.notes && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Notes</h4>
          <p className="text-sm text-muted-foreground">{customer.notes}</p>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Created: {new Date(customer.created_at).toLocaleDateString()}</p>
        <p>Updated: {new Date(customer.updated_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const typeFilter = activeTab === 'all' ? undefined : (activeTab as CustomerType);
  const { data: customersData, isLoading } = useCustomers({ customer_type: typeFilter, pageSize: 100 });
  const createCustomer = useCreateCustomer();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', email: '', customer_type: 'regular' },
  });

  const customers = customersData?.data ?? [];

  const handleCreateCustomer = (data: CustomerFormData) => {
    createCustomer.mutate(
      {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        customer_type: data.customer_type,
        address: data.address || null,
        city: data.city || null,
        country: data.country || null,
        notes: data.notes || null,
        is_active: true,
      },
      {
        onSuccess: () => {
          toast.success('Customer created successfully');
          setDialogOpen(false);
          form.reset();
        },
        onError: (error) => toast.error(`Failed to create customer: ${error.message}`),
      }
    );
  };

  const columns = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'company', title: 'Company', sortable: true },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Phone' },
    {
      key: 'customer_type',
      title: 'Type',
      render: (row: Record<string, unknown>) => {
        const type = row.customer_type as string;
        const variant = type === 'wholesale' ? 'default' : type === 'retail' ? 'info' : 'secondary';
        return (
          <Badge variant={variant as 'default' | 'info' | 'secondary'}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'total_spent',
      title: 'Total Spent',
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const amount = row.total_spent as number;
        return <span className="text-foreground font-medium">${amount.toLocaleString()}</span>;
      },
    },
    {
      key: 'total_orders',
      title: 'Orders',
      sortable: true,
      render: (row: Record<string, unknown>) => <span>{row.total_orders as number}</span>,
    },
    {
      key: 'is_active',
      title: 'Status',
      render: (row: Record<string, unknown>) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Customers"
        description="Manage your customer directory and accounts"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({customersData?.count ?? 0})</TabsTrigger>
          <TabsTrigger value="regular">Regular</TabsTrigger>
          <TabsTrigger value="wholesale">Wholesale</TabsTrigger>
          <TabsTrigger value="retail">Retail</TabsTrigger>
          <TabsTrigger value="distributor">Distributor</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-[12px]" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description="Create your first customer or adjust your filters."
              actionLabel="Add Customer"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <DataTable
              columns={columns}
              data={customers as unknown as Record<string, unknown>[]}
              selectable
              searchPlaceholder="Search customers..."
              onRowClick={(row) => {
                const customer = customers.find((c) => c.id === (row as Record<string, unknown>).id);
                if (customer) setSelectedCustomer(customer);
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Customer Detail Sheet */}
      <Sheet open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Customer Details</SheetTitle>
            <SheetDescription>View customer information and history</SheetDescription>
          </SheetHeader>
          {selectedCustomer && <CustomerDetailPanel customer={selectedCustomer} />}
        </SheetContent>
      </Sheet>

      {/* Add Customer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Add New Customer
            </DialogTitle>
            <DialogDescription>Add a new customer to your directory.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateCustomer)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input placeholder="Customer name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input placeholder="Company name" {...form.register('company')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@company.com" {...form.register('email')} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+1 (555) 000-0000" {...form.register('phone')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Type *</Label>
                <Select
                  defaultValue="regular"
                  onValueChange={(v) => form.setValue('customer_type', v as CustomerType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="City" {...form.register('city')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="Address" {...form.register('address')} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input placeholder="Country" {...form.register('country')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Additional notes..." {...form.register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCustomer.isPending}>
                {createCustomer.isPending ? 'Creating...' : 'Add Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
