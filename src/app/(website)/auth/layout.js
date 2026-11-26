// Connexion du personnel : comme l'espace /admin, pas de zoom de Safari iOS au
// toucher des champs (la page restait agrandie après la connexion).
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function AuthLayout({ children }) {
  return children;
}
