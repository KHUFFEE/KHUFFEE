// app/(store)/layout.tsx
import React from 'react';
import { SafeAreaView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import StoreEmployeeDashboard from './StoreEmployeeDashboard';
import { ViewType } from '@/components/ui/common/types';

type StoreLayoutRouteProp = RouteProp<{ params: { storeName: string } }, 'params'>;

export default function StoreLayout() {
  const route = useRoute<StoreLayoutRouteProp>();
  const storeName = route.params?.storeName || '기본 매장';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StoreEmployeeDashboard storeName={storeName} activeView={'home'} setActiveView={function (view: ViewType): void {
        throw new Error('Function not implemented.');
      } } />
    </SafeAreaView>
  );
}
