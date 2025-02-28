import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TextInput, TouchableOpacity, StyleSheet, Modal, Button } from 'react-native';
import { RN_API_URL } from '@env';
import * as f from '../../src/components/ui/common/function';
import { styles } from '../../src/components/ui/common/commonstyler';
import { inventoryStyles } from '../../src/styles/Inventory_styles';
import { APIProduct } from '../../src/components/ui/common/types';
import { moderateScale } from 'react-native-size-matters';

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

export const formatPrice = (value: number | undefined | null): string => {
  const num = value ?? 0;
  return num.toLocaleString();
};

type InventoryItem = MergedInventoryItem | MergedMonthInventoryItem;

interface InventoryProps {
  storeId: string;
}

interface InventoryItemRowProps {
  item: InventoryItem;
  inventoryType: 'daily' | 'monthly';
  editMode: boolean;
  onValueChange: (품목_id: string, newValue: string) => void;
}

const InventoryItemRow: React.FC<InventoryItemRowProps> = ({ item, inventoryType, editMode, onValueChange }) => {
  const dailyValue = (item as MergedInventoryItem).매장_재고량 ?? 0;
  const monthlyValue = (item as MergedMonthInventoryItem).월말_재고량 ?? 0;

  return (
    <View testID="itemContainer" style={inventoryStyles.itemContainer}>
      <View testID="cardContent" style={styles.cardContent}>
        <View testID="inventory_selectItemRowContainer" style={inventoryStyles.inventory_selectItemRowContainer}>
          <Text testID="name_itemText" style={inventoryStyles.name_itemText}>
            {item.품목명}
          </Text>
          {inventoryType === 'daily' ? (
            editMode ? (
              <TextInput
                testID="unit_itemText"
                style={inventoryStyles.unit_itemText}
                value={dailyValue.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onValueChange(item.품목_id, text)}
              />
            ) : (
              <Text testID="unit_itemText" style={inventoryStyles.unit_itemText}>
                {f.formatPrice(dailyValue)}
              </Text>
            )
          ) : (
            editMode ? (
              <TextInput
                testID="unit_itemText"
                style={inventoryStyles.unit_itemText}
                value={monthlyValue.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onValueChange(item.품목_id, text)}
              />
            ) : (
              <Text testID="unit_itemText" style={inventoryStyles.unit_itemText}>
                {f.formatPrice(monthlyValue)}
              </Text>
            )
          )}
        </View>
      </View>
    </View>
  );
};

