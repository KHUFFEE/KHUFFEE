// src/components/ui/OrderRequest.tsx
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

  const uniqueCategories = f.getUniqueCategories(apiItems);
  const filteredProducts = f.getFilteredProducts(apiItems, selectedCategory);
  const sortedProducts = f.sortProductsBySupplierAndName(filteredProducts, suppliers);

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

  if (loading) {
    return (
      <View style={styles.loading_Container}>
        <ActivityIndicator size="large" color="#0D326F80" />
        <Text style={styles.loading_Text}>로딩 중...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.container}>
        <Text>{fetchError}</Text>
      </View>
    );
  }

  const totalPrice = f.calculateTotalPrice(selectedItems);

  // 선택된 상품 카드 렌더링 함수
  const renderProductCard = (product: APIProduct) => {
    const selected = selectedItems.find(item => item.품목_id === product.품목_id);
    if (selected) {
      const computedPrice = selected.quantity * parseFloat(selected.입고단가);
      return (
        <View key={product.품목_id} style={styles.selectItemCard}>
          <View style={styles.selectItemRow}>
            <Text style={styles.selectItemName}>{product.품목명}</Text>
            <Text style={[styles.unitText, { textAlign: 'left' }]}>
              {f.formatPrice(product.출고단위)}{product.단위}
            </Text>
            <Text style={[styles.price_unit_Text, { flex: 1, textAlign: 'left' }]}>
              {f.formatPrice(parseFloat(product.입고단가) * product.출고단위)}원
            </Text>
          </View>

          {/* 워언 텍스트 바로 아래에 총 가격 정보 */}
          <View style={{ marginTop: 6 }}>
            <Text style={styles.priceText}>
              합계 금액: {f.formatPrice(computedPrice)}원
            </Text>
          </View>

          {/* 액션 버튼들 */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(product.품목_id, -product.출고단위)}
            >
              <Minus color="black" size={18} />
            </TouchableOpacity>
            <TextInput
              style={styles.quantityInput}
              value={selected.customQuantity}
              keyboardType="numeric"
              onChangeText={text => updateCustomQuantity(product.품목_id, text)}
            />
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(product.품목_id, product.출고단위)}
            >
              <Plus color="black" size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeItem(product.품목_id)}
            >
              <LucideX color="white" size={18} />
            </TouchableOpacity>
          </View>

          {selected.error && <Text style={styles.errorText}>{selected.error}</Text>}
        </View>
      );
    } else {
      return (
        <View key={product.품목_id} style={styles.selectItemCard}>
          <View style={styles.selectItemRow}>
            <Text style={styles.selectItemName}>{product.품목명}</Text>
            <Text style={[styles.unitText, { textAlign: 'left' }]}>
              {f.formatPrice(product.출고단위)}{product.단위}
            </Text>
            <Text style={[styles.price_unit_Text, { flex: 1, textAlign: 'center' }]}>
              {f.formatPrice(parseFloat(product.입고단가) * product.출고단위)}원
            </Text>
            <TouchableOpacity style={styles.orderButton} onPress={() => addItem(product)}>
              <Text style={styles.orderButtonText}>선택</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {!isConfirmation ? (
        <>
          {/* 전체 container를 감싼 단일 ScrollView */}
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            // stickyHeaderIndices는 인덱스 2 (상품 목록의 헤더)만 고정시킵니다.
            stickyHeaderIndices={[2]}
          >
            {/* 인덱스 0: 카테고리 영역 */}
            <View style={styles.categorySection}>
              <Text style={styles.sectionTitle}>상품 유형 선택</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryList}
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    selectedCategory === null && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text
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
                    style={[
                      styles.categoryButton,
                      selectedCategory === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
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

            {/* 인덱스 1: "상품 선택하기" 텍스트 (고정하지 않음) */}
            <Text style={styles.sectionTitle}>상품 선택하기</Text>

            {/* 인덱스 2 (sticky): 상품 목록의 헤더 */}
            <View style={styles.headerContainer}>
              <Text style={styles.item_headerText}>상품명</Text>
              <Text style={styles.unit_headerText}>출고단위</Text>
              <Text style={[styles.price_headerText,{textAlign: "center"}]}>가격
              </Text>
               {/* 버튼(선택) 자리. 텍스트가 없어도 flex 비율만 맞춰줌 */}
            </View>

            {/* 인덱스 3: 상품 카드 리스트 */}
            <View style={styles.listContainer}>
              {sortedProducts.map((product) => renderProductCard(product))}
            </View>
          </ScrollView>

          {/* 고정된 푸터 영역 */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerPriceText}>
              {selectedItems.length > 0
                ? `총 가격  ${f.formatPrice(totalPrice)}원`
                : '총 가격 0원'}
            </Text>
            <TouchableOpacity
              style={[
                styles.footerButton,
                selectedItems.length === 0 && styles.footerButtonDisabled,
              ]}
              onPress={handleConfirmOrder}
              disabled={selectedItems.length === 0}
            >
              <Text style={styles.footerButtonText}>발주확인</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // 선택한 상품 확인 화면 (발주 확인 모드)
        <ScrollView
          style={{ flex: 1, backgroundColor: '#fff' }} // 외부 ScrollView 스타일
          contentContainerStyle={styles.container} // 내부 컨텐츠 레이아웃 스타일 (수정된 부분)
        >
          <View style={styles.selectedItemsSection}>
            <Text style={[styles.sectionTitle,{textAlign: `center`}]}>선택한 상품 확인</Text>
            {selectedItems.map((item) => {
              const itemTotal = item.quantity * parseFloat(item.입고단가);
              return (
                <View key={item.품목_id} style={styles.confirmationItemRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.selectItemName}>{item.품목명}</Text>
                    <Text style={styles.unitText}>
                      수량: {item.quantity}
                      {item.단위} (출고단위: {item.출고단위})
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.priceText}>{f.formatPrice(itemTotal)}원</Text>
                  </View>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>총합계:</Text>
              <Text style={styles.totalText}>{f.formatPrice(totalPrice)}원</Text>
            </View>
            <TouchableOpacity
              style={[styles.order_request_Button, orderSubmitted && { opacity: 0.5 }]}
              onPress={handleOrderSubmit}
              disabled={orderSubmitted}
            >
              <Text style={styles.order_request_ButtonText}>발주요청하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.order_request_Button, { backgroundColor: 'white'},{borderColor:`#0D326F`},{borderWidth:1},{marginTop: 10 }]}
              onPress={() => setIsConfirmation(false)}
            >
              <Text style={[styles.order_request_ButtonText,{color: '#0D326F'}]}>뒤로가기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* 발주 오류 모달 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>발주 오류</Text>
            {errorMessages.map((msg, idx) => (
              <Text key={idx} style={modalStyles.modalText}>
                {msg}
              </Text>
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

      {/* 발주 완료 모달 */}
      <Modal
        visible={orderCompleteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOrderCompleteModalVisible(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>발주 완료</Text>
            <Text style={modalStyles.modalText}>
              모든 발주 요청이 성공적으로 전송되었습니다.
            </Text>
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
        transparent
        animationType="slide"
        onRequestClose={() => setOrderFailureModalVisible(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>발주 실패</Text>
            {orderFailureMessages.map((msg, idx) => (
              <Text key={idx} style={modalStyles.modalText}>
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

export default OrderRequest;
