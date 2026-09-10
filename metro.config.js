// Learn more https://docs.expo.dev/guides/customizing-metro
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// Enable minification and production tree-shaking optimization
// Preserves console.warn and console.error so Sentry can capture production breadcrumbs
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    compress: {
      drop_console: false,
      pure_funcs:
        process.env.NODE_ENV === 'production'
          ? ['console.log', 'console.debug', 'console.info']
          : [],
    },
  },
};

module.exports = config;
