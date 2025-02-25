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
import { Plus, Minus, X as LucideX } from 'lucide-react-native';
import {
  StoreOrderRequestProps,
  APIProduct,
  SelectedItem,
} from '../../src/components/ui/common/types';
import { styles,modalStyles,  } from '../../src/components/ui/common/commonstyler';
import * as f from '../../src/components/ui/common/function';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { OrderRequeststyle } from '../../src/styles/Orderrequest_style';

const OrderRequest: React.FC<StoreOrderRequestProps> = ({
  storeName,
  storeId,
  onOrderComplete,
  onNewOrder,
}) => {
  // 상태 변수 선언
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

  // API 데이터 불러오기
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
      .then((data) => setSuppliers(data))
      .catch((err) => console.error('협력사 데이터 불러오기 오류:', err));
  }, []);

  // 제품 목록 관련 상수
  const uniqueCategories = f.getUniqueCategories(apiItems);
  const filteredProducts = f.getFilteredProducts(apiItems, selectedCategory);
  const sortedProducts = f.sortProductsBySupplierAndName(filteredProducts, suppliers);
  const totalPrice = f.calculateTotalPrice(selectedItems);

  // 이벤트 핸들러
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

  // 선택된 상품 카드 렌더링 함수
  const renderProductCard = (product: APIProduct) => {
    const selected = selectedItems.find(item => item.품목_id === product.품목_id);
    const cardStyle = selected
      ? [OrderRequeststyle.selectItemCard, OrderRequeststyle.selectedItemCard]
      : OrderRequeststyle.selectItemCard;

    if (selected) {
      const computedPrice = selected.quantity * parseFloat(selected.입고단가);
      return (
        <View testID="selectItemCard" key={product.품목_id} style={cardStyle}>
          <View testID="cardContent" style={[OrderRequeststyle.cardContent, { position: 'relative' }]}>
            {/* 상품 정보 고정 영역 */}
            <View testID="productInfoContainer" style={OrderRequeststyle.productInfoContainer}>
              <View testID="selectedItemRowContainer" style={OrderRequeststyle.selectedItemRowContainer}>
                <Text testID="selectItemName" style={OrderRequeststyle.selectItemName}>
                  {product.품목명}
                </Text>
                <Text testID="price_unit_Text" style={OrderRequeststyle.price_unit_Text}>
                  {f.formatPrice(parseFloat(product.입고단가) * product.출고단위)}원
                </Text>
                <TouchableOpacity
                  testID="orderButton"
                  style={[OrderRequeststyle.orderButton, { borderColor: '#ef4444' }]}
                  onPress={() => removeItem(product.품목_id)}
                >
                  <Text testID="orderButtonText" style={[OrderRequeststyle.orderButtonText, { color: '#ef4444' }]}>
                    취소
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
      
            {/* 추가 영역: 선택 시 확장되어 아래쪽으로 추가 (상품 정보에는 영향 없음) */}
            {selected && (
              <View testID="additionalRow" style={OrderRequeststyle.additionalRowContainer}>
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
                    출고단위: {f.formatPrice(product.출고단위)}{product.단위}
                  </Text>
                </View>
                {/* Row2: 수량 조절 컨트롤 (오른쪽 정렬) */}
                <View
                  testID="Row2"
                  style={{
                    marginTop: moderateScale(8),
                    alignItems: 'flex-end',
                  }}
                >
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
                      onChangeText={text => updateCustomQuantity(product.품목_id, text)}
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
        <View testID="selectItemCard" key={product.품목_id} style={cardStyle}>
          <View testID="cardContent" style={OrderRequeststyle.cardContent}>
            <View testID="selectItemRowContainer" style={OrderRequeststyle.selectItemRowContainer}>
              <Text testID="selectItemName" style={OrderRequeststyle.selectItemName}>
                {product.품목명}
              </Text>
              <Text testID="price_unit_Text" style={OrderRequeststyle.price_unit_Text}>
                {f.formatPrice(parseFloat(product.입고단가) * product.출고단위)}원
              </Text>
              <TouchableOpacity
                testID="orderButton"
                style={OrderRequeststyle.orderButton}
                onPress={() => addItem(product)}
              >
                <Text testID="orderButtonText" style={OrderRequeststyle.orderButtonText}>
                  선택
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
  };

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
                  testID="categoryListScroll"
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
                    testID="categoryButton_All"
                    style={[
                      OrderRequeststyle.categoryButton,
                      selectedCategory === null && OrderRequeststyle.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(null)}
                  >
                    <Text
                      testID="categoryButtonText_All"
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
                      testID={`categoryButton_${idx}`}
                      style={[
                        OrderRequeststyle.categoryButton,
                        selectedCategory === cat && OrderRequeststyle.categoryButtonActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text
                        testID={`categoryButtonText_${idx}`}
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
                <Text testID="sectionTitle_2" style={OrderRequeststyle.sectionTitle_2}>
                  상품 선택하기
                </Text>
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
              {sortedProducts.map((product) => renderProductCard(product))}
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
              testID="order_request_Button_Back"
              style={[
                OrderRequeststyle.order_request_Button,
                { backgroundColor: 'white' },
                { borderColor: '#0D326F' },
                { borderWidth: 1 },
                { marginTop: 10 },
              ]}
              onPress={() => setIsConfirmation(false)}
            >
              <Text testID="order_request_ButtonText_Back" style={[OrderRequeststyle.order_request_ButtonText, { color: '#0D326F' }]}>
                뒤로가기
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* 모달 영역 */}
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
