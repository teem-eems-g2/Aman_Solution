import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface LogAuditParams {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Prisma.InputJsonValue;
}

export async function logAudit({
  actorId,
  action,
  entityType,
  entityId,
  details = {},
}: LogAuditParams) {
  return await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      details: details ?? {},
    },
  });
}
