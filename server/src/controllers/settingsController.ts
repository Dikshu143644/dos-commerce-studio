import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Branch } from '../models/Branch.js';
import { AuditLog } from '../models/AuditLog.js';
import { Setting } from '../models/Setting.js';

// --- USERS ---
export async function getUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await User.find().populate('branch').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { role, is_active } = req.body;
    const user = await User.findByIdAndUpdate(id, { role, is_active }, { new: true });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- ROLES ---
export async function getRoles(_req: Request, res: Response): Promise<void> {
  try {
    const roles = await Role.find();
    res.json({ success: true, count: roles.length, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- BRANCHES ---
export async function getBranches(_req: Request, res: Response): Promise<void> {
  try {
    const branches = await Branch.find().populate('company');
    res.json({ success: true, count: branches.length, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createBranch(req: Request, res: Response): Promise<void> {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- AUDIT LOGS ---
export async function getAuditLogs(_req: Request, res: Response): Promise<void> {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- SETTINGS ---
export async function getSettings(_req: Request, res: Response): Promise<void> {
  try {
    const settings = await Setting.find();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}
