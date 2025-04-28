import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert,
  Keyboard,
} from "react-native";
import { RN_API_URL } from "@env";
import { APIProduct, ViewType } from "../../src/components/ui/common/types";
import {
  Search,
  X,
  ArrowDownUp,
  Plus,
  Edit2,
  Trash2,
  Save,
  XCircle,
  Minus,
  Calendar,
} from "lucide-react-native";
import { moderateScale, scale } from "react-native-size-matters";
import { RFValue } from "react-native-responsive-fontsize";
import {
  styles,
  headerRowStyles,
} from "../../src/styles/ExpirationMangaement_warehouse";
import {
  OrderRequeststyle,
  modalStyles,
} from "../../src/styles/StockManagement_styles_warehouse";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import ExpirationItemAdd_warehouse from "./ExpirationItemAdd_warehouse";
import { useRouter } from "expo-router";

interface ExpirationManagementProps {
  warehouseId: string;
  activeView?: ViewType;
  setActiveView?: (view: ViewType) => void;
}

interface ExpirationItem {
  품목_id: string;
  품목명: string;
  협력사명: string;
  유통기한: string;
  창고_재고량: number;
  현재고: number;
}

interface FormData {
  품목_id: string;
  유통기한: Date;
  창고_재고량: string;
}

// 날짜 문자열을 JS Date 객체로 변환하는 함수 (YYYY.MM.DD → YYYY-MM-DD)
function parseDateStringToJSDate(dateString: string): Date {
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateString)) {
    // "YYYY.MM.DD"를 "YYYY-MM-DD"로 변환
    const replaced = dateString.replace(/\./g, "-");
    return new Date(replaced);
  }
  return new Date(dateString);
}

