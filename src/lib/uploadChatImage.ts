/**
 * Upload image to Cloudinary for chat rooms
 * Optimized for images only, with compression
 */

import { CLOUDINARY_CONFIG } from './cloudinary';

export const uploadChatImage = async (
    file: File,
    onProgress?: (progress: number) => void
): Promise<string> => {
    if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
        throw new Error('Cloudinary is not configured. Please check your environment variables.');
    }

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
    }

    // Check file size (max 5MB for chat images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error('Image must be less than 5MB');
    }

    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

        const xhr = new XMLHttpRequest();
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

        xhr.open('POST', uploadUrl, true);

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const progress = Math.round((e.loaded / e.total) * 100);
                onProgress(progress);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.secure_url);
                } catch (error) {
                    reject(new Error('Failed to parse upload response'));
                }
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
        });

        xhr.send(formData);
    });
};
