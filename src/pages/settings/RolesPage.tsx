import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Edit, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { toast } from 'sonner';

export interface RoleDef {
  id: string;
  name: string;
  description: string;
  permissions: number;
  users: number;
  isSystem: boolean;
  color: string;
}

const initialRoles: RoleDef[] = [
  {
    id: '1',
    name: 'Administrator',
    description: 'Full unrestricted system access, role administration, and database settings',
    permissions: 28,
    users: 2,
    isSystem: true,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    id: '2',
    name: 'Sales Manager',
    description: 'Manages CRM deal stages, client accounts, sales orders, invoices, and revenue forecasts',
    permissions: 22,
    users: 4,
    isSystem: false,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    id: '3',
    name: 'Inventory Clerk',
    description: 'Controls multi-warehouse stock, barcode intake, transfers, categories, and low-stock alerts',
    permissions: 18,
    users: 6,
    isSystem: false,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    id: '4',
    name: 'Finance Officer',
    description: 'Access to payments reconciliation, invoices, expense tracking, cash flow, and tax reports',
    permissions: 16,
    users: 3,
    isSystem: false,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    id: '5',
    name: 'Staff Operations',
    description: 'Day-to-day operations: record stock movements, lookup customer items, and create draft orders',
    permissions: 12,
    users: 8,
    isSystem: false,
    color: 'text-slate-600 bg-slate-100 border-slate-200',
  },
  {
    id: '6',
    name: 'Auditor',
    description: 'Read-only access to audit logs, stock ledger movements, and financial statements',
    permissions: 6,
    users: 1,
    isSystem: false,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
];

const initialPermissionMatrix = [
  { module: 'CRM: Leads & Pipelines', create: true, read: true, update: true, delete: true },
  { module: 'CRM: Deals & Customers', create: true, read: true, update: true, delete: true },
  { module: 'Inventory: Products & Stock', create: true, read: true, update: true, delete: true },
  { module: 'Inventory: Multi-Warehouse Routing', create: true, read: true, update: true, delete: false },
  { module: 'Inventory: Transfers & Receiving', create: true, read: true, update: true, delete: false },
  { module: 'Sales: Orders & Invoicing', create: true, read: true, update: true, delete: true },
  { module: 'Sales: Payments & Returns', create: true, read: true, update: true, delete: false },
  { module: 'Procurement: Suppliers & POs', create: true, read: true, update: true, delete: false },
  { module: 'Finance: Cash Flow & P&L', create: false, read: true, update: false, delete: false },
  { module: 'AI: Assistant & Knowledge Base', create: true, read: true, update: true, delete: false },
  { module: 'Reports: Advanced Analytics & Export', create: false, read: true, update: false, delete: false },
  { module: 'Settings & User Administration', create: false, read: true, update: false, delete: false },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDef[]>(initialRoles);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newRoleDialogOpen, setNewRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDef>(initialRoles[0]);
  const [matrix, setMatrix] = useState(initialPermissionMatrix);

  // New role form state
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const handleTogglePerm = (idx: number, field: 'create' | 'read' | 'update' | 'delete') => {
    setMatrix((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: !item[field] } : item))
    );
  };

  const handleSavePermissions = () => {
    setEditDialogOpen(false);
    toast.success(`Updated permissions matrix for role "${selectedRole.name}"`);
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast.error('Please enter a valid role name');
      return;
    }

    const newRole: RoleDef = {
      id: String(Date.now()),
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || 'Custom organizational role with tailored permissions',
      permissions: 14,
      users: 0,
      isSystem: false,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    };

    setRoles([...roles, newRole]);
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRoleDialogOpen(false);
    toast.success(`Custom role "${newRole.name}" successfully created!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Roles & Granular RBAC Permissions"
        description="Configure granular access control, assign permissions across modules, and manage custom roles"
        actions={
          <Button
            onClick={() => setNewRoleDialogOpen(true)}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-purple-600/20"
          >
            <Plus className="h-4 w-4" /> Create Custom Role
          </Button>
        }
      />

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="bg-white border border-slate-200/90 hover:border-purple-300 shadow-xs hover:shadow-md transition-all rounded-[20px]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-[14px] border ${role.color}`}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900">{role.name}</h3>
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0">
                          System
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">RBAC Level {role.id}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                  onClick={() => {
                    setSelectedRole(role);
                    setEditDialogOpen(true);
                  }}
                  aria-label="Configure permissions"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </div>

              <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">{role.description}</p>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-medium">
                <div className="flex items-center gap-1.5 text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                  <Shield className="h-3.5 w-3.5" />
                  {role.permissions} active perms
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Users className="h-3.5 w-3.5" />
                  {role.users} assigned users
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Shield className="h-5 w-5 text-purple-600" />
              Granular RBAC Permissions: {selectedRole.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Check or uncheck granular CRUD capabilities for this role across enterprise modules.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-[16px] border border-slate-200 overflow-hidden mt-4">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="px-4 py-3 text-left font-bold">Module Scope</th>
                  <th className="px-3 py-3 text-center font-bold text-emerald-700">Create</th>
                  <th className="px-3 py-3 text-center font-bold text-blue-700">Read</th>
                  <th className="px-3 py-3 text-center font-bold text-amber-700">Update</th>
                  <th className="px-3 py-3 text-center font-bold text-rose-700">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrix.map((perm, idx) => (
                  <tr key={perm.module} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{perm.module}</td>
                    <td className="px-3 py-3 text-center">
                      <Checkbox
                        checked={perm.create}
                        onCheckedChange={() => handleTogglePerm(idx, 'create')}
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Checkbox
                        checked={perm.read}
                        onCheckedChange={() => handleTogglePerm(idx, 'read')}
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Checkbox
                        checked={perm.update}
                        onCheckedChange={() => handleTogglePerm(idx, 'update')}
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Checkbox
                        checked={perm.delete}
                        onCheckedChange={() => handleTogglePerm(idx, 'delete')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              Save Permissions Matrix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Custom Role Dialog */}
      <Dialog open={newRoleDialogOpen} onOpenChange={setNewRoleDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Create Custom Enterprise Role</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Define a new custom role with custom module access policies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="role-name" className="text-xs font-bold text-slate-700">Role Name *</Label>
              <Input
                id="role-name"
                placeholder="e.g. Regional Operations Lead"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-desc" className="text-xs font-bold text-slate-700">Description</Label>
              <Input
                id="role-desc"
                placeholder="Responsibilities and access scope summary..."
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setNewRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
