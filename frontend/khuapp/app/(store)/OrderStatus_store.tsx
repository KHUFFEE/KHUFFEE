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
  Alert,
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
import { orderStatusStyles, dateRangeStyles } from '../../src/styles/OrderStatus_styles_store';
import * as f from '../../src/components/ui/common/function';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import RNPickerSelect from 'react-native-picker-select';
import { styles } from '../../src/components/ui/common/commonstyler';

// 결합된 주문 데이터 타입 (StoreOrderData와 APIProduct의 속성을 모두 포함)
type CombinedOrderData = StoreOrderData & Partial<APIProduct>;

// DateRangeModalProps에 years prop 추가 (동적 연도 배열)
interface DateRangeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
  years: string[];
}

/* ===========================================================
   새 기간조회 모달 컴포넌트 (DateRangeModal)
   - 프리셋 선택 시, 현재 날짜를 기준으로 기간을 계산합니다.
   - 생성되는 날짜 문자열은 "YYYY.MM.W" 형식(예: "2025.02.5")이어야 합니다.
=========================================================== */
const DateRangeModal: React.FC<DateRangeModalProps> = ({ visible, onClose, onConfirm, years }) => {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // 프리셋 배열에서 직접입력 제거
  const presets = ['최근 1개월', '최근 3개월', '최근 6개월', '올해', '1년'];

  useEffect(() => {
    if (visible) {
      setActivePreset(null);
    }
  }, [visible]);

  const handlePresetPress = (preset: string) => {
    setActivePreset(preset);
  };

  const handleSearch = () => {
    const today = new Date();
    let startDate: Date;
    
    if (activePreset === '최근 1개월') {
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 1);
    } else if (activePreset === '최근 3개월') {
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 3);
    } else if (activePreset === '최근 6개월') {
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 6);
    } else if (activePreset === '올해') {
      startDate = new Date(today.getFullYear(), 0, 1); // 올해 1월 1일
    } else if (activePreset === '1년') {
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
    } else {
      startDate = today;
    }
    
    // 먼저 current_period를 가져오기 위한 API 호출
    fetch(`${RN_API_URL}/api/orders/store_order_list/?order=desc&page=1`)
      .then(response => {
        if (!response.ok) {
          throw new Error('현재 기간 조회 실패');
        }
        return response.json();
      })
      .then(data => {
        const currentPeriod = data.current_period;
        
        if (!currentPeriod) {
          throw new Error('현재 기간 정보를 받아오지 못했습니다');
        }
        
        // 프리셋에 따라 시작 날짜 계산
        const [endYear, endMonth, endWeek] = currentPeriod.split('.').map(Number);
        let startPeriod;
        
        if (activePreset === '최근 1개월') {
          const prevMonth = endMonth - 1 <= 0 ? 12 : endMonth - 1;
          const prevYear = endMonth - 1 <= 0 ? endYear - 1 : endYear;
          startPeriod = `${prevYear}.${String(prevMonth).padStart(2, '0')}.${endWeek}`;
        } else if (activePreset === '최근 3개월') {
          const prevMonth = endMonth - 3 <= 0 ? endMonth - 3 + 12 : endMonth - 3;
          const prevYear = endMonth - 3 <= 0 ? endYear - 1 : endYear;
          startPeriod = `${prevYear}.${String(prevMonth).padStart(2, '0')}.${endWeek}`;
        } else if (activePreset === '최근 6개월') {
          const prevMonth = endMonth - 6 <= 0 ? endMonth - 6 + 12 : endMonth - 6;
          const prevYear = endMonth - 6 <= 0 ? endYear - 1 : endYear;
          startPeriod = `${prevYear}.${String(prevMonth).padStart(2, '0')}.${endWeek}`;
        } else if (activePreset === '올해') {
          startPeriod = `${endYear}.01.1`;
        } else if (activePreset === '1년') {
          startPeriod = `${endYear - 1}.${String(endMonth).padStart(2, '0')}.${endWeek}`;
        } else {
          startPeriod = currentPeriod;
        }
        
        onConfirm(startPeriod, currentPeriod);
        onClose();
      })
      .catch(error => {
        console.error('기간 설정 중 오류 발생:', error);
        onClose();
      });
      
    return null; // ReactNode를 반환하도록 null 반환
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
          {activePreset && (
            <TouchableOpacity testID="confirmButton" style={dateRangeStyles.searchButton} onPress={handleSearch}>
              <Text testID="confirmButtonText" style={dateRangeStyles.searchButtonText}>확인</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

interface OrderStatusProps {
  storeId: string;
}

const OrderStatus_store: React.FC<OrderStatusProps> = ({ storeId }) => {
  // item 로딩 
  const [itemsLoaded, setItemsLoaded] = useState<boolean>(false);
  // 모든 품목(활성화 여부와 관계없이)을 가져오기 위한 상태
  const [allItems, setAllItems] = useState<APIProduct[]>([]);
  const [storeOrders, setStoreOrders] = useState<CombinedOrderData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  // 기본 정렬을 최신순('desc')으로 설정
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isPeriodSearch, setIsPeriodSearch] = useState<boolean>(false);
  const [showPeriodModal, setShowPeriodModal] = useState<boolean>(false);
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');

  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [detailGroupOrders, setDetailGroupOrders] = useState<CombinedOrderData[]>([]);
  const [detailGroupDate, setDetailGroupDate] = useState<string>('');
  
  // 월별 상세보기 관련 상태
  const [monthlyDetailModalVisible, setMonthlyDetailModalVisible] = useState<boolean>(false);
  const [monthlyDetailOrders, setMonthlyDetailOrders] = useState<CombinedOrderData[]>([]);
  const [monthlyDetailDate, setMonthlyDetailDate] = useState<string>('');
  
  // 월별 상세보기 관련 추가 상태
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

  // sortProductsBySupplierAndName 함수에서 allItems를 사용하여 정렬
  const sortOrders = (orders: CombinedOrderData[], order: 'asc' | 'desc') => {
    let sorted = f.sortProductsBySupplierAndName(orders as APIProduct[], allItems) as CombinedOrderData[];
    return order === 'desc' ? sorted.reverse() : sorted;
  };

  // 연도 범위 계산 함수: 최대 연도부터 내림차순으로 3개의 연도 추가
  const getYearRange = (orders: CombinedOrderData[], minYear: number = 2023): string[] => {
    const years = orders.map(order => parseInt(order.기간.split('.')[0]));
    const maxYear = Math.max(...years, minYear);
    const yearRange: string[] = [];
    
    // 최대 연도부터 내림차순으로 3개의 연도 추가
    for (let i = 0; i < 3; i++) {
      const year = maxYear - i;
      if (year >= minYear) {
        yearRange.push(year.toString());
      }
    }
    
    return yearRange;
  };

  // 주문 데이터 API 호출 시 allItems를 사용해 제품명, 단가 등 매핑
  const fetchOrders = async (page: number, order: 'asc' | 'desc', forceFetch: boolean = false) => {
    if (!storeId) return;
    setLoading(true);
    if (forceFetch || !isPeriodSearch) {
      try {
        // 먼저 current_period를 가져오기 위한 API 호출
        const currentPeriodParams = new URLSearchParams({
          store_id: storeId,
          order: 'desc',
          page: '1'
        });
        const currentPeriodUrl = `${RN_API_URL}/api/orders/store_order_list/?${currentPeriodParams.toString()}`;
        
        const currentPeriodResponse = await fetch(currentPeriodUrl);
        if (!currentPeriodResponse.ok) {
          console.error('현재 기간 조회 실패');
          setLoading(false);
          return;
        }

        const currentPeriodData = await currentPeriodResponse.json();
        const currentPeriod = currentPeriodData.current_period;
        
        if (!currentPeriod) {
          console.error('현재 기간 정보를 받아오지 못했습니다');
          setLoading(false);
          return;
        }

        // 현재 기간에서 마지막 날짜 설정
        const endDate = currentPeriod;
        
        // 시작 날짜는 마지막 날짜에서 1년을 빼서 계산
        // current_period는 YYYY.MM.W 형태이므로 연도만 추출하여 1년 전으로 계산
        const [endYear, endMonth, endWeek] = endDate.split('.').map(Number);
        const startYear = endYear - 1;
        const startDate = `${startYear}.${String(endMonth).padStart(2, '0')}.${endWeek}`;
        
        const periodParam = `${startDate}~${endDate}`;
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
      const periodParam = `${startDate}~${endDate}`;
      const params = new URLSearchParams({
        store_id: storeId,
        기간: periodParam,
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
    
    try {
      // 마지막 날짜를 API에서 가져옴
      const currentPeriodParams = new URLSearchParams({
        store_id: storeId,
        order: 'desc',
        page: '1'
      });
      const currentPeriodUrl = `${RN_API_URL}/api/orders/store_order_list/?${currentPeriodParams.toString()}`;
      
      const currentPeriodResponse = await fetch(currentPeriodUrl);
      if (!currentPeriodResponse.ok) {
        console.error('현재 기간 조회 실패');
        setLoading(false);
        return;
      }

      const currentPeriodData = await currentPeriodResponse.json();
      const currentPeriod = currentPeriodData.current_period;
      
      if (!currentPeriod) {
        console.error('현재 기간 정보를 받아오지 못했습니다');
        setLoading(false);
        return;
      }

      // 현재 기간에서 마지막 날짜 설정
      const endDate = currentPeriod;
      
      // 시작 날짜는 마지막 날짜에서 1년을 빼서 계산
      const [endYear, endMonth, endWeek] = endDate.split('.').map(Number);
      const startYear = endYear - 1;
      const startDate = `${startYear}.${String(endMonth).padStart(2, '0')}.${endWeek}`;
      
      const periodParam = `${startDate}~${endDate}`;
      const params = new URLSearchParams({
        store_id: storeId,
        기간: periodParam,
        order: 'desc',
        all: "true"
      });
      const url = `${RN_API_URL}/api/orders/store_order_list/?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('발주 내역 초기화 조회 실패');
        setLoading(false);
        return;
      }
      
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
      
      const sortedCombined = sortOrders(combined, 'desc');
      setStoreOrders(sortedCombined);
      setCurrentPage(2);
    } catch (error) {
      console.error('초기화 조회 오류:', error);
    } finally {
      setLoading(false);
    }
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
      setLoading(true);
      
      // 마지막 날짜를 API에서 가져옴
      fetch(`${RN_API_URL}/api/orders/store_order_list/?store_id=${storeId}&order=desc&page=1`)
        .then(response => {
          if (!response.ok) {
            throw new Error('현재 기간 조회 실패');
          }
          return response.json();
        })
        .then(data => {
          const currentPeriod = data.current_period;
          
          if (!currentPeriod) {
            throw new Error('현재 기간 정보를 받아오지 못했습니다');
          }
          
          // 현재 기간에서 마지막 날짜 설정
          const endDate = currentPeriod;
          
          // 시작 날짜는 마지막 날짜에서 1년을 빼서 계산
          const [endYear, endMonth, endWeek] = endDate.split('.').map(Number);
          const startYear = endYear - 1;
          const startDate = `${startYear}.${String(endMonth).padStart(2, '0')}.${endWeek}`;
          
          const periodParam = `${startDate}~${endDate}`;
          const params = new URLSearchParams({
            store_id: storeId,
            기간: periodParam,
            order: newOrder,
            all: "true"
          });
          
          return fetch(`${RN_API_URL}/api/orders/store_order_list/?${params.toString()}`);
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('발주 내역 조회 실패');
          }
          return response.json();
        })
        .then(result => {
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
          
          const sortedCombined = sortOrders(combined, newOrder);
          setStoreOrders(sortedCombined);
          setLoading(false);
        })
        .catch(error => {
          console.error('정렬 순서 변경 중 오류:', error);
          setLoading(false);
        });
    }
  };

  const openDetailModal = (dateKey: string, orders: CombinedOrderData[]) => {
    setDetailGroupDate(dateKey);
    
    // 매장_발주량이 0보다 큰 주문만 필터링
    const filteredOrders = orders.filter(order => (order.매장_발주량 || 0) > 0);
    
    // 필터링된 주문이 없으면 모달을 열지 않음
    if (filteredOrders.length === 0) {
      Alert.alert('알림', '발주 내역이 없습니다.');
      return;
    }
    
    const groupedOrdersMap: { [productName: string]: CombinedOrderData } = {};
    filteredOrders.forEach((order) => {
      const key = order.품목명 ?? '알 수 없는 품목';
      if (groupedOrdersMap[key]) {
        groupedOrdersMap[key].매장_발주량 = (groupedOrdersMap[key].매장_발주량 || 0) + (order.매장_발주량 || 0);
        groupedOrdersMap[key].totalCost = (groupedOrdersMap[key].totalCost || 0) + (order.totalCost || 0);
      } else {
        groupedOrdersMap[key] = { ...order };
      }
    });
    const groupedOrders = Object.values(groupedOrdersMap);
    const sortedDetailOrders = sortOrders(groupedOrders, 'asc');
    setDetailGroupOrders(sortedDetailOrders);
    setDetailModalVisible(true);
  };

  const openMonthlyDetailModal = (year: string, month: string, monthlyOrders: CombinedOrderData[]) => {
    // 매장_발주량이 0보다 큰 주문만 필터링
    const filteredMonthlyOrders = monthlyOrders.filter(order => (order.매장_발주량 || 0) > 0);
    
    // 필터링된 주문이 없으면 모달을 열지 않음
    if (filteredMonthlyOrders.length === 0) {
      Alert.alert('알림', '발주 내역이 없습니다.');
      return;
    }
    
    setMonthlyDetailDate(`${year}.${month}`);
    
    const weeklyData: { [week: string]: CombinedOrderData[] } = {};
    const productSummaryMap: { 
      [productId: string]: { 
        품목명: string; 
        총수량: number; 
        총금액: number;
        주차별: { [week: string]: { 수량: number; 금액: number } };
      } 
    } = {};
    const weeklyTotals: { [week: string]: number } = {};
    const allWeeks: string[] = [];
    
    filteredMonthlyOrders.forEach(order => {
      const [, , week] = order.기간.split('.');
      if (!weeklyData[week]) {
        weeklyData[week] = [];
        weeklyTotals[week] = 0;
        allWeeks.push(week);
      }
      weeklyData[week].push(order);
      const orderCost = order.totalCost || 0;
      weeklyTotals[week] += orderCost;
      
      if (!productSummaryMap[order.품목_id]) {
        productSummaryMap[order.품목_id] = {
          품목명: order.품목명 || '',
          총수량: 0,
          총금액: 0,
          주차별: {}
        };
      }
      
      if (!productSummaryMap[order.품목_id].주차별[week]) {
        productSummaryMap[order.품목_id].주차별[week] = { 수량: 0, 금액: 0 };
      }
      
      const orderQuantity = order.매장_발주량 || 0;
      productSummaryMap[order.품목_id].총수량 += orderQuantity;
      productSummaryMap[order.품목_id].총금액 += orderCost;
      productSummaryMap[order.품목_id].주차별[week].수량 += orderQuantity;
      productSummaryMap[order.품목_id].주차별[week].금액 += orderCost;
    });
    
    const sortedWeeks = allWeeks.sort((a, b) => parseInt(a) - parseInt(b));
    
    const productsForSorting: CombinedOrderData[] = Object.entries(productSummaryMap).map(([품목_id, data]) => {
      const originalOrder = filteredMonthlyOrders.find(order => order.품목_id === 품목_id);
      return {
        품목_id,
        품목명: data.품목명,
        협력사_id: originalOrder?.협력사_id || '',
        협력사명: originalOrder?.협력사명 || '',
        종류: originalOrder?.종류 || '',
        매장_발주량: data.총수량,
        totalCost: data.총금액,
      } as CombinedOrderData;
    });
    
    const sortedProductsData = sortOrders(productsForSorting, 'asc');
    const sortedProducts = sortedProductsData.map(product => productSummaryMap[product.품목_id]);
    const monthlyTotal = Object.values(weeklyTotals).reduce((sum, total) => sum + total, 0);
    
    setMonthlyDetailOrders(filteredMonthlyOrders);
    setWeeklyData(weeklyData);
    setWeeklyTotals(weeklyTotals);
    setSortedWeeks(sortedWeeks);
    setProductSummary(sortedProducts);
    setMonthlyTotal(monthlyTotal);
    
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
      } finally {
        setItemsLoaded(true);
      }
    };
    fetchAllItems();
  }, []);

  useEffect(() => {
    if (storeId && itemsLoaded) {
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
  }, [storeId, itemsLoaded]);

  const availableYears = getYearRange(storeOrders, 2023);

  if (loading || !itemsLoaded) {
    return (
      <View testID="loading_Container" style={styles.loading_Container}>
        <ActivityIndicator size="large" color="#0D326F80" />
        <Text testID="loading_Text" style={styles.loading_Text}>
          로딩 중...
        </Text>
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
                style={[
                  orderStatusStyles.headerButton,
                  sortOrder === 'asc' && orderStatusStyles.headerButtonActive
                ]}
                onPress={toggleSortOrder}
              >
                <Text 
                  testID="headerButtonText" 
                  style={[
                    orderStatusStyles.headerButtonText,
                    sortOrder === 'asc' && orderStatusStyles.headerButtonTextActive
                  ]}
                >
                  {sortOrder === 'desc' ? '오래된순' : '최신순'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="headerButton"
                style={[
                  orderStatusStyles.headerButton,
                  isPeriodSearch && orderStatusStyles.headerButtonActive
                ]}
                onPress={() => setShowPeriodModal(true)}
              >
                <Text 
                  testID="headerButtonText" 
                  style={[
                    orderStatusStyles.headerButtonText,
                    isPeriodSearch && orderStatusStyles.headerButtonTextActive
                  ]}
                >
                  기간조회
                </Text>
              </TouchableOpacity>
              {isPeriodSearch && (
                <TouchableOpacity 
                  testID="resetButton" 
                  style={[
                    orderStatusStyles.headerButton,
                    { backgroundColor: '#f1f5f9', borderColor: '#0D326F' }
                  ]} 
                  onPress={handleResetSearch}
                >
                  <Text 
                    testID="resetButtonText" 
                    style={[
                      orderStatusStyles.headerButtonText,
                      { fontWeight: '600' }
                    ]}
                  >
                    전체보기
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}
      {loading ? (
        <View testID="loadingContainer" style={orderStatusStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D326F" />
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
            
            // 이 연도에 매장_발주량이 0보다 큰 주문이 있는지 확인
            const hasNonZeroOrdersInYear = sortedMonths.some(month => {
              const weeksObj = monthsObj[month];
              const weeks = Object.keys(weeksObj);
              return weeks.some(week => {
                const ordersInWeek = weeksObj[week];
                return ordersInWeek.some((order: CombinedOrderData) => (order.매장_발주량 || 0) > 0);
              });
            });
            
            // 매장_발주량이 0보다 큰 주문이 없는 연도는 표시하지 않음
            if (!hasNonZeroOrdersInYear) {
              return null;
            }
            
            return (
              <React.Fragment key={year}>
                <Text testID="yearHeader" style={orderStatusStyles.yearHeader}>
                  {year}년 발주내역
                </Text>
                {sortedMonths.map((month) => {
                  const weeksObj = monthsObj[month];
                  const sortedWeeks = sortKeys(Object.keys(weeksObj));
                  
                  // 각 주차별로 발주량이 0보다 큰 주문이 있는지 확인
                  const weeksWithNonZeroOrders = sortedWeeks.filter(w => {
                    const ordersInWeek = weeksObj[w];
                    return ordersInWeek.some((order: CombinedOrderData) => (order.매장_발주량 || 0) > 0);
                  });
                  
                  // 발주량이 0보다 큰 주문이 없는 월은 표시하지 않음
                  if (weeksWithNonZeroOrders.length === 0) {
                    return null;
                  }
                  
                  const monthTotalCost = weeksWithNonZeroOrders.reduce((monthSum, w) => {
                    const ordersInWeek = weeksObj[w];
                    // 발주량이 0보다 큰 주문만 필터링하여 총액 계산
                    const filteredOrdersInWeek = ordersInWeek.filter((o: CombinedOrderData) => (o.매장_발주량 || 0) > 0);
                    return (
                      monthSum +
                      filteredOrdersInWeek.reduce(
                        (weekSum: number, o: CombinedOrderData) => weekSum + (o.totalCost || 0),
                        0
                      )
                    );
                  }, 0);
                  
                  // 발주량이 0보다 큰 주문만 모아서 월별 상세보기에 전달
                  const allMonthOrders = sortedWeeks.reduce((allOrders: CombinedOrderData[], week) => {
                    const filteredOrders = weeksObj[week].filter((o: CombinedOrderData) => (o.매장_발주량 || 0) > 0);
                    return [...allOrders, ...filteredOrders];
                  }, []);
                  
                  return (
                    <View key={month} testID="monthContainer" style={orderStatusStyles.monthContainer}>
                      <View testID="monthHeader" style={orderStatusStyles.monthHeader}>
                        <Text testID="monthTitle" style={orderStatusStyles.monthTitle}>
                          {parseInt(month)}월
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: verticalScale(10)}}>
                          <Text testID="monthTotal" style={orderStatusStyles.monthTotal}>
                            총 {f.formatPrice(monthTotalCost)}원
                          </Text>
                          <TouchableOpacity 
                            testID="monthDetailButton" 
                            style={[orderStatusStyles.detailButton, {marginRight: verticalScale(2),borderColor: '#fff'}]}
                            onPress={() => openMonthlyDetailModal(year, month, allMonthOrders)}
                          >
                            <Text testID="monthDetailButtonText" style={orderStatusStyles.detailButtonText}>
                              월별 상세보기
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {sortedWeeks.map((week) => {
                        const ordersSorted = sortOrders(weeksObj[week], sortOrder);
                        
                        // 매장_발주량이 0보다 큰 주문이 있는지 확인
                        const hasNonZeroOrders = ordersSorted.some(order => (order.매장_발주량 || 0) > 0);
                        
                        // 모든 주문의 매장_발주량이 0이면 weekContainer를 표시하지 않음
                        if (!hasNonZeroOrders) {
                          return null;
                        }
                        
                        // 매장_발주량이 0보다 큰 주문만 필터링
                        const filteredOrders = ordersSorted.filter(order => (order.매장_발주량 || 0) > 0);
                        const ordersAsc = sortOrders(filteredOrders, 'asc');
                        const firstOrder = ordersAsc[0];
                        const extraCount = filteredOrders.length - 1;
                        const weekTotalCost = filteredOrders.reduce(
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
                              <TouchableOpacity testID="detailButton" style={[orderStatusStyles.detailButton, {marginRight: verticalScale(5)}]} onPress={() => openDetailModal(`${year}.${month}.${week}`, weeksObj[week])}>
                                <Text testID="detailButtonText" style={[orderStatusStyles.detailButtonText, {marginTop: verticalScale(1)}]}>
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
              </React.Fragment>
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
            <ScrollView testID="modalScrollView" style={[orderStatusStyles.modalScrollView, { flexGrow: 1 }]}>
              {detailGroupOrders.map((order, index) => (
                <View key={index} testID="modalOrderItem" style={orderStatusStyles.modalOrderItem}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text testID="modalOrderName" style={orderStatusStyles.modalOrderName} numberOfLines={1} ellipsizeMode="tail">
                        {order.품목명}
                      </Text>
                    </View>
                    <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                      <Text testID="modalOrderQuantity" style={orderStatusStyles.modalOrderQuantity}>
                        {order.매장_발주량}개
                      </Text>
                      <Text testID="modalOrderPrice" style={orderStatusStyles.modalOrderPrice}>
                        {f.formatPrice(order.totalCost || 0)}원
                      </Text>
                    </View>
                  </View>
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
            <ScrollView testID="modalScrollView" style={[orderStatusStyles.modalScrollView, { flexGrow: 1 }]}>
              <View testID='monthlyTableContainer' style={orderStatusStyles.monthlyTableContainer}>
                <View testID='monthlyTableHeader' style={orderStatusStyles.monthlyTableHeader}>
                  <View testID='productColumn' style={orderStatusStyles.productColumn}>
                    <Text testID='monthlyTableHeaderText' style={[orderStatusStyles.monthlyTableHeaderText, { textAlign: 'left' }]} numberOfLines={1} ellipsizeMode="tail">상품명</Text>
                  </View>
                  {sortedWeeks.map(week => (
                    <View testID='weekColumn' key={week} style={orderStatusStyles.weekColumn}>
                      <Text testID='monthlyTableHeaderText' style={orderStatusStyles.monthlyTableHeaderText} numberOfLines={1} ellipsizeMode="tail">{week}주</Text>
                    </View>
                  ))}
                  <View testID='quantityColumn' style={orderStatusStyles.quantityColumn}>
                    <Text testID='monthlyTableHeaderText' style={orderStatusStyles.monthlyTableHeaderText} numberOfLines={1} ellipsizeMode="tail">합계</Text>
                  </View>
                </View>
                {productSummary.map((product, index) => (
                  <View 
                    testID='monthlyTableRow' 
                    key={index} 
                    style={[
                      orderStatusStyles.monthlyTableRow, 
                      index % 2 === 1 ? { backgroundColor: '#f8fafc' } : {}
                    ]}
                  >
                    <View testID='productColumn' style={orderStatusStyles.productColumn}>
                      <Text testID='monthlyTableCell' style={[orderStatusStyles.monthlyTableCell, { textAlign: 'left' }]} numberOfLines={2} ellipsizeMode="tail">{product.품목명}</Text>
                    </View>
                    {sortedWeeks.map(week => {
                      const weekData = product.주차별[week] || { 수량: 0, 금액: 0 };
                      return (
                        <View testID='weekColumn' key={week} style={orderStatusStyles.weekColumn}>
                          <Text testID='monthlyTableCell' style={orderStatusStyles.monthlyTableCell} numberOfLines={2} ellipsizeMode="tail">
                            {weekData.수량 > 0 ? `${weekData.수량}` : '-'}
                          </Text>
                        </View>
                      );
                    })}
                    <View testID='quantityColumn' style={orderStatusStyles.quantityColumn}>
                      <Text testID='monthlyTableCellHighlight' style={orderStatusStyles.monthlyTableCellHighlight} numberOfLines={2} ellipsizeMode="tail">{product.총수량}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View testID='summarySection' style={orderStatusStyles.summarySection}>
                <Text testID='summaryTitle' style={orderStatusStyles.summaryTitle}>월 발주 금액 요약</Text>
                {sortedWeeks.map(week => (
                  <View testID='summaryRow' key={week} style={orderStatusStyles.summaryRow}>
                    <Text testID='summaryLabel' style={orderStatusStyles.summaryLabel}>{week}주차 발주금액</Text>
                    <Text testID='summaryValue' style={orderStatusStyles.summaryValue}>{f.formatPrice(weeklyTotals[week])}원</Text>
                  </View>
                ))}
                <View testID='summaryTotal' style={orderStatusStyles.summaryTotal}>
                  <Text testID='summaryTotalLabel' style={orderStatusStyles.summaryTotalLabel}>월 총 발주금액</Text>
                  <Text testID='summaryTotalValue' style={orderStatusStyles.summaryTotalValue}>{f.formatPrice(monthlyTotal)}원</Text>
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
        years={availableYears}
      />
    </View>
  );
};

export default OrderStatus_store;
