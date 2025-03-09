// src/components/ui/WarehouseEmployeeDashboard_warehouse.tsx
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { RN_API_URL } from '@env';
import Inventory_warehouse from './Inventory_warehouse';
import ExpirationManagement_warehouse from './ExpirationManagement_warehouse';
import StockManagement_warehouse from './StockManagement_warehouse';
import { styles } from '../../src/components/ui/common/commonstyler';
import { APIProduct, ViewType, storename } from '../../src/components/ui/common/types';

// props 타입 확장
interface WarehouseEmployeeDashboardProps extends storename {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const WarehouseEmployeeDashboard_warehouse: React.FC<WarehouseEmployeeDashboardProps> = ({ 
  storeName, 
  activeView, 
  setActiveView 
}) => {
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [items, setItems] = useState<APIProduct[]>([]);

  // 창고 정보 조회
  useEffect(() => {
    const fetchWarehouseInfo = async () => {
      try {
        const response = await fetch(`${RN_API_URL}/api/accounts/warehouses/`);
        const warehousesData = await response.json();
        const matchedWarehouse = warehousesData.find((warehouse: any) => warehouse.창고명 === storeName);
        if (matchedWarehouse) {
          setWarehouseId(matchedWarehouse.창고_id);
        }
      } catch (error) {
        console.error('창고 정보 조회 중 오류:', error);
      }
    };
    fetchWarehouseInfo();
  }, [storeName]);

  // 품목 정보 조회
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`${RN_API_URL}/api/suppliers/items/`);
        const data: APIProduct[] = await res.json();
        setItems(data);
      } catch (error) {
        console.error('품목 정보 조회 중 오류:', error);
      }
    };
    fetchItems();
  }, []);

  // 현재 선택된 뷰에 따라 컴포넌트 렌더링
  const renderView = () => {
    switch (activeView) {
      case 'inventory':
        return <Inventory_warehouse warehouseId={warehouseId} items={items} />;
      case 'expiration':
        return <ExpirationManagement_warehouse warehouseId={warehouseId} items={items} />;
      case 'stock':
        return <StockManagement_warehouse warehouseId={warehouseId} items={items} />;
      default:
        return <Inventory_warehouse warehouseId={warehouseId} items={items} />;
    }
  };

  return (
    <View style={styles.dashboardContainer}>
      {renderView()}
    </View>
  );
};

export default WarehouseEmployeeDashboard_warehouse; 