import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Home,
  ShoppingCart,
  Receipt,
  Clipboard,
  Plus,
  Minus,
  X,
} from 'lucide-react-native';
import { RN_API_URL } from '@env';

/** 화면 전환 타입 */
type ViewType = 'dashboard' | 'order-request' | 'order-status' | 'inventory';

/** 서버에서 받아오는 "발주 내역" 타입 */
interface StoreOrderData {
  매장_id: string;
  품목_id: string;
  기간: string; // 예: "2025.02.3"
  매장_발주량: number;
  품목명?: string;
  협력사명?: string;
  출고단위?: number;
}

/** 서버에서 받아오는 "품목" 타입 */
interface ItemData {
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

/** 로컬 주문 타입 */
interface LocalOrder {
  id: number;
  date: string;
  items: {
    품목_id: string;
    품목명: string;
    quantity: number;
    단위: string;
    출고단위: number;
  }[];
}

interface StoreEmployeeDashboardProps {
  storeName: string;
}

/** 숫자를 천 단위로 포맷하는 함수 */
const formatPrice = (value: number): string => {
  return value.toLocaleString();
};

/** "YYYY.MM.W" -> Date 객체 (내림차순 정렬용) */
function parseWeekString(dateKey: string): Date {
  const [yearStr, monthStr, weekStr] = dateKey.split('.');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const week = parseInt(weekStr, 10);
  // 주차를 날짜로 환산 (정렬 목적이므로 대략적으로만)
  const day = (week - 1) * 7 + 1;
  return new Date(year, month - 1, day);
}

/** "YYYY.MM.W" -> "YYYY년 M월 W주차" (화면 표시용) */
function formatWeekString(dateKey: string): string {
  const [yearStr, monthStr, weekStr] = dateKey.split('.');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const week = parseInt(weekStr, 10);
  return `${year}년 ${month}월 ${week}주차`;
}

/** 발주 요청 컴포넌트 */
interface StoreOrderRequestProps {
  storeName: string;
  storeId: string;
  onOrderComplete: () => void;
  onNewOrder: (orderData: LocalOrder) => void;
}

const StoreOrderRequest: React.FC<StoreOrderRequestProps> = ({
  storeName,
  storeId,
  onOrderComplete,
  onNewOrder,
}) => {
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

  const [orderCompleteModalVisible, setOrderCompleteModalVisible] = useState<boolean>(false);
  const [orderFailureModalVisible, setOrderFailureModalVisible] = useState<boolean>(false);

  const [orderFailureMessages, setOrderFailureMessages] = useState<string[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // 품목 리스트 API
  useEffect(() => {
    fetch(`${RN_API_URL}/api/suppliers/items/`)
      .then((response) => response.json())
      .then((data) => {
        setApiItems(data);
        setLoading(false);
      })
      .catch((err) => {
        setFetchError('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      });
  }, []);

  // 협력사 리스트 API
  useEffect(() => {
    fetch(`${RN_API_URL}/api/suppliers/`)
      .then((response) => response.json())
      .then((data) => {
        setSuppliers(data);
      })
      .catch((err) => {
        console.error('공급업체 데이터를 불러오는 중 오류:', err);
      });
  }, []);

  const getSupplierName = (product: APIProduct): string => {
    const supplier = suppliers.find((s: any) => s.협력사_id === product.협력사_id);
    return supplier ? supplier.협력사명 : product.협력사명;
  };

  // 카테고리
  const uniqueCategories = Array.from(new Set(apiItems.map((item) => item.종류)));
  const filteredProducts = selectedCategory
    ? apiItems.filter((item) => item.종류 === selectedCategory)
    : apiItems;

  // 상품 정렬
  const sortedProducts = filteredProducts.slice().sort((a, b) => {
    const supplierA = getSupplierName(a);
    const supplierB = getSupplierName(b);
    if (supplierA < supplierB) return -1;
    if (supplierA > supplierB) return 1;

    const aStartsWithNumber = /^\d/.test(a.품목명);
    const bStartsWithNumber = /^\d/.test(b.품목명);
    if (aStartsWithNumber !== bStartsWithNumber) {
      return aStartsWithNumber ? 1 : -1;
    }
    if (a.품목명 < b.품목명) return -1;
    if (a.품목명 > b.품목명) return 1;
    return 0;
  });

  // 품목 추가
  const addItem = (product: APIProduct) => {
    const existingItem = selectedItems.find((item) => item.품목_id === product.품목_id);
    if (existingItem) {
      setSelectedItems(
        selectedItems.map((item) =>
          item.품목_id === product.품목_id
            ? {
                ...item,
                quantity: item.quantity + product.출고단위,
                customQuantity: (item.quantity + product.출고단위).toString(),
                error: null,
              }
            : item
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          ...product,
          quantity: product.출고단위,
          customQuantity: product.출고단위.toString(),
          error: null,
        },
      ]);
    }
  };

  // 수량 증가/감소
  const updateQuantity = (productId: string, increment: number) => {
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.품목_id === productId) {
          const newQuantity = item.quantity + increment;
          const validQuantity = newQuantity < item.출고단위 ? item.출고단위 : newQuantity;
          return {
            ...item,
            quantity: validQuantity,
            customQuantity: validQuantity.toString(),
            error: null,
          };
        }
        return item;
      })
    );
  };

