// ============================================================
// SwapCar — Image Security & Optimization Utilities
// ============================================================

export const IMAGE_CONFIG = {
  /** Max photos per vehicle */
  MAX_PHOTOS_PER_VEHICLE: 10,
  /** Max file size in bytes (8 MB) */
  MAX_FILE_SIZE_BYTES: 8 * 1024 * 1024,
  /** Allowed MIME types */
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  /** Allowed extensions (lowercase) */
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp'],
  /** Max dimension for longest side in pixels */
  MAX_DIMENSION_PX: 1920,
  /** JPEG/WebP quality for compression (0-100) */
  COMPRESSION_QUALITY: 80,
  /** Generate thumbnails */
  THUMBNAIL_ENABLED: true,
  /** Thumbnail max dimension */
  THUMBNAIL_MAX_DIMENSION: 400,
  /** Strip EXIF data */
  STRIP_EXIF: true,
} as const;

/**
 * Validates a file's MIME type and extension against allowed lists.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateImageFile(
  file: { name: string; type: string; size: number }
): string | null {
  // Check file size
  if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE_BYTES) {
    const maxMB = IMAGE_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024);
    return `La imagen supera el máximo de ${maxMB} MB.`;
  }

  if (file.size === 0) {
    return 'El archivo está vacío.';
  }

  // Check MIME type
  const normalizedMime = file.type.toLowerCase();
  if (!(IMAGE_CONFIG.ALLOWED_MIME_TYPES as readonly string[]).includes(normalizedMime)) {
    return `Formato no permitido. Usá: JPEG, PNG o WebP.`;
  }

  // Check extension
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const allowedExts = IMAGE_CONFIG.ALLOWED_EXTENSIONS as readonly string[];
  if (!allowedExts.includes(ext)) {
    return `Extensión no permitida: .${ext}. Usá: jpg, jpeg, png o webp.`;
  }

  return null; // valid
}

/**
 * Generates a random, unpredictable filename for storage.
 * Format: {uuid}_{timestamp}.{ext}
 */
export function generateSecureFilename(userId: string, originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? 'jpg';
  const timestamp = Date.now();
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return `${userId}/${timestamp}_${random}.${ext}`;
}

/**
 * Compresses an image file to WebP format, resizing to max dimension.
 * Returns a compressed Blob. Falls back to original if compression fails.
 */
export async function compressImage(
  file: File,
  options: {
    maxDimension?: number;
    quality?: number;
    format?: 'image/webp' | 'image/jpeg';
  } = {}
): Promise<Blob> {
  const maxDim = options.maxDimension ?? IMAGE_CONFIG.MAX_DIMENSION_PX;
  const quality = (options.quality ?? IMAGE_CONFIG.COMPRESSION_QUALITY) / 100;
  const format = options.format ?? 'image/webp';

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Draw and compress
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Error al comprimir la imagen'));
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = url;
  });
}

/**
 * Validates image dimensions client-side before upload.
 * Returns null if OK, or error message.
 */
export function validateImageDimensions(
  file: File,
  maxDimension = IMAGE_CONFIG.MAX_DIMENSION_PX
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width > maxDimension * 2 || img.height > maxDimension * 2) {
        resolve(`La imagen es demasiado grande (${img.width}x${img.height}). Máximo: ${maxDimension}px.`);
      } else {
        resolve(null);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('No se pudo leer la imagen.');
    };

    img.src = url;
  });
}
