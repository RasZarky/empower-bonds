import { TransformationOptions } from 'cloudinary';

/**
 * Options for uploading files to Cloudinary.
 * Extends Cloudinary's built-in `UploadApiOptions` for more comprehensive types.
 */
export interface ExtendedUploadOptions extends TransformationOptions {
    public_id?: string;
    folder?: string;
    overwrite?: boolean;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    // transformation is already part of TransformationOptions
    tags?: string | string[]; // Example of adding more specific options
    // Add any other options you commonly use from Cloudinary's upload API
}

/**
 * Options for generating Cloudinary URLs with transformations.
 * Extends Cloudinary's built-in `TransformationOptions` for more comprehensive types.
 */
export interface ExtendedGenerateUrlOptions extends TransformationOptions {
    width?: number | string; // Cloudinary allows 'auto' or 'iw' etc.
    height?: number | string;
    crop?: string;
    gravity?: string;
    quality?: string | number;
    fetch_format?: string;
    format?: string;
    // Add any other options you commonly use from Cloudinary's URL generation
}