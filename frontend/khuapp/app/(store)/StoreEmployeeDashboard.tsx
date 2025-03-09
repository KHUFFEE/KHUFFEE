// src/components/ui/StoreEmployeeDashboard.tsx
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { RN_API_URL } from '@env';
import HomeScreen from './homescreen';
import OrderRequest from './OrderRequest';
import OrderStatus from './OrderStatus';
import Inventory from './Inventory';
import { styles } from '../../src/components/ui/common/commonstyler';
import { StoreOrderData, APIProduct, LocalOrder, ViewType, storename } from '../../src/components/ui/common/types';

// props 타입 확장
interface StoreEmployeeDashboardProps extends storename {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const StoreEmployeeDashboard: React.FC<StoreEmployeeDashboardProps> = ({ 
  storeName, 
  activeView, 
  setActiveView 
}) => {
  const [storeId, setStoreId] = useState<string>('');
  const [items, setItems] = useState<APIProduct[]>([]);
  const [localOrders, setLocalOrders] = useState<LocalOrder[]>([]);

  // 매장 정보 조회
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const response = await fetch(`${RN_API_URL}/api/accounts/stores/`);
        const storesData = await response.json();
        const matchedStore = storesData.find((store: any) => store.매장명 === storeName);
        if (matchedStore) {
          setStoreId(matchedStore.매장_id);
        }
      } catch (error) {
        console.error('매장 정보 조회 중 오류:', error);
      }
    };
    fetchStoreInfo();
  }, [storeName]);

  // 품목 정보 조회
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`${RN_API_URL}/api/suppliers/items/`);
        const data: APIProduct[] = await res.json();
        setItems(data);
      } catch (error) {
        console.error('품목 정보 조회 오류:', error);
      }
    };
    fetchItems();
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeScreen storeName={storeName} storeId={storeId} />;
      case 'order-request':
        return (
          <OrderRequest
            storeName={storeName}
            storeId={storeId}
            onOrderComplete={() => setActiveView('order-status')}
            onNewOrder={(orderData) => setLocalOrders((prev) => [orderData, ...prev])}
          />
        );
      case 'order-status':
        return <OrderStatus storeId={storeId} />;
      case 'inventory':
        return <Inventory storeId={storeId} />;
      default:
        return null;
    }
  };

  // 하단 바를 제거하고 내용만 렌더링
  return (
    <View style={styles.mainContent}>
      {renderView()}
    </View>
  );
};

export default StoreEmployeeDashboard;
