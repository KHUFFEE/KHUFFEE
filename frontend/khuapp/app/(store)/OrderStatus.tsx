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
// Picker 컴포넌트 임포트 (년도, 월, 주차 선택용)
import { Picker } from '@react-native-picker/picker';

interface DateRangeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
}

/* ===========================================================
   변경: 새 기간조회 모달 컴포넌트 (DateRangeModal)
   - 직접입력(preset '직접입력')을 제외하고는 formContainer 표시 안함.
   - presetButtons 아래에 확인 버튼(검색 버튼과 동일 스타일)을 추가.
   - 확인 버튼 클릭 시 설정된 기간으로 조회.
=========================================================== */
const DateRangeModal: React.FC<DateRangeModalProps> = ({ visible, onClose, onConfirm }) => {
  // 날짜 선택 상태들
  const [startYear, setStartYear] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startWeek, setStartWeek] = useState('');
  const [endYear, setEndYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endWeek, setEndWeek] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  // 직접입력인 경우에만 formContainer 노출
  const [showForm, setShowForm] = useState(false);

  // 프리셋 버튼 배열
  const presets = ['직접입력', '최근 1개월', '최근 3개월', '최근 6개월', '올해', '1년'];
  // 선택 옵션 배열
  const years = ['2025', '2024', '2023', '2022', '2021', '2020'];
  const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const weeks = ['1', '2', '3', '4', '5'];

  // 모달이 열릴 때마다 초기화
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

  // 프리셋 버튼 클릭 시
  const handlePresetPress = (preset: string) => {
    setActivePreset(preset);
    if (preset === '직접입력') {
      setShowForm(true);
      // 직접입력 시 기존 값 초기화
      setStartYear('');
      setStartMonth('');
      setStartWeek('');
      setEndYear('');
      setEndMonth('');
      setEndWeek('');
    } else {
      setShowForm(false);
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
      setStartWeek('1'); // 기본값 '1'
      setEndYear(String(today.getFullYear()));
      setEndMonth(String(today.getMonth() + 1).padStart(2, '0'));
      setEndWeek('1'); // 기본값 '1'
    }
  };

  // 확인/검색 버튼 클릭 시 선택된 날짜 범위를 문자열로 만들어 부모에게 전달
  const handleSearch = () => {
    const startDateDisplay = `${startYear || '년도'}-${startMonth || '월'}-${startWeek ? startWeek + '주' : '주'}`;
    const endDateDisplay = `${endYear || '년도'}-${endMonth || '월'}-${endWeek ? endWeek + '주' : '주'}`;
    onConfirm(startDateDisplay, endDateDisplay);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View testID="modalOverlay" style={dateRangeStyles.modalOverlay}>
        <View testID="modalContainer" style={dateRangeStyles.modalContainer}>
          {/* 헤더 */}
          <View testID="modalHeader" style={dateRangeStyles.modalHeader}>
            <Text testID="modalTitle" style={dateRangeStyles.modalTitle}>기간조회</Text>
            <TouchableOpacity testID="closeButton" onPress={onClose} style={dateRangeStyles.closeButton}>
              <Text testID="closeButtonText" style={dateRangeStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 프리셋 버튼 영역 */}
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

          {/* 직접입력이 아닌 경우 preset 선택 후 확인 버튼 표시 */}
          {activePreset && activePreset !== '직접입력' && (
            <TouchableOpacity testID="confirmButton" style={dateRangeStyles.searchButton} onPress={handleSearch}>
              <Text testID="confirmButtonText" style={dateRangeStyles.searchButtonText}>확인</Text>
            </TouchableOpacity>
          )}

          {/* 직접입력일 경우 formContainer 표시 (날짜 선택 피커와 검색 버튼) */}
          {showForm && activePreset === '직접입력' && (
            <View testID="formContainer" style={dateRangeStyles.formContainer}>
              {/* 선택된 날짜 범위 표시 */}
              <View testID="dateRangeSection" style={dateRangeStyles.dateRangeSection}>
                <Text testID="dateRangeTitle" style={dateRangeStyles.dateRangeTitle}>날짜 범위</Text>
                <View testID="dateRangeContainer" style={dateRangeStyles.dateRangeContainer}>
                  <View testID="dateRangeHeader" style={dateRangeStyles.dateRangeHeader}>
                    <View testID="datePart" style={dateRangeStyles.datePart}>
                      <Text testID="dateLabel" style={dateRangeStyles.dateLabel}>시작</Text>
                      <Text testID="dateValue" style={dateRangeStyles.dateValue}>
                        {`${startYear || '년도'}-${startMonth || '월'}-${startWeek ? startWeek + '주' : '주'}`}
                      </Text>
                    </View>
                    <Text testID="dateSeparator" style={dateRangeStyles.dateSeparator}>~</Text>
                    <View testID="datePart" style={dateRangeStyles.datePart}>
                      <Text testID="dateLabel" style={dateRangeStyles.dateLabel}>종료</Text>
                      <Text testID="dateValue" style={dateRangeStyles.dateValue}>
                        {`${endYear || '년도'}-${endMonth || '월'}-${endWeek ? endWeek + '주' : '주'}`}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 시작 날짜 Picker */}
              <View testID="pickerContainer" style={dateRangeStyles.pickerContainer}>
                <Text testID="pickerTitle" style={dateRangeStyles.pickerTitle}>시작날짜 선택</Text>
                <View testID="pickerRow" style={dateRangeStyles.pickerRow}>
                  <Picker
                    testID="pickerYear"
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
                    testID="pickerMonth"
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
                    testID="pickerWeek"
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

              {/* 종료 날짜 Picker */}
              <View testID="pickerContainer" style={dateRangeStyles.pickerContainer}>
                <Text testID="pickerTitle" style={dateRangeStyles.pickerTitle}>종료날짜 선택</Text>
                <View testID="pickerRow" style={dateRangeStyles.pickerRow}>
                  <Picker
                    testID="pickerYear"
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
                    testID="pickerMonth"
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
                    testID="pickerWeek"
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

              {/* 검색 버튼 */}
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
  // 기간조회 모달 관련 상태 (새 모달 사용)
  const [showPeriodModal, setShowPeriodModal] = useState<boolean>(false);
  // 새로 선택한 날짜 범위를 저장하는 상태
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');

  // 주문 상세보기 모달 상태
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [detailGroupOrders, setDetailGroupOrders] = useState<StoreOrderData[]>([]);
  const [detailGroupDate, setDetailGroupDate] = useState<string>('');

  const detailTotalCost = detailGroupOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);

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

  // 기간조회 API (새 모달에서 선택한 날짜 범위를 사용)
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

  // 초기화 버튼 -> 기간조회 해제, 기본(최신순)으로 재조회
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
           새 DateRangeModal 적용 (기존 기간조회 모달 제거)
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
           날짜 선택 모달은 그대로 유지
      =========================================================== */}
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
