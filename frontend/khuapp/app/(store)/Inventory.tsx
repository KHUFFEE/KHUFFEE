import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { RN_API_URL } from '@env';
import * as f from '../../src/components/ui/common/function';
import {styles,inventoryStyles} from '../../src/components/ui/common/commonstyler'

interface InventoryProps {
  storeId: string;
}

interface StoreInventoryItem {
  매장_id: string;
  품목_id: string;
  기간: string;
  매장_재고량: number;
}

const Inventory: React.FC<InventoryProps> = ({ storeId }) => {
  const [inventoryData, setInventoryData] = useState<StoreInventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(`${RN_API_URL}/api/inventory/store/?매장_id=${storeId}`);
        if (!response.ok) {
          throw new Error('재고 데이터를 불러오지 못했습니다.');
        }
        const data = await response.json();
        setInventoryData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [storeId]);

  if (loading) {
    return (
      <View style={styles.loading_Container}>
        <ActivityIndicator size="large" color="#0D326F80" />
        <Text style={styles.loading_Text}>로딩 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={inventoryStyles.container}>
        <Text style={inventoryStyles.message}>오류 발생: {error}</Text>
      </View>
    );
  }

  if (inventoryData.length === 0) {
    return (
      <View style={inventoryStyles.container}>
        <Text style={inventoryStyles.message}>재고 데이터가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={inventoryStyles.container}>
      <Text style={inventoryStyles.title}>매장 재고 관리</Text>
      <FlatList
        data={inventoryData}
        keyExtractor={(item) => item.품목_id}
        renderItem={({ item }) => (
          <View style={inventoryStyles.itemContainer}>
            <Text style={inventoryStyles.itemText}>품목 ID: {item.품목_id}</Text>
            <Text style={inventoryStyles.itemText}>기간: {item.기간}</Text>
            <Text style={inventoryStyles.itemText}>
              재고량: {f.formatPrice(item.매장_재고량)}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

export default Inventory;