module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // ✅ react-native-dotenv 플러그인 설정
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          blacklist: null,
          whitelist: null,
          safe: true,
          allowUndefined: false,
        },
      ],
      // ✅ babel-plugin-module-resolver 설정
      [
        "module-resolver",
        {
          root: ["./src"],
          extensions: [".ts", ".tsx", ".js", ".json"],
          alias: {
            "@": "./src",
            "@/components": "./src/components",
            "@/hooks": "./src/hooks",
            "@/constants": "./src/constants",
            "@/Store": "./src/Store",
            "@/common": "./src/components/ui/common",
            "@/layout": "./src/components/ui/layout",
            "@/navigation": "./src/components/ui/navigation",
          },
        },
      ],
      // ✅ babel-plugin-inline-import 설정 (SVG 및 텍스트 인라인 import 지원)
      [
        "babel-plugin-inline-import",
        {
          extensions: [".svg", ".txt"], // 필요에 따라 다른 확장자 추가 가능
        },
      ],
    ],
  };
};
