import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Apply authMiddleware to all order routes
router.use(authMiddleware);

const createOrderSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required' }).trim(),
  phone: z.string().min(1, { message: 'Phone number is required' }).trim(),
  city: z.string().min(1, { message: 'City is required' }).trim(),
  area: z.string().min(1, { message: 'Area is required' }).trim(),
  detail: z.string().min(1, { message: 'Address detail is required' }).trim(),
});

// POST /api/orders - Place an order from current cart
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const result = createOrderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues,
    });
    return;
  }

  const { fullName, phone, city, area, detail } = result.data;

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ error: 'Cannot place order: Cart is empty' });
      return;
    }

    // Re-validate stock for each cart item
    for (const item of cart.items) {
      if (item.variant.stock < item.quantity) {
        res.status(400).json({
          error: `Insufficient stock for "${item.variant.product.name}" (${item.variant.size} / ${item.variant.color}). Requested: ${item.quantity}, Available: ${item.variant.stock}`,
        });
        return;
      }
    }

    // Calculate subtotal, delivery fee, and total
    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += Number(item.variant.product.price) * item.quantity;
    }

    const deliveryFee = 100;
    const total = subtotal + deliveryFee;

    // Transaction to create order, decrement stock, and clear cart
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          fullName,
          phone,
          city,
          area,
          detail,
          deliveryFee,
          total,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.variant.product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      // Decrement stock for each variant
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Clear user's cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return createdOrder;
    });

    res.status(201).json(order);
  } catch (error: any) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders - List user's own orders (most recent first)
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id - Single order details with user ownership verification
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this order' });
      return;
    }

    res.status(200).json(order);
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
