// lib/data/indicatifs.js : pays proposés pour les numéros de téléphone.
// `sample` donne le format national et sert de longueur maximale.

export const INDICATIFS = [
  { iso2: "FR", name: "France",        dial: "+33",  flag: "🇫🇷", sample: "06 12 34 56 78" },    // 10 national
  { iso2: "BF", name: "Burkina Faso",  dial: "+226", flag: "🇧🇫", sample: "70 12 34 56" },       // 8
  { iso2: "CI", name: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮", sample: "01 23 45 67 89" },    // 10 (nouveau plan)
  { iso2: "ML", name: "Mali",          dial: "+223", flag: "🇲🇱", sample: "65 12 34 56" },       // 8
  { iso2: "SN", name: "Sénégal",       dial: "+221", flag: "🇸🇳", sample: "70 123 45 67" },      // 9
  { iso2: "NE", name: "Niger",         dial: "+227", flag: "🇳🇪", sample: "90 12 34 56" },       // 8
  { iso2: "TG", name: "Togo",          dial: "+228", flag: "🇹🇬", sample: "90 12 34 56" },       // 8
  { iso2: "BJ", name: "Bénin",         dial: "+229", flag: "🇧🇯", sample: "90 12 34 56" },       // 8
  { iso2: "GH", name: "Ghana",         dial: "+233", flag: "🇬🇭", sample: "024 123 4567" },      // 10 national
  { iso2: "GN", name: "Guinée",        dial: "+224", flag: "🇬🇳", sample: "620 12 34 56" },      // 9
];
