/* eslint-disable @typescript-eslint/no-explicit-any */
import config from '@/config';
import { ExtendedGenerateUrlOptions, ExtendedUploadOptions } from '@/types/cloudinary';
import { v2 as cloudinary, UploadApiResponse, DeleteApiResponse } from 'cloudinary';
// Configure Cloudinary once when the module is loaded
cloudinary.config({
    cloud_name: config.CLOUDINARY_NAME,
    api_key: config.CLOUDINARY_API,
    api_secret: config.CLOUDINARY_SECRET,
    secure: config.NODE_ENV === "production"
});

class CloudinaryService {
    /**
     * Converts a Buffer to a data URL string.
     * This is useful for uploading files received as a Buffer (e.g., from an API request).
     * @param buffer - The file buffer.
     * @param mimeType - The MIME type of the file (e.g., 'image/jpeg', 'video/mp4').
     * @returns Data URL string.
     * @throws {Error} If mimeType is not provided.
     */
    private static bufferToDataUrl(buffer: Buffer, mimeType: string): string {
        if (!mimeType) {
            throw new Error('MIME type is required to convert Buffer to Data URL.');
        }
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    /**
     * Uploads a file to Cloudinary.
     * Supports various file inputs: local file path, remote URL, or a Node.js Buffer.
     *
     * @param file - The file data. Can be a file path (string), a remote URL (string), or a Buffer.
     * @param options - Optional upload settings (e.g., folder, public_id, transformations).
     * @param mimeType - Required when `file` is a Buffer (e.g., 'image/png').
     * @returns A Promise that resolves with the Cloudinary upload result or rejects with an error.
     */
    static async upload(
        file: string | Buffer,
        options: ExtendedUploadOptions = {},
        mimeType?: string // Only required for Buffer uploads
    ): Promise<UploadApiResponse> {
        try {
            let uploadSource: string;

            if (Buffer.isBuffer(file)) {
                uploadSource = CloudinaryService.bufferToDataUrl(file, mimeType || 'application/octet-stream'); // Provide a default if mimeType is missing for buffer
            } else {
                uploadSource = file;
            }

            // Perform the upload. Cloudinary automatically detects resource_type from file extension or content.
            const result = await cloudinary.uploader.upload(uploadSource, options);
            return result;
        } catch (error: any) { // Use 'any' here for the caught error if its type is not consistent
            if (config.NODE_ENV !== "production")
                console.error('Cloudinary upload failed:', error.message || error);
            // Throw a custom error or re-throw the original for better error handling upstream
            throw new Error(`Failed to upload file to Cloudinary: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Generates a Cloudinary URL for an uploaded asset (image, video, etc.) with optional transformations.
     * This is useful for dynamically displaying content with desired dimensions, format, or effects.
     *
     * @param publicId - The public ID of the uploaded file on Cloudinary.
     * @param options - Transformation and URL generation options.
     * @returns The generated Cloudinary URL string.
     */
    static generateUrl(publicId: string, options: ExtendedGenerateUrlOptions = {}): string {
        // Apply sensible defaults if not explicitly provided
        const defaultUrlOptions: ExtendedGenerateUrlOptions = {
            quality: 'auto',
            fetch_format: 'auto',
            ...options
        };
        // Ensure publicId is treated correctly, especially if it includes a format (e.g., 'my_image.jpg')
        return cloudinary.url(publicId, defaultUrlOptions);
    }

    /**
     * Generates a Cloudinary URL specifically for a cropped image.
     * Simplifies common cropping operations.
     *
     * @param publicId - The public ID of the uploaded file.
     * @param width - Desired width of the cropped image.
     * @param height - Desired height of the cropped image.
     * @param options - Additional transformation options (excluding width, height, crop).
     * @returns The generated URL for the cropped image.
     */
    static generateCroppedUrl(
        publicId: string,
        width: number,
        height: number,
        options: Omit<ExtendedGenerateUrlOptions, 'width' | 'height' | 'crop' | 'gravity'> = {}
    ): string {
        return CloudinaryService.generateUrl(publicId, {
            width,
            height,
            crop: 'fill', // Default crop mode for filling dimensions
            gravity: 'auto', // Smart cropping
            ...options
        });
    }

    /**
     * Deletes a file from Cloudinary using its public ID.
     * Useful for cleanup or when an asset is no longer needed.
     *
     * @param publicId - The public ID of the file to delete.
     * @param options - Optional deletion options (e.g., invalidate, resource_type).
     * @returns A Promise that resolves with the deletion result.
     */
    static async delete(publicId: string, options?: { resource_type?: 'image' | 'video' | 'raw' | 'auto' }): Promise<DeleteApiResponse> {
        try {
            const result = await cloudinary.uploader.destroy(publicId, options);
            return result;
        } catch (error: any) {
            if (config.NODE_ENV !== "production")
                console.error(`Cloudinary deletion failed for ${publicId}:`, error.message || error);
            throw new Error(`Failed to delete file from Cloudinary: ${error.message || 'Unknown error'}`);
        }
    }
}

export default CloudinaryService;