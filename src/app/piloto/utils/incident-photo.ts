const MAX_EDGE = 1600;
const TARGET_BYTES = 1_200_000;

function looksLikeImage(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  if (!type || type === 'application/octet-stream') return true;
  if (type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode'));
    };
    img.src = url;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('blob'))), 'image/jpeg', quality);
  });
}

export async function prepareIncidentPhoto(file: File): Promise<File> {
  if (!looksLikeImage(file)) {
    throw new Error('not-image');
  }

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let quality = 0.82;
    let blob = await canvasToJpeg(canvas, quality);
    while (blob.size > TARGET_BYTES && quality > 0.45) {
      quality -= 0.12;
      blob = await canvasToJpeg(canvas, quality);
    }

    const name = file.name.replace(/\.[^.]+$/, '') || 'incidencia';
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    if (file.size > 5 * 1024 * 1024) throw new Error('too-big');
    return file;
  }
}
