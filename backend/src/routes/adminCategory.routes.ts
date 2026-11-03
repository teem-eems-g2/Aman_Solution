import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, AuthenticatedAdminRequest } from '../middleware/adminAuth.middleware';

const router = Router();

// Apply adminAuthMiddleware to all admin category routes
router.use(adminAuthMiddleware);

const categorySchema = z.object({
  name: z.string().min(1, { message: 'Category name is required' }).trim(),
});

// POST /api/admin/categories
router.post('/', async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const result = categorySchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues,
    });
    return;
  }

  const { name } = result.data;

  try {
    const existing = await prisma.category.findUnique({
      where: { name },
    });

    if (existing) {
      res.status(409).json({ error: 'Category with this name already exists' });
      return;
    }

    const category = await prisma.category.create({
      data: { name },
    });

    res.status(201).json(category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/categories/:id
router.put('/:id', async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = categorySchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues,
    });
    return;
  }

  const { name } = result.data;

  try {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const duplicateName = await prisma.category.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (duplicateName) {
      res.status(409).json({ error: 'Another category with this name already exists' });
      return;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name },
    });

    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/categories/:id
router.delete('/:id', async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await prisma.category.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
