// lib/image-reduite.js : photo prise ou choisie sur la tablette → JPEG réduit
// (data URL), assez léger pour être enregistré en base et affiché à la caisse.

export async function reduireImage(fichier, { cote = 640, qualite = 0.82 } = {}) {
  if (!fichier || !fichier.type?.startsWith("image/")) throw new Error("Choisissez une image.");
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Cette image n'a pas pu être lue."));
      i.src = url;
    });
    const echelle = Math.min(1, cote / Math.max(img.naturalWidth, img.naturalHeight));
    const l = Math.max(1, Math.round(img.naturalWidth * echelle));
    const h = Math.max(1, Math.round(img.naturalHeight * echelle));
    const canvas = document.createElement("canvas");
    canvas.width = l;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF"; // fond blanc pour les PNG transparents
    ctx.fillRect(0, 0, l, h);
    ctx.drawImage(img, 0, 0, l, h);
    return canvas.toDataURL("image/jpeg", qualite);
  } finally {
    URL.revokeObjectURL(url);
  }
}