  // 사용자 입력
  const updateCustomQuantity = (productId: string, text: string) => {
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.품목_id === productId) {
          const numericValue = parseInt(text, 10);
          if (!isNaN(numericValue)) {
            if (numericValue === 0) {
              return {
                ...item,
                customQuantity: text,
                error: `최소 수량은 ${item.출고단위}${item.단위}입니다.`,
              };
            }
            if (numericValue % item.출고단위 === 0) {
              return {
                ...item,
                quantity: numericValue,
                customQuantity: text,
                error: null,
              };
            } else {
              return {
                ...item,
                customQuantity: text,
                error: `출고 단위는 ${item.출고단위}의 배수여야 합니다.`,
              };
            }
          } else {
            return {
              ...item,
              customQuantity: text,
              error: `유효한 숫자를 입력하세요.`,
            };
          }
        }
        return item;
      })
    );
  };

  // 품목 제거
  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.품목_id !== productId));
  };

  // 발주 확인 (상품 선택 유무 / 각종 유효성 체크)
  const handleConfirmOrder = () => {
    // 선택된 상품이 없으면 모달 메시지 표시 + 함수 종료
    if (selectedItems.length === 0) {
      setErrorMessages(['상품을 선택해 주세요.']);
      setModalVisible(true);
      return;
    }
    const errors: string[] = [];
    selectedItems.forEach((item) => {
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

  // 발주 요청
  const handleOrderSubmit = async () => {
    if (!storeId) {
      console.error('매장 ID가 존재하지 않습니다.');
      return;
    }
    try {
      const failures: string[] = [];

      for (const item of selectedItems) {
        const payload = {
          매장_id: storeId,
          품목_id: item.품목_id,
          매장_발주량: item.quantity,
        };

        const response = await fetch(`${RN_API_URL}/api/orders/store_order_create/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          failures.push(`${item.품목명} 발주 전송 실패`);
        }
      }

      if (failures.length > 0) {
        setOrderFailureMessages(failures);
        setOrderFailureModalVisible(true);
      } else {
        const newOrder: LocalOrder = {
          id: Date.now(),
          date: new Date().toLocaleString(),
          items: selectedItems.map((item) => ({
            품목_id: item.품목_id,
            품목명: item.품목명,
            quantity: item.quantity,
            단위: item.단위,
            출고단위: item.출고단위,
          })),
        };
        onNewOrder(newOrder);
        setOrderCompleteModalVisible(true);
      }
    } catch (error) {
      console.error('발주 요청 중 오류 발생:', error);
      setOrderFailureMessages(['발주 요청 중 예기치 못한 오류가 발생했습니다.']);
      setOrderFailureModalVisible(true);
    }
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

  /** 
   * ① 개별 상품 총 가격: computedPrice = quantity * 입고단가
   * ② 전체 상품 총 가격: totalPrice = Σ(computedPrice)
   *
   * parseFloat 결과가 유효하지 않으면 0으로 처리
   */
  const totalPrice = selectedItems.reduce((sum, item) => {
    const price = parseFloat(item.입고단가);
    return sum + item.quantity * (isNaN(price) ? 0 : price);
  }, 0);

  // 상품 카드 렌더링
  const renderProductCard = (product: APIProduct) => {
    const selected = selectedItems.find((item) => item.품목_id === product.품목_id);

    if (selected) {
      // 현재 선택된 상품의 총 가격
      const computedPrice = selected.quantity * parseFloat(selected.입고단가);
      return (
        <View key={product.품목_id} style={orderStyles.selectedItemCard}>
          <View style={orderStyles.selectedItemInfo}>
            <Text style={orderStyles.selectedItemName}>{product.품목명}</Text>
            <Text style={orderStyles.unitText}>
              출고단위: {formatPrice(product.출고단위)}{product.단위}
            </Text>
            <Text style={orderStyles.unitText}>
              가격: {formatPrice(parseFloat(product.입고단가) * product.출고단위)}원
            </Text>
            {selected.error && <Text style={orderStyles.errorText}>{selected.error}</Text>}
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
          <View style={{ marginTop: 6 }}>
            {/* 개별 상품 총 가격 */}
            <Text style={orderStyles.priceText}>
              총 가격: {formatPrice(computedPrice)}원
            </Text>
          </View>
        </View>
      );
    } else {
      // 선택되지 않은 상품
      return (
        <View key={product.품목_id} style={orderStyles.selectedItemCard}>
          <View style={orderStyles.selectedItemInfo}>
            <Text style={orderStyles.selectedItemName}>{product.품목명}</Text>
            <Text style={orderStyles.unitText}>
              출고단위: {formatPrice(product.출고단위)}{product.단위}
            </Text>
            <Text style={orderStyles.unitText}>
              가격: {formatPrice(parseFloat(product.입고단가) * product.출고단위)}원
            </Text>
          </View>
          <TouchableOpacity style={orderStyles.orderButton} onPress={() => addItem(product)}>
            <Text style={orderStyles.orderButtonText}>추가</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 상품 선택 화면 */}
      {!isConfirmation ? (
        <>
          <ScrollView style={[orderStyles.container, { paddingBottom: 80 }]}>
            <View style={orderStyles.categorySection}>
              <Text style={orderStyles.sectionTitle}>품목 유형 선택</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={orderStyles.categoryList}
              >
                <TouchableOpacity
                  style={[
                    orderStyles.categoryButton,
                    selectedCategory === null && orderStyles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text
                    style={[
                      orderStyles.categoryButtonText,
                      selectedCategory === null && orderStyles.categoryButtonTextActive,
                    ]}
                  >
                    전체
                  </Text>
                </TouchableOpacity>
                {uniqueCategories.map((cat, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      orderStyles.categoryButton,
                      selectedCategory === cat && orderStyles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[
                        orderStyles.categoryButtonText,
                        selectedCategory === cat && orderStyles.categoryButtonTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={orderStyles.productsSection}>
              <Text style={orderStyles.sectionTitle}>상품 선택하기</Text>
              <View style={orderStyles.productGrid}>
                {sortedProducts.map((product) => renderProductCard(product))}
              </View>
            </View>
          </ScrollView>

          {/* 하단 영역: 총 가격 / 발주확인 버튼 */}
          <View style={orderStyles.footerContainer}>
            {/* 총 가격 */}
            <Text style={orderStyles.footerPriceText}>
              {selectedItems.length > 0
                ? `총 ${formatPrice(totalPrice)}원`
                : '총 0원'}
            </Text>

            {/* 발주확인 버튼 (상품 없으면 비활성화) */}
            <TouchableOpacity
              style={[
                orderStyles.footerButton,
                selectedItems.length === 0 && orderStyles.footerButtonDisabled,
              ]}
              onPress={handleConfirmOrder}
              disabled={selectedItems.length === 0}
            >
              <Text style={orderStyles.footerButtonText}>발주확인</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* 발주 확인 화면 */
        <>
          <ScrollView style={orderStyles.container}>
            <View style={orderStyles.selectedItemsSection}>
              <Text style={orderStyles.sectionTitle}>선택한 상품 확인</Text>
              {selectedItems.map((item) => {
                const itemTotal = item.quantity * parseFloat(item.입고단가);
                return (
                  <View key={item.품목_id} style={orderStyles.confirmationItemRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={orderStyles.selectedItemName}>{item.품목명}</Text>
                      <Text style={orderStyles.unitText}>
                        수량: {item.quantity}
                        {item.단위} (출고단위: {item.출고단위})
                      </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={orderStyles.priceText}>{formatPrice(itemTotal)}원</Text>
                    </View>
                  </View>
                );
              })}
              {/* 전체 합계 */}
              <View style={orderStyles.totalRow}>
                <Text style={orderStyles.totalText}>총합계:</Text>
                <Text style={orderStyles.totalText}>{formatPrice(totalPrice)}원</Text>
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
        </>
      )}

      {/* 발주 오류 모달 */}
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
              <Text key={index} style={modalStyles.modalText}>
                {msg}
              </Text>
            ))}
            <TouchableOpacity style={modalStyles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={modalStyles.textStyle}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 발주 완료 모달 */}
      <Modal
        visible={orderCompleteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOrderCompleteModalVisible(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>발주 완료</Text>
            <Text style={modalStyles.modalText}>모든 발주 요청이 성공적으로 전송되었습니다.</Text>
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => {
                setOrderCompleteModalVisible(false);
                onOrderComplete();
              }}
            >
              <Text style={modalStyles.textStyle}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 발주 실패 모달 */}
      <Modal
        visible={orderFailureModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOrderFailureModalVisible(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>발주 실패</Text>
            {orderFailureMessages.map((msg, index) => (
              <Text key={index} style={modalStyles.modalText}>
                {msg}
              </Text>
            ))}
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => setOrderFailureModalVisible(false)}
            >
              <Text style={modalStyles.textStyle}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/** 부모 컴포넌트 (대시보드) */
const StoreEmployeeDashboard: React.FC<StoreEmployeeDashboardProps> = ({ storeName }) => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [storeId, setStoreId] = useState<string>('');
  const [isOrderWaiting, setIsOrderWaiting] = useState<boolean>(false);
  const [localOrders, setLocalOrders] = useState<LocalOrder[]>([]);
  const [storeOrders, setStoreOrders] = useState<StoreOrderData[]>([]);
  const [items, setItems] = useState<ItemData[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);

  // 주문 상세보기 모달
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [detailGroupOrders, setDetailGroupOrders] = useState<StoreOrderData[]>([]);
  const [detailGroupDate, setDetailGroupDate] = useState<string>('');

  /** 발주 내역을 5페이지씩 불러오기 */
  const fetchOrders = async (startPage: number) => {
    if (!storeId) return;
    setOrdersLoading(true);
    try {
      let allOrders: StoreOrderData[] = [];
      for (let page = startPage; page < startPage + 5; page++) {
        const response = await fetch(
          `${RN_API_URL}/api/orders/store_order_list?store_id=${storeId}&page=${page}`
        );
        if (!response.ok) {
          console.error('발주 내역 조회 실패, page:', page);
          continue;
        }
        const result = await response.json();
        const orders: StoreOrderData[] = result.orders;

        // items와 조인
        const combined = orders.map((order) => {
          const foundItem = items.find((it) => it.품목_id === order.품목_id);
          return {
            ...order,
            품목명: foundItem?.품목명 ?? '알 수 없는 품목',
            협력사명: foundItem?.협력사명 ?? '',
            출고단위: foundItem?.출고단위,
          };
        });
        allOrders = [...allOrders, ...combined];
      }
      setStoreOrders((prev) => [...prev, ...allOrders]);
      if (allOrders.length === 0) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('발주 내역 조회 중 오류:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // 매장 정보 불러오기
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const response = await fetch(`${RN_API_URL}/api/accounts/stores/`);
        const storesData = await response.json();
        const matchedStore = storesData.find((store: any) => store.매장명 === storeName);
        if (matchedStore) {
          setStoreId(matchedStore.매장_id);
        } else {
          console.error('매장명을 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('매장 정보 조회 중 오류:', error);
      }
    };
    fetchStoreInfo();
  }, [storeName]);

  // 품목 불러오기 (조인을 위해)
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`${RN_API_URL}/api/suppliers/items/`);
        const data: ItemData[] = await res.json();
        setItems(data);
      } catch (error) {
        console.error('품목 정보 불러오기 실패:', error);
      }
    };
    fetchItems();
  }, []);

  // order-status로 전환 시 1~5페이지 로드 후 currentPage=6
  useEffect(() => {
    if (activeView === 'order-status' && storeId) {
      setStoreOrders([]);
      setHasMore(true);
      setOrdersLoading(true);
      (async () => {
        await fetchOrders(1);
        setCurrentPage(6);
        setOrdersLoading(false);
      })();
    }
  }, [activeView, storeId]);

  const handleOrderComplete = () => {
    setIsOrderWaiting(true);
    setActiveView('order-status');
  };

  const handleNewOrder = (orderData: LocalOrder) => {
    setLocalOrders((prev) => [orderData, ...prev]);
  };

  // 주문 상세보기 모달 열기
  const openDetailModal = (dateKey: string, orders: StoreOrderData[]) => {
    setDetailGroupDate(dateKey);
    setDetailGroupOrders(orders);
    setDetailModalVisible(true);
  };

  // 주문 내역을 연도, 월, 주차별로 그룹화
  const groupedByYearMonthWeek = storeOrders.reduce((acc: any, order) => {
    const [year, month, week] = order.기간.split('.');
    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = {};
    if (!acc[year][month][week]) acc[year][month][week] = [];
    acc[year][month][week].push(order);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedByYearMonthWeek).sort((a, b) => parseInt(b) - parseInt(a));

  // 화면 표시
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
        return (
          <StoreOrderRequest
            storeName={storeName}
            storeId={storeId}
            onOrderComplete={handleOrderComplete}
            onNewOrder={handleNewOrder}
          />
        );

      case 'order-status': {
        if (storeOrders.length === 0 && ordersLoading) {
          return (
            <View style={orderStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={orderStyles.loadingText}>로딩 중...</Text>
            </View>
          );
        }

        return (
          <View style={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Receipt color="#3b82f6" size={24} style={{ marginRight: 8 }} />
              <Text style={styles.title}>발주 내역</Text>
            </View>

            {sortedYears.length === 0 ? (
              <Text>아직 발주 내역이 없습니다.</Text>
            ) : (
              <ScrollView style={{ width: '100%' }}>
                {sortedYears.map((year) => {
                  const months = Object.keys(groupedByYearMonthWeek[year]).sort(
                    (a, b) => parseInt(b) - parseInt(a)
                  );
                  return (
                    <View
                      key={year}
                      style={{
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: '#aaa',
                        borderRadius: 8,
                        padding: 10,
                      }}
                    >
                      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                        {year}년 주문내역
                      </Text>
                      {months.map((month) => {
                        const weeksObj = groupedByYearMonthWeek[year][month];
                        const weeks = Object.keys(weeksObj).sort((a, b) => parseInt(b) - parseInt(a));
                        return (
                          <View key={month} style={{ marginBottom: 10, paddingLeft: 10 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 5 }}>
                              {month}월
                            </Text>
                            {weeks.map((week) => {
                              const orders = weeksObj[week];
                              const firstOrder = orders[0];
                              const extraCount = orders.length - 1;
                              return (
                                <View
                                  key={week}
                                  style={{
                                    marginBottom: 10,
                                    borderWidth: 1,
                                    borderColor: '#ddd',
                                    borderRadius: 8,
                                    padding: 10,
                                  }}
                                >
                                  <Text style={orderStatusStyles.dateHeader}>
                                    {week}주차 주문 내역
                                  </Text>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={orderStatusStyles.productName}>
                                        {firstOrder.품목명}
                                      </Text>
                                      {extraCount > 0 && (
                                        <Text style={orderStatusStyles.extraCountText}>
                                          외 {extraCount}개
                                        </Text>
                                      )}
                                      <Text style={[orderStatusStyles.quantity, { marginTop: 'auto' }]}>
                                        발주수량: {formatPrice(firstOrder.매장_발주량)}
                                      </Text>
                                    </View>
                                    <TouchableOpacity
                                      style={[orderStatusStyles.actionButton, { alignSelf: 'flex-end', marginLeft: 12 }]}
                                      onPress={() => openDetailModal(`${year}.${month}.${week}`, orders)}
                                    >
                                      <Text style={orderStatusStyles.actionButtonText}>주문 상세보기</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        );
                      })}
                    </View>
                  );
                })}

                {hasMore && (
                  <TouchableOpacity
                    style={[styles.loadMoreButton, ordersLoading && styles.loadMoreButtonLoading]}
                    onPress={async () => {
                      await fetchOrders(currentPage);
                      setCurrentPage((prev) => prev + 5);
                    }}
                    disabled={ordersLoading}
                  >
                    {ordersLoading ? (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                      <Text style={styles.loadMoreButtonText}>더 불러오기</Text>
                    )}
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        );
      }

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
      {/* 메인 콘텐츠 영역 */}
      <View style={styles.mainContent}>{renderView()}</View>

      {/* 하단 탭 영역 */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navButton} onPress={() => setActiveView('dashboard')}>
          <Home color={activeView === 'dashboard' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'dashboard' ? styles.activeNavText : styles.navText}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => setActiveView('order-request')}>
          <ShoppingCart color={activeView === 'order-request' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'order-request' ? styles.activeNavText : styles.navText}>
            발주 요청
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => setActiveView('order-status')}>
          <Receipt color={activeView === 'order-status' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'order-status' ? styles.activeNavText : styles.navText}>
            발주 내역
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => setActiveView('inventory')}>
          <Clipboard color={activeView === 'inventory' ? '#3b82f6' : 'black'} />
          <Text style={activeView === 'inventory' ? styles.activeNavText : styles.navText}>
            재고 관리
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StoreEmployeeDashboard;

/** 스타일들 */
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  loadMoreButton: {
    alignSelf: 'center',
    marginVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  loadMoreButtonLoading: {
    backgroundColor: 'transparent',
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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

  // 하단 영역 (총 가격 / 발주확인)
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  footerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  confirmationItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: '#aaa',
    marginTop: 10,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'White',
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

/** ★★★ extraCountText 스타일 추가 */
const orderStatusStyles = StyleSheet.create({
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    paddingLeft: 4,
  },
  extraCountText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusText: {
    color: 'green',
    fontWeight: '600',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  supplierName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
