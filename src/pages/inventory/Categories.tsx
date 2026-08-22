import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, FolderTree, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  isActive: boolean;
  children?: Category[];
}

const mockCategories: Category[] = [
  {
    id: '1', name: 'Electronics', slug: 'electronics', productCount: 842, isActive: true,
    children: [
      { id: '1a', name: 'Circuit Boards', slug: 'circuit-boards', productCount: 156, isActive: true },
      { id: '1b', name: 'LED Lighting', slug: 'led-lighting', productCount: 234, isActive: true },
      { id: '1c', name: 'Computer Peripherals', slug: 'peripherals', productCount: 312, isActive: true },
      { id: '1d', name: 'Cables & Connectors', slug: 'cables', productCount: 140, isActive: true },
    ],
  },
  {
    id: '2', name: 'Industrial Parts', slug: 'industrial-parts', productCount: 621, isActive: true,
    children: [
      { id: '2a', name: 'Motors & Drives', slug: 'motors', productCount: 189, isActive: true },
      { id: '2b', name: 'Bearings & Seals', slug: 'bearings', productCount: 245, isActive: true },
      { id: '2c', name: 'Hydraulics', slug: 'hydraulics', productCount: 87, isActive: true },
      { id: '2d', name: 'Pneumatics', slug: 'pneumatics', productCount: 100, isActive: false },
    ],
  },
  {
    id: '3', name: 'Raw Materials', slug: 'raw-materials', productCount: 438, isActive: true,
    children: [
      { id: '3a', name: 'Metals & Alloys', slug: 'metals', productCount: 198, isActive: true },
      { id: '3b', name: 'Polymers & Plastics', slug: 'polymers', productCount: 145, isActive: true },
      { id: '3c', name: 'Wires & Cables', slug: 'wires', productCount: 95, isActive: true },
    ],
  },
  {
    id: '4', name: 'Office Supplies', slug: 'office-supplies', productCount: 312, isActive: true,
    children: [
      { id: '4a', name: 'Furniture', slug: 'furniture', productCount: 89, isActive: true },
      { id: '4b', name: 'Stationery', slug: 'stationery', productCount: 223, isActive: true },
    ],
  },
  {
    id: '5', name: 'Packaging', slug: 'packaging', productCount: 186, isActive: true,
  },
  {
    id: '6', name: 'Safety Equipment', slug: 'safety-equipment', productCount: 94, isActive: false,
  },
];

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(mockCategories[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Categories"
        description="Organize your products into categories and subcategories"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Category Tree */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderTree className="h-4 w-4 text-primary" /> Category Tree
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {mockCategories.map((cat) => (
              <div key={cat.id}>
                <button
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors',
                    selectedCategory?.id === cat.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-secondary'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {cat.children && <ChevronRight className="h-3.5 w-3.5" />}
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{cat.productCount}</Badge>
                </button>
                {cat.children && selectedCategory?.id === cat.id && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {cat.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => setSelectedCategory(child)}
                        className={cn(
                          'w-full flex items-center justify-between rounded-[8px] px-3 py-2 text-left text-sm transition-colors',
                          selectedCategory?.id === child.id
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}
                      >
                        <span>{child.name}</span>
                        <span className="text-xs">{child.productCount}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Category Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedCategory ? selectedCategory.name : 'Select a category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCategory ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input defaultValue={selectedCategory.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input defaultValue={selectedCategory.slug} />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-[12px] bg-secondary/30 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active Status</p>
                    <p className="text-xs text-muted-foreground">Products in this category are visible in the catalog</p>
                  </div>
                  <Switch checked={selectedCategory.isActive} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[12px] bg-secondary/30 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{selectedCategory.productCount}</p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                  <div className="rounded-[12px] bg-secondary/30 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{selectedCategory.children?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Subcategories</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button>Save Changes</Button>
                  <Button variant="outline">Delete</Button>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Select a category from the tree to view details</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Create a new product category or subcategory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input placeholder="Enter category name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Parent Category (optional)</Label>
              <Input placeholder="None (top-level)" disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { setDialogOpen(false); setNewName(''); }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
