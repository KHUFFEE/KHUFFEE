// app/(store)/OrderStatus.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
  Alert,
  StyleSheet,
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
import { orderStatusStyles } from '../../src/styles/OrderStatus_styles';

import * as f from '../../src/components/ui/common/function';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

/* ===========================================================
   변경 시작: 새 기간조회 모달 컴포넌트 추가 (DateRangeModal)
   HTML/CSS/JSX 코드를 React Native에 맞게 변환한 코드입니다.
=========================================================== */
interface DateRangeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
}

const DateRangeModal: React.FC<DateRangeModalProps> = ({ visible, onClose, onConfirm }) => {
  // 초기 날짜 값은 기본값으로 설정 (예: 2022-03-01 ~ 2023-05-31)
  const [startYear, setStartYear] = useState('2022');
  const [startMonth, setStartMonth] = useState('03');
  const [startDay, setStartDay] = useState('01');
  const [endYear, setEndYear] = useState('2023');
  const [endMonth, setEndMonth] = useState('05');
  const [endDay, setEndDay] = useState('31');
  const [showSelectors, setShowSelectors] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const years = ['2025', '2024', '2023', '2022', '2021', '2020'];
  const months = ['1','2','3','4','5','6','7','8','9','10','11','12'];
  const days = ['1','2','3','4','5','10','15','20','25','30','31'];

  // 프리셋 버튼 클릭 시 날짜 업데이트
  const handlePresetPress = (preset: string) => {
    setActivePreset(preset);
    const today = new Date();
    let newStartDate = new Date();
    if (preset === '최근 1개월') {
      newStartDate.setMonth(today.getMonth() - 1);
    } else if (preset === '최근 3개월') {
      newStartDate.setMonth(today.getMonth() - 3);
    } else if (preset === '최근 6개월') {
      newStartDate.setMonth(today.getMonth() - 6);
    } else if (preset === '올해') {
      newStartDate = new Date(today.getFullYear(), 0, 1);
    } else if (preset === '1년') {
      newStartDate.setFullYear(today.getFullYear() - 1);
    }
    setStartYear(String(newStartDate.getFullYear()));
    setStartMonth(String(newStartDate.getMonth() + 1).padStart(2, '0'));
    setStartDay(String(newStartDate.getDate()).padStart(2, '0'));

    setEndYear(String(today.getFullYear()));
    setEndMonth(String(today.getMonth() + 1).padStart(2, '0'));
    setEndDay(String(today.getDate()).padStart(2, '0'));
  };

  const handleSearch = () => {
    const startDateDisplay = `${startYear}-${startMonth}-${startDay}`;
    const endDateDisplay = `${endYear}-${endMonth}-${endDay}`;
    // 부모 컴포넌트에 선택한 날짜 전달
    onConfirm(startDateDisplay, endDateDisplay);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={dateRangeStyles.modalOverlay}>
        <View style={dateRangeStyles.modalContainer}>
          {/* 헤더 */}
          <View style={dateRangeStyles.modalHeader}>
            <Text style={dateRangeStyles.modalTitle}>기간조회</Text>
            <TouchableOpacity onPress={onClose} style={dateRangeStyles.closeButton}>
              <Text style={dateRangeStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 프리셋 버튼 */}
          <ScrollView horizontal contentContainerStyle={dateRangeStyles.presetButtons}>
            {['최근 1개월', '최근 3개월', '최근 6개월', '올해', '1년'].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  dateRangeStyles.presetButton,
                  activePreset === preset && dateRangeStyles.activePresetButton,
                ]}
                onPress={() => handlePresetPress(preset)}
              >
                <Text
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

          {/* 날짜 범위 표시 */}
          <View style={dateRangeStyles.dateRangeSection}>
            <Text style={dateRangeStyles.dateRangeTitle}>날짜 범위</Text>
            <View style={dateRangeStyles.dateRangeContainer}>
              <View style={dateRangeStyles.dateRangeHeader}>
                <View style={dateRangeStyles.datePart}>
                  <Text style={dateRangeStyles.dateLabel}>시작날짜</Text>
                  <Text style={dateRangeStyles.dateValue}>
                    {`${startYear}-${startMonth}-${startDay}`}
                  </Text>
                </View>
                <Text style={dateRangeStyles.dateSeparator}>~</Text>
                <View style={dateRangeStyles.datePart}>
                  <Text style={dateRangeStyles.dateLabel}>종료날짜</Text>
                  <Text style={dateRangeStyles.dateValue}>
                    {`${endYear}-${endMonth}-${endDay}`}
                  </Text>
                </View>
              </View>

              {/* 날짜 선택 영역 토글 */}
              <TouchableOpacity
                style={dateRangeStyles.toggleSelectors}
                onPress={() => setShowSelectors(!showSelectors)}
              >
                <Text style={dateRangeStyles.toggleSelectorsText}>날짜 선택하기</Text>
                <Text style={[dateRangeStyles.toggleIcon, showSelectors && dateRangeStyles.toggleIconOpen]}>
                  ▼
                </Text>
              </TouchableOpacity>

              {/* 날짜 선택 영역 */}
              {showSelectors && (
                <View style={dateRangeStyles.dateSelectors}>
                  {/* 시작날짜 선택 */}
                  <View style={dateRangeStyles.dateSide}>
                    <Text style={dateRangeStyles.dateSideLabel}>시작날짜</Text>
                    <View style={dateRangeStyles.selectorsRow}>
                      <TouchableOpacity
                        style={dateRangeStyles.selectBox}
                        onPress={() => {
                          // 간단하게 Alert를 통한 선택 예시
                          Alert.prompt('시작년도', '연도를 입력하세요', (val) =>
                            setStartYear(val)
                          );
                        }}
                      >
                        <Text>{startYear}년</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={dateRangeStyles.selectBox}
                        onPress={() => {
                          Alert.prompt('시작월', '월을 입력하세요', (val) =>
                            setStartMonth(val.padStart(2, '0'))
                          );
                        }}
                      >
                        <Text>{startMonth}월</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={dateRangeStyles.selectBox}
                        onPress={() => {
                          Alert.prompt('시작일', '일을 입력하세요', (val) =>
                            setStartDay(val.padStart(2, '0'))
                          );
                        }}
                      >
                        <Text>{startDay}일</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 종료날짜 선택 */}
                  <View style={dateRangeStyles.dateSide}>
                    <Text style={dateRangeStyles.dateSideLabel}>종료날짜</Text>
                    <View style={dateRangeStyles.selectorsRow}>
                      <TouchableOpacity
                        style={dateRangeStyles.selectBox}
                        onPress={() => {
                          Alert.prompt('종료년도', '연도를 입력하세요', (val) =>
                            setEndYear(val)
                          );
                        }}
                      >
                        <Text>{endYear}년</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={dateRangeStyles.selectBox}
                        onPress={() => {
                          Alert.prompt('종료월', '월을 입력하세요', (val) =>
                            setEndMonth(val.padStart(2, '0'))
                          );
                        }}
                      >
                        <Text>{endMonth}월</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={dateRangeStyles.selectBox}
                        onPress={() => {
                          Alert.prompt('종료일', '일을 입력하세요', (val) =>
                            setEndDay(val.padStart(2, '0'))
                          );
                        }}
                      >
                        <Text>{endDay}일</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* 검색 버튼 */}
          <TouchableOpacity style={dateRangeStyles.searchButton} onPress={handleSearch}>
            <Text style={dateRangeStyles.searchButtonText}>검색</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const dateRangeStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 420,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0a3172'
  },
  closeButton: {
    padding: 5
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666'
  },
  presetButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 8
  },
  presetButton: {
    backgroundColor: '#f0f4f9',
    borderWidth: 1,
    borderColor: '#d0dae9',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8
  },
  activePresetButton: {
    backgroundColor: '#e0eaf9',
    borderColor: '#0a3172'
  },
  presetButtonText: {
    fontSize: 14,
    color: '#000'
  },
  activePresetButtonText: {
    color: '#0a3172'
  },
  dateRangeSection: {
    marginBottom: 20
  },
  dateRangeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12
  },
  dateRangeContainer: {
    borderWidth: 1,
    borderColor: '#d0dae9',
    borderRadius: 8,
    overflow: 'hidden'
  },
  dateRangeHeader: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f0f4f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  datePart: {
    alignItems: 'center'
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0a3172'
  },
  dateSeparator: {
    marginHorizontal: 10,
    color: '#666',
    fontWeight: '500'
  },
  toggleSelectors: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5
  },
  toggleSelectorsText: {
    color: '#0a3172',
    fontSize: 14
  },
  toggleIcon: {
    marginLeft: 5,
    fontSize: 14,
    transform: [{ rotate: '0deg' }]
  },
  toggleIconOpen: {
    transform: [{ rotate: '180deg' }]
  },
  dateSelectors: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eaeaea'
  },
  dateSide: {
    marginBottom: 15
  },
  dateSideLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500'
  },
  selectorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  selectBox: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#d0dae9',
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: 'white'
  },
  searchButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#0a3172',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  }
});
/* ===========================================================
   변경 종료: 새 기간조회 모달 컴포넌트 추가
=========================================================== */

