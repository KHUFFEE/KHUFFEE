// app/(store)/layout.tsx
import React from 'react';
import { View, SafeAreaView } from 'react-native';
import StoreEmployeeDashboard from '@/Store/StoreEmployeeDashboard';
import { Stack } from 'expo-router';

const StoreLayout: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StoreEmployeeDashboard />
    </SafeAreaView>
  );
};

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(login)" />
      <Stack.Screen name="(store)" />
    </Stack>
  );
}