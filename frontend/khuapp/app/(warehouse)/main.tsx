import React, { useState } from 'react';
import { SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../(login)/index';
import { styles } from '../../src/components/ui/common/commonstyler';
import Layout_warehouse from '../../src/components/ui/Layout_warehouse';
import { ViewType } from '../../src/components/ui/common/types';

export default function WarehouseDashboardScreen() {
  const route = useRoute();
  const { storeName } = route.params as { storeName: string };

  // 현재 활성화된 뷰 상태 - 기본값을 'inventory'로 설정
  const [activeView, setActiveView] = useState<ViewType>('inventory');

  // 간단한 페이지 컴포넌트들
  const InventoryScreen = () => (
    <View style={localStyles.container}>
      <Text style={localStyles.title}>입고관리 페이지입니다.</Text>
    </View>
  );

  const ExpirationScreen = () => (
    <View style={localStyles.container}>
      <Text style={localStyles.title}>유통기한관리 페이지입니다.</Text>
    </View>
  );

  const StockScreen = () => (
    <View style={localStyles.container}>
      <Text style={localStyles.title}>재고관리 페이지입니다.</Text>
    </View>
  );

  // 현재 선택된 뷰에 따라 컴포넌트 렌더링
  const renderContent = () => {
    switch (activeView) {
      case 'inventory':
        return <InventoryScreen />;
      case 'expiration':
        return <ExpirationScreen />;
      case 'stock':
        return <StockScreen />;
      default:
        return <InventoryScreen />;
    }
  };

  return (
    <SafeAreaView testID='dashboardContainer' style={styles.dashboardContainer}>
      <Layout_warehouse 
        storeName={storeName} 
        activeView={activeView} 
        setActiveView={setActiveView}
      >
        {renderContent()}
      </Layout_warehouse>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
});
