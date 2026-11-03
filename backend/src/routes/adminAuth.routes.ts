import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, AuthenticatedAdminRequest } from '../middleware/adminAuth.middleware';

const router = Router();

const adminLoginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const result = adminLoginSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues,
    });
    return;
  }

  const { username, password } = result.data;

  try {
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin || !admin.passwordHash) {
      res.status(401).json({
        error: 'Invalid username or password',
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Invalid username or password',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ adminId: admin.id, role: 'admin' }, jwtSecret, { expiresIn: '7d' });

    res.status(200).json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

router.get('/me', adminAuthMiddleware, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.adminId;

    if (!adminId) {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    res.status(200).json({
      id: admin.id,
      username: admin.username,
    });
  } catch (error: any) {
    console.error('Admin profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