const Inventory: React.FC<InventoryProps> = ({ storeId }) => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [inventoryType, setInventoryType] = useState<'daily' | 'monthly'>('daily');
  const [saving, setSaving] = useState<boolean>(false);
  // 월간 재고 수정 가능 여부 (관리 API의 상태가 1이면 수정 가능)
  const [isMonthlyEditable, setIsMonthlyEditable] = useState<boolean>(true);
  // 모달 관련 상태 (수정 불가 안내)
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // inventoryData 업데이트 (daily: 매장_재고량, monthly: 월말_재고량)
  const handleValueChange = (품목_id: string, newValue: string) => {
    setInventoryData(prev =>
      prev.map(item =>
        item.품목_id === 품목_id
          ? inventoryType === 'daily'
            ? { ...item, 매장_재고량: parseFloat(newValue) || 0 }
            : { ...item, 월말_재고량: parseFloat(newValue) || 0 }
          : item
      )
    );
  };

  // getCurrentDateString: 일간 데이터의 기간 (예: "2025.03.02")
  const getCurrentDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 일간 재고 업데이트 (daily update)
  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        (inventoryData as MergedInventoryItem[]).map(item => {
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
          }).then(response => {
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

  // 월간 재고 업데이트 (monthly update)
  // GET했던 월간 데이터에서 "기간" 등 원래 형식을 그대로 사용하여,
  // 사용자가 수정한 월말_재고량을 포함한 전체 항목을 POST 요청함.
  const handleMonthlySave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        (inventoryData as MergedMonthInventoryItem[]).map(item => {
          const payload = {
            매장_id: storeId,
            품목_id: item.품목_id,
            기간: item.기간, // GET 시 받아온 월간 데이터의 기간 (예: "2025.03")
            월말_재고량: item.월말_재고량,
          };
          return fetch(`${RN_API_URL}/api/inventory/store_monthend_inventory_update/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).then(response => {
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

  // 월말 재고 반영 (일간에서 월간 반영)
  // 1. 일간 업데이트 진행
  // 2. GET으로 월간 데이터를 받아,
  // 3. 각 항목에 대해, 일간 재고와 일치하도록 월말_재고량을 업데이트하는 POST 요청 진행
  // 단, 관리 API 상태가 0이면 모달로 안내하고 POST 요청 중단.
  const handleReflectMonthly = async () => {
    setSaving(true);
    try {
      // 관리 API를 통해 월간 수정 가능 여부 재확인
      const statusRes = await fetch(`${RN_API_URL}/api/management/table_status_list/`);
      const statusData = await statusRes.json();
      const monthlyTable = statusData.find((item: any) => item.테이블 === '매장_월말재고');
      if (!(monthlyTable && monthlyTable.상태 === 1)) {
        setModalVisible(true);
        setSaving(false);
        return;
      }
      // Step 1: 일간 재고 업데이트
      await Promise.all(
        (inventoryData as MergedInventoryItem[]).map(item => {
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
          }).then(response => {
            if (!response.ok) {
              throw new Error(`품목 ${item.품목명} 일간 업데이트 실패`);
            }
          });
        })
      );
      // Step 2: GET 기존 월간 재고 데이터
      const monthlyResponse = await fetch(`${RN_API_URL}/api/inventory/store_monthend/?매장_id=${storeId}`);
      const monthlyData = await monthlyResponse.json();
      const monthlyArray = monthlyData.inventories;
      // Step 3: 각 월간 항목 업데이트: 일간 재고와 일치하도록
      await Promise.all(
        monthlyArray.map((monthlyRecord: any) => {
          const matchingDaily = inventoryData.find((dailyItem) => dailyItem.품목_id === monthlyRecord.품목_id);
          const newMonthlyQty = matchingDaily ? (matchingDaily as MergedInventoryItem).매장_재고량 : monthlyRecord.월말_재고량;
          const payload = {
            매장_id: storeId,
            품목_id: monthlyRecord.품목_id,
            기간: monthlyRecord.기간,
            월말_재고량: newMonthlyQty,
          };
          return fetch(`${RN_API_URL}/api/inventory/store_monthend_inventory_update/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).then(response => {
            if (!response.ok) {
              throw new Error(`품목 ${monthlyRecord.품목명} 월말 업데이트 실패`);
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

  // inventoryType 변경 시 데이터 새로 불러오기 및 월간 수정 가능 여부 체크
  useEffect(() => {
    if (!storeId) return;
    setInventoryData([]);
    setLoading(true);
    if (inventoryType === 'monthly') {
      fetch(`${RN_API_URL}/api/management/table_status_list/`)
        .then(res => res.json())
        .then(data => {
          const monthlyTable = data.find((item: any) => item.테이블 === '매장_월말재고');
          setIsMonthlyEditable(monthlyTable && monthlyTable.상태 === 1);
        })
        .catch(err => {
          setIsMonthlyEditable(false);
        });
    } else {
      setIsMonthlyEditable(true);
    }
    const fetchData = async () => {
      try {
        const [invResponse, itemsData, suppliersData] = await Promise.all([
          fetch(
            inventoryType === 'daily'
              ? `${RN_API_URL}/api/inventory/store/?매장_id=${storeId}`
              : `${RN_API_URL}/api/inventory/store_monthend/?매장_id=${storeId}`
          ),
          f.fetchApiItems(),
          f.fetchSuppliers()
        ]);
        if (!invResponse.ok) {
          throw new Error(
            inventoryType === 'daily'
              ? '재고 데이터를 불러오지 못했습니다.'
              : '월간 재고 데이터를 불러오지 못했습니다.'
          );
        }
        const invData = await invResponse.json();
        const invArray = inventoryType === 'daily' ? invData : invData.inventories;
        const mergedData: InventoryItem[] = itemsData.map((product: APIProduct) => {
          const matchingInv = invArray.find((inv: any) => inv.품목_id === product.품목_id);
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
        });
        const sortedData = f.sortProductsBySupplierAndName(mergedData, suppliersData) as InventoryItem[];
        setInventoryData(sortedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        <Text testID="message" style={inventoryStyles.message}>재고 데이터가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View testID="status_container" style={inventoryStyles.status_container}>
      {/* 모달: 월별 재고 수정 불가 안내 */}
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
            일일 재고
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="button"
          style={[
            toggleButtonStyles.button,
            inventoryType === 'monthly' && toggleButtonStyles.buttonActive,
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
            월간 재고
          </Text>
        </TouchableOpacity>
      </View>
      <View testID="headerRowStyles_container" style={headerRowStyles.container}>
        <Text testID="title" style={inventoryStyles.title}>
          {inventoryType === 'daily' ? '일일 현재고' : '매장 재고 관리 월간 재고'}
        </Text>
        {inventoryType === 'daily' && (
          <View testID="buttonContainer" style={headerRowStyles.buttonContainer}>
            {editMode ? (
              <>
                <TouchableOpacity testID="smallButton" style={headerRowStyles.smallButton} onPress={handleGlobalSave} disabled={saving}>
                  <Text testID="buttonText" style={headerRowStyles.buttonText}>{saving ? '저장 중...' : '수정완료'}</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="smallButton" style={headerRowStyles.smallButton} onPress={handleReflectMonthly} disabled={saving}>
                  <Text testID="buttonText" style={headerRowStyles.buttonText}>월말 재고 반영</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity testID="smallButton" style={headerRowStyles.smallButton} onPress={() => setEditMode(true)}>
                <Text testID="buttonText" style={headerRowStyles.buttonText}>수정</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {inventoryType === 'monthly' && (
          <View testID="buttonContainer" style={headerRowStyles.buttonContainer}>
            {editMode ? (
              <TouchableOpacity
                testID="smallButton"
                style={headerRowStyles.smallButton}
                onPress={handleMonthlySave}
                disabled={saving || !isMonthlyEditable}
              >
                <Text testID="buttonText" style={headerRowStyles.buttonText}>{saving ? '저장 중...' : '월간 수정 완료'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                testID="smallButton"
                style={[headerRowStyles.smallButton,!isMonthlyEditable && { opacity: 0.5 }]}
                onPress={() => setEditMode(true)}
                disabled={!isMonthlyEditable}
              >
                <Text testID="buttonText" style={headerRowStyles.buttonText}>월간 재고 수정</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      <View testID="inventory_HeaderContainer" style={inventoryStyles.inventory_HeaderContainer}>
        <Text testID="name_headerText" style={inventoryStyles.inventory_item_headerText}>
          상품명
        </Text>
        <Text testID="unit_headerText" style={inventoryStyles.inventory_unit_headerText}>
          재고량
        </Text>
      </View>
      <FlatList
        testID="flat_inventory"
        data={inventoryData}
        keyExtractor={(item) => item.품목_id}
        style={inventoryStyles.flat_inventory}
        renderItem={({ item }) => (
          <InventoryItemRow
            item={item}
            inventoryType={inventoryType}
            editMode={editMode}
            onValueChange={handleValueChange}
          />
        )}
      />
    </View>
  );
};

const toggleButtonStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
  },
  button: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(20),
    marginHorizontal: moderateScale(5),
    borderWidth: 1,
    borderColor: '#0D326F',
  },
  buttonActive: {
    backgroundColor: '#0D326F',
  },
  buttonText: {
    fontSize: 14,
    color: '#0D326F',
    fontWeight: 'bold',
  },
  buttonTextActive: {
    color: '#fff',
  },
});

const headerRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // 변경된 부분',
    marginBottom: moderateScale(10),
    paddingRight: moderateScale(8),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  smallButton: {
    backgroundColor: '#0D326F',
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(10),
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: moderateScale(20),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  modalText: {
    marginBottom: moderateScale(20),
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Inventory;
