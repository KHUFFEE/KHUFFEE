import React from 'react';
import { SafeAreaView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import WarehouseEmployeeDashboard from './WarehouseEmployeeDashboard_warehouse';
import { ViewType } from '@/components/ui/common/types';

type WarehouseLayoutRouteProp = RouteProp<{ params: { storeName: string } }, 'params'>;

export default function WarehouseLayout() {
  const route = useRoute<WarehouseLayoutRouteProp>();
  const storeName = route.params?.storeName || '기본 창고';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WarehouseEmployeeDashboard storeName={storeName} activeView={'inventory'} setActiveView={function (view: ViewType): void {
        throw new Error('Function not implemented.');
      } } />
    </SafeAreaView>
  );
} 