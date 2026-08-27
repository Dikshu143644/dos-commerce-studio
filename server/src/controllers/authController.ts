import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { env } from '../config/env.js';
import { AuthRequest } from '../middleware/auth.js';

function generateTokens(user: any) {
  const payload = { id: user._id, role: user.role, email: user.email };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, full_name, role, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, message: 'An account with this email already exists' });
      return;
    }

    const user = await User.create({
      email,
      password,
      full_name,
      role: role || 'client',
      phone,
    });

    const tokens = generateTokens(user);

    await AuditLog.create({
      user: user._id,
      user_email: user.email,
      action: 'USER_REGISTERED',
      module: 'AUTH',
      ip_address: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    user.last_login_at = new Date();
    await user.save();

    const tokens = generateTokens(user);

    await AuditLog.create({
      user: user._id,
      user_email: user.email,
      action: 'USER_LOGIN',
      module: 'AUTH',
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function staffLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, branch_code } = req.body;

    const user = await User.findOne({ email }).select('+password').populate('branch');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid staff credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid staff credentials' });
      return;
    }

    const tokens = generateTokens(user);

    res.json({
      success: true,
      message: 'Staff authentication successful',
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        branch: user.branch,
      },
      ...tokens,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user || !user.is_active) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }

    const tokens = generateTokens(user);
    res.json({ success: true, ...tokens });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Expired or invalid refresh token' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  res.json({
    success: true,
    user: req.user,
  });
}
