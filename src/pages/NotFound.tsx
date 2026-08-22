import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="gradient-orb absolute top-[-20%] left-[-10%] h-[500px] w-[500px]" />
      <div className="gradient-orb absolute bottom-[-15%] right-[-5%] h-[400px] w-[400px]" />

      <div className="text-center relative z-10 space-y-6">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
