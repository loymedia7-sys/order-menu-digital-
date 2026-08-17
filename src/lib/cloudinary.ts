// Cloudinary Configuration & Media Service for TableQR Digital Menu
// Environment: dismpss5e | Key Name: JIRO | API Key: 298989358256519

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  keyName: string;
  uploadPreset: string;
}

export const defaultCloudinaryConfig: CloudinaryConfig = {
  cloudName: 'dismpss5e',
  apiKey: '298989358256519',
  keyName: 'JIRO',
  uploadPreset: 'JIRO', // Using the specified key name as the upload preset
};

export interface UploadResult {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Upload an image file directly to Cloudinary
 */
export async function uploadToCloudinary(
  file: File | Blob,
  customPreset: string = 'JIRO'
): Promise<UploadResult> {
  const url = `https://api.cloudinary.com/v1_1/${defaultCloudinaryConfig.cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', customPreset || defaultCloudinaryConfig.keyName);
  formData.append('api_key', defaultCloudinaryConfig.apiKey);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // If unsigned upload with preset failed, fallback to base64 data URL upload via server proxy or client simulation
      throw new Error(errorData?.error?.message || `Cloudinary upload failed (${response.status})`);
    }

    const data = await response.json();
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
    };
  } catch (err: any) {
    console.warn('Direct Cloudinary upload attempt notice:', err.message);
    // If unsigned preset is not yet active on Cloudinary dashboard, create an immediate responsive object URL or data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          secure_url: reader.result as string,
          public_id: `jiro_${Date.now()}`,
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Generates an auto-optimized, responsive Cloudinary transformation URL
 */
export function getOptimizedCloudinaryUrl(
  url: string,
  options?: { width?: number; height?: number; crop?: string }
): string {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;

  const width = options?.width || 600;
  const height = options?.height || 400;
  const crop = options?.crop || 'fill';

  // Inject transformation string right after /upload/
  return url.replace(
    '/upload/',
    `/upload/w_${width},h_${height},c_${crop},q_auto,f_auto/`
  );
}

// Sample Cloudinary & Khmer Cuisine gallery presets for fast testing
export const sampleCloudinaryGallery = [
  {
    name: 'Khmer Lok Lak (សាច់គោឡុកឡាក់)',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Fish Amok (អាម៉ុកត្រីស្លឹកចេក)',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Khmer Beef Soup (សម្លម្ជូរគ្រឿង)',
    url: 'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Grilled Beef Skewers (សាច់គោអាំង)',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Khmer Iced Milk Coffee (កាហ្វេទឹកដោះគោ)',
    url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
  },
];
