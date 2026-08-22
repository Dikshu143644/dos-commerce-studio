import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';

const mockRoles = [
  { id: '1', name: 'Super Admin', description: 'Full system access with all permissions', permissions: 24, users: 1, isSystem: true, color: 'text-red-400 bg-red-500/10' },
  { id: '2', name: 'Admin', description: 'Administrative access to all modules except system settings', permissions: 20, users: 2, isSystem: true, color: 'text-purple-400 bg-purple-500/10' },
  { id: '3', name: 'Manager', description: 'Can manage inventory, CRM, procurement, and sales operations', permissions: 16, users: 3, isSystem: false, color: 'text-blue-400 bg-blue-500/10' },
  { id: '4', name: 'Staff', description: 'Day-to-day operations: create orders, manage stock, handle customers', permissions: 12, users: 5, isSystem: false, color: 'text-emerald-400 bg-emerald-500/10' },
  { id: '5', name: 'Viewer', description: 'Read-only access to view data and reports', permissions: 6, users: 2, isSystem: false, color: 'text-gray-400 bg-gray-500/10' },
  { id: '6', name: 'Auditor', description: 'Access to audit logs and financial reports', permissions: 4, users: 1, isSystem: false, color: 'text-amber-400 bg-amber-500/10' },
];

const permissionMatrix = [
  { module: 'Products', create: true, read: true, update: true, delete: true },
  { module: 'Warehouses', create: true, read: true, update: true, delete: false },
  { module: 'Stock Movements', create: true, read: true, update: false, delete: false },
  { module: 'Customers', create: true, read: true, update: true, delete: true },
  { module: 'Leads', create: true, read: true, update: true, delete: true },
  { module: 'Deals', create: true, read: true, update: true, delete: false },
  { module: 'Suppliers', create: true, read: true, update: true, delete: false },
  { module: 'Purchase Orders', create: true, read: true, update: true, delete: false },
  { module: 'Sales Orders', create: true, read: true, update: true, delete: false },
  { module: 'Reports', create: false, read: true, update: false, delete: false },
  { module: 'Users', create: false, read: true, update: false, delete: false },
  { module: 'Settings', create: false, read: true, update: false, delete: false },
];

export default function RolesPage() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(mockRoles[3]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Roles & Permissions"
        description="Define roles and configure access control for your team"
      />

      {/* Role Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockRoles.map((role) => (
          <Card key={role.id} className="hover:border-primary/20 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${role.color}`}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{role.name}</h3>
                    {role.isSystem && <Badge variant="secondary" className="text-[10px] mt-0.5">System</Badge>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => { setSelectedRole(role); setEditDialogOpen(true); }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{role.description}</p>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  {role.permissions} permissions
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {role.users} users
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Permissions: {selectedRole.name}</DialogTitle>
          </DialogHeader>
          <div className="rounded-[12px] border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Module</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Create</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Read</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Update</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Delete</th>
                </tr>
              </thead>
              <tbody>
                {permissionMatrix.map((perm) => (
                  <tr key={perm.module} className="border-t border-border">
                    <td className="px-4 py-2.5 text-foreground">{perm.module}</td>
                    <td className="px-4 py-2.5 text-center"><Checkbox defaultChecked={perm.create} /></td>
                    <td className="px-4 py-2.5 text-center"><Checkbox defaultChecked={perm.read} /></td>
                    <td className="px-4 py-2.5 text-center"><Checkbox defaultChecked={perm.update} /></td>
                    <td className="px-4 py-2.5 text-center"><Checkbox defaultChecked={perm.delete} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setEditDialogOpen(false)}>Save Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
