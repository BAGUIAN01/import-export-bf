/** @type {import('next').NextConfig} */
const nextConfig = {
  // Headers PWA — Service Worker toujours à jour
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type',  value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/site.webmanifest',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Content-Type',  value: 'application/manifest+json; charset=utf-8' },
        ],
      },
      {
        source: '/offline.html',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },

  // Optimiser les images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },

  // Optimisations de production
  productionBrowserSourceMaps: false,
  
  // Compiler uniquement les pages visitées en dev
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'swr',
    ],
  },

  // Désactiver certaines fonctionnalités en dev
  reactStrictMode: false, // Évite le double render en dev

  // Optimiser le bundle
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Accélérer la compilation en dev
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };

      // Cache du filesystem pour webpack (simplifié)
      config.cache = {
        type: 'filesystem',
      };
    }

    return config;
  },
};

export default nextConfig;
