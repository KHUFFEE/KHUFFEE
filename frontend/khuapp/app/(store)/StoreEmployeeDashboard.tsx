// app/(store)/StoreEmployeeDashboard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Home, ShoppingCart, List, Clipboard, Plus, Minus, Trash2 } from 'lucide-react-native';

type ViewType = 'dashboard' | 'order-request' | 'order-status' | 'inventory';

interface StoreEmployeeDashboardProps {
  storeName: string;
}

interface Product {
  id: number;
  name: string;
  category: number;
  unit: string;
  currentStock: number;
  image: string;
}

interface Category {
  id: number;
  name: string;
}

const StoreOrderRequest: React.FC = () => {
  const categories: Category[] = [
    { id: 1, name: '음료 재료' },
    { id: 2, name: '포장재' },
    { id: 3, name: '소모품' }
  ];

  const products: Product[] = [
    { 
      id: 1, 
      name: '원두 1kg', 
      category: 1,
      unit: '봉',
      currentStock: 10,
      image: 'placeholder' 
    },
    { 
      id: 2, 
      name: '우유 2L', 
      category: 1,
      unit: '팩',
      currentStock: 15,
      image: 'placeholder' 
    },
    { 
      id: 3, 
      name: '테이크아웃 컵', 
      category: 2,
      unit: '박스',
      currentStock: 5,
      image: 'placeholder' 
    }
  ];

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<(Product & { quantity: number })[]>([]);

  const filteredProducts = selectedCategory 
    ? products.filter(product => product.category === selectedCategory)
    : products;

  const addItem = (product: Product) => {
    const existingItem = selectedItems.find(item => item.id === product.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, increment: number) => {
    setSelectedItems(selectedItems.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + increment) }
        : item
    ));
  };

  const removeItem = (id: number) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  return (
    <ScrollView style={orderStyles.container}>
      <View style={orderStyles.categorySection}>
        <Text style={orderStyles.sectionTitle}>품목 유형 선택</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={orderStyles.categoryList}>
          <TouchableOpacity
            style={[
              orderStyles.categoryButton,
              selectedCategory === null && orderStyles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              orderStyles.categoryButtonText,
              selectedCategory === null && orderStyles.categoryButtonTextActive
            ]}>전체</Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                orderStyles.categoryButton,
                selectedCategory === category.id && orderStyles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                orderStyles.categoryButtonText,
                selectedCategory === category.id && orderStyles.categoryButtonTextActive
              ]}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={orderStyles.productsSection}>
        <Text style={orderStyles.sectionTitle}>상품 선택하기</Text>
        <View style={orderStyles.productGrid}>
          {filteredProducts.map(product => (
            <TouchableOpacity
              key={product.id}
              style={orderStyles.productCard}
              onPress={() => addItem(product)}
            >
              <View style={orderStyles.productImageContainer}>
                <View style={orderStyles.productImage} />
              </View>
              <Text style={orderStyles.productName}>{product.name}</Text>
              <Text style={orderStyles.productStock}>
                현재고: {product.currentStock}{product.unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedItems.length > 0 && (
        <View style={orderStyles.selectedItemsSection}>
          <Text style={orderStyles.sectionTitle}>선택된 상품</Text>
          {selectedItems.map(item => (
            <View key={item.id} style={orderStyles.selectedItemCard}>
              <View style={orderStyles.selectedItemImage} />
              <View style={orderStyles.selectedItemInfo}>
                <Text style={orderStyles.selectedItemName}>{item.name}</Text>
                <Text style={orderStyles.selectedItemStock}>
                  현재고: {item.currentStock}{item.unit}
                </Text>
              </View>
              <View style={orderStyles.quantityControls}>
                <TouchableOpacity
                  style={orderStyles.quantityButton}
                  onPress={() => updateQuantity(item.id, -1)}
                >
                  <Minus color="black" size={24} />
                </TouchableOpacity>
                <Text style={orderStyles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={orderStyles.quantityButton}
                  onPress={() => updateQuantity(item.id, 1)}
                >
                  <Plus color="black" size={24} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={orderStyles.removeButton}
                  onPress={() => removeItem(item.id)}
                >
                  <Trash2 color="white" size={24} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={orderStyles.orderButton}>
            <Text style={orderStyles.orderButtonText}>발주 요청하기</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const StoreEmployeeDashboard: React.FC<StoreEmployeeDashboardProps> = ({ storeName }) => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <View style={styles.container}>
            <Text style={styles.title}>{storeName}의 홈 화면</Text>
            <Text>대시보드 콘텐츠가 여기에 표시됩니다.</Text>
          </View>
        );
      case 'order-request':
        return <StoreOrderRequest />;
      case 'order-status':
        return (
          <View style={styles.container}>
            <Text style={styles.title}>발주 상태</Text>
            <Text>발주 상태 화면 콘텐츠</Text>
          </View>
        );
      case 'inventory':
        return (
          <View style={styles.container}>
            <Text style={styles.title}>재고 관리</Text>
            <Text>재고 정보가 여기에 표시됩니다.</Text>
          </View>
        );
      default:
        return <Text>페이지를 선택해주세요</Text>;
    }
  };

  return (
    <View style={styles.dashboardContainer}>
      <View style={styles.mainContent}>{renderView()}</View>
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setActiveView('dashboard')}
        >
          <Home color={activeView === 'dashboard' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'dashboard' ? styles.activeNavText : styles.navText}>
            홈
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setActiveView('order-request')}
        >
          <ShoppingCart color={activeView === 'order-request' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'order-request' ? styles.activeNavText : styles.navText}>
            발주 요청
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setActiveView('order-status')}
        >
          <List color={activeView === 'order-status' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'order-status' ? styles.activeNavText : styles.navText}>
            발주 상태
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setActiveView('inventory')}
        >
          <Clipboard color={activeView === 'inventory' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'inventory' ? styles.activeNavText : styles.navText}>
            재고 관리
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    alignItems: 'center',
  },
  navText: {
    color: 'black',
    marginTop: 4,
  },
  activeNavText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    marginTop: 4,
  },
});

const orderStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  categorySection: {
    paddingVertical: 16,
  },
  categoryList: {
    paddingHorizontal: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  productsSection: {
    paddingVertical: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  productCard: {
    width: '46%',
    margin: '2%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
    borderRadius: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 14,
    color: '#666',
  },
  selectedItemsSection: {
    paddingVertical: 16,
  },
  selectedItemCard: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  selectedItemImage: {
    width: 60,
    height: 60,
    backgroundColor: '#ddd',
    borderRadius: 8,
  },
  selectedItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedItemStock: {
    fontSize: 14,
    color: '#666',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  removeButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ef4444',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  orderButton: {
    backgroundColor: '#3b82f6',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StoreEmployeeDashboard;