// app/(store)/OrderStatus.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
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
import { styles, modalStyles, orderStatusStyles, receiptStyles } from '../../src/components/ui/common/commonstyler';
import * as f from '../../src/components/ui/common/function';

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

 //
  const detailTotalCost = detailGroupOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);
  
  // (드롭다운 관련 상태가 있다면 상위 컴포넌트에 있던 것을 그대로 포함)
  const [openStartDropdown, setOpenStartDropdown] = useState<"year" | "month" | "week" | null>(null);
  const [openEndDropdown, setOpenEndDropdown] = useState<"year" | "month" | "week" | null>(null);

    /** 날짜선택 모달 열기 (시작/종료 구분) */
    const openDatePicker = (isStart: boolean) => {
        setSelectingStart(isStart);
        setShowDatePickerModal(true);
        };
        
  // 연도, 월, 주 배열 (예시)
  const years = [2025, 2024, 2023, 2022, 2021];
  const months = [1,2,3,4,5,6,7,8,9,10,11,12];
  const weeks = [1,2,3,4,5];

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
      <View style={styles.loading_Container}>
        <ActivityIndicator size="large" color="#0D326F80" />
        <Text style={styles.loading_Text}>로딩 중...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {/* 전체 상단 헤더: 로딩중이거나 주문 내역이 없으면 숨김 */}
      {!loading && sortedYears.length > 0 && (
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title,{textAlign: `center`}]}>발주 내역</Text>
          </View>
          <View style={styles.rightButtonGroup}>
            <TouchableOpacity style={styles.sortButton} onPress={toggleSortOrder}>
              <Text style={{ color: '#0D326F', fontWeight: 'bold', fontSize: 11,}}>
                {sortOrder === 'desc' ? '최신순' : '오래된 순'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, { marginLeft: 8 }]}
              onPress={() => setShowPeriodModal(true)}
            >
              <Text style={{ color: '#0D326F', fontWeight: 'bold', fontSize: 11 }}>
                기간조회
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
  

      {/* 주문 내역 리스트 */}
      {loading ? (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="##0D326F" />
      </View> 
        ) : sortedYears.length === 0 ? (
            <Text>아직 발주 내역이 없습니다.</Text>
        ) : (
            <ScrollView style={{ width: '100%' }}>
            {sortedYears.map((year) => {
                const monthsObj = groupedByYearMonthWeek[year];
                const sortedMonths = sortKeys(Object.keys(monthsObj));

                return (
                <View
                    key={year}
                    style={{
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: '#aaa',
                    borderRadius: 8,
                    padding: 10,
                    }}
                >
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                    {year}년 주문내역
                    </Text>
                    {sortedMonths.map((month) => {
                    const weeksObj = monthsObj[month];
                    const sortedWeeks = sortKeys(Object.keys(weeksObj));

                    // 월별 합계
                    const monthTotalCost = sortedWeeks.reduce((monthSum, w) => {
                        const ordersInWeek = weeksObj[w];
                        return (
                        monthSum +
                        ordersInWeek.reduce((weekSum: number, o: StoreOrderData) => {
                            return weekSum + (o.totalCost || 0);
                        }, 0)
                        );
                    }, 0);

                    return (
                        <View key={month} style={{ marginBottom: 10, paddingLeft: 10 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 5 }}>
                            {month}월{' '}
                            <Text style={{ color: '#1e7e34', fontWeight: 'bold' }}>
                            총 {f.formatPrice(monthTotalCost)}원
                            </Text>
                        </Text>
                        {sortedWeeks.map((week) => {
                            const orders = weeksObj[week];
                            const firstOrder = orders[0];
                            const extraCount = orders.length - 1;

                            // 주차별 합계
                            const weekTotalCost = orders.reduce(
                            (sum: number, o: StoreOrderData) => sum + (o.totalCost || 0),
                            0
                            );

                            return (
                            <View
                                key={week}
                                style={{
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: '#ddd',
                                borderRadius: 8,
                                padding: 10,
                                }}
                            >
                                <Text style={orderStatusStyles.dateHeader}>
                                {week}주차 주문 내역 (총 {f.formatPrice(weekTotalCost)}원)
                                </Text>
                                <View
                                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                                >
                                <View style={{ flex: 1 }}>
                                    <Text style={orderStatusStyles.productName}>
                                    {firstOrder.품목명}
                                    </Text>
                                    {extraCount > 0 && (
                                    <Text style={orderStatusStyles.extraCountText}>
                                        외 {extraCount}개
                                    </Text>
                                    )}
                                    <Text
                                    style={[orderStatusStyles.quantity, { marginTop: 'auto' }]}
                                    >
                                    발주수량: {f.formatPrice(firstOrder.매장_발주량)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                    orderStatusStyles.actionButton,
                                    { alignSelf: 'flex-end', marginLeft: 12 },
                                    ]}
                                    onPress={() =>
                                    openDetailModal(`${year}.${month}.${week}`, orders)
                                    }
                                >
                                    <Text style={orderStatusStyles.actionButtonText}>
                                    주문 상세보기
                                    </Text>
                                </TouchableOpacity>
                                </View>
                            </View>
                            );
                        })}
                        </View>
                    );
                    })}
                </View>
                );
            })}
          {!isPeriodSearch && hasMore && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={async () => {
                await fetchOrders(currentPage, sortOrder);
                setCurrentPage((prev) => prev + 5);
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0D326F" />
              ) : (
                <Text style={styles.loadMoreButtonText}>더 불러오기</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* 주문 상세보기 모달 */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={[modalStyles.modalView, { maxHeight: '80%' }]}>
            <ScrollView style={receiptStyles.receiptContainer}>
              <View style={receiptStyles.header}>
                <Text style={receiptStyles.headerTitle}>주문 상세 내역</Text>
                <Text style={receiptStyles.headerSubtitle}>{f.formatWeekString(detailGroupDate)}</Text>
              </View>
              <View style={receiptStyles.divider} />
              {detailGroupOrders.map((order, idx) => (
                <View key={idx} style={receiptStyles.itemRow}>
                  <View style={receiptStyles.itemRowLeft}>
                    <Text style={receiptStyles.itemName}>{order.품목명}</Text>
                    <Text style={receiptStyles.itemQty}>
                      x {f.formatPrice(order.매장_발주량)}개
                    </Text>
                  </View>
                  <View style={receiptStyles.itemRowRight}>
                    <Text style={receiptStyles.itemPrice}>
                      {f.formatPrice(order.totalCost || 0)}원
                    </Text>
                  </View>
                </View>
              ))}
              <View style={receiptStyles.divider} />
              <View style={receiptStyles.footer}>
                <Text style={receiptStyles.footerText}>
                  총 합계: {f.formatPrice(detailTotalCost)}원
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => setDetailModalVisible(false)}
            >
              <Text style={modalStyles.textStyle}>닫기</Text>
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
        {/* 모달 밖(검정 배경) 터치 시 드롭다운 닫힘 */}
        <TouchableWithoutFeedback
          onPress={() => {
            setOpenStartDropdown(null);
            setOpenEndDropdown(null);
          }}
        >
          <View style={styles.periodModalContainer}>
            {/* 모달 안(흰색 배경) */}
            <TouchableWithoutFeedback>
              <View style={styles.periodModalInner}>
                <View style={{ flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                    }}>
                  <Text style={styles.periodModalTitle}>기간조회</Text>
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
                {/* 시작날짜 섹션은 "종료날짜 드롭다운이 열려 있지 않을 때"만 보인다. */}
                {openEndDropdown === null && (
                  <View style={styles.dateGroup}>
                    <Text style={styles.dateGroupLabel}>시작날짜</Text>
                    <View style={styles.dateRow}>
                      <View style={styles.dropdownWrapper}>
                        <TouchableOpacity
                          style={styles.dateBox}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setOpenStartDropdown(openStartDropdown === 'year' ? null : 'year');
                            setOpenEndDropdown(null);
                          }}
                        >
                          <Text style={styles.dateBoxText}>
                            {startYear ? `${startYear}년` : '년도 선택'}
                          </Text>
                        </TouchableOpacity>
                        {openStartDropdown === 'year' && (
                          <View style={[styles.dropdown, styles.dropdownOpen]}>
                            <ScrollView style={styles.dropdownScroll}>
                              {years.map((y) => (
                                <TouchableOpacity
                                  key={y}
                                  style={styles.dropdownItem}
                                  onPress={() => {
                                    setStartYear(y);
                                    // 드롭다운 선택 후 개별적으로 닫힘
                                    setOpenStartDropdown(null);
                                  }}
                                >
                                  <Text>{y}년</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                      {/* 시작월 */}
                      <View style={styles.dropdownWrapper}>
                        <TouchableOpacity
                          style={styles.dateBox}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setOpenStartDropdown(openStartDropdown === 'month' ? null : 'month');
                            setOpenEndDropdown(null);
                          }}
                        >
                          <Text style={styles.dateBoxText}>
                            {startMonth ? `${startMonth}월` : '월 선택'}
                          </Text>
                        </TouchableOpacity>
                        {openStartDropdown === 'month' && (
                          <View style={[styles.dropdown, styles.dropdownOpen]}>
                            <ScrollView style={styles.dropdownScroll}>
                              {months.map((m) => (
                                <TouchableOpacity
                                  key={m}
                                  style={styles.dropdownItem}
                                  onPress={() => {
                                    setStartMonth(m);
                                    setOpenStartDropdown(null);
                                  }}
                                >
                                  <Text>{m}월</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                      {/* 시작주차 */}
                      <View style={styles.dropdownWrapper}>
                        <TouchableOpacity
                          style={styles.dateBox}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setOpenStartDropdown(openStartDropdown === 'week' ? null : 'week');
                            setOpenEndDropdown(null);
                          }}
                        >
                          <Text style={styles.dateBoxText}>
                            {startWeek ? `${startWeek}주` : '주차 선택'}
                          </Text>
                        </TouchableOpacity>
                        {openStartDropdown === 'week' && (
                          <View style={[styles.dropdown, styles.dropdownOpen]}>
                            <ScrollView style={styles.dropdownScroll}>
                              {weeks.map((w) => (
                                <TouchableOpacity
                                  key={w}
                                  style={styles.dropdownItem}
                                  onPress={() => {
                                    setStartWeek(w);
                                    setOpenStartDropdown(null);
                                  }}
                                >
                                  <Text>{w}주</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </View>
                    {/* 시작날짜 드롭다운이 개별적으로 열려 있을 때만 확인 버튼 표시 */}
                    {openStartDropdown !== null && (
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => setOpenStartDropdown(null)}
                      >
                        <Text style={styles.confirmButtonText}>확인</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                 {/* 종료날짜 섹션은 "시작날짜 드롭다운이 열려 있지 않을 때"만 보인다. */}
                {openStartDropdown === null && (
                  <View style={styles.dateGroup}>
                    <Text style={styles.dateGroupLabel}>종료날짜</Text>
                    <View style={styles.dateRow}>
                        {/* 종료년도 */}
                      <View style={styles.dropdownWrapper}>
                        <TouchableOpacity
                          style={styles.dateBox}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setOpenEndDropdown(openEndDropdown === 'year' ? null : 'year');
                            setOpenStartDropdown(null);
                          }}
                        >
                          <Text style={styles.dateBoxText}>
                            {endYear ? `${endYear}년` : '년도 선택'}
                          </Text>
                        </TouchableOpacity>
                        {openEndDropdown === 'year' && (
                          <View style={[styles.dropdown, styles.dropdownOpen]}>
                            <ScrollView style={styles.dropdownScroll}>
                              {years.map((y) => (
                                <TouchableOpacity
                                  key={y}
                                  style={styles.dropdownItem}
                                  onPress={() => {
                                    setEndYear(y);
                                    setOpenEndDropdown(null);
                                  }}
                                >
                                  <Text>{y}년</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                      {/* 종료월 */}
                      <View style={styles.dropdownWrapper}>
                        <TouchableOpacity
                          style={styles.dateBox}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setOpenEndDropdown(openEndDropdown === 'month' ? null : 'month');
                            setOpenStartDropdown(null);
                          }}
                        >
                          <Text style={styles.dateBoxText}>
                            {endMonth ? `${endMonth}월` : '월 선택'}
                          </Text>
                        </TouchableOpacity>
                        {openEndDropdown === 'month' && (
                          <View style={[styles.dropdown, styles.dropdownOpen]}>
                            <ScrollView style={styles.dropdownScroll}>
                              {months.map((m) => (
                                <TouchableOpacity
                                  key={m}
                                  style={styles.dropdownItem}
                                  onPress={() => {
                                    setEndMonth(m);
                                    setOpenEndDropdown(null);
                                  }}
                                >
                                  <Text>{m}월</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                      {/* 종료주차 */}
                      <View style={styles.dropdownWrapper}>
                        <TouchableOpacity
                          style={styles.dateBox}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setOpenEndDropdown(openEndDropdown === 'week' ? null : 'week');
                            setOpenStartDropdown(null);
                          }}
                        >
                          <Text style={styles.dateBoxText}>
                            {endWeek ? `${endWeek}주` : '주차 선택'}
                          </Text>
                        </TouchableOpacity>
                        {openEndDropdown === 'week' && (
                          <View style={[styles.dropdown, styles.dropdownOpen]}>
                            <ScrollView style={styles.dropdownScroll}>
                              {weeks.map((w) => (
                                <TouchableOpacity
                                  key={w}
                                  style={styles.dropdownItem}
                                  onPress={() => {
                                    setEndWeek(w);
                                    setOpenEndDropdown(null);
                                  }}
                                >
                                  <Text>{w}주</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </View>
                     {/* 종료날짜 드롭다운이 개별적으로 열려 있을 때만 확인 버튼 표시 */}
                    {openEndDropdown !== null && (
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => setOpenEndDropdown(null)}
                      >
                        <Text style={styles.confirmButtonText}>확인</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {/* 시작/종료 드롭다운이 모두 닫혔을 때 검색 버튼 */}
                {openStartDropdown === null && openEndDropdown === null && (
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <TouchableOpacity
                      style={styles.periodSearchButton}
                      onPress={() => handlePeriodSearch()}
                    >
                      <Text style={styles.periodSearchButtonText}>검색</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* 메인 필터바에 기간조회 활성 시 빨간색 초기화 버튼 노출 */}
      {isPeriodSearch && (
        <View style={{ position: 'absolute', top: 10, right: 10 }}>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetSearch}>
            <Text style={styles.resetButtonText}>초기화</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 날짜 선택 모달 (연도/월/주차) */}
      <Modal
        visible={showDatePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <View style={styles.datePickerModalContainer}>
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>
              {selectingStart ? '시작일 선택' : '종료일 선택'}
            </Text>
            <Text style={styles.datePickerLabel}>연도</Text>
            <ScrollView horizontal style={{ marginBottom: 8 }}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[
                    styles.pickerItem,
                    (selectingStart ? startYear : endYear) === y && styles.pickerItemActive,
                  ]}
                  onPress={() => (selectingStart ? setStartYear(y) : setEndYear(y))}
                >
                  <Text
                    style={{
                      color: (selectingStart ? startYear : endYear) === y ? '#fff' : '#333',
                    }}
                  >
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.datePickerLabel}>월</Text>
            <View>
              <ScrollView horizontal style={{ marginBottom: 4 }}>
                {months.slice(0, 6).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.pickerItem,
                      (selectingStart ? startMonth : endMonth) === m && styles.pickerItemActive,
                    ]}
                    onPress={() => (selectingStart ? setStartMonth(m) : setEndMonth(m))}
                  >
                    <Text
                      style={{
                        color: (selectingStart ? startMonth : endMonth) === m ? '#fff' : '#333',
                      }}
                    >
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
                      styles.pickerItem,
                      (selectingStart ? startMonth : endMonth) === m && styles.pickerItemActive,
                    ]}
                    onPress={() => (selectingStart ? setStartMonth(m) : setEndMonth(m))}
                  >
                    <Text
                      style={{
                        color: (selectingStart ? startMonth : endMonth) === m ? '#fff' : '#333',
                      }}
                    >
                      {m}월
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={styles.datePickerLabel}>주차</Text>
            <ScrollView horizontal style={{ marginBottom: 16 }}>
              {weeks.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[
                    styles.pickerItem,
                    (selectingStart ? startWeek : endWeek) === w && styles.pickerItemActive,
                  ]}
                  onPress={() => (selectingStart ? setStartWeek(w) : setEndWeek(w))}
                >
                  <Text
                    style={{
                      color: (selectingStart ? startWeek : endWeek) === w ? '#fff' : '#333',
                    }}
                  >
                    {w}주
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.periodSearchButton}
              onPress={() => setShowDatePickerModal(false)}
            >
              <Text style={styles.periodSearchButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};



export default OrderStatus;
