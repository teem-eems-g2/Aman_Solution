import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import type { SafeUser } from "@/lib/rbac";

export interface OrderAccessOptions {
  requireWrite?: boolean;
}

/**
 * Enforces role-based order access rules (BR-04, NFR-06):
 * - ADMIN: full access to all repair orders.
 * - TECHNICIAN: only orders assigned to user (order.assignedTechId === user.id). Returns 403 if unassigned.
 * - CUSTOMER: only own orders (order.customerId === user.id). Returns 404 with uniform message to avoid leakage.
 */
export function verifyOrderAccess(
  order: { customerId: string; assignedTechId?: string | null },
  user: SafeUser,
  options: OrderAccessOptions = {}
): { allowed: boolean; errorResponse: NextResponse | null } {
  if (user.role === Role.ADMIN) {
    return { allowed: true, errorResponse: null };
  }

  if (user.role === Role.TECHNICIAN) {
    if (order.assignedTechId !== user.id) {
      return {
        allowed: false,
        errorResponse: NextResponse.json(
          { error: "Forbidden: You are not assigned to this repair order (BR-04)" },
          { status: 403 }
        ),
      };
    }
    return { allowed: true, errorResponse: null };
  }

  if (user.role === Role.CUSTOMER) {
    if (order.customerId !== user.id) {
      return {
        allowed: false,
        errorResponse: NextResponse.json(
          { error: "Resource not found or access denied" },
          { status: 404 }
        ),
      };
    }
    return { allowed: true, errorResponse: null };
  }

  return {
    allowed: false,
    errorResponse: NextResponse.json(
      { error: "Forbidden: Insufficient permissions" },
      { status: 403 }
    ),
  };
}
