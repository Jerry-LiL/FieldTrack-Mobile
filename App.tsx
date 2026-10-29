import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { restoreSession } from './src/store/authSlice';
import { loadTasksFromDisk } from './src/store/taskSlice';
import { loadExpensesFromDisk } from './src/store/expenseSlice';
import {
  setNetworkOnline,
  triggerFullSync,
  refreshPendingCount,
} from './src/store/syncSlice';

function RootApp() {
  useEffect(() => {
    // 1. Initial bootstrap from local storage
    store.dispatch(restoreSession());
    store.dispatch(loadTasksFromDisk());
    store.dispatch(loadExpensesFromDisk());
    store.dispatch(refreshPendingCount());

    // 2. Network listener for offline/online transitions
    let previousOnlineState: boolean | null = null;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      store.dispatch(setNetworkOnline(isOnline));

      // Trigger automatic sync replay when transitioning from offline to online
      if (previousOnlineState === false && isOnline === true) {
        store.dispatch(triggerFullSync());
      }
      previousOnlineState = isOnline;
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <RootApp />
    </Provider>
  );
}
