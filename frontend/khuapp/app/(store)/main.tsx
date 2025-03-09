import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../(login)/index';
import StoreEmployeeDashboard from './StoreEmployeeDashboard';
import { styles } from '../../src/components/ui/common/commonstyler';
import Layout from '../../src/components/ui/Layout';
import { ViewType } from '../../src/components/ui/common/types';

export default function StoreDashboardScreen() {
  const route = useRoute();
  const { storeName } = route.params as { storeName: string };

  // 현재 활성화된 뷰 상태
  const [activeView, setActiveView] = useState<ViewType>('home');

  return (
    <SafeAreaView testID='dashboardContainer' style={styles.dashboardContainer}>
      <Layout 
        storeName={storeName} 
        activeView={activeView} 
        setActiveView={setActiveView}
      >
        <StoreEmployeeDashboard 
          storeName={storeName} 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
      </Layout>
    </SafeAreaView>
  );
}
