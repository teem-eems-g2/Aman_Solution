import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import {
  isCloudinaryConfigured,
  uploadDevicePhotoToCloudinary,
  deleteDevicePhotoFromCloudinary,
} from "@/lib/cloudinary";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

function detectImageMime(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length < 12) return null;

  // JPEG magic bytes: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }

  // WEBP magic bytes: RIFF .... WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x42 &&
    buf[10] === 0x45 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export async function POST(req: Request) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing or invalid file field" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify magic bytes header
    const detectedMime = detectImageMime(buffer);
    if (!detectedMime) {
      return NextResponse.json(
        {
          error:
            "Invalid file format: Only valid JPEG, PNG, or WebP images are allowed. Magic bytes verification failed.",
        },
        { status: 400 }
      );
    }

    let extension = "jpg";
    if (detectedMime === "image/png") extension = "png";
    if (detectedMime === "image/webp") extension = "webp";

    // Generate safe UUID identifier
    const randomId = crypto.randomUUID();
    const filename = `${randomId}.${extension}`;
    const fileUrl = `/api/uploads/device-photo/${filename}`;

    let cloudinaryPublicId: string | null = null;
    let cloudinarySecureUrl: string | null = null;
    let storageProvider = "local";

    if (isCloudinaryConfigured()) {
      // Primary Production: In-memory stream upload directly to Cloudinary
      try {
        const uploadResult = await uploadDevicePhotoToCloudinary(buffer, randomId);
        cloudinaryPublicId = uploadResult.public_id;
        cloudinarySecureUrl = uploadResult.secure_url;
        storageProvider = "cloudinary";
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload image to cloud storage provider" },
          { status: 502 }
        );
      }
    } else {
      // Local development fallback only when Cloudinary credentials are not configured
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Cloud storage provider is not configured for production" },
          { status: 503 }
        );
      }

      const uploadDir = path.join(process.cwd(), "uploads", "devices");
      await fs.mkdir(uploadDir, { recursive: true });
      const targetPath = path.join(uploadDir, filename);
      await fs.writeFile(targetPath, buffer);
      storageProvider = "local";
    }

    try {
      await logAudit({
        actorId: user.id,
        action: "DEVICE_PHOTO_UPLOADED",
        entityType: "DevicePhoto",
        entityId: filename,
        details: {
          originalName: file.name,
          sizeBytes: file.size,
          mimeType: detectedMime,
          filename,
          url: fileUrl,
          storage: storageProvider,
          publicId: cloudinaryPublicId,
          secureUrl: cloudinarySecureUrl,
        },
      });
    } catch (auditError) {
      // Rollback uploaded Cloudinary asset if audit logging fails
      if (cloudinaryPublicId) {
        await deleteDevicePhotoFromCloudinary(cloudinaryPublicId);
      }
      throw auditError;
    }

    return NextResponse.json(
      {
        message: "Photo uploaded successfully",
        filename,
        url: fileUrl,
        publicId: cloudinaryPublicId,
        secureUrl: cloudinarySecureUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/uploads/device-photo error:", error);
    return NextResponse.json(
      { error: "Internal server error during photo upload" },
      { status: 500 }
    );
  }
}
