// app/(store)/OrderStatus.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
} from 'react-native';
import {
  Home,
  ShoppingCart,
  Receipt,
  Clipboard,
  Plus,
  Minus,
  X as LucideX,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';
import { RN_API_URL } from '@env';
import { StoreOrderData, APIProduct } from '../../src/components/ui/common/types';
import { orderStatusStyles, dateRangeStyles } from '../../src/styles/OrderStatus_styles';

import * as f from '../../src/components/ui/common/function';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Picker } from '@react-native-picker/picker';

// 결합된 주문 데이터 타입 (StoreOrderData와 APIProduct의 속성을 모두 포함)
type CombinedOrderData = StoreOrderData & Partial<APIProduct>;

interface DateRangeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
}

/* ===========================================================
   변경: 새 기간조회 모달 컴포넌트 (DateRangeModal)
   - 프리셋 선택 시, 현재 날짜를 기준으로 기간을 계산합니다.
   - 생성되는 날짜 문자열은 "YYYY.MM.W" 형식(예: "2025.02.5")이어야 합니다.
========================================================== */
const DateRangeModal: React.FC<DateRangeModalProps> = ({ visible, onClose, onConfirm }) => {
  const [startYear, setStartYear] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startWeek, setStartWeek] = useState('');
  const [endYear, setEndYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endWeek, setEndWeek] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const presets = ['직접입력', '최근 1개월', '최근 3개월', '최근 6개월', '올해', '1년'];
  const years = ['2025', '2024', '2023', '2022', '2021', '2020'];
  const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const weeks = ['1', '2', '3', '4', '5'];

  useEffect(() => {
    if (visible) {
      setActivePreset(null);
      setShowForm(false);
      setStartYear('');
      setStartMonth('');
      setStartWeek('');
      setEndYear('');
      setEndMonth('');
      setEndWeek('');
    }
  }, [visible]);

  const handlePresetPress = (preset: string) => {
    setActivePreset(preset);
    if (preset === '직접입력') {
      setShowForm(true);
      setStartYear('');
      setStartMonth('');
      setStartWeek('');
      setEndYear('');
      setEndMonth('');
      setEndWeek('');
    } else {
      setShowForm(false);
      const today = new Date();
      let newStartDate: Date;
      if (preset === '최근 1개월') {
        newStartDate = new Date(today);
        newStartDate.setMonth(today.getMonth() - 1);
      } else if (preset === '최근 3개월') {
        newStartDate = new Date(today);
        newStartDate.setMonth(today.getMonth() - 3);
      } else if (preset === '최근 6개월') {
        newStartDate = new Date(today);
        newStartDate.setMonth(today.getMonth() - 6);
      } else if (preset === '올해') {
        newStartDate = new Date(today.getFullYear(), 0, 1);
      } else if (preset === '1년') {
        newStartDate = new Date(today);
        newStartDate.setFullYear(today.getFullYear() - 1);
      } else {
        newStartDate = today;
      }
      // 주차 계산: 해당 일자가 몇 주차인지(월의 시작을 1주차로 가정)
      const getWeek = (date: Date) => Math.ceil(date.getDate() / 7).toString();
      setStartYear(String(newStartDate.getFullYear()));
      setStartMonth(String(newStartDate.getMonth() + 1).padStart(2, '0'));
      setStartWeek(getWeek(newStartDate));
      setEndYear(String(today.getFullYear()));
      setEndMonth(String(today.getMonth() + 1).padStart(2, '0'));
      setEndWeek(getWeek(today));
    }
  };

  const handleSearch = () => {
    // 날짜 문자열은 "YYYY.MM.W" 형식
    const startDateDisplay = `${startYear || '년도'}.${startMonth || '월'}.${startWeek || ''}`;
    const endDateDisplay = `${endYear || '년도'}.${endMonth || '월'}.${endWeek || ''}`;
    onConfirm(startDateDisplay, endDateDisplay);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View testID="modalOverlay" style={dateRangeStyles.modalOverlay}>
        <View testID="modalContainer" style={dateRangeStyles.modalContainer}>
          <View testID="modalHeader" style={dateRangeStyles.modalHeader}>
            <Text testID="modalTitle" style={dateRangeStyles.modalTitle}>기간조회</Text>
            <TouchableOpacity testID="closeButton" onPress={onClose} style={dateRangeStyles.closeButton}>
              <Text testID="closeButtonText" style={dateRangeStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView testID="presetButtons" horizontal contentContainerStyle={dateRangeStyles.presetButtons}>
            {presets.map((preset) => (
              <TouchableOpacity
                key={preset}
                testID="presetButton"
                style={[
                  dateRangeStyles.presetButton,
                  activePreset === preset && dateRangeStyles.activePresetButton,
                ]}
                onPress={() => handlePresetPress(preset)}
              >
                <Text
                  testID="presetButtonText"
                  style={[
                    dateRangeStyles.presetButtonText,
                    activePreset === preset && dateRangeStyles.activePresetButtonText,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {activePreset && activePreset !== '직접입력' && (
            <TouchableOpacity testID="searchButton" style={dateRangeStyles.searchButton} onPress={handleSearch}>
              <Text testID="searchButtonText" style={dateRangeStyles.searchButtonText}>확인</Text>
            </TouchableOpacity>
          )}
          {showForm && activePreset === '직접입력' && (
            <View testID="formContainer" style={dateRangeStyles.formContainer}>
              <View testID="dateRangeSection" style={dateRangeStyles.dateRangeSection}>
                <Text testID="dateRangeTitle" style={dateRangeStyles.dateRangeTitle}>날짜 범위</Text>
                <View testID="dateRangeContainer" style={dateRangeStyles.dateRangeContainer}>
                  <View testID="dateRangeHeader" style={dateRangeStyles.dateRangeHeader}>
                    <View testID="datePart" style={dateRangeStyles.datePart}>
                      <Text testID="dateLabel" style={dateRangeStyles.dateLabel}>시작</Text>
                      <Text testID="dateValue" style={dateRangeStyles.dateValue}>
                        {`${startYear || '년도'}.${startMonth || '월'}.${startWeek || ''}`}
                      </Text>
                    </View>
                    <Text testID="dateSeparator" style={dateRangeStyles.dateSeparator}>~</Text>
                    <View testID="datePart" style={dateRangeStyles.datePart}>
                      <Text testID="dateLabel" style={dateRangeStyles.dateLabel}>종료</Text>
                      <Text testID="dateValue" style={dateRangeStyles.dateValue}>
                        {`${endYear || '년도'}.${endMonth || '월'}.${endWeek || ''}`}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View testID="pickerContainer" style={dateRangeStyles.pickerContainer}>
                <Text testID="pickerTitle" style={dateRangeStyles.pickerTitle}>시작날짜 선택</Text>
                <View testID="pickerRow" style={dateRangeStyles.pickerRow}>
                  <Picker
                    testID="picker"
                    selectedValue={startYear}
                    style={dateRangeStyles.picker}
                    onValueChange={(itemValue) => setStartYear(itemValue)}
                  >
                    <Picker.Item label="년도" value="" />
                    {years.map((y) => (
                      <Picker.Item key={y} label={`${y}년`} value={y} />
                    ))}
                  </Picker>
                  <Picker
                    testID="picker"
                    selectedValue={startMonth}
                    style={dateRangeStyles.picker}
                    onValueChange={(itemValue) => setStartMonth(String(itemValue).padStart(2, '0'))}
                  >
                    <Picker.Item label="월" value="" />
                    {months.map((m) => (
                      <Picker.Item key={m} label={`${m}월`} value={String(m).padStart(2, '0')} />
                    ))}
                  </Picker>
                  <Picker
                    testID="picker"
                    selectedValue={startWeek}
                    style={dateRangeStyles.picker}
                    onValueChange={(itemValue) => setStartWeek(itemValue)}
                  >
                    <Picker.Item label="주차" value="" />
                    {weeks.map((w) => (
                      <Picker.Item key={w} label={`${w}주`} value={w} />
                    ))}
                  </Picker>
                </View>
              </View>
              <View testID="pickerContainer" style={dateRangeStyles.pickerContainer}>
                <Text testID="pickerTitle" style={dateRangeStyles.pickerTitle}>종료날짜 선택</Text>
                <View testID="pickerRow" style={dateRangeStyles.pickerRow}>
                  <Picker
                    testID="picker"
                    selectedValue={endYear}
                    style={dateRangeStyles.picker}
                    onValueChange={(itemValue) => setEndYear(itemValue)}
                  >
                    <Picker.Item label="년도" value="" />
                    {years.map((y) => (
                      <Picker.Item key={y} label={`${y}년`} value={y} />
                    ))}
                  </Picker>
                  <Picker
                    testID="picker"
                    selectedValue={endMonth}
                    style={dateRangeStyles.picker}
                    onValueChange={(itemValue) => setEndMonth(String(itemValue).padStart(2, '0'))}
                  >
                    <Picker.Item label="월" value="" />
                    {months.map((m) => (
                      <Picker.Item key={m} label={`${m}월`} value={String(m).padStart(2, '0')} />
                    ))}
                  </Picker>
                  <Picker
                    testID="picker"
                    selectedValue={endWeek}
                    style={dateRangeStyles.picker}
                    onValueChange={(itemValue) => setEndWeek(itemValue)}
                  >
                    <Picker.Item label="주차" value="" />
                    {weeks.map((w) => (
                      <Picker.Item key={w} label={`${w}주`} value={w} />
                    ))}
                  </Picker>
                </View>
              </View>
              <TouchableOpacity testID="searchButton" style={dateRangeStyles.searchButton} onPress={handleSearch}>
                <Text testID="searchButtonText" style={dateRangeStyles.searchButtonText}>검색</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

interface OrderStatusProps {
  storeId: string;
}

const OrderStatus: React.FC<OrderStatusProps> = ({ storeId }) => {
  const [allItems, setAllItems] = useState<APIProduct[]>([]);
  const [storeOrders, setStoreOrders] = useState<CombinedOrderData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isPeriodSearch, setIsPeriodSearch] = useState<boolean>(false);
  const [showPeriodModal, setShowPeriodModal] = useState<boolean>(false);
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');

  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [detailGroupOrders, setDetailGroupOrders] = useState<CombinedOrderData[]>([]);
  const [detailGroupDate, setDetailGroupDate] = useState<string>('');
  
  const [monthlyDetailModalVisible, setMonthlyDetailModalVisible] = useState<boolean>(false);
  const [monthlyDetailOrders, setMonthlyDetailOrders] = useState<CombinedOrderData[]>([]);
  const [monthlyDetailDate, setMonthlyDetailDate] = useState<string>('');
  
  const [weeklyData, setWeeklyData] = useState<{ [week: string]: CombinedOrderData[] }>({});
  const [weeklyTotals, setWeeklyTotals] = useState<{ [week: string]: number }>({});
  const [sortedWeeks, setSortedWeeks] = useState<string[]>([]);
  const [productSummary, setProductSummary] = useState<Array<{
    품목명: string;
    총수량: number;
    총금액: number;
    주차별: { [week: string]: { 수량: number; 금액: number } };
  }>>([]);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);

  const detailTotalCost = detailGroupOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);
  const monthlyDetailTotalCost = monthlyDetailOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);

  const flatListRef = useRef<FlatList<any>>(null);
  const scrollOffset = useRef(0);

  const sortOrders = (orders: CombinedOrderData[], order: 'asc' | 'desc') => {
    let sorted = f.sortProductsBySupplierAndName(orders as APIProduct[], allItems) as CombinedOrderData[];
    return order === 'desc' ? sorted.reverse() : sorted;
  };

  const fetchOrders = async (page: number, order: 'asc' | 'desc', forceFetch: boolean = false) => {
    if (!storeId) return;
    setLoading(true);
    if (forceFetch || !isPeriodSearch) {
      try {
        const now = new Date();
        const getPeriodString = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const week = Math.ceil(date.getDate() / 7);
          return `${year}.${month}.${week}`;
        };

        let startDate: Date, endDate: Date;
        if (page === 1) {
          endDate = now;
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        } else {
          endDate = new Date(now.getFullYear() - (page - 1), now.getMonth(), now.getDate());
          startDate = new Date(now.getFullYear() - page, now.getMonth(), now.getDate());
        }
        const periodParam = `${getPeriodString(startDate)}~${getPeriodString(endDate)}`;
        const params = new URLSearchParams({
          store_id: storeId,
          기간: periodParam,
          order: order,
          all: "true"
        });
        const url = `${RN_API_URL}/api/orders/store_order_list/?${params.toString()}`;

        const response = await fetch(url);
        if (!response.ok) {
          console.error('발주 내역 조회 실패, page:', page);
        } else {
          const result = await response.json();
          const orders: StoreOrderData[] = result.orders;
          const combined = orders.map((o) => {
            const foundItem = allItems.find((it) => it.품목_id === o.품목_id);
            const unitPrice = foundItem ? parseFloat(foundItem.입고단가) : 0;
            const qty = o.매장_발주량 || 0;
            return {
              ...o,
              품목명: foundItem?.품목명 ?? '알 수 없는 품목',
              협력사명: foundItem?.협력사명 ?? '',
              협력사_id: foundItem?.협력사_id ?? '',
              종류: foundItem?.종류 ?? '',
              출고단위: foundItem?.출고단위,
              입고단가: foundItem?.입고단가,
              totalCost: qty * unitPrice,
            } as CombinedOrderData;
          });
          const sortedCombined = sortOrders(combined, order);
          setStoreOrders((prev) => [...prev, ...sortedCombined]);
          if (sortedCombined.length === 0) {
            setHasMore(false);
          }
        }
      } catch (error) {
        console.error('발주 내역 조회 중 오류:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const handlePeriodSearch = async (startDate: string, endDate: string) => {
    if (!storeId) return;
    setIsPeriodSearch(true);
    setShowPeriodModal(false);
    setDateRangeStart(startDate);
    setDateRangeEnd(endDate);
    setStoreOrders([]);
    setHasMore(false);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        store_id: storeId,
        기간: `${startDate}~${endDate}`,
        order: sortOrder,
        all: "true"
      });
      const url = `${RN_API_URL}/api/orders/store_order_list/?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error('기간 검색 실패');
        setLoading(false);
        return;
      }
      const data = await response.json();
      const orders: StoreOrderData[] = data.orders || [];
      const combined = orders.map((o) => {
        const foundItem = allItems.find((it) => it.품목_id === o.품목_id);
        const unitPrice = foundItem ? parseFloat(foundItem.입고단가) : 0;
        const qty = o.매장_발주량 || 0;
        return {
          ...o,
          품목명: foundItem?.품목명 ?? '알 수 없는 품목',
          협력사명: foundItem?.협력사명 ?? '',
          협력사_id: foundItem?.협력사_id ?? '',
          종류: foundItem?.종류 ?? '',
          출고단위: foundItem?.출고단위,
          입고단가: foundItem?.입고단가,
          totalCost: qty * unitPrice,
        } as CombinedOrderData;
      });
      setStoreOrders(sortOrders(combined, sortOrder));
    } catch (error) {
      console.error('기간 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSearch = async () => {
    setShowPeriodModal(false);
    setIsPeriodSearch(false);
    setSortOrder('desc');
    setStoreOrders([]);
    setHasMore(true);
    setLoading(true);
    await fetchOrders(1, 'desc', true);
    setCurrentPage(2);
    setLoading(false);
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    if (isPeriodSearch) {
      handlePeriodSearch(dateRangeStart, dateRangeEnd);
    } else {
      setStoreOrders([]);
      setHasMore(true);
      setCurrentPage(1);
      fetchOrders(1, newOrder);
    }
  };

  const openDetailModal = (dateKey: string, orders: CombinedOrderData[]) => {
    setDetailGroupDate(dateKey);
    const sortedDetailOrders = sortOrders(orders, 'asc');
    setDetailGroupOrders(sortedDetailOrders);
    setDetailModalVisible(true);
  };
  
  const openMonthlyDetailModal = (year: string, month: string, monthlyOrders: CombinedOrderData[]) => {
    if (monthlyOrders.length === 0) return;
    
    const weeklyData: { [week: string]: CombinedOrderData[] } = {};
    const weeklyTotals: { [week: string]: number } = {};
    const productSummaryMap: {
      [productName: string]: {
        총수량: number;
        총금액: number;
        주차별: { [week: string]: { 수량: number; 금액: number } };
      };
    } = {};
    
    monthlyOrders.forEach(order => {
      const orderDate = new Date(order.기간);
      const week = Math.ceil(orderDate.getDate() / 7).toString();
      
      if (!weeklyData[week]) {
        weeklyData[week] = [];
      }
      weeklyData[week].push(order);
      
      if (!weeklyTotals[week]) {
        weeklyTotals[week] = 0;
      }
      weeklyTotals[week] += (order.totalCost || 0);
      
      const productName = order.품목명 || '이름 없음';
      if (!productSummaryMap[productName]) {
        productSummaryMap[productName] = {
          총수량: 0,
          총금액: 0,
          주차별: {}
        };
      }
      
      productSummaryMap[productName].총수량 += (order.매장_발주량 || 0);
      productSummaryMap[productName].총금액 += (order.totalCost || 0);
      
      if (!productSummaryMap[productName].주차별[week]) {
        productSummaryMap[productName].주차별[week] = { 수량: 0, 금액: 0 };
      }
      productSummaryMap[productName].주차별[week].수량 += (order.매장_발주량 || 0);
      productSummaryMap[productName].주차별[week].금액 += (order.totalCost || 0);
    });
    
    const sortedWeeks = Object.keys(weeklyData).sort((a, b) => parseInt(a) - parseInt(b));
    
    const productSummary = Object.entries(productSummaryMap)
      .map(([품목명, data]) => ({ 품목명, ...data }))
      .sort((a, b) => a.품목명.localeCompare(b.품목명));
    
    const monthlyTotal = Object.values(weeklyTotals).reduce((sum, total) => sum + total, 0);
    
    setWeeklyData(weeklyData);
    setWeeklyTotals(weeklyTotals);
    setSortedWeeks(sortedWeeks);
    setProductSummary(productSummary);
    setMonthlyTotal(monthlyTotal);
    
    setMonthlyDetailOrders(monthlyOrders);
    setMonthlyDetailDate(`${year}.${month}`);
    setMonthlyDetailModalVisible(true);
  };

  const groupedByYearMonthWeek = storeOrders.reduce((acc: any, order) => {
    const [year, month, week] = order.기간.split('.');
    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = {};
    if (!acc[year][month][week]) acc[year][month][week] = [];
    acc[year][month][week].push(order);
    return acc;
  }, {});

  const sortKeys = (keys: string[]): string[] => {
    return sortOrder === 'asc'
      ? keys.sort((a, b) => parseInt(a) - parseInt(b))
      : keys.sort((a, b) => parseInt(b) - parseInt(a));
  };

  const sortedYears = sortKeys(Object.keys(groupedByYearMonthWeek));

  const formattedMonthlyDetailDate =
    monthlyDetailDate && monthlyDetailDate.split('.').length === 2
      ? `${parseInt(monthlyDetailDate.split('.')[0], 10)}년 ${parseInt(monthlyDetailDate.split('.')[1], 10)}월`
      : monthlyDetailDate;

  useEffect(() => {
    const fetchAllItems = async () => {
      try {
        const response = await fetch(`${RN_API_URL}/api/suppliers/items/?all=True`);
        if (response.ok) {
          const data = await response.json();
          setAllItems(data);
        } else {
          console.error("Failed to fetch all items");
        }
      } catch (error) {
        console.error("Error fetching all items:", error);
      }
    };
    fetchAllItems();
  }, []);

  useEffect(() => {
    if (storeId) {
      setSortOrder('desc');
      setStoreOrders([]);
      setHasMore(true);
      setLoading(true);
      setIsPeriodSearch(false);
      (async () => {
        await fetchOrders(1, 'desc');
        setCurrentPage(2);
        setLoading(false);
      })();
    }
  }, [storeId, allItems]);

  if (loading) {
    return (
      <View testID="loadingContainer" style={orderStatusStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D326F80" />
        <Text testID="emptyText" style={orderStatusStyles.emptyText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View testID="status_container" style={orderStatusStyles.status_container}>
      {!loading && sortedYears.length > 0 && (
        <>
          <View testID="headerRow" style={orderStatusStyles.headerRow}>
            <Text testID="title" style={orderStatusStyles.title}>발주 내역</Text>
          </View>
          
          <View testID="buttonContainer" style={orderStatusStyles.buttonContainer}>
            <View testID="rightButtonGroup" style={orderStatusStyles.rightButtonGroup}>
              <TouchableOpacity 
                testID="headerButton" 
                style={[orderStatusStyles.headerButton, sortOrder === 'asc' && orderStatusStyles.headerButtonActive]}
                onPress={toggleSortOrder}
              >
                <Text 
                  testID="headerButtonText" 
                  style={[orderStatusStyles.headerButtonText, sortOrder === 'asc' && orderStatusStyles.headerButtonTextActive]}
                >
                  {sortOrder === 'desc' ? '오래된순' : '최신순'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="headerButton"
                style={[orderStatusStyles.headerButton, isPeriodSearch && orderStatusStyles.headerButtonActive]}
                onPress={() => setShowPeriodModal(true)}
              >
                <Text 
                  testID="headerButtonText" 
                  style={[orderStatusStyles.headerButtonText, isPeriodSearch && orderStatusStyles.headerButtonTextActive]}
                >
                  기간조회
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {loading ? (
        <View testID="loadingContainer" style={orderStatusStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D326F" />
        </View>
      ) : sortedYears.length === 0 ? (
        <View testID="emptyContainer" style={orderStatusStyles.emptyContainer}>
          <Text testID="emptyText" style={orderStatusStyles.emptyText}>아직 발주 내역이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          testID="flatlist"
          style={orderStatusStyles.flatlist}
          data={sortedYears}
          keyExtractor={(year) => year.toString()}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            scrollOffset.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          renderItem={({ item: year }) => {
            const monthsObj = groupedByYearMonthWeek[year];
            const sortedMonths = sortKeys(Object.keys(monthsObj));
            return (
              <>
                <Text testID="yearHeader" style={orderStatusStyles.yearHeader}>
                  {year}년 발주내역
                </Text>
                {sortedMonths.map((month) => {
                  const weeksObj = monthsObj[month];
                  const sortedWeeks = sortKeys(Object.keys(weeksObj));
                  const monthTotalCost = sortedWeeks.reduce((monthSum, w) => {
                    const ordersInWeek = weeksObj[w];
                    return (
                      monthSum +
                      ordersInWeek.reduce(
                        (weekSum: number, o: CombinedOrderData) => weekSum + (o.totalCost || 0),
                        0
                      )
                    );
                  }, 0);
                  
                  const allMonthOrders = sortedWeeks.reduce((allOrders: CombinedOrderData[], week) => {
                    return [...allOrders, ...weeksObj[week]];
                  }, []);
                  
                  return (
                    <View key={month} testID="monthContainer" style={orderStatusStyles.monthContainer}>
                      <View testID="monthHeader" style={orderStatusStyles.monthHeader}>
                        <Text testID="monthTitle" style={orderStatusStyles.monthTitle}>
                          {parseInt(month)}월
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: verticalScale(10) }}>
                          <Text testID="monthTotal" style={orderStatusStyles.monthTotal}>
                            총 {f.formatPrice(monthTotalCost)}원
                          </Text>
                          <TouchableOpacity 
                            testID="detailButton" 
                            style={[orderStatusStyles.detailButton, { marginRight: verticalScale(2) }]}
                            onPress={() => openMonthlyDetailModal(year, month, allMonthOrders)}
                          >
                            <Text testID="detailButtonText" style={orderStatusStyles.detailButtonText}>
                              월별 상세보기
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {sortedWeeks.map((week) => {
                        const ordersSorted = sortOrders(weeksObj[week], sortOrder);
                        const ordersAsc = sortOrders(weeksObj[week], 'asc');
                        const firstOrder = ordersAsc[0];
                        const extraCount = ordersSorted.length - 1;
                        const weekTotalCost = ordersSorted.reduce(
                          (sum: number, o: CombinedOrderData) => sum + (o.totalCost || 0),
                          0
                        );
                        return (
                          <View key={week} testID="weekContainer" style={orderStatusStyles.weekContainer}>
                            <View testID="weekHeader" style={orderStatusStyles.weekHeader}>
                              <Text testID="weekTitle" style={orderStatusStyles.weekTitle}>
                                {week}주차
                              </Text>
                              <Text testID="weekTotal" style={orderStatusStyles.weekTotal}>
                                {f.formatPrice(weekTotalCost)}원
                              </Text>
                            </View>
                            <View testID="orderContent" style={orderStatusStyles.orderContent}>
                              <View testID="orderInfo" style={orderStatusStyles.orderInfo}>
                                <Text testID="productName" style={orderStatusStyles.productName}>
                                  {firstOrder.품목명}
                                </Text>
                                {extraCount > 0 && (
                                  <Text testID="extraCount" style={orderStatusStyles.extraCount}>
                                    외 {extraCount}개
                                  </Text>
                                )}
                              </View>
                              <TouchableOpacity testID="detailButton" style={[orderStatusStyles.detailButton, { marginRight: verticalScale(5) }]} onPress={() => openDetailModal(`${year}.${month}.${week}`, weeksObj[week])}>
                                <Text testID="detailButtonText" style={[orderStatusStyles.detailButtonText, { marginTop: verticalScale(1) }]}>
                                  상세보기
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </>
            );
          }}
          ListFooterComponent={ !isPeriodSearch && hasMore ? (
              <TouchableOpacity testID="loadMoreButton" style={orderStatusStyles.loadMoreButton} onPress={async () => {
                const currentOffset = scrollOffset.current;
                await fetchOrders(currentPage, sortOrder);
                setCurrentPage((prev) => prev + 1);
                setTimeout(() => {
                  flatListRef.current?.scrollToOffset({
                    offset: currentOffset,
                    animated: false,
                  });
                }, 100);
              }} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#0D326F" />
                ) : (
                  <Text testID="loadMoreButtonText" style={orderStatusStyles.loadMoreButtonText}>
                    더 불러오기
                  </Text>
                )}
              </TouchableOpacity>
            ) : null }
        />
      )}

      {isPeriodSearch && (
        <View style={{ position: 'absolute', top: 10, right: 10 }}>
          <TouchableOpacity testID="resetButton" style={orderStatusStyles.resetButton} onPress={handleResetSearch}>
            <Text testID="resetButtonText" style={orderStatusStyles.resetButtonText}>초기화</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 상세보기 모달 */}
      <Modal
        testID="detailModal"
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View testID="modalCenteredView" style={orderStatusStyles.modalCenteredView}>
          <View testID="modalView" style={orderStatusStyles.modalView}>
            <View testID="modalHeader" style={orderStatusStyles.modalHeader}>
              <Text testID="modalTitle" style={orderStatusStyles.modalTitle}>
                {f.formatWeekString(detailGroupDate)} 발주 내역
              </Text>
              <TouchableOpacity
                testID="closeButton"
                style={orderStatusStyles.closeButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text testID="closeButtonText" style={orderStatusStyles.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView testID="modalScrollView" style={orderStatusStyles.modalScrollView}>
              {detailGroupOrders.map((order, index) => (
                <View key={index} testID="modalOrderItem" style={orderStatusStyles.modalOrderItem}>
                  <View style={{ flex: 3 }}>
                    <Text testID="modalOrderName" style={orderStatusStyles.modalOrderName}>
                      {order.품목명}
                    </Text>
                  </View>
                  <Text testID="modalOrderQuantity" style={orderStatusStyles.modalOrderQuantity}>
                    {order.매장_발주량}개
                  </Text>
                  <Text testID="modalOrderPrice" style={orderStatusStyles.modalOrderPrice}>
                    {f.formatPrice(order.totalCost || 0)}원
                  </Text>
                </View>
              ))}
            </ScrollView>
            
            <View testID="modalFooter" style={orderStatusStyles.modalFooter}>
              <Text testID="modalTotalCost" style={orderStatusStyles.modalTotalCost}>
                총 발주금액:
              </Text>
              <Text testID="modalTotalCost" style={orderStatusStyles.modalTotalCost}>
                {f.formatPrice(detailTotalCost)}원
              </Text>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* 월별 상세보기 모달 */}
      <Modal
        testID="monthlyDetailModal"
        visible={monthlyDetailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMonthlyDetailModalVisible(false)}
      >
        <View testID="modalCenteredView" style={orderStatusStyles.modalCenteredView}>
          <View testID="modalView" style={orderStatusStyles.modalView}>
            <View testID="modalHeader" style={orderStatusStyles.modalHeader}>
              <Text testID="modalTitle" style={orderStatusStyles.modalTitle}>
                {formattedMonthlyDetailDate} 발주 내역
              </Text>
              <TouchableOpacity
                testID="closeButton"
                style={orderStatusStyles.closeButton}
                onPress={() => setMonthlyDetailModalVisible(false)}
              >
                <Text testID="closeButtonText" style={orderStatusStyles.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView testID="modalScrollView" style={orderStatusStyles.modalScrollView}>
              {/* 주차별 상품 통계 테이블 */}
              <View testID="monthlyTableContainer" style={orderStatusStyles.monthlyTableContainer}>
                <View testID="monthlyTableHeader" style={orderStatusStyles.monthlyTableHeader}>
                  <View testID="productColumn" style={orderStatusStyles.productColumn}>
                    <Text testID="monthlyTableHeaderText" style={orderStatusStyles.monthlyTableHeaderText}>상품명</Text>
                  </View>
                  {sortedWeeks.map(week => (
                    <View key={week} testID="weekColumn" style={orderStatusStyles.weekColumn}>
                      <Text testID="monthlyTableHeaderText" style={orderStatusStyles.monthlyTableHeaderText}>{week}주차</Text>
                    </View>
                  ))}
                  <View testID="quantityColumn" style={orderStatusStyles.quantityColumn}>
                    <Text testID="monthlyTableHeaderText" style={orderStatusStyles.monthlyTableHeaderText}>총수량</Text>
                  </View>
                  <View testID="priceColumn" style={orderStatusStyles.priceColumn}>
                    <Text testID="monthlyTableHeaderText" style={orderStatusStyles.monthlyTableHeaderText}>총금액</Text>
                  </View>
                </View>
                
                {productSummary.map((product, index) => (
                  <View key={index} testID="monthlyTableRow" style={orderStatusStyles.monthlyTableRow}>
                    <View testID="productColumn" style={orderStatusStyles.productColumn}>
                      <Text testID="monthlyTableCell" style={orderStatusStyles.monthlyTableCell}>{product.품목명}</Text>
                    </View>
                    {sortedWeeks.map(week => {
                      const weekData = product.주차별[week] || { 수량: 0, 금액: 0 };
                      return (
                        <View key={week} testID="weekColumn" style={orderStatusStyles.weekColumn}>
                          <Text testID="monthlyTableCell" style={orderStatusStyles.monthlyTableCell}>
                            {weekData.수량 > 0 ? `${weekData.수량}개` : '-'}
                          </Text>
                        </View>
                      );
                    })}
                    <View testID="quantityColumn" style={orderStatusStyles.quantityColumn}>
                      <Text testID="monthlyTableCellHighlight" style={orderStatusStyles.monthlyTableCellHighlight}>{product.총수량}개</Text>
                    </View>
                    <View testID="priceColumn" style={orderStatusStyles.priceColumn}>
                      <Text testID="monthlyTableCellHighlight" style={orderStatusStyles.monthlyTableCellHighlight}>{f.formatPrice(product.총금액)}원</Text>
                    </View>
                  </View>
                ))}
                
                <View testID="monthlyTableRow" style={[orderStatusStyles.monthlyTableRow, { backgroundColor: '#f8fafc', borderBottomWidth: 0 }]}>
                  <View testID="productColumn" style={orderStatusStyles.productColumn}>
                    <Text testID="monthlyTableCellHighlight" style={orderStatusStyles.monthlyTableCellHighlight}>주차별 합계</Text>
                  </View>
                  {sortedWeeks.map(week => (
                    <View key={week} testID="weekColumn" style={orderStatusStyles.weekColumn}>
                      <Text testID="monthlyTableCellHighlight" style={orderStatusStyles.monthlyTableCellHighlight}>
                        {f.formatPrice(weeklyTotals[week])}원
                      </Text>
                    </View>
                  ))}
                  <View testID="quantityColumn" style={orderStatusStyles.quantityColumn}>
                    <Text testID="monthlyTableCellHighlight" style={orderStatusStyles.monthlyTableCellHighlight}>-</Text>
                  </View>
                  <View testID="priceColumn" style={orderStatusStyles.priceColumn}>
                    <Text testID="monthlyTableCellHighlight" style={orderStatusStyles.monthlyTableCellHighlight}>{f.formatPrice(monthlyTotal)}원</Text>
                  </View>
                </View>
              </View>
              
              {/* 월별 요약 섹션 */}
              <View testID="summarySection" style={orderStatusStyles.summarySection}>
                <Text testID="summaryTitle" style={orderStatusStyles.summaryTitle}>월별 발주 요약</Text>
                
                {sortedWeeks.map(week => (
                  <View key={week} testID="summaryRow" style={orderStatusStyles.summaryRow}>
                    <Text testID="summaryLabel" style={orderStatusStyles.summaryLabel}>{week}주차 발주금액</Text>
                    <Text testID="summaryValue" style={orderStatusStyles.summaryValue}>{f.formatPrice(weeklyTotals[week])}원</Text>
                  </View>
                ))}
                
                <View testID="summaryTotal" style={orderStatusStyles.summaryTotal}>
                  <Text testID="summaryTotalLabel" style={orderStatusStyles.summaryTotalLabel}>월 총 발주금액</Text>
                  <Text testID="summaryTotalValue" style={orderStatusStyles.summaryTotalValue}>{f.formatPrice(monthlyTotal)}원</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DateRangeModal
        visible={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        onConfirm={(start, end) => {
          handlePeriodSearch(start, end);
        }}
      />
      <Modal
        visible={false}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        {/* 기존 날짜 선택 모달 코드 */}
      </Modal>
    </View>
  );
};

export default OrderStatus;
