import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Star, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';

const mockSuppliers = [
  { id: '1', company_name: 'MicroChip Supplies Ltd', contact_person: 'Raman Iyer', city: 'Bangalore', state: 'Karnataka', phone: '+91 80 4567 8901', rating: 5, payment_terms: 'Net 30', status: 'active' },
  { id: '2', company_name: 'TechComponents Global', contact_person: 'David Ng', city: 'Mumbai', state: 'Maharashtra', phone: '+91 22 3456 7890', rating: 4, payment_terms: 'Net 45', status: 'active' },
  { id: '3', company_name: 'Steel Masters India', contact_person: 'Suresh Agarwal', city: 'Jamshedpur', state: 'Jharkhand', phone: '+91 657 234 5678', rating: 4, payment_terms: 'Net 30', status: 'active' },
  { id: '4', company_name: 'Global Electronics Corp', contact_person: 'Chen Wei', city: 'Delhi', state: 'Delhi NCR', phone: '+91 11 2345 6789', rating: 5, payment_terms: 'Net 60', status: 'active' },
  { id: '5', company_name: 'PackRight Solutions', contact_person: 'Anand Verma', city: 'Pune', state: 'Maharashtra', phone: '+91 20 6789 0123', rating: 3, payment_terms: 'Net 15', status: 'active' },
  { id: '6', company_name: 'HydroTech Systems', contact_person: 'Kiran Bhatt', city: 'Ahmedabad', state: 'Gujarat', phone: '+91 79 8901 2345', rating: 4, payment_terms: 'Net 30', status: 'active' },
  { id: '7', company_name: 'LED World Distributors', contact_person: 'Prashant Kumar', city: 'Chennai', state: 'Tamil Nadu', phone: '+91 44 5678 9012', rating: 3, payment_terms: 'Net 30', status: 'inactive' },
  { id: '8', company_name: 'CopperLine Industries', contact_person: 'Ramesh Gupta', city: 'Kolkata', state: 'West Bengal', phone: '+91 33 4567 8901', rating: 4, payment_terms: 'Net 45', status: 'active' },
];

const supplierSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactPerson: z.string().min(2, 'Contact is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Phone is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  gstNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm<SupplierFormData>({ resolver: zodResolver(supplierSchema) });

  const columns = [
    { key: 'company_name', title: 'Company', sortable: true },
    { key: 'contact_person', title: 'Contact Person', sortable: true },
    {
      key: 'city',
      title: 'Location',
      render: (row: Record<string, unknown>) => `${row.city}, ${row.state}`,
    },
    { key: 'phone', title: 'Phone' },
    {
      key: 'rating',
      title: 'Rating',
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const rating = row.rating as number;
        return (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
            ))}
          </div>
        );
      },
    },
    { key: 'payment_terms', title: 'Payment Terms' },
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

  const onSubmit = (_data: SupplierFormData) => {
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
        title="Suppliers"
        description="Manage your supplier directory and vendor relationships"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={mockSuppliers as unknown as Record<string, unknown>[]}
        selectable
        searchPlaceholder="Search suppliers..."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> Add Supplier
            </DialogTitle>
            <DialogDescription>Add a new supplier to your vendor directory.</DialogDescription>
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
                <Input placeholder="+91 XX XXXX XXXX" {...form.register('phone')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="City" {...form.register('city')} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input placeholder="State" {...form.register('state')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input placeholder="GSTIN" {...form.register('gstNumber')} />
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input placeholder="Net 30" {...form.register('paymentTerms')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add Supplier</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
