import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { RootStackParamList, MainTabParamList } from './types';
import { useAppSelector } from '../store/hooks';

import { LoginScreen } from '../screens/LoginScreen';
import { TaskListScreen } from '../screens/TaskListScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { TaskFormScreen } from '../screens/TaskFormScreen';
import { ExpenseListScreen } from '../screens/ExpenseListScreen';
import { ExpenseFormScreen } from '../screens/ExpenseFormScreen';
import { ExpenseSummaryScreen } from '../screens/ExpenseSummaryScreen';
import { SyncDebugScreen } from '../screens/SyncDebugScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  const pendingCount = useAppSelector((state) => state.sync.pendingCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E2E8F0' },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tab.Screen
        name="TasksTab"
        component={TaskListScreen}
        options={{
          title: 'Field Tasks',
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 16, fontWeight: '700' }}>[T]</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ExpensesTab"
        component={ExpenseListScreen}
        options={{
          title: 'Expenses',
          tabBarLabel: 'Expenses',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 16, fontWeight: '700' }}>[$]</Text>
          ),
        }}
      />
      <Tab.Screen
        name="SummaryTab"
        component={ExpenseSummaryScreen}
        options={{
          title: 'Financial Summary',
          tabBarLabel: 'Summary',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 16, fontWeight: '700' }}>[%]</Text>
          ),
        }}
      />
      <Tab.Screen
        name="SyncTab"
        component={SyncDebugScreen}
        options={{
          title: 'Sync Status',
          tabBarLabel: 'Sync',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 16, fontWeight: '700' }}>[S]</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const authStatus = useAppSelector((state) => state.auth.status);
  const isAuthenticated = authStatus === 'authenticated';

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TaskDetail"
            component={TaskDetailScreen}
            options={{ title: 'Task Details' }}
          />
          <Stack.Screen
            name="TaskForm"
            component={TaskFormScreen}
            options={({ route }) => ({
              title: route.params?.task ? 'Edit Task' : 'New Task',
            })}
          />
          <Stack.Screen
            name="ExpenseForm"
            component={ExpenseFormScreen}
            options={({ route }) => ({
              title: route.params?.expense ? 'Edit Expense' : 'Log Expense',
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
