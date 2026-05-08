module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'react' }]],
    plugins: [
      // Reanimated must be the LAST plugin in the list so its babel transform
      // wraps every worklet correctly. Even though the codebase doesn't use
      // worklets directly today, react-native-reanimated is a peer dep of
      // react-native-screens / expo-router and needs the plugin registered
      // for the dev client to boot reliably on iOS/Android.
      'react-native-reanimated/plugin',
    ],
  };
};
