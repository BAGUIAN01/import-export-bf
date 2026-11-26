// Espace du personnel (/admin) : s'installe comme une application à part
// (« Naange Pro »), plein écran, barre d'état blanche, zones sûres de l'iPhone.

export const metadata = {
  manifest: "/manifest-pro.webmanifest",
  appleWebApp: { capable: true, title: "Naange Pro", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

// maximumScale 1 : Safari iOS ne zoome plus au toucher d'un champ (la page
// restait agrandie et débordait) ; le pincement reste possible sur iPhone.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function EspacePersonnel({ children }) {
  return children;
}
