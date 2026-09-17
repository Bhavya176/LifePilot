// Learn more https://docs.expo.dev/guides/customizing-metro
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// Enable aggressive minification, toplevel mangling, and production tree-shaking optimization
// Preserves console.warn and console.error so Sentry can capture production breadcrumbs
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    ecma: 2020,
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      module: true,
      toplevel: true,
      safari10: true,
    },
    output: {
      ascii_only: true, // Prevents Unicode character leakage
      comments: false, // Strips all license headers, comments, and author tags
    },
    compress: {
      passes: 2, // Multi-pass aggressive optimization & dead-code elimination
      drop_console: false, // Keeps warn and error for Sentry production breadcrumbs
      pure_funcs:
        process.env.NODE_ENV === 'production'
          ? ['console.log', 'console.debug', 'console.info']
          : [],
      dead_code: true,
      drop_debugger: true,
      evaluate: true,
      inline: true,
      reduce_funcs: true,
      reduce_vars: true,
      unused: true,
    },
  },
};

module.exports = config;