interface OrderStatusProps {
  storeId: string;
  items: APIProduct[];
}

const OrderStatus: React.FC<OrderStatusProps> = ({ storeId, items }) => {
  // 주문 내역 관련 상태
  const [storeOrders, setStoreOrders] = useState<StoreOrderData[]>([]);
  const [loading, setloading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isPeriodSearch, setIsPeriodSearch] = useState<boolean>(false);
  // 기존 기간조회 모달 관련 상태 대신 새 모달을 호출함
  const [showPeriodModal, setShowPeriodModal] = useState<boolean>(false);
  // 추가: 새로 선택한 날짜 범위를 저장하는 상태
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');

  // 주문 상세보기 모달 상태
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [detailGroupOrders, setDetailGroupOrders] = useState<StoreOrderData[]>([]);
  const [detailGroupDate, setDetailGroupDate] = useState<string>('');

  const detailTotalCost = detailGroupOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);

  // 드롭다운 관련 상태 등은 기존 코드 유지...
  const [openStartDropdown, setOpenStartDropdown] = useState<"year" | "month" | "week" | null>(null);
  const [openEndDropdown, setOpenEndDropdown] = useState<"year" | "month" | "week" | null>(null);

  // FlatList ref와 스크롤 오프셋 저장
  const flatListRef = useRef<FlatList>(null);
  const scrollOffset = useRef(0);

  // 주문 내역 API 호출 함수
  const fetchOrders = async (startPage: number, order: 'asc' | 'desc', forceFetch: boolean = false) => {
    if (!storeId) return;
    setloading(true);
    if (forceFetch || !isPeriodSearch) {
      try {
        let allOrders: StoreOrderData[] = [];
        for (let page = startPage; page < startPage + 5; page++) {
          const response = await fetch(
            `${RN_API_URL}/api/orders/store_order_list/?store_id=${storeId}&page=${page}&order=${order}`
          );
          if (!response.ok) {
            console.error('발주 내역 조회 실패, page:', page);
            continue;
          }
          const result = await response.json();
          const orders: StoreOrderData[] = result.orders;
          const combined = orders.map((o) => {
            const foundItem = items.find((it) => it.품목_id === o.품목_id);
            const unitPrice = foundItem ? parseFloat(foundItem.입고단가) : 0;
            const qty = o.매장_발주량 || 0;
            return {
              ...o,
              품목명: foundItem?.품목명 ?? '알 수 없는 품목',
              협력사명: foundItem?.협력사명 ?? '',
              출고단위: foundItem?.출고단위,
              입고단가: foundItem?.입고단가,
              totalCost: qty * unitPrice,
            };
          });
          allOrders = [...allOrders, ...combined];
        }
        setStoreOrders((prev) => [...prev, ...allOrders]);
        if (allOrders.length === 0) {
          setHasMore(false);
        }
      } catch (error) {
        console.error('발주 내역 조회 중 오류:', error);
      } finally {
        setloading(false);
      }
    } else {
      setloading(false);
    }
  };

  // 기간조회 API (변경: 새 모달에서 선택한 날짜 범위를 사용)
  const handlePeriodSearch = async (startDate: string, endDate: string) => {
    if (!storeId) return;
    setIsPeriodSearch(true);
    setShowPeriodModal(false);
    // 저장된 날짜 범위 업데이트
    setDateRangeStart(startDate);
    setDateRangeEnd(endDate);
    setStoreOrders([]);
    setHasMore(false);
    setloading(true);
    try {
      const url = `${RN_API_URL}/api/orders/store_order_list/?store_id=${storeId}&기간=${startDate}~${endDate}&order=${sortOrder}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error('기간 검색 실패');
        setloading(false);
        return;
      }
      const data = await response.json();
      const orders: StoreOrderData[] = data.orders || [];
      const combined = orders.map((o) => {
        const foundItem = items.find((it) => it.품목_id === o.품목_id);
        const unitPrice = foundItem ? parseFloat(foundItem.입고단가) : 0;
        const qty = o.매장_발주량 || 0;
        return {
          ...o,
          품목명: foundItem?.품목명 ?? '알 수 없는 품목',
          협력사명: foundItem?.협력사명 ?? '',
          출고단위: foundItem?.출고단위,
          입고단가: foundItem?.입고단가,
          totalCost: qty * unitPrice,
        };
      });
      setStoreOrders(combined);
    } catch (error) {
      console.error('기간 조회 오류:', error);
    } finally {
      setloading(false);
    }
  };

  /** 초기화 버튼 -> 기간조회 해제, 기본(최신순)으로 재조회 */
  const handleResetSearch = async () => {
    setShowPeriodModal(false);
    setIsPeriodSearch(false);
    setStoreOrders([]);
    setHasMore(true);
    setloading(true);
    await fetchOrders(1, sortOrder, true);
    setCurrentPage(6);
    setloading(false);
  };

  // 정렬 토글
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    if (isPeriodSearch) {
      // 기간조회인 경우 새로 검색
      handlePeriodSearch(dateRangeStart, dateRangeEnd);
    } else {
      setStoreOrders([]);
      setHasMore(true);
      setCurrentPage(6);
      fetchOrders(1, newOrder);
    }
  };

  // 주문 상세보기 모달 열기
  const openDetailModal = (dateKey: string, orders: StoreOrderData[]) => {
    setDetailGroupDate(dateKey);
    setDetailGroupOrders(orders);
    setDetailModalVisible(true);
  };

  // 그룹핑: 연/월/주차별로 주문 내역 분류
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

  useEffect(() => {
    if (storeId) {
      setStoreOrders([]);
      setHasMore(true);
      setloading(true);
      setIsPeriodSearch(false);
      (async () => {
        await fetchOrders(1, sortOrder);
        setCurrentPage(6);
        setloading(false);
      })();
    }
  }, [storeId]);

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
      {/* 전체 상단 헤더 */}
      {!loading && sortedYears.length > 0 && (
        <View testID="headerRow" style={orderStatusStyles.headerRow}>
          <View testID="sectionTitle" style={orderStatusStyles.sectionTitle}>
            <Text testID="title" style={orderStatusStyles.title}>
              발주 내역
            </Text>
          </View>
          <View testID="rightButtonGroup" style={orderStatusStyles.rightButtonGroup}>
            <TouchableOpacity 
              testID="headerButton" 
              style={orderStatusStyles.headerButton}
              onPress={toggleSortOrder}
            >
              <Text testID="headerButtonText" style={orderStatusStyles.headerButtonText}>
                {sortOrder === 'desc' ? '최신순' : '오래된 순'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="headerButton"
              style={orderStatusStyles.headerButton}
              onPress={() => setShowPeriodModal(true)}
            >
              <Text testID="headerButtonText" style={orderStatusStyles.headerButtonText}>
                기간조회
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 주문 내역 리스트 */}
      {loading ? (
        <View style={orderStatusStyles.loadingContainer} testID="loadingContainer">
          <ActivityIndicator size="large" color="#0D326F" />
        </View>
      ) : sortedYears.length === 0 ? (
        <View style={orderStatusStyles.emptyContainer} testID="emptyContainer">
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
                  {year}년 주문내역
                </Text>
                {sortedMonths.map((month) => {
                  const weeksObj = monthsObj[month];
                  const sortedWeeks = sortKeys(Object.keys(weeksObj));
                  const monthTotalCost = sortedWeeks.reduce((monthSum, w) => {
                    const ordersInWeek = weeksObj[w];
                    return (
                      monthSum +
                      ordersInWeek.reduce(
                        (weekSum: number, o: StoreOrderData) => weekSum + (o.totalCost || 0),
                        0
                      )
                    );
                  }, 0);
                  return (
                    <View key={month} testID="monthContainer" style={orderStatusStyles.monthContainer}>
                      <View testID="monthHeader" style={orderStatusStyles.monthHeader}>
                        <Text testID="monthTitle" style={orderStatusStyles.monthTitle}>{month}월</Text>
                        <Text testID="monthTotal" style={orderStatusStyles.monthTotal}>
                          총 {f.formatPrice(monthTotalCost)}원
                        </Text>
                      </View>
                      {sortedWeeks.map((week) => {
                        const orders = weeksObj[week];
                        const firstOrder = orders[0];
                        const extraCount = orders.length - 1;
                        const weekTotalCost = orders.reduce(
                          (sum: number, o: StoreOrderData) => sum + (o.totalCost || 0),
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
                                <Text testID="quantity" style={orderStatusStyles.quantity}>
                                  발주수량: {f.formatPrice(firstOrder.매장_발주량)}
                                </Text>
                              </View>
                              <TouchableOpacity testID="detailButton" style={orderStatusStyles.detailButton} onPress={() => openDetailModal(`${year}.${month}.${week}`, orders)}>
                                <Text testID="detailButtonText" style={orderStatusStyles.detailButtonText}>
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
          ListFooterComponent={
            !isPeriodSearch && hasMore ? (
              <TouchableOpacity testID="loadMoreButton" style={orderStatusStyles.loadMoreButton} onPress={async () => {
                const currentOffset = scrollOffset.current;
                await fetchOrders(currentPage, sortOrder);
                setCurrentPage((prev) => prev + 5);
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
            ) : null
          }
        />
      )}

      {/* 초기화 버튼 */}
      {isPeriodSearch && (
        <View style={{ position: 'absolute', top: 10, right: 10 }}>
          <TouchableOpacity testID="resetButton" style={orderStatusStyles.resetButton} onPress={handleResetSearch}>
            <Text testID="resetButtonText" style={orderStatusStyles.resetButtonText}>초기화</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 주문 상세보기 모달 */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View testID="centeredView" style={orderStatusStyles.centeredView}>
          <View testID="modalView" style={[orderStatusStyles.modalView, { maxHeight: '80%' }]}>
            <ScrollView testID="receiptContainer" style={orderStatusStyles.receiptContainer}>
              <View testID="header" style={orderStatusStyles.header}>
                <Text testID="headerTitle" style={orderStatusStyles.headerTitle}>주문 상세 내역</Text>
                <Text testID="headerSubtitle" style={orderStatusStyles.headerSubtitle}>{f.formatWeekString(detailGroupDate)}</Text>
              </View>
              <View testID="divider" style={orderStatusStyles.divider} />
              {detailGroupOrders.map((order, idx) => (
                <View key={idx} testID="itemRow" style={orderStatusStyles.itemRow}>
                  <View testID="itemRowLeft" style={orderStatusStyles.itemRowLeft}>
                    <Text testID="itemName" style={orderStatusStyles.itemName}>{order.품목명}</Text>
                    <Text testID="itemQty" style={orderStatusStyles.itemQty}>
                      x {f.formatPrice(order.매장_발주량)}개
                    </Text>
                  </View>
                  <Text testID="itemPrice" style={orderStatusStyles.itemPrice}>
                    {f.formatPrice(order.totalCost || 0)}원
                  </Text>
                </View>
              ))}
              <View testID="divider" style={orderStatusStyles.divider} />
              <View testID="footer" style={orderStatusStyles.footer}>
                <Text testID="footerText" style={orderStatusStyles.footerText}>
                  총 합계: {f.formatPrice(detailTotalCost)}원
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity testID="closeButton" style={orderStatusStyles.closeButton} onPress={() => setDetailModalVisible(false)}>
              <Text testID="textStyle" style={orderStatusStyles.textStyle}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===========================================================
           변경 시작: 기존 기간조회 모달 제거 및 새 DateRangeModal 사용
      =========================================================== */}
      <DateRangeModal
        visible={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        onConfirm={(start, end) => {
          // 선택한 날짜 범위를 기반으로 기간조회 API 호출
          handlePeriodSearch(start, end);
        }}
      />
      {/* ===========================================================
           변경 종료: 새 DateRangeModal 적용
      =========================================================== */}
      
      {/* 날짜 선택 모달은 그대로 유지 */}
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
