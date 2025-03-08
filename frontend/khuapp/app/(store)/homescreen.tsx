// 홈 화면 정의 및 구현
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { homescreenStyles } from '../../src/styles/homescreen_styles';
import { StoreOrderData, APIProduct } from '../../src/components/ui/common/types';
import { RN_API_URL } from '@env';
import * as f from '../../src/components/ui/common/function';

// 결합된 주문 데이터 타입 (StoreOrderData와 APIProduct의 속성을 모두 포함)
type CombinedOrderData = StoreOrderData & Partial<APIProduct>;

interface HomescreenProps {
  storeId: string;
  storeName: string;
}

const Homescreen: React.FC<HomescreenProps> = ({ storeId, storeName }) => {
  // 상태 관리
  const [loading, setLoading] = useState<boolean>(true);
  const [allItems, setAllItems] = useState<APIProduct[]>([]);
  const [storeOrders, setStoreOrders] = useState<CombinedOrderData[]>([]);
  
  // 월별 상세보기 관련 상태
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
  
  // 현재 월 계산
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const formattedMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
  
  // 제품 정렬 함수
  const sortOrders = (orders: CombinedOrderData[], order: 'asc' | 'desc' = 'asc') => {
    const sorted = orders.sort((a, b) => {
      // 협력사명으로 먼저 정렬
      if (a.협력사명 && b.협력사명) {
        const supplierCompare = a.협력사명.localeCompare(b.협력사명);
        if (supplierCompare !== 0) return supplierCompare;
      }
      
      // 품목명으로 정렬
      if (a.품목명 && b.품목명) {
        return a.품목명.localeCompare(b.품목명);
      }
      
      return 0;
    });
    
    return order === 'desc' ? sorted.reverse() : sorted;
  };
  
  // 월별 상세보기 모달 열기 함수
  const openMonthlyDetailModal = () => {
    // 이미 데이터가 처리되어 있으므로 모달만 열기
    setMonthlyDetailModalVisible(true);
  };
  
  // 주문 데이터 가져오기
  const fetchOrders = async () => {
    if (!storeId) return;
    setLoading(true);
    
    try {
      // 먼저 모든 품목 정보 가져오기
      const itemsResponse = await fetch(`${RN_API_URL}/api/suppliers/items/?all=True`);
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setAllItems(itemsData);
        
        // 현재 월의 주문 데이터 가져오기
        const startDate = `${currentYear}.${formattedMonth}.1`;
        const endDate = `${currentYear}.${formattedMonth}.5`;  // 5주차까지 포함
        const periodParam = `${startDate}~${endDate}`;
        
        const params = new URLSearchParams({
          store_id: storeId,
          기간: periodParam,
          order: 'asc',
          all: "true"
        });
        
        const url = `${RN_API_URL}/api/orders/store_order_list/?${params.toString()}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const result = await response.json();
          const orders: StoreOrderData[] = result.orders;
          
          // 주문 데이터와 품목 정보 결합
          const combined = orders.map((o) => {
            const foundItem = itemsData.find((it: APIProduct) => it.품목_id === o.품목_id);
            const unitPrice = foundItem ? parseFloat(foundItem.입고단가) : 0;
            const qty = o.매장_발주량 || 0;
            return {
              ...o,
              품목명: foundItem?.품목명 ?? '알 수 없는 품목',
              협력사명: foundItem?.협력사명 ?? '',
              협력사_id: foundItem?.협력사_id ?? '',
              종류: foundItem?.종류 ?? '',
              입고단가: foundItem?.입고단가 ?? '0',
              totalCost: unitPrice * qty,
            };
          });
          
          setStoreOrders(combined);
          
          // 자동으로 모달을 여는 부분 제거
          // 데이터 처리만 진행하고 모달은 버튼 클릭 시에만 열리도록 함
          if (combined.length > 0) {
            // 월별 데이터 처리 (모달은 열지 않음)
            processMonthlyData(currentYear.toString(), formattedMonth, combined);
          }
        } else {
          console.error('발주 내역 조회 실패');
        }
      } else {
        console.error('품목 정보 조회 실패');
      }
    } catch (error) {
      console.error('데이터 로딩 중 오류 발생:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 월별 데이터 처리 함수 (모달을 열지 않고 데이터만 처리)
  const processMonthlyData = (year: string, month: string, monthlyOrders: CombinedOrderData[]) => {
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
    
    monthlyOrders.forEach(order => {
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
      const originalOrder = monthlyOrders.find(order => order.품목_id === 품목_id);
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
    
    setMonthlyDetailOrders(monthlyOrders);
    setWeeklyData(weeklyData);
    setWeeklyTotals(weeklyTotals);
    setSortedWeeks(sortedWeeks);
    setProductSummary(sortedProducts);
    setMonthlyTotal(monthlyTotal);
    
    // 모달은 열지 않음 (setMonthlyDetailModalVisible(true) 호출 제거)
  };
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchOrders();
  }, [storeId]);
  
  const formattedMonthlyDetailDate =
    monthlyDetailDate && monthlyDetailDate.split('.').length === 2
      ? `${parseInt(monthlyDetailDate.split('.')[0], 10)}년 ${parseInt(monthlyDetailDate.split('.')[1], 10)}월`
      : monthlyDetailDate;
  
  return (
    <View style={homescreenStyles.container}>
      <View style={homescreenStyles.header}>
        <Text style={homescreenStyles.title}>{storeName} 대시보드</Text>
        <Text style={homescreenStyles.subtitle}>
          {currentYear}년 {currentMonth}월 발주 현황
        </Text>
      </View>
      
      <ScrollView>
        {loading ? (
          <Text>데이터를 불러오는 중입니다...</Text>
        ) : storeOrders.length === 0 ? (
          <Text>이번 달 발주 내역이 없습니다.</Text>
        ) : (
          <>
            <View 
              style={homescreenStyles.monthlyTableContainer}
            >
              <View style={homescreenStyles.monthlyTableHeader}>
                <View style={homescreenStyles.productColumn}>
                  <Text style={[homescreenStyles.monthlyTableHeaderText, { textAlign: 'left' }]} numberOfLines={1} ellipsizeMode="tail">상품명</Text>
                </View>
                {sortedWeeks.map(week => (
                  <View key={week} style={homescreenStyles.weekColumn}>
                    <Text style={homescreenStyles.monthlyTableHeaderText} numberOfLines={1} ellipsizeMode="tail">{week}주</Text>
                  </View>
                ))}
                <View style={homescreenStyles.quantityColumn}>
                  <Text style={homescreenStyles.monthlyTableHeaderText} numberOfLines={1} ellipsizeMode="tail">합계</Text>
                </View>
              </View>
              
              {productSummary.slice(0, 5).map((product, index) => (
                <View 
                  key={index} 
                  style={[
                    homescreenStyles.monthlyTableRow, 
                    index % 2 === 1 ? { backgroundColor: '#f8fafc' } : {}
                  ]}
                >
                  <View style={homescreenStyles.productColumn}>
                    <Text style={[homescreenStyles.monthlyTableCell, { textAlign: 'left' }]} numberOfLines={1} ellipsizeMode="tail">{product.품목명}</Text>
                  </View>
                  {sortedWeeks.map(week => {
                    const weekData = product.주차별[week] || { 수량: 0, 금액: 0 };
                    return (
                      <View key={week} style={homescreenStyles.weekColumn}>
                        <Text style={homescreenStyles.monthlyTableCell} numberOfLines={1} ellipsizeMode="tail">
                          {weekData.수량 > 0 ? `${weekData.수량}` : '-'}
                        </Text>
                      </View>
                    );
                  })}
                  <View style={homescreenStyles.quantityColumn}>
                    <Text style={homescreenStyles.monthlyTableCellHighlight} numberOfLines={1} ellipsizeMode="tail">{product.총수량}</Text>
                  </View>
                </View>
              ))}
              
              {productSummary.length > 5 && (
                <View style={[homescreenStyles.monthlyTableRow, { backgroundColor: '#f0f4f8' }]}>
                  <TouchableOpacity 
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10 }}
                    onPress={openMonthlyDetailModal}
                  >
                    <Text style={{ color: '#64748b', fontWeight: '500' }}>더 많은 항목 보기...</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <View style={homescreenStyles.summarySection}>
              <Text style={homescreenStyles.summaryTitle}>월 발주 금액 요약</Text>
              {sortedWeeks.map(week => (
                <View key={week} style={homescreenStyles.summaryRow}>
                  <Text style={homescreenStyles.summaryLabel}>{week}주차 발주금액</Text>
                  <Text style={homescreenStyles.summaryValue}>{f.formatPrice(weeklyTotals[week])}원</Text>
                </View>
              ))}
              <View style={homescreenStyles.summaryTotal}>
                <Text style={homescreenStyles.summaryTotalLabel}>월 총 발주금액</Text>
                <Text style={homescreenStyles.summaryTotalValue}>{f.formatPrice(monthlyTotal)}원</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
      
      {/* 월별 상세보기 모달 */}
      <Modal
        visible={monthlyDetailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMonthlyDetailModalVisible(false)}
      >
        <View style={homescreenStyles.modalCenteredView}>
          <View style={homescreenStyles.modalView}>
            <View style={homescreenStyles.modalHeader}>
              <Text style={homescreenStyles.modalTitle}>
                {formattedMonthlyDetailDate} 발주 내역
              </Text>
              <TouchableOpacity
                style={homescreenStyles.closeButton}
                onPress={() => setMonthlyDetailModalVisible(false)}
              >
                <Text style={homescreenStyles.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flexGrow: 1 }}>
              <View style={homescreenStyles.monthlyTableContainer}>
                <View style={homescreenStyles.monthlyTableHeader}>
                  <View style={homescreenStyles.productColumn}>
                    <Text style={[homescreenStyles.monthlyTableHeaderText, { textAlign: 'left' }]} numberOfLines={1} ellipsizeMode="tail">상품명</Text>
                  </View>
                  {sortedWeeks.map(week => (
                    <View key={week} style={homescreenStyles.weekColumn}>
                      <Text style={homescreenStyles.monthlyTableHeaderText} numberOfLines={1} ellipsizeMode="tail">{week}주</Text>
                    </View>
                  ))}
                  <View style={homescreenStyles.quantityColumn}>
                    <Text style={homescreenStyles.monthlyTableHeaderText} numberOfLines={1} ellipsizeMode="tail">합계</Text>
                  </View>
                </View>
                {productSummary.map((product, index) => (
                  <View 
                    key={index} 
                    style={[
                      homescreenStyles.monthlyTableRow, 
                      index % 2 === 1 ? { backgroundColor: '#f8fafc' } : {}
                    ]}
                  >
                    <View style={homescreenStyles.productColumn}>
                      <Text style={[homescreenStyles.monthlyTableCell, { textAlign: 'left' }]} numberOfLines={1} ellipsizeMode="tail">{product.품목명}</Text>
                    </View>
                    {sortedWeeks.map(week => {
                      const weekData = product.주차별[week] || { 수량: 0, 금액: 0 };
                      return (
                        <View key={week} style={homescreenStyles.weekColumn}>
                          <Text style={homescreenStyles.monthlyTableCell} numberOfLines={1} ellipsizeMode="tail">
                            {weekData.수량 > 0 ? `${weekData.수량}` : '-'}
                          </Text>
                        </View>
                      );
                    })}
                    <View style={homescreenStyles.quantityColumn}>
                      <Text style={homescreenStyles.monthlyTableCellHighlight} numberOfLines={1} ellipsizeMode="tail">{product.총수량}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={homescreenStyles.summarySection}>
                <Text style={homescreenStyles.summaryTitle}>월 발주 금액 요약</Text>
                {sortedWeeks.map(week => (
                  <View key={week} style={homescreenStyles.summaryRow}>
                    <Text style={homescreenStyles.summaryLabel}>{week}주차 발주금액</Text>
                    <Text style={homescreenStyles.summaryValue}>{f.formatPrice(weeklyTotals[week])}원</Text>
                  </View>
                ))}
                <View style={homescreenStyles.summaryTotal}>
                  <Text style={homescreenStyles.summaryTotalLabel}>월 총 발주금액</Text>
                  <Text style={homescreenStyles.summaryTotalValue}>{f.formatPrice(monthlyTotal)}원</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Homescreen;