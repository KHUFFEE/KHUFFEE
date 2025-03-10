// src/components/ui/WarehouseEmployeeDashboard_warehouse.tsx
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { RN_API_URL } from '@env';
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

  // 창고 정보 조회 - stores API 사용 (warehouses API가 없음)
  useEffect(() => {
    const fetchWarehouseInfo = async () => {
      try {
        // warehouses API가 없으므로 stores API를 사용
        const response = await fetch(`${RN_API_URL}/api/accounts/stores/`);
        const storesData = await response.json();
        // 창고는 매장 테이블에서 매장_id가 'ST_102'인 항목
        const warehouse = storesData.find((store: any) => store.매장_id === 'ST_102');
        if (warehouse) {
          setWarehouseId(warehouse.매장_id);
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

      case 'expiration':
        return <ExpirationManagement_warehouse warehouseId={warehouseId} items={items} />;
      case 'stock':
        return <StockManagement_warehouse storeId={warehouseId} />;
      default:
        return <StockManagement_warehouse storeId={warehouseId} />;
    }
  };

  return (
    <View style={styles.dashboardContainer}>
      {renderView()}
    </View>
  );
};

export default WarehouseEmployeeDashboard_warehouse; 