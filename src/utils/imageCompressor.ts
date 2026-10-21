/**
 * Utility to crop and compress images client-side before uploading.
 * Produces lightweight WebP or JPEG images under ~25KB.
 */
export async function compressAvatar(
  file: File,
  maxWidth = 200,
  maxHeight = 200,
  quality = 0.8
): Promise<{ blob: Blob; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = img.width;
        const height = img.height;

        // Calculate square center-crop coordinates
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        const targetWidth = Math.min(minDim, maxWidth);
        const targetHeight = Math.min(minDim, maxHeight);

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available.'));
          return;
        }

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';

        // Draw center-cropped square
        ctx.drawImage(
          img,
          startX,
          startY,
          minDim,
          minDim,
          0,
          0,
          targetWidth,
          targetHeight
        );

        // Convert to WebP format with compression quality 0.8
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const previewUrl = URL.createObjectURL(blob);
              resolve({ blob, previewUrl });
            } else {
              // Fallback to image/jpeg if webp conversion fails
              canvas.toBlob(
                (fallbackBlob) => {
                  if (fallbackBlob) {
                    const previewUrl = URL.createObjectURL(fallbackBlob);
                    resolve({ blob: fallbackBlob, previewUrl });
                  } else {
                    reject(new Error('Image compression failed.'));
                  }
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to read image source.'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to load file.'));
    reader.readAsDataURL(file);
  });
}
