// src/components/ui/StoreEmployeeDashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Home, ShoppingCart, Receipt, Clipboard } from 'lucide-react-native';
import { RN_API_URL } from '@env';
import HomeScreen from './homescreen';
import OrderRequest from './OrderRequest';
import OrderStatus from './OrderStatus';
import Inventory from './Inventory';
import {styles } from '../../src/components/ui/common/commonstyler';
import { StoreOrderData, APIProduct, LocalOrder, ViewType, storename } from '../../src/components/ui/common/types';

const StoreEmployeeDashboard: React.FC<storename> = ({ storeName }) => {
  const [activeView, setActiveView] = useState<ViewType>('home');
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
        return <HomeScreen storeName={storeName} />;
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
        return <OrderStatus storeId={storeId} items={items} />;
      case 'inventory':
        return <Inventory />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.dashboardContainer}>
      <View style={styles.mainContent}>{renderView()}</View>
      <View style={styles.bottom_navbar}>
        <TouchableOpacity style={styles.bottom_navButton} onPress={() => setActiveView('home')}>
          <Home color={activeView === 'home' ? '#8B0000' : 'black'} />
          <Text style={activeView === 'home' ? styles.bottom_activeNavText : styles.bottom_navText}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottom_navButton} onPress={() => setActiveView('order-request')}>
          <ShoppingCart color={activeView === 'order-request' ? '#8B0000' : 'black'} />
          <Text style={activeView === 'order-request' ? styles.bottom_activeNavText : styles.bottom_navText}>발주 요청</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottom_navButton} onPress={() => setActiveView('order-status')}>
          <Receipt color={activeView === 'order-status' ? '#8B0000' : 'black'} />
          <Text style={activeView === 'order-status' ? styles.bottom_activeNavText : styles.bottom_navText}>발주 내역</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottom_navButton} onPress={() => setActiveView('inventory')}>
          <Clipboard color={activeView === 'inventory' ? '#8B0000' : 'black'} />
          <Text style={activeView === 'inventory' ? styles.bottom_activeNavText : styles.bottom_navText}>재고 관리</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StoreEmployeeDashboard;
