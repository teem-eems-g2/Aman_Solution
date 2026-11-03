import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { Role, Prisma } from "@prisma/client";

const createInventoryPartSchema = z.object({
  name: z.string().min(1, "Part name is required"),
  sku: z.string().min(1, "SKU is required").transform((s) => s.trim().toUpperCase()),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  reorderThreshold: z.number().int().min(0, "Reorder threshold cannot be negative"),
  unitCost: z.coerce.number().positive("Unit cost must be a positive number"),
});

export async function GET(req: Request) {
  const { errorResponse } = await requireRole([Role.ADMIN, Role.TECHNICIAN]);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const skip = (page - 1) * limit;
    const q = searchParams.get("q")?.trim() || "";
    const lowStockOnly = searchParams.get("lowStockOnly") === "true" || searchParams.get("lowStockOnly") === "1";

    if (lowStockOnly) {
      // Query low-stock parts using PostgreSQL raw query where quantity <= reorderThreshold (FR-46)
      const searchQuery = q ? `%${q}%` : null;

      type RawPart = {
        id: string;
        name: string;
        sku: string;
        quantity: number;
        reorderThreshold: number;
        unitCost: Prisma.Decimal;
        updatedAt: Date;
      };

      const parts = await prisma.$queryRaw<RawPart[]>`
        SELECT id, name, sku, quantity, "reorderThreshold", "unitCost", "updatedAt"
        FROM inventory_parts
        WHERE quantity <= "reorderThreshold"
        ${searchQuery ? Prisma.sql`AND (name ILIKE ${searchQuery} OR sku ILIKE ${searchQuery})` : Prisma.empty}
        ORDER BY "updatedAt" DESC
        LIMIT ${limit} OFFSET ${skip}
      `;

      const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM inventory_parts
        WHERE quantity <= "reorderThreshold"
        ${searchQuery ? Prisma.sql`AND (name ILIKE ${searchQuery} OR sku ILIKE ${searchQuery})` : Prisma.empty}
      `;

      const total = Number(countResult[0]?.count || 0);

      const partsWithStatus = parts.map((part) => ({
        ...part,
        isLowStock: true,
      }));

      return NextResponse.json({
        parts: partsWithStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    const where: Prisma.InventoryPartWhereInput = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.inventoryPart.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.inventoryPart.count({ where }),
    ]);

    const partsWithStatus = parts.map((part) => ({
      ...part,
      isLowStock: part.quantity <= part.reorderThreshold,
    }));

    return NextResponse.json({
      parts: partsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { user, errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = createInventoryPartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, sku, quantity, reorderThreshold, unitCost } = parsed.data;

    const existing = await prisma.inventoryPart.findUnique({
      where: { sku },
    });

    if (existing) {
      return NextResponse.json(
        { error: `An inventory part with SKU '${sku}' already exists` },
        { status: 409 }
      );
    }

    const unitCostDecimal = new Prisma.Decimal(unitCost.toFixed(2));

    const part = await prisma.$transaction(async (tx) => {
      const created = await tx.inventoryPart.create({
        data: {
          name,
          sku,
          quantity,
          reorderThreshold,
          unitCost: unitCostDecimal,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "INVENTORY_PART_CREATED",
          entityType: "InventoryPart",
          entityId: created.id,
          details: {
            sku,
            name,
            quantity,
            reorderThreshold,
            unitCost: unitCostDecimal.toString(),
          },
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        message: "Inventory part created successfully",
        part: {
          ...part,
          isLowStock: part.quantity <= part.reorderThreshold,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json(
      { error: "Internal server error creating inventory part" },
      { status: 500 }
    );
  }
}
