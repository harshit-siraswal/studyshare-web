/**
 * Secure chat image upload using backend-issued presigned URLs.
 * This avoids public unsigned third-party upload presets on the client.
 */

import { getResourceUploadUrl } from "./api";

const MAX_CHAT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const uploadChatImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!isImageFile(file)) {
    throw new Error("Only image files are allowed");
  }

  if (file.size > MAX_CHAT_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be less than 5MB");
  }

  const baseName = sanitizeFilename(file.name || "chat-image");
  const uploadName = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${baseName}`;
  const { uploadUrl, publicUrl } = await getResourceUploadUrl(uploadName);

  if (process.env.NODE_ENV === "production" && /^http:\/\//i.test(publicUrl)) {
    throw new Error("Insecure image URL returned from upload service");
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !onProgress) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      onProgress(progress);
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(publicUrl);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");
    xhr.setRequestHeader("Cache-Control", "max-age=31536000");
    xhr.send(file);
  });
};


