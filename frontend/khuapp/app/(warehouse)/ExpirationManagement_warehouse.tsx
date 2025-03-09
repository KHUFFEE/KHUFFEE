import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { RN_API_URL } from '@env';
import { APIProduct } from '../../src/components/ui/common/types';

interface ExpirationManagementProps {
  warehouseId: string;
  items: APIProduct[];
}

const ExpirationManagement_warehouse: React.FC<ExpirationManagementProps> = ({ warehouseId, items }) => {
  const [expirationData, setExpirationData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');

  useEffect(() => {
    const fetchExpirationData = async () => {
      if (!warehouseId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${RN_API_URL}/api/warehouses/${warehouseId}/expiration`);
        const data = await response.json();
        setExpirationData(data);
        setFilteredData(data);
      } catch (error) {
        console.error('유통기한 데이터 조회 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpirationData();
  }, [warehouseId]);

  useEffect(() => {
    let filtered = [...expirationData];
    
    // 검색어 필터링
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(item => 
        item.품목명.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.품목코드.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 정렬
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.품목명.localeCompare(b.품목명));
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.유통기한).getTime() - new Date(b.유통기한).getTime());
    }
    
    setFilteredData(filtered);
  }, [searchQuery, expirationData, sortBy]);

  // 유통기한 임박 여부에 따른 스타일 결정
  const getExpirationStyle = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return styles.expired;
    } else if (diffDays <= 7) {
      return styles.nearExpiration;
    } else if (diffDays <= 30) {
      return styles.warning;
    } else {
      return styles.normal;
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const expirationStyle = getExpirationStyle(item.유통기한);
    
    return (
      <View style={[styles.itemContainer, expirationStyle]}>
        <Text style={styles.itemName}>{item.품목명}</Text>
        <Text style={styles.itemCode}>품목코드: {item.품목코드}</Text>
        <Text>수량: {item.수량}</Text>
        <Text>입고일: {new Date(item.입고일).toLocaleDateString()}</Text>
        <Text style={styles.expirationDate}>
          유통기한: {new Date(item.유통기한).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>유통기한 관리</Text>
      
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="품목명 또는 코드로 검색"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'name' && styles.activeSort]}
            onPress={() => setSortBy('name')}
          >
            <Text>이름순</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'date' && styles.activeSort]}
            onPress={() => setSortBy('date')}
          >
            <Text>유통기한순</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.expired]} />
          <Text>유통기한 만료</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.nearExpiration]} />
          <Text>7일 이내</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.warning]} />
          <Text>30일 이내</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.normal]} />
          <Text>정상</Text>
        </View>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.품목코드}-${index}`}
          ListEmptyComponent={<Text style={styles.emptyText}>유통기한 데이터가 없습니다.</Text>}
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginLeft: 4,
  },
  activeSort: {
    backgroundColor: '#ddd',
  },
  itemContainer: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  normal: {
    backgroundColor: '#fff',
  },
  warning: {
    backgroundColor: '#fff9c4', // 연한 노랑
  },
  nearExpiration: {
    backgroundColor: '#ffccbc', // 연한 주황
  },
  expired: {
    backgroundColor: '#ffcdd2', // 연한 빨강
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
  expirationDate: {
    fontWeight: 'bold',
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
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 4,
  },
});

export default ExpirationManagement_warehouse; 