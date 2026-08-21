const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['vgfuwxqfnkkqwyyospxi.supabase.co'],
  },
  webpack: function (config, { isServer }) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /cardano_serialization_lib_bg\.js/ },
    ];

    if (isServer) {
      // Mesh WASM deadlocks webpack when compiled for SSR. Use a no-op stub on the server.
      config.resolve.alias = {
        ...config.resolve.alias,
        '@meshsdk/react': path.resolve(__dirname, 'lib/meshStub.js'),
        '@emurgo/cardano-serialization-lib-browser': false,
      };
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
