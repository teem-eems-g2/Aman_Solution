import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Apply authMiddleware to all cart routes
router.use(authMiddleware);

const addItemSchema = z.object({
  variantId: z.string().min(1, { message: 'Variant ID is required' }),
  quantity: z.coerce.number().int().positive({ message: 'Quantity must be at least 1' }),
});

const updateItemSchema = z.object({
  quantity: z.coerce.number().int().positive({ message: 'Quantity must be at least 1' }),
});

// Helper to get or create cart for user
async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  return cart;
}

// GET /api/cart - Return user's cart with items, variants, and product details
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const cart = await getOrCreateCart(userId);
    res.status(200).json(cart);
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cart/items - Add item to cart or increment quantity
router.post('/items', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const result = addItemSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues,
    });
    return;
  }

  const { variantId, quantity } = result.data;

  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      res.status(400).json({ error: 'Variant not found' });
      return;
    }

    const cart = await getOrCreateCart(userId);

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId,
      },
    });

    const targetQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (variant.stock < targetQuantity) {
      res.status(400).json({
        error: `Insufficient stock. Requested: ${targetQuantity}, Available: ${variant.stock}`,
      });
      return;
    }

    let cartItem;
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: targetQuantity },
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
        },
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    res.status(200).json(cartItem);
  } catch (error: any) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/cart/items/:id - Update item quantity with ownership check
router.put('/items/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = updateItemSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues,
    });
    return;
  }

  const { quantity } = result.data;

  try {
    const item = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
        variant: true,
      },
    });

    if (!item) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }

    if (item.cart.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not own this cart item' });
      return;
    }

    if (item.variant.stock < quantity) {
      res.status(400).json({
        error: `Insufficient stock. Requested: ${quantity}, Available: ${item.variant.stock}`,
      });
      return;
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(200).json(updatedItem);
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cart/items/:id - Remove item from cart with ownership check
router.delete('/items/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const item = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    });

    if (!item) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }

    if (item.cart.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not own this cart item' });
      return;
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Item removed from cart' });
  } catch (error: any) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
