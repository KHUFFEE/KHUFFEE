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
  SafeAreaView,
} from "react-native";
import { Plus, Minus, X, Search, Calendar } from "lucide-react-native";
import { RN_API_URL } from "@env";
import { APIProduct, ViewType } from "../../src/components/ui/common/types";
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
import Layout_warehouse from "../../src/components/ui/Layout_warehouse";
import { useNavigation, useRoute } from "@react-navigation/native";

// 독립적인 페이지로 변경하므로 props 인터페이스 수정
interface ExpirationItemAddProps {}

interface ProductItem {
  품목_id: string;
  품목명: string;
  협력사명: string;
  단위: string;
  품목분류?: string;
  종류: string;
}

interface SelectedExpirationItem {
  품목_id: string;
  품목명: string;
  협력사명: string;
  유통기한: Date;
  창고_재고량: number;
  customQuantity: string;
  error?: string;
  yearInput?: string;
  monthInput?: string;
  dayInput?: string;
  batchId: string;
}

const ExpirationItemAdd_warehouse: React.FC<ExpirationItemAddProps> = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // route.params에서 필요한 데이터 추출
  const warehouseId = route.params?.warehouseId || "";
  const onReturn = route.params?.onReturn;

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

  // 성공 모달 상태 추가
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  // 에러 모달 상태 추가
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorItem, setErrorItem] = useState<SelectedExpirationItem | null>(
    null
  );

  // 현재 활성화된 뷰 상태 - 기본값을 'expiration'으로 설정
  const [activeView, setActiveView] = useState<ViewType>("expiration");

  // 뷰 변경 함수 - 화면 이동 처리
  const handleViewChange = (view: ViewType) => {
    // 하단 네비게이션 클릭 시 처리
    if (view !== activeView) {
      // 이전에는 handleCancel() 호출 후 setTimeout으로 처리했지만,
      // 이제 바로 직접 main으로 이동하면서 activeView 파라미터 전달
      navigation.navigate("main", { activeView: view });
    }
  };

  // 제품 목록 가져오기 - 소모품 제외
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${RN_API_URL}/api/suppliers/items/`);
        if (!response.ok)
          throw new Error("제품 데이터를 불러오는 중 오류 발생");
        const data = await response.json();

        // 소모품을 제외한 품목만 필터링
        const filteredData = data.filter(
          (item: ProductItem) => item.종류 !== "소모품"
        );
        setProductItems(filteredData);
      } catch (error) {
        console.error("제품 데이터 불러오기 오류:", error);
        Alert.alert("오류", "제품 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 카테고리 정렬 - 종류 필드 기준으로 유니크한 값만 추출
  const sortedCategories = useMemo(() => {
    if (!productItems || productItems.length === 0) return [];

    // 종류 필드에서 유니크한 값만 추출하고 정렬
    const categories = productItems
      .map((item) => item.종류)
      .filter((value, index, self) => value && self.indexOf(value) === index); // 중복 및 null/undefined 제거

    categories.sort((a, b) => a.localeCompare(b, "ko"));
    return categories;
  }, [productItems]);

  // 상품 정렬 및 필터링
  const sortedProducts = useMemo(() => {
    if (!productItems || productItems.length === 0) return [];

    let products = [...productItems];

    if (selectedCategory) {
      products = products.filter(
        (product) => product.종류 === selectedCategory
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
    const newItem: SelectedExpirationItem = {
      품목_id: product.품목_id,
      품목명: product.품목명,
      협력사명: product.협력사명,
      유통기한: new Date(), // 기본값으로 현재 날짜 설정
      창고_재고량: 1,
      customQuantity: "1",
      yearInput: new Date().getFullYear().toString(),
      monthInput: (new Date().getMonth() + 1).toString().padStart(2, "0"),
      dayInput: new Date().getDate().toString().padStart(2, "0"),
      batchId:
        Date.now().toString() + Math.random().toString(36).substring(2, 9), // 고유 ID 생성
    };

    setSelectedItems([...selectedItems, newItem]);
  };

  // 유통기한 년/월/일 필드 변경 핸들러
  const updateDateField = (
    batchId: string,
    field: "year" | "month" | "day",
    value: string
  ) => {
    // 숫자만 입력 가능하도록 필터링
    const numericValue = value.replace(/[^0-9]/g, "");

    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        if (item.batchId === batchId) {
          // 년/월/일 각 필드 업데이트
          const updatedItem = {
            ...item,
            [field === "year"
              ? "yearInput"
              : field === "month"
                ? "monthInput"
                : "dayInput"]: numericValue,
          };

          // 유효한 날짜인지 검사
          try {
            // 입력된 년/월/일 값 가져오기
            const year = parseInt(
              field === "year"
                ? numericValue
                : item.yearInput || new Date().getFullYear().toString()
            );
            const month =
              parseInt(
                field === "month"
                  ? numericValue
                  : item.monthInput || (new Date().getMonth() + 1).toString()
              ) - 1; // 0-11로 변환
            const day = parseInt(
              field === "day"
                ? numericValue
                : item.dayInput || new Date().getDate().toString()
            );

            // 유효한 날짜인지 확인
            const newDate = new Date(year, month, day);

            // 날짜가 유효한 경우에만 유통기한 업데이트
            if (!isNaN(newDate.getTime())) {
              updatedItem.유통기한 = newDate;
            }
          } catch (e) {
            // 유효하지 않은 날짜인 경우 유통기한은 변경하지 않음
            console.log("유효하지 않은 날짜 입력", e);
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  // 날짜 선택 모달 열기 (batchId 파라미터 추가)
  const openDatePicker = (batchId: string) => {
    const selectedItem = selectedItems.find((item) => item.batchId === batchId);
    if (selectedItem) {
      setSelectedDate(selectedItem.유통기한);
      setSelectedProductId(batchId); // 이제 batchId를 사용
      setShowDatePicker(true);
    }
  };

  // 날짜 선택 핸들러 (productId 대신 batchId 사용)
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (selectedDate && selectedProductId) {
      setSelectedItems((prevItems) =>
        prevItems.map((item) => {
          if (item.batchId === selectedProductId) {
            // batchId로 비교
            // 선택된 날짜의 년/월/일 값 업데이트
            return {
              ...item,
              유통기한: selectedDate,
              yearInput: selectedDate.getFullYear().toString(),
              monthInput: (selectedDate.getMonth() + 1)
                .toString()
                .padStart(2, "0"),
              dayInput: selectedDate.getDate().toString().padStart(2, "0"),
            };
          }
          return item;
        })
      );
    }
  };

  // 항목 제거 (productId 대신 batchId 사용)
  const removeItem = (batchId: string) => {
    setSelectedItems((prevItems) =>
      prevItems.filter((item) => item.batchId !== batchId)
    );
  };

  // 수량 업데이트 (productId 대신 batchId 사용)
  const updateQuantity = (batchId: string, increment: number) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        if (item.batchId === batchId) {
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

  // 직접 수량 입력 (productId 대신 batchId 사용)
  const updateCustomQuantity = (batchId: string, text: string) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) => {
        if (item.batchId === batchId) {
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

        const responseData = await response.json();

        if (!response.ok) {
          setErrorItem(item);
          setErrorMessage(responseData.message || "항목 추가에 실패했습니다.");
          setShowErrorModal(true);
          throw new Error(responseData.message || "항목 추가 실패");
        }

        return responseData;
      });

      await Promise.all(submissionPromises);

      // 성공 시 모달 표시
      setSuccessMessage("유통기한 항목이 성공적으로 추가되었습니다.");
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("항목 제출 오류:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // 에러 모달 닫기 핸들러
  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setErrorItem(null);
    setErrorMessage("");
  };

  // 에러 모달에서 유통기한 관리 페이지로 이동
  const handleNavigateToExpirationManagement = () => {
    setShowErrorModal(false);
    // 메인 화면으로 이동하면서 activeView를 'expiration'으로 설정
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "main",
          params: {
            activeView: "expiration",
            warehouseId: warehouseId,
          },
        },
      ],
    });
  };

  // 완료 버튼 핸들러 - 모달에서 사용
  const handleCompletionConfirm = () => {
    // 모달 닫기
    setShowSuccessModal(false);
    // onReturn 콜백 실행
    if (onReturn) {
      onReturn();
    }
    // 이전 화면으로 이동
    navigation.goBack();
  };

  // 취소 버튼 핸들러 - 이전 화면으로 이동
  const handleCancel = () => {
    navigation.goBack();
  };

  // 제품 카드 렌더링 수정 - 선택된 항목들 그룹화하여 표시
  const renderProductCard = (product: ProductItem) => {
    // 해당 상품의 모든 배치 항목 찾기
    const selectedBatches = selectedItems.filter(
      (item) => item.품목_id === product.품목_id
    );

    // 선택된 배치가 있는 경우
    if (selectedBatches.length > 0) {
      return (
        <View
          key={product.품목_id}
          style={[
            ItemAddPageStyle.selectItemCard,
            ItemAddPageStyle.selectedItemCard,
          ]}
          testID={"selectedItemCard"}
        >
          <View style={ItemAddPageStyle.cardContent} testID={"cardContent"}>
            <View
              style={ItemAddPageStyle.productInfoContainer}
              testID={"productInfoContainer"}
            >
              <View
                style={ItemAddPageStyle.selectedItemRowContainer}
                testID={"selectedItemRowContainer"}
              >
                <View
                  style={ItemAddPageStyle.nameWithFavoriteContainer}
                  testID={"nameWithFavoriteContainer"}
                >
                  <Text
                    style={ItemAddPageStyle.selectItemName}
                    testID={"selectItemName"}
                  >
                    {product.품목명}
                  </Text>
                </View>
                <TouchableOpacity
                  testID={"addBatchButton"}
                  style={[
                    ItemAddPageStyle.orderButton,
                    { backgroundColor: "#0D326F" },
                  ]}
                  onPress={() => addItem(product)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Plus size={14} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      기한 추가
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* 각 배치 항목 렌더링 */}
            {selectedBatches.map((batch, index) => (
              <View
                key={batch.batchId}
                style={{
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: "#e2e8f0",
                  paddingTop: index > 0 ? moderateScale(10) : 0,
                  marginTop: index > 0 ? moderateScale(10) : 0,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: moderateScale(10),
                    paddingHorizontal: moderateScale(10),
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "600",
                      fontSize: RFValue(13),
                      color: "#475569",
                    }}
                  >
                    항목 {index + 1}
                  </Text>
                  <TouchableOpacity
                    style={{
                      padding: moderateScale(5),
                    }}
                    onPress={() => removeItem(batch.batchId)}
                  >
                    <X size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    paddingHorizontal: moderateScale(10),
                  }}
                  testID={"rowContainer"}
                >
                  {/* 년/월/일 개별 입력 UI */}
                  <View
                    style={{ flex: 1, marginRight: moderateScale(10) }}
                    testID={"expirationInputContainer"}
                  >
                    <Text
                      style={{
                        fontSize: RFValue(13),
                        color: "#64748b",
                        marginBottom: moderateScale(5),
                      }}
                      testID={"expirationInputLabel"}
                    >
                      유통기한
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* 년 */}
                      <TextInput
                        style={{
                          height: moderateScale(40),
                          borderWidth: 1,
                          borderColor: "#cbd5e1",
                          borderRadius: moderateScale(6),
                          paddingHorizontal: moderateScale(5),
                          backgroundColor: "#ffffff",
                          textAlign: "center",
                          width: "32%",
                        }}
                        placeholder="년도"
                        value={batch.yearInput}
                        onChangeText={(text) =>
                          updateDateField(batch.batchId, "year", text)
                        }
                        keyboardType="numeric"
                        maxLength={4}
                      />

                      {/* 월 */}
                      <TextInput
                        style={{
                          height: moderateScale(40),
                          borderWidth: 1,
                          borderColor: "#cbd5e1",
                          borderRadius: moderateScale(6),
                          paddingHorizontal: moderateScale(5),
                          backgroundColor: "#ffffff",
                          textAlign: "center",
                          width: "32%",
                        }}
                        placeholder="월"
                        value={batch.monthInput}
                        onChangeText={(text) =>
                          updateDateField(batch.batchId, "month", text)
                        }
                        keyboardType="numeric"
                        maxLength={2}
                      />

                      {/* 일 */}
                      <TextInput
                        style={{
                          height: moderateScale(40),
                          borderWidth: 1,
                          borderColor: "#cbd5e1",
                          borderRadius: moderateScale(6),
                          paddingHorizontal: moderateScale(5),
                          backgroundColor: "#ffffff",
                          textAlign: "center",
                          width: "32%",
                        }}
                        placeholder="일"
                        value={batch.dayInput}
                        onChangeText={(text) =>
                          updateDateField(batch.batchId, "day", text)
                        }
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                  </View>

                  <View style={{ flex: 1 }} testID={"quantityContainer"}>
                    <Text
                      style={{
                        fontSize: RFValue(13),
                        color: "#64748b",
                        marginBottom: moderateScale(5),
                      }}
                      testID={"quantityLabel"}
                    >
                      수량
                    </Text>
                    <View
                      style={ItemAddPageStyle.quantityControlContainer}
                      testID={"quantityControlContainer"}
                    >
                      <TouchableOpacity
                        testID={"quantityButton_minus"}
                        style={[
                          ItemAddPageStyle.quantityButton,
                          batch.창고_재고량 <= 1 &&
                            ItemAddPageStyle.disabledButton,
                        ]}
                        onPress={() => updateQuantity(batch.batchId, -1)}
                        disabled={batch.창고_재고량 <= 1}
                      >
                        <Minus color="#333" size={20} testID={"minusIcon"} />
                      </TouchableOpacity>
                      <TextInput
                        testID={"quantityText"}
                        style={ItemAddPageStyle.quantityText}
                        value={batch.customQuantity}
                        keyboardType="numeric"
                        onChangeText={(text) =>
                          updateCustomQuantity(batch.batchId, text)
                        }
                      />
                      <TouchableOpacity
                        testID={"quantityButton_plus"}
                        style={ItemAddPageStyle.quantityButton}
                        onPress={() => updateQuantity(batch.batchId, 1)}
                      >
                        <Plus color="#333" size={20} testID={"plusIcon"} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    }

    // 선택되지 않은 일반 카드 렌더링
    const cardStyle = ItemAddPageStyle.selectItemCard;
    return (
      <TouchableOpacity
        key={product.품목_id}
        style={cardStyle}
        testID={"itemCard"}
        onPress={() => addItem(product)}
      >
        <View style={ItemAddPageStyle.cardContent} testID={"cardContent"}>
          <View
            style={ItemAddPageStyle.productInfoContainer}
            testID={"productInfoContainer"}
          >
            <View
              style={ItemAddPageStyle.selectedItemRowContainer}
              testID={"itemRowContainer"}
            >
              <View
                style={ItemAddPageStyle.nameWithFavoriteContainer}
                testID={"nameWithFavoriteContainer"}
              >
                <Text
                  style={ItemAddPageStyle.selectItemName}
                  testID={"selectItemName"}
                >
                  {product.품목명}
                </Text>
              </View>
              <Text
                style={{ fontSize: RFValue(12), color: "#64748b" }}
                testID={"suppplierName"}
              >
                {product.협력사명}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 실제 콘텐츠 렌더링
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loading_Container} testID={"loading_Container"}>
          <ActivityIndicator
            size="large"
            color="#0D326F80"
            testID={"activityIndicator"}
          />
          <Text style={styles.loading_Text} testID={"loading_Text"}>
            로딩 중...
          </Text>
        </View>
      );
    }

    if (!isConfirmation) {
      return (
        <View style={ItemAddPageStyle.container} testID={"container"}>
          <ScrollView
            contentContainerStyle={ItemAddPageStyle.scrollContainer}
            stickyHeaderIndices={[0]}
            testID={"scrollContainer"}
          >
            <View
              style={ItemAddPageStyle.fixedHeaderContainer}
              testID={"fixedHeaderContainer"}
            >
              <View
                style={ItemAddPageStyle.categorySection}
                testID={"categorySection"}
              >
                <Text
                  style={ItemAddPageStyle.sectionTitle}
                  testID={"sectionTitle"}
                >
                  상품 유형 선택
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={ItemAddPageStyle.categoryList}
                  contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "flex-start",
                    alignItems: "center",
                  }}
                  testID={"categoryList"}
                >
                  <TouchableOpacity
                    testID={"categoryButton_all"}
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
                      testID={"categoryButtonText_all"}
                    >
                      전체
                    </Text>
                  </TouchableOpacity>
                  {sortedCategories.map((cat, idx) => (
                    <TouchableOpacity
                      key={idx}
                      testID={`categoryButton_${cat}`}
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
                        testID={`categoryButtonText_${cat}`}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View
                style={ItemAddPageStyle.sectionContainer}
                testID={"sectionContainer"}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  testID={"rowContainer_header"}
                >
                  <Text
                    style={ItemAddPageStyle.sectionTitle_2}
                    testID={"sectionTitle_2"}
                  >
                    상품 선택하기
                  </Text>
                  <TouchableOpacity
                    testID={"searchIconContainer"}
                    style={ItemAddPageStyle.searchIconContainer}
                    onPress={() => setIsSearchActive(!isSearchActive)}
                  >
                    <Search
                      color="#0D326F"
                      style={ItemAddPageStyle.searchIconSize}
                      testID={"searchIcon"}
                    />
                  </TouchableOpacity>
                </View>
                {isSearchActive && (
                  <View
                    style={ItemAddPageStyle.searchContainer}
                    testID={"searchContainer"}
                  >
                    <Search
                      color="#64748b"
                      style={ItemAddPageStyle.searchIconSize}
                      testID={"searchIcon_small"}
                    />
                    <TextInput
                      testID={"searchInput"}
                      style={ItemAddPageStyle.searchInput}
                      placeholder="상품명을 입력하세요"
                      value={searchText}
                      onChangeText={(text) => setSearchText(text)}
                      placeholderTextColor="#94a3b8"
                      autoFocus={true}
                    />
                    {searchText.length > 0 && (
                      <TouchableOpacity
                        testID={"searchIcon_clear"}
                        style={ItemAddPageStyle.searchIcon}
                        onPress={() => setSearchText("")}
                      >
                        <X
                          color="#64748b"
                          style={ItemAddPageStyle.searchIconSize}
                          testID={"clearIcon"}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <View
                  style={ItemAddPageStyle.headerContainer}
                  testID={"headerContainer"}
                >
                  <Text
                    style={ItemAddPageStyle.item_headerText}
                    testID={"item_headerText"}
                  >
                    상품명
                  </Text>
                  <Text style={{ width: "10%" }} testID={"emptyText"}></Text>
                </View>
              </View>
            </View>
            <View
              style={ItemAddPageStyle.listContainer}
              testID={"listContainer"}
            >
              {sortedProducts.map((product) => renderProductCard(product))}
            </View>
          </ScrollView>
          <View
            style={ItemAddPageStyle.footerContainer}
            testID={"footerContainer"}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
              testID={"footerRowContainer"}
            >
              <View style={{ flexDirection: "column" }} testID={"footerColumn"}>
                <Text
                  style={ItemAddPageStyle.footerPriceText}
                  testID={"footerPriceText"}
                >
                  {selectedItems.length > 0
                    ? `선택된 항목: ${selectedItems.length}개`
                    : "선택된 항목: 0개"}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row" }}
                testID={"footerButtonsContainer"}
              >
                <TouchableOpacity
                  testID={"footerButton_cancel"}
                  style={[
                    ItemAddPageStyle.footerButton,
                    {
                      backgroundColor: "#f1f5f9",
                      marginRight: moderateScale(5),
                    },
                  ]}
                  onPress={handleCancel}
                >
                  <Text
                    style={[
                      ItemAddPageStyle.footerButtonText,
                      { color: "#64748b" },
                    ]}
                    testID={"footerButtonText_cancel"}
                  >
                    취소
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID={"footerButton_confirm"}
                  style={[
                    ItemAddPageStyle.footerButton,
                    selectedItems.length === 0 &&
                      ItemAddPageStyle.footerButtonDisabled,
                  ]}
                  onPress={handleConfirmItems}
                  disabled={selectedItems.length === 0}
                >
                  <Text
                    style={ItemAddPageStyle.footerButtonText}
                    testID={"footerButtonText_confirm"}
                  >
                    항목확인
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {showDatePicker && (
            <DateTimePicker
              testID={"dateTimePicker"}
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
        <ScrollView
          style={{ flex: 1, backgroundColor: "#fff" }}
          testID={"confirmationScrollView"}
        >
          <View
            style={ItemAddPageStyle.confirm_selectedItemsSection}
            testID={"confirm_selectedItemsSection"}
          >
            <Text
              style={[
                ItemAddPageStyle.confirm_sectionTitle,
                { textAlign: "center" },
              ]}
              testID={"confirm_sectionTitle"}
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
                testID={"confirmationItemRow"}
              >
                <Text
                  style={[ItemAddPageStyle.confirm_selectItemName, { flex: 2 }]}
                  testID={"confirm_selectItemName"}
                >
                  {item.품목명}
                </Text>
                <Text
                  style={[
                    ItemAddPageStyle.confirm_unitText,
                    { flex: 1, textAlign: "center" },
                  ]}
                  testID={"confirm_unitText"}
                >
                  {formatDateForDisplay(item.유통기한)}
                </Text>
                <Text
                  style={[
                    ItemAddPageStyle.confirm_priceText,
                    { flex: 1, textAlign: "right" },
                  ]}
                  testID={"confirm_priceText"}
                >
                  {item.창고_재고량}개
                </Text>
              </View>
            ))}
            <TouchableOpacity
              testID={"order_request_Button"}
              style={ItemAddPageStyle.order_request_Button}
              onPress={handleSubmitItems}
              disabled={submitting}
            >
              <Text
                style={ItemAddPageStyle.order_request_ButtonText}
                testID={"order_request_ButtonText"}
              >
                {submitting ? "처리 중..." : "항목 추가하기"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={"backButton"}
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
                testID={"backButtonText"}
              >
                뒤로가기
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }
  };

  // 성공 모달 렌더링
  const renderSuccessModal = () => {
    return (
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>완료</Text>
            <Text
              style={[
                modalStyles.modalText,
                { marginBottom: moderateScale(10) },
              ]}
            >
              {successMessage}
            </Text>
            <View
              style={{
                width: "100%",
                marginTop: moderateScale(15),
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "#0D326F",
                  paddingVertical: moderateScale(12),
                  paddingHorizontal: moderateScale(10),
                  borderRadius: moderateScale(10),
                  width: "100%",
                  alignItems: "center",
                }}
                onPress={handleCompletionConfirm}
              >
                <Text
                  style={{
                    fontSize: RFValue(15),
                    fontWeight: "600",
                    color: "#ffffff",
                  }}
                >
                  확인
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // 에러 모달 렌더링
  const renderErrorModal = () => {
    return (
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleErrorModalClose}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={[modalStyles.modalTitle, { color: "#ef4444" }]}>
              알림
            </Text>
            <Text
              style={[
                modalStyles.modalText,
                { marginBottom: moderateScale(10) },
              ]}
            >
              {errorMessage}
            </Text>
            {errorItem && (
              <View style={{ width: "100%", marginBottom: moderateScale(15) }}>
                <Text
                  style={{
                    fontSize: RFValue(13),
                    color: "#64748b",
                    marginBottom: moderateScale(5),
                  }}
                >
                  상품 정보
                </Text>
                <View
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: moderateScale(10),
                    borderRadius: moderateScale(6),
                  }}
                >
                  <Text
                    style={{
                      fontSize: RFValue(14),
                      color: "#1e293b",
                      fontWeight: "500",
                    }}
                  >
                    {errorItem.품목명}
                  </Text>
                  <Text
                    style={{
                      fontSize: RFValue(13),
                      color: "#64748b",
                      marginTop: moderateScale(4),
                    }}
                  >
                    유통기한: {formatDateForDisplay(errorItem.유통기한)}
                  </Text>
                </View>
              </View>
            )}
            <View style={{ width: "100%", marginTop: moderateScale(15) }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#0D326F",
                  paddingVertical: moderateScale(12),
                  paddingHorizontal: moderateScale(10),
                  borderRadius: moderateScale(10),
                  width: "100%",
                  alignItems: "center",
                  marginBottom: moderateScale(8),
                }}
                onPress={handleNavigateToExpirationManagement}
              >
                <Text
                  style={{
                    fontSize: RFValue(15),
                    fontWeight: "600",
                    color: "#ffffff",
                  }}
                >
                  유통기한 관리로 이동
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#f1f5f9",
                  paddingVertical: moderateScale(12),
                  paddingHorizontal: moderateScale(10),
                  borderRadius: moderateScale(10),
                  width: "100%",
                  alignItems: "center",
                }}
                onPress={handleErrorModalClose}
              >
                <Text
                  style={{
                    fontSize: RFValue(15),
                    fontWeight: "600",
                    color: "#64748b",
                  }}
                >
                  닫기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Layout_warehouse
        storeName="창고"
        activeView={activeView}
        setActiveView={handleViewChange}
      >
        {renderContent()}
        {renderSuccessModal()}
        {renderErrorModal()}
      </Layout_warehouse>
    </SafeAreaView>
  );
};

export default ExpirationItemAdd_warehouse;
