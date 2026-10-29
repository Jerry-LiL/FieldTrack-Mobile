/* eslint-disable @typescript-eslint/no-var-requires */
import '@testing-library/react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-secure-store
const mockSecureStoreData = new Map();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key) => mockSecureStoreData.get(key) || null),
  setItemAsync: jest.fn(async (key, value) => {
    mockSecureStoreData.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key) => {
    mockSecureStoreData.delete(key);
  }),
  __clearMockStore: () => mockSecureStoreData.clear(),
}));

// Mock NetInfo
const mockNetInfoListeners = new Set();
let mockNetworkState = {
  isConnected: true,
  isInternetReachable: true,
  type: 'wifi',
  details: { isConnectionExpensive: false },
};

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((callback) => {
    mockNetInfoListeners.add(callback);
    callback(mockNetworkState);
    return () => {
      mockNetInfoListeners.delete(callback);
    };
  }),
  fetch: jest.fn(async () => mockNetworkState),
  useNetInfo: jest.fn(() => mockNetworkState),
  __setMockNetworkState: (newState) => {
    mockNetworkState = { ...mockNetworkState, ...newState };
    mockNetInfoListeners.forEach((listener) => listener(mockNetworkState));
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  };
});

// Suppress known React 18 act() warnings in headless tests where appropriate
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('ReactImageView') || args[0].includes('inside a test was not wrapped in act'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
