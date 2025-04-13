import React from "react";
import { Stack } from "expo-router";

export default function WarehouseLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="main" />
      <Stack.Screen name="ExpirationItemAdd_warehouse" />
      {/* 다른 화면들 */}
    </Stack>
  );
}
