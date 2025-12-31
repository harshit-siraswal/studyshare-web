/**
 * Cloudinary Configuration and Utility Functions
 * 
 * SETUP INSTRUCTIONS:
 * 1. Sign up at https://cloudinary.com (free tier available)
 * 2. Go to Dashboard > Settings > Upload
 * 3. Create an "Upload Preset" with:
 *    - Signing mode: "Unsigned" (for client-side uploads)
 *    - Folder: "studyspace-resources" (optional, for organization)
 *    - Resource type: "Raw" (for PDFs and documents)
 * 4. Copy your Cloud Name, API Key, and Upload Preset name
 * 5. Add them to your .env file (see .env.example)
 */

// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '',
};

// Cloudinary upload endpoint
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/raw/upload`;

/**
 * Upload a file to Cloudinary
 * @param file - The file to upload
 * @param onProgress - Optional progress callback
 * @returns Promise with the uploaded file URL
 */
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
    throw new Error('Cloudinary is not configured. Please check your environment variables.');
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('resource_type', 'raw'); // For PDFs and documents
    formData.append('folder', 'studyspace-resources'); // Optional: organize files

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        onProgress(percentComplete);
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          const secureUrl = response.secure_url || response.url;
          resolve(secureUrl);
        } catch (error) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error?.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    // Start upload
    xhr.open('POST', UPLOAD_URL);
    xhr.send(formData);
  });
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

