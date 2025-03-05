import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TextInput, TouchableOpacity, StyleSheet, Modal, Button } from 'react-native';
import { RN_API_URL } from '@env';
import * as f from '../../src/components/ui/common/function';
import { styles } from '../../src/components/ui/common/commonstyler';
import { inventoryStyles, toggleButtonStyles, editModeStyles, searchStyles, modalStyles, headerRowStyles } from '../../src/styles/Inventory_styles';
import { APIProduct } from '../../src/components/ui/common/types';
import { moderateScale } from 'react-native-size-matters';
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
  onIncrement: (품목_id: string) => void;
  onDecrement: (품목_id: string) => void;
  onDelete: (품목_id: string) => void;
}

const InventoryItemRow: React.FC<InventoryItemRowProps> = ({ 
  item, 
  inventoryType, 
  editMode, 
  onValueChange,
  onIncrement,
  onDecrement,
  onDelete
}) => {
  // 재고량 값 (daily: 매장_재고량, monthly: 월말_재고량)
  const inventoryValue = inventoryType === 'daily' 
    ? (item as MergedInventoryItem).매장_재고량 
    : (item as MergedMonthInventoryItem).월말_재고량;

  return (
    <View testID="itemContainer" style={inventoryStyles.itemContainer}>
      <View testID="inventory_selectItemRowContainer" style={inventoryStyles.inventory_selectItemRowContainer}>
        <Text testID="name_itemText" style={inventoryStyles.name_itemText}>
          {item.품목명}
        </Text>
        
        {editMode ? (
          <View testID="controlContainer" style={editModeStyles.controlContainer}>
            <TouchableOpacity 
              testID="decrementButton" 
              style={[editModeStyles.controlButton, editModeStyles.leftButton]}
              onPress={() => onDecrement(item.품목_id)}
            >
              <Minus color="#0A2A5E" size={16} />
            </TouchableOpacity>
            
            <TextInput
              testID="quantityInput"
              style={editModeStyles.quantityInput}
              value={inventoryValue?.toString() || '0'}
              onChangeText={(text) => onValueChange(item.품목_id, text)}
              keyboardType="numeric"
            />
            
            <TouchableOpacity 
              testID="incrementButton" 
              style={[editModeStyles.controlButton, editModeStyles.rightButton]}
              onPress={() => onIncrement(item.품목_id)}
            >
              <Plus color="#0A2A5E" size={16} />
            </TouchableOpacity>
          </View>
        ) : (
          <Text testID="unit_itemText" style={inventoryStyles.unit_itemText}>
            {formatPrice(inventoryValue)}
          </Text>
        )}
      </View>
    </View>
  );
};

const Inventory: React.FC<InventoryProps> = ({ storeId }) => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [inventoryType, setInventoryType] = useState<'daily' | 'monthly'>('daily');
  const [saving, setSaving] = useState<boolean>(false);
  // 월간 재고 수정 가능 여부 (관리 API의 상태가 1이면 수정 가능)
  const [isMonthlyEditable, setIsMonthlyEditable] = useState<boolean>(true);
  // 모달 관련 상태 (수정 불가 안내)
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  // 검색 관련 상태
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

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

  // 수량 증가 처리
  const handleIncrement = (품목_id: string) => {
    setInventoryData(prev =>
      prev.map(item =>
        item.품목_id === 품목_id
          ? inventoryType === 'daily'
            ? { ...item, 매장_재고량: ((item as MergedInventoryItem).매장_재고량 || 0) + 1 }
            : { ...item, 월말_재고량: ((item as MergedMonthInventoryItem).월말_재고량 || 0) + 1 }
          : item
      )
    );
  };

  // 수량 감소 처리
  const handleDecrement = (품목_id: string) => {
    setInventoryData(prev =>
      prev.map(item => {
        if (item.품목_id !== 품목_id) return item;
        
        if (inventoryType === 'daily') {
          const currentValue = (item as MergedInventoryItem).매장_재고량 || 0;
          return { ...item, 매장_재고량: Math.max(0, currentValue - 1) };
        } else {
          const currentValue = (item as MergedMonthInventoryItem).월말_재고량 || 0;
          return { ...item, 월말_재고량: Math.max(0, currentValue - 1) };
        }
      })
    );
  };

  // 항목 삭제 처리 (재고량을 0으로 설정)
  const handleDelete = (품목_id: string) => {
    setInventoryData(prev =>
      prev.map(item =>
        item.품목_id === 품목_id
          ? inventoryType === 'daily'
            ? { ...item, 매장_재고량: 0 }
            : { ...item, 월말_재고량: 0 }
          : item
      )
    );
  };

  // 검색 필터링 적용
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredData(inventoryData);
    } else {
      const filtered = inventoryData.filter(item => 
        item.품목명.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchText, inventoryData]);

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
        setFilteredData(sortedData);
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
      
      {/* 일일/월말 재고 토글 버튼 */}
      <View testID="container" style={toggleButtonStyles.container}>
        <TouchableOpacity
          testID="button"
          style={[
            toggleButtonStyles.button,
            inventoryType === 'daily' && toggleButtonStyles.buttonActive,
            { 
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              marginRight: 1, // 버튼 사이 간격 추가
            }
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
            { 
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              marginLeft: 1, // 버튼 사이 간격 추가
            }
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
      
      {/* 검색 입력 필드 - 항상 표시 */}
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
            <X
              color="#0A2A5E"
              style={searchStyles.searchIconSize}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* 헤더 영역 (제목 + 검색 + 버튼) */}
      <View testID="headerRowStyles_container" style={headerRowStyles.container}>

        <View style={headerRowStyles.rightContainer}>
          {/* 수정 버튼 */}
          {inventoryType === 'daily' ? (
            <View testID="buttonContainer" style={headerRowStyles.buttonContainer}>
              {editMode ? (
                <TouchableOpacity 
                  testID="smallButton" 
                  style={saving ? headerRowStyles.disabledButton : headerRowStyles.activeButton} 
                  onPress={handleGlobalSave}
                  disabled={saving}
                >
                  <Text testID="buttonText" style={saving ? headerRowStyles.disabledButtonText : headerRowStyles.activeButtonText}>
                    {saving ? '저장 중...' : '조정완료'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  testID="smallButton" 
                  style={headerRowStyles.smallButton} 
                  onPress={() => setEditMode(true)}
                >
                  <Text testID="buttonText" style={headerRowStyles.buttonText}>재고조정</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View testID="buttonContainer" style={headerRowStyles.buttonContainer}>
              {editMode ? (
                <TouchableOpacity
                  testID="smallButton"
                  style={(saving || !isMonthlyEditable) ? headerRowStyles.disabledButton : headerRowStyles.activeButton}
                  onPress={handleMonthlySave}
                  disabled={saving || !isMonthlyEditable}
                >
                  <Text testID="buttonText" style={(saving || !isMonthlyEditable) ? headerRowStyles.disabledButtonText : headerRowStyles.activeButtonText}>
                    {saving ? '저장 중...' : '실사완료'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  testID="smallButton"
                  style={!isMonthlyEditable ? headerRowStyles.disabledButton : headerRowStyles.smallButton}
                  onPress={() => setEditMode(true)}
                  disabled={!isMonthlyEditable}
                >
                  <Text testID="buttonText" style={!isMonthlyEditable ? headerRowStyles.disabledButtonText : headerRowStyles.buttonText}>재고실사</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
      
      {/* 테이블 헤더 */}
      <View testID="inventory_HeaderContainer" style={inventoryStyles.inventory_HeaderContainer}>
        <Text testID="name_headerText" style={inventoryStyles.inventory_item_headerText}>
          상품명
        </Text>
        <Text testID="unit_headerText" style={inventoryStyles.inventory_unit_headerText}>
          재고량
        </Text>
      </View>
      
      {/* 재고 목록 */}
      <FlatList
        testID="flat_inventory"
        data={filteredData}
        keyExtractor={(item) => item.품목_id}
        style={inventoryStyles.flat_inventory}
        renderItem={({ item }) => (
          <InventoryItemRow
            item={item}
            inventoryType={inventoryType}
            editMode={editMode}
            onValueChange={handleValueChange}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onDelete={handleDelete}
          />
        )}
      />
    </View>
  );
};



export default Inventory;