// 화면에 날짜를 "YY.MM.DD"로 표시하기 위한 포맷 함수
function formatDateForDisplay(dateString: string): string {
  const date = parseDateStringToJSDate(dateString);
  if (isNaN(date.getTime())) {
    return ""; // 잘못된 날짜일 경우 빈 문자열 처리
  }
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}.${month}.${day}`;
}

// 남은 일수 계산 함수
const calculateDaysRemaining = (expirationDate: string): string => {
  const expDate = parseDateStringToJSDate(expirationDate);
  const today = new Date();
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "만료";
  } else if (diffDays === 0) {
    return "만료";
  } else if (diffDays <= 30) {
    return `${diffDays.toString().padStart(2, "0")}일`;
  } else {
    let months =
      (expDate.getFullYear() - today.getFullYear()) * 12 +
      (expDate.getMonth() - today.getMonth());

    if (today.getDate() > expDate.getDate()) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const remainingDays =
        lastMonth.getDate() - today.getDate() + expDate.getDate();
      return `${months}개월 ${remainingDays.toString().padStart(2, "0")}일`;
    } else {
      const remainingDays = expDate.getDate() - today.getDate();
      return `${months}개월 ${remainingDays.toString().padStart(2, "0")}일`;
    }
  }
};

// 숫자 포맷팅 함수
const formatNumber = (num: number | string): string => {
  if (typeof num === "string") {
    num = parseFloat(num);
  }
  return isNaN(num)
    ? "0"
    : num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// 유통기한 글자색
const getExpirationTextColor = (expirationDate: string) => {
  const today = new Date();
  const expDate = parseDateStringToJSDate(expirationDate);
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 30) return "#ef4444";
  return "#64748b";
};

const ExpirationManagement_warehouse: React.FC<ExpirationManagementProps> = ({
  warehouseId,
  activeView,
  setActiveView,
}) => {
  const [expirationData, setExpirationData] = useState<ExpirationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredData, setFilteredData] = useState<ExpirationItem[]>([]);
  const [sortBy, setSortBy] = useState<"date">("date");
  const [products, setProducts] = useState<APIProduct[]>([]);
  const [currentStockData, setCurrentStockData] = useState<{
    [key: string]: number;
  }>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);

  // 추가/수정/삭제 관련 상태
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedItem, setSelectedItem] = useState<ExpirationItem | null>(null);
  const [formData, setFormData] = useState<FormData>({
    품목_id: "",
    유통기한: new Date(),
    창고_재고량: "",
  });
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [datePickerYear, setDatePickerYear] = useState<number>(
    new Date().getFullYear()
  );
  const [datePickerMonth, setDatePickerMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [datePickerDay, setDatePickerDay] = useState<number>(
    new Date().getDate()
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] =
    useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<ExpirationItem | null>(null);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] =
    useState<boolean>(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string>("");

  // 항목 추가 화면 모달
  const [showAddItemScreen, setShowAddItemScreen] = useState<boolean>(false);

  const router = useRouter();

  // 데이터 로딩 함수
  const fetchData = useCallback(async () => {
    if (!warehouseId) return;

    try {
      setLoading(true);
      const [itemsResponse, stockResponse, expirationResponse] =
        await Promise.all([
          fetch(`${RN_API_URL}/api/suppliers/items/`),
          fetch(`${RN_API_URL}/api/inventory/warehouse/`),
          fetch(`${RN_API_URL}/api/inventory/warehouse_expiration_list/`),
        ]);

      if (!itemsResponse.ok || !stockResponse.ok || !expirationResponse.ok) {
        throw new Error("데이터를 가져오는데 실패했습니다.");
      }

      const [itemsData, stockData, expirationData] = await Promise.all([
        itemsResponse.json(),
        stockResponse.json(),
        expirationResponse.json(),
      ]);

      const filteredItems = itemsData.filter(
        (item: APIProduct) => item.종류 !== "소모품"
      );
      setProducts(filteredItems);

      const stockMap: { [key: string]: number } = {};
      stockData.forEach((item: any) => {
        stockMap[item.품목_id] = item.창고_재고량;
      });
      setCurrentStockData(stockMap);

      const mergedData: ExpirationItem[] = expirationData.map((exp: any) => {
        const matchedProduct = filteredItems.find(
          (item: APIProduct) => item.품목_id === exp.품목_id
        );
        return {
          품목_id: exp.품목_id,
          품목명: matchedProduct?.품목명 || "알 수 없는 상품",
          협력사명: matchedProduct?.협력사명 || "알 수 없는 협력사",
          유통기한: exp.유통기한,
          창고_재고량: exp.창고_재고량 || 0,
          현재고: stockMap[exp.품목_id] || 0,
        };
      });

      setExpirationData(mergedData);
      setFilteredData(mergedData);
    } catch (error) {
      console.error("데이터 조회 중 오류:", error);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  // 협력사 데이터 로딩
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch(`${RN_API_URL}/api/suppliers/`);
        if (!response.ok)
          throw new Error("협력사 데이터를 불러오는데 실패했습니다.");
        const data = await response.json();
        setSuppliersData(data);
      } catch (error) {
        console.error("협력사 데이터 로딩 중 오류:", error);
      }
    };
    fetchSuppliers();
  }, []);

  // 초기 데이터 로딩
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 정렬된 협력사 목록
  const sortedSuppliers = useMemo(() => {
    const suppliers = suppliersData.map((supplier) => supplier.협력사명 || "");
    return suppliers.sort((a, b) => a.localeCompare(b, "ko"));
  }, [suppliersData]);

  // 필터링 및 정렬 로직
  useEffect(() => {
    let filtered = [...expirationData];

    if (selectedCategory) {
      filtered = filtered.filter((item) => item.협력사명 === selectedCategory);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.품목명.toLowerCase().includes(query) ||
          item.협력사명.toLowerCase().includes(query)
      );
    }

    if (sortBy === "date") {
      filtered.sort((a, b) => {
        if (a.협력사명 !== b.협력사명) {
          return a.협력사명.localeCompare(b.협력사명);
        }
        if (a.품목명 !== b.품목명) {
          return a.품목명.localeCompare(b.품목명);
        }
        // 날짜 비교 시 parseDateStringToJSDate를 통해 변환
        return (
          parseDateStringToJSDate(a.유통기한).getTime() -
          parseDateStringToJSDate(b.유통기한).getTime()
        );
      });
    }

    setFilteredData(filtered);
  }, [searchQuery, expirationData, sortBy, selectedCategory]);

  // 편집모드 시 유통기한 스타일
  const getExpirationStyle = (expirationDate: string) => {
    const today = new Date();
    const expDate = parseDateStringToJSDate(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return styles.expired;
    if (diffDays <= 7) return styles.nearExpiration;
    if (diffDays <= 30) return styles.warning;
    return styles.normal;
  };

  // 날짜 포맷팅(YY.MM.DD)
  const formatDate = useCallback((dateString: string) => {
    return formatDateForDisplay(dateString);
  }, []);

  const handleAddItem = () => {
    try {
      // 가장 기본적인 형태의 라우팅 사용
      router.push(`/ExpirationItemAdd_warehouse?warehouseId=${warehouseId}`);

      // 디버깅용 Alert 추가
      Alert.alert(
        "라우팅 시도",
        `ExpirationItemAdd_warehouse로 이동을 시도합니다. warehouseId: ${warehouseId}`
      );
    } catch (error) {
      console.error("페이지 이동 실패:", error);
      Alert.alert("오류", "페이지 이동 중 문제가 발생했습니다.");
    }
  };

  const handleEditItem = (item: ExpirationItem) => {
    setModalMode("edit");
    setSelectedItem(item);
    setFormData({
      품목_id: item.품목_id,
      유통기한: parseDateStringToJSDate(item.유통기한),
      창고_재고량: item.창고_재고량.toString(),
    });
    setShowModal(true);
  };

  const handleDateChange = (selectedDate: Date) => {
    setFormData({
      ...formData,
      유통기한: selectedDate,
    });
    setDatePickerYear(selectedDate.getFullYear());
    setDatePickerMonth(selectedDate.getMonth() + 1);
    setDatePickerDay(selectedDate.getDate());
    setShowDatePicker(false);
  };

  const handleDeleteItem = async (item: ExpirationItem) => {
    setItemToDelete(item);
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);

      const dateObj = parseDateStringToJSDate(itemToDelete.유통기한);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const formattedDate = `${year}.${month}.${day}`;

      const response = await fetch(
        `${RN_API_URL}/api/inventory/warehouse_expiration_delete/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            품목_id: itemToDelete.품목_id,
            유통기한: formattedDate,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "항목 삭제에 실패했습니다.");
      }

      await refreshData();
      setDeleteSuccessMessage("항목이 성공적으로 삭제되었습니다.");
      setShowDeleteSuccessModal(true);
    } catch (error) {
      console.error("삭제 중 오류:", error);
      Alert.alert("오류", "항목 삭제 중 오류가 발생했습니다.");
    } finally {
      setShowDeleteConfirmModal(false);
      setItemToDelete(null);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.품목_id || !formData.창고_재고량) {
      Alert.alert("오류", "모든 필드를 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      Keyboard.dismiss();

      const endpoint =
        modalMode === "add"
          ? `${RN_API_URL}/api/inventory/warehouse_expiration_create/`
          : `${RN_API_URL}/api/inventory/warehouse_expiration_update/`;

      // 날짜 형식을 yyyy.MM.dd 형식으로 포맷팅
      const year = formData.유통기한.getFullYear();
      const month = String(formData.유통기한.getMonth() + 1).padStart(2, "0");
      const day = String(formData.유통기한.getDate()).padStart(2, "0");
      const formattedDate = `${year}.${month}.${day}`;

      const payload = {
        품목_id: formData.품목_id,
        유통기한: formattedDate,
        창고_재고량: parseInt(formData.창고_재고량),
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`요청 실패: ${response.status}`);
      }

      setShowModal(false);
      await refreshData();

      const successMsg =
        modalMode === "add"
          ? "새 항목이 성공적으로 추가되었습니다."
          : "항목이 성공적으로 수정되었습니다.";

      setDeleteSuccessMessage(successMsg);
      setShowDeleteSuccessModal(true);
    } catch (error) {
      console.error("제출 중 오류:", error);
      Alert.alert("오류", "데이터 제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);

      const expirationResponse = await fetch(
        `${RN_API_URL}/api/inventory/warehouse_expiration_list/`
      );

      if (!expirationResponse.ok) {
        throw new Error("유통기한 데이터를 가져오는데 실패했습니다.");
      }

      const expirationData = await expirationResponse.json();

      const mergedData: ExpirationItem[] = expirationData.map((exp: any) => {
        const matchedProduct = products.find(
          (item: APIProduct) => item.품목_id === exp.품목_id
        );
        return {
          품목_id: exp.품목_id,
          품목명: matchedProduct?.품목명 || "알 수 없는 상품",
          협력사명: matchedProduct?.협력사명 || "알 수 없는 협력사",
          유통기한: exp.유통기한,
          창고_재고량: exp.창고_재고량 || 0,
          현재고: currentStockData[exp.품목_id] || 0,
        };
      });

      setExpirationData(mergedData);
      setFilteredData(mergedData);
    } catch (error) {
      console.error("데이터 새로고침 중 오류:", error);
      Alert.alert("오류", "데이터를 새로고침하는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const updatePromises = expirationData.map(async (item) => {
        // 유통기한이 이미 YYYY.MM.DD 형식인지 확인하고 아니면 변환
        const dateObj = parseDateStringToJSDate(item.유통기한);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const formattedDate = `${year}.${month}.${day}`;

        const payload = {
          품목_id: item.품목_id,
          유통기한: formattedDate,
          창고_재고량: item.창고_재고량,
        };

        const response = await fetch(
          `${RN_API_URL}/api/inventory/warehouse_expiration_update/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error(`저장 실패: ${item.품목명}`);
        }

        return response.json();
      });

      await Promise.all(updatePromises);
      await refreshData();
      setIsEditMode(false);
      setDeleteSuccessMessage("모든 변경사항이 성공적으로 저장되었습니다.");
      setShowDeleteSuccessModal(true);
    } catch (error) {
      console.error("저장 중 오류:", error);
      Alert.alert("오류", "저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 수량 증가
  const handleIncrement = (item: ExpirationItem) => {
    setExpirationData((prev) =>
      prev.map((exp) =>
        exp.품목_id === item.품목_id && exp.유통기한 === item.유통기한
          ? { ...exp, 창고_재고량: exp.창고_재고량 + 1 }
          : exp
      )
    );
  };

  // 수량 감소
  const handleDecrement = (item: ExpirationItem) => {
    setExpirationData((prev) =>
      prev.map((exp) =>
        exp.품목_id === item.품목_id && exp.유통기한 === item.유통기한
          ? { ...exp, 창고_재고량: Math.max(0, exp.창고_재고량 - 1) }
          : exp
      )
    );
  };

  // 수량 직접 변경
  const handleQuantityChange = (item: ExpirationItem, value: string) => {
    const numericValue = parseInt(value.replace(/,/g, ""));
    if (!isNaN(numericValue)) {
      setExpirationData((prev) =>
        prev.map((exp) =>
          exp.품목_id === item.품목_id && exp.유통기한 === item.유통기한
            ? { ...exp, 창고_재고량: numericValue }
            : exp
        )
      );
    }
  };

  // 테이블 헤더
  const renderTableHeader = useMemo(
    () => (
      <View testID="tableHeader" style={styles.tableHeader}>
        <Text
          testID="productCell"
          style={[styles.headerText, styles.productCell]}
        >
          상품명
        </Text>
        <Text
          testID="dateCell"
          style={[styles.headerText, styles.dateCell, { right: wp(5) }]}
        >
          유통기한
        </Text>
        <Text
          testID="stockCell"
          style={[
            styles.headerText,
            styles.stockCell,
            isEditMode && { opacity: 0 },
          ]}
        >
          현재고
        </Text>
        <Text
          testID="quantityCell"
          style={[
            styles.headerText,
            styles.quantityCell,
            isEditMode && { right: wp(10) },
          ]}
        >
          개수
        </Text>
      </View>
    ),
    [isEditMode]
  );

  // 협력사별 데이터 그룹화
  const groupedData = useMemo(() => {
    const groups: { [key: string]: ExpirationItem[] } = {};
    filteredData.forEach((item) => {
      if (!groups[item.협력사명]) {
        groups[item.협력사명] = [];
      }
      groups[item.협력사명].push(item);
    });
    return groups;
  }, [filteredData]);

  // 협력사 섹션 렌더링
  const renderSupplierSection = useCallback(
    (supplier: string, items: ExpirationItem[]) => {
      return (
        <View key={supplier}>
          <View testID="supplierHeader" style={styles.supplierHeader}>
            <Text testID="supplierHeaderText" style={styles.supplierHeaderText}>
              {supplier}
            </Text>
          </View>
          <View testID="supplierContent" style={styles.supplierContent}>
            {items.map((item, index) => (
              <View
                key={`${item.품목_id}-${item.유통기한}-${index}`}
                testID={index % 2 === 0 ? "evenRow" : "oddRow"}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.evenRow : styles.oddRow,
                ]}
              >
                <View testID="productCell" style={styles.productCell}>
                  <Text testID="productName" style={styles.productName}>
                    {item.품목명}
                  </Text>
                </View>
                <View
                  testID="dateCell"
                  style={[styles.dateCell, { right: wp(5) }]}
                >
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>
                      {formatDate(item.유통기한)}
                    </Text>
                    <Text
                      testID={(() => {
                        const daysRemaining = calculateDaysRemaining(
                          item.유통기한
                        );
                        return daysRemaining === "만료" ||
                          (daysRemaining.includes("일") &&
                            parseInt(daysRemaining) <= 30)
                          ? "warning"
                          : "normal";
                      })()}
                      style={[
                        styles.daysRemainingText,
                        { color: getExpirationTextColor(item.유통기한) },
                      ]}
                    >
                      {calculateDaysRemaining(item.유통기한)}
                    </Text>
                  </View>
                </View>
                <Text
                  testID="stockCell"
                  style={[
                    styles.cellText,
                    styles.stockCell,
                    isEditMode && { opacity: 0 },
                  ]}
                >
                  {item.현재고}
                </Text>
                {isEditMode ? (
                  <View
                    testID="controlContainer"
                    style={[
                      styles.quantityCell,
                      styles.controlContainer,
                      { right: wp(13) },
                    ]}
                  >
                    <View
                      style={[
                        { height: moderateScale(28) },
                        styles.inputContainer,
                      ]}
                    >
                      <TouchableOpacity
                        testID="leftButton"
                        style={[styles.controlButton, styles.leftButton]}
                        onPress={() => handleDecrement(item)}
                      >
                        <Minus size={14} color="#0A2A5E" />
                      </TouchableOpacity>
                      <TextInput
                        testID="quantityInput"
                        style={[
                          styles.quantityInput,
                          {
                            width: moderateScale(50),
                          },
                        ]}
                        value={formatNumber(item.창고_재고량)}
                        onChangeText={(text) =>
                          handleQuantityChange(item, text)
                        }
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        testID="rightButton"
                        style={[styles.controlButton, styles.rightButton]}
                        onPress={() => handleIncrement(item)}
                      >
                        <Plus size={14} color="#0A2A5E" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="deleteButton"
                        style={[
                          styles.deleteButton,
                          { position: "absolute", left: wp(20) },
                        ]}
                        onPress={() => handleDeleteItem(item)}
                      >
                        <Trash2 size={12} color="#e53e3e" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text
                    testID="quantityCell"
                    style={[styles.cellText, styles.quantityCell]}
                  >
                    {item.창고_재고량}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      );
    },
    [isEditMode, formatDate]
  );

  // FlatList용 데이터
  const listData = useMemo(() => {
    return Object.entries(groupedData).map(([supplier, items]) => ({
      supplier,
      items,
    }));
  }, [groupedData]);

  // 커스텀 DatePicker
  const renderCustomDatePicker = () => {
    if (!showDatePicker) return null;

    const years = Array.from(
      { length: 10 },
      (_, i) => new Date().getFullYear() + i
    );
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const daysInMonth = new Date(datePickerYear, datePickerMonth, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { padding: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>날짜 선택</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDatePicker(false)}
              >
                <XCircle size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginVertical: 20,
              }}
            >
              {/* 년도 선택 */}
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>년도</Text>
                <ScrollView style={[styles.pickerScrollView, { height: 150 }]}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={`year-${year}`}
                      style={[
                        styles.productItem,
                        datePickerYear === year && styles.selectedProductItem,
                      ]}
                      onPress={() => setDatePickerYear(year)}
                    >
                      <Text
                        style={
                          datePickerYear === year
                            ? styles.selectedProductText
                            : styles.productItemText
                        }
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* 월 선택 */}
              <View style={{ flex: 1, marginHorizontal: 5 }}>
                <Text style={styles.label}>월</Text>
                <ScrollView style={[styles.pickerScrollView, { height: 150 }]}>
                  {months.map((month) => (
                    <TouchableOpacity
                      key={`month-${month}`}
                      style={[
                        styles.productItem,
                        datePickerMonth === month && styles.selectedProductItem,
                      ]}
                      onPress={() => setDatePickerMonth(month)}
                    >
                      <Text
                        style={
                          datePickerMonth === month
                            ? styles.selectedProductText
                            : styles.productItemText
                        }
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* 일 선택 */}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.label}>일</Text>
                <ScrollView style={[styles.pickerScrollView, { height: 150 }]}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={[
                        styles.productItem,
                        datePickerDay === day && styles.selectedProductItem,
                      ]}
                      onPress={() => setDatePickerDay(day)}
                    >
                      <Text
                        style={
                          datePickerDay === day
                            ? styles.selectedProductText
                            : styles.productItemText
                        }
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  const selectedDate = new Date(
                    datePickerYear,
                    datePickerMonth - 1,
                    datePickerDay
                  );
                  handleDateChange(selectedDate);
                }}
              >
                <Text style={styles.submitButtonText}>선택</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View testID="loadingContainer" style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D326F" />
        <Text testID="loadingText" style={styles.loadingText}>
          로딩중...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View testID="categorySection" style={OrderRequeststyle.categorySection}>
        <Text testID="sectionTitle" style={OrderRequeststyle.sectionTitle}>
          협력사 선택
        </Text>
        <ScrollView
          testID="categoryList"
          horizontal
          showsHorizontalScrollIndicator={false}
          style={OrderRequeststyle.categoryList}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            testID={
              selectedCategory === null
                ? "categoryButtonActive"
                : "categoryButton"
            }
            style={[
              OrderRequeststyle.categoryButton,
              selectedCategory === null &&
                OrderRequeststyle.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              testID={
                selectedCategory === null
                  ? "categoryButtonTextActive"
                  : "categoryButtonText"
              }
              style={[
                OrderRequeststyle.categoryButtonText,
                selectedCategory === null &&
                  OrderRequeststyle.categoryButtonTextActive,
              ]}
            >
              전체
            </Text>
          </TouchableOpacity>
          {sortedSuppliers.map((supplier, idx) => (
            <TouchableOpacity
              key={idx}
              testID={
                selectedCategory === supplier
                  ? "categoryButtonActive"
                  : "categoryButton"
              }
              style={[
                OrderRequeststyle.categoryButton,
                selectedCategory === supplier &&
                  OrderRequeststyle.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(supplier)}
            >
              <Text
                testID={
                  selectedCategory === supplier
                    ? "categoryButtonTextActive"
                    : "categoryButtonText"
                }
                style={[
                  OrderRequeststyle.categoryButtonText,
                  selectedCategory === supplier &&
                    OrderRequeststyle.categoryButtonTextActive,
                ]}
              >
                {supplier}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View testID="filterContainer" style={styles.filterContainer}>
        <View testID="searchContainer" style={styles.searchContainer}>
          <Search color="#0D326F" size={20} />
          <TextInput
            testID="searchInput"
            style={styles.searchInput}
            placeholder="상품명 또는 협력사로 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              testID="clearButton"
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <X color="#0D326F" size={20} />
            </TouchableOpacity>
          )}
        </View>
        <View testID="container" style={headerRowStyles.container}>
          <View
            testID="buttonContainer"
            style={headerRowStyles.buttonContainer}
          >
            {!isEditMode ? (
              <>
                <TouchableOpacity
                  testID="addButton"
                  style={headerRowStyles.smallButton}
                  onPress={handleAddItem}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Plus
                      size={14}
                      color="#0D326F"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={headerRowStyles.buttonText}>항목 추가</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="editButton"
                  style={headerRowStyles.smallButton}
                  onPress={toggleEditMode}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Edit2
                      size={14}
                      color="#0D326F"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={headerRowStyles.buttonText}>편집모드</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  testID="cancelButton"
                  style={[
                    headerRowStyles.cancelButton,
                    {
                      flex: 1,
                      marginRight: moderateScale(10),
                      maxWidth: "45%",
                    },
                  ]}
                  onPress={toggleEditMode}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={headerRowStyles.cancelButtonText}>취소</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="saveButton"
                  style={[
                    headerRowStyles.activeButton,
                    {
                      flex: 1,
                      marginLeft: moderateScale(10),
                      maxWidth: "45%",
                    },
                  ]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Save
                      size={14}
                      color="#FFFFFF"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={headerRowStyles.activeButtonText}>저장</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      <View
        testID="tableContainer"
        style={[{ flex: 1 }, styles.tableContainer]}
      >
        {renderTableHeader}

        {listData.length === 0 ? (
          <Text testID="emptyText" style={styles.emptyText}>
            유통기한 데이터가 없습니다.
          </Text>
        ) : (
          <FlatList
            testID="flatListStyle"
            data={listData}
            style={[{ flex: 1 }, styles.flatListStyle]}
            contentContainerStyle={{ flexGrow: 1 }}
            renderItem={({ item }) =>
              renderSupplierSection(item.supplier, item.items)
            }
            keyExtractor={(item) => item.supplier}
            ListEmptyComponent={() => (
              <Text testID="emptyText" style={styles.emptyText}>
                유통기한 데이터가 없습니다.
              </Text>
            )}
          />
        )}
      </View>

      {renderCustomDatePicker()}

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View testID="modalCenteredView" style={modalStyles.centeredView}>
          <View
            testID="modalContainer"
            style={[
              modalStyles.modalView,
              { paddingBottom: moderateScale(20) },
            ]}
          >
            <View
              testID="modalHeader"
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottomWidth: 1,
                borderBottomColor: "#e2e8f0",
                paddingBottom: moderateScale(8),
                marginBottom: moderateScale(10),
                width: "100%",
              }}
            >
              <Text testID="modalTitle" style={modalStyles.modalTitle}>
                {modalMode === "add"
                  ? "유통기한 항목 추가"
                  : "유통기한 항목 수정"}
              </Text>
              <TouchableOpacity
                testID="closeButton"
                style={{ padding: moderateScale(5) }}
                onPress={() => setShowModal(false)}
              >
                <XCircle size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              testID="formContainer"
              style={{ width: "100%", paddingHorizontal: moderateScale(5) }}
            >
              <View testID="formGroup" style={styles.formGroup}>
                <Text testID="label" style={styles.label}>
                  품목 선택
                </Text>
                <View testID="pickerContainer" style={styles.pickerContainer}>
                  <ScrollView
                    testID="pickerScrollView"
                    style={styles.pickerScrollView}
                  >
                    {modalMode === "edit" ? (
                      <View testID="disabledInput" style={styles.disabledInput}>
                        <Text testID="disabledText" style={styles.disabledText}>
                          {selectedItem?.품목명 || ""}
                        </Text>
                      </View>
                    ) : (
                      products.map((product) => (
                        <TouchableOpacity
                          key={product.품목_id}
                          testID={
                            formData.품목_id === product.품목_id
                              ? "selectedProductItem"
                              : "productItem"
                          }
                          style={[
                            styles.productItem,
                            formData.품목_id === product.품목_id &&
                              styles.selectedProductItem,
                          ]}
                          onPress={() =>
                            setFormData({
                              ...formData,
                              품목_id: product.품목_id,
                            })
                          }
                        >
                          <Text
                            testID={
                              formData.품목_id === product.품목_id
                                ? "selectedProductText"
                                : "productItemText"
                            }
                            style={
                              formData.품목_id === product.품목_id
                                ? styles.selectedProductText
                                : styles.productItemText
                            }
                          >
                            {product.품목명} ({product.협력사명})
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>

              <View testID="formGroup" style={styles.formGroup}>
                <Text testID="label" style={styles.label}>
                  유통기한
                </Text>
                <TouchableOpacity
                  testID="dateInput"
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text testID="dateText" style={styles.dateText}>
                    {formatDateForDisplay(formData.유통기한.toISOString())}
                  </Text>
                  <Calendar
                    size={18}
                    color="#0D326F"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              </View>

              <View testID="formGroup" style={styles.formGroup}>
                <Text testID="label" style={styles.label}>
                  수량
                </Text>
                <TextInput
                  testID="input"
                  style={styles.input}
                  value={formData.창고_재고량}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      창고_재고량: text.replace(/[^0-9]/g, ""),
                    })
                  }
                  keyboardType="numeric"
                  placeholder="수량을 입력하세요"
                />
              </View>

              <View
                testID="buttonGroup"
                style={[
                  styles.buttonGroup,
                  { width: "90%", alignSelf: "center" },
                ]}
              >
                <TouchableOpacity
                  testID="cancelButton"
                  style={[
                    styles.cancelButton,
                    {
                      flex: 1,
                      marginRight: moderateScale(10),
                      maxWidth: "45%",
                    },
                  ]}
                  onPress={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  <Text
                    testID="cancelButtonText"
                    style={styles.cancelButtonText}
                  >
                    취소
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="submitButton"
                  style={[
                    styles.submitButton,
                    {
                      flex: 1,
                      marginLeft: moderateScale(10),
                      maxWidth: "45%",
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text
                      testID="submitButtonText"
                      style={styles.submitButtonText}
                    >
                      {modalMode === "add" ? "추가" : "수정"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteConfirmModal}
        transparent={true}
        animationType="fade"
      >
        <View testID="modalCenteredView" style={modalStyles.centeredView}>
          <View testID="modalView" style={modalStyles.modalView}>
            <Text testID="modalTitle" style={modalStyles.modalTitle}>
              항목 삭제 확인
            </Text>
            <Text
              testID="modalText"
              style={[
                modalStyles.modalText,
                { marginBottom: moderateScale(10) },
              ]}
            >
              "{itemToDelete?.품목명}"의 유통기한 정보를 삭제하시겠습니까?
            </Text>
            <View
              testID="buttonContainer"
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                marginTop: moderateScale(15),
              }}
            >
              <TouchableOpacity
                testID="cancelButton"
                style={{
                  backgroundColor: "#f1f5f9",
                  paddingVertical: moderateScale(12),
                  paddingHorizontal: moderateScale(10),
                  borderRadius: moderateScale(10),
                  width: "48%",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                }}
                onPress={() => setShowDeleteConfirmModal(false)}
              >
                <Text
                  testID="cancelButtonText"
                  style={{
                    fontSize: RFValue(15),
                    fontWeight: "600",
                    color: "#334155",
                  }}
                >
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="confirmButton"
                style={{
                  backgroundColor: "#0D326F",
                  paddingVertical: moderateScale(12),
                  paddingHorizontal: moderateScale(10),
                  borderRadius: moderateScale(10),
                  width: "48%",
                  alignItems: "center",
                }}
                onPress={confirmDelete}
              >
                <Text
                  testID="buttonText"
                  style={{
                    fontSize: RFValue(15),
                    fontWeight: "600",
                    color: "#ffffff",
                  }}
                >
                  삭제
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View testID="modalCenteredView_2" style={modalStyles.centeredView}>
          <View testID="modalView_2" style={modalStyles.modalView}>
            <Text testID="modalTitle_2" style={modalStyles.modalTitle}>
              완료
            </Text>
            <Text
              testID="modalText_Complete"
              style={[
                modalStyles.modalText,
                { marginBottom: moderateScale(10) },
              ]}
            >
              {deleteSuccessMessage}
            </Text>
            <View
              style={{
                width: "100%",
                marginTop: moderateScale(15),
              }}
            >
              <TouchableOpacity
                testID="closeButton_Complete"
                style={{
                  backgroundColor: "#0D326F",
                  paddingVertical: moderateScale(12),
                  paddingHorizontal: moderateScale(10),
                  borderRadius: moderateScale(10),
                  width: "100%",
                  alignItems: "center",
                }}
                onPress={() => {
                  setShowDeleteSuccessModal(false);
                  setDeleteSuccessMessage("");
                }}
              >
                <Text
                  testID="textStyle_Complete"
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
    </View>
  );
};

export default ExpirationManagement_warehouse;
