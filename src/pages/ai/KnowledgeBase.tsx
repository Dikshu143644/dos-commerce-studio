import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, BookOpen, Edit, Trash2, Upload, Tag,
  FileText, ShieldCheck, Package, BookMarked, Lightbulb, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useKnowledgeEntries,
  useCreateKnowledgeEntry,
  useUpdateKnowledgeEntry,
  useDeleteKnowledgeEntry,
} from '@/hooks/useKnowledgeBase';
import type { KnowledgeEntry } from '@/services/ai/rag/types';

type CategoryKey = KnowledgeEntry['category'] | 'all';

const categories: { key: CategoryKey; label: string; icon: typeof BookOpen; color: string }[] = [
  { key: 'all', label: 'All', icon: Layers, color: 'text-gray-400' },
  { key: 'faq', label: 'FAQ', icon: Lightbulb, color: 'text-yellow-400' },
  { key: 'sop', label: 'SOP', icon: FileText, color: 'text-blue-400' },
  { key: 'product_info', label: 'Product Info', icon: Package, color: 'text-emerald-400' },
  { key: 'policy', label: 'Policy', icon: ShieldCheck, color: 'text-red-400' },
  { key: 'guide', label: 'Guide', icon: BookMarked, color: 'text-purple-400' },
  { key: 'custom', label: 'Custom', icon: Tag, color: 'text-cyan-400' },
];

const categoryColors: Record<string, string> = {
  faq: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  sop: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  product_info: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  policy: 'bg-red-500/10 text-red-400 border-red-500/20',
  guide: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  custom: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

interface EntryFormData {
  title: string;
  content: string;
  category: KnowledgeEntry['category'];
  tags: string;
}

const defaultFormData: EntryFormData = {
  title: '',
  content: '',
  category: 'faq',
  tags: '',
};

export default function KnowledgeBasePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [formData, setFormData] = useState<EntryFormData>(defaultFormData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: entries, isLoading } = useKnowledgeEntries({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: searchQuery || undefined,
  });
  const createEntry = useCreateKnowledgeEntry();
  const updateEntry = useUpdateKnowledgeEntry();
  const deleteEntry = useDeleteKnowledgeEntry();

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      await createEntry.mutateAsync({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast.success('Knowledge entry created');
      setShowAddDialog(false);
      setFormData(defaultFormData);
    } catch {
      toast.error('Failed to create entry');
    }
  };

  const handleUpdate = async () => {
    if (!selectedEntry || !formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      await updateEntry.mutateAsync({
        id: selectedEntry.id,
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast.success('Knowledge entry updated');
      setShowEditDialog(false);
      setSelectedEntry(null);
      setFormData(defaultFormData);
    } catch {
      toast.error('Failed to update entry');
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;

    try {
      await deleteEntry.mutateAsync(selectedEntry.id);
      toast.success('Knowledge entry deleted');
      setShowDeleteDialog(false);
      setSelectedEntry(null);
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const openEditDialog = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      tags: entry.tags.join(', '),
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry);
    setShowDeleteDialog(true);
  };

  const handleImportMarkdown = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown') && !file.name.endsWith('.txt')) {
      toast.error('Please select a Markdown (.md) or text file');
      return;
    }

    try {
      const text = await file.text();
      const title = file.name.replace(/\.(md|markdown|txt)$/, '').replace(/[-_]/g, ' ');
      setFormData({
        title,
        content: text.slice(0, 10000),
        category: 'custom',
        tags: 'imported',
      });
      setShowAddDialog(true);
      toast.success('File content loaded');
    } catch {
      toast.error('Failed to read file');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage AI knowledge entries for context-aware responses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt"
            className="hidden"
            onChange={handleFileImport}
          />
          <Button
            variant="outline"
            size="sm"
            className="rounded-[16px] gap-2"
            onClick={handleImportMarkdown}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            size="sm"
            className="rounded-[16px] gap-2"
            onClick={() => {
              setFormData(defaultFormData);
              setShowAddDialog(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-[12px] px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
              selectedCategory === cat.key
                ? 'bg-primary/10 border border-primary/20 text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            <cat.icon className={cn('h-3.5 w-3.5', selectedCategory === cat.key ? cat.color : '')} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search knowledge base..."
          className="pl-9 rounded-[12px]"
        />
      </div>

      {/* Entries Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-[24px] p-5 animate-pulse">
              <div className="h-4 w-24 bg-white/5 rounded mb-3" />
              <div className="h-3 w-full bg-white/5 rounded mb-2" />
              <div className="h-3 w-3/4 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className="glass rounded-[24px] p-5 flex flex-col group"
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] px-1.5', categoryColors[entry.category])}
                  >
                    {entry.category.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditDialog(entry)}
                    >
                      <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openDeleteDialog(entry)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2">
                  {entry.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-3 flex-1 mb-3">
                  {entry.content}
                </p>

                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.slice(0, 4).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {entry.tags.length > 4 && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground">
                        +{entry.tags.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">No entries found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery
              ? 'No entries match your search. Try different keywords.'
              : 'Start building your knowledge base by adding entries.'}
          </p>
          {!searchQuery && (
            <Button
              size="sm"
              className="rounded-[16px] gap-2"
              onClick={() => {
                setFormData(defaultFormData);
                setShowAddDialog(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add First Entry
            </Button>
          )}
        </div>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg bg-background border-border">
          <DialogHeader>
            <DialogTitle>Add Knowledge Entry</DialogTitle>
          </DialogHeader>
          <EntryForm formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-[16px]">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createEntry.isPending}
              className="rounded-[16px]"
            >
              {createEntry.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg bg-background border-border">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Entry</DialogTitle>
          </DialogHeader>
          <EntryForm formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-[16px]">
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateEntry.isPending}
              className="rounded-[16px]"
            >
              {updateEntry.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm bg-background border-border">
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{selectedEntry?.title}&quot;? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-[16px]">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEntry.isPending}
              className="rounded-[16px]"
            >
              {deleteEntry.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function EntryForm({
  formData,
  setFormData,
}: {
  formData: EntryFormData;
  setFormData: React.Dispatch<React.SetStateAction<EntryFormData>>;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
          placeholder="Entry title"
          className="rounded-[12px]"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Content</Label>
          <span className="text-[10px] text-muted-foreground">
            {formData.content.length}/10000
          </span>
        </div>
        <Textarea
          value={formData.content}
          onChange={(e) => {
            if (e.target.value.length <= 10000) {
              setFormData((p) => ({ ...p, content: e.target.value }));
            }
          }}
          placeholder="Knowledge content..."
          className="min-h-[150px] rounded-[12px]"
          maxLength={10000}
        />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={formData.category}
          onValueChange={(val) => setFormData((p) => ({ ...p, category: val as KnowledgeEntry['category'] }))}
        >
          <SelectTrigger className="rounded-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="faq">FAQ</SelectItem>
            <SelectItem value="sop">SOP</SelectItem>
            <SelectItem value="product_info">Product Info</SelectItem>
            <SelectItem value="policy">Policy</SelectItem>
            <SelectItem value="guide">Guide</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Tags (comma-separated)</Label>
        <Input
          value={formData.tags}
          onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))}
          placeholder="e.g., inventory, workflow, setup"
          className="rounded-[12px]"
        />
      </div>
    </div>
  );
}
