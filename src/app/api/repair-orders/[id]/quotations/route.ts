import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/rbac";
import { verifyOrderAccess } from "@/lib/order-access";
import { Role, QuotationStatus, RepairStatus, Prisma } from "@prisma/client";

const quotationItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().positive("Unit price must be a positive number"),
});

const createQuotationSchema = z.object({
  items: z.array(quotationItemSchema).min(1, "At least one quotation item is required"),
  validUntil: z.string().datetime().refine((val) => new Date(val) > new Date(), {
    message: "validUntil must be a future datetime (FR-29)",
  }),
  currency: z.string().default("ETB"),
  isAdditionalWork: z.boolean().default(false),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;

    const order = await prisma.repairOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Resource not found or access denied" }, { status: 404 });
    }

    const access = verifyOrderAccess(order, user);
    if (!access.allowed) {
      return access.errorResponse!;
    }

    const quotations = await prisma.quotation.findMany({
      where: { repairOrderId: id },
      include: { items: true },
      orderBy: { version: "desc" },
    });

    return NextResponse.json({ quotations });
  } catch (error) {
    console.error("GET /api/repair-orders/[id]/quotations error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching quotations" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireRole([Role.TECHNICIAN, Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = createQuotationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const order = await prisma.repairOrder.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Repair order not found" }, { status: 404 });
    }

    // BR-04: Technician assignment guard
    const access = verifyOrderAccess(order, user, { requireWrite: true });
    if (!access.allowed) {
      return access.errorResponse!;
    }

    const { items, validUntil, currency, isAdditionalWork } = parsed.data;

    // Fixed-precision arithmetic using integer cents (FR-28, NFR-25)
    let totalCents = 0;
    const computedItems = items.map((item) => {
      const unitPriceCents = Math.round(Number(item.unitPrice) * 100);
      const lineTotalCents = unitPriceCents * item.quantity;
      totalCents += lineTotalCents;

      return {
        description: item.description.trim(),
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal((unitPriceCents / 100).toFixed(2)),
        lineTotal: new Prisma.Decimal((lineTotalCents / 100).toFixed(2)),
      };
    });

    const totalAmount = new Prisma.Decimal((totalCents / 100).toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Determine next version number
      const lastQuotation = await tx.quotation.findFirst({
        where: { repairOrderId: id },
        orderBy: { version: "desc" },
      });
      const nextVersion = (lastQuotation?.version || 0) + 1;

      // 2. If isAdditionalWork === false, mark previous PENDING quotations as SUPERSEDED (FR-32)
      if (!isAdditionalWork) {
        await tx.quotation.updateMany({
          where: {
            repairOrderId: id,
            status: QuotationStatus.PENDING,
          },
          data: {
            status: QuotationStatus.SUPERSEDED,
          },
        });
      }

      // 3. Create new Quotation
      const createdQuotation = await tx.quotation.create({
        data: {
          repairOrderId: id,
          version: nextVersion,
          totalAmount,
          currency: currency || "ETB",
          validUntil: new Date(validUntil),
          status: QuotationStatus.PENDING,
          isAdditionalWork,
          items: {
            create: computedItems,
          },
        },
        include: {
          items: true,
        },
      });

      // 4. Update RepairOrder.status to QUOTATION_PENDING (FR-33, BR-07)
      await tx.repairOrder.update({
        where: { id },
        data: { status: RepairStatus.QUOTATION_PENDING },
      });

      // 5. Insert RepairUpdate
      await tx.repairUpdate.create({
        data: {
          repairOrderId: id,
          actorId: user.id,
          previousStatus: order.status,
          newStatus: RepairStatus.QUOTATION_PENDING,
          notes: isAdditionalWork
            ? `Additional work quotation v${nextVersion} issued for ${totalAmount} ${currency}`
            : `Quotation v${nextVersion} issued for ${totalAmount} ${currency}`,
        },
      });

      // 6. Notify Customer (FR-54)
      await tx.notification.create({
        data: {
          recipientId: order.customerId,
          eventType: "QUOTATION_ISSUED",
          message: `Quotation v${nextVersion} for repair order ${order.referenceNumber} has been issued for ${totalAmount} ${currency}. Please review and decide before ${new Date(validUntil).toLocaleDateString()}.`,
          deliveryStatus: "DELIVERED",
        },
      });

      // 7. Record AuditLog
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: isAdditionalWork ? "ADDITIONAL_QUOTATION_CREATED" : "QUOTATION_CREATED",
          entityType: "Quotation",
          entityId: createdQuotation.id,
          details: {
            repairOrderId: id,
            version: nextVersion,
            totalAmount: totalAmount.toString(),
            currency,
            isAdditionalWork,
            itemCount: computedItems.length,
          },
        },
      });

      return createdQuotation;
    });

    return NextResponse.json(
      {
        message: `Quotation v${result.version} created successfully`,
        quotation: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/repair-orders/[id]/quotations error:", error);
    return NextResponse.json(
      { error: "Internal server error creating quotation" },
      { status: 500 }
    );
  }
}
