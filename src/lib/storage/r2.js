// lib/storage/r2.js
// Dépôt de fichiers dans Cloudflare R2 (API compatible S3), côté serveur uniquement.
// Les identifiants restent dans les variables d'environnement Vercel :
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
import { AwsClient } from "aws4fetch";

const REQUIRED = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_URL",
];

export function missingR2Config() {
  return REQUIRED.filter((k) => !process.env[k]);
}

export function isR2Configured() {
  return missingR2Config().length === 0;
}

let client = null;
function getClient() {
  if (!client) {
    client = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
      // aws4fetch réessaie 10 fois par défaut : trop long pour un dialogue ouvert.
      retries: 2,
    });
  }
  return client;
}

function objectUrl(key) {
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}/${path}`;
}

// Adresse publique du fichier (domaine branché sur le bucket, ou r2.dev).
export function publicUrlFor(key) {
  return `${process.env.R2_PUBLIC_URL.replace(/\/+$/, "")}/${key}`;
}

const TIMEOUT_MS = 15000;

export async function putObject(key, body, contentType) {
  const res = await getClient().fetch(objectUrl(key), {
    method: "PUT",
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "Content-Type": contentType,
      // Chaque photo a un nom unique : on peut la garder en cache longtemps.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 PUT ${res.status} ${text.slice(0, 200)}`);
  }
  return publicUrlFor(key);
}

export async function deleteObject(key) {
  if (!key) return;
  const res = await getClient().fetch(objectUrl(key), {
    method: "DELETE",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  // 404 : déjà absent, rien à faire.
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 DELETE ${res.status}`);
  }
}
