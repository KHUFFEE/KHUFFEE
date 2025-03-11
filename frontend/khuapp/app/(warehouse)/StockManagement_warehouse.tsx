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
        <Text testID="name_itemText" style={inventoryStyles.name_itemText}>
          {item.품목명}
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

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorItems, setErrorItems] = useState<APIProduct[]>([]);
  const [errorModalText, setErrorModalText] = useState("");
  const [pendingSaveAction, setPendingSaveAction] = useState<
    (() => Promise<void>) | null
  >(null);

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

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchItemsAndSuppliers = async () => {
      try {
        const itemsResponse = await fetch(
          `${RN_API_URL}/api/suppliers/items/`,
          { signal }
        );
        if (!itemsResponse.ok)
          throw new Error("품목 데이터를 불러오는 중 오류 발생");
        const itemsJson = await itemsResponse.json();
        setItemsData(itemsJson);

        const suppliersResponse = await fetch(`${RN_API_URL}/api/suppliers/`, {
          signal,
        });
        if (!suppliersResponse.ok)
          throw new Error("협력사 데이터를 불러오는 중 오류 발생");
        const suppliersJson = await suppliersResponse.json();
        setSuppliersData(suppliersJson);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      }
    };

    fetchItemsAndSuppliers();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (itemsData.length === 0 || suppliersData.length === 0) return;
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchInventoryData = async () => {
      setLoading(true);
      try {
        const today = getCurrentDateString();
        if (inventoryType === "monthly") {
          // 월간 재고인 경우, API 호출 없이 itemsData 기반으로 모든 창고_입고량을 0으로 설정
          const mergedData: InventoryItem[] = itemsData.map(
            (product: APIProduct) => ({
              ...product,
              매장_id: storeId,
              기간: today, // fetch 시에는 기존과 동일하게 설정 (POST 시에 새 기간 사용)
              창고_입고량: 0,
            })
          );
          const sortedData = f.sortProductsBySupplierAndName(
            mergedData,
            suppliersData
          ) as InventoryItem[];
          setInventoryData(sortedData);
          setFilteredData(sortedData);
        } else {
          // 일간 재고의 경우, API를 통해 데이터를 가져와 매칭
          const invUrl = `${RN_API_URL}/api/inventory/warehouse/?매장_id=${storeId}&기간=${today}`;
          const invResponse = await fetch(invUrl, { signal });
          if (!invResponse.ok)
            throw new Error("재고 데이터를 불러오는 중 오류 발생");
          const invData = await invResponse.json();
          const invArray = invData;
          const mergedData: InventoryItem[] = itemsData.map(
            (product: APIProduct) => {
              const matchingInv = invArray.find(
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
            suppliersData
          ) as InventoryItem[];
          setInventoryData(sortedData);
          setFilteredData(sortedData);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
    return () => {
      controller.abort();
    };
  }, [storeId, inventoryType, itemsData, suppliersData]);

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

    const unitType = inventoryType === "daily" ? "출고개수" : "입고개수";
    let modalText = `⚠️ 숫자가 맞지 않아요! ⚠️\n\n`;

    modalText += `다음 상품들의 숫자를 확인해 주세요:\n\n`;

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

      // 더 간단한 형식으로 표시
      modalText += `🔹 ${item.품목명}\n`;
      modalText += `   → 기준 개수: ${unitValue}개\n`;
      modalText += `   → 현재 개수: ${stockValue}개\n\n`;
    });

    if (items.length === 1) {
      modalText += `이 상품은 ${unitType}에 맞지 않아요.\n`;
      modalText += `${unitType}는 ${items[0].출고단위}개씩 맞춰야 해요.\n\n`;
    } else {
      modalText += `위 상품들은 ${unitType}에 맞지 않아요.\n`;
      modalText += `각 상품의 기준 개수에 맞춰야 해요.\n\n`;
    }

    modalText += `그래도 저장할까요?\n`;
    modalText += `• 예 = 이대로 저장하기\n`;
    modalText += `• 아니요 = 돌아가서 고치기`;

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
        setSaving(true);
        try {
          await Promise.all(
            (inventoryData as MergedInventoryItem[]).map((item) => {
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
          setEditMode(false);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setSaving(false);
        }
      });
      return;
    }

    // 단위에 문제가 없으면 바로 저장 진행
    setSaving(true);
    try {
      await Promise.all(
        (inventoryData as MergedInventoryItem[]).map((item) => {
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
      setEditMode(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
        setSaving(true);
        try {
          const period = getPeriodStringForMonthly();
          await Promise.all(
            (inventoryData as MergedMonthInventoryItem[]).map((item) => {
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
          setEditMode(false);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setSaving(false);
        }
      });
      return;
    }

    // 단위에 문제가 없으면 바로 저장 진행
    setSaving(true);
    try {
      const period = getPeriodStringForMonthly();
      await Promise.all(
        (inventoryData as MergedMonthInventoryItem[]).map((item) => {
          const payload = {
            매장_id: storeId,
            품목_id: item.품목_id,
            기간: period,
            창고_입고량: parseInt(item.창고_입고량.toString(), 10),
          };
          return fetch(`${RN_API_URL}/api/orders/warehouse_incoming_update/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).then((response) => {
            if (!response.ok) {
              throw new Error(`품목 ${item.품목명} 월간 업데이트 실패`);
            }
          });
        })
      );
      setEditMode(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (type: "daily" | "monthly") => {
    setEditMode(false);
    setInventoryType(type);
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
              inventoryType === "daily" && toggleButtonStyles.buttonTextActive,
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

      <View testID="searchContainer" style={searchStyles.searchContainer}>
        <Search
          testID="searchIconInInput"
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
              ) : (
                <TouchableOpacity
                  testID="smallButton"
                  style={headerRowStyles.smallButton}
                  onPress={() => setEditMode(true)}
                >
                  <Text testID="buttonText" style={headerRowStyles.buttonText}>
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
              ) : (
                <TouchableOpacity
                  testID="smallButton"
                  style={headerRowStyles.smallButton}
                  onPress={() => setEditMode(true)}
                >
                  <Text testID="buttonText" style={headerRowStyles.buttonText}>
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

      {/* 오류 모달 추가 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.errorModalContainer}>
            <Text style={modalStyles.errorTitle}>단위 오류</Text>
            <ScrollView style={{ maxHeight: screenHeight * 0.4 }}>
              <Text style={modalStyles.errorText}>{errorModalText}</Text>
            </ScrollView>
            <View style={modalStyles.buttonContainer}>
              <TouchableOpacity
                style={modalStyles.cancelButton}
                onPress={handleCancelError}
              >
                <Text style={modalStyles.cancelButtonText}>아니요</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.confirmButton}
                onPress={handleConfirmError}
              >
                <Text style={modalStyles.buttonText}>예</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Inventory_store;
