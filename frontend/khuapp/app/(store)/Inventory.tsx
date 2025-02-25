import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { RN_API_URL } from '@env';
import * as f from '../../src/components/ui/common/function';
import { styles, inventoryStyles } from '../../src/components/ui/common/commonstyler';
import { APIProduct } from '../../src/components/ui/common/types';
import { moderateScale } from 'react-native-size-matters';

interface InventoryProps {
  storeId: string;
}

/**
 * MergedInventoryItem은 재고 데이터와 품목 데이터(APIProduct)의 속성을 모두 포함합니다.
 */
export interface MergedInventoryItem extends APIProduct {
  매장_id: string;
  기간: string;
  매장_재고량: number;
}

interface InventoryItemRowProps {
  item: MergedInventoryItem;
  editMode: boolean;
  onValueChange: (품목_id: string, newValue: string) => void;
}

const InventoryItemRow: React.FC<InventoryItemRowProps> = ({ item, editMode, onValueChange }) => {
  return (

      <View testID='itemContainer' style={inventoryStyles.itemContainer}>
        <View testID="cardContent"style={styles.cardContent}>
          <View testID='inventory_selectItemRowContainer'style={inventoryStyles.inventory_selectItemRowContainer}>
            <Text testID='name_itemText' style={inventoryStyles.name_itemText}>
              {item.품목명}
            </Text>
            {editMode ? (
              <TextInput
                testID='itemText'
                style={inventoryStyles.itemText}
                value={item.매장_재고량.toString()}
                keyboardType="numeric"
                onChangeText={(text) => onValueChange(item.품목_id, text)}
              />
            ) : (
              <Text testID='unit_itemText' style={inventoryStyles.unit_itemText}>
                {f.formatPrice(item.매장_재고량)}
              </Text>
            )}
          </View>
        </View>
      </View>
  );
};

const Inventory: React.FC<InventoryProps> = ({ storeId }) => {
  const [inventoryData, setInventoryData] = useState<MergedInventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // 각 항목의 재고량 변경 시 데이터 업데이트
  const handleValueChange = (품목_id: string, newValue: string) => {
    setInventoryData(prev =>
      prev.map(item =>
        item.품목_id === 품목_id
          ? { ...item, 매장_재고량: parseFloat(newValue) || 0 }
          : item
      )
    );
  };

  // 현재 날짜를 "YYYY.MM.DD" 형식으로 반환
  const getCurrentDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 전체 저장 버튼: 모든 항목 업데이트 API 호출
  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        inventoryData.map(item => {
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
      // 저장 성공 시 편집 모드 종료
      setEditMode(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!storeId) return;
    const fetchData = async () => {
      try {
        const [invResponse, itemsData, suppliersData] = await Promise.all([
          fetch(`${RN_API_URL}/api/inventory/store/?매장_id=${storeId}`),
          f.fetchApiItems(),
          f.fetchSuppliers()
        ]);
        if (!invResponse.ok) {
          throw new Error('재고 데이터를 불러오지 못했습니다.');
        }
        const invData = await invResponse.json();
        const mergedData: MergedInventoryItem[] = itemsData.map((product: APIProduct) => {
          const matchingInv = invData.find((inv: any) => inv.품목_id === product.품목_id);
          return {
            ...product,
            매장_id: storeId,
            기간: matchingInv ? matchingInv.기간 : getCurrentDateString(),
            매장_재고량: matchingInv ? matchingInv.매장_재고량 : 0,
          };
        });
        const sortedData = f.sortProductsBySupplierAndName(mergedData, suppliersData) as MergedInventoryItem[];
        setInventoryData(sortedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId]);

  if (loading) {
    return (
      <View testID='loading_Container'style={styles.loading_Container}>
        <ActivityIndicator size="large" color="#0D326F80" />
        <Text testID='loading_Text'style={styles.loading_Text}>로딩 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View testID="container"style={inventoryStyles.container}>
        <Text testID='message'style={inventoryStyles.message}>오류 발생: {error}</Text>
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
    <View testID='status_container' style={styles.status_container}>
      <Text style={inventoryStyles.title}>매장 재고 관리</Text>
      <Text testID='term_of_name' style={inventoryStyles.term_of_name}>
        일일 현재고
      </Text>
      <View testID="inventory_HeaderContainer" style={inventoryStyles.inventory_HeaderContainer}>
        <Text testID="name_headerText" style={inventoryStyles.inventory_item_headerText}>상품명</Text>
        <Text testID="unit_headerText" style={inventoryStyles.inventory_unit_headerText}>재고량</Text>
      </View>
      <FlatList
        testID='FlatList'
        data={inventoryData}
        keyExtractor={(item) => item.품목_id}
        style={inventoryStyles.flat_inventory}
        renderItem={({ item }) => (
          <InventoryItemRow
            item={item}
            editMode={editMode}
            onValueChange={handleValueChange}
          />
        )}
      />
      <View testID='몰라' style={{ marginVertical: moderateScale(2) }}>
        {editMode ? (
          <TouchableOpacity
            style={{ backgroundColor: '#0D326F', padding: 10, borderRadius: 4 }}
            onPress={handleGlobalSave}
            disabled={saving}
          >
            <Text style={{ color: '#fff', textAlign: 'center' }}>
              {saving ? '저장 중...' : '전체 저장'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{ backgroundColor: '#0D326F', padding: 10, borderRadius: 4 }}
            onPress={() => setEditMode(true)}
          >
            <Text style={{ color: '#fff', textAlign: 'center' }}>수정</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Inventory;
