module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  transformIgnorePatterns: ["/node_modules/(?!vuetify/)"],
  testMatch: ["**/src/**/*.spec.ts", "**/src/**/*.spec.js"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.spec.ts", "src/**/*.vue"],
}
