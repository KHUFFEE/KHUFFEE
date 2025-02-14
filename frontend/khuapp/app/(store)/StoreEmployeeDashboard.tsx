// app/(store)/StoreEmployeeDashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Home, ShoppingCart, List, Clipboard, Plus, Minus, Trash2 } from 'lucide-react-native';
import { RN_API_URL } from '@env';

type ViewType = 'dashboard' | 'order-request' | 'order-status' | 'inventory';

interface StoreEmployeeDashboardProps {
  storeName: string;
}

const StoreOrderRequest: React.FC = () => {
  // API에서 받아오는 상품의 타입R
  interface APIProduct {
    품목_id: string;
    품목명: string;
    협력사명: string;
    종류: string;
    규격: string;
    단위: string;
    입고단가: string;
    입고단위: number;
    입고단위단가: number;
    출고단위: number;
  }

  // 선택된 아이템에 추가할 필드들
  interface SelectedItem extends APIProduct {
    quantity: number;
    customQuantity: string;
    error: string | null;
  }

  const [apiItems, setApiItems] = useState<APIProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  useEffect(() => {
    fetch(`${RN_API_URL}/api/suppliers/items/`)
      .then(response => response.json())
      .then(data => {
        setApiItems(data);
        setLoading(false);
      })
      .catch(err => {
        setFetchError('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      });
  }, []);

  // API 데이터에서 고유한 품목 유형(종류) 추출
  const uniqueCategories = Array.from(new Set(apiItems.map(item => item.종류)));

  const filteredProducts = selectedCategory
    ? apiItems.filter(item => item.종류 === selectedCategory)
    : apiItems;

  // 상품 선택 시 선택된 목록에 추가 (이미 선택된 경우 출고단위만큼 증감)
  const addItem = (product: APIProduct) => {
    const existingItem = selectedItems.find(item => item.품목_id === product.품목_id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.품목_id === product.품목_id
          ? { 
              ...item, 
              quantity: item.quantity + product.출고단위, 
              customQuantity: (item.quantity + product.출고단위).toString(),
              error: null
            }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { 
          ...product, 
          quantity: product.출고단위, 
          customQuantity: product.출고단위.toString(),
          error: null
      }]);
    }
  };

  // +/- 버튼을 통한 수량 조절 (출고단위 단위로 증감)
  const updateQuantity = (productId: string, increment: number) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.품목_id === productId) {
        const newQuantity = item.quantity + increment;
        // 최소 수량은 출고단위로 제한
        const validQuantity = newQuantity < item.출고단위 ? item.출고단위 : newQuantity;
        return { ...item, quantity: validQuantity, customQuantity: validQuantity.toString(), error: null };
      }
      return item;
    }));
  };

  // 직접 입력 시 값 변경 및 유효성 검사 (출고단위의 배수여야 함)
  const updateCustomQuantity = (productId: string, text: string) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.품목_id === productId) {
        const numericValue = parseInt(text, 10);
        if (!isNaN(numericValue)) {
          if (numericValue % item.출고단위 === 0) {
            return { ...item, quantity: numericValue, customQuantity: text, error: null };
          } else {
            return { ...item, customQuantity: text, error: `출고 단위는 ${item.출고단위}의 배수여야 합니다.` };
          }
        } else {
          return { ...item, customQuantity: text, error: `유효한 숫자를 입력하세요.` };
        }
      }
      return item;
    }));
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.품목_id !== productId));
  };

  // 발주 요청 시 선택된 상품과 수량(품목_id 포함)을 payload로 준비
  const handleOrderSubmit = () => {
    const hasError = selectedItems.some(item => item.error);
    if (hasError) {
      alert("입력한 수량에 오류가 있습니다. 확인해주세요.");
      return;
    }
    const orderPayload = selectedItems.map(item => ({
      품목_id: item.품목_id,
      quantity: item.quantity,
    }));
    console.log("발주 요청:", orderPayload);
    // 실제 발주 POST 요청을 구현할 수 있습니다.
  };

  if (loading) {
    return (
      <View style={orderStyles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={orderStyles.container}>
        <Text>{fetchError}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={orderStyles.container}>
      <View style={orderStyles.categorySection}>
        <Text style={orderStyles.sectionTitle}>품목 유형 선택</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={orderStyles.categoryList}>
          <TouchableOpacity
            style={[orderStyles.categoryButton, selectedCategory === null && orderStyles.categoryButtonActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[orderStyles.categoryButtonText, selectedCategory === null && orderStyles.categoryButtonTextActive]}>전체</Text>
          </TouchableOpacity>
          {uniqueCategories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[orderStyles.categoryButton, selectedCategory === cat && orderStyles.categoryButtonActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[orderStyles.categoryButtonText, selectedCategory === cat && orderStyles.categoryButtonTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={orderStyles.productsSection}>
        <Text style={orderStyles.sectionTitle}>상품 선택하기</Text>
        <View style={orderStyles.productGrid}>
          {filteredProducts.map(product => (
            <TouchableOpacity
              key={product.품목_id}
              style={orderStyles.productCard}
              onPress={() => addItem(product)}
            >
              <Text style={orderStyles.productName}>{product.품목명}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedItems.length > 0 && (
        <View style={orderStyles.selectedItemsSection}>
          <Text style={orderStyles.sectionTitle}>선택된 상품</Text>
          {selectedItems.map(item => (
            <View key={item.품목_id} style={orderStyles.selectedItemCard}>
              <View style={orderStyles.selectedItemInfo}>
                <Text style={orderStyles.selectedItemName}>{item.품목명}</Text>
                <Text style={orderStyles.selectedItemStock}>(출고단위: {item.출고단위}{item.단위})</Text>
              </View>
              <View style={orderStyles.quantityControls}>
                <TouchableOpacity style={orderStyles.quantityButton} onPress={() => updateQuantity(item.품목_id, -item.출고단위)}>
                  <Minus color="black" size={24} />
                </TouchableOpacity>
                <TextInput
                  style={orderStyles.quantityInput}
                  value={item.customQuantity}
                  keyboardType="numeric"
                  onChangeText={(text) => updateCustomQuantity(item.품목_id, text)}
                />
                <TouchableOpacity style={orderStyles.quantityButton} onPress={() => updateQuantity(item.품목_id, item.출고단위)}>
                  <Plus color="black" size={24} />
                </TouchableOpacity>
                <TouchableOpacity style={orderStyles.removeButton} onPress={() => removeItem(item.품목_id)}>
                  <Trash2 color="white" size={24} />
                </TouchableOpacity>
              </View>
              {item.error && <Text style={orderStyles.errorText}>{item.error}</Text>}
            </View>
          ))}
          <TouchableOpacity style={orderStyles.orderButton} onPress={handleOrderSubmit}>
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
        <TouchableOpacity style={styles.navButton} onPress={() => setActiveView('dashboard')}>
          <Home color={activeView === 'dashboard' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'dashboard' ? styles.activeNavText : styles.navText}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => setActiveView('order-request')}>
          <ShoppingCart color={activeView === 'order-request' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'order-request' ? styles.activeNavText : styles.navText}>발주 요청</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => setActiveView('order-status')}>
          <List color={activeView === 'order-status' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'order-status' ? styles.activeNavText : styles.navText}>발주 상태</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => setActiveView('inventory')}>
          <Clipboard color={activeView === 'inventory' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'inventory' ? styles.activeNavText : styles.navText}>재고 관리</Text>
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
  productName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
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
  quantityInput: {
    width: 60,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    textAlign: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 12,
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
