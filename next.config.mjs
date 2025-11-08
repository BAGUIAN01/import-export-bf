/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisations de compilation
  
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
