import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import cloudinary from '../config/cloudinary';
import { adminAuthMiddleware, AuthenticatedAdminRequest } from '../middleware/adminAuth.middleware';

const router = Router();

// Apply adminAuthMiddleware to all admin product routes
router.use(adminAuthMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const createProductSchema = z.object({
  name: z.string().min(1, { message: 'Product name is required' }).trim(),
  description: z.string().min(1, { message: 'Product description is required' }).trim(),
  price: z.coerce.number().positive({ message: 'Price must be a positive number' }),
  categoryId: z.string().min(1, { message: 'Category ID is required' }),
});

const updateProductSchema = z.object({
  name: z.string().min(1).trim().optional(),
  description: z.string().min(1).trim().optional(),
  price: z.coerce.number().positive().optional(),
  categoryId: z.string().min(1).optional(),
});

const createVariantSchema = z.object({
  size: z.string().min(1, { message: 'Size is required' }).trim(),
  color: z.string().min(1, { message: 'Color is required' }).trim(),
  stock: z.coerce.number().int().min(0, { message: 'Stock must be a non-negative integer' }),
});

const createImageSchema = z.object({
  url: z.string().min(1, { message: 'Image URL is required' }).trim(),
});

// POST /api/admin/products
router.post('/', async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const result = createProductSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues,
    });
    return;
  }

  const { name, description, price, categoryId } = result.data;

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      res.status(400).json({ error: 'Category not found' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(product);
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/products/:id
router.put('/:id', async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = updateProductSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues,
    });
    return;
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (result.data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: result.data.categoryId },
      });

      if (!category) {
        res.status(400).json({ error: 'Category not found' });
        return;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: result.data,
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/:id', async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Delete related child entities first
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.favorite.deleteMany({ where: { productId: id } });

    await prisma.product.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/products/:id/variants
router.post('/:id/variants', async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = createVariantSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues,
    });
    return;
  }

  const { size, color, stock } = result.data;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const existingVariant = await prisma.productVariant.findUnique({
      where: {
        productId_size_color: {
          productId: id,
          size,
          color,
        },
      },
    });

    if (existingVariant) {
      res.status(409).json({ error: 'Variant with this size and color already exists' });
      return;
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        size,
        color,
        stock,
      },
    });

    res.status(201).json(variant);
  } catch (error: any) {
    console.error('Error creating product variant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/products/:id/images
router.post('/:id/images', async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = createImageSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues,
    });
    return;
  }

  const { url } = result.data;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const image = await prisma.productImage.create({
      data: {
        productId: id,
        url,
      },
    });

    res.status(201).json(image);
  } catch (error: any) {
    console.error('Error adding product image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/products/:id/upload-image
router.post(
  '/:id/upload-image',
  (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    upload.single('image')(req, res, (err: any) => {
      if (err) {
        res.status(400).json({ error: err.message || 'File upload error' });
        return;
      }
      next();
    });
  },
  async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!req.file) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Upload buffer to Cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'aman-fashion/products' },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error('Cloudinary upload failed'));
            } else {
              resolve(result);
            }
          }
        );
        stream.end(req.file!.buffer);
      });

      const image = await prisma.productImage.create({
        data: {
          productId: id,
          url: uploadResult.secure_url,
        },
      });

      res.status(201).json(image);
    } catch (error: any) {
      console.error('Error uploading image to Cloudinary:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);

export default router;
