// lib/data/villes.js : villes proposées dans les formulaires client
// (saisie libre toujours possible avec FloatingCombobox).

export const VILLES_BURKINA = [
  "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya",
  "Pouytenga", "Dédougou", "Fada N'gourma", "Kaya", "Tenkodogo",
];

export const VILLES_FRANCE = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg",
  "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre",
  "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne",
];

export const PAYS = [
  { value: "France", label: "France" },
  { value: "Burkina Faso", label: "Burkina Faso" },
];

export function villesDuPays(pays) {
  if (pays === "France") return VILLES_FRANCE;
  if (pays === "Burkina Faso") return VILLES_BURKINA;
  return [];
}
