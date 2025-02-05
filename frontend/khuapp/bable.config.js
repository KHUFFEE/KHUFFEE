module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/hooks': './src/hooks',
            '@/constants': './src/constants',
            '@/common': './src/components/ui/common',
            '@/layout': './src/components/ui/layout',
            '@/navigation': './src/components/ui/navigation'
          }
        }
      ],
      ['babel-plugin-inline-import', { extensions: ['.png', '.jpg', '.svg'] }]  // 플러그인 추가 및 이미지 확장자 설정
    ]
  };
};
