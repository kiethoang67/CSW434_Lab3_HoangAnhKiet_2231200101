const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const realNodeModules = path.resolve(__dirname, '../../ToxicityApp/node_modules');

const config = {
  watchFolders: [realNodeModules],
  resolver: {
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules'), realNodeModules],
    unstable_enableSymlinks: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
