// lib/utils/image-resize.js
// Réduit une photo dans le navigateur avant l'envoi : une photo de téléphone
// de plusieurs Mo part en ~50 Ko (800 px de large, WebP, ou JPEG si le
// navigateur ne sait pas encoder le WebP).

async function loadImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Repli sur <img> ci-dessous
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function resizeImage(file, { maxSize = 800, quality = 0.82 } = {}) {
  const image = await loadImage(file);
  const width = image.width;
  const height = image.height;
  const scale = Math.min(1, maxSize / Math.max(width, height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  // Fond blanc : une photo PNG transparente ne devient pas noire en JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close?.();

  let blob = await toBlob(canvas, "image/webp", quality);
  // Un navigateur qui ne sait pas faire de WebP rend du PNG : on passe en JPEG.
  if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
  if (!blob) throw new Error("Impossible de préparer la photo");
  return blob;
}
