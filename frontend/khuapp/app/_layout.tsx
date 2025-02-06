// app/(store)/layout.tsx
import React from 'react';
import { View, SafeAreaView } from 'react-native';
import StoreEmployeeDashboard from '@/Store/StoreEmployeeDashboard';



const StoreLayout: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StoreEmployeeDashboard />
    </SafeAreaView>
  );
};

export default StoreLayout;