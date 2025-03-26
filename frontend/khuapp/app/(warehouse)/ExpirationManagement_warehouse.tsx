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
import { APIProduct } from "../../src/components/ui/common/types";
import {
  Search,
  X,
  ArrowDownUp,
  Plus,
  Edit2,
  Trash2,
  Save,
  XCircle,
} from "lucide-react-native";
import { moderateScale, scale } from "react-native-size-matters";
import { RFValue } from "react-native-responsive-fontsize";
import {
  styles,
  headerRowStyles,
} from "../../src/styles/ExpirationMangaement_warehouse";
import DateTimePicker from "@react-native-community/datetimepicker";
import { OrderRequeststyle } from "../../src/styles/StockManagement_styles_warehouse";

interface ExpirationManagementProps {
  warehouseId: string;
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

// 남은 일수 계산 함수
const calculateDaysRemaining = (expirationDate: string): string => {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 30) {
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return `${months}개월 ${days}일`;
  } else if (diffDays > 0) {
    return `${diffDays}일`;
  } else if (diffDays === 0) {
    return "만료";
  } else {
    return "만료";
  }
};

const ExpirationManagement_warehouse: React.FC<ExpirationManagementProps> = ({
  warehouseId,
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSaveSuccessModal, setShowSaveSuccessModal] =
    useState<boolean>(false);

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
        return new Date(a.유통기한).getTime() - new Date(b.유통기한).getTime();
      });
    }

    setFilteredData(filtered);
  }, [searchQuery, expirationData, sortBy, selectedCategory]);

  // 유통기한 스타일 계산
  const getExpirationStyle = useCallback((expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return styles.expired;
    if (diffDays <= 7) return styles.nearExpiration;
    if (diffDays <= 30) return styles.warning;
    return styles.normal;
  }, []);

  // 날짜 포맷팅
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2); // 년도의 마지막 2자리
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // 월
    const day = date.getDate().toString().padStart(2, "0"); // 일자
    return `${year}.${month}.${day}`;
  }, []);

  const handleAddItem = () => {
    setModalMode("add");
    setFormData({
      품목_id: "",
      유통기한: new Date(),
      창고_재고량: "",
    });
    setShowModal(true);
  };

  const handleEditItem = (item: ExpirationItem) => {
    setModalMode("edit");
    setSelectedItem(item);
    setFormData({
      품목_id: item.품목_id,
      유통기한: new Date(item.유통기한),
      창고_재고량: item.창고_재고량.toString(),
    });
    setShowModal(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        유통기한: selectedDate,
      });
    }
  };

  const handleDeleteItem = async (item: ExpirationItem) => {
    Alert.alert(
      "항목 삭제",
      `"${item.품목명}"의 유통기한 정보를 삭제하시겠습니까?`,
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(
                `${RN_API_URL}/api/inventory/warehouse_expiration_delete/`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    품목_id: item.품목_id,
                    유통기한: item.유통기한,
                  }),
                }
              );

              if (!response.ok) {
                throw new Error("항목 삭제에 실패했습니다.");
              }

              await refreshData();
              setSuccessMessage("항목이 성공적으로 삭제되었습니다.");
              setTimeout(() => setSuccessMessage(""), 3000);
            } catch (error) {
              console.error("삭제 중 오류:", error);
              Alert.alert("오류", "항목 삭제 중 오류가 발생했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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

      const formattedDate = formatDate(formData.유통기한.toISOString());

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

      setSuccessMessage(successMsg);
      setTimeout(() => setSuccessMessage(""), 3000);
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
      await refreshData();
      setIsEditMode(false);
      setShowSaveSuccessModal(true);
      setTimeout(() => setShowSaveSuccessModal(false), 2000);
    } catch (error) {
      console.error("저장 중 오류:", error);
      Alert.alert("오류", "저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 테이블 헤더 렌더링
  const renderTableHeader = useMemo(
    () => (
      <View testID="tableHeader" style={styles.tableHeader}>
        <Text
          testID="productCell"
          style={[styles.headerText, styles.productCell]}
        >
          상품명
        </Text>
        <Text testID="dateCell" style={[styles.headerText, styles.dateCell]}>
          유통기한
        </Text>
        <Text testID="stockCell" style={[styles.headerText, styles.stockCell]}>
          현재고
        </Text>
        <Text
          testID="quantityCell"
          style={[styles.headerText, styles.quantityCell]}
        >
          개수
        </Text>
      </View>
    ),
    [isEditMode]
  );

  // 협력사별로 데이터 그룹화
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

  // 협력사별 섹션 렌더링
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
                  getExpirationStyle(item.유통기한),
                  index % 2 === 0 ? styles.evenRow : styles.oddRow,
                ]}
              >
                <View testID="productCell" style={styles.productCell}>
                  <Text testID="productName" style={styles.productName}>
                    {item.품목명}
                  </Text>
                </View>
                <View testID="dateCell" style={styles.dateCell}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>
                      {formatDate(item.유통기한)}
                    </Text>
                    {!isEditMode && (
                      <Text
                        style={[
                          styles.daysRemainingText,
                          getExpirationStyle(item.유통기한),
                        ]}
                      >
                        {calculateDaysRemaining(item.유통기한)}
                      </Text>
                    )}
                  </View>
                </View>
                <Text
                  testID="stockCell"
                  style={[styles.cellText, styles.stockCell]}
                >
                  {item.현재고}
                </Text>
                <Text
                  testID="quantityCell"
                  style={[styles.cellText, styles.quantityCell]}
                >
                  {item.창고_재고량}
                </Text>
                {isEditMode ? (
                  <View
                    testID="actionCell"
                    style={[
                      styles.actionCell,
                      { flexDirection: "row", justifyContent: "center" },
                    ]}
                  >
                    <TouchableOpacity
                      testID="editButton"
                      style={styles.actionButton}
                      onPress={() => handleEditItem(item)}
                    >
                      <Edit2 size={16} color="#0D326F" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="trashButton"
                      style={[styles.actionButton, { marginLeft: 10 }]}
                      onPress={() => handleDeleteItem(item)}
                    >
                      <Trash2 size={16} color="#e53e3e" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      );
    },
    [isEditMode, getExpirationStyle, formatDate]
  );

  // FlatList의 renderItem 수정
  const renderItem = useCallback(
    ({ item }: { item: { supplier: string; items: ExpirationItem[] } }) => {
      return renderSupplierSection(item.supplier, item.items);
    },
    [renderSupplierSection]
  );

  // FlatList의 data 수정
  const listData = useMemo(() => {
    return Object.entries(groupedData).map(([supplier, items]) => ({
      supplier,
      items,
    }));
  }, [groupedData]);

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
    <SafeAreaView testID="container" style={styles.container}>
      {successMessage ? (
        <View
          testID="successMessageContainer"
          style={styles.successMessageContainer}
        >
          <Text testID="successMessageText" style={styles.successMessageText}>
            {successMessage}
          </Text>
        </View>
      ) : null}

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

        <View testID="legendContainer" style={styles.legendContainer}>
          <View testID="legendItem" style={styles.legendItem}>
            <View
              testID="expired"
              style={[styles.legendColor, styles.expired]}
            />
            <Text testID="legendText" style={styles.legendText}>
              유통기한 만료
            </Text>
          </View>
          <View testID="legendItem" style={styles.legendItem}>
            <View
              testID="nearExpiration"
              style={[styles.legendColor, styles.nearExpiration]}
            />
            <Text testID="legendText" style={styles.legendText}>
              7일 이내
            </Text>
          </View>
          <View testID="legendItem" style={styles.legendItem}>
            <View
              testID="warning"
              style={[styles.legendColor, styles.warning]}
            />
            <Text testID="legendText" style={styles.legendText}>
              30일 이내
            </Text>
          </View>
          <View testID="legendItem" style={styles.legendItem}>
            <View testID="normal" style={[styles.legendColor, styles.normal]} />
            <Text testID="legendText" style={styles.legendText}>
              정상
            </Text>
          </View>
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
                  style={headerRowStyles.cancelButton}
                  onPress={toggleEditMode}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={headerRowStyles.cancelButtonText}>취소</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="saveButton"
                  style={headerRowStyles.activeButton}
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
        style={[styles.tableContainer, { flex: 1 }]}
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
            style={[styles.flatListStyle, { flex: 1 }]}
            contentContainerStyle={{ flexGrow: 1 }}
            renderItem={renderItem}
            keyExtractor={(item) => item.supplier}
            ListEmptyComponent={() => (
              <Text testID="emptyText" style={styles.emptyText}>
                유통기한 데이터가 없습니다.
              </Text>
            )}
          />
        )}
      </View>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View testID="modalOverlay" style={styles.modalOverlay}>
          <View testID="modalContainer" style={styles.modalContainer}>
            <View testID="modalHeader" style={styles.modalHeader}>
              <Text testID="modalTitle" style={styles.modalTitle}>
                {modalMode === "add"
                  ? "유통기한 항목 추가"
                  : "유통기한 항목 수정"}
              </Text>
              <TouchableOpacity
                testID="closeButton"
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <XCircle size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView testID="formContainer" style={styles.formContainer}>
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
                    {formatDate(formData.유통기한.toISOString())}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.유통기한}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
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

              <View testID="buttonGroup" style={styles.buttonGroup}>
                <TouchableOpacity
                  testID="cancelButton"
                  style={styles.cancelButton}
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
                  style={styles.submitButton}
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
        visible={showSaveSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View testID="modalOverlay" style={styles.modalOverlay}>
          <View testID="saveSuccessModal" style={styles.saveSuccessModal}>
            <Text testID="saveSuccessText" style={styles.saveSuccessText}>
              저장이 완료되었습니다
            </Text>
            <TouchableOpacity
              testID="saveSuccessButton"
              style={styles.saveSuccessButton}
              onPress={() => setShowSaveSuccessModal(false)}
            >
              <Text
                testID="saveSuccessButtonText"
                style={styles.saveSuccessButtonText}
              >
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ExpirationManagement_warehouse;
