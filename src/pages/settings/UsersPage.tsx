import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';

const initialUsers = [
  { id: '1', name: 'Rajesh Kumar', username: 'admin_omkar', email: 'rajesh@doscommerce.in', role: 'admin', branch: 'Mumbai HQ', assignedCategory: 'All Departments', status: 'active', lastActive: '2026-08-28T04:30:00Z' },
  { id: '2', name: 'Rahul Sharma', username: 'manager_rahul', email: 'rahul@doscommerce.in', role: 'manager', branch: 'Mumbai HQ', assignedCategory: 'All Departments', status: 'active', lastActive: '2026-08-28T03:45:00Z' },
  { id: '3', name: 'Priya Verma', username: 'staff_electronics', email: 'priya@doscommerce.in', role: 'staff', branch: 'Mumbai HQ', assignedCategory: 'Electronics', status: 'active', lastActive: '2026-08-28T02:00:00Z' },
  { id: '4', name: 'Amit Patel', username: 'staff_industrial', email: 'amit@doscommerce.in', role: 'staff', branch: 'Delhi', assignedCategory: 'Industrial Parts', status: 'active', lastActive: '2026-08-27T18:30:00Z' },
  { id: '5', name: 'Anita Sharma', username: 'staff_raw', email: 'anita@doscommerce.in', role: 'staff', branch: 'Bangalore', assignedCategory: 'Raw Materials', status: 'active', lastActive: '2026-08-27T10:15:00Z' },
  { id: '6', name: 'Rohan Mehra', username: 'customer_rohan', email: 'customer@doscommerce.in', role: 'client', branch: 'Client Portal', assignedCategory: '—', status: 'active', lastActive: '2026-08-28T01:00:00Z' },
];

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-500/20 text-red-400',
  admin: 'bg-purple-500/20 text-purple-600',
  manager: 'bg-indigo-500/20 text-indigo-600',
  staff: 'bg-orange-500/20 text-orange-600',
  client: 'bg-emerald-500/20 text-emerald-600',
  viewer: 'bg-gray-500/20 text-gray-500',
};

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [users, setUsers] = useState(initialUsers);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [assignedCategory, setAssignedCategory] = useState('Electronics');
  const [branch, setBranch] = useState('Mumbai HQ');

  const handleCreateUser = () => {
    if (!fullName || !username) {
      toast.error('Please enter Full Name and Username');
      return;
    }

    const newUser = {
      id: String(Date.now()),
      name: fullName,
      username: username.toLowerCase().trim(),
      email: email || `${username.toLowerCase().trim()}@doscommerce.in`,
      role,
      branch,
      assignedCategory: role === 'staff' ? assignedCategory : 'All Departments',
      status: 'active',
      lastActive: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);

    // Save to dynamic users for staff login recognition
    try {
      const existing = JSON.parse(localStorage.getItem('dos_dynamic_users') || '[]');
      existing.push({
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        assigned_category: newUser.assignedCategory,
      });
      localStorage.setItem('dos_dynamic_users', JSON.stringify(existing));
    } catch {
      // ignore
    }

    toast.success(`Account created: ${fullName} (${role.toUpperCase()})`, {
      description: role === 'staff' ? `Assigned to Category: ${assignedCategory}` : undefined,
    });

    setDialogOpen(false);
    setFullName('');
    setUsername('');
    setEmail('');
  };

  const columns = [
    {
      key: 'name',
      title: 'User & Username',
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs">
              {(row.name as string).split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold text-foreground">{row.name as string}</p>
            <p className="text-xs text-muted-foreground font-mono">@{row.username as string || 'user'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      render: (row: Record<string, unknown>) => {
        const r = row.role as string;
        return (
          <Badge className={`border-0 font-bold text-xs ${roleColors[r] || ''}`}>
            {r.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'assignedCategory',
      title: 'Assigned Category',
      render: (row: Record<string, unknown>) => {
        const cat = row.assignedCategory as string;
        if (cat === 'All Departments' || !cat || cat === '—') {
          return <span className="text-xs text-muted-foreground">{cat || '—'}</span>;
        }
        return (
          <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700 text-xs font-semibold">
            🔒 {cat}
          </Badge>
        );
      },
    },
    { key: 'branch', title: 'Branch Hub' },
    {
      key: 'status',
      title: 'Status',
      render: (row: Record<string, unknown>) => (
        <Badge variant={row.status === 'active' ? 'default' : 'secondary'} className="text-[11px]">
          {(row.status as string).charAt(0).toUpperCase() + (row.status as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: 'lastActive',
      title: 'Last Active',
      render: (row: Record<string, unknown>) => (
        <span className="text-muted-foreground text-xs font-mono">
          {format(new Date(row.lastActive as string), 'MMM d, HH:mm')}
        </span>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 font-sans"
    >
      <PageHeader
        title="Staff & User Management"
        description="Manager Portal: Create staff accounts, configure branch assignments, and enforce category-wise ERP access"
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
            <Plus className="mr-2 h-4 w-4" /> Create Staff / Manager
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={users as unknown as Record<string, unknown>[]}
        searchPlaceholder="Search staff by name, role, username..."
      />

      {/* Invite User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <UserPlus className="h-5 w-5 text-purple-600" /> Create New Staff Account
            </DialogTitle>
            <DialogDescription>
              Assign the user's role and designate their category scope. Staff will only be able to view and manage products in their assigned category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Verma"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. staff_electronics"
                  className="h-10 text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@doscommerce.in"
                className="h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Role Access</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff (Category Restricted)</SelectItem>
                    <SelectItem value="manager">Manager (Full CRM+ERP)</SelectItem>
                    <SelectItem value="admin">Admin (Global Master)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'staff' ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-orange-600">Assigned Category 🔒</Label>
                  <Select value={assignedCategory} onValueChange={setAssignedCategory}>
                    <SelectTrigger className="h-10 border-orange-300 bg-orange-50/50"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Industrial Parts">Industrial Parts</SelectItem>
                      <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                      <SelectItem value="Wiring">Wiring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Branch Hub</Label>
                  <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Branch" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mumbai HQ">Mumbai HQ</SelectItem>
                      <SelectItem value="Delhi Hub">Delhi Hub</SelectItem>
                      <SelectItem value="Bangalore Hub">Bangalore Hub</SelectItem>
                      <SelectItem value="Kolkata Hub">Kolkata Hub</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-[12px]">Cancel</Button>
            <Button onClick={handleCreateUser} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-[12px]">
              Create Staff Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
