import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (req.user.role === 'super_admin') {
      return next(); // Super admin bypasses all role constraints
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' does not have sufficient permissions to access this resource.`,
      });
      return;
    }

    next();
  };
}
