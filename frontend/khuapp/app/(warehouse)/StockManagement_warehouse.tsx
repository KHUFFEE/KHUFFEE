import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { RN_API_URL } from '@env';
import { APIProduct } from '../../src/components/ui/common/types';

interface StockManagementProps {
  warehouseId: string;
  items: APIProduct[];
}

const StockManagement_warehouse: React.FC<StockManagementProps> = ({ warehouseId, items }) => {
  const [stockData, setStockData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'quantity'>('name');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchStockData = async () => {
      if (!warehouseId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${RN_API_URL}/api/warehouses/${warehouseId}/stock`);
        const data = await response.json();
        setStockData(data);
        setFilteredData(data);
        
        // 카테고리 추출
        const uniqueCategories = [...new Set(data.map((item: any) => item.카테고리))] as string[];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('재고 데이터 조회 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [warehouseId]);

  useEffect(() => {
    let filtered = [...stockData];
    
    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.카테고리 === selectedCategory);
    }
    
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
    } else if (sortBy === 'quantity') {
      filtered.sort((a, b) => b.재고수량 - a.재고수량);
    }
    
    setFilteredData(filtered);
  }, [searchQuery, stockData, sortBy, selectedCategory]);

  // 재고 상태에 따른 스타일 결정
  const getStockStatusStyle = (quantity: number, minStock: number) => {
    if (quantity <= 0) {
      return styles.outOfStock;
    } else if (quantity < minStock) {
      return styles.lowStock;
    } else {
      return styles.inStock;
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const stockStatusStyle = getStockStatusStyle(item.재고수량, item.최소재고);
    
    return (
      <View style={[styles.itemContainer, stockStatusStyle]}>
        <Text style={styles.itemName}>{item.품목명}</Text>
        <Text style={styles.itemCode}>품목코드: {item.품목코드}</Text>
        <Text>카테고리: {item.카테고리}</Text>
        <View style={styles.stockInfo}>
          <Text style={styles.stockQuantity}>재고: {item.재고수량}</Text>
          <Text style={styles.minStock}>최소재고: {item.최소재고}</Text>
        </View>
        <Text>위치: {item.보관위치}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>재고 관리</Text>
      
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="품목명 또는 코드로 검색"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.controlsContainer}>
        <View style={styles.categoryButtons}>
          <TouchableOpacity 
            style={[styles.categoryButton, selectedCategory === 'all' && styles.activeCategory]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text>전체</Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity 
              key={category}
              style={[styles.categoryButton, selectedCategory === category && styles.activeCategory]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text>{category}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'name' && styles.activeSort]}
            onPress={() => setSortBy('name')}
          >
            <Text>이름순</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'quantity' && styles.activeSort]}
            onPress={() => setSortBy('quantity')}
          >
            <Text>수량순</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.outOfStock]} />
          <Text>품절</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.lowStock]} />
          <Text>부족</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.inStock]} />
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
          ListEmptyComponent={<Text style={styles.emptyText}>재고 데이터가 없습니다.</Text>}
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
    marginBottom: 8,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  controlsContainer: {
    marginBottom: 16,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  activeCategory: {
    backgroundColor: '#ddd',
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginRight: 4,
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
  outOfStock: {
    backgroundColor: '#ffcdd2', // 연한 빨강
  },
  lowStock: {
    backgroundColor: '#fff9c4', // 연한 노랑
  },
  inStock: {
    backgroundColor: '#fff',
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
  stockInfo: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  stockQuantity: {
    fontWeight: 'bold',
    marginRight: 16,
  },
  minStock: {
    color: '#666',
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

export default StockManagement_warehouse; 