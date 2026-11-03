import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { calculateOrderFinancials } from "@/lib/financials";
import { Role } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const { paymentId } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        repairOrder: {
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true },
            },
            device: true,
          },
        },
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Resource not found or access denied" }, { status: 404 });
    }

    // Ownership check for customers (NFR-06, UC-10)
    if (user.role === Role.CUSTOMER && payment.repairOrder.customerId !== user.id) {
      return NextResponse.json({ error: "Resource not found or access denied" }, { status: 404 });
    }

    // Technicians can only access receipts for orders assigned to them
    if (user.role === Role.TECHNICIAN && payment.repairOrder.assignedTechId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not assigned to this repair order (BR-04)" },
        { status: 403 }
      );
    }

    const orderFinancialSummary = await calculateOrderFinancials(payment.repairOrderId);

    return NextResponse.json({
      receiptNumber: payment.receiptNumber,
      businessName: "Amanuel Mobile and Computer Maintenance",
      issuedAt: payment.createdAt,
      customer: {
        id: payment.repairOrder.customer.id,
        name: payment.repairOrder.customer.name,
        email: payment.repairOrder.customer.email,
        phone: payment.repairOrder.customer.phone,
      },
      device: {
        category: payment.repairOrder.device.category,
        brand: payment.repairOrder.device.brand,
        model: payment.repairOrder.device.model,
        serialNumber: payment.repairOrder.device.serialNumber,
      },
      repairReference: payment.repairOrder.referenceNumber,
      payment: {
        id: payment.id,
        amount: payment.amount.toString(),
        method: payment.method,
        type: payment.type,
        reference: payment.reference,
        recordedBy: payment.recordedBy.name,
      },
      orderFinancialSummary: {
        approvedTotal: orderFinancialSummary.approvedTotal,
        totalPaid: orderFinancialSummary.totalPaid,
        outstandingBalance: orderFinancialSummary.outstandingBalance,
        currency: orderFinancialSummary.currency,
      },
    });
  } catch (error) {
    console.error("GET /api/payments/[paymentId]/receipt error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching receipt" },
      { status: 500 }
    );
  }
}
