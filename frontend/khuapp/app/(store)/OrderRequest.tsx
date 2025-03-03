import React, { useState, useEffect } from 'react';
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
import { Plus, Minus, X as LucideX, Search } from 'lucide-react-native';
import {
  StoreOrderRequestProps,
  APIProduct,
  SelectedItem,
} from '../../src/components/ui/common/types';
import { styles, modalStyles } from '../../src/components/ui/common/commonstyler';
import * as f from '../../src/components/ui/common/function';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { OrderRequeststyle } from '../../src/styles/Orderrequest_styles';
// RN_API_URL 환경 변수 (재고 API 호출에 사용)
import { RN_API_URL } from '@env';

const OrderRequest: React.FC<StoreOrderRequestProps> = ({
  storeName,
  storeId,
  onOrderComplete,
  onNewOrder,
}) => {
  // API로부터 받아온 품목 데이터 상태
  const [apiItems, setApiItems] = useState<APIProduct[]>([]);
  // 협력사 데이터 상태
  const [suppliers, setSuppliers] = useState<any[]>([]);
  // 로딩 상태
  const [loading, setLoading] = useState<boolean>(true);
  // API 호출 오류 메시지 상태
  const [fetchError, setFetchError] = useState<string | null>(null);
  // 선택된 카테고리 상태
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // 선택된 품목 목록 상태
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  // 발주 확인 여부 상태
  const [isConfirmation, setIsConfirmation] = useState<boolean>(false);
  // 모달 표시 여부 상태
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [orderCompleteModalVisible, setOrderCompleteModalVisible] = useState<boolean>(false);
  const [orderFailureModalVisible, setOrderFailureModalVisible] = useState<boolean>(false);
  // 발주 실패 메시지 상태
  const [orderFailureMessages, setOrderFailureMessages] = useState<string[]>([]);
  // 발주 오류 메시지 상태
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  // 발주 요청 중복 제출 방지 상태
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  // 즐겨찾기 상태 (매장별)
  const [favorites, setFavorites] = useState<string[]>([]);
  // 돋보기(검색) 활성화 상태
  const [isSearchActive, setIsSearchActive] = useState(false);
  // 검색 텍스트 상태
  const [searchText, setSearchText] = useState('');

  // 즐겨찾기 데이터 저장 key (storeId 별)
  const getFavoritesKey = (storeId: string) => `favorites_${storeId}`;

  // 매장 별 즐겨찾기 데이터 로딩
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

  // 즐겨찾기 토글 함수
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

  // 품목 데이터를 API로부터 불러오기
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

  // 협력사 데이터를 API로부터 불러오기
  useEffect(() => {
    f.fetchSuppliers()
      .then((data) => setSuppliers(data))
      .catch((err) => console.error('협력사 데이터 불러오기 오류:', err));
  }, []);

  // 매장 재고 데이터를 위한 상태 변수 추가
  const [inventory, setInventory] = useState<any[]>([]);

  // 매장 재고 데이터를 불러오는 useEffect
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        if (!storeId) return;
        const response = await fetch(`${RN_API_URL}/api/inventory/store/?매장_id=${storeId}`);
        if (!response.ok) throw new Error('재고 데이터를 불러오는 중 오류 발생');
        const data = await response.json();
        setInventory(data);
      } catch (error) {
        console.error('재고 데이터 불러오기 오류:', error);
      }
    };
    fetchInventory();
  }, [storeId]);

  // 제품 목록 관련 상수
  const uniqueCategories = f.getUniqueCategories(apiItems);
  const filteredProducts = f.getFilteredProducts(apiItems, selectedCategory);
  
  // 즐겨찾기 상품을 상단에 표시하도록 정렬
  const sortedProducts = filteredProducts.sort((a, b) => {
    const aIsFavorite = favorites.includes(a.품목_id);
    const bIsFavorite = favorites.includes(b.품목_id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    // 즐겨찾기 상태가 같으면 기존 정렬 방식 적용
    return f.sortProductsBySupplierAndName([a, b], suppliers)[0] === a ? -1 : 1;
  });

  // 검색 기능: 검색 바가 활성화되고 입력값이 있을 경우 필터링
  let displayProducts = sortedProducts;
  if (isSearchActive && searchText.trim().length > 0) {
    displayProducts = sortedProducts.filter((product) =>
      product.품목명.toLowerCase().includes(searchText.toLowerCase())
    );
  }
  
  // 선택한 품목들의 총 가격 계산
  const totalPrice = f.calculateTotalPrice(selectedItems);

  // 이벤트 핸들러: 품목 추가
  const addItem = (product: APIProduct) => {
    const updatedItems = f.addItemToSelectedItems(selectedItems, product);
    setSelectedItems(updatedItems);
  };

  // 이벤트 핸들러: 수량 업데이트 (증가/감소)
  const updateQuantity = (productId: string, increment: number) => {
    const updatedItems = f.updateQuantity(selectedItems, productId, increment);
    setSelectedItems(updatedItems);
  };

  // 이벤트 핸들러: 텍스트 입력에 따른 수량 업데이트
  const updateCustomQuantity = (productId: string, text: string) => {
    const updatedItems = f.updateCustomQuantityUtil(selectedItems, productId, text);
    setSelectedItems(updatedItems);
  };

  // 이벤트 핸들러: 품목 제거
  const removeItem = (productId: string) => {
    const updatedItems = f.removeItemUtil(selectedItems, productId);
    setSelectedItems(updatedItems);
  };

  // 발주 확인 처리 함수
  const handleConfirmOrder = () => {
    const errors = f.handleConfirmOrderUtil(selectedItems);
    if (errors.length > 0) {
      setErrorMessages(errors);
      setModalVisible(true);
      return;
    }
    setIsConfirmation(true);
  };

  // 발주 요청 제출 처리 함수
  const handleOrderSubmit = async () => {
    if (orderSubmitted) return;
    setOrderSubmitted(true);
    if (!storeId) {
      console.error('매장 ID가 존재하지 않습니다.');
      return;
    }
    const result = await f.handleOrderSubmitUtil(storeId, selectedItems);
    if (result.failures) {
      setOrderFailureMessages(result.failures);
      setOrderFailureModalVisible(true);
    } else if (result.newOrder) {
      onNewOrder(result.newOrder);
      setOrderCompleteModalVisible(true);
    }
    setOrderSubmitted(false);
  };

  // 매장 재고 정보를 렌더링하는 헬퍼 함수
  const renderInventoryText = (product: APIProduct) => {
    // 재고 배열에서 해당 품목의 재고 정보를 찾음
    const inv = inventory.find(item => item.품목_id === product.품목_id);
    if (inv) {
      const stock = inv.매장_재고량;
      let formattedStock;
      // 소수점이 없는 경우 그대로 표시
      if (stock % 1 === 0) {
        formattedStock = stock;
      } else {
        // 소수점 이하 숫자를 문자열로 변환한 후, 첫 번째 숫자 확인
        const fractionalPart = stock.toString().split('.')[1];
        if (fractionalPart && fractionalPart.charAt(0) === '0') {
          // 첫 번째 소수 자리가 0이면 정수 부분만 표시
          formattedStock = Math.floor(stock);
        } else {
          // 그렇지 않으면 소수점 첫째 자리까지 표시
          formattedStock = stock.toFixed(1);
        }
      }
      return <Text testID="현재고" style={{ color: '#FF4500' }}>현재고: {formattedStock}개</Text>;
    }
    return null;
  };

  // 선택된 품목 카드 렌더링 함수
  const renderProductCard = (product: APIProduct) => {
    const selected = selectedItems.find((item) => item.품목_id === product.품목_id);
    const cardStyle = selected
      ? [OrderRequeststyle.selectItemCard, OrderRequeststyle.selectedItemCard]
      : OrderRequeststyle.selectItemCard;

    // 즐겨찾기 여부에 따른 스타일 적용
    const isFavorite = favorites.includes(product.품목_id);

    // 즐겨찾기 버튼 UI
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
            {/* 상품 정보 고정 영역 */}
            <View testID="productInfoContainer" style={OrderRequeststyle.productInfoContainer}>
              <View testID="selectedItemRowContainer" style={OrderRequeststyle.selectedItemRowContainer}>
                <View testID="nameWithFavoriteContainer" style={OrderRequeststyle.nameWithFavoriteContainer}>
                  {favoriteButton}
                  {/* 상품명과 재고 정보를 줄바꿈하여 표시 */}
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

            {/* 선택된 품목일 경우 추가 영역 */}
            {selected && (
              <View testID="additionalRowContainer" style={OrderRequeststyle.additionalRowContainer}>
                {/* Row1: 합계 금액과 출고 단위 */}
                <View
                  testID="Row1"
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    marginTop: moderateScale(4),
                  }}
                >
                  <Text testID="priceText" style={OrderRequeststyle.priceText}>
                    합계 금액: {f.formatPrice(computedPrice)}원
                  </Text>
                  <Text testID="unitText" style={OrderRequeststyle.unitText}>
                    출고단위: {f.formatPrice(product.출고단위)}
                    {product.단위}
                  </Text>
                </View>
                {/* Row2: 수량 조절 컨트롤 (오른쪽 정렬) */}
                <View testID="Row2" style={{ marginTop: moderateScale(8), alignItems: 'flex-end' }}>
                  <View testID="quantityControlContainer" style={OrderRequeststyle.quantityControlContainer}>
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
            )}
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
                {/* 상품명과 재고 정보를 줄바꿈하여 표시 */}
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

  // 로딩 상태일 때 렌더링
  if (loading) {
    return (
      <View testID="loading_Container" style={styles.loading_Container}>
        <ActivityIndicator testID="activityIndicator" size="large" color="#0D326F80" />
        <Text testID="loading_Text" style={styles.loading_Text}>
          로딩 중...
        </Text>
      </View>
    );
  }

  // 데이터 불러오기 오류일 때 렌더링
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
            {/* 고정 헤더 영역 */}
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
                  {uniqueCategories.map((cat, idx) => (
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
                {/* 섹션 타이틀과 돋보기 아이콘을 한 줄에 배치 */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text testID="sectionTitle_2" style={OrderRequeststyle.sectionTitle_2}>
                    상품 선택하기
                  </Text>
                  <TouchableOpacity onPress={() => setIsSearchActive(!isSearchActive)}>
                    <Search testID="searchIcon" color="#000" size={20} />
                  </TouchableOpacity>
                </View>
                {/* 돋보기 클릭 시 검색 바 표시 */}
                {isSearchActive && (
                  <View style={{ marginTop: 8, marginHorizontal: 16 }}>
                    <TextInput
                      testID="searchInput"
                      style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8 }}
                      placeholder="상품명을 입력하세요"
                      value={searchText}
                      onChangeText={(text) => setSearchText(text)}
                    />
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

            {/* 상품 목록 */}
            <View testID="listContainer" style={OrderRequeststyle.listContainer}>
              {displayProducts.map((product) => renderProductCard(product))}
            </View>
          </ScrollView>

          {/* 고정된 푸터 영역 */}
          <View testID="footerContainer" style={OrderRequeststyle.footerContainer}>
            <Text testID="footerPriceText" style={OrderRequeststyle.footerPriceText}>
              {selectedItems.length > 0
                ? `총 가격  ${f.formatPrice(totalPrice)}원`
                : '총 가격 0원'}
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
              선택한 상품 확인
            </Text>
            {selectedItems.map((item) => {
              const itemTotal = item.quantity * parseFloat(item.입고단가);
              return (
                <View testID="confirmationItemRow" key={item.품목_id} style={OrderRequeststyle.confirmationItemRow}>
                  <View testID="confirmItemLeft" style={{ flex: 2 }}>
                    <Text testID="confirm_selectItemName" style={OrderRequeststyle.confirm_selectItemName}>
                      {item.품목명}
                    </Text>
                    <Text testID="confirm_unitText" style={OrderRequeststyle.confirm_unitText}>
                      수량: {item.quantity}
                      {item.단위} (출고단위: {item.출고단위})
                    </Text>
                  </View>
                  <View testID="confirmItemRight" style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text testID="confirm_priceText" style={OrderRequeststyle.confirm_priceText}>
                      {f.formatPrice(itemTotal)}원
                    </Text>
                  </View>
                </View>
              );
            })}
            <View testID="totalRow" style={OrderRequeststyle.totalRow}>
              <Text testID="totalText" style={OrderRequeststyle.totalText}>
                총합계:
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
                { marginTop: 10 },
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

      {/* 발주 오류 모달 */}
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

      {/* 발주 완료 모달 */}
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
            <Text testID="modalText_Complete" style={modalStyles.modalText}>
              모든 발주 요청이 성공적으로 전송되었습니다.
            </Text>
            <TouchableOpacity
              testID="closeButton_Complete"
              style={modalStyles.closeButton}
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

      {/* 발주 실패 모달 */}
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
