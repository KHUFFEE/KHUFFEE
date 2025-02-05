module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@/common': './src/components/ui/common',
            '@/components': './src/components',
            '@/hooks': './src/hooks',
            '@/constants': './src/constants'
          }
        }
      ]
    ]
  };
};
