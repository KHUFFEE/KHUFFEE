import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Modal,
  Button,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { RN_API_URL } from "@env";
import * as f from "../../src/components/ui/common/function";
import { styles } from "../../src/components/ui/common/commonstyler";
import {
  inventoryStyles,
  toggleButtonStyles,
  editModeStyles,
  searchStyles,
  modalStyles,
  headerRowStyles,
  OrderRequeststyle,
  confirmationStyles,
} from "../../src/styles/StockManagement_styles_warehouse";
import { APIProduct } from "../../src/components/ui/common/types";
import { Search, Minus, Plus, Trash2, X } from "lucide-react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import { RFValue } from "react-native-responsive-fontsize";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const { height: screenHeight } = Dimensions.get("window");

// 일간 재고 타입
export interface MergedInventoryItem extends APIProduct {
  매장_id: string;
  기간: string;
  창고_재고량: number;
}

// 월간 재고 타입 (입고 재고 용도)
// GET 요청은 일별 재고 엔드포인트를 사용하므로, 응답의 "창고_재고량"을 "창고_입고량"으로 매핑
export interface MergedMonthInventoryItem extends APIProduct {
  매장_id: string;
  기간: string;
  창고_입고량: number;
}

type InventoryItem = MergedInventoryItem | MergedMonthInventoryItem;

interface InventoryProps {
  storeId: string;
}

interface InventoryItemRowProps {
  item: InventoryItem;
  inventoryType: "daily" | "monthly";
  editMode: boolean;
  onValueChange: (품목_id: string, newValue: string) => void;
  onIncrement: (품목_id: string) => void;
  onDecrement: (품목_id: string) => void;
  onDelete: (품목_id: string) => void;
  index: number;
}

// InventoryItemRow를 forwardRef로 감싸서 commit 메서드를 노출
const InventoryItemRow = forwardRef<
  { commit: () => void },
  InventoryItemRowProps
>((props, ref) => {
  const {
    item,
    inventoryType,
    editMode,
    onValueChange,
    onIncrement,
    onDecrement,
    onDelete,
    index,
  } = props;
  const inventoryValue =
    inventoryType === "daily"
      ? (item as MergedInventoryItem).창고_재고량
      : (item as MergedMonthInventoryItem).창고_입고량;

  // 로컬 상태: 사용자가 입력 중인 값을 관리
  const [localInput, setLocalInput] = useState<string>(
    inventoryValue === 0 ? "" : f.formatPrice(inventoryValue)
  );
  const [isFocused, setIsFocused] = useState(false);

  // 부모의 inventoryData가 업데이트되면 localInput도 업데이트
  useEffect(() => {
    if (!isFocused) {
      if (editMode) {
        setLocalInput(
          inventoryValue === 0 ? "0" : f.formatPrice(inventoryValue)
        );
      } else {
        setLocalInput(
          inventoryValue === 0 ? "" : f.formatPrice(inventoryValue)
        );
      }
    }
  }, [inventoryValue, isFocused, editMode]);

  // 외부에서 commit() 호출 시 현재 입력값을 파싱하여 업데이트
  useImperativeHandle(
    ref,
    () => ({
      commit: () => {
        const parsed = parseFloat(localInput.replace(/,/g, ""));
        const numericValue = isNaN(parsed) ? 0 : parsed;
        onValueChange(item.품목_id, numericValue.toString());
      },
    }),
    [localInput, item.품목_id, onValueChange]
  );

  return (
    <View
      testID="itemContainer"
      style={[
        inventoryStyles.itemContainer,
        index % 2 === 0
          ? { backgroundColor: "#ffffff", borderColor: "#e2e8f0" }
          : { backgroundColor: "#f5f8ff", borderColor: "#d9e1f2" },
      ]}
    >
      <View
        testID="inventory_selectItemRowContainer"
        style={inventoryStyles.inventory_selectItemRowContainer}
      >
        <Text
          testID="name_itemText"
          style={[inventoryStyles.name_itemText, { lineHeight: RFValue(17) }]}
        >
          {item.품목명}
          {"\n"}
          <Text
            style={{
              fontSize: RFValue(12),
              color: "#3A9D23",
            }}
          >
            {inventoryType === "daily"
              ? `출고단위: ${item.출고단위}개`
              : `입고단위: ${item.입고단위}개`}
          </Text>
        </Text>
        {editMode ? (
          <View
            testID="controlContainer"
            style={editModeStyles.controlContainer}
          >
            <View testID="inputContainer" style={editModeStyles.inputContainer}>
              <TouchableOpacity
                testID="decrementButton"
                style={[
                  editModeStyles.controlButton,
                  editModeStyles.leftButton,
                ]}
                onPress={() => onDecrement(item.품목_id)}
              >
                <Minus color="#0A2A5E" size={18} />
              </TouchableOpacity>
              <TextInput
                testID="quantityInput"
                style={editModeStyles.quantityInput}
                value={localInput}
                onChangeText={(text) => {
                  const rawText = text.replace(/,/g, "");
                  const parsed = parseFloat(rawText);
                  const formatted = isNaN(parsed)
                    ? rawText
                    : f.formatPrice(parsed);
                  setLocalInput(formatted);
                  onValueChange(
                    item.품목_id,
                    isNaN(parsed) ? "0" : parsed.toString()
                  );
                }}
                onFocus={() => {
                  setIsFocused(true);
                  if (localInput === "0") {
                    setLocalInput("");
                  }
                }}
                onBlur={() => {
                  setIsFocused(false);
                  const parsed = parseFloat(localInput.replace(/,/g, ""));
                  const numericValue = isNaN(parsed) ? 0 : parsed;
                  setLocalInput(
                    numericValue === 0
                      ? editMode
                        ? "0"
                        : ""
                      : f.formatPrice(numericValue)
                  );
                }}
                keyboardType="numeric"
              />
              <TouchableOpacity
                testID="incrementButton"
                style={[
                  editModeStyles.controlButton,
                  editModeStyles.rightButton,
                ]}
                onPress={() => onIncrement(item.품목_id)}
              >
                <Plus color="#0A2A5E" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text testID="unit_itemText" style={inventoryStyles.unit_itemText}>
            {f.formatPrice(inventoryValue)}
          </Text>
        )}
      </View>
    </View>
  );
});

