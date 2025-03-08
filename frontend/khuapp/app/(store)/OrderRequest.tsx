import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Minus, X, Search } from 'lucide-react-native';
import {
  StoreOrderRequestProps,
  APIProduct,
  SelectedItem,
} from '../../src/components/ui/common/types';
import { styles, modalStyles } from '../../src/components/ui/common/commonstyler';
import * as f from '../../src/components/ui/common/function';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { OrderRequeststyle } from '../../src/styles/Orderrequest_styles';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { RN_API_URL } from '@env';
import { RFValue } from 'react-native-responsive-fontsize';

const OrderRequest: React.FC<StoreOrderRequestProps> = ({
  storeName,
  storeId,
  onOrderComplete,
  onNewOrder,
}) => {
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
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  // 협력사 데이터 및 재고 데이터 상태
  const [suppliersLoaded, setSuppliersLoaded] = useState<boolean>(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryLoaded, setInventoryLoaded] = useState<boolean>(false);

  // 주문 가능 여부 (테이블 상태: 매장_발주)
  const [orderEnabled, setOrderEnabled] = useState<boolean>(false);

  // 제품 카테고리 정렬
  const sortedCategories = useMemo(() => {
    let categories = f.getUniqueCategories(apiItems);
    categories = categories.filter(category => category !== '전체');
    categories.sort((a, b) => a.localeCompare(b, 'ko'));
    return categories;
  }, [apiItems]);

  // 즐겨찾기 상태 (매장별)
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchText, setSearchText] = useState('');

  const getFavoritesKey = (storeId: string) => `favorites_${storeId}`;

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        if (!storeId) return;
        const jsonValue = await AsyncStorage.getItem(getFavoritesKey(storeId));
        const favs = jsonValue ? JSON.parse(jsonValue) : [];
        setFavorites(favs);
      } catch (e) {
        console.error('즐겨찾기 불러오기 실패:', e);
      }
    };
    loadFavorites();
  }, [storeId]);

  const toggleFavorite = async (productId: string) => {
    let newFavorites: string[];
    if (favorites.includes(productId)) {
      newFavorites = favorites.filter((id) => id !== productId);
    } else {
      newFavorites = [...favorites, productId];
    }
    try {
      if (!storeId) return;
      await AsyncStorage.setItem(getFavoritesKey(storeId), JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (e) {
      console.error('즐겨찾기 업데이트 실패:', e);
    }
  };

  useEffect(() => {
    f.fetchApiItems()
      .then((data) => {
        setApiItems(data);
        setLoading(false);
      })
      .catch(() => {
        setFetchError('품목을 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    f.fetchSuppliers()
      .then((data) => {
        setSuppliers(data);
        setSuppliersLoaded(true);
      })
      .catch((err) => {
        console.error('협력사 데이터 불러오기 오류:', err);
        setSuppliersLoaded(true);
      });
  }, []);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        if (!storeId) return;
        const response = await fetch(`${RN_API_URL}/api/inventory/store/?매장_id=${storeId}`);
        if (!response.ok) throw new Error('재고 데이터를 불러오는 중 오류 발생');
        const data = await response.json();
        setInventory(data);
        setInventoryLoaded(true);
      } catch (error) {
        console.error('재고 데이터 불러오기 오류:', error);
        setInventoryLoaded(true);
      }
    };
    fetchInventory();
  }, [storeId]);

  useEffect(() => {
    const fetchTableStatus = async () => {
      try {
        const response = await fetch(`${RN_API_URL}/api/management/table_status_list/`);
        if (!response.ok) throw new Error('테이블 상태 목록 불러오기 오류');
        const data = await response.json();
        const storeOrderStatus = data.find((item: any) => item.테이블 === '매장_발주');
        setOrderEnabled(storeOrderStatus && storeOrderStatus.상태 === 1);
      } catch (error) {
        console.error('테이블 상태 목록 불러오기 오류:', error);
        setOrderEnabled(false);
      }
    };
    fetchTableStatus();
  }, []);

  const uniqueCategories = f.getUniqueCategories(apiItems);
  const filteredProducts = f.getFilteredProducts(apiItems, selectedCategory);

  const sortedProducts = useMemo(() => {
    let products = f.getFilteredProducts(apiItems, selectedCategory);
    if (isSearchActive && searchText.trim().length > 0) {
      products = products.filter(product =>
        product.품목명.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    products.sort((a, b) => {
      const aIsFavorite = favorites.includes(a.품목_id);
      const bIsFavorite = favorites.includes(b.품목_id);
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      return f.sortProductsBySupplierAndName([a, b], suppliers)[0] === a ? -1 : 1;
    });
    return products;
  }, [apiItems, selectedCategory, favorites, suppliers, isSearchActive, searchText]);

  let displayProducts = sortedProducts;
  if (isSearchActive && searchText.trim().length > 0) {
    displayProducts = sortedProducts.filter((product) =>
      product.품목명.toLowerCase().includes(searchText.toLowerCase())
    );
  }
  
  const totalPrice = f.calculateTotalPrice(selectedItems);

  const addItem = (product: APIProduct) => {
    const updatedItems = f.addItemToSelectedItems(selectedItems, product);
    setSelectedItems(updatedItems);
  };

  const updateQuantity = (productId: string, increment: number) => {
    const updatedItems = f.updateQuantity(selectedItems, productId, increment);
    setSelectedItems(updatedItems);
  };

  const updateCustomQuantity = (productId: string, text: string) => {
    const updatedItems = f.updateCustomQuantityUtil(selectedItems, productId, text);
    setSelectedItems(updatedItems);
  };

  const removeItem = (productId: string) => {
    const updatedItems = f.removeItemUtil(selectedItems, productId);
    setSelectedItems(updatedItems);
  };

  const handleConfirmOrder = () => {
    const errors = f.handleConfirmOrderUtil(selectedItems);
    if (errors.length > 0) {
      setErrorMessages(errors);
      setModalVisible(true);
      return;
    }
    setIsConfirmation(true);
  };

  // 수정된 주문 요청 제출 함수 (추가 방식 적용)
  const handleOrderSubmit = async () => {
    if (orderSubmitted) return;
    setOrderSubmitted(true);
    if (!storeId) {
      console.error('매장 ID가 존재하지 않습니다.');
      setOrderSubmitted(false);
      return;
    }
    if (!orderEnabled) {
      setOrderFailureMessages(["발주 요청이 현재 비활성화되어 있습니다."]);
      setOrderFailureModalVisible(true);
      setOrderSubmitted(false);
      return;
    }
    try {
      const ordersResponse = await fetch(`${RN_API_URL}/api/orders/store_order_list/?store_id=${storeId}`);
      if (!ordersResponse.ok) throw new Error("주문 목록 불러오기 실패");
      const ordersData = await ordersResponse.json();

      // 각 주문별로 개별 POST 요청 실행 (추가 방식)
      const updatePromises = ordersData.orders.map(async (order: any) => {
        const selectedItem = selectedItems.find(item => item.품목_id === order.품목_id);
        if (selectedItem) {
          const payload = {
            ...order, // 기존 주문 데이터 유지 (매장_id, 품목_id, 기간, 회차 등)
            old_기간: order.기간, // 기존 기간 추가
            old_회차: order.회차, // 기존 회차 추가
            매장_발주량: selectedItem.quantity, // 선택한 수량을 추가
          };
          const updateResponse = await fetch(`${RN_API_URL}/api/orders/store_order_update/?app=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.error || "재고량 업데이트 실패");
          }
          return await updateResponse.json();
        }
        return null;
      });

      // 모든 요청 완료 후, null이 아닌 결과만 필터링하여 첫 번째 주문 업데이트 결과를 onNewOrder에 전달합니다.
      const updatedOrders = (await Promise.all(updatePromises)).filter(res => res !== null);
      onNewOrder(updatedOrders[0]);
      setOrderCompleteModalVisible(true);
    } catch (error: any) {
      console.error("발주 요청 실패:", error);
      setOrderFailureMessages([error.message]);
      setOrderFailureModalVisible(true);
    }
    setOrderSubmitted(false);
  };

  const renderInventoryText = (product: APIProduct) => {
    if (!inventoryLoaded) return null;
    const inv = inventory.find(item => item.품목_id === product.품목_id);
    if (inv) {
      const stock = inv.매장_재고량;
      let formattedStock = stock % 1 === 0 ? stock : (() => {
        const fractionalPart = stock.toString().split('.')[1];
        return fractionalPart && fractionalPart.charAt(0) === '0' ? Math.floor(stock) : stock.toFixed(1);
      })();
      return (
        <Text testID="현재고" style={{ color: '#3A9D23', fontSize: RFValue(12) }}>
          현재고:{formattedStock}개
        </Text>
      );
    }
    return (
      <Text testID="현재고" style={{ color: '#3A9D23', fontSize: RFValue(12) }}>
        현재고:0개
      </Text>
    );
  };

  const renderProductCard = (product: APIProduct) => {
    const selected = selectedItems.find(item => item.품목_id === product.품목_id);
    const cardStyle = selected
      ? [OrderRequeststyle.selectItemCard, OrderRequeststyle.selectedItemCard]
      : OrderRequeststyle.selectItemCard;
    const isFavorite = favorites.includes(product.품목_id);
    const favoriteButton = (
      <TouchableOpacity
        testID="favoriteButton"
        onPress={() => toggleFavorite(product.품목_id)}
        style={OrderRequeststyle.favoriteButton}
      >
        <Text testID="favoriteButtonText" style={OrderRequeststyle.favoriteButtonText}>
          {isFavorite ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    );
    if (selected) {
      const computedPrice = selected.quantity * parseFloat(selected.입고단가);
      return (
        <View testID="selectItemCard" key={product.품목_id} style={cardStyle}>
          <View testID="cardContent" style={[OrderRequeststyle.cardContent]}>
            <View testID="productInfoContainer" style={[OrderRequeststyle.productInfoContainer, { height: 'auto' }]}>
              <View testID="selectedItemRowContainer" style={OrderRequeststyle.selectedItemRowContainer}>
                <View testID="nameWithFavoriteContainer" style={OrderRequeststyle.nameWithFavoriteContainer}>
                  {favoriteButton}
                  <Text testID="selectItemName" style={OrderRequeststyle.selectItemName}>
                    {product.품목명}{'\n'}
                    {renderInventoryText(product)}
                  </Text>
                </View>
                <Text testID="price_unit_Text" style={OrderRequeststyle.price_unit_Text}>
                  {f.formatPrice(parseFloat(product.입고단가) * product.출고단위)}원
                </Text>
                <TouchableOpacity
                  testID="cancelButton"
                  style={[OrderRequeststyle.orderButton, OrderRequeststyle.cancelButton]}
                  onPress={() => removeItem(product.품목_id)}
                >
                  <Text testID="cancelButtonText" style={OrderRequeststyle.cancelButtonText}>
                    취소
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View testID="additionalRowContainer" style={OrderRequeststyle.additionalRowContainer}>
              <View
                testID="Row2"
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  width: '100%',
                  marginTop: moderateScale(8),
                  marginLeft: moderateScale(20)
                }}
              >
                <View testID="row1" style={{ flexDirection: 'column', position: 'relative', bottom: moderateScale(10), left: wp(1) }}>
                  <Text testID="unitText" style={OrderRequeststyle.unitText}>
                    출고단위:{f.formatPrice(product.출고단위)}{product.단위}
                  </Text>
                  <Text testID="priceText" style={OrderRequeststyle.priceText}>
                    상품총액:{f.formatPrice(computedPrice)}원
                  </Text>
                </View>
                <View
                  testID="quantityControlContainer"
                  style={[OrderRequeststyle.quantityControlContainer, { marginLeft: 0, position: 'relative', bottom: moderateScale(5) }]}
                >
                  <TouchableOpacity
                    testID="decrementButton"
                    style={[
                      OrderRequeststyle.quantityButton,
                      selected.quantity <= product.출고단위 && OrderRequeststyle.disabledButton,
                    ]}
                    onPress={() => updateQuantity(product.품목_id, -product.출고단위)}
                    disabled={selected.quantity <= product.출고단위}
                  >
                    <Minus testID="minusIcon" color="#333" size={20} />
                  </TouchableOpacity>
                  <TextInput
                    testID="quantityInput"
                    style={OrderRequeststyle.quantityText}
                    value={selected.customQuantity}
                    keyboardType="numeric"
                    onChangeText={(text) => updateCustomQuantity(product.품목_id, text)}
                  />
                  <TouchableOpacity
                    testID="incrementButton"
                    style={OrderRequeststyle.quantityButton}
                    onPress={() => updateQuantity(product.품목_id, product.출고단위)}
                  >
                    <Plus testID="plusIcon" color="#333" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          {selected.error && (
            <View testID="errorContainer" style={OrderRequeststyle.errorContainer}>
              <Text testID="errorText" style={OrderRequeststyle.errorText} numberOfLines={1}>
                {selected.error}
              </Text>
            </View>
          )}
        </View>
      );
    } else {
      return (
        <TouchableOpacity
          testID="productCard"
          key={product.품목_id}
          style={cardStyle}
          onPress={() => addItem(product)}
        >
          <View testID="productCardContent" style={OrderRequeststyle.productCardContent}>
            <View testID="productCardRow" style={OrderRequeststyle.productCardRow}>
              <View testID="nameWithFavoriteContainer" style={OrderRequeststyle.nameWithFavoriteContainer}>
                {favoriteButton}
                <Text testID="productName" style={OrderRequeststyle.productName}>
                  {product.품목명}{'\n'}
                  {renderInventoryText(product)}
                </Text>
              </View>
              <Text testID="productPrice" style={OrderRequeststyle.productPrice}>
                {f.formatPrice(parseFloat(product.입고단가) * product.출고단위)}원
              </Text>
              <TouchableOpacity
                testID="addButton"
                style={OrderRequeststyle.orderButton}
                onPress={() => addItem(product)}
              >
                <Text testID="orderButtonText" style={OrderRequeststyle.orderButtonText}>
                  선택
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  if (loading || !inventoryLoaded || !suppliersLoaded) {
    return (
      <View testID="loading_Container" style={styles.loading_Container}>
        <ActivityIndicator testID="activityIndicator" size="large" color="#0D326F80" />
        <Text testID="loading_Text" style={styles.loading_Text}>
          로딩 중...
        </Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View testID="container" style={OrderRequeststyle.container}>
        <Text testID="fetchErrorText">{fetchError}</Text>
      </View>
    );
  }

  return (
    <View testID="전체" style={{ flex: 1 }}>
      {!isConfirmation ? (
        <>
          <ScrollView
            testID="scrollContainer"
            contentContainerStyle={OrderRequeststyle.scrollContainer}
            stickyHeaderIndices={[0]}
          >
            <View testID="fixedHeaderContainer" style={OrderRequeststyle.fixedHeaderContainer}>
              <View testID="categorySection" style={OrderRequeststyle.categorySection}>
                <Text testID="sectionTitle" style={OrderRequeststyle.sectionTitle}>
                  상품 유형 선택
                </Text>
                <ScrollView
                  testID="categoryList"
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={OrderRequeststyle.categoryList}
                  contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                  }}
                >
                  <TouchableOpacity
                    testID="categoryButton"
                    style={[
                      OrderRequeststyle.categoryButton,
                      selectedCategory === null && OrderRequeststyle.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(null)}
                  >
                    <Text
                      testID="categoryButtonText"
                      style={[
                        OrderRequeststyle.categoryButtonText,
                        selectedCategory === null && OrderRequeststyle.categoryButtonTextActive,
                      ]}
                    >
                      전체
                    </Text>
                  </TouchableOpacity>
                  {sortedCategories.map((cat, idx) => (
                    <TouchableOpacity
                      key={idx}
                      testID="categoryButton"
                      style={[
                        OrderRequeststyle.categoryButton,
                        selectedCategory === cat && OrderRequeststyle.categoryButtonActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text
                        testID="categoryButtonText"
                        style={[
                          OrderRequeststyle.categoryButtonText,
                          selectedCategory === cat && OrderRequeststyle.categoryButtonTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View testID="sectionContainer" style={OrderRequeststyle.sectionContainer}>
                <View testID="sectionTitleRow" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text testID="sectionTitle_2" style={OrderRequeststyle.sectionTitle_2}>
                    상품 선택하기
                  </Text>
                  <TouchableOpacity 
                    testID="searchIconButton"
                    style={OrderRequeststyle.searchIconContainer}
                    onPress={() => setIsSearchActive(!isSearchActive)}
                  >
                    <Search 
                      testID="searchIcon" 
                      color="#0D326F" 
                      style={OrderRequeststyle.searchIconSize}
                    />
                  </TouchableOpacity>
                </View>
                {isSearchActive && (
                  <View testID="searchContainer" style={OrderRequeststyle.searchContainer}>
                    <Search 
                      testID="searchIconInInput" 
                      color="#64748b" 
                      style={OrderRequeststyle.searchIconSize}
                    />
                    <TextInput
                      testID="searchInput"
                      style={OrderRequeststyle.searchInput}
                      placeholder="상품명을 입력하세요"
                      value={searchText}
                      onChangeText={(text) => setSearchText(text)}
                      placeholderTextColor="#94a3b8"
                      autoFocus={true}
                    />
                    {searchText.length > 0 && (
                      <TouchableOpacity 
                        testID="clearSearchButton"
                        style={OrderRequeststyle.searchIcon}
                        onPress={() => setSearchText('')}
                      >
                        <X 
                          testID="clearIcon" 
                          color="#64748b" 
                          style={OrderRequeststyle.searchIconSize}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <View testID="headerContainer" style={OrderRequeststyle.headerContainer}>
                  <Text testID="item_headerText" style={OrderRequeststyle.item_headerText}>
                    상품명
                  </Text>
                  <Text testID="price_headerText" style={OrderRequeststyle.price_headerText}>
                    가격
                  </Text>
                  <Text testID="whitespace" style={{ width: '10%' }}></Text>
                </View>
              </View>
            </View>
            <View testID="listContainer" style={OrderRequeststyle.listContainer}>
              {displayProducts.map((product) => renderProductCard(product))}
            </View>
          </ScrollView>
          <View testID="footerContainer" style={OrderRequeststyle.footerContainer}>
            <Text testID="footerPriceText" style={OrderRequeststyle.footerPriceText}>
              {selectedItems.length > 0
                ? `총 발주금액:  ${f.formatPrice(totalPrice)}원`
                : '총 발주금액 0원'}
            </Text>
            <TouchableOpacity
              testID="footerButton"
              style={[
                OrderRequeststyle.footerButton,
                selectedItems.length === 0 && OrderRequeststyle.footerButtonDisabled,
              ]}
              onPress={handleConfirmOrder}
              disabled={selectedItems.length === 0}
            >
              <Text testID="footerButtonText" style={OrderRequeststyle.footerButtonText}>
                발주확인
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <ScrollView testID="confirmationContainer" style={{ flex: 1, backgroundColor: '#fff' }}>
          <View testID="confirm_selectedItemsSection" style={OrderRequeststyle.confirm_selectedItemsSection}>
            <Text
              testID="confirm_sectionTitle"
              style={[OrderRequeststyle.confirm_sectionTitle, { textAlign: 'center' }]}
            >
              최종 발주 확인
            </Text>
            {sortedProducts
              .filter(product => selectedItems.some(item => item.품목_id === product.품목_id))
              .map(product => {
                const item = selectedItems.find(item => item.품목_id === product.품목_id);
                if (!item) return null;
                const itemTotal = item.quantity * parseFloat(item.입고단가);
                return (
                  <View
                    testID="confirmationItemRow"
                    key={item.품목_id}
                    style={[OrderRequeststyle.confirmationItemRow, { flexDirection: 'row', alignItems: 'center', paddingVertical: moderateScale(5) }]}
                  >
                    <Text
                      testID="confirm_selectItemName"
                      style={[OrderRequeststyle.confirm_selectItemName, { flex: 2 }]}
                    >
                      {item.품목명}
                    </Text>
                    <Text
                      testID="confirm_unitText"
                      style={[OrderRequeststyle.confirm_unitText, { flex: 1 , textAlign: 'center' }]}
                    >
                      {item.quantity}개
                    </Text>
                    <Text
                      testID="confirm_priceText"
                      style={[OrderRequeststyle.confirm_priceText, { flex: 1, textAlign: 'right' }]}
                    >
                      {f.formatPrice(itemTotal)}원
                    </Text>
                  </View>
                );
              })
            }
            <View testID="totalRow" style={OrderRequeststyle.totalRow}>
              <Text testID="totalText" style={OrderRequeststyle.totalText}>
                총 발주금액:
              </Text>
              <Text testID="totalText_2" style={OrderRequeststyle.totalText}>
                {f.formatPrice(totalPrice)}원
              </Text>
            </View>
            <TouchableOpacity
              testID="order_request_Button"
              style={[OrderRequeststyle.order_request_Button, orderSubmitted && { opacity: 0.5 }]}
              onPress={handleOrderSubmit}
              disabled={orderSubmitted}
            >
              <Text testID="order_request_ButtonText" style={OrderRequeststyle.order_request_ButtonText}>
                발주요청하기
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="order_request_Button"
              style={[
                OrderRequeststyle.order_request_Button,
                { backgroundColor: 'white' },
                { borderColor: '#0D326F' },
                { borderWidth: 1 },
                { marginTop: moderateScale(5) },
              ]}
              onPress={() => setIsConfirmation(false)}
            >
              <Text testID="order_request_ButtonText" style={[OrderRequeststyle.order_request_ButtonText, { color: '#0D326F' }]}>
                뒤로가기
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      <Modal
        testID="modal"
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View testID="modalCenteredView" style={modalStyles.centeredView}>
          <View testID="modalView" style={modalStyles.modalView}>
            <Text testID="modalTitle" style={modalStyles.modalTitle}>
              발주 오류
            </Text>
            {errorMessages.map((msg, idx) => (
              <Text key={idx} testID={`modalText_${idx}`} style={modalStyles.modalText}>
                {msg}
              </Text>
            ))}
            <TouchableOpacity
              testID="closeButton"
              style={modalStyles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text testID="textStyle" style={modalStyles.textStyle}>
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        testID="orderCompleteModal"
        visible={orderCompleteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOrderCompleteModalVisible(false)}
      >
        <View testID="modalCenteredView_2" style={modalStyles.centeredView}>
          <View testID="modalView_2" style={modalStyles.modalView}>
            <Text testID="modalTitle_2" style={modalStyles.modalTitle}>
              발주 완료
            </Text>
            <Text testID="modalText_Complete" style={[modalStyles.modalText, { marginBottom: moderateScale(-3) }]}>
              모든 발주 요청이 {'\n'}성공적으로 전송되었습니다.
            </Text>
            <TouchableOpacity
              testID="closeButton_Complete"
              style={[modalStyles.closeButton,{marginTop: moderateScale(10)}]}
              onPress={() => {
                setOrderCompleteModalVisible(false);
                onOrderComplete();
              }}
            >
              <Text testID="textStyle_Complete" style={modalStyles.textStyle}>
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        testID="orderFailureModal"
        visible={orderFailureModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOrderFailureModalVisible(false)}
      >
        <View testID="modalCenteredView_3" style={modalStyles.centeredView}>
          <View testID="modalView_3" style={modalStyles.modalView}>
            <Text testID="modalTitle_3" style={modalStyles.modalTitle}>
              발주 실패
            </Text>
            {orderFailureMessages.map((msg, idx) => (
              <Text key={idx} testID={`modalText_failure_${idx}`} style={modalStyles.modalText}>
                {msg}
              </Text>
            ))}
            <TouchableOpacity
              testID="closeButton_3"
              style={modalStyles.closeButton}
              onPress={() => setOrderFailureModalVisible(false)}
            >
              <Text testID="textStyle_3" style={modalStyles.textStyle}>
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OrderRequest;
