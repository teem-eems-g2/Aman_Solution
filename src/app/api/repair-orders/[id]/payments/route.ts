import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/rbac";
import { verifyOrderAccess } from "@/lib/order-access";
import { calculateOrderFinancials } from "@/lib/financials";
import { generateReceiptNumber } from "@/lib/reference";
import { Role, PaymentMethod, PaymentType, Prisma } from "@prisma/client";

const createPaymentSchema = z
  .object({
    amount: z.coerce.number().positive("Payment amount must be greater than 0"),
    method: z.nativeEnum(PaymentMethod, { message: "Invalid payment method" }),
    type: z.nativeEnum(PaymentType, { message: "Invalid payment type" }),
    reference: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === PaymentType.REVERSAL && (!data.reference || data.reference.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Reference / reason is required for payment reversals (NFR-26)",
      path: ["reference"],
    }
  );

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

    const [payments, summary] = await Promise.all([
      prisma.payment.findMany({
        where: { repairOrderId: id },
        include: {
          recordedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      calculateOrderFinancials(id),
    ]);

    return NextResponse.json({
      payments,
      summary: {
        approvedTotal: summary.approvedTotal,
        totalPaid: summary.totalPaid,
        outstandingBalance: summary.outstandingBalance,
        currency: summary.currency,
      },
    });
  } catch (error) {
    console.error("GET /api/repair-orders/[id]/payments error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching order payments" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = createPaymentSchema.safeParse(body);

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

    const { amount, method, type, reference } = parsed.data;
    const amountCents = Math.round(amount * 100);

    // Fixed-precision balance validation against current order financials (FR-50, NFR-25, BR-08)
    const currentFinancials = await calculateOrderFinancials(id);

    if (type === PaymentType.REVERSAL) {
      if (amountCents > currentFinancials.totalPaidCents) {
        return NextResponse.json(
          {
            error: `Reversal amount (${(amountCents / 100).toFixed(2)}) cannot exceed total paid amount (${currentFinancials.totalPaid})`,
          },
          { status: 400 }
        );
      }
    } else {
      // DEPOSIT, PARTIAL, FINAL
      if (currentFinancials.approvedTotalCents === 0) {
        return NextResponse.json(
          { error: "Cannot record payment: No approved quotation exists for this repair order" },
          { status: 400 }
        );
      }
      if (amountCents > currentFinancials.outstandingBalanceCents) {
        return NextResponse.json(
          {
            error: `Payment amount (${(amountCents / 100).toFixed(2)}) exceeds outstanding balance (${currentFinancials.outstandingBalance})`,
          },
          { status: 400 }
        );
      }
    }

    // Generate unique receipt number (FR-52)
    const receiptNumber = await generateReceiptNumber();
    const amountDecimal = new Prisma.Decimal((amountCents / 100).toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record (immutable ledger entry - NFR-26)
      const payment = await tx.payment.create({
        data: {
          repairOrderId: id,
          amount: amountDecimal,
          method,
          type,
          reference: reference?.trim() || null,
          receiptNumber,
          recordedById: user.id,
        },
        include: {
          recordedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // 2. Recalculate financials inside transaction
      const updatedFinancials = await calculateOrderFinancials(id, tx);

      // 3. Customer Notification (FR-54)
      await tx.notification.create({
        data: {
          recipientId: order.customerId,
          eventType: type === PaymentType.REVERSAL ? "PAYMENT_REVERSED" : "PAYMENT_RECEIVED",
          message:
            type === PaymentType.REVERSAL
              ? `A payment reversal of ${amountDecimal.toString()} ETB was recorded for repair order ${order.referenceNumber}. Remaining balance: ${updatedFinancials.outstandingBalance} ETB.`
              : `Payment of ${amountDecimal.toString()} ETB (${type}) received for repair order ${order.referenceNumber}. Receipt: ${receiptNumber}. Remaining balance: ${updatedFinancials.outstandingBalance} ETB.`,
          deliveryStatus: "DELIVERED",
        },
      });

      // 4. Audit Log (NFR-10, BR-13)
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: type === PaymentType.REVERSAL ? "PAYMENT_REVERSED" : "PAYMENT_RECORDED",
          entityType: "Payment",
          entityId: payment.id,
          details: {
            repairOrderId: id,
            receiptNumber,
            amount: amountDecimal.toString(),
            type,
            method,
            reference: reference?.trim() || null,
            previousOutstandingBalance: currentFinancials.outstandingBalance,
            newOutstandingBalance: updatedFinancials.outstandingBalance,
            newTotalPaid: updatedFinancials.totalPaid,
          },
        },
      });

      return { payment, summary: updatedFinancials };
    });

    return NextResponse.json(
      {
        message: "Payment recorded successfully",
        payment: result.payment,
        summary: {
          approvedTotal: result.summary.approvedTotal,
          totalPaid: result.summary.totalPaid,
          outstandingBalance: result.summary.outstandingBalance,
          currency: result.summary.currency,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/repair-orders/[id]/payments error:", error);
    return NextResponse.json(
      { error: "Internal server error recording payment" },
      { status: 500 }
    );
  }
}
