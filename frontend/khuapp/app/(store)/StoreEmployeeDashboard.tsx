// app/(store)/StoreEmployeeDashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Home, ShoppingCart, List, Clipboard, Plus, Minus, X } from 'lucide-react-native';
import { RN_API_URL } from '@env';
import { Animated } from 'react-native';

type ViewType = 'dashboard' | 'order-request' | 'order-status' | 'inventory';

interface StoreEmployeeDashboardProps {
  storeName: string;
}

const StoreOrderRequest: React.FC = () => {
  // API에서 받아오는 상품의 타입
  interface APIProduct {
    품목_id: string;
    협력사_id: string;
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
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isConfirmation, setIsConfirmation] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // 상품 데이터 로드
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

  // 공급업체 데이터 로드 (협력사_id와 일치하는 공급업체의 협력사명을 사용)
  useEffect(() => {
    fetch("http://192.168.0.6:8000/api/suppliers/")
      .then(response => response.json())
      .then(data => {
        setSuppliers(data);
      })
      .catch(err => {
        console.error("공급업체 데이터를 불러오는 중 오류:", err);
      });
  }, []);

  // 공급업체 데이터를 이용하여 제품의 협력사명을 확인하는 함수
  const getSupplierName = (product: APIProduct): string => {
    // suppliers 배열 내에서 product.협력사_id와 일치하는 공급업체를 찾음
    const supplier = suppliers.find((s: any) => s.협력사_id === product.협력사_id);
    return supplier ? supplier.협력사명 : product.협력사명;
  };

  // API 데이터에서 고유한 품목 유형(종류) 추출
  const uniqueCategories = Array.from(new Set(apiItems.map(item => item.종류)));

  // 선택된 카테고리에 따른 필터링
  const filteredProducts = selectedCategory
    ? apiItems.filter(item => item.종류 === selectedCategory)
    : apiItems;

  // 정렬 기준:
  // 1차: 공급업체 API에서 가져온 협력사명을 기준으로 정렬
  // 2차: 같은 협력사 내에서는 품목명을 가나다 순 정렬하는데,
  //      단, 품목명이 숫자로 시작하면 뒤로 배치
  const sortedProducts = filteredProducts.slice().sort((a, b) => {
    const supplierA = getSupplierName(a);
    const supplierB = getSupplierName(b);
    if (supplierA < supplierB) return -1;
    if (supplierA > supplierB) return 1;

    // 같은 공급업체인 경우 품목명 정렬
    const aStartsWithNumber = /^\d/.test(a.품목명);
    const bStartsWithNumber = /^\d/.test(b.품목명);
    if (aStartsWithNumber !== bStartsWithNumber) {
      // 숫자로 시작하는 품목은 뒤로 배치
      return aStartsWithNumber ? 1 : -1;
    }
    if (a.품목명 < b.품목명) return -1;
    if (a.품목명 > b.품목명) return 1;
    return 0;
  });

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
          if (numericValue === 0) {
            return { ...item, customQuantity: text, error: `최소 수량은 ${item.출고단위}${item.단위}입니다.` };
          }
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

  // 발주 확인 버튼: 선택한 상품 검증 후 오류가 있으면 모달 표시, 없으면 확인 화면으로 전환
  const handleConfirmOrder = () => {
    const errors: string[] = [];
    selectedItems.forEach(item => {
      if (item.quantity === 0) {
        errors.push(`${item.품목명}의 수량이 0입니다. 최소 수량은 ${item.출고단위}${item.단위}입니다.`);
      }
      if (item.quantity % item.출고단위 !== 0) {
        errors.push(`${item.품목명}의 수량은 ${item.출고단위}${item.단위}의 배수여야 합니다.`);
      }
      if (item.error) {
        errors.push(`${item.품목명}: ${item.error}`);
      }
    });

    if (errors.length > 0) {
      setErrorMessages(errors);
      setModalVisible(true);
      return;
    }
    setIsConfirmation(true);
  };

  // 발주 요청 처리 (실제 POST 요청 로직 추가 가능)
  const handleOrderSubmit = () => {
    const orderPayload = selectedItems.map(item => ({
      품목_id: item.품목_id,
      quantity: item.quantity,
    }));
    console.log("발주 요청:", orderPayload);
  };

  if (loading) {
    return (
      <View style={orderStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={orderStyles.loadingText}>로딩 중...</Text>
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

  // 제품 카드 렌더러
  const renderProductCard = (product: APIProduct) => {
    const selected = selectedItems.find(item => item.품목_id === product.품목_id);
    if (selected) {
      return (
        <View key={product.품목_id} style={orderStyles.selectedItemCard}>
          <View style={orderStyles.selectedItemInfo}>
            <Text style={orderStyles.selectedItemName}>{product.품목명}</Text>
            <Text style={orderStyles.unitText}>
              출고단위: {product.출고단위}{product.단위}
            </Text>
            {selected.error && (
              <Text style={orderStyles.errorText}>{selected.error}</Text>
            )}
          </View>
          <View style={orderStyles.actionsContainer}>
            <TouchableOpacity
              style={orderStyles.quantityButton}
              onPress={() => updateQuantity(product.품목_id, -product.출고단위)}
            >
              <Minus color="black" size={18} />
            </TouchableOpacity>
            <TextInput
              style={orderStyles.quantityInput}
              value={selected.customQuantity}
              keyboardType="numeric"
              onChangeText={(text) => updateCustomQuantity(product.품목_id, text)}
            />
            <TouchableOpacity
              style={orderStyles.quantityButton}
              onPress={() => updateQuantity(product.품목_id, product.출고단위)}
            >
              <Plus color="black" size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={orderStyles.removeButton}
              onPress={() => removeItem(product.품목_id)}
            >
              <X color="white" size={18} />
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <View key={product.품목_id} style={orderStyles.selectedItemCard}>
          <View style={orderStyles.selectedItemInfo}>
            <Text style={orderStyles.selectedItemName}>{product.품목명}</Text>
            <Text style={orderStyles.unitText}>
              출고단위: {product.출고단위}{product.단위}
            </Text>
          </View>
          <TouchableOpacity style={orderStyles.orderButton} onPress={() => addItem(product)}>
            <Text style={orderStyles.orderButtonText}>상품선택</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // 전체 레이아웃 구성 – 비확인(상품 선택)과 확인 화면 분리
  return (
    <View style={{ flex: 1 }}>
      {!isConfirmation ? (
        <>
          <ScrollView style={[orderStyles.container, { paddingBottom: 100 }]}>
            <View style={orderStyles.categorySection}>
              <Text style={orderStyles.sectionTitle}>품목 유형 선택</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={orderStyles.categoryList}>
                <TouchableOpacity
                  style={[orderStyles.categoryButton, selectedCategory === null && orderStyles.categoryButtonActive]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={[orderStyles.categoryButtonText, selectedCategory === null && orderStyles.categoryButtonTextActive]}>
                    전체
                  </Text>
                </TouchableOpacity>
                {uniqueCategories.map((cat, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[orderStyles.categoryButton, selectedCategory === cat && orderStyles.categoryButtonActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[orderStyles.categoryButtonText, selectedCategory === cat && orderStyles.categoryButtonTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={orderStyles.productsSection}>
              <Text style={orderStyles.sectionTitle}>상품 선택하기</Text>
              <View style={orderStyles.productGrid}>
                {sortedProducts.map(product => renderProductCard(product))}
              </View>
            </View>
          </ScrollView>
          <TouchableOpacity style={[orderStyles.orderButton, orderStyles.fixedOrderButton]} onPress={handleConfirmOrder}>
            <Text style={orderStyles.orderButtonText}>발주확인</Text>
          </TouchableOpacity>
        </>
      ) : (
        <ScrollView style={orderStyles.container}>
          <View style={orderStyles.selectedItemsSection}>
            <Text style={orderStyles.sectionTitle}>선택한 상품 확인</Text>
            <View style={orderStyles.productGrid}>
              {selectedItems.map(item => (
                <View key={item.품목_id} style={orderStyles.selectedItemCard}>
                  <View style={orderStyles.selectedItemInfo}>
                    <Text style={orderStyles.selectedItemName}>{item.품목명}</Text>
                    <Text style={orderStyles.unitText}>
                      출고단위: {item.출고단위}{item.단위}
                    </Text>
                    {item.error && (
                      <Text style={orderStyles.errorText}>{item.error}</Text>
                    )}
                  </View>
                  <View style={orderStyles.actionsContainer}>
                    <TouchableOpacity
                      style={orderStyles.quantityButton}
                      onPress={() => updateQuantity(item.품목_id, -item.출고단위)}
                    >
                      <Minus color="black" size={18} />
                    </TouchableOpacity>
                    <TextInput
                      style={orderStyles.quantityInput}
                      value={item.customQuantity}
                      keyboardType="numeric"
                      onChangeText={(text) => updateCustomQuantity(item.품목_id, text)}
                    />
                    <TouchableOpacity
                      style={orderStyles.quantityButton}
                      onPress={() => updateQuantity(item.품목_id, item.출고단위)}
                    >
                      <Plus color="black" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={orderStyles.removeButton}
                      onPress={() => removeItem(item.품목_id)}
                    >
                      <X color="white" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity style={orderStyles.orderButton} onPress={handleOrderSubmit}>
              <Text style={orderStyles.orderButtonText}>발주요청하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[orderStyles.orderButton, { backgroundColor: '#999', marginTop: 10 }]}
              onPress={() => setIsConfirmation(false)}
            >
              <Text style={orderStyles.orderButtonText}>뒤로가기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>발주 오류</Text>
            {errorMessages.map((msg, index) => (
              <Text key={index} style={modalStyles.modalText}>{msg}</Text>
            ))}
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={modalStyles.textStyle}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    flex: 1,
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
    paddingHorizontal: 5,
    justifyContent: 'space-between',
  },
  selectedItemsSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  selectedItemCard: {
    width: '48%',
    minHeight: 120,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  selectedItemInfo: {
    marginBottom: 8,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  unitText: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: '#fff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  quantityInput: {
    width: 40,
    height: 28,
    borderColor: '#ccc',
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 4,
    marginHorizontal: 2,
    fontSize: 14,
    padding: 0,
  },
  removeButton: {
    width: 28,
    height: 28,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: 4,
  },
  orderButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fixedOrderButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
    marginTop: 15,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default StoreEmployeeDashboard;
