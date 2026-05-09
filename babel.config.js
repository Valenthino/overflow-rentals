// babel-preset-expo (Expo SDK 50+) already wires in the
// react-native-worklets / react-native-reanimated plugin transparently.
// Listing it again here causes a double-transform that can corrupt the
// bundle on Hermes new-arch — keep this config minimal.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
