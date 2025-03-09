import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { RN_API_URL } from '@env';
import { APIProduct } from '../../src/components/ui/common/types';

interface InventoryProps {
  warehouseId: string;
  items: APIProduct[];
}

const Inventory_warehouse: React.FC<InventoryProps> = ({ warehouseId, items }) => {
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredData, setFilteredData] = useState<any[]>([]);

  useEffect(() => {
    const fetchInventoryData = async () => {
      if (!warehouseId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${RN_API_URL}/api/warehouses/${warehouseId}/inventory`);
        const data = await response.json();
        setInventoryData(data);
        setFilteredData(data);
      } catch (error) {
        console.error('입고 데이터 조회 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, [warehouseId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredData(inventoryData);
    } else {
      const filtered = inventoryData.filter(item => 
        item.품목명.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.품목코드.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, inventoryData]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>{item.품목명}</Text>
      <Text style={styles.itemCode}>품목코드: {item.품목코드}</Text>
      <Text>수량: {item.수량}</Text>
      <Text>입고일: {new Date(item.입고일).toLocaleDateString()}</Text>
      <Text>유통기한: {new Date(item.유통기한).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>입고 관리</Text>
      
      <TextInput
        style={styles.searchInput}
        placeholder="품목명 또는 코드로 검색"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading ? (
        <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.품목코드}-${index}`}
          ListEmptyComponent={<Text style={styles.emptyText}>입고 데이터가 없습니다.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemCode: {
    color: '#666',
    marginBottom: 8,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default Inventory_warehouse; 