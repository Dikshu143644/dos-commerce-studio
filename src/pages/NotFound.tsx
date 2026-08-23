import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, LayoutDashboard, Package, Users, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const suggestions = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Inventory', href: '/inventory/products', icon: Package },
  { label: 'Customers', href: '/crm/customers', icon: Users },
  { label: 'Sales', href: '/sales/orders', icon: ShoppingCart },
];

export default function NotFoundPage() {
  useDocumentTitle('Page Not Found');

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="gradient-orb absolute -top-32 -left-32 h-96 w-96" />
      <div className="gradient-orb absolute -bottom-32 -right-32 h-80 w-80 opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center"
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-gradient-to-r from-primary to-[#14b8a6] bg-clip-text text-[120px] font-bold leading-none text-transparent sm:text-[180px]"
        >
          404
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="mt-4 text-2xl font-bold text-foreground">Page Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            The page you are looking for does not exist or has been moved.
            Let us get you back to familiar territory.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-8"
        >
          <Button asChild size="lg">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </motion.div>

        {/* Navigation Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="mt-10"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
            Or try one of these
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {suggestions.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:border-primary/30"
              >
                <item.icon className="h-4 w-4 text-primary" />
                {item.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