const Inventory_store: React.FC<InventoryProps> = ({ storeId }) => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);
  const [inventoryType, setInventoryType] = useState<"daily" | "monthly">(
    "daily"
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [itemsData, setItemsData] = useState<APIProduct[]>([]);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);
  const [tableStatus, setTableStatus] = useState<number>(1);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorItems, setErrorItems] = useState<APIProduct[]>([]);
  const [errorModalText, setErrorModalText] = useState("");
  const [pendingSaveAction, setPendingSaveAction] = useState<
    (() => Promise<void>) | null
  >(null);
  const [isConfirmation, setIsConfirmation] = useState(false);
  const [itemsToSave, setItemsToSave] = useState<InventoryItem[]>([]);
  const [saveCompleteModalVisible, setSaveCompleteModalVisible] =
    useState<boolean>(false);

  const rowRefs = useRef<{
    [key: string]: React.RefObject<{ commit: () => void }>;
  }>({});

  // 현재 날짜를 "YYYY.MM.DD" 형식으로 반환
  const getCurrentDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  // 테이블 상태를 가져오는 함수 추가
  const fetchTableStatus = async () => {
    try {
      const response = await fetch(
        `${RN_API_URL}/api/management/table_status_list/`
      );
      if (!response.ok) throw new Error("테이블 상태를 불러오는 중 오류 발생");

      const statusData = await response.json();
      const warehouseInventoryStatus = statusData.find(
        (item: any) => item.테이블 === "창고_재고"
      );

      if (warehouseInventoryStatus) {
        setTableStatus(warehouseInventoryStatus.상태);
      }
    } catch (err: any) {
      console.error("테이블 상태 조회 오류:", err.message);
      // 오류 시 기본값 1로 설정 (기존 로직 사용)
      setTableStatus(1);
    }
  };

  // 월간 재고 저장 시 사용할 기간 문자열을 "년도.월.주" 형식으로 계산
  const getPeriodStringForMonthly = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 앞에 0 없이
    // 해당 월의 첫 번째 월요일 찾기
    let firstMonday = new Date(year, today.getMonth(), 1);
    while (firstMonday.getDay() !== 1) {
      firstMonday.setDate(firstMonday.getDate() + 1);
    }
    // 첫 번째 월요일이 속한 주의 일요일(즉, 월요일 + 6일)
    const firstWeekEnd = new Date(firstMonday);
    firstWeekEnd.setDate(firstMonday.getDate() + 6);
    const day = today.getDate();
    let week = 1;
    if (day > firstWeekEnd.getDate()) {
      week = Math.floor((day - firstWeekEnd.getDate() - 1) / 7) + 2;
    }
    return `${year}.${month}.${week}`;
  };

  const handleValueChange = (품목_id: string, newValue: string) => {
    setInventoryData((prev) =>
      prev.map((item) =>
        item.품목_id === 품목_id
          ? inventoryType === "daily"
            ? { ...item, 창고_재고량: parseFloat(newValue) || 0 }
            : { ...item, 창고_입고량: parseFloat(newValue) || 0 }
          : item
      )
    );
  };

  const handleIncrement = (품목_id: string) => {
    setInventoryData((prev) =>
      prev.map((item) => {
        if (item.품목_id !== 품목_id) return item;
        const incrementUnit =
          inventoryType === "daily" ? item.출고단위 : item.입고단위;
        return inventoryType === "daily"
          ? {
              ...item,
              창고_재고량:
                ((item as MergedInventoryItem).창고_재고량 || 0) +
                incrementUnit,
            }
          : {
              ...item,
              창고_입고량:
                ((item as MergedMonthInventoryItem).창고_입고량 || 0) +
                incrementUnit,
            };
      })
    );
  };

  const handleDecrement = (품목_id: string) => {
    setInventoryData((prev) =>
      prev.map((item) => {
        if (item.품목_id !== 품목_id) return item;
        const decrementUnit =
          inventoryType === "daily" ? item.출고단위 : item.입고단위;
        if (inventoryType === "daily") {
          const currentValue = (item as MergedInventoryItem).창고_재고량 || 0;
          return {
            ...item,
            창고_재고량:
              currentValue < decrementUnit ? 0 : currentValue - decrementUnit,
          };
        } else {
          const currentValue =
            (item as MergedMonthInventoryItem).창고_입고량 || 0;
          return {
            ...item,
            창고_입고량:
              currentValue < decrementUnit ? 0 : currentValue - decrementUnit,
          };
        }
      })
    );
  };

  const handleDelete = (품목_id: string) => {
    setInventoryData((prev) =>
      prev.map((item) =>
        item.품목_id === 품목_id
          ? inventoryType === "daily"
            ? { ...item, 창고_재고량: 0 }
            : { ...item, 창고_입고량: 0 }
          : item
      )
    );
  };

  // 통합된 데이터 로딩 함수
  const loadAllData = async () => {
    // 중복 호출 방지
    if (isDataLoading) return;

    setIsDataLoading(true);
    setLoading(true);

    try {
      // 1. 품목 데이터와 협력사 데이터 로딩
      const [itemsResponse, suppliersResponse] = await Promise.all([
        fetch(`${RN_API_URL}/api/suppliers/items/`),
        fetch(`${RN_API_URL}/api/suppliers/`),
      ]);

      if (!itemsResponse.ok)
        throw new Error("품목 데이터를 불러오는 중 오류 발생");
      if (!suppliersResponse.ok)
        throw new Error("협력사 데이터를 불러오는 중 오류 발생");

      const itemsJson = await itemsResponse.json();
      const suppliersJson = await suppliersResponse.json();

      setItemsData(itemsJson);
      setSuppliersData(suppliersJson);

      // 2. 일별재고 경우에만 테이블 상태 및 재고 데이터 로딩
      const today = getCurrentDateString();

      if (inventoryType === "daily") {
        // 테이블 상태 로딩
        await fetchTableStatus();

        // 테이블 상태에 따라 재고 데이터 처리
        if (tableStatus === 0) {
          // 상태가 0이면 모든 재고량을 0으로 설정
          const mergedData: InventoryItem[] = itemsJson.map(
            (product: APIProduct) => ({
              ...product,
              매장_id: storeId,
              기간: today,
              창고_재고량: 0,
            })
          );
          const sortedData = f.sortProductsBySupplierAndName(
            mergedData,
            suppliersJson
          ) as InventoryItem[];
          setInventoryData(sortedData);
          setFilteredData(sortedData);
        } else {
          // 상태가 1이면 API를 통해 데이터 가져오기
          const invUrl = `${RN_API_URL}/api/inventory/warehouse/?매장_id=${storeId}&기간=${today}`;
          const invResponse = await fetch(invUrl);

          if (!invResponse.ok)
            throw new Error("재고 데이터를 불러오는 중 오류 발생");

          const invData = await invResponse.json();
          const mergedData: InventoryItem[] = itemsJson.map(
            (product: APIProduct) => {
              const matchingInv = invData.find(
                (inv: any) => inv.품목_id === product.품목_id
              );
              return {
                ...product,
                매장_id: storeId,
                기간: today,
                창고_재고량: matchingInv ? matchingInv.창고_재고량 : 0,
              } as MergedInventoryItem;
            }
          );
          const sortedData = f.sortProductsBySupplierAndName(
            mergedData,
            suppliersJson
          ) as InventoryItem[];
          setInventoryData(sortedData);
          setFilteredData(sortedData);
        }
      } else {
        // 월간 재고인 경우, 모든 창고_입고량을 0으로 설정
        const mergedData: InventoryItem[] = itemsJson.map(
          (product: APIProduct) => ({
            ...product,
            매장_id: storeId,
            기간: today,
            창고_입고량: 0,
          })
        );
        const sortedData = f.sortProductsBySupplierAndName(
          mergedData,
          suppliersJson
        ) as InventoryItem[];
        setInventoryData(sortedData);
        setFilteredData(sortedData);
      }
    } catch (err: any) {
      console.error("데이터 로딩 오류:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsDataLoading(false);
    }
  };

  // 초기 데이터 로딩과 inventoryType 변경 시 데이터 로딩
  useEffect(() => {
    loadAllData();
  }, [inventoryType, storeId]);

  const sortedSuppliers = useMemo(() => {
    const suppliers = suppliersData.map((supplier) => supplier.협력사명 || "");
    suppliers.sort((a, b) => a.localeCompare(b, "ko"));
    return suppliers;
  }, [suppliersData]);

  const sortedCategories = useMemo(() => {
    let categories = f.getUniqueCategories(inventoryData);
    categories = categories.filter((category) => category !== "전체");
    categories.sort((a, b) => a.localeCompare(b, "ko"));
    return categories;
  }, [inventoryData]);

  useEffect(() => {
    if (searchText.trim() === "") {
      if (selectedCategory) {
        setFilteredData(
          inventoryData.filter((item) => item.협력사명 === selectedCategory)
        );
      } else {
        setFilteredData(inventoryData);
      }
    } else {
      if (selectedCategory) {
        setFilteredData(
          inventoryData.filter(
            (item) =>
              item.협력사명 === selectedCategory &&
              item.품목명.includes(searchText)
          )
        );
      } else {
        setFilteredData(
          inventoryData.filter((item) => item.품목명.includes(searchText))
        );
      }
    }
  }, [searchText, inventoryData, selectedCategory]);

  const commitAllRows = () => {
    Object.values(rowRefs.current).forEach((ref) => {
      ref.current?.commit();
    });
  };

  // 단위 검사 함수 수정 - 모든 불일치 상품을 배열로 반환
  const checkUnitCompliance = (): {
    isCompliant: boolean;
    nonCompliantItems: APIProduct[];
  } => {
    const nonCompliantItems: APIProduct[] = [];

    // 모든 재고 항목을 검사하고 불일치하는 항목을 배열에 추가
    inventoryData.forEach((item) => {
      if (inventoryType === "daily") {
        const stockValue = (item as MergedInventoryItem).창고_재고량;
        // 출고단위로 나누어 떨어지는지 확인
        if (stockValue % item.출고단위 !== 0) {
          nonCompliantItems.push(item);
        }
      } else {
        const stockValue = (item as MergedMonthInventoryItem).창고_입고량;
        // 입고단위로 나누어 떨어지는지 확인
        if (stockValue % item.입고단위 !== 0) {
          nonCompliantItems.push(item);
        }
      }
    });

    return { isCompliant: nonCompliantItems.length === 0, nonCompliantItems };
  };

  // 에러 모달을 표시하는 함수 수정 - 여러 상품 정보 표시
  const showErrorModal = (items: APIProduct[]) => {
    setErrorItems(items);

    const unitType = inventoryType === "daily" ? "출고수량" : "입고수량";
    const unitLabel = inventoryType === "daily" ? "출고단위" : "입고단위";
    let modalText = `상품의 ${unitLabel}를 확인해 주세요\n`;

    items.forEach((item) => {
      const unitValue =
        inventoryType === "daily" ? item.출고단위 : item.입고단위;

      const stockValue =
        inventoryType === "daily"
          ? (
              inventoryData.find(
                (i) => i.품목_id === item.품목_id
              ) as MergedInventoryItem
            ).창고_재고량
          : (
              inventoryData.find(
                (i) => i.품목_id === item.품목_id
              ) as MergedMonthInventoryItem
            ).창고_입고량;

      // 숫자에 마커(##) 추가하여 나중에 색상 처리가 가능하도록 함
      modalText += `🔹 ${item.품목명}\n`;
      modalText += `   → 기준 ${unitLabel}: ##${unitValue}##개\n`;
      modalText += `   → 현재 입력 수량: ##${stockValue}##개\n`;
    });

    if (items.length === 1) {
      const unitValue =
        inventoryType === "daily" ? items[0].출고단위 : items[0].입고단위;
      modalText += `${unitType}이 ${unitLabel}와 맞지 않습니다.\n`;
      modalText += `${unitType}은 ##${unitValue}##개 단위로 맞춰야 합니다.\n`;
    } else {
      modalText += `⚠️ 위 상품들은 ${unitType}이 각 ${unitLabel}와 맞지 않습니다.\n`;
      modalText += `각 상품의 기준 단위에 맞게 수량을 조정해 주세요.\n\n`;
    }

    modalText += `💡 그래도 저장할까요?\n`;
    modalText += `• 예 = 이대로 저장하기\n`;
    modalText += `• 아니오 = 돌아가서 수정하기`;

    setErrorModalText(modalText);
    setErrorModalVisible(true);
  };

  // 모달에서 '예' 버튼을 눌렀을 때 실행할 함수
  const handleConfirmError = () => {
    setErrorModalVisible(false);
    if (pendingSaveAction) {
      pendingSaveAction();
      setPendingSaveAction(null);
    }
  };

  // 모달에서 '아니요' 버튼을 눌렀을 때 실행할 함수
  const handleCancelError = () => {
    setErrorModalVisible(false);
    setPendingSaveAction(null);
  };

  // 정렬 로직 수정 (OrderRequest_store의 정렬 기준과 동일하게)
  const sortByCategory = (items: InventoryItem[]): InventoryItem[] => {
    return [...items].sort((a, b) => {
      // 1. 협력사명 기준 정렬
      if (a.협력사_id !== b.협력사_id) {
        const supplierA =
          suppliersData.find((s) => s.협력사_id === a.협력사_id)?.협력사명 ||
          "";
        const supplierB =
          suppliersData.find((s) => s.협력사_id === b.협력사_id)?.협력사명 ||
          "";
        return supplierA.localeCompare(supplierB);
      }

      // 2. 종류(품목 타입) 기준 정렬
      if (a.종류 !== b.종류) {
        return a.종류.localeCompare(b.종류);
      }

      // 3. 품목명 기준 정렬
      return a.품목명.localeCompare(b.품목명);
    });
  };

  // 일간 재고 -> warehouse_inventory_update/ 엔드포인트로 POST 요청
  const handleGlobalSave = async () => {
    commitAllRows();

    // 단위 검사 - 모든 불일치 항목 확인
    const { isCompliant, nonCompliantItems } = checkUnitCompliance();

    if (!isCompliant && nonCompliantItems.length > 0) {
      // 단위에 맞지 않는 경우 에러 모달 표시
      showErrorModal(nonCompliantItems);
      // 저장 액션을 보관하여 사용자가 확인 시 실행할 수 있도록 함
      setPendingSaveAction(() => async () => {
        // 변경된 부분: 최종 확인 화면으로 넘어가도록 수정
        setItemsToSave(inventoryData);
        setIsConfirmation(true);
      });
      return;
    }

    // 단위에 문제가 없으면 바로 확인 화면으로 이동
    setItemsToSave(inventoryData);
    setIsConfirmation(true);
  };

  // 월간 재고 -> warehouse_incoming_update/ 엔드포인트로 POST 요청
  const handleMonthlySave = async () => {
    commitAllRows();

    // 단위 검사 - 모든 불일치 항목 확인
    const { isCompliant, nonCompliantItems } = checkUnitCompliance();

    if (!isCompliant && nonCompliantItems.length > 0) {
      // 단위에 맞지 않는 경우 에러 모달 표시
      showErrorModal(nonCompliantItems);
      // 저장 액션을 보관하여 사용자가 확인 시 실행할 수 있도록 함
      setPendingSaveAction(() => async () => {
        // 변경된 부분: 최종 확인 화면으로 넘어가도록 수정
        setItemsToSave(inventoryData);
        setIsConfirmation(true);
      });
      return;
    }

    // 단위에 문제가 없으면 바로 확인 화면으로 이동
    setItemsToSave(inventoryData);
    setIsConfirmation(true);
  };

  // 최종 저장 처리 함수 수정
  const handleFinalSave = async () => {
    setSaving(true);
    try {
      if (inventoryType === "daily") {
        // 테이블 상태가 0이면 상태를 1로 업데이트
        if (tableStatus === 0) {
          const updateStatusPayload = {
            테이블: "창고_재고",
            상태: 1,
          };

          const statusResponse = await fetch(
            `${RN_API_URL}/api/management/table_status_update/`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updateStatusPayload),
            }
          );

          if (!statusResponse.ok) {
            throw new Error("테이블 상태 업데이트 실패");
          }

          // 로컬 상태 업데이트
          setTableStatus(1);
        }

        // 모든 아이템에 대해 POST 요청 (0인 값도 포함)
        await Promise.all(
          (itemsToSave as MergedInventoryItem[]).map((item) => {
            const payload = {
              매장_id: storeId,
              품목_id: item.품목_id,
              기간: getCurrentDateString(),
              창고_재고량: parseInt(item.창고_재고량.toString(), 10),
            };
            return fetch(
              `${RN_API_URL}/api/inventory/warehouse_inventory_update/`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              }
            ).then((response) => {
              if (!response.ok) {
                throw new Error(`품목 ${item.품목명} 업데이트 실패`);
              }
            });
          })
        );
      } else {
        const period = getPeriodStringForMonthly();
        // 0이 아닌 값만 필터링 (입고 재고는 요청대로 변경하지 않음)
        const nonZeroItems = (itemsToSave as MergedMonthInventoryItem[]).filter(
          (item) => item.창고_입고량 !== 0
        );

        await Promise.all(
          nonZeroItems.map((item) => {
            const payload = {
              매장_id: storeId,
              품목_id: item.품목_id,
              기간: period,
              창고_입고량: parseInt(item.창고_입고량.toString(), 10),
            };
            return fetch(
              `${RN_API_URL}/api/orders/warehouse_incoming_update/`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              }
            ).then((response) => {
              if (!response.ok) {
                throw new Error(`품목 ${item.품목명} 월간 업데이트 실패`);
              }
            });
          })
        );
      }
      setEditMode(false);
      setIsConfirmation(false);
      // Alert.alert 대신 저장 완료 모달 표시
      setSaveCompleteModalVisible(true);
    } catch (err: any) {
      setError(err.message);
      Alert.alert("오류", `저장 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 저장 완료 모달 닫기 함수
  const handleCloseCompleteModal = () => {
    setSaveCompleteModalVisible(false);
  };

  // 뒤로 가기 처리 함수
  const handleBack = () => {
    setIsConfirmation(false);
  };

  const handleToggle = (type: "daily" | "monthly") => {
    // 이미 같은 타입이면 중복 처리하지 않음
    if (inventoryType === type) return;

    setEditMode(false);
    setInventoryType(type);
    // loadAllData()는 여기서 직접 호출하지 않음 - useEffect에서 처리됨
  };

  // editMode 취소 처리 함수 수정
  const handleCancelEdit = () => {
    setEditMode(false);
    // 데이터 다시 로딩
    loadAllData();
  };

  if (loading) {
    return (
      <View testID="loading_Container" style={styles.loading_Container}>
        <ActivityIndicator size="large" color="#0D326F80" />
        <Text testID="loading_Text" style={styles.loading_Text}>
          로딩 중...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View testID="container" style={inventoryStyles.container}>
        <Text testID="message" style={inventoryStyles.message}>
          오류 발생: {error}
        </Text>
      </View>
    );
  }

  if (inventoryData.length === 0) {
    return (
      <View testID="container" style={inventoryStyles.container}>
        <Text testID="message" style={inventoryStyles.message}>
          재고 데이터가 없습니다.
        </Text>
      </View>
    );
  }

  return (
    <View testID="status_container" style={inventoryStyles.status_container}>
      <Modal transparent visible={modalVisible} animationType="slide">
        <View testID="overlay" style={modalStyles.overlay}>
          <View testID="modalContainer" style={modalStyles.modalContainer}>
            <Text testID="modalText" style={modalStyles.modalText}>
              월별 재고 입력기간이 아니어서 월별 재고를 변경할 수 없습니다.
            </Text>
            <Button title="확인" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {!isConfirmation ? (
        <>
          <View testID="container" style={toggleButtonStyles.container}>
            <TouchableOpacity
              testID="button"
              style={[
                toggleButtonStyles.button,
                inventoryType === "daily" && toggleButtonStyles.buttonActive,
                { marginRight: 1 },
              ]}
              onPress={() => handleToggle("daily")}
            >
              <Text
                testID="buttonText"
                style={[
                  toggleButtonStyles.buttonText,
                  inventoryType === "daily" &&
                    toggleButtonStyles.buttonTextActive,
                ]}
              >
                일별 재고
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="button"
              style={[
                toggleButtonStyles.button,
                inventoryType === "monthly" && toggleButtonStyles.buttonActive,
                { marginLeft: 1 },
              ]}
              onPress={() => handleToggle("monthly")}
            >
              <Text
                testID="buttonText"
                style={[
                  toggleButtonStyles.buttonText,
                  inventoryType === "monthly" &&
                    toggleButtonStyles.buttonTextActive,
                ]}
              >
                입고 재고
              </Text>
            </TouchableOpacity>
          </View>

          <View
            testID="categorySection"
            style={OrderRequeststyle.categorySection}
          >
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

          <View testID="searchContainer" style={searchStyles.searchContainer}>
            <Search
              testID="searchIconSize"
              color="#0A2A5E"
              style={searchStyles.searchIconSize}
            />
            <TextInput
              testID="searchInput"
              style={searchStyles.searchInput}
              placeholder="제품명 검색..."
              value={searchText}
              onChangeText={(text) => setSearchText(text)}
              placeholderTextColor="#94a3b8"
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                testID="clearSearchButton"
                style={searchStyles.searchIcon}
                onPress={() => setSearchText("")}
              >
                <X color="#0A2A5E" style={searchStyles.searchIconSize} />
              </TouchableOpacity>
            )}
          </View>

          <View
            testID="headerRowStyles_container"
            style={headerRowStyles.container}
          >
            <View style={headerRowStyles.rightContainer}>
              {inventoryType === "daily" ? (
                <View
                  testID="buttonContainer"
                  style={headerRowStyles.buttonContainer}
                >
                  {editMode ? (
                    <>
                      <TouchableOpacity
                        testID="cancelButton"
                        style={headerRowStyles.cancelButton}
                        onPress={handleCancelEdit}
                      >
                        <Text
                          testID="cancelButtonText"
                          style={headerRowStyles.cancelButtonText}
                        >
                          취소
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="smallButton"
                        style={
                          saving
                            ? headerRowStyles.disabledButton
                            : headerRowStyles.activeButton
                        }
                        onPress={handleGlobalSave}
                        disabled={saving}
                      >
                        <Text
                          testID="buttonText"
                          style={
                            saving
                              ? headerRowStyles.disabledButtonText
                              : headerRowStyles.activeButtonText
                          }
                        >
                          {saving ? "저장 중..." : "조정완료"}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      testID="smallButton"
                      style={headerRowStyles.smallButton}
                      onPress={() => setEditMode(true)}
                    >
                      <Text
                        testID="buttonText"
                        style={headerRowStyles.buttonText}
                      >
                        재고조정
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View
                  testID="buttonContainer"
                  style={headerRowStyles.buttonContainer}
                >
                  {editMode ? (
                    <>
                      <TouchableOpacity
                        testID="cancelButton"
                        style={headerRowStyles.cancelButton}
                        onPress={handleCancelEdit}
                      >
                        <Text
                          testID="cancelButtonText"
                          style={headerRowStyles.cancelButtonText}
                        >
                          취소
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="smallButton"
                        style={
                          saving
                            ? headerRowStyles.disabledButton
                            : headerRowStyles.activeButton
                        }
                        onPress={handleMonthlySave}
                        disabled={saving}
                      >
                        <Text
                          testID="buttonText"
                          style={
                            saving
                              ? headerRowStyles.disabledButtonText
                              : headerRowStyles.activeButtonText
                          }
                        >
                          {saving ? "저장 중..." : "조정완료"}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      testID="smallButton"
                      style={headerRowStyles.smallButton}
                      onPress={() => setEditMode(true)}
                    >
                      <Text
                        testID="buttonText"
                        style={headerRowStyles.buttonText}
                      >
                        재고조정
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>

          <View
            testID="inventory_HeaderContainer"
            style={inventoryStyles.inventory_HeaderContainer}
          >
            <Text
              testID="name_headerText"
              style={inventoryStyles.inventory_item_headerText}
            >
              상품명
            </Text>
            <Text
              testID="unit_headerText"
              style={inventoryStyles.inventory_unit_headerText}
            >
              재고량
            </Text>
          </View>

          <FlatList
            testID="flat_inventory"
            data={filteredData}
            keyExtractor={(item) => item.품목_id}
            style={inventoryStyles.flat_inventory}
            renderItem={({ item, index }) => {
              if (!rowRefs.current[item.품목_id]) {
                rowRefs.current[item.품목_id] = React.createRef();
              }
              return (
                <InventoryItemRow
                  ref={rowRefs.current[item.품목_id]}
                  item={item}
                  inventoryType={inventoryType}
                  editMode={editMode}
                  onValueChange={handleValueChange}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onDelete={handleDelete}
                  index={index}
                />
              );
            }}
          />
        </>
      ) : (
        // 최종 확인 화면 (OrderRequest_store 스타일)
        <ScrollView
          testID="confirmationContainer"
          style={{ flex: 1, backgroundColor: "#fff" }}
        >
          <View
            testID="confirm_selectedItemsSection"
            style={confirmationStyles.confirm_selectedItemsSection}
          >
            <Text
              testID="confirm_sectionTitle"
              style={[
                confirmationStyles.confirm_sectionTitle,
                { textAlign: "center" },
              ]}
            >
              {inventoryType === "daily"
                ? "일별 재고 최종 확인"
                : "입고 재고 최종 확인"}
            </Text>
            {
              // 입고재고의 경우 창고_입고량이 0인 상품은 필터링하여 표시하지 않음
              (inventoryType === "daily"
                ? sortByCategory(itemsToSave)
                : sortByCategory(itemsToSave).filter(
                    (item) => (item as MergedMonthInventoryItem).창고_입고량 > 0
                  )
              ).map((item) => {
                const stockValue =
                  inventoryType === "daily"
                    ? (item as MergedInventoryItem).창고_재고량
                    : (item as MergedMonthInventoryItem).창고_입고량;

                return (
                  <View
                    testID="confirmationItemRow"
                    key={item.품목_id}
                    style={[
                      confirmationStyles.confirmationItemRow,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: moderateScale(5),
                      },
                    ]}
                  >
                    <Text
                      testID="confirm_selectItemName"
                      style={[
                        confirmationStyles.confirm_selectItemName,
                        { flex: 2 },
                      ]}
                    >
                      {item.품목명}
                    </Text>
                    <Text
                      testID="confirm_unitText"
                      style={[
                        confirmationStyles.confirm_unitText,
                        { flex: 1, textAlign: "center" },
                      ]}
                    >
                      {f.formatPrice(stockValue)}개
                    </Text>
                  </View>
                );
              })
            }

            <TouchableOpacity
              testID="saveButton"
              style={[
                confirmationStyles.saveButton,
                saving && { opacity: 0.5 },
              ]}
              onPress={handleFinalSave}
              disabled={saving}
            >
              <Text
                testID="saveButtonText"
                style={confirmationStyles.saveButtonText}
              >
                {saving ? "저장 중..." : "저장하기"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="backButton"
              style={confirmationStyles.backButton}
              onPress={handleBack}
            >
              <Text
                testID="backButtonText"
                style={confirmationStyles.backButtonText}
              >
                뒤로가기
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* 오류 모달 추가 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View testID="overlay" style={modalStyles.overlay}>
          <View
            testID="errorModalContainer"
            style={modalStyles.errorModalContainer}
          >
            <Text testID="errorTitle" style={modalStyles.errorTitle}>
              ⚠️ 단위 확인 필요 ⚠️
            </Text>
            <ScrollView
              testID="errorText"
              style={{
                maxHeight: screenHeight * 0.4,
                width: "100%",
                paddingHorizontal: moderateScale(10),
              }}
              showsVerticalScrollIndicator={false}
            >
              {/* 텍스트 부분을 마커(##)로 분할하여 숫자 부분에 색상 적용 */}
              <Text testID="errorText" style={modalStyles.errorText}>
                {errorModalText.split(/##(.*?)##/).map((part, index) => {
                  // 홀수 인덱스는 ## 사이의 내용(강조할 숫자)
                  return index % 2 === 1 ? (
                    <Text
                      key={index}
                      style={{
                        color: "#e53e3e",
                        fontWeight: "700",
                        backgroundColor: "#fff5f5",
                        paddingVertical: 1,
                        paddingHorizontal: 6,
                        borderRadius: 4,
                        overflow: "hidden",
                        borderWidth: 0.5,
                        borderColor: "#fed7d7",
                        marginHorizontal: 2,
                      }}
                    >
                      {part}
                    </Text>
                  ) : (
                    part
                  );
                })}
              </Text>
            </ScrollView>
            <View testID="buttonContainer" style={modalStyles.buttonContainer}>
              <TouchableOpacity
                testID="cancelButton"
                style={modalStyles.cancelButton}
                onPress={handleCancelError}
              >
                <Text
                  testID="cancelButtonText"
                  style={modalStyles.cancelButtonText}
                >
                  아니오
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="confirmButton"
                style={modalStyles.confirmButton}
                onPress={handleConfirmError}
              >
                <Text testID="buttonText" style={modalStyles.buttonText}>
                  예
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 저장 완료 모달 추가 */}
      <Modal
        testID="saveCompleteModal"
        visible={saveCompleteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseCompleteModal}
      >
        <View testID="modalCenteredView_2" style={modalStyles.centeredView}>
          <View testID="modalView_2" style={modalStyles.modalView}>
            <Text testID="modalTitle_2" style={modalStyles.modalTitle}>
              저장 완료
            </Text>
            <Text
              testID="modalText_Complete"
              style={[
                modalStyles.modalText,
                { marginBottom: moderateScale(-3) },
              ]}
            >
              {inventoryType === "daily"
                ? "일별재고가 성공적으로\n저장되었습니다."
                : "입고재고가 성공적으로\n저장되었습니다."}
            </Text>
            <TouchableOpacity
              testID="closeButton_Complete"
              style={[
                modalStyles.closeButton,
                { marginTop: moderateScale(10) },
              ]}
              onPress={handleCloseCompleteModal}
            >
              <Text testID="textStyle_Complete" style={modalStyles.textStyle}>
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Inventory_store;
