/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['apexcharts', 'react-apexcharts', '@fullcalendar/react'],
  },

  webpack: (config, { isServer }) => {
    // Find and modify the oneOf rule (Next.js default structure)
    const oneOfRule = config.module.rules.find((rule) => rule.oneOf);
    
    if (oneOfRule && oneOfRule.oneOf) {
      // Exclude SVG from all file-loader rules in oneOf
      oneOfRule.oneOf.forEach((rule) => {
        if (rule.test && rule.test instanceof RegExp && rule.test.test('.svg')) {
          rule.exclude = /\.svg$/i;
        }
      });

      // Insert SVG rule at the beginning of oneOf array
      oneOfRule.oneOf.unshift({
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
    } else {
      // Fallback: handle rules array directly
      config.module.rules.forEach((rule) => {
        if (rule.test && rule.test instanceof RegExp && rule.test.test('.svg')) {
          rule.exclude = /\.svg$/i;
        }
      });

      config.module.rules.unshift({
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
    }
    
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
