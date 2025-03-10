// app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* (login)과 (store) 그룹을 포함 */}
      <Stack.Screen name="(login)" />
      <Stack.Screen name="(store)" />
      <Stack.Screen name="(warehouse)" />
    </Stack>
  );
}
