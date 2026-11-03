import { prisma } from "@/lib/prisma";
import { QuotationStatus, PaymentType, Prisma, PrismaClient } from "@prisma/client";

export interface OrderFinancialSummary {
  approvedTotalCents: number;
  totalPaidCents: number;
  outstandingBalanceCents: number;
  approvedTotal: string;
  totalPaid: string;
  outstandingBalance: string;
  currency: string;
}

/**
 * Computes exact financial totals for a repair order using integer-cent precision (FR-50, NFR-25, BR-08).
 * - approvedTotal: sum of all APPROVED quotation amounts
 * - totalPaid: sum of DEPOSIT + PARTIAL + FINAL payments MINUS REVERSAL payments
 * - outstandingBalance: approvedTotal - totalPaid
 */
export async function calculateOrderFinancials(
  repairOrderId: string,
  tx?: Prisma.TransactionClient | PrismaClient
): Promise<OrderFinancialSummary> {
  const db = tx || prisma;

  const quotations = await db.quotation.findMany({
    where: {
      repairOrderId,
      status: QuotationStatus.APPROVED,
    },
    select: { totalAmount: true, currency: true },
  });

  const payments = await db.payment.findMany({
    where: { repairOrderId },
    select: { amount: true, type: true },
  });

  let approvedTotalCents = 0;
  let currency = "ETB";
  for (const q of quotations) {
    approvedTotalCents += Math.round(Number(q.totalAmount) * 100);
    if (q.currency) currency = q.currency;
  }

  let totalPaidCents = 0;
  for (const p of payments) {
    const amountCents = Math.round(Number(p.amount) * 100);
    if (p.type === PaymentType.REVERSAL) {
      totalPaidCents -= amountCents;
    } else {
      totalPaidCents += amountCents;
    }
  }

  const outstandingBalanceCents = approvedTotalCents - totalPaidCents;

  return {
    approvedTotalCents,
    totalPaidCents,
    outstandingBalanceCents,
    approvedTotal: (approvedTotalCents / 100).toFixed(2),
    totalPaid: (totalPaidCents / 100).toFixed(2),
    outstandingBalance: (outstandingBalanceCents / 100).toFixed(2),
    currency,
  };
}
