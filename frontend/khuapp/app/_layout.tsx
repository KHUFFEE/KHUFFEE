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
    <Stack>
      <Stack.Screen
        name="(login)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(store)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}