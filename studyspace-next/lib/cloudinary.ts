/**
 * Cloudinary Configuration and Utility Functions
 * 
 * NOTE:
 * Direct unsigned uploads from the browser are intentionally disabled.
 * Use backend-issued presigned URLs instead.
 */

// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
};

/**
 * Upload a file to Cloudinary
 * @param file - The file to upload
 * @param onProgress - Optional progress callback
 * @returns Promise with the uploaded file URL
 */
export const uploadToCloudinary = async (
  _file: File,
  _onProgress?: (progress: number) => void
): Promise<string> => {
  throw new Error('Direct Cloudinary upload is disabled. Use backend-signed uploads.');
};

/**
 * Generate a Cloudinary PDF viewer URL with transformations
 * @param publicId - The Cloudinary public ID or full URL
 * @param options - Optional transformation options
 * @returns URL for viewing the PDF
 */
export const getCloudinaryPdfUrl = (
  publicId: string,
  options?: {
    format?: 'pdf' | 'jpg' | 'png';
    page?: number;
    width?: number;
    height?: number;
  }
): string => {
  // If it's already a full Cloudinary URL, extract the public ID
  let extractedPublicId = publicId;
  
  if (publicId.includes('cloudinary.com')) {
    // Extract public ID from URL like: https://res.cloudinary.com/xxx/raw/upload/v123/xxx.pdf
    const match = publicId.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (match) {
      extractedPublicId = match[1];
    }
  }

  // Build transformation URL
  const cloudName = CLOUDINARY_CONFIG.cloudName;
  const baseUrl = `https://res.cloudinary.com/${cloudName}/raw/upload`;
  
  // For PDF viewing, we can use iframe directly or convert to images
  // For now, return the direct PDF URL (browser will handle it)
  if (publicId.startsWith('http')) {
    return publicId; // Already a full URL
  }
  
  return `${baseUrl}/${extractedPublicId}`;
};

/**
 * Check if a URL is a Cloudinary URL
 */
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com');
};


