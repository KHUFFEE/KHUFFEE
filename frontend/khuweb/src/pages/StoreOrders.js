// frontend/khuweb/src/pages/StoreOrders.js
import React, { useState, useEffect } from 'react';
import { fetchOrders, fetchItems, fetchSuppliers, fetchStores } from '../api/api';
import '../styles/StoreOrders.css';

const StoreOrders = () => {
  const [ordersData, setOrdersData] = useState(null); // API로부터 받은 주문 데이터
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 기간 검색 선택값 (년도, 월, 주차)
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');

  // 드롭다운용 옵션 생성
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y);
  }
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const weeks = [1, 2, 3, 4, 5];

  // 원하는 매장명 순서 (StoreListView에서 받아온 매장 중 해당 이름들을 기준으로 정렬)
  const desiredStoreOrder = [
    "푸른솔",
    "의과대학",
    "중앙도서관",
    "학생회관",
    "예술디자인대",
    "선승관",
    "공학관",
    "멀티미디어관"
  ];

  // API 호출 공통 함수: params에 따라 최신 주문(page=1) 또는 특정 기간 조회
  const fetchData = async (params = { page: 1 }) => {
    try {
      setLoading(true);
      // 주문 API 호출 (기간 파라미터가 있으면 해당 기간으로 조회)
      const ordersResponse = await fetchOrders(params);
      // Items, Suppliers, Stores API를 동시에 호출
      const [itemsData, suppliersData, storesData] = await Promise.all([
        fetchItems(),
        fetchSuppliers(),
        fetchStores()
      ]);
      setOrdersData(ordersResponse);
      setItems(itemsData);
      setSuppliers(suppliersData);
      setStores(storesData);
      setLoading(false);
    } catch (err) {
      console.error("데이터 불러오기 실패:", err);
      setError("데이터를 불러오는데 실패하였습니다.");
      setLoading(false);
    }
  };

  // 초기 렌더링 시 기본적으로 최신 주문(최신 주차: page=1) 조회
  useEffect(() => {
    fetchData({ page: 1 });
  }, []);

  // 검색 버튼 클릭: 선택된 년도, 월, 주차를 조합해 "YYYY.MM.N" 형식의 기간 문자열 생성
  const handleSearch = () => {
    if (!selectedYear || !selectedMonth || !selectedWeek) {
      alert("년도, 월, 주차를 모두 선택해주세요.");
      return;
    }
    const formattedMonth = selectedMonth.toString().padStart(2, '0');
    const period = `${selectedYear}.${formattedMonth}.${selectedWeek}`;
    fetchData({ 기간: period });
  };

  // 최신 주문(최신 주차)으로 리셋
  const handleReset = () => {
    setSelectedYear('');
    setSelectedMonth('');
    setSelectedWeek('');
    fetchData({ page: 1 });
  };

  // 주문 데이터를 품목별로 그룹화 (ordersData.orders: [{매장_id, 품목_id, 기간, 매장_발주량}, ...])
  const groupedOrders = () => {
    const grouping = {};
    if (ordersData && ordersData.orders) {
      ordersData.orders.forEach(order => {
        const itemId = order.품목_id;
        if (!grouping[itemId]) {
          grouping[itemId] = {};
        }
        grouping[itemId][order.매장_id] = order.매장_발주량;
      });
    }
    return grouping;
  };

  const ordersByItem = groupedOrders();

  // 모든 품목(Items)로 행 생성 – 주문이 없는 품목도 포함
  // "종류" 필드를 정렬용으로 추가 (화면에는 출력하지 않음)
  const tableRows = items.map(item => {
    const supplier = suppliers.find(s => s.협력사_id === item.협력사_id) || {};
    return {
      itemId: item.품목_id,
      supplierName: supplier.협력사명 || "N/A",
      itemName: item.품목명 || "N/A",
      type: item.종류 || "", // 정렬에 사용 (화면에는 출력하지 않음)
      orders: ordersByItem[item.품목_id] || {}
    };
  });

  // 정렬: 협력사 오름차순, 그 다음 종류, 그리고 품목명 오름차순
  const sortedTableRows = tableRows.sort((a, b) => {
    const cmpSupplier = a.supplierName.localeCompare(b.supplierName);
    if (cmpSupplier !== 0) return cmpSupplier;
    const cmpType = a.type.localeCompare(b.type);
    if (cmpType !== 0) return cmpType;
    return a.itemName.localeCompare(b.itemName);
  });

  // 원하는 매장 순서에 따라 매장 객체 배열 생성 (매장명이 없는 경우 제외)
  const orderedStores = desiredStoreOrder
    .map(storeName => stores.find(s => s.매장명 === storeName))
    .filter(Boolean);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="store-orders-container">
      <h1>발주 취합서</h1>

      {/* 기간 검색 드롭다운 */}
      <div className="period-search">
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          <option value="">년도</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          <option value="">월</option>
          {months.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
        <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
          <option value="">주차</option>
          {weeks.map(week => (
            <option key={week} value={week}>{week}</option>
          ))}
        </select>
        <button className="search-button" onClick={handleSearch}>검색</button>
        <button className="reset-button" onClick={handleReset}>최신 조회</button>
      </div>
          
      <p>기간: {ordersData?.current_period}</p>
      <hr className="divider" />
      <table className="store-orders-table">
        <thead>
          <tr>
            <th>협력사</th>
            <th>품목명</th>
            {orderedStores.map(store => (
              <th key={store.매장_id}>{store.매장명}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedTableRows.map((row) => (
            <tr key={row.itemId}>
              <td>{row.supplierName}</td>
              <td>{row.itemName}</td>
              {orderedStores.map(store => (
                <td key={store.매장_id}>
                  {row.orders[store.매장_id] !== undefined ? row.orders[store.매장_id] : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StoreOrders;
