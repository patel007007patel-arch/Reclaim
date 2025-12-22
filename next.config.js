/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // Enable instrumentation hook for cron jobs
  experimental: {
    optimizePackageImports: ['apexcharts', 'react-apexcharts', '@fullcalendar/react'],
    instrumentationHook: true,
  },

  webpack: (config, { isServer }) => {
    // Find and modify the oneOf rule (Next.js default structure)
    const oneOfRule = config.module.rules.find((rule) => rule.oneOf);
    
    if (oneOfRule && oneOfRule.oneOf) {
      // Exclude SVG from all other loaders (file-loader, url-loader, next-image-loader, asset/resource)
      oneOfRule.oneOf.forEach((rule) => {
        // Exclude SVGs from any rule that matches SVG files
        if (rule.test && rule.test instanceof RegExp && rule.test.test('.svg')) {
          rule.exclude = /\.svg$/i;
        }
        // Exclude from asset/resource type (Next.js default for images)
        if (rule.type === 'asset/resource' || rule.type === 'asset') {
          if (!rule.exclude) {
            rule.exclude = /\.svg$/i;
          } else if (Array.isArray(rule.exclude)) {
            rule.exclude.push(/\.svg$/i);
          } else {
            rule.exclude = [rule.exclude, /\.svg$/i];
          }
        }
        // Also check for next-image-loader specifically
        if (rule.use && Array.isArray(rule.use)) {
          const hasImageLoader = rule.use.some((useItem) => {
            if (typeof useItem === 'string') {
              return useItem.includes('next-image-loader') || useItem.includes('file-loader') || useItem.includes('asset');
            }
            if (typeof useItem === 'object' && useItem.loader) {
              return useItem.loader.includes('next-image-loader') || useItem.loader.includes('file-loader');
            }
            return false;
          });
          if (hasImageLoader) {
            if (!rule.exclude) {
              rule.exclude = /\.svg$/i;
            } else if (Array.isArray(rule.exclude)) {
              rule.exclude.push(/\.svg$/i);
            } else {
              rule.exclude = [rule.exclude, /\.svg$/i];
            }
          }
        }
      });

      // Insert SVG rule at the beginning of oneOf array (before other rules)
      // This ensures SVGR processes SVGs before any other loader
      // Remove issuer restriction to catch all SVG imports
      oneOfRule.oneOf.unshift({
        test: /\.svg$/i,
        resourceQuery: { not: [/url/] }, // exclude ?url imports
        type: 'javascript/auto', // Tell webpack to treat output as JS
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              svgo: false,
            },
          },
        ],
      });
    } else {
      // Fallback: handle rules array directly
      config.module.rules.forEach((rule) => {
        // Exclude SVGs from any rule that matches SVG files
        if (rule.test && rule.test instanceof RegExp && rule.test.test('.svg')) {
          rule.exclude = /\.svg$/i;
        }
        // Exclude from asset/resource type (Next.js default for images)
        if (rule.type === 'asset/resource' || rule.type === 'asset') {
          if (!rule.exclude) {
            rule.exclude = /\.svg$/i;
          } else if (Array.isArray(rule.exclude)) {
            rule.exclude.push(/\.svg$/i);
          } else {
            rule.exclude = [rule.exclude, /\.svg$/i];
          }
        }
        // Also check for next-image-loader specifically
        if (rule.use && Array.isArray(rule.use)) {
          const hasImageLoader = rule.use.some((useItem) => {
            if (typeof useItem === 'string') {
              return useItem.includes('next-image-loader') || useItem.includes('file-loader') || useItem.includes('asset');
            }
            if (typeof useItem === 'object' && useItem.loader) {
              return useItem.loader.includes('next-image-loader') || useItem.loader.includes('file-loader');
            }
            return false;
          });
          if (hasImageLoader) {
            if (!rule.exclude) {
              rule.exclude = /\.svg$/i;
            } else if (Array.isArray(rule.exclude)) {
              rule.exclude.push(/\.svg$/i);
            } else {
              rule.exclude = [rule.exclude, /\.svg$/i];
            }
          }
        }
      });

      config.module.rules.unshift({
        test: /\.svg$/i,
        resourceQuery: { not: [/url/] }, // exclude ?url imports
        type: 'javascript/auto', // Tell webpack to treat output as JS
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              svgo: false,
            },
          },
        ],
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
