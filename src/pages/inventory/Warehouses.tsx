import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Warehouse, MapPin, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';

const mockWarehouses = [
  { id: '1', name: 'Main Warehouse', code: 'WH-MUM', city: 'Mumbai', state: 'Maharashtra', capacity: 10000, used: 7500, products: 1240, manager: 'Rajesh Kumar', isActive: true },
  { id: '2', name: 'North Distribution Hub', code: 'WH-DEL', city: 'Delhi', state: 'Delhi NCR', capacity: 8000, used: 5200, products: 890, manager: 'Vikram Singh', isActive: true },
  { id: '3', name: 'South Tech Center', code: 'WH-BLR', city: 'Bangalore', state: 'Karnataka', capacity: 6000, used: 4800, products: 720, manager: 'Anita Sharma', isActive: true },
  { id: '4', name: 'East Wing Storage', code: 'WH-KOL', city: 'Kolkata', state: 'West Bengal', capacity: 5000, used: 1800, products: 345, manager: 'Suresh Das', isActive: true },
  { id: '5', name: 'West Port Facility', code: 'WH-AHM', city: 'Ahmedabad', state: 'Gujarat', capacity: 7000, used: 6300, products: 680, manager: 'Mehul Patel', isActive: true },
  { id: '6', name: 'Overflow Storage B2', code: 'WH-PUN', city: 'Pune', state: 'Maharashtra', capacity: 3000, used: 450, products: 110, manager: 'Deepak Joshi', isActive: false },
];

const warehouseSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Code is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  capacity: z.string().min(1, 'Capacity is required'),
  manager: z.string().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export default function WarehousesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm<WarehouseFormData>({ resolver: zodResolver(warehouseSchema) });

  const onSubmit = (_data: WarehouseFormData) => {
    setDialogOpen(false);
    form.reset();
  };

  const getCapacityColor = (pct: number) => {
    if (pct >= 90) return 'text-destructive';
    if (pct >= 70) return 'text-amber-400';
    return 'text-primary';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Warehouses"
        description="Manage your storage locations and capacity"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Warehouse
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {mockWarehouses.map((wh, index) => {
          const usagePercent = Math.round((wh.used / wh.capacity) * 100);
          return (
            <motion.div
              key={wh.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/10">
                        <Warehouse className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{wh.name}</h3>
                        <p className="text-xs text-muted-foreground">{wh.code}</p>
                      </div>
                    </div>
                    <Badge variant={wh.isActive ? 'default' : 'secondary'}>
                      {wh.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {wh.city}, {wh.state}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className={`font-medium ${getCapacityColor(usagePercent)}`}>
                          {usagePercent}%
                        </span>
                      </div>
                      <Progress value={usagePercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {wh.used.toLocaleString()} / {wh.capacity.toLocaleString()} units
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {wh.manager}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {wh.products} products
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Add Warehouse Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Warehouse</DialogTitle>
            <DialogDescription>Enter details for the new storage location.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="Warehouse name" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input placeholder="WH-XXX" {...form.register('code')} />
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
                <Label>Capacity (units)</Label>
                <Input type="number" placeholder="10000" {...form.register('capacity')} />
              </div>
              <div className="space-y-2">
                <Label>Manager</Label>
                <Input placeholder="Manager name" {...form.register('manager')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Create Warehouse</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
