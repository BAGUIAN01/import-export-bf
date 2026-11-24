// Espace du personnel (/admin) : s'installe comme une application à part
// (« Naange Pro »), plein écran, barre d'état blanche, zones sûres de l'iPhone.

export const metadata = {
  manifest: "/manifest-pro.webmanifest",
  appleWebApp: { capable: true, title: "Naange Pro", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function EspacePersonnel({ children }) {
  return children;
}
