import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { styles } from '../../src/components/ui/common/commonstyler';
import Layout_warehouse from '../../src/components/ui/Layout_warehouse';
import { ViewType } from '../../src/components/ui/common/types';
import WarehouseEmployeeDashboard_warehouse from './WarehouseEmployeeDashboard_warehouse';

export default function WarehouseDashboardScreen() {
  const route = useRoute();
  const { storeName } = route.params as { storeName: string };

  // 현재 활성화된 뷰 상태 - 기본값을 'inventory'로 설정
  const [activeView, setActiveView] = useState<ViewType>('inventory');

  return (
    <SafeAreaView testID='dashboardContainer' style={styles.dashboardContainer}>
      <Layout_warehouse 
        storeName={storeName} 
        activeView={activeView} 
        setActiveView={setActiveView}
      >
        <WarehouseEmployeeDashboard_warehouse 
          storeName={storeName} 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
      </Layout_warehouse>
    </SafeAreaView>
  );
}
