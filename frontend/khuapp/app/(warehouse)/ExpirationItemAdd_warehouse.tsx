import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Plus, Minus, X, Search, Calendar } from "lucide-react-native";
import { RN_API_URL } from "@env";
import { APIProduct } from "../../src/components/ui/common/types";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  styles,
  modalStyles,
} from "../../src/components/ui/common/commonstyler";
import { ItemAddPageStyle } from "../../src/styles/ExpirationMangaement_warehouse";
import { moderateScale } from "react-native-size-matters";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { RFValue } from "react-native-responsive-fontsize";

interface ExpirationItemAddProps {
  warehouseId: string;
  onAddComplete: () => void;
  onCancel: () => void;
}

interface ProductItem {
  품목_id: string;
  품목명: string;
  협력사명: string;
  단위: string;
  품목분류?: string;
}

interface SelectedExpirationItem {
  품목_id: string;
  품목명: string;
  협력사명: string;
  유통기한: Date;
  창고_재고량: number;
  customQuantity: string;
  error?: string;
}

const ExpirationItemAdd_warehouse: React.FC<ExpirationItemAddProps> = ({
  warehouseId,
  onAddComplete,
  onCancel,
}) => {
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedExpirationItem[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isConfirmation, setIsConfirmation] = useState<boolean>(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 제품 목록 가져오기
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${RN_API_URL}/api/suppliers/items/`);
        if (!response.ok)
          throw new Error("제품 데이터를 불러오는 중 오류 발생");
        const data = await response.json();
        setProductItems(data);
      } catch (error) {
        console.error("제품 데이터 불러오기 오류:", error);
        Alert.alert("오류", "제품 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 카테고리 정렬
  const sortedCategories = useMemo(() => {
    if (!productItems || productItems.length === 0) return [];

    // 품목분류가 있는 항목만 필터링하고, 중복 제거 후 정렬
    const categories = productItems
      .map((item) => item.품목분류)
      .filter((category): category is string => category !== undefined) // undefined 제거
      .filter((value, index, self) => self.indexOf(value) === index); // 중복 제거

    categories.sort((a, b) => a.localeCompare(b, "ko"));
    return categories;
  }, [productItems]);

  // 상품 정렬 및 필터링
  const sortedProducts = useMemo(() => {
    if (!productItems || productItems.length === 0) return [];

    let products = [...productItems];

    if (selectedCategory) {
      products = products.filter(
        (product) => product.품목분류 === selectedCategory
      );
    }

    if (isSearchActive && searchText.trim().length > 0) {
      products = products.filter((product) =>
        product.품목명.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 협력사 이름과 품목명으로 정렬
    products.sort((a, b) => {
      if (a.협력사명 !== b.협력사명) {
        return a.협력사명.localeCompare(b.협력사명, "ko");
      }
      return a.품목명.localeCompare(b.품목명, "ko");
    });

    return products;
  }, [productItems, selectedCategory, isSearchActive, searchText]);

  // 항목 추가
  const addItem = (product: ProductItem) => {
    const existingItem = selectedItems.find(
      (item) => item.품목_id === product.품목_id
    );

    if (existingItem) {
      return; // 이미 있는 항목이면 추가하지 않음
    }

    const newItem: SelectedExpirationItem = {
      품목_id: product.품목_id,
      품목명: product.품목명,
      협력사명: product.협력사명,
      유통기한: new Date(), // 기본값으로 현재 날짜 설정
      창고_재고량: 1,
      customQuantity: "1",
    };

    setSelectedItems([...selectedItems, newItem]);
  };

  // 수량 업데이트
  const updateQuantity = (productId: string, increment: number) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        if (item.품목_id === productId) {
          const newQuantity = item.창고_재고량 + increment;
          const validQuantity = Math.max(1, newQuantity); // 최소값은 1
          return {
            ...item,
            창고_재고량: validQuantity,
            customQuantity: String(validQuantity),
          };
        }
        return item;
      })
    );
  };

  // 직접 수량 입력
  const updateCustomQuantity = (productId: string, text: string) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        if (item.품목_id === productId) {
          // 숫자만 입력 가능하도록 필터링
          const numericValue = text.replace(/[^0-9]/g, "");
          const quantity = numericValue === "" ? 0 : parseInt(numericValue, 10);

          return {
            ...item,
            창고_재고량: quantity,
            customQuantity: numericValue,
          };
        }
        return item;
      })
    );
  };

  // 항목 제거
  const removeItem = (productId: string) => {
    setSelectedItems((prevItems) =>
      prevItems.filter((item) => item.품목_id !== productId)
    );
  };

  // 날짜 선택 핸들러
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (selectedDate && selectedProductId) {
      setSelectedItems((prevItems) =>
        prevItems.map((item) => {
          if (item.품목_id === selectedProductId) {
            return {
              ...item,
              유통기한: selectedDate,
            };
          }
          return item;
        })
      );
    }
  };

  // 날짜 선택 모달 열기
  const openDatePicker = (productId: string) => {
    setSelectedProductId(productId);
    setShowDatePicker(true);
  };

  // 확인 버튼 핸들러
  const handleConfirmItems = () => {
    // 유효성 검사
    const invalidItems = selectedItems.filter(
      (item) => item.창고_재고량 <= 0 || !item.유통기한
    );

    if (invalidItems.length > 0) {
      Alert.alert(
        "입력 오류",
        "모든 항목의 수량과 유통기한을 올바르게 입력해주세요."
      );
      return;
    }

    setIsConfirmation(true);
  };

  // API용 날짜 포맷 함수
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  // 화면에 표시할 날짜 포맷 함수
  const formatDateForDisplay = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  // 최종 제출 핸들러
  const handleSubmitItems = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      // 각 항목을 서버에 제출
      const submissionPromises = selectedItems.map(async (item) => {
        const payload = {
          품목_id: item.품목_id,
          유통기한: formatDateForAPI(item.유통기한),
          창고_재고량: item.창고_재고량,
        };

        const response = await fetch(
          `${RN_API_URL}/api/inventory/warehouse_expiration_create/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "항목 추가 실패");
        }

        return await response.json();
      });

      await Promise.all(submissionPromises);

      // 성공 후 초기화 및 완료 콜백 호출
      Alert.alert("성공", "유통기한 항목이 성공적으로 추가되었습니다.", [
        { text: "확인", onPress: onAddComplete },
      ]);
    } catch (error) {
      console.error("항목 제출 오류:", error);
      Alert.alert(
        "오류",
        "항목 추가 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 제품 카드 렌더링
  const renderProductCard = (product: ProductItem) => {
    const selected = selectedItems.find(
      (item) => item.품목_id === product.품목_id
    );
    const cardStyle = selected
      ? [ItemAddPageStyle.selectItemCard, ItemAddPageStyle.selectedItemCard]
      : ItemAddPageStyle.selectItemCard;

    if (selected) {
      return (
        <View key={product.품목_id} style={cardStyle}>
          <View style={ItemAddPageStyle.cardContent}>
            <View style={ItemAddPageStyle.productInfoContainer}>
              <View style={ItemAddPageStyle.selectedItemRowContainer}>
                <View style={ItemAddPageStyle.nameWithFavoriteContainer}>
                  <Text style={ItemAddPageStyle.selectItemName}>
                    {product.품목명}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    ItemAddPageStyle.orderButton,
                    ItemAddPageStyle.cancelButton,
                  ]}
                  onPress={() => removeItem(product.품목_id)}
                >
                  <Text style={ItemAddPageStyle.cancelButtonText}>취소</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={ItemAddPageStyle.additionalRowContainer}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                  paddingHorizontal: moderateScale(10),
                }}
              >
                <View style={{ flex: 1, marginRight: moderateScale(10) }}>
                  <Text
                    style={{
                      fontSize: RFValue(13),
                      color: "#64748b",
                      marginBottom: moderateScale(5),
                    }}
                  >
                    유통기한
                  </Text>
                  <TouchableOpacity
                    style={ItemAddPageStyle.expirationInput}
                    onPress={() => openDatePicker(product.품목_id)}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ fontSize: RFValue(14), color: "#1e293b" }}>
                        {formatDateForDisplay(selected.유통기한)}
                      </Text>
                      <Calendar size={20} color="#64748b" />
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: RFValue(13),
                      color: "#64748b",
                      marginBottom: moderateScale(5),
                    }}
                  >
                    수량
                  </Text>
                  <View style={ItemAddPageStyle.quantityControlContainer}>
                    <TouchableOpacity
                      style={[
                        ItemAddPageStyle.quantityButton,
                        selected.창고_재고량 <= 1 &&
                          ItemAddPageStyle.disabledButton,
                      ]}
                      onPress={() => updateQuantity(product.품목_id, -1)}
                      disabled={selected.창고_재고량 <= 1}
                    >
                      <Minus color="#333" size={20} />
                    </TouchableOpacity>
                    <TextInput
                      style={ItemAddPageStyle.quantityText}
                      value={selected.customQuantity}
                      keyboardType="numeric"
                      onChangeText={(text) =>
                        updateCustomQuantity(product.품목_id, text)
                      }
                    />
                    <TouchableOpacity
                      style={ItemAddPageStyle.quantityButton}
                      onPress={() => updateQuantity(product.품목_id, 1)}
                    >
                      <Plus color="#333" size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    } else {
      return (
        <TouchableOpacity
          key={product.품목_id}
          style={cardStyle}
          onPress={() => addItem(product)}
        >
          <View style={ItemAddPageStyle.productCardContent}>
            <View style={ItemAddPageStyle.productCardRow}>
              <View style={ItemAddPageStyle.nameWithFavoriteContainer}>
                <Text style={ItemAddPageStyle.productName}>
                  {product.품목명}
                  {"\n"}
                  <Text style={{ fontSize: RFValue(12), color: "#64748b" }}>
                    {product.협력사명}
                  </Text>
                </Text>
              </View>
              <TouchableOpacity
                style={ItemAddPageStyle.orderButton}
                onPress={() => addItem(product)}
              >
                <Text style={ItemAddPageStyle.orderButtonText}>선택</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loading_Container}>
        <ActivityIndicator size="large" color="#0D326F80" />
        <Text style={styles.loading_Text}>로딩 중...</Text>
      </View>
    );
  }

  if (!isConfirmation) {
    return (
      <View style={ItemAddPageStyle.container}>
        <ScrollView
          contentContainerStyle={ItemAddPageStyle.scrollContainer}
          stickyHeaderIndices={[0]}
        >
          <View style={ItemAddPageStyle.fixedHeaderContainer}>
            <View style={ItemAddPageStyle.categorySection}>
              <Text style={ItemAddPageStyle.sectionTitle}>상품 유형 선택</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={ItemAddPageStyle.categoryList}
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  style={[
                    ItemAddPageStyle.categoryButton,
                    selectedCategory === null &&
                      ItemAddPageStyle.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text
                    style={[
                      ItemAddPageStyle.categoryButtonText,
                      selectedCategory === null &&
                        ItemAddPageStyle.categoryButtonTextActive,
                    ]}
                  >
                    전체
                  </Text>
                </TouchableOpacity>
                {sortedCategories.map((cat, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      ItemAddPageStyle.categoryButton,
                      selectedCategory === cat &&
                        ItemAddPageStyle.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[
                        ItemAddPageStyle.categoryButtonText,
                        selectedCategory === cat &&
                          ItemAddPageStyle.categoryButtonTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={ItemAddPageStyle.sectionContainer}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={ItemAddPageStyle.sectionTitle_2}>
                  상품 선택하기
                </Text>
                <TouchableOpacity
                  style={ItemAddPageStyle.searchIconContainer}
                  onPress={() => setIsSearchActive(!isSearchActive)}
                >
                  <Search
                    color="#0D326F"
                    style={ItemAddPageStyle.searchIconSize}
                  />
                </TouchableOpacity>
              </View>
              {isSearchActive && (
                <View style={ItemAddPageStyle.searchContainer}>
                  <Search
                    color="#64748b"
                    style={ItemAddPageStyle.searchIconSize}
                  />
                  <TextInput
                    style={ItemAddPageStyle.searchInput}
                    placeholder="상품명을 입력하세요"
                    value={searchText}
                    onChangeText={(text) => setSearchText(text)}
                    placeholderTextColor="#94a3b8"
                    autoFocus={true}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity
                      style={ItemAddPageStyle.searchIcon}
                      onPress={() => setSearchText("")}
                    >
                      <X
                        color="#64748b"
                        style={ItemAddPageStyle.searchIconSize}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <View style={ItemAddPageStyle.headerContainer}>
                <Text style={ItemAddPageStyle.item_headerText}>상품명</Text>
                <Text style={{ width: "10%" }}></Text>
              </View>
            </View>
          </View>
          <View style={ItemAddPageStyle.listContainer}>
            {sortedProducts.map((product) => renderProductCard(product))}
          </View>
        </ScrollView>
        <View style={ItemAddPageStyle.footerContainer}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <View style={{ flexDirection: "column" }}>
              <Text style={ItemAddPageStyle.footerPriceText}>
                {selectedItems.length > 0
                  ? `선택된 항목: ${selectedItems.length}개`
                  : "선택된 항목: 0개"}
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                style={[
                  ItemAddPageStyle.footerButton,
                  { backgroundColor: "#f1f5f9", marginRight: moderateScale(5) },
                ]}
                onPress={onCancel}
              >
                <Text
                  style={[
                    ItemAddPageStyle.footerButtonText,
                    { color: "#64748b" },
                  ]}
                >
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  ItemAddPageStyle.footerButton,
                  selectedItems.length === 0 &&
                    ItemAddPageStyle.footerButtonDisabled,
                ]}
                onPress={handleConfirmItems}
                disabled={selectedItems.length === 0}
              >
                <Text style={ItemAddPageStyle.footerButtonText}>항목확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
    );
  } else {
    // 확인 페이지
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={ItemAddPageStyle.confirm_selectedItemsSection}>
          <Text
            style={[
              ItemAddPageStyle.confirm_sectionTitle,
              { textAlign: "center" },
            ]}
          >
            최종 항목 확인
          </Text>
          {selectedItems.map((item) => (
            <View
              key={item.품목_id}
              style={[
                ItemAddPageStyle.confirmationItemRow,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: moderateScale(5),
                },
              ]}
            >
              <Text
                style={[ItemAddPageStyle.confirm_selectItemName, { flex: 2 }]}
              >
                {item.품목명}
              </Text>
              <Text
                style={[
                  ItemAddPageStyle.confirm_unitText,
                  { flex: 1, textAlign: "center" },
                ]}
              >
                {formatDateForDisplay(item.유통기한)}
              </Text>
              <Text
                style={[
                  ItemAddPageStyle.confirm_priceText,
                  { flex: 1, textAlign: "right" },
                ]}
              >
                {item.창고_재고량}개
              </Text>
            </View>
          ))}
          <TouchableOpacity
            style={ItemAddPageStyle.order_request_Button}
            onPress={handleSubmitItems}
            disabled={submitting}
          >
            <Text style={ItemAddPageStyle.order_request_ButtonText}>
              {submitting ? "처리 중..." : "항목 추가하기"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              ItemAddPageStyle.order_request_Button,
              { backgroundColor: "white" },
              { borderColor: "#0D326F" },
              { borderWidth: 1 },
              { marginTop: moderateScale(5) },
            ]}
            onPress={() => setIsConfirmation(false)}
            disabled={submitting}
          >
            <Text
              style={[
                ItemAddPageStyle.order_request_ButtonText,
                { color: "#0D326F" },
              ]}
            >
              뒤로가기
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
};

export default ExpirationItemAdd_warehouse;
