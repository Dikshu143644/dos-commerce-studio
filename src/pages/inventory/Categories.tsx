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

const mockCategories: (Category & { image?: string })[] = [
  {
    id: '1', name: 'Electronics', slug: 'electronics', productCount: 842, isActive: true, image: '/images/products/circuit-board-pro.jpg',
    children: [
      { id: '1a', name: 'Circuit Boards', slug: 'circuit-boards', productCount: 156, isActive: true },
      { id: '1b', name: 'LED Lighting', slug: 'led-lighting', productCount: 234, isActive: true },
      { id: '1c', name: 'Computer Peripherals', slug: 'peripherals', productCount: 312, isActive: true },
      { id: '1d', name: 'Cables & Connectors', slug: 'cables', productCount: 140, isActive: true },
    ],
  },
  {
    id: '2', name: 'Industrial Parts', slug: 'industrial-parts', productCount: 621, isActive: true, image: '/images/products/servo-motor.jpg',
    children: [
      { id: '2a', name: 'Motors & Drives', slug: 'motors', productCount: 189, isActive: true },
      { id: '2b', name: 'Bearings & Seals', slug: 'bearings', productCount: 245, isActive: true },
      { id: '2c', name: 'Hydraulics', slug: 'hydraulics', productCount: 87, isActive: true },
      { id: '2d', name: 'Pneumatics', slug: 'pneumatics', productCount: 100, isActive: false },
    ],
  },
  {
    id: '3', name: 'Raw Materials', slug: 'raw-materials', productCount: 438, isActive: true, image: '/images/products/copper-wire.jpg',
    children: [
      { id: '3a', name: 'Metals & Alloys', slug: 'metals', productCount: 198, isActive: true },
      { id: '3b', name: 'Polymers & Plastics', slug: 'polymers', productCount: 145, isActive: true },
      { id: '3c', name: 'Wires & Cables', slug: 'wires', productCount: 95, isActive: true },
    ],
  },
  {
    id: '4', name: 'Office Supplies', slug: 'office-supplies', productCount: 312, isActive: true, image: '/images/products/office-chair.jpg',
    children: [
      { id: '4a', name: 'Furniture', slug: 'furniture', productCount: 89, isActive: true },
      { id: '4b', name: 'Stationery', slug: 'stationery', productCount: 223, isActive: true },
    ],
  },
  {
    id: '5', name: 'Packaging', slug: 'packaging', productCount: 186, isActive: true, image: '/images/products/packaging-tape.jpg',
  },
  {
    id: '6', name: 'Safety Equipment', slug: 'safety-equipment', productCount: 94, isActive: false, image: '/images/products/safety-helmet.jpg',
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
        title="Categories & Taxonomy"
        description="Organize your product hierarchy, subcategories, and catalog inventory"
        bannerImage="/images/pages/banner-categories.jpg"
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Category Tree Navigation (4 cols) */}
        <Card className="lg:col-span-4 rounded-[24px] glass border border-border overflow-hidden h-fit">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <FolderTree className="h-4 w-4 text-emerald-400" /> Category Tree
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-1">
            {mockCategories.map((cat) => {
              const isSelected = selectedCategory?.id === cat.id;
              return (
                <div key={cat.id} className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-[14px] px-3.5 py-3 text-left text-sm transition-all group',
                      isSelected
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-sm font-semibold'
                        : 'text-foreground hover:bg-secondary/60 hover:text-white border border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "h-2 w-2 rounded-full transition-all",
                        isSelected ? "bg-emerald-400 scale-125" : "bg-muted-foreground/40 group-hover:bg-emerald-400"
                      )} />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <Badge variant="secondary" className={cn("text-xs font-mono px-2 py-0.5", isSelected && "bg-emerald-500/20 text-emerald-300")}>
                      {cat.productCount}
                    </Badge>
                  </button>

                  {cat.children && isSelected && (
                    <div className="ml-5 pl-2 border-l border-emerald-500/30 space-y-1 my-1">
                      {cat.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => setSelectedCategory(child)}
                          className={cn(
                            'w-full flex items-center justify-between rounded-[10px] px-3 py-2 text-left text-xs transition-colors',
                            selectedCategory?.id === child.id
                              ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                              : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                          )}
                        >
                          <span className="truncate">{child.name}</span>
                          <span className="font-mono text-[11px] opacity-80">{child.productCount}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Bento Grid Category Details & Subcategory Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedCategory ? (
            <>
              {/* Panoramic Bento Hero Banner */}
              <Card className="rounded-[24px] overflow-hidden glass border border-border relative group shadow-xl">
                <div className="relative h-52 w-full bg-black/60 overflow-hidden">
                  <img
                    src={(selectedCategory as Category & { image?: string }).image || '/images/products/circuit-board-pro.jpg'}
                    alt={selectedCategory.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                  
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Badge variant={selectedCategory.isActive ? 'default' : 'secondary'} className="shadow-md text-xs font-medium">
                      {selectedCategory.isActive ? 'Active in Catalog' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="absolute bottom-5 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                        {selectedCategory.name}
                      </h2>
                      <p className="text-xs font-mono text-emerald-400 font-medium mt-0.5">
                        slug: /{selectedCategory.slug}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-background/80 backdrop-blur-md px-3.5 py-1.5 rounded-[12px] border border-white/10 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Stock</p>
                        <p className="text-base font-bold text-foreground font-mono">{selectedCategory.productCount} units</p>
                      </div>
                      <div className="bg-background/80 backdrop-blur-md px-3.5 py-1.5 rounded-[12px] border border-white/10 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sub-Types</p>
                        <p className="text-base font-bold text-emerald-400 font-mono">{selectedCategory.children?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Subcategories Bento Grid */}
              {selectedCategory.children && selectedCategory.children.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                    <span>Subcategories</span>
                    <span className="text-xs font-normal text-muted-foreground">({selectedCategory.children.length} active types)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedCategory.children.map((sub, idx) => (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                      >
                        <Card className="rounded-[18px] glass border border-border hover:border-emerald-500/40 transition-all p-4 group">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-foreground text-sm group-hover:text-emerald-400 transition-colors">
                                {sub.name}
                              </h4>
                              <p className="text-xs font-mono text-muted-foreground mt-0.5">/{sub.slug}</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {sub.productCount} items
                            </span>
                          </div>

                          <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Switch checked={sub.isActive} className="scale-75 origin-left" />
                              <span className="text-[11px] text-muted-foreground">{sub.isActive ? 'Active' : 'Disabled'}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" asChild>
                              <a href={`/inventory/products?category=${sub.slug}`}>
                                View <ChevronRight className="ml-1 h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Configuration Bento Form */}
              <Card className="rounded-[20px] glass border border-border p-5 space-y-4">
                <h3 className="font-bold text-sm text-foreground">Category Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Category Display Name</Label>
                    <Input defaultValue={selectedCategory.name} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">URL Slug</Label>
                    <Input defaultValue={selectedCategory.slug} className="h-9 font-mono text-xs" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm">Reset</Button>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">Save Changes</Button>
                </div>
              </Card>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-16 glass rounded-[24px] border border-border">
              <FolderTree className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm">Select a category from the tree on the left</p>
            </div>
          )}
        </div>
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
