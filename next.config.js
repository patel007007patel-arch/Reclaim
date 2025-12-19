/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['apexcharts', 'react-apexcharts', '@fullcalendar/react'],
  },

  webpack: (config, { isServer }) => {
    // Find the rule that handles images/assets
    const fileLoaderRule = config.module.rules.find((rule) => {
      if (rule.test && rule.test instanceof RegExp) {
        return rule.test.test('.svg');
      }
      return false;
    });

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    // SVG handling - convert SVGs to React components using SVGR
    // This must come after excluding SVG from file-loader
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [{
        loader: "@svgr/webpack",
        options: {
          typescript: true,
          ext: "tsx",
        },
      }],
    });
    
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
