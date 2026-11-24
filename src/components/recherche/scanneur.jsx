"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff, Loader2 } from "lucide-react";

// Codes lus par le détecteur du navigateur (Chrome Android, Safari récent) ;
// sinon jsQR (QR codes seulement), chargé à la demande.
const FORMATS = ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "data_matrix"];

function messageErreur(e) {
  if (typeof window !== "undefined" && !window.isSecureContext) return "La caméra ne s'ouvre que sur une adresse sécurisée (https).";
  switch (e?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "L'accès à la caméra est refusé. Autorisez-le dans les réglages du navigateur, puis réessayez.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "Aucune caméra trouvée sur cet appareil.";
    case "NotReadableError":
      return "La caméra est déjà utilisée par une autre application.";
    default:
      return "La caméra n'a pas pu s'ouvrir.";
  }
}

async function creerLecteur() {
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const pris = await window.BarcodeDetector.getSupportedFormats();
      const formats = FORMATS.filter((f) => pris.includes(f));
      if (formats.includes("qr_code")) {
        const detecteur = new window.BarcodeDetector({ formats });
        return async (video) => (await detecteur.detect(video))[0]?.rawValue || null;
      }
    } catch {
      /* détecteur indisponible : jsQR */
    }
  }
  const { default: jsQR } = await import("jsqr");
  const toile = document.createElement("canvas");
  const ctx = toile.getContext("2d", { willReadFrequently: true });
  return async (video) => {
    const echelle = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
    toile.width = Math.round(video.videoWidth * echelle);
    toile.height = Math.round(video.videoHeight * echelle);
    if (!toile.width || !toile.height) return null;
    ctx.drawImage(video, 0, 0, toile.width, toile.height);
    const image = ctx.getImageData(0, 0, toile.width, toile.height);
    return jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" })?.data || null;
  };
}

/**
 * Scanneur par la caméra (arrière sur tablette et téléphone) : QR code du
 * bordereau, étiquettes. Appelle `onLu(texte)` au premier code lu.
 */
export function Scanneur({ onLu }) {
  const video = useRef(null);
  const [etat, setEtat] = useState("ouverture"); // ouverture | pret | erreur
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let flux = null;
    let fini = false;
    let minuteur = null;

    async function demarrer() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error(), { name: "SecurityError" });
        flux = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (fini) return;
        const v = video.current;
        v.srcObject = flux;
        await v.play();
        const lire = await creerLecteur();
        if (fini) return;
        setEtat("pret");
        const boucle = async () => {
          if (fini) return;
          try {
            const texte = v.readyState >= 2 ? await lire(v) : null;
            if (texte && !fini) {
              fini = true;
              navigator.vibrate?.(60);
              onLu(texte);
              return;
            }
          } catch {
            /* image illisible : on continue */
          }
          minuteur = setTimeout(boucle, 120);
        };
        boucle();
      } catch (e) {
        if (!fini) {
          setErreur(messageErreur(e));
          setEtat("erreur");
        }
      }
    }
    demarrer();

    return () => {
      fini = true;
      clearTimeout(minuteur);
      flux?.getTracks().forEach((t) => t.stop());
    };
  }, [onLu]);

  return (
    <div className="flex flex-col items-center gap-3 p-4 sm:p-5">
      <div className="relative aspect-square w-full max-w-[420px] overflow-hidden rounded-[20px] bg-ink">
        <video ref={video} playsInline muted className="size-full object-cover" aria-label="Image de la caméra" />
        {etat === "pret" && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-[14%] rounded-[18px] border-[3px] border-white/90 shadow-[0_0_0_999px_rgba(15,23,20,.35)]">
            <span className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 animate-pulse rounded bg-brand" />
          </div>
        )}
        {etat === "ouverture" && (
          <div className="absolute inset-0 grid place-items-center text-white">
            <Loader2 className="size-8 animate-spin" aria-label="Ouverture de la caméra" />
          </div>
        )}
        {etat === "erreur" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <CameraOff className="size-10 text-white/70" aria-hidden="true" />
            <p className="text-[15px]">{erreur}</p>
          </div>
        )}
      </div>
      <p aria-live="polite" className="text-center text-[15px] text-ink-muted">
        {etat === "erreur" ? "Vous pouvez aussi taper le numéro ou utiliser une douchette." : "Visez le QR code du bordereau ou l'étiquette du colis."}
      </p>
    </div>
  );
}
