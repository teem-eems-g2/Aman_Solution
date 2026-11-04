import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { Role } from "@prisma/client";
import path from "path";
import fs from "fs/promises";
import { isCloudinaryConfigured, getCloudinarySecureUrl } from "@/lib/cloudinary";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const { filename } = await params;

    // Strict sanitization: reject path traversal attempts
    if (
      !filename ||
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\") ||
      !/^[a-zA-Z0-9_\-\.]+$/.test(filename)
    ) {
      return NextResponse.json({ error: "Invalid filename parameter" }, { status: 400 });
    }

    // Cross-customer privacy check (NFR-06)
    if (user.role === Role.CUSTOMER) {
      const isUploader = await prisma.auditLog.findFirst({
        where: {
          action: "DEVICE_PHOTO_UPLOADED",
          entityId: filename,
          actorId: user.id,
        },
      });

      const isOwnerOfDevice = await prisma.device.findFirst({
        where: {
          customerId: user.id,
          photos: {
            hasSome: [filename, `/api/uploads/device-photo/${filename}`],
          },
        },
      });

      if (!isUploader && !isOwnerOfDevice) {
        return NextResponse.json(
          { error: "Resource not found or access denied" },
          { status: 404 }
        );
      }
    }

    // 1. Check local disk storage first (supports legacy local test photos in dev)
    const filePath = path.join(process.cwd(), "uploads", "devices", filename);
    let localExists = false;
    try {
      await fs.access(filePath);
      localExists = true;
    } catch {
      localExists = false;
    }

    if (localExists) {
      const fileBuffer = await fs.readFile(filePath);

      let contentType = "application/octet-stream";
      if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
        contentType = "image/jpeg";
      } else if (filename.endsWith(".png")) {
        contentType = "image/png";
      } else if (filename.endsWith(".webp")) {
        contentType = "image/webp";
      }

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // 2. If not on local disk, serve via Cloudinary if configured
    if (isCloudinaryConfigured()) {
      const baseId = filename.replace(/\.[^/.]+$/, "");
      const publicId = `amanuel-maintenance/devices/${baseId}`;
      const secureUrl = getCloudinarySecureUrl(publicId);

      return NextResponse.redirect(secureUrl, {
        status: 307,
        headers: {
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return NextResponse.json(
      { error: "Resource not found or access denied" },
      { status: 404 }
    );
  } catch (error) {
    console.error("GET /api/uploads/device-photo/[filename] error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching photo" },
      { status: 500 }
    );
  }
}
