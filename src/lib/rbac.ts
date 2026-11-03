import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, UserStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
}

export type AuthResult =
  | { user: SafeUser; errorResponse: null }
  | { user: null; errorResponse: NextResponse };

/**
 * Ensures the requester has an active, authenticated session.
 * Re-verifies user status against the database.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      ),
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
    },
  });

  if (!dbUser || dbUser.status !== UserStatus.ACTIVE) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Unauthorized: User account is inactive or not found" },
        { status: 401 }
      ),
    };
  }

  return {
    user: dbUser,
    errorResponse: null,
  };
}

/**
 * Ensures the requester has an active session and has one of the allowed roles.
 * Live-queries the DB so role changes or suspensions take effect immediately.
 */
export async function requireRole(allowedRoles: Role[]): Promise<AuthResult> {
  const authResult = await requireAuth();
  if (authResult.errorResponse) {
    return authResult;
  }

  const user = authResult.user;

  if (!allowedRoles.includes(user.role)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Forbidden: Insufficient permissions for this resource" },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    errorResponse: null,
  };
}
