import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { Role, RepairStatus, QuotationStatus, PaymentType } from "@prisma/client";

export async function GET(req: Request) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    // 1. Group repair orders by status (FR-55)
    const statusCounts = await prisma.repairOrder.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const ordersByStatus: Record<string, number> = {};
    for (const status of Object.values(RepairStatus)) {
      ordersByStatus[status] = 0;
    }
    for (const item of statusCounts) {
      ordersByStatus[item.status] = item._count._all;
    }

    // 2. Financial Summary (FR-56, NFR-25)
    const [approvedQuotations, allPayments] = await Promise.all([
      prisma.quotation.findMany({
        where: { status: QuotationStatus.APPROVED },
        select: { totalAmount: true },
      }),
      prisma.payment.findMany({
        select: { amount: true, type: true },
      }),
    ]);

    let totalApprovedCents = 0;
    for (const q of approvedQuotations) {
      totalApprovedCents += Math.round(Number(q.totalAmount) * 100);
    }

    let totalCollectedCents = 0;
    for (const p of allPayments) {
      const cents = Math.round(Number(p.amount) * 100);
      if (p.type === PaymentType.REVERSAL) {
        totalCollectedCents -= cents;
      } else {
        totalCollectedCents += cents;
      }
    }

    const totalOutstandingCents = Math.max(0, totalApprovedCents - totalCollectedCents);

    const financialSummary = {
      totalApprovedCharges: (totalApprovedCents / 100).toFixed(2),
      totalRevenueCollected: (totalCollectedCents / 100).toFixed(2),
      totalOutstandingBalance: (totalOutstandingCents / 100).toFixed(2),
      currency: "ETB",
    };

    // 3. Inventory Summary (FR-46, FR-56)
    const parts = await prisma.inventoryPart.findMany({
      orderBy: { name: "asc" },
    });

    let totalStockUnits = 0;
    const lowStockParts: Array<{
      id: string;
      name: string;
      sku: string;
      quantity: number;
      reorderThreshold: number;
      unitCost: string;
      isLowStock: boolean;
    }> = [];

    for (const part of parts) {
      totalStockUnits += part.quantity;
      const isLowStock = part.quantity <= part.reorderThreshold;
      if (isLowStock) {
        lowStockParts.push({
          id: part.id,
          name: part.name,
          sku: part.sku,
          quantity: part.quantity,
          reorderThreshold: part.reorderThreshold,
          unitCost: part.unitCost.toString(),
          isLowStock: true,
        });
      }
    }

    const inventorySummary = {
      totalPartsCount: parts.length,
      totalStockUnits,
      lowStockPartsCount: lowStockParts.length,
      lowStockParts,
    };

    return NextResponse.json({
      ordersByStatus,
      financialSummary,
      inventorySummary,
    });
  } catch (error) {
    console.error("GET /api/admin/reports error:", error);
    return NextResponse.json(
      { error: "Internal server error generating operational reports" },
      { status: 500 }
    );
  }
}
