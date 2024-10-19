/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
/* global module */

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
