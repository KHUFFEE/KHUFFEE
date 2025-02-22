// C:\Users\usert\Desktop\KHUFFEE\frontend\khuapp\app\(store)\OrderRequest.tsx
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
import { orderStyles, modalStyles, styles } from '../../src/components/ui/common/commonstyler';
import * as f from '../../src/components/ui/common/function';

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
    if (selected) {
      const computedPrice = selected.quantity * parseFloat(selected.입고단가);
      return (
        <View testID="selectItemCard" key={product.품목_id} style={styles.selectItemCard}>
          <View testID="cardContent" style={styles.cardContent}>
            {/* 첫번째 행: 제품 정보 영역 */}
            <View testID="selectItemRowContainer" style={styles.selectItemRowContainer}>
              <Text testID="selectItemName" style={styles.selectItemName}>
                {product.품목명}
              </Text>
              <Text testID="unitText" style={styles.unitText}>
                {f.formatPrice(product.출고단위)}{product.단위}
              </Text>
              <Text testID="price_unit_Text" style={styles.price_unit_Text}>
                {f.formatPrice(parseFloat(product.입고단가) * product.출고단위)}원
              </Text>
            </View>
            {/* 두번째 행: 가격 정보와 액션 버튼 그룹 */}
            <View testID="selectItemCardFooter_selected" style={styles.selectItemCardFooter_selected}>
              {/* 첫번째 자식: 가격 정보 */}
              <View testID="priceContainer" style={styles.priceContainer}>
                <Text testID="priceText" style={styles.priceText}>
                  합계 금액: {f.formatPrice(computedPrice)}원
                </Text>
              </View>
              {/* 두번째 자식: 액션 버튼 그룹 */}
              <View testID="actionButtonsContainer" style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  testID="quantityButton"
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(product.품목_id, -product.출고단위)}
                >
                  <Minus color="black" size={18} />
                </TouchableOpacity>
                <TextInput
                  testID="quantityInput"
                  style={styles.quantityInput}
                  value={selected.customQuantity}
                  keyboardType="numeric"
                  onChangeText={text => updateCustomQuantity(product.품목_id, text)}
                />
                <TouchableOpacity
                  testID="quantityButton"
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(product.품목_id, product.출고단위)}
                >
                  <Plus color="black" size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  testID="removeButton"
                  style={styles.removeButton}
                  onPress={() => removeItem(product.품목_id)}
                >
                  <LucideX color="white" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {selected.error && (
            <Text testID="errorText" style={styles.errorText}>
              {selected.error}
            </Text>
          )}
        </View>
      );
    } else {
      return (
        <View testID="selectItemCard" key={product.품목_id} style={styles.selectItemCard}>
          <View style={styles.cardContent}>
            {/* 첫번째 행: 제품 정보 영역 */}
            <View testID="selectItemRowContainer" style={styles.selectItemRowContainer}>
              <Text testID="selectItemName" style={styles.selectItemName}>
                {product.품목명}
              </Text>
              <Text testID="unitText" style={styles.unitText}>
                {f.formatPrice(product.출고단위)}{product.단위}
              </Text>
              <Text testID="price_unit_Text" style={styles.price_unit_Text}>
                {f.formatPrice(parseFloat(product.입고단가) * product.출고단위)}원
              </Text>
            </View>
            {/* 두번째 행: 선택 버튼 영역 */}
            <View testID="selectItemCardFooter" style={styles.selectItemCardFooter}>
              <TouchableOpacity
                testID="orderButton"
                style={styles.orderButton}
                onPress={() => addItem(product)}
              >
                <Text testID="orderButtonText" style={styles.orderButtonText}>
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
        <ActivityIndicator size="large" color="#0D326F80" />
        <Text testID="loading_Text" style={styles.loading_Text}>로딩 중...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View testID="container" style={styles.container}>
        <Text>{fetchError}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {!isConfirmation ? (
        <>
          <ScrollView
            testID="scrollContainer"
            contentContainerStyle={styles.scrollContainer}
            stickyHeaderIndices={[0]}
          >
            {/* 고정 헤더 영역 */}
            <View testID="fixedHeaderContainer" style={styles.fixedHeaderContainer}>
              {/* 카테고리 영역 */}
              <View testID="categorySection" style={styles.categorySection}>
                <Text testID="sectionTitle" style={styles.sectionTitle}>상품 유형 선택</Text>
                <ScrollView
                  testID="categoryList"
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryList}
                  contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                  }}
                >
                  <TouchableOpacity
                    testID="categoryButton"
                    style={[
                      styles.categoryButton,
                      selectedCategory === null && styles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(null)}
                  >
                    <Text
                      testID="categoryButtonText"
                      style={[
                        styles.categoryButtonText,
                        selectedCategory === null && styles.categoryButtonTextActive,
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
                        styles.categoryButton,
                        selectedCategory === cat && styles.categoryButtonActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text
                        testID="categoryButtonText"
                        style={[
                          styles.categoryButtonText,
                          selectedCategory === cat && styles.categoryButtonTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {/* sectionTitle와 headerContainer를 감싼 영역 */}
              <View testID="sectionContainer" style={styles.sectionContainer}>
                <Text testID="sectionTitle" style={styles.sectionTitle}>상품 선택하기</Text>
                <View testID="headerContainer" style={styles.headerContainer}>
                  <Text testID="item_headerText" style={styles.item_headerText}>상품명</Text>
                  <Text testID="unit_headerText" style={styles.unit_headerText}>출고단위</Text>
                  <Text testID="price_headerText" style={styles.price_headerText}>가격</Text>
                </View>
              </View>
            </View>

            {/* 상품 목록 */}
            <View testID="listContainer" style={styles.listContainer}>
              {sortedProducts.map((product) => renderProductCard(product))}
            </View>
          </ScrollView>

          {/* 고정된 푸터 영역 */}
          <View testID="footerContainer" style={styles.footerContainer}>
            <Text testID="footerPriceText" style={styles.footerPriceText}>
              {selectedItems.length > 0
                ? `총 가격  ${f.formatPrice(totalPrice)}원`
                : '총 가격 0원'}
            </Text>
            <TouchableOpacity
              testID="footerButton"
              style={[
                styles.footerButton,
                selectedItems.length === 0 && styles.footerButtonDisabled,
              ]}
              onPress={handleConfirmOrder}
              disabled={selectedItems.length === 0}
            >
              <Text testID="footerButtonText" style={styles.footerButtonText}>발주확인</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <ScrollView
          testID="container"
          style={{ flex: 1, backgroundColor: '#fff' }}
        >
          <View testID="confirm_selectedItemsSection" style={styles.confirm_selectedItemsSection}>
            <Text testID="confirm_sectionTitle" style={[styles.confirm_sectionTitle, { textAlign: 'center' }]}>선택한 상품 확인</Text>
            {selectedItems.map((item) => {
              const itemTotal = item.quantity * parseFloat(item.입고단가);
              return (
                <View testID="confirmationItemRow" key={item.품목_id} style={styles.confirmationItemRow}>
                  <View style={{ flex: 2 }}>
                    <Text testID="confirm_selectItemName" style={styles.confirm_selectItemName}>{item.품목명}</Text>
                    <Text testID="confirm_unitText" style={styles.confirm_unitText}>
                      수량: {item.quantity}{item.단위} (출고단위: {item.출고단위})
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text testID="confirm_priceText" style={styles.confirm_priceText}>{f.formatPrice(itemTotal)}원</Text>
                  </View>
                </View>
              );
            })}
            <View testID="totalRow" style={styles.totalRow}>
              <Text testID="totalText" style={styles.totalText}>총합계:</Text>
              <Text testID="totalText" style={styles.totalText}>{f.formatPrice(totalPrice)}원</Text>
            </View>
            <TouchableOpacity
              testID="order_request_Button"
              style={[styles.order_request_Button, orderSubmitted && { opacity: 0.5 }]}
              onPress={handleOrderSubmit}
              disabled={orderSubmitted}
            >
              <Text testID="order_request_ButtonText" style={styles.order_request_ButtonText}>발주요청하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="order_request_Button"
              style={[
                styles.order_request_Button,
                { backgroundColor: 'white' },
                { borderColor: '#0D326F' },
                { borderWidth: 1 },
                { marginTop: 10 },
              ]}
              onPress={() => setIsConfirmation(false)}
            >
              <Text testID="order_request_ButtonText" style={[styles.order_request_ButtonText, { color: '#0D326F' }]}>뒤로가기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* 모달들 */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View testID="centeredView" style={modalStyles.centeredView}>
          <View testID="modalView" style={modalStyles.modalView}>
            <Text testID="modalTitle" style={modalStyles.modalTitle}>발주 오류</Text>
            {errorMessages.map((msg, idx) => (
              <Text key={idx} testID="modalText" style={modalStyles.modalText}>
                {msg}
              </Text>
            ))}
            <TouchableOpacity testID="closeButton" style={modalStyles.closeButton} onPress={() => setModalVisible(false)}>
              <Text testID="textStyle" style={modalStyles.textStyle}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={orderCompleteModalVisible} transparent animationType="slide" onRequestClose={() => setOrderCompleteModalVisible(false)}>
        <View testID="centeredView" style={modalStyles.centeredView}>
          <View testID="modalView" style={modalStyles.modalView}>
            <Text testID="modalTitle" style={modalStyles.modalTitle}>발주 완료</Text>
            <Text testID="modalText" style={modalStyles.modalText}>
              모든 발주 요청이 성공적으로 전송되었습니다.
            </Text>
            <TouchableOpacity testID="closeButton" style={modalStyles.closeButton} onPress={() => {
                setOrderCompleteModalVisible(false);
                onOrderComplete();
              }}>
              <Text testID="textStyle" style={modalStyles.textStyle}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={orderFailureModalVisible} transparent animationType="slide" onRequestClose={() => setOrderFailureModalVisible(false)}>
        <View testID="centeredView" style={modalStyles.centeredView}>
          <View testID="modalView" style={modalStyles.modalView}>
            <Text testID="modalTitle" style={modalStyles.modalTitle}>발주 실패</Text>
            {orderFailureMessages.map((msg, idx) => (
              <Text key={idx} testID="modalText" style={modalStyles.modalText}>
                {msg}
              </Text>
            ))}
            <TouchableOpacity testID="closeButton" style={modalStyles.closeButton} onPress={() => setOrderFailureModalVisible(false)}>
              <Text testID="textStyle" style={modalStyles.textStyle}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OrderRequest;
