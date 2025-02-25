import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { RN_API_URL } from '@env';
import * as f from '../../src/components/ui/common/function';
import { inventoryStyles } from '../../src/styles/Inventory_styles';
import { APIProduct } from '../../src/components/ui/common/types';
import { moderateScale } from 'react-native-size-matters';
import { styles} from '../../src/components/ui/common/commonstyler';

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
      <View testID="cardContent" style={inventoryStyles.inventory_cardContent}>
        <View testID="inventory_selectItemRowContainer" style={inventoryStyles.inventory_selectItemRowContainer}>
          <Text testID="name_itemText" style={inventoryStyles.name_itemText}>
            {item.품목명}
          </Text>
          {inventoryType === 'daily' ? (
            editMode ? (
              <TextInput
                testID="itemText"
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
                testID="itemText"
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
  // 추가: 월간 재고 수정 가능 여부 (테이블 상태가 1이면 true)
  const [isMonthlyEditable, setIsMonthlyEditable] = useState<boolean>(true);

  // inventoryType에 따라 수정 대상 필드를 분기함
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

  const getCurrentDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // inventoryType에 따라 다른 API 호출 (일간, 월간)
  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      if (inventoryType === 'daily') {
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
      } else {
        await Promise.all(
          (inventoryData as MergedMonthInventoryItem[]).map(item => {
            const payload = {
              매장_id: storeId,
              품목_id: item.품목_id,
              기간: item.기간,
              월말_재고량: item.월말_재고량,
            };
            return fetch(`${RN_API_URL}/api/inventory/store_monthend_inventory_update/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }).then(response => {
              if (!response.ok) {
                throw new Error(`품목 ${item.품목명} 월말 재고 업데이트 실패`);
              }
            });
          })
        );
      }
      setEditMode(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // inventoryType이 변경되면 데이터를 새로 불러오고, 월간인 경우 관리 API로 수정 가능 여부를 체크
  useEffect(() => {
    if (!storeId) return;
    setInventoryData([]);
    setLoading(true);
    // 만약 월간 재고라면 관리 API에서 "매장_월말재고"의 상태를 확인
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
        // 월간 재고의 경우 응답 객체 내 "inventories" 배열 사용
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
      <View style={inventoryStyles.container}>
        <Text style={inventoryStyles.message}>재고 데이터가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View testID="status_container" style={inventoryStyles.status_container}>
      <View style={toggleButtonStyles.container}>
        <TouchableOpacity
          style={[
            toggleButtonStyles.button,
            inventoryType === 'daily' && toggleButtonStyles.buttonActive,
          ]}
          onPress={() => handleToggle('daily')}
        >
          <Text
            style={[
              toggleButtonStyles.buttonText,
              inventoryType === 'daily' && toggleButtonStyles.buttonTextActive,
            ]}
          >
            일일 재고
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            toggleButtonStyles.button,
            inventoryType === 'monthly' && toggleButtonStyles.buttonActive,
          ]}
          onPress={() => handleToggle('monthly')}
        >
          <Text
            style={[
              toggleButtonStyles.buttonText,
              inventoryType === 'monthly' && toggleButtonStyles.buttonTextActive,
            ]}
          >
            월말 재고
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={inventoryStyles.title}>
        {inventoryType === 'daily' ? '매장 재고 관리 (일일 현재고)' : '매장 재고 관리 (월말 재고)'}
      </Text>
      <View testID="inventory_HeaderContainer" style={inventoryStyles.inventory_HeaderContainer}>
        <Text testID="name_headerText" style={inventoryStyles.inventory_item_headerText}>
          상품명
        </Text>
        <Text testID="unit_headerText" style={inventoryStyles.inventory_unit_headerText}>
          재고량
        </Text>
      </View>
      <FlatList
        testID="FlatList"
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
      <TouchableOpacity
        style={[
          inventoryStyles.editButton,
          inventoryType === 'monthly' && !isMonthlyEditable && { opacity: 0.3 },
        ]}
        onPress={
          editMode
            ? handleGlobalSave
            : () => setEditMode(true)
        }
        disabled={inventoryType === 'monthly' && !isMonthlyEditable}
      >
        <Text style={inventoryStyles.editButtonText}>
          {editMode ? (saving ? '저장 중...' : '전체 저장') : '수정'}
        </Text>
      </TouchableOpacity>
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

export default Inventory;
