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
  Modal
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
  const [showPeriodModal, setShowPeriodModal] = useState<boolean>(false);
  // 날짜선택 모달 표시 여부
  const [showDatePickerModal, setShowDatePickerModal] = useState<boolean>(false);
  const [selectingStart, setSelectingStart] = useState<boolean>(false);

  // 기간 선택 상태
  const [startYear, setStartYear] = useState<number | null>(null);
  const [startMonth, setStartMonth] = useState<number | null>(null);
  const [startWeek, setStartWeek] = useState<number | null>(null);
  const [endYear, setEndYear] = useState<number | null>(null);
  const [endMonth, setEndMonth] = useState<number | null>(null);
  const [endWeek, setEndWeek] = useState<number | null>(null);

  // 주문 상세보기 모달 상태
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [detailGroupOrders, setDetailGroupOrders] = useState<StoreOrderData[]>([]);
  const [detailGroupDate, setDetailGroupDate] = useState<string>('');

  const detailTotalCost = detailGroupOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);

  // 드롭다운 관련 상태
  const [openStartDropdown, setOpenStartDropdown] = useState<"year" | "month" | "week" | null>(null);
  const [openEndDropdown, setOpenEndDropdown] = useState<"year" | "month" | "week" | null>(null);

  /** 날짜선택 모달 열기 (시작/종료 구분) */
  const openDatePicker = (isStart: boolean) => {
    setSelectingStart(isStart);
    setShowDatePickerModal(true);
  };

  // 연도, 월, 주 배열 (예시)
  const years = [2025, 2024, 2023, 2022, 2021];
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const weeks = [1, 2, 3, 4, 5];

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
            `${RN_API_URL}/api/orders/store_order_list?store_id=${storeId}&page=${page}&order=${order}`
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

  // 기간조회 API
  const handlePeriodSearch = async () => {
    if (!storeId) return;
    setIsPeriodSearch(true);
    setShowPeriodModal(false);
    setStoreOrders([]);
    setHasMore(false);
    setloading(true);
    const sp = f.buildPeriodString(startYear, startMonth, startWeek);
    const ep = f.buildPeriodString(endYear, endMonth, endWeek);
    try {
      const url = `${RN_API_URL}/api/orders/store_order_list?store_id=${storeId}&기간=${sp}~${ep}&order=${sortOrder}`;
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
      handlePeriodSearch();
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
        <Text style={orderStatusStyles.emptyText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View testID="status_container" style={orderStatusStyles.status_container}>
      {/* 전체 상단 헤더 */}
      {!loading && sortedYears.length > 0 && (
        <View testID="headerRow" style={orderStatusStyles.headerRow}>
          <View testID="titleContainer" style={orderStatusStyles.sectionTitle}>
            <Text testID="title" style={orderStatusStyles.title}>
              발주 내역
            </Text>
          </View>
          <View testID="rightButtonGroup" style={orderStatusStyles.rightButtonGroup}>
            <TouchableOpacity 
              testID="sortButton" 
              style={orderStatusStyles.headerButton}
              onPress={toggleSortOrder}
            >
              <Text style={orderStatusStyles.headerButtonText}>
                {sortOrder === 'desc' ? '최신순' : '오래된 순'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="periodButton"
              style={orderStatusStyles.headerButton}
              onPress={() => setShowPeriodModal(true)}
            >
              <Text style={orderStatusStyles.headerButtonText}>
                기간조회
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 주문 내역 리스트 */}
      {loading ? (
        <View style={orderStatusStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D326F" />
        </View>
      ) : sortedYears.length === 0 ? (
        <View style={orderStatusStyles.emptyContainer}>
          <Text style={orderStatusStyles.emptyText}>아직 발주 내역이 없습니다.</Text>
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
                <Text style={orderStatusStyles.yearHeader}>
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
                    <View key={month} style={orderStatusStyles.monthContainer}>
                      <View style={orderStatusStyles.monthHeader}>
                        <Text style={orderStatusStyles.monthTitle}>{month}월</Text>
                        <Text style={orderStatusStyles.monthTotal}>
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
                          <View key={week} style={orderStatusStyles.weekContainer}>
                            <View style={orderStatusStyles.weekHeader}>
                              <Text style={orderStatusStyles.weekTitle}>
                                {week}주차
                              </Text>
                              <Text style={orderStatusStyles.weekTotal}>
                                {f.formatPrice(weekTotalCost)}원
                              </Text>
                            </View>
                            <View style={orderStatusStyles.orderContent}>
                              <View style={orderStatusStyles.orderInfo}>
                                <Text style={orderStatusStyles.productName}>
                                  {firstOrder.품목명}
                                </Text>
                                {extraCount > 0 && (
                                  <Text style={orderStatusStyles.extraCount}>
                                    외 {extraCount}개
                                  </Text>
                                )}
                                <Text style={orderStatusStyles.quantity}>
                                  발주수량: {f.formatPrice(firstOrder.매장_발주량)}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={orderStatusStyles.detailButton}
                                onPress={() => openDetailModal(`${year}.${month}.${week}`, orders)}
                              >
                                <Text style={orderStatusStyles.detailButtonText}>
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
              <TouchableOpacity
                style={orderStatusStyles.loadMoreButton}
                onPress={async () => {
                  const currentOffset = scrollOffset.current;
                  await fetchOrders(currentPage, sortOrder);
                  setCurrentPage((prev) => prev + 5);
                  setTimeout(() => {
                    flatListRef.current?.scrollToOffset({
                      offset: currentOffset,
                      animated: false,
                    });
                  }, 100);
                }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#0D326F" />
                ) : (
                  <Text style={orderStatusStyles.loadMoreButtonText}>
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
          <TouchableOpacity style={orderStatusStyles.resetButton} onPress={handleResetSearch}>
            <Text style={orderStatusStyles.resetButtonText}>초기화</Text>
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
              <View style={orderStatusStyles.header}>
                <Text style={orderStatusStyles.headerTitle}>주문 상세 내역</Text>
                <Text style={orderStatusStyles.headerSubtitle}>{f.formatWeekString(detailGroupDate)}</Text>
              </View>
              <View style={orderStatusStyles.divider} />
              {detailGroupOrders.map((order, idx) => (
                <View key={idx} style={orderStatusStyles.itemRow}>
                  <View style={orderStatusStyles.itemRowLeft}>
                    <Text style={orderStatusStyles.itemName}>{order.품목명}</Text>
                    <Text style={orderStatusStyles.itemQty}>
                      x {f.formatPrice(order.매장_발주량)}개
                    </Text>
                  </View>
                  <Text style={orderStatusStyles.itemPrice}>
                    {f.formatPrice(order.totalCost || 0)}원
                  </Text>
                </View>
              ))}
              <View style={orderStatusStyles.divider} />
              <View style={orderStatusStyles.footer}>
                <Text style={orderStatusStyles.footerText}>
                  총 합계: {f.formatPrice(detailTotalCost)}원
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={orderStatusStyles.closeButton}
              onPress={() => setDetailModalVisible(false)}
            >
              <Text style={orderStatusStyles.textStyle}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 기간조회 모달 */}
      <Modal
        visible={showPeriodModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowPeriodModal(false);
          setOpenStartDropdown(null);
          setOpenEndDropdown(null);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setOpenStartDropdown(null);
            setOpenEndDropdown(null);
          }}
        >
          <View style={orderStatusStyles.periodModalContainer}>
            <TouchableWithoutFeedback>
              <View style={orderStatusStyles.periodModalInner}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={orderStatusStyles.periodModalTitle}>기간조회</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowPeriodModal(false);
                      setOpenStartDropdown(null);
                      setOpenEndDropdown(null);
                    }}
                  >
                    <LucideX color="red" size={24} />
                  </TouchableOpacity>
                </View>
                {/* 시작날짜 섹션: 종료날짜 dropdown이 열려있지 않을 때만 보임 */}
                {openEndDropdown === null && (
                  <View style={orderStatusStyles.dateGroup}>
                    <Text style={orderStatusStyles.dateGroupLabel}>시작날짜</Text>
                    <View style={orderStatusStyles.dateRow}>
                      <View style={orderStatusStyles.dropdownWrapper}>
                        <TouchableOpacity
                          style={orderStatusStyles.dateBox}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setOpenStartDropdown(openStartDropdown === 'year' ? null : 'year');
                            setOpenEndDropdown(null);
                          }}
                        >
                          <Text style={orderStatusStyles.dateBoxText}>
                            {startYear ? `${startYear}년` : '년도 선택'}
                          </Text>
                        </TouchableOpacity>
                        {openStartDropdown === 'year' && (
                          <View style={[orderStatusStyles.dropdown, orderStatusStyles.dropdownOpen]}>
                            <ScrollView style={orderStatusStyles.dropdownScroll}>
                              {years.map((y) => (
                                <TouchableOpacity
                                  key={y}
                                  style={[
                                    orderStatusStyles.pickerItem,
                                    startYear === y && orderStatusStyles.pickerItemActive
                                  ]}
                                  onPress={() => setStartYear(y)}
                                >
                                  <Text style={{ color: startYear === y ? '#fff' : '#333' }}>
                                    {y}년
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                      {/* 시작월 */}
                      <View style={orderStatusStyles.dropdownWrapper}>
                        <TouchableOpacity
                          style={orderStatusStyles.dateBox}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setOpenStartDropdown(openStartDropdown === 'month' ? null : 'month');
                            setOpenEndDropdown(null);
                          }}
                        >
                          <Text style={orderStatusStyles.dateBoxText}>
                            {startMonth ? `${startMonth}월` : '월 선택'}
                          </Text>
                        </TouchableOpacity>
                        {openStartDropdown === 'month' && (
                          <View style={[orderStatusStyles.dropdown, orderStatusStyles.dropdownOpen]}>
                            <ScrollView style={orderStatusStyles.dropdownScroll}>
                              {months.map((m) => (
                                <TouchableOpacity
                                  key={m}
                                  style={[
                                    orderStatusStyles.pickerItem,
                                    startMonth === m && orderStatusStyles.pickerItemActive
                                  ]}
                                  onPress={() => setStartMonth(m)}
                                >
                                  <Text style={{ color: startMonth === m ? '#fff' : '#333' }}>
                                    {m}월
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                      {/* 시작주차 */}
                      <View style={orderStatusStyles.dropdownWrapper}>
                        <TouchableOpacity
                          style={orderStatusStyles.dateBox}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setOpenStartDropdown(openStartDropdown === 'week' ? null : 'week');
                            setOpenEndDropdown(null);
                          }}
                        >
                          <Text style={orderStatusStyles.dateBoxText}>
                            {startWeek ? `${startWeek}주` : '주차 선택'}
                          </Text>
                        </TouchableOpacity>
                        {openStartDropdown === 'week' && (
                          <View style={[orderStatusStyles.dropdown, orderStatusStyles.dropdownOpen]}>
                            <ScrollView style={orderStatusStyles.dropdownScroll}>
                              {weeks.map((w) => (
                                <TouchableOpacity
                                  key={w}
                                  style={[
                                    orderStatusStyles.pickerItem,
                                    startWeek === w && orderStatusStyles.pickerItemActive
                                  ]}
                                  onPress={() => setStartWeek(w)}
                                >
                                  <Text style={{ color: startWeek === w ? '#fff' : '#333' }}>
                                    {w}주
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </View>
                    {openStartDropdown !== null && (
                      <TouchableOpacity
                        style={orderStatusStyles.confirmButton}
                        onPress={() => setOpenStartDropdown(null)}
                      >
                        <Text style={orderStatusStyles.confirmButtonText}>확인</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {/* 종료날짜 섹션: 시작날짜 dropdown이 열려있지 않을 때만 보임 */}
                {openStartDropdown === null && (
                  <View style={orderStatusStyles.dateGroup}>
                    <Text style={orderStatusStyles.dateGroupLabel}>종료날짜</Text>
                    <View style={orderStatusStyles.dateRow}>
                      <View style={orderStatusStyles.dropdownWrapper}>
                        <TouchableOpacity
                          style={orderStatusStyles.dateBox}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setOpenEndDropdown(openEndDropdown === 'year' ? null : 'year');
                            setOpenStartDropdown(null);
                          }}
                        >
                          <Text style={orderStatusStyles.dateBoxText}>
                            {endYear ? `${endYear}년` : '년도 선택'}
                          </Text>
                        </TouchableOpacity>
                        {openEndDropdown === 'year' && (
                          <View style={[orderStatusStyles.dropdown, orderStatusStyles.dropdownOpen]}>
                            <ScrollView style={orderStatusStyles.dropdownScroll}>
                              {years.map((y) => (
                                <TouchableOpacity
                                  key={y}
                                  style={[
                                    orderStatusStyles.pickerItem,
                                    endYear === y && orderStatusStyles.pickerItemActive
                                  ]}
                                  onPress={() => setEndYear(y)}
                                >
                                  <Text style={{ color: endYear === y ? '#fff' : '#333' }}>
                                    {y}년
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                      <View style={orderStatusStyles.dropdownWrapper}>
                        <TouchableOpacity
                          style={orderStatusStyles.dateBox}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setOpenEndDropdown(openEndDropdown === 'month' ? null : 'month');
                            setOpenStartDropdown(null);
                          }}
                        >
                          <Text style={orderStatusStyles.dateBoxText}>
                            {endMonth ? `${endMonth}월` : '월 선택'}
                          </Text>
                        </TouchableOpacity>
                        {openEndDropdown === 'month' && (
                          <View style={[orderStatusStyles.dropdown, orderStatusStyles.dropdownOpen]}>
                            <ScrollView style={orderStatusStyles.dropdownScroll}>
                              {months.map((m) => (
                                <TouchableOpacity
                                  key={m}
                                  style={[
                                    orderStatusStyles.pickerItem,
                                    endMonth === m && orderStatusStyles.pickerItemActive
                                  ]}
                                  onPress={() => setEndMonth(m)}
                                >
                                  <Text style={{ color: endMonth === m ? '#fff' : '#333' }}>
                                    {m}월
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                      <View style={orderStatusStyles.dropdownWrapper}>
                        <TouchableOpacity
                          style={orderStatusStyles.dateBox}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setOpenEndDropdown(openEndDropdown === 'week' ? null : 'week');
                            setOpenStartDropdown(null);
                          }}
                        >
                          <Text style={orderStatusStyles.dateBoxText}>
                            {endWeek ? `${endWeek}주` : '주차 선택'}
                          </Text>
                        </TouchableOpacity>
                        {openEndDropdown === 'week' && (
                          <View style={[orderStatusStyles.dropdown, orderStatusStyles.dropdownOpen]}>
                            <ScrollView style={orderStatusStyles.dropdownScroll}>
                              {weeks.map((w) => (
                                <TouchableOpacity
                                  key={w}
                                  style={[
                                    orderStatusStyles.pickerItem,
                                    endWeek === w && orderStatusStyles.pickerItemActive
                                  ]}
                                  onPress={() => setEndWeek(w)}
                                >
                                  <Text style={{ color: endWeek === w ? '#fff' : '#333' }}>
                                    {w}주
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </View>
                    {openEndDropdown !== null && (
                      <TouchableOpacity
                        style={orderStatusStyles.confirmButton}
                        onPress={() => setOpenEndDropdown(null)}
                      >
                        <Text style={orderStatusStyles.confirmButtonText}>확인</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {openStartDropdown === null && openEndDropdown === null && (
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <TouchableOpacity
                      style={orderStatusStyles.periodSearchButton}
                      onPress={() => handlePeriodSearch()}
                    >
                      <Text style={orderStatusStyles.periodSearchButtonText}>검색</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 날짜 선택 모달 */}
      <Modal
        visible={showDatePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <View style={orderStatusStyles.datePickerModalContainer}>
          <View style={orderStatusStyles.datePickerModal}>
            <Text style={orderStatusStyles.datePickerTitle}>
              {selectingStart ? '시작일 선택' : '종료일 선택'}
            </Text>
            <Text style={orderStatusStyles.datePickerLabel}>연도</Text>
            <ScrollView horizontal style={{ marginBottom: 8 }}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[
                    {
                      backgroundColor: '#eee',
                      borderRadius: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      marginRight: 6,
                    },
                    (selectingStart ? startYear : endYear) === y && { backgroundColor: '#0D326F' },
                  ]}
                  onPress={() => (selectingStart ? setStartYear(y) : setEndYear(y))}
                >
                  <Text style={{
                    color: (selectingStart ? startYear : endYear) === y ? '#fff' : '#333',
                  }}>
                    {y}년
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={orderStatusStyles.datePickerLabel}>월</Text>
            <View>
              <ScrollView horizontal style={{ marginBottom: 4 }}>
                {months.slice(0, 6).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      {
                        backgroundColor: '#eee',
                        borderRadius: 6,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        marginRight: 6,
                      },
                      (selectingStart ? startMonth : endMonth) === m && { backgroundColor: '#0D326F' },
                    ]}
                    onPress={() => (selectingStart ? setStartMonth(m) : setEndMonth(m))}
                  >
                    <Text style={{
                      color: (selectingStart ? startMonth : endMonth) === m ? '#fff' : '#333',
                    }}>
                      {m}월
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView horizontal style={{ marginBottom: 8 }}>
                {months.slice(6).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      {
                        backgroundColor: '#eee',
                        borderRadius: 6,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        marginRight: 6,
                      },
                      (selectingStart ? startMonth : endMonth) === m && { backgroundColor: '#0D326F' },
                    ]}
                    onPress={() => (selectingStart ? setStartMonth(m) : setEndMonth(m))}
                  >
                    <Text style={{
                      color: (selectingStart ? startMonth : endMonth) === m ? '#fff' : '#333',
                    }}>
                      {m}월
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={orderStatusStyles.datePickerLabel}>주차</Text>
            <ScrollView horizontal style={{ marginBottom: 16 }}>
              {weeks.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[
                    {
                      backgroundColor: '#eee',
                      borderRadius: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      marginRight: 6,
                    },
                    (selectingStart ? startWeek : endWeek) === w && { backgroundColor: '#0D326F' },
                  ]}
                  onPress={() => (selectingStart ? setStartWeek(w) : setEndWeek(w))}
                >
                  <Text style={{
                    color: (selectingStart ? startWeek : endWeek) === w ? '#fff' : '#333',
                  }}>
                    {w}주
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={orderStatusStyles.periodSearchButton}
              onPress={() => setShowDatePickerModal(false)}
            >
              <Text style={orderStatusStyles.periodSearchButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OrderStatus;
