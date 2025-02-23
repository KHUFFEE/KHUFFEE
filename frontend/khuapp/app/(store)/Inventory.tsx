import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  TextInput, 
  TouchableOpacity 
} from 'react-native';
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
 * APIProduct의 필수 필드(품목_id, 협력사_id, 품목명, 협력사명, 종류, 규격, 단위, 입고단가, 입고단위, 입고단위단가, 출고단위)를 포함하면서
 * 재고 데이터의 추가 필드(매장_id, 기간, 매장_재고량)도 함께 사용합니다.
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
  );
};

const Inventory: React.FC<InventoryProps> = ({ storeId }) => {
  const [inventoryData, setInventoryData] = useState<MergedInventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // 각 항목의 재고량이 변경되면 inventoryData를 업데이트
  const handleValueChange = (품목_id: string, newValue: string) => {
    setInventoryData(prev =>
      prev.map(item =>
        item.품목_id === 품목_id
          ? { ...item, 매장_재고량: parseFloat(newValue) || 0 }
          : item
      )
    );
  };

  // 현재 날짜를 "YYYY.MM.DD" 형식으로 반환하는 헬퍼 함수
  const getCurrentDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 전체 저장 버튼: 모든 항목의 업데이트 API 호출
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
      // 저장 성공 시 편집 모드를 종료
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
        // 재고 데이터, 품목 데이터, 협력사 데이터를 동시에 불러옴
        const [invResponse, itemsData, suppliersData] = await Promise.all([
          fetch(`${RN_API_URL}/api/inventory/store/?매장_id=${storeId}`),
          f.fetchApiItems(),
          f.fetchSuppliers()
        ]);
        if (!invResponse.ok) {
          throw new Error('재고 데이터를 불러오지 못했습니다.');
        }
        const invData = await invResponse.json();
        // 모든 제품 목록(itemsData)에서 각 제품에 해당하는 재고 데이터를 병합합니다.
        // 만약 해당 제품의 재고 데이터가 없으면 매장_재고량을 0으로, 기간은 현재 날짜로 설정합니다.
        const getCurrentDateString = (): string => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return `${year}.${month}.${day}`;
        };
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
      <View style={styles.loading_Container}>
        <ActivityIndicator size="large" color="#0D326F80" />
        <Text style={styles.loading_Text}>로딩 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={inventoryStyles.container}>
        <Text style={inventoryStyles.message}>오류 발생: {error}</Text>
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
      {/* 매장 재고 관리 제목 바로 아래에 첫번째 항목의 기간 표시 */}
      <Text testID='term_of_name' style={inventoryStyles.term_of_name}>
        {f.formatDayString(inventoryData[0].기간)} 재고 현황
      </Text>
      {/* 헤더 영역: 공유 스타일 사용 */}
      <View testID="inventory_HeaderContainer" style={inventoryStyles.inventory_HeaderContainer}>
        <Text testID="name_headerText" style={inventoryStyles.inventory_item_headerText}>품목명</Text>
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
