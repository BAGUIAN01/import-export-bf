// lib/utilisateurs.js : comptes du personnel (lecture du corps, fonction pure).
import { ROLES_PERSONNEL } from "@/lib/rbac";
import { normaliserTelephone, telephoneValide } from "@/lib/telephone";

export const SELECTION_UTILISATEUR = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  agenceId: true,
  agence: { select: { id: true, nom: true, ville: true, devise: true } },
};

/** Corps de POST/PUT → { data, motDePasse } ou { erreur }. */
export function lireUtilisateur(body, { partiel = false } = {}) {
  const data = {};
  const present = (k) => body[k] !== undefined;
  if (!partiel || present("name")) {
    const nom = String(body.name ?? "").trim();
    if (!nom) return { erreur: "Indiquez le nom de la personne." };
    data.name = nom;
  }
  if (!partiel || present("phone")) {
    const tel = normaliserTelephone(body.phone, "FR");
    if (!tel || !telephoneValide(tel)) return { erreur: "Le téléphone est incomplet ou invalide." };
    data.phone = tel;
  }
  if (present("email")) {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erreur: "L'adresse e-mail est invalide." };
    data.email = email || null;
  }
  if (!partiel || present("role")) {
    if (!ROLES_PERSONNEL.includes(body.role)) return { erreur: "Choisissez un profil." };
    data.role = body.role;
  }
  if (present("agenceId")) data.agenceId = body.agenceId || null;
  if (present("isActive")) data.isActive = !!body.isActive;

  let motDePasse = null;
  if (body.password !== undefined && body.password !== "") {
    motDePasse = String(body.password);
    if (motDePasse.length < 8) return { erreur: "Le mot de passe doit faire au moins 8 caractères." };
  } else if (!partiel) {
    return { erreur: "Donnez un mot de passe de connexion (8 caractères au moins)." };
  }
  return { data, motDePasse };
}
