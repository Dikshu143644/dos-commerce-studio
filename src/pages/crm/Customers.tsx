import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';

const mockCustomers = [
  { id: '1', company_name: 'TechVentures Inc.', contact_person: 'Arun Mehta', email: 'arun@techventures.io', phone: '+91 98765 43210', type: 'wholesale', outstanding: 45200, credit_limit: 100000, status: 'active' },
  { id: '2', company_name: 'GlobalTech Solutions', contact_person: 'Sarah Chen', email: 'sarah@globaltech.com', phone: '+91 87654 32109', type: 'regular', outstanding: 12800, credit_limit: 50000, status: 'active' },
  { id: '3', company_name: 'Pinnacle Manufacturing', contact_person: 'Ravi Sharma', email: 'ravi@pinnaclemfg.in', phone: '+91 76543 21098', type: 'wholesale', outstanding: 89500, credit_limit: 200000, status: 'active' },
  { id: '4', company_name: 'QuickServe Retail', contact_person: 'Meera Nair', email: 'meera@quickserve.in', phone: '+91 65432 10987', type: 'retail', outstanding: 3200, credit_limit: 25000, status: 'active' },
  { id: '5', company_name: 'AutoParts Direct', contact_person: 'Vijay Patil', email: 'vijay@autoparts.co.in', phone: '+91 54321 09876', type: 'wholesale', outstanding: 0, credit_limit: 150000, status: 'active' },
  { id: '6', company_name: 'SmartBuild Contractors', contact_person: 'Kabir Desai', email: 'kabir@smartbuild.in', phone: '+91 43210 98765', type: 'regular', outstanding: 28400, credit_limit: 75000, status: 'active' },
  { id: '7', company_name: 'FreshStart Enterprises', contact_person: 'Nikita Roy', email: 'nikita@freshstart.co', phone: '+91 32109 87654', type: 'retail', outstanding: 1500, credit_limit: 15000, status: 'inactive' },
  { id: '8', company_name: 'MetroWorks Industrial', contact_person: 'Sunil Kapoor', email: 'sunil@metroworks.in', phone: '+91 21098 76543', type: 'wholesale', outstanding: 67800, credit_limit: 200000, status: 'active' },
];

const customerSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Phone is required'),
  customerType: z.string().min(1, 'Type required'),
  creditLimit: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  gstNumber: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedType, setSelectedType] = useState('');

  const form = useForm<CustomerFormData>({ resolver: zodResolver(customerSchema) });

  const filteredCustomers = mockCustomers.filter((c) => {
    if (activeTab === 'all') return true;
    return c.type === activeTab;
  });

  const columns = [
    { key: 'company_name', title: 'Company', sortable: true },
    { key: 'contact_person', title: 'Contact Person', sortable: true },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Phone' },
    {
      key: 'type',
      title: 'Type',
      render: (row: Record<string, unknown>) => {
        const type = row.type as string;
        const variant = type === 'wholesale' ? 'default' : type === 'retail' ? 'info' : 'secondary';
        return <Badge variant={variant}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
      },
    },
    {
      key: 'outstanding',
      title: 'Outstanding',
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const amount = row.outstanding as number;
        return (
          <span className={amount > 50000 ? 'text-destructive font-medium' : 'text-foreground'}>
            ${amount.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: 'credit_limit',
      title: 'Credit Limit',
      render: (row: Record<string, unknown>) => `$${(row.credit_limit as number).toLocaleString()}`,
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: Record<string, unknown>) => (
        <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
          {(row.status as string).charAt(0).toUpperCase() + (row.status as string).slice(1)}
        </Badge>
      ),
    },
  ];

  const onSubmit = (data: CustomerFormData) => {
    console.log('New customer:', data);
    setDialogOpen(false);
    form.reset();
  };

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
          <TabsTrigger value="all">All ({mockCustomers.length})</TabsTrigger>
          <TabsTrigger value="regular">Regular</TabsTrigger>
          <TabsTrigger value="wholesale">Wholesale</TabsTrigger>
          <TabsTrigger value="retail">Retail</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            columns={columns}
            data={filteredCustomers as unknown as Record<string, unknown>[]}
            selectable
            searchPlaceholder="Search customers..."
          />
        </TabsContent>
      </Tabs>

      {/* Add Customer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Add New Customer
            </DialogTitle>
            <DialogDescription>Add a new customer to your directory.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input placeholder="Company name" {...form.register('companyName')} />
                {form.formState.errors.companyName && <p className="text-xs text-destructive">{form.formState.errors.companyName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input placeholder="Full name" {...form.register('contactPerson')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@company.com" {...form.register('email')} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+91 XXXXX XXXXX" {...form.register('phone')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Type</Label>
                <Select onValueChange={(v) => { setSelectedType(v); form.setValue('customerType', v); }} value={selectedType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credit Limit ($)</Label>
                <Input type="number" placeholder="50000" {...form.register('creditLimit')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="City" {...form.register('city')} />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input placeholder="GSTIN" {...form.register('gstNumber')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
