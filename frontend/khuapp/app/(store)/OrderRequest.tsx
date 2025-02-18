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
    TouchableWithoutFeedback,
} from 'react-native';
import {
Home,
ShoppingCart,
Receipt,
Clipboard,
Plus,
Minus,
X as LucideX, // X 아이콘 이름이 겹치므로 별칭
ChevronUp,
ChevronDown,
} from 'lucide-react-native';   // lucide-react-native 라이브러리에서 아이콘 가져오기 
import { StoreOrderRequestProps, LocalOrder, APIProduct, SelectedItem} from '../../src/components/ui/common/types';
import { commonStyles, orderStyles, modalStyles } from '../../src/components/ui/common/commonstyler'
import * as f from '../../src/components/ui/common/function';

const OrderRequest: React.FC<StoreOrderRequestProps> = ({
    storeName,
    storeId,
    onOrderComplete,
    onNewOrder,
}) => {
    const [apiItems, setApiItems] = useState<APIProduct[]>([]);  // 서버에서 받아온 품목 데이터
    const [suppliers, setSuppliers] = useState<any[]>([]);   // 협력사 데이터
    const [loading, setLoading] = useState<boolean>(true);   // 로딩 상태
    const [fetchError, setFetchError] = useState<string | null>(null);   // 데이터 가져오기 오류

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // 선택된 카테고리
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]); // 선택된 품목

    const [isConfirmation, setIsConfirmation] = useState<boolean>(false);
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    const [orderCompleteModalVisible, setOrderCompleteModalVisible] = useState<boolean>(false);
    const [orderFailureModalVisible, setOrderFailureModalVisible] = useState<boolean>(false);

    const [orderFailureMessages, setOrderFailureMessages] = useState<string[]>([]);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    
    // 품목 리스트 API 호출 
    useEffect(() => {
        f.fetchApiItems().then((data) => {
          setApiItems(data);
          setLoading(false);
        }).catch(() => {
          setFetchError('품목을 불러오는 중 오류가 발생했습니다.');
          setLoading(false);
        });
      }, []);

    // 협력사 리스트 API
    useEffect(() => {
        f.fetchSuppliers().then((data) => {
          setSuppliers(data);
        }).catch((err) => {
          console.error('협력사 데이터를 불러오는 중 오류:', err);
        });
      }, []);

    // 카테고리 목록과 필터링된 상품 목록
    const uniqueCategories = f.getUniqueCategories(apiItems);
    const filteredProducts = f.getFilteredProducts(apiItems, selectedCategory);

    // 품목 리스트를 협력사명 및 품목명 기준으로 정렬
    const sortedProducts = f.sortProductsBySupplierAndName(filteredProducts, suppliers);
  

    //품목추가 
    const addItem = (product: APIProduct) => {
        // 함수 모듈에 정의된 addItemToSelectedItems를 호출하여 새 배열을 얻은 후 상태를 업데이트합니다.
        const updatedItems = f.addItemToSelectedItems(selectedItems, product);
        setSelectedItems(updatedItems);
      };

    // 수량 증가/감소
    const updateQuantity = (productId: string, increment: number) => {
    const updatedItems = f.updateQuantity(selectedItems, productId, increment);
    setSelectedItems(updatedItems);
    };


    //사용자 입력에 따른 수량 업데이트
    const updateCustomQuantity = (productId: string, text: string) => {
        const updatedItems = f.updateCustomQuantityUtil(selectedItems, productId, text);
        setSelectedItems(updatedItems);
      };
    // 품목 제거 (분리한 함수 사용)
    const removeItem = (productId: string) => {
        const updatedItems = f.removeItemUtil(selectedItems, productId);
        setSelectedItems(updatedItems);
    };

  // 발주 확인 (분리한 함수 사용)
    const handleConfirmOrder = () => {
        const errors = f.handleConfirmOrderUtil(selectedItems);
        if (errors.length > 0) {
        setErrorMessages(errors);
        setModalVisible(true);
        return;
        }
        setIsConfirmation(true);
    };



  // 발주 요청 (분리한 함수 사용)
  const handleOrderSubmit = async () => {
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
  };
  if (loading) {
    return (
      <View style={orderStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={orderStyles.loadingText}>로딩 중...</Text>
      </View>
    );
  }
  // 에러 메시지를 감싸는 컨테이너 뷰를 반환
  if (fetchError) {       
    return (
      <View style={orderStyles.container}>
        <Text>{fetchError}</Text>
      </View>
    );
  }

  // 선택된 품목들의 총 가격 계산 
  const totalPrice = f.calculateTotalPrice(selectedItems);

    // 상품 카드 렌더링 함수
    const renderProductCard = (product: APIProduct) => {
        const selected = selectedItems.find((item) => item.품목_id === product.품목_id);
        if (selected) {
          const computedPrice = selected.quantity * parseFloat(selected.입고단가);
          return (
            <View key={product.품목_id} style={orderStyles.selectedItemCard}>
              <View style={orderStyles.selectedItemInfo}>
                <Text style={orderStyles.selectedItemName}>{product.품목명}</Text>
                <Text style={orderStyles.unitText}>
                  출고단위: {f.formatPrice(product.출고단위)}
                  {product.단위}
                </Text>
                <Text style={orderStyles.unitText}>
                  가격: {f.formatPrice(parseFloat(product.입고단가) * product.출고단위)}원
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
                  <LucideX color="white" size={18} />
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 6 }}>
                <Text style={orderStyles.priceText}>
                  총 가격: {f.formatPrice(computedPrice)}원
                </Text>
              </View>
            </View>
          );
        } else {
          return (
            <View key={product.품목_id} style={orderStyles.selectedItemCard}>
              <View style={orderStyles.selectedItemInfo}>
                <Text style={orderStyles.selectedItemName}>{product.품목명}</Text>
                <Text style={orderStyles.unitText}>
                  출고단위: {f.formatPrice(product.출고단위)}
                  {product.단위}
                </Text>
                <Text style={orderStyles.unitText}>
                  가격: {f.formatPrice(parseFloat(product.입고단가) * product.출고단위)}원
                </Text>
              </View>
              <TouchableOpacity style={orderStyles.orderButton} onPress={() => addItem(product)}>
                <Text style={orderStyles.orderButtonText}>추가</Text>
              </TouchableOpacity>
            </View>
          );
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
    
      return (
        <View style={{ flex: 1 }}>
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
    
              <View style={orderStyles.footerContainer}>
                <Text style={orderStyles.footerPriceText}>
                  {selectedItems.length > 0
                    ? `총 ${f.formatPrice(totalPrice)}원`
                    : '총 0원'}
                </Text>
    
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
                          <Text style={orderStyles.priceText}>
                            {f.formatPrice(itemTotal)}원
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                  <View style={orderStyles.totalRow}>
                    <Text style={orderStyles.totalText}>총합계:</Text>
                    <Text style={orderStyles.totalText}>
                      {f.formatPrice(totalPrice)}원
                    </Text>
                  </View>
    
                  <TouchableOpacity
                    style={orderStyles.orderButton}
                    onPress={handleOrderSubmit}
                  >
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
export default OrderRequest;