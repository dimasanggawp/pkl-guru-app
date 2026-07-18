const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.75;

export async function compressImage(file, { maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY } = {}) {
  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

  if (!blob || blob.size >= file.size) {
    return file;
  }

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
}
