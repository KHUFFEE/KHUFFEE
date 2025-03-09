import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { homescreenStyles } from '../../src/styles/homescreen_styles_store';
import { StoreOrderData, APIProduct } from '../../src/components/ui/common/types';
import { RN_API_URL } from '@env';
import * as f from '../../src/components/ui/common/function';
import { RFValue } from 'react-native-responsive-fontsize';
import { verticalScale, moderateScale } from 'react-native-size-matters';
// react-native-chart-kit 대신 react-native-gifted-charts 사용
import { BarChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';

type CombinedOrderData = StoreOrderData & Partial<APIProduct>;

interface HomeScreenProps {
  storeName: string;
  storeId: string;
}

const HomeScreen_store: React.FC<HomeScreenProps> = ({ storeName, storeId }) => {
  // 상태 관리
  const [loading, setLoading] = useState<boolean>(true);
  const [allItems, setAllItems] = useState<APIProduct[]>([]);
  const [currentMonthOrders, setCurrentMonthOrders] = useState<CombinedOrderData[]>([]);
  const [lastMonthOrders, setLastMonthOrders] = useState<CombinedOrderData[]>([]);
  
  // 현재 월 데이터 처리 상태
  const [currentMonthWeeklyData, setCurrentMonthWeeklyData] = useState<{ [week: string]: CombinedOrderData[] }>({});
  const [currentMonthWeeklyTotals, setCurrentMonthWeeklyTotals] = useState<{ [week: string]: number }>({});
  const [currentMonthSortedWeeks, setCurrentMonthSortedWeeks] = useState<string[]>([]);
  const [currentMonthProductSummary, setCurrentMonthProductSummary] = useState<Array<{
    품목명: string;
    총수량: number;
    총금액: number;
    주차별: { [week: string]: { 수량: number; 금액: number } };
  }>>([]);
  const [currentMonthTotal, setCurrentMonthTotal] = useState<number>(0);
  
  // 지난 달 데이터 처리 상태
  const [lastMonthWeeklyData, setLastMonthWeeklyData] = useState<{ [week: string]: CombinedOrderData[] }>({});
  const [lastMonthWeeklyTotals, setLastMonthWeeklyTotals] = useState<{ [week: string]: number }>({});
  const [lastMonthSortedWeeks, setLastMonthSortedWeeks] = useState<string[]>([]);
  const [lastMonthProductSummary, setLastMonthProductSummary] = useState<Array<{
    품목명: string;
    총수량: number;
    총금액: number;
    주차별: { [week: string]: { 수량: number; 금액: number } };
  }>>([]);
  const [lastMonthTotal, setLastMonthTotal] = useState<number>(0);
  
  // 현재 월, 지난 달 계산
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const formattedCurrentMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
  
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const formattedLastMonth = lastMonth < 10 ? `0${lastMonth}` : `${lastMonth}`;
  
  // 제품 정렬 함수
  const sortOrders = (orders: CombinedOrderData[], order: 'asc' | 'desc' = 'asc') => {
    const sorted = orders.sort((a, b) => {
      if (a.협력사명 && b.협력사명) {
        const supplierCompare = a.협력사명.localeCompare(b.협력사명);
        if (supplierCompare !== 0) return supplierCompare;
      }
      if (a.품목명 && b.품목명) {
        return a.품목명.localeCompare(b.품목명);
      }
      return 0;
    });
    return order === 'desc' ? sorted.reverse() : sorted;
  };
  
  // 주문 데이터 가져오기
  const fetchOrders = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      // 모든 품목 정보 가져오기
      const itemsResponse = await fetch(`${RN_API_URL}/api/suppliers/items/?all=True`);
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        
        // 현재 월, 지난 월 기간 설정
        const currentMonthStartDate = `${currentYear}.${formattedCurrentMonth}.1`;
        const currentMonthEndDate = `${currentYear}.${formattedCurrentMonth}.5`;
        const currentMonthPeriodParam = `${currentMonthStartDate}~${currentMonthEndDate}`;
        
        const lastMonthStartDate = `${lastMonthYear}.${formattedLastMonth}.1`;
        const lastMonthEndDate = `${lastMonthYear}.${formattedLastMonth}.5`;
        const lastMonthPeriodParam = `${lastMonthStartDate}~${lastMonthEndDate}`;
        
        // 현재 월 데이터
        const currentMonthParams = new URLSearchParams({
          store_id: storeId,
          기간: currentMonthPeriodParam,
          order: 'asc',
          all: "true"
        });
        const currentMonthUrl = `${RN_API_URL}/api/orders/store_order_list/?${currentMonthParams.toString()}`;
        const currentMonthResponse = await fetch(currentMonthUrl);
        
        // 지난 월 데이터
        const lastMonthParams = new URLSearchParams({
          store_id: storeId,
          기간: lastMonthPeriodParam,
          order: 'asc',
          all: "true"
        });
        const lastMonthUrl = `${RN_API_URL}/api/orders/store_order_list/?${lastMonthParams.toString()}`;
        const lastMonthResponse = await fetch(lastMonthUrl);
        
        // 현재 월 데이터 처리
        if (currentMonthResponse.ok) {
          const currentMonthResult = await currentMonthResponse.json();
          const currentMonthOrdersData: StoreOrderData[] = currentMonthResult.orders;
          
          const currentMonthCombined = currentMonthOrdersData.map((o) => {
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
          
          setCurrentMonthOrders(currentMonthCombined);
          if (currentMonthCombined.length > 0) {
            processMonthlyData(
              currentYear.toString(), 
              formattedCurrentMonth, 
              currentMonthCombined,
              setCurrentMonthWeeklyData,
              setCurrentMonthWeeklyTotals,
              setCurrentMonthSortedWeeks,
              setCurrentMonthProductSummary,
              setCurrentMonthTotal
            );
          }
        } else {
          console.error('현재 월 발주 내역 조회 실패');
        }
        
        // 지난 월 데이터 처리
        if (lastMonthResponse.ok) {
          const lastMonthResult = await lastMonthResponse.json();
          const lastMonthOrdersData: StoreOrderData[] = lastMonthResult.orders;
          
          const lastMonthCombined = lastMonthOrdersData.map((o) => {
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
          
          setLastMonthOrders(lastMonthCombined);
          if (lastMonthCombined.length > 0) {
            processMonthlyData(
              lastMonthYear.toString(), 
              formattedLastMonth, 
              lastMonthCombined,
              setLastMonthWeeklyData,
              setLastMonthWeeklyTotals,
              setLastMonthSortedWeeks,
              setLastMonthProductSummary,
              setLastMonthTotal
            );
          }
        } else {
          console.error('지난 월 발주 내역 조회 실패');
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
  
  // 월별 데이터 처리 함수
  const processMonthlyData = (
    year: string, 
    month: string, 
    monthlyOrders: CombinedOrderData[],
    setWeeklyData: React.Dispatch<React.SetStateAction<{ [week: string]: CombinedOrderData[] }>>,
    setWeeklyTotals: React.Dispatch<React.SetStateAction<{ [week: string]: number }>>,
    setSortedWeeks: React.Dispatch<React.SetStateAction<string[]>>,
    setProductSummary: React.Dispatch<React.SetStateAction<Array<{
      품목명: string;
      총수량: number;
      총금액: number;
      주차별: { [week: string]: { 수량: number; 금액: number } };
    }>>>,
    setMonthlyTotal: React.Dispatch<React.SetStateAction<number>>
  ) => {
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
    
    for (let i = 1; i <= 5; i++) {
      const week = i.toString();
      weeklyData[week] = [];
      weeklyTotals[week] = 0;
    }
    
    monthlyOrders.forEach(order => {
      const [, , week] = order.기간.split('.');
      if (!weeklyData[week]) {
        weeklyData[week] = [];
        weeklyTotals[week] = 0;
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
    
    const sortedWeeks = ['1', '2', '3', '4', '5'];
    
    Object.values(productSummaryMap).forEach(product => {
      sortedWeeks.forEach(week => {
        if (!product.주차별[week]) {
          product.주차별[week] = { 수량: 0, 금액: 0 };
        }
      });
    });
    
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
    
    setWeeklyData(weeklyData);
    setWeeklyTotals(weeklyTotals);
    setSortedWeeks(sortedWeeks);
    setProductSummary(sortedProducts);
    setMonthlyTotal(monthlyTotal);
  };
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchOrders();
  }, [storeId]);
  
  // 차트 데이터 준비: 주차별 금액이 0인 경우 해당 주차는 제외
  const prepareChartData = (weeklyTotals: { [week: string]: number }, sortedWeeks: string[]) => {
    const filteredWeeks = sortedWeeks.filter(week => (weeklyTotals[week] || 0) > 0);
    return {
      labels: filteredWeeks.map(week => `${week}주`),
      datasets: [
        {
          data: filteredWeeks.map(week => (weeklyTotals[week] || 0) / 10000),
        }
      ]
    };
  };
  
  // 통합 차트 데이터 준비 (각 월의 금액이 0인 주차는 데이터에서 제외)
  const prepareCombinedChartData = (
    currentMonthWeeklyTotals: { [week: string]: number }, 
    lastMonthWeeklyTotals: { [week: string]: number }, 
    sortedWeeks: string[]
  ) => {
    // 각 월에서 금액이 0이 아닌 주차를 별도로 필터링
    const filteredLastMonthWeeks = sortedWeeks.filter(week => (lastMonthWeeklyTotals[week] || 0) > 0);
    const filteredCurrentMonthWeeks = sortedWeeks.filter(week => (currentMonthWeeklyTotals[week] || 0) > 0);
    
    const lastMonthLabels = filteredLastMonthWeeks.map(week => `${week}주`);
    const currentMonthLabels = filteredCurrentMonthWeeks.map(week => `${week}주`);
    
    const lastMonthData = filteredLastMonthWeeks.map(week => (lastMonthWeeklyTotals[week] || 0) / 10000);
    const currentMonthData = filteredCurrentMonthWeeks.map(week => (currentMonthWeeklyTotals[week] || 0) / 10000);
    
    // react-native-gifted-charts 형식에 맞게 데이터 구조 변경
    const barData = [
      ...filteredLastMonthWeeks.map((week, index) => ({
        value: lastMonthData[index],
        label: lastMonthLabels[index],
        frontColor: 'rgb(13, 50, 111)',
        topLabelComponent: () => (
          <Text style={{ color: 'rgb(13, 50, 111)', fontSize: 10, marginBottom: 2 }}>
            {lastMonthData[index].toFixed(0)}만원
          </Text>
        )
      })),
      ...filteredCurrentMonthWeeks.map((week, index) => ({
        value: currentMonthData[index],
        label: currentMonthLabels[index],
        frontColor: 'rgb(34, 139, 34)',
        topLabelComponent: () => (
          <Text style={{ color: 'rgb(34, 139, 34)', fontSize: 10, marginBottom: 2 }}>
            {currentMonthData[index].toFixed(0)}만원
          </Text>
        )
      }))
    ];
    
    return barData;
  };
  
  const screenWidth = Dimensions.get('window').width - 40;
  
  return (
    <View testID="container" style={homescreenStyles.container}>
      <View testID="header" style={homescreenStyles.header}>
        <Text testID="title" style={homescreenStyles.title}>발주 현황 요약</Text>
      </View>
      
      <ScrollView>
        {loading ? (
          <Text testID="loadingText" style={homescreenStyles.loadingText}>데이터를 불러오는 중입니다...</Text>
        ) : (
          <>
            {/* 주차별 발주 금액 차트 (이번달 & 저번달) */}
            <View testID="sectionContainer" style={homescreenStyles.sectionContainer}>
              <Text testID="sectionTitle" style={homescreenStyles.sectionTitle}>
                {lastMonth}월 & {currentMonth}월 주차별 발주 금액
              </Text>
              
              {currentMonthOrders.length === 0 && lastMonthOrders.length === 0 ? (
                <Text testID="noDataText" style={homescreenStyles.noDataText}>발주 내역이 없습니다.</Text>
              ) : (
                <>
                  {Object.values(currentMonthWeeklyTotals).every(value => value === 0) &&
                   Object.values(lastMonthWeeklyTotals).every(value => value === 0) ? (
                    <Text testID="noDataText" style={homescreenStyles.noDataText}>발주 내역이 없습니다.</Text>
                  ) : (
                    <View testID="chartContainer" style={homescreenStyles.chartContainer}>
                      <BarChart
                        data={prepareCombinedChartData(currentMonthWeeklyTotals, lastMonthWeeklyTotals, currentMonthSortedWeeks)}
                        width={screenWidth}
                        height={280}
                        barWidth={20}
                        spacing={10}
                        hideRules
                        initialSpacing={5}
                        noOfSections={5}
                        yAxisLabelTexts={['0', '10', '20', '30', '50']}
                        yAxisTextStyle={{ color: '#333' }}
                        xAxisLabelTextStyle={{ color: '#333', fontSize: 10 }}
                        showFractionalValues={false}
                        hideYAxisText={false}
                        disablePress={true}
                        rulesType="dashed"
                        backgroundColor={'#fff'}
                        // isAnimated
                        renderTooltip={(item: { value: number }) => {
                          return (
                            <View
                              testID="tooltip"
                              style={{
                                backgroundColor: '#fff',
                                padding: 8,
                                borderRadius: 4,
                                borderWidth: 1,
                                borderColor: '#ddd',
                              }}>
                              <Text style={{ color: '#333', fontSize: 12 }}>
                                {item.value.toFixed(0)}만원
                              </Text>
                            </View>
                          );
                        }}
                      />
                    </View>
                  )}
                  
                  <View testID="summarySection" style={[homescreenStyles.summarySection]}>
                    <View testID="summaryTable" style={homescreenStyles.summaryTable}>
                      <View testID="tableHeader" style={homescreenStyles.tableRow}>
                        <View testID="tableHeaderCell" style={[homescreenStyles.tableCell, homescreenStyles.weekCell, { backgroundColor: 'ffff' }]}>
                        </View>
                        <View testID="tableHeaderCell" style={homescreenStyles.amountCell}>
                          <Text testID="summaryHeaderText" style={[homescreenStyles.tableHeaderText, { paddingRight: moderateScale(15) }]}>{lastMonth}월</Text>
                        </View>
                        <View testID="tableHeaderCell" style={homescreenStyles.amountCell}>
                          <Text testID="summaryHeaderText" style={[homescreenStyles.tableHeaderText, { paddingRight: moderateScale(15), color: 'rgb(34, 139, 34)' }]}>{currentMonth}월</Text>
                        </View>
                      </View>
                      {Array.from(new Set([...lastMonthSortedWeeks, ...currentMonthSortedWeeks])).sort().map(week => (
                        <View key={week} testID="tableRow" style={homescreenStyles.tableRow}>
                          <View testID="tableCell" style={[homescreenStyles.tableCell, homescreenStyles.weekCell, { marginLeft: moderateScale(5) }]}>
                            <Text testID="summaryLabel" style={[homescreenStyles.summaryLabel, { fontSize: RFValue(14) }]}>{week}주차</Text>
                          </View>
                          <View testID="tableCell" style={homescreenStyles.amountCell}>
                            <Text testID="summaryValue" style={[homescreenStyles.summaryValue, { fontSize: RFValue(13) }]}>
                              {f.formatPrice(lastMonthWeeklyTotals[week] || 0)}원
                            </Text>
                          </View>
                          <View testID="tableCell" style={homescreenStyles.amountCell}>
                            <Text testID="summaryValue" style={[homescreenStyles.summaryValue, { fontSize: RFValue(13), color: 'rgb(34, 139, 34)' }]}>
                              {f.formatPrice(currentMonthWeeklyTotals[week] || 0)}원
                            </Text>
                          </View>
                        </View>
                      ))}
                      <View testID="tableFooter" style={[homescreenStyles.tableRow, homescreenStyles.tableFooter, { minHeight: verticalScale(56) }]}>
                        <View testID="tableCell" style={[homescreenStyles.tableCell, homescreenStyles.weekCell, { backgroundColor:'#f1f5f9' }]}>
                          <Text testID="summaryTotalLabel" style={[homescreenStyles.summaryTotalLabel]}>월발주금액</Text>
                        </View>
                        <View testID="tableCell" style={homescreenStyles.amountCell}>
                          <Text testID="summaryTotalValue" style={[homescreenStyles.summaryTotalValue, { fontSize: RFValue(14), color: '#0D326F', fontWeight: '600' }]}>
                            {f.formatPrice(lastMonthTotal)}원
                          </Text>
                        </View>
                        <View testID="tableCell" style={homescreenStyles.amountCell}>
                          <Text testID="summaryTotalValue" style={[homescreenStyles.summaryTotalValue, { fontSize: RFValue(14), color:'rgb(34, 139, 34)', fontWeight: '600' }]}>
                            {f.formatPrice(currentMonthTotal)}원
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
            
            {/* 이번달 상세 발주 내역 */}
            <View testID="sectionContainer" style={homescreenStyles.sectionContainer}>
              <Text testID="sectionTitle" style={homescreenStyles.sectionTitle}>
                {currentYear}년 {currentMonth}월 상세 발주 내역
              </Text>
              
              {currentMonthOrders.length === 0 ? (
                <Text testID="noDataText" style={homescreenStyles.noDataText}>이번 달 발주 내역이 없습니다.</Text>
              ) : (
                <View testID="monthlyTableContainer" style={homescreenStyles.monthlyTableContainer}>
                  <View testID="monthlyTableHeader" style={homescreenStyles.monthlyTableHeader}>
                    <View testID="productColumn" style={homescreenStyles.productColumn}>
                      <Text testID="monthlyTableHeaderText" style={[homescreenStyles.monthlyTableHeaderText, { textAlign: 'left' }]} numberOfLines={1} ellipsizeMode="tail">상품명</Text>
                    </View>
                    {currentMonthSortedWeeks.map(week => (
                      <View key={week} testID="weekColumn" style={homescreenStyles.weekColumn}>
                        <Text testID="monthlyTableHeaderText" style={homescreenStyles.monthlyTableHeaderText} numberOfLines={1} ellipsizeMode="tail">{week}주</Text>
                      </View>
                    ))}
                  </View>
                  
                  {currentMonthProductSummary
                    .filter(product => Object.values(product.주차별).some(weekData => weekData.수량 > 0))
                    .map((product, index) => (
                    <View 
                      key={index} 
                      testID="monthlyTableRow"
                      style={[homescreenStyles.monthlyTableRow, index % 2 === 1 ? { backgroundColor: '#f8fafc' } : {}]}
                    >
                      <View testID="productColumn" style={homescreenStyles.productColumn}>
                        <Text testID="monthlyTableCell" style={[homescreenStyles.monthlyTableCell, { textAlign: 'left' }]} numberOfLines={1} ellipsizeMode="tail">{product.품목명}</Text>
                      </View>
                      {currentMonthSortedWeeks.map(week => {
                        const weekData = product.주차별[week] || { 수량: 0, 금액: 0 };
                        return (
                          <View key={week} testID="weekColumn" style={homescreenStyles.weekColumn}>
                            <Text testID="monthlyTableCell" style={homescreenStyles.monthlyTableCell} numberOfLines={1} ellipsizeMode="tail">
                              {weekData.수량 > 0 ? `${weekData.수량}` : '0'}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            {/* 지난 달 상세 발주 내역 */}
            <View testID="sectionContainer" style={homescreenStyles.sectionContainer}>
              <Text testID="sectionTitle" style={homescreenStyles.sectionTitle}>
                {lastMonthYear}년 {lastMonth}월 상세 발주 내역
              </Text>
              
              {lastMonthOrders.length === 0 ? (
                <Text testID="noDataText" style={homescreenStyles.noDataText}>지난 달 발주 내역이 없습니다.</Text>
              ) : (
                <>
                  <View testID="monthlyTableContainer" style={homescreenStyles.monthlyTableContainer}>
                    <View testID="monthlyTableHeader" style={homescreenStyles.monthlyTableHeader}>
                      <View testID="productColumn" style={homescreenStyles.productColumn}>
                        <Text testID="monthlyTableHeaderText" style={[homescreenStyles.monthlyTableHeaderText, { textAlign: 'left' }]} numberOfLines={1} ellipsizeMode="tail">상품명</Text>
                      </View>
                      {lastMonthSortedWeeks.map(week => (
                        <View key={week} testID="weekColumn" style={homescreenStyles.weekColumn}>
                          <Text testID="monthlyTableHeaderText" style={homescreenStyles.monthlyTableHeaderText} numberOfLines={1} ellipsizeMode="tail">{week}주</Text>
                        </View>
                      ))}
                    </View>
                    
                    {lastMonthProductSummary.map((product, index) => (
                      <View 
                        key={index} 
                        testID="monthlyTableRow"
                        style={[homescreenStyles.monthlyTableRow, index % 2 === 1 ? { backgroundColor: '#f8fafc' } : {}]}
                      >
                        <View testID="productColumn" style={homescreenStyles.productColumn}>
                          <Text testID="monthlyTableCell" style={[homescreenStyles.monthlyTableCell, { textAlign: 'left' }]} numberOfLines={1} ellipsizeMode="tail">{product.품목명}</Text>
                        </View>
                        {lastMonthSortedWeeks.map(week => {
                          const weekData = product.주차별[week] || { 수량: 0, 금액: 0 };
                          return (
                            <View key={week} testID="weekColumn" style={homescreenStyles.weekColumn}>
                              <Text testID="monthlyTableCell" style={homescreenStyles.monthlyTableCell} numberOfLines={1} ellipsizeMode="tail">
                                {weekData.수량 > 0 ? `${weekData.수량}` : '0'}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                  <View testID="comparisonContainer" style={homescreenStyles.comparisonContainer}>
                    <View testID="comparisonItem" style={homescreenStyles.comparisonItem}>
                      <Text testID="comparisonLabel" style={homescreenStyles.comparisonLabel}>전월 총 발주금액</Text>
                      <Text testID="comparisonValue" style={homescreenStyles.comparisonValue}>{f.formatPrice(lastMonthTotal)}원</Text>
                    </View>
                    <View testID="comparisonItem" style={homescreenStyles.comparisonItem}>
                      <Text testID="comparisonLabel" style={homescreenStyles.comparisonLabel}>당월 총 발주금액</Text>
                      <Text testID="comparisonValue" style={homescreenStyles.comparisonValue}>{f.formatPrice(currentMonthTotal)}원</Text>
                    </View>
                    <View testID="comparisonItem" style={homescreenStyles.comparisonItem}>
                      <Text testID="comparisonLabel" style={homescreenStyles.comparisonLabel}>증감액</Text>
                      <Text testID="comparisonValue" style={[
                        homescreenStyles.comparisonValue, 
                        { color: currentMonthTotal > lastMonthTotal ? '#e53e3e' : currentMonthTotal < lastMonthTotal ? '#38a169' : '#64748b' }
                      ]}>
                        {currentMonthTotal > lastMonthTotal ? '+' : ''}{f.formatPrice(currentMonthTotal - lastMonthTotal)}원
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default HomeScreen_store;
