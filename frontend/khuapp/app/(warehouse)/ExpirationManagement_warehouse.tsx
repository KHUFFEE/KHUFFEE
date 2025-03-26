import React, { useState, useEffect, useRef } from "react";
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
    return "오늘 만료";
  } else {
    return `${Math.abs(diffDays)}일 지남`;
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

  // 정렬된 협력사 목록
  const sortedSuppliers = React.useMemo(() => {
    const suppliers = suppliersData.map((supplier) => supplier.협력사명 || "");
    suppliers.sort((a, b) => a.localeCompare(b, "ko"));
    return suppliers;
  }, [suppliersData]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!warehouseId) return;

      try {
        setLoading(true);

        // 1. 품목 데이터 가져오기 (소모품 제외)
        const itemsResponse = await fetch(`${RN_API_URL}/api/suppliers/items/`);
        if (!itemsResponse.ok)
          throw new Error("품목 데이터를 가져오는데 실패했습니다.");
        const itemsData = await itemsResponse.json();
        // 소모품이 아닌 품목만 필터링
        const filteredItems = itemsData.filter(
          (item: APIProduct) => item.종류 !== "소모품"
        );
        setProducts(filteredItems);

        // 2. 최근 재고 데이터 가져오기
        const stockResponse = await fetch(
          `${RN_API_URL}/api/inventory/warehouse/`
        );
        if (!stockResponse.ok)
          throw new Error("재고 데이터를 가져오는데 실패했습니다.");
        const stockData = await stockResponse.json();

        const stockMap: { [key: string]: number } = {};
        stockData.forEach((item: any) => {
          stockMap[item.품목_id] = item.창고_재고량;
        });
        setCurrentStockData(stockMap);

        // 3. 유통기한 데이터 가져오기
        const expirationResponse = await fetch(
          `${RN_API_URL}/api/inventory/warehouse_expiration_list/`
        );
        if (!expirationResponse.ok)
          throw new Error("유통기한 데이터를 가져오는데 실패했습니다.");
        const expirationData = await expirationResponse.json();

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
    };

    fetchAllData();
  }, [warehouseId]);

  useEffect(() => {
    let filtered = [...expirationData];

    // 협력사 필터링
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.협력사명 === selectedCategory);
    }

    // 검색어 필터링
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (item) =>
          item.품목명.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.협력사명.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 정렬
    if (sortBy === "date") {
      filtered.sort((a, b) => {
        // 1. 협력사명 기준 정렬
        if (a.협력사명 !== b.협력사명) {
          return a.협력사명.localeCompare(b.협력사명);
        }

        // 2. 품목명 기준 정렬
        if (a.품목명 !== b.품목명) {
          return a.품목명.localeCompare(b.품목명);
        }

        // 3. 유통기한 기준 정렬
        return new Date(a.유통기한).getTime() - new Date(b.유통기한).getTime();
      });
    }

    setFilteredData(filtered);
  }, [searchQuery, expirationData, sortBy, selectedCategory]);

  const getExpirationStyle = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return styles.expired;
    } else if (diffDays <= 7) {
      return styles.nearExpiration;
    } else if (diffDays <= 30) {
      return styles.warning;
    } else {
      return styles.normal;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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

  if (loading) {
    return (
      <View testID="loading-container" style={styles.loadingContainer}>
        <ActivityIndicator
          testID="activity-indicator-loading"
          size="large"
          color="#0D326F"
        />
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
          testID="success-message-container"
          style={styles.successMessageContainer}
        >
          <Text testID="success-message-text" style={styles.successMessageText}>
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
            testID="categoryButton"
            style={[
              OrderRequeststyle.categoryButton,
              selectedCategory === null &&
                OrderRequeststyle.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              testID="categoryButtonText"
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
              testID="categoryButton"
              style={[
                OrderRequeststyle.categoryButton,
                selectedCategory === supplier &&
                  OrderRequeststyle.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(supplier)}
            >
              <Text
                testID="categoryButtonText"
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

      <View testID="filter-container" style={styles.filterContainer}>
        <View testID="search-container" style={styles.searchContainer}>
          <Search color="#0D326F" size={20} />
          <TextInput
            testID="search-input"
            style={styles.searchInput}
            placeholder="품목명 또는 협력사로 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              testID="clear-button"
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <X color="#0D326F" size={20} />
            </TouchableOpacity>
          )}
        </View>

        <View testID="legend-container" style={styles.legendContainer}>
          <View testID="legend-item-expired" style={styles.legendItem}>
            <View
              testID="legend-expired"
              style={[styles.legendColor, styles.expired]}
            />
            <Text testID="legend-expired-text" style={styles.legendText}>
              유통기한 만료
            </Text>
          </View>
          <View testID="legend-item-nearExpiration" style={styles.legendItem}>
            <View
              testID="legend-nearExpiration"
              style={[styles.legendColor, styles.nearExpiration]}
            />
            <Text testID="legend-nearExpiration-text" style={styles.legendText}>
              7일 이내
            </Text>
          </View>
          <View testID="legend-item-warning" style={styles.legendItem}>
            <View
              testID="legend-warning"
              style={[styles.legendColor, styles.warning]}
            />
            <Text testID="legend-warning-text" style={styles.legendText}>
              30일 이내
            </Text>
          </View>
          <View testID="legend-item-normal" style={styles.legendItem}>
            <View
              testID="legend-normal"
              style={[styles.legendColor, styles.normal]}
            />
            <Text testID="legend-normal-text" style={styles.legendText}>
              정상
            </Text>
          </View>
        </View>

        <View testID="sort-container" style={headerRowStyles.container}>
          <View
            testID="sort-button-container"
            style={headerRowStyles.buttonContainer}
          >
            <TouchableOpacity
              testID="sort-date-button"
              style={[
                sortBy === "date"
                  ? headerRowStyles.activeButton
                  : headerRowStyles.smallButton,
              ]}
              onPress={() => setSortBy("date")}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={
                    sortBy === "date"
                      ? headerRowStyles.activeButtonText
                      : headerRowStyles.buttonText
                  }
                >
                  유통기한순
                </Text>
                <ArrowDownUp
                  size={16}
                  color={sortBy === "date" ? "#ffffff" : "#0D326F"}
                  style={{ marginLeft: moderateScale(4) }}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View
        testID="table-container"
        style={[styles.tableContainer, { flex: 1 }]}
      >
        <View testID="table-header" style={styles.tableHeader}>
          <Text
            testID="header-supplier"
            style={[styles.headerText, styles.supplierCell]}
          >
            협력사
          </Text>
          <Text
            testID="header-product"
            style={[styles.headerText, styles.productCell]}
          >
            품목명
          </Text>
          <Text
            testID="header-date"
            style={[styles.headerText, styles.dateCell]}
          >
            유통기한
          </Text>
          <Text
            testID="header-quantity"
            style={[styles.headerText, styles.quantityCell]}
          >
            개수
          </Text>
          <Text
            testID="header-stock"
            style={[styles.headerText, styles.stockCell]}
          >
            현재고
          </Text>
          <Text
            testID="header-action-daysLeft"
            style={[
              styles.headerText,
              isEditMode ? styles.actionCell : styles.daysLeftCell,
            ]}
          >
            {isEditMode ? "작업" : "남은 일수"}
          </Text>
        </View>

        {filteredData.length === 0 ? (
          <Text testID="empty-text" style={styles.emptyText}>
            유통기한 데이터가 없습니다.
          </Text>
        ) : (
          <FlatList
            testID="flatlist"
            data={filteredData}
            style={[styles.flatListStyle, { flex: 1 }]}
            contentContainerStyle={{ flexGrow: 1 }}
            renderItem={({ item, index }) => {
              const expirationStyle = getExpirationStyle(item.유통기한);
              return (
                <View
                  testID={`table-row-${index}`}
                  style={[
                    styles.tableRow,
                    expirationStyle,
                    index % 2 === 0 ? styles.evenRow : styles.oddRow,
                  ]}
                >
                  <Text
                    testID={`cell-supplier-${index}`}
                    style={[styles.cellText, styles.supplierCell]}
                  >
                    {item.협력사명}
                  </Text>
                  <Text
                    testID={`cell-product-${index}`}
                    style={[styles.cellText, styles.productCell]}
                  >
                    {item.품목명}
                  </Text>
                  <Text
                    testID={`cell-date-${index}`}
                    style={[styles.cellText, styles.dateCell]}
                  >
                    {formatDate(item.유통기한)}
                  </Text>
                  <Text
                    testID={`cell-quantity-${index}`}
                    style={[styles.cellText, styles.quantityCell]}
                  >
                    {item.창고_재고량}
                  </Text>
                  <Text
                    testID={`cell-stock-${index}`}
                    style={[styles.cellText, styles.stockCell]}
                  >
                    {item.현재고}
                  </Text>
                  {isEditMode ? (
                    <View
                      testID={`action-cell-${index}`}
                      style={[
                        styles.actionCell,
                        { flexDirection: "row", justifyContent: "center" },
                      ]}
                    >
                      <TouchableOpacity
                        testID={`edit-button-${index}`}
                        style={styles.actionButton}
                        onPress={() => handleEditItem(item)}
                      >
                        <Edit2 size={16} color="#0D326F" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`delete-button-${index}`}
                        style={[styles.actionButton, { marginLeft: 10 }]}
                        onPress={() => handleDeleteItem(item)}
                      >
                        <Trash2 size={16} color="#e53e3e" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text
                      testID={`cell-daysLeft-${index}`}
                      style={[styles.cellText, styles.daysLeftCell]}
                    >
                      {calculateDaysRemaining(item.유통기한)}
                    </Text>
                  )}
                </View>
              );
            }}
            keyExtractor={(item, index) =>
              `${item.품목_id}-${item.유통기한}-${index}`
            }
          />
        )}
      </View>

      {!isEditMode && (
        <View
          testID="bottom-button-container"
          style={styles.bottomButtonContainer}
        >
          <TouchableOpacity
            testID="add-button"
            style={styles.addButton}
            onPress={handleAddItem}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>항목 추가</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="edit-mode-button"
            style={styles.editButton}
            onPress={toggleEditMode}
          >
            <Edit2 size={20} color="#ffffff" />
            <Text style={styles.editButtonText}>편집모드</Text>
          </TouchableOpacity>
        </View>
      )}

      {isEditMode && (
        <View
          testID="bottom-button-container"
          style={styles.bottomButtonContainer}
        >
          <TouchableOpacity
            testID="save-button"
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <Save size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        testID="modal"
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View testID="modal-overlay" style={styles.modalOverlay}>
          <View testID="modal-container" style={styles.modalContainer}>
            <View testID="modal-header" style={styles.modalHeader}>
              <Text testID="modal-title" style={styles.modalTitle}>
                {modalMode === "add"
                  ? "유통기한 항목 추가"
                  : "유통기한 항목 수정"}
              </Text>
              <TouchableOpacity
                testID="modal-close-button"
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <XCircle size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView testID="modal-scrollview" style={styles.formContainer}>
              <View testID="form-group-item-selection" style={styles.formGroup}>
                <Text testID="label-item-selection" style={styles.label}>
                  품목 선택
                </Text>
                <View testID="picker-container" style={styles.pickerContainer}>
                  <ScrollView
                    testID="picker-scrollview"
                    style={styles.pickerScrollView}
                  >
                    {modalMode === "edit" ? (
                      <View
                        testID="disabled-input"
                        style={styles.disabledInput}
                      >
                        <Text
                          testID="disabled-text"
                          style={styles.disabledText}
                        >
                          {selectedItem?.품목명 || ""}
                        </Text>
                      </View>
                    ) : (
                      products.map((product) => (
                        <TouchableOpacity
                          testID={`product-item-${product.품목_id}`}
                          key={product.품목_id}
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
                            testID={`product-item-text-${product.품목_id}`}
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

              <View testID="form-group-expiration" style={styles.formGroup}>
                <Text testID="label-expiration" style={styles.label}>
                  유통기한
                </Text>
                <TouchableOpacity
                  testID="date-input"
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text testID="date-text" style={styles.dateText}>
                    {formatDate(formData.유통기한.toISOString())}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    testID="date-picker"
                    value={formData.유통기한}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </View>

              <View testID="form-group-quantity" style={styles.formGroup}>
                <Text testID="label-quantity" style={styles.label}>
                  수량
                </Text>
                <TextInput
                  testID="quantity-input"
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

              <View testID="button-group" style={styles.buttonGroup}>
                <TouchableOpacity
                  testID="cancel-button"
                  style={styles.cancelButton}
                  onPress={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  <Text
                    testID="cancel-button-text"
                    style={styles.cancelButtonText}
                  >
                    취소
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="submit-button"
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator
                      testID="activity-indicator-submit"
                      size="small"
                      color="#ffffff"
                    />
                  ) : (
                    <Text
                      testID="submit-button-text"
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
        testID="save-success-modal"
        visible={showSaveSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.saveSuccessModal}>
            <Text style={styles.saveSuccessText}>저장이 완료되었습니다</Text>
            <TouchableOpacity
              style={styles.saveSuccessButton}
              onPress={() => setShowSaveSuccessModal(false)}
            >
              <Text style={styles.saveSuccessButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ExpirationManagement_warehouse;
