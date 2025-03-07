import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Modal,
  Button,
} from 'react-native';
import { RN_API_URL } from '@env';
import * as f from '../../src/components/ui/common/function';
import { styles } from '../../src/components/ui/common/commonstyler';
import {
  inventoryStyles,
  toggleButtonStyles,
  editModeStyles,
  searchStyles,
  modalStyles,
  headerRowStyles,
} from '../../src/styles/Inventory_styles';
import { APIProduct } from '../../src/components/ui/common/types';
import { Search, Minus, Plus, Trash2, X } from 'lucide-react-native';

// 일간 재고 타입
export interface MergedInventoryItem extends APIProduct {
  매장_id: string;
  기간: string;
  매장_재고량: number;
}

// 월간 재고 타입
export interface MergedMonthInventoryItem extends APIProduct {
  매장_id: string;
  기간: string;
  월말_재고량: number;
}

type InventoryItem = MergedInventoryItem | MergedMonthInventoryItem;

interface InventoryProps {
  storeId: string;
}

interface InventoryItemRowProps {
  item: InventoryItem;
  inventoryType: 'daily' | 'monthly';
  editMode: boolean;
  onValueChange: (품목_id: string, newValue: string) => void;
  onIncrement: (품목_id: string) => void;
  onDecrement: (품목_id: string) => void;
  onDelete: (품목_id: string) => void;
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
  } = props;
  const inventoryValue =
    inventoryType === 'daily'
      ? (item as MergedInventoryItem).매장_재고량
      : (item as MergedMonthInventoryItem).월말_재고량;

  // 로컬 상태: 사용자가 입력 중인 값을 관리
  const [localInput, setLocalInput] = useState<string>(
    inventoryValue === 0 ? '' : f.formatPrice(inventoryValue)
  );
  const [isFocused, setIsFocused] = useState(false);

  // 부모의 inventoryData가 업데이트되면 localInput도 업데이트
  useEffect(() => {
    if (!isFocused) {
      if (editMode) {
        setLocalInput(inventoryValue === 0 ? "0" : f.formatPrice(inventoryValue));
      } else {
        setLocalInput(inventoryValue === 0 ? '' : f.formatPrice(inventoryValue));
      }
    }
  }, [inventoryValue, isFocused, editMode]);


  // 외부에서 commit() 호출 시 현재 입력값을 파싱하여 업데이트
  useImperativeHandle(
    ref,
    () => ({
      commit: () => {
        const parsed = parseFloat(localInput.replace(/,/g, ''));
        const numericValue = isNaN(parsed) ? 0 : parsed;
        // 부모의 상태만 업데이트. 이후 useEffect가 inventoryValue 변경에 따라 localInput을 업데이트함
        onValueChange(item.품목_id, numericValue.toString());
      },
    }),
    [localInput, item.품목_id, onValueChange]
  );

  return (
    <View testID="itemContainer" style={inventoryStyles.itemContainer}>
      <View
        testID="inventory_selectItemRowContainer"
        style={inventoryStyles.inventory_selectItemRowContainer}
      >
        <Text testID="name_itemText" style={inventoryStyles.name_itemText}>
          {item.품목명}
        </Text>

        {editMode ? (
          <View testID="controlContainer" style={editModeStyles.controlContainer}>
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
                  // 현재 입력된 텍스트에서 콤마 제거
                  const rawText = text.replace(/,/g, '');
                  // 숫자로 파싱
                  const parsed = parseFloat(rawText);
                  // 숫자면 포맷 적용, 아니면 그대로 사용 (예: 빈 문자열)
                  const formatted = isNaN(parsed) ? rawText : f.formatPrice(parsed);
                  setLocalInput(formatted);
                  onValueChange(item.품목_id, isNaN(parsed) ? "0" : parsed.toString());
                }}
                onFocus={() => {
                  setIsFocused(true);
                  if (localInput === "0") {
                    setLocalInput('');
                  }
                }}
                onBlur={() => {
                  setIsFocused(false);
                  const parsed = parseFloat(localInput.replace(/,/g, ''));
                  const numericValue = isNaN(parsed) ? 0 : parsed;
                  setLocalInput(
                    numericValue === 0
                      ? (editMode ? "0" : '')
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

const Inventory: React.FC<InventoryProps> = ({ storeId }) => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [inventoryType, setInventoryType] = useState<'daily' | 'monthly'>(
    'daily'
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [isMonthlyEditable, setIsMonthlyEditable] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

  // 각 InventoryItemRow의 ref를 저장할 객체
  const rowRefs = useRef<{
    [key: string]: React.RefObject<{ commit: () => void }>;
  }>({});

  // 현재 날짜를 "YYYY.MM.DD" 형식으로 반환
  const getCurrentDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const handleValueChange = (품목_id: string, newValue: string) => {
    setInventoryData((prev) =>
      prev.map((item) =>
        item.품목_id === 품목_id
          ? inventoryType === 'daily'
            ? { ...item, 매장_재고량: parseFloat(newValue) || 0 }
            : { ...item, 월말_재고량: parseFloat(newValue) || 0 }
          : item
      )
    );
  };

  const handleIncrement = (품목_id: string) => {
    setInventoryData((prev) =>
      prev.map((item) =>
        item.품목_id === 품목_id
          ? inventoryType === 'daily'
            ? {
                ...item,
                매장_재고량:
                  ((item as MergedInventoryItem).매장_재고량 || 0) + 1,
              }
            : {
                ...item,
                월말_재고량:
                  ((item as MergedMonthInventoryItem).월말_재고량 || 0) + 1,
              }
          : item
      )
    );
  };

  const handleDecrement = (품목_id: string) => {
    setInventoryData((prev) =>
      prev.map((item) => {
        if (item.품목_id !== 품목_id) return item;
        if (inventoryType === 'daily') {
          const currentValue = (item as MergedInventoryItem).매장_재고량 || 0;
          return { ...item, 매장_재고량: Math.max(0, currentValue - 1) };
        } else {
          const currentValue =
            (item as MergedMonthInventoryItem).월말_재고량 || 0;
          return { ...item, 월말_재고량: Math.max(0, currentValue - 1) };
        }
      })
    );
  };

  const handleDelete = (품목_id: string) => {
    setInventoryData((prev) =>
      prev.map((item) =>
        item.품목_id === 품목_id
          ? inventoryType === 'daily'
            ? { ...item, 매장_재고량: 0 }
            : { ...item, 월말_재고량: 0 }
          : item
      )
    );
  };

  // 검색 필터 적용
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredData(inventoryData);
    } else {
      const filtered = inventoryData.filter((item) =>
        item.품목명.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchText, inventoryData]);

  // 모든 InventoryItemRow의 commit 메서드를 호출
  const commitAllRows = () => {
    Object.values(rowRefs.current).forEach((ref) => {
      ref.current?.commit();
    });
  };

  const handleGlobalSave = async () => {
    // 변경된 값 강제 반영
    commitAllRows();
    setSaving(true);
    try {
      await Promise.all(
        (inventoryData as MergedInventoryItem[]).map((item) => {
          const payload = {
            매장_id: storeId,
            품목_id: item.품목_id,
            기간: getCurrentDateString(),
            매장_재고량: item.매장_재고량,
          };
          return fetch(`${RN_API_URL}/api/inventory/store_inventory_update/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).then((response) => {
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

  const handleMonthlySave = async () => {
    // 변경된 값 강제 반영
    commitAllRows();
    setSaving(true);
    try {
      await Promise.all(
        (inventoryData as MergedMonthInventoryItem[]).map((item) => {
          const payload = {
            매장_id: storeId,
            품목_id: item.품목_id,
            기간: item.기간,
            월말_재고량: item.월말_재고량,
          };
          return fetch(
            `${RN_API_URL}/api/inventory/store_monthend_inventory_update/`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
  };

  // AbortController를 사용하여 재고 유형 전환 시 진행 중인 네트워크 요청 취소
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    setInventoryData([]);
    setLoading(true);

    if (inventoryType === 'monthly') {
      fetch(`${RN_API_URL}/api/management/table_status_list/`, { signal })
        .then((res) => res.json())
        .then((data) => {
          const monthlyTable = data.find(
            (item: any) => item.테이블 === '매장_월말재고'
          );
          setIsMonthlyEditable(monthlyTable && monthlyTable.상태 === 1);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setIsMonthlyEditable(false);
          }
        });
    } else {
      setIsMonthlyEditable(true);
    }

    const fetchData = async () => {
      try {
        const [invResponse, itemsData, suppliersData] = await Promise.all([
          fetch(
            inventoryType === 'daily'
              ? `${RN_API_URL}/api/inventory/store/?매장_id=${storeId}`   //요기 수정함
              : `${RN_API_URL}/api/inventory/store_monthend/?store_id=${storeId}`,
            { signal }
          ),
          f.fetchApiItems(),
          f.fetchSuppliers(),
        ]);
        if (!invResponse.ok) {
          throw new Error(
            inventoryType === 'daily'
              ? '재고 데이터를 불러오지 못했습니다.'
              : '월간 재고 데이터를 불러오지 못했습니다.'
          );
        }
        const invData = await invResponse.json();
        const invArray =
          inventoryType === 'daily' ? invData : invData.inventories;
        const mergedData: InventoryItem[] = itemsData.map(
          (product: APIProduct) => {
            const matchingInv = invArray.find(
              (inv: any) => inv.품목_id === product.품목_id
            );
            if (inventoryType === 'daily') {
              return {
                ...product,
                매장_id: storeId,
                기간: matchingInv ? matchingInv.기간 : getCurrentDateString(),
                매장_재고량: matchingInv ? matchingInv.매장_재고량 : 0,
              } as MergedInventoryItem;
            } else {
              return {
                ...product,
                매장_id: storeId,
                기간: matchingInv ? matchingInv.기간 : getCurrentDateString(),
                월말_재고량: matchingInv ? matchingInv.월말_재고량 : 0,
              } as MergedMonthInventoryItem;
            }
          }
        );
        const sortedData = f.sortProductsBySupplierAndName(
          mergedData,
          suppliersData
        ) as InventoryItem[];
        setInventoryData(sortedData);
        setFilteredData(sortedData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [storeId, inventoryType]);

  const handleToggle = (type: 'daily' | 'monthly') => {
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
            inventoryType === 'daily' && toggleButtonStyles.buttonActive,
            { marginRight: 1 },
          ]}
          onPress={() => handleToggle('daily')}
        >
          <Text
            testID="buttonText"
            style={[
              toggleButtonStyles.buttonText,
              inventoryType === 'daily' && toggleButtonStyles.buttonTextActive,
            ]}
          >
            일별 재고
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="button"
          style={[
            toggleButtonStyles.button,
            inventoryType === 'monthly' && toggleButtonStyles.buttonActive,
            { marginLeft: 1 },
          ]}
          onPress={() => handleToggle('monthly')}
        >
          <Text
            testID="buttonText"
            style={[
              toggleButtonStyles.buttonText,
              inventoryType === 'monthly' && toggleButtonStyles.buttonTextActive,
            ]}
          >
            월말 재고
          </Text>
        </TouchableOpacity>
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
            onPress={() => setSearchText('')}
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
          {inventoryType === 'daily' ? (
            <View testID="buttonContainer" style={headerRowStyles.buttonContainer}>
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
                    {saving ? '저장 중...' : '조정완료'}
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
            <View testID="buttonContainer" style={headerRowStyles.buttonContainer}>
              {editMode ? (
                <TouchableOpacity
                  testID="smallButton"
                  style={
                    saving || !isMonthlyEditable
                      ? headerRowStyles.disabledButton
                      : headerRowStyles.activeButton
                  }
                  onPress={handleMonthlySave}
                  disabled={saving || !isMonthlyEditable}
                >
                  <Text
                    testID="buttonText"
                    style={
                      saving || !isMonthlyEditable
                        ? headerRowStyles.disabledButtonText
                        : headerRowStyles.activeButtonText
                    }
                  >
                    {saving ? '저장 중...' : '실사완료'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  testID="smallButton"
                  style={
                    !isMonthlyEditable
                      ? headerRowStyles.disabledButton
                      : headerRowStyles.smallButton
                  }
                  onPress={() => setEditMode(true)}
                  disabled={!isMonthlyEditable}
                >
                  <Text
                    testID="buttonText"
                    style={
                      !isMonthlyEditable
                        ? headerRowStyles.disabledButtonText
                        : headerRowStyles.buttonText
                    }
                  >
                    재고실사
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
        renderItem={({ item }) => {
          // 각 행에 대해 ref 생성 및 할당
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
            />
          );
        }}
      />
    </View>
  );
};

export default Inventory;
