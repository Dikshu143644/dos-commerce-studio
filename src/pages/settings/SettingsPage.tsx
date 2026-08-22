import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Users, Shield, ScrollText } from 'lucide-react';

const settingsSections = [
  {
    title: 'User Management',
    description: 'Manage user accounts and permissions',
    href: '/settings/users',
    icon: Users,
  },
  {
    title: 'Roles & Permissions',
    description: 'Configure role-based access control',
    href: '/settings/roles',
    icon: Shield,
  },
  {
    title: 'Audit Log',
    description: 'Review system activity and changes',
    href: '/settings/audit-log',
    icon: ScrollText,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="System configuration and administration" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map((section) => (
          <Link key={section.href} to={section.href}>
            <Card className="hover:bg-secondary/30 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/10">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
