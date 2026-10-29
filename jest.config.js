module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '^react-redux$': '<rootDir>/node_modules/react-redux/dist/cjs/index.js',
    '^immer$': '<rootDir>/node_modules/immer/dist/cjs/index.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/server/'],
  clearMocks: true,
};
