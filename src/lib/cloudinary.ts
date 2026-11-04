import { v2 as cloudinary } from "cloudinary";

/**
 * Checks whether Cloudinary environment variables are configured.
 */
export const isCloudinaryConfigured = (): boolean => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
}

/**
 * Uploads an in-memory image buffer directly to the dedicated Cloudinary folder.
 * Uses `folder: "amanuel-maintenance/devices"`.
 */
export async function uploadDevicePhotoToCloudinary(
  buffer: Buffer,
  publicId?: string
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary storage provider is not configured. Missing environment variables.");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "amanuel-maintenance/devices",
        public_id: publicId,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed: empty response"));
        } else {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format,
            bytes: result.bytes,
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Deletes an image from Cloudinary (used for cleanup / rollbacks).
 */
export async function deleteDevicePhotoFromCloudinary(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured() || !publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Failed to delete Cloudinary asset:", publicId, err);
  }
}

/**
 * Returns a secure Cloudinary URL for a public_id.
 */
export function getCloudinarySecureUrl(publicId: string): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    return "";
  }

  return cloudinary.url(publicId, {
    secure: true,
    cloud_name: cloudName,
  });
}

export default cloudinary;
