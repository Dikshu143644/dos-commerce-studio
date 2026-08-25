import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, Star, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { useSuppliers, useCreateSupplier } from '@/hooks/useSuppliers';

const supplierSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactPerson: z.string().min(2, 'Contact is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(8, 'Phone is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  gstNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      gstNumber: '',
      paymentTerms: 'Net 30',
    },
  });

  const { data: suppliersResponse } = useSuppliers({ pageSize: 100 });
  const createSupplier = useCreateSupplier();

  const suppliers = useMemo(() => {
    if (Array.isArray(suppliersResponse)) return suppliersResponse;
    if (Array.isArray((suppliersResponse as any)?.data)) return (suppliersResponse as any).data;
    return [];
  }, [suppliersResponse]);

  const columns = [
    {
      key: 'company_name',
      title: 'Company',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="font-bold text-slate-900">
          {(row.company_name as string) || (row.name as string) || 'Vendor'}
        </span>
      ),
    },
    {
      key: 'contact_person',
      title: 'Contact Person',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="text-slate-700">
          {(row.contact_person as string) || (row.contact_name as string) || 'Contact'}
        </span>
      ),
    },
    {
      key: 'city',
      title: 'Location',
      render: (row: Record<string, unknown>) =>
        row.city ? `${row.city}, ${row.state || 'IN'}` : 'National',
    },
    { key: 'phone', title: 'Phone' },
    { key: 'email', title: 'Email' },
    {
      key: 'rating',
      title: 'Rating',
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const rating = (row.rating as number) || 4;
        return (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                }`}
              />
            ))}
          </div>
        );
      },
    },
    {
      key: 'payment_terms',
      title: 'Payment Terms',
      render: (row: Record<string, unknown>) => (
        <span className="text-xs font-mono text-slate-600">
          {(row.payment_terms as string) || 'Net 30'}
        </span>
      ),
    },
    {
      key: 'is_active',
      title: 'Status',
      render: (row: Record<string, unknown>) => {
        const active = row.is_active !== false && row.status !== 'inactive';
        return (
          <Badge variant={active ? 'default' : 'secondary'} className={active ? 'bg-emerald-500 text-white' : ''}>
            {active ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
  ];

  const onSubmit = (data: SupplierFormData) => {
    createSupplier.mutate(
      {
        company_name: data.companyName,
        name: data.companyName,
        contact_person: data.contactPerson,
        contact_name: data.contactPerson,
        email: data.email,
        phone: data.phone,
        city: data.city,
        state: data.state,
        gst_number: data.gstNumber || null,
        payment_terms: data.paymentTerms || 'Net 30',
        rating: 4,
        is_active: true,
      },
      {
        onSuccess: () => {
          toast.success('Supplier vendor added successfully!');
          setDialogOpen(false);
          form.reset();
        },
        onError: (err: any) => {
          toast.error(`Failed to add supplier: ${err.message}`);
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Suppliers Directory"
        description="Manage your verified supplier network, contact personnel, and procurement terms"
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-xs">
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={suppliers as unknown as Record<string, unknown>[]}
        selectable
        searchPlaceholder="Search suppliers by name, city, contact..."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Truck className="h-5 w-5 text-orange-500" /> Add Supplier
            </DialogTitle>
            <DialogDescription>Add a new supplier to your verified vendor directory.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Company Name *</Label>
                <Input placeholder="e.g. Apex Industrial Supplies" {...form.register('companyName')} className="rounded-xl border-slate-200" />
                {form.formState.errors.companyName && (
                  <p className="text-xs text-rose-500">{form.formState.errors.companyName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Contact Person *</Label>
                <Input placeholder="e.g. Rajesh Sharma" {...form.register('contactPerson')} className="rounded-xl border-slate-200" />
                {form.formState.errors.contactPerson && (
                  <p className="text-xs text-rose-500">{form.formState.errors.contactPerson.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Email *</Label>
                <Input type="email" placeholder="vendor@company.com" {...form.register('email')} className="rounded-xl border-slate-200" />
                {form.formState.errors.email && (
                  <p className="text-xs text-rose-500">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Phone *</Label>
                <Input placeholder="+91 98201 12345" {...form.register('phone')} className="rounded-xl border-slate-200" />
                {form.formState.errors.phone && (
                  <p className="text-xs text-rose-500">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">City *</Label>
                <Input placeholder="Mumbai" {...form.register('city')} className="rounded-xl border-slate-200" />
                {form.formState.errors.city && (
                  <p className="text-xs text-rose-500">{form.formState.errors.city.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">State *</Label>
                <Input placeholder="Maharashtra" {...form.register('state')} className="rounded-xl border-slate-200" />
                {form.formState.errors.state && (
                  <p className="text-xs text-rose-500">{form.formState.errors.state.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">GST Number</Label>
                <Input placeholder="27ABCDE1234F1Z5" {...form.register('gstNumber')} className="rounded-xl border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Payment Terms</Label>
                <Input placeholder="Net 30" {...form.register('paymentTerms')} className="rounded-xl border-slate-200" />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl border-slate-200">
                Cancel
              </Button>
              <Button type="submit" disabled={createSupplier.isPending} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl">
                {createSupplier.isPending ? 'Adding Supplier...' : 'Add Supplier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
