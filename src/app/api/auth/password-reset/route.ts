import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const requestResetSchema = z.object({
  action: z.literal("request"),
  email: z.string().email(),
});

const confirmResetSchema = z.object({
  action: z.literal("reset"),
  token: z.string().min(10, "Valid token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

const passwordResetSchema = z.discriminatedUnion("action", [
  requestResetSchema,
  confirmResetSchema,
]);

const SECRET = process.env.AUTH_SECRET || "amanuel-default-secret-key-32bytes";

function generateResetToken(userId: string, email: string): string {
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour validity
  const payload = `${userId}:${email}:${expiresAt}`;
  const hmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

function verifyResetToken(token: string): { valid: boolean; userId?: string; email?: string } {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [userId, email, expiresAtStr, hmac] = decoded.split(":");
    if (!userId || !email || !expiresAtStr || !hmac) {
      return { valid: false };
    }

    const payload = `${userId}:${email}:${expiresAtStr}`;
    const expectedHmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
      return { valid: false };
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    if (Date.now() > expiresAt) {
      return { valid: false };
    }

    return { valid: true, userId, email };
  } catch {
    return { valid: false };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = passwordResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.action === "request") {
      const { email } = parsed.data;
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        // Return 200 to prevent user enumeration
        return NextResponse.json({
          message: "If an account with that email exists, password reset instructions have been generated.",
        });
      }

      const resetToken = generateResetToken(user.id, user.email);

      await logAudit({
        actorId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entityType: "User",
        entityId: user.id,
        details: { email: user.email },
      });

      return NextResponse.json({
        message: "Password reset token generated successfully",
        resetToken,
      });
    }

    if (parsed.data.action === "reset") {
      const { token, newPassword } = parsed.data;
      const verification = verifyResetToken(token);

      if (!verification.valid || !verification.userId) {
        return NextResponse.json(
          { error: "Invalid or expired password reset token" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: verification.userId },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await logAudit({
        actorId: user.id,
        action: "PASSWORD_RESET_COMPLETED",
        entityType: "User",
        entityId: user.id,
        details: { email: user.email },
      });

      return NextResponse.json({
        message: "Password has been successfully reset",
      });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error during password reset" },
      { status: 500 }
    );
  }
}
