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
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';

const mockUsers = [
  { id: '1', name: 'Rajesh Kumar', email: 'rajesh@stockflow.io', role: 'super_admin', branch: 'Mumbai HQ', status: 'active', lastActive: '2024-12-18T14:30:00Z' },
  { id: '2', name: 'Priya Singh', email: 'priya@stockflow.io', role: 'manager', branch: 'Mumbai HQ', status: 'active', lastActive: '2024-12-18T13:45:00Z' },
  { id: '3', name: 'Amit Patel', email: 'amit@stockflow.io', role: 'manager', branch: 'Delhi', status: 'active', lastActive: '2024-12-18T12:00:00Z' },
  { id: '4', name: 'Vikram Singh', email: 'vikram@stockflow.io', role: 'staff', branch: 'Delhi', status: 'active', lastActive: '2024-12-17T18:30:00Z' },
  { id: '5', name: 'Anita Sharma', email: 'anita@stockflow.io', role: 'staff', branch: 'Bangalore', status: 'active', lastActive: '2024-12-18T10:15:00Z' },
  { id: '6', name: 'Suresh Das', email: 'suresh@stockflow.io', role: 'staff', branch: 'Kolkata', status: 'active', lastActive: '2024-12-16T09:00:00Z' },
  { id: '7', name: 'Mehul Patel', email: 'mehul@stockflow.io', role: 'staff', branch: 'Ahmedabad', status: 'inactive', lastActive: '2024-12-10T14:00:00Z' },
  { id: '8', name: 'Deepak Joshi', email: 'deepak@stockflow.io', role: 'viewer', branch: 'Pune', status: 'active', lastActive: '2024-12-18T11:30:00Z' },
];

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-500/20 text-red-400',
  admin: 'bg-purple-500/20 text-purple-400',
  manager: 'bg-blue-500/20 text-blue-400',
  staff: 'bg-emerald-500/20 text-emerald-400',
  viewer: 'bg-gray-500/20 text-gray-400',
};

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns = [
    {
      key: 'name',
      title: 'User',
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {(row.name as string).split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{row.name as string}</p>
            <p className="text-xs text-muted-foreground">{row.email as string}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      render: (row: Record<string, unknown>) => {
        const role = row.role as string;
        return (
          <Badge className={`border-0 ${roleColors[role] || ''}`}>
            {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        );
      },
    },
    { key: 'branch', title: 'Branch' },
    {
      key: 'status',
      title: 'Status',
      render: (row: Record<string, unknown>) => (
        <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
          {(row.status as string).charAt(0).toUpperCase() + (row.status as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: 'lastActive',
      title: 'Last Active',
      render: (row: Record<string, unknown>) => (
        <span className="text-muted-foreground text-xs">
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
      className="space-y-6"
    >
      <PageHeader
        title="Users"
        description="Manage team members and their access levels"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Invite User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={mockUsers as unknown as Record<string, unknown>[]}
        searchPlaceholder="Search users..."
      />

      {/* Invite User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Invite User
            </DialogTitle>
            <DialogDescription>Send an invitation to a new team member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="John Smith" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="john@stockflow.io" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mumbai">Mumbai HQ</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
                    <SelectItem value="bangalore">Bangalore</SelectItem>
                    <SelectItem value="kolkata">Kolkata</SelectItem>
                    <SelectItem value="ahmedabad">Ahmedabad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
