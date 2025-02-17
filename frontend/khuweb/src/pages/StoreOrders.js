import React, { useState, useEffect } from 'react';
import { fetchOrders, fetchItems, fetchSuppliers, fetchStores, updateStoreOrder } from '../api/api';
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

  // 원하는 매장명 순서
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

  // 수정 모드 관련 상태
  const [isEditMode, setIsEditMode] = useState(false);
  // editedOrders: { [itemId]: { [storeId]: newValue, ... } }
  const [editedOrders, setEditedOrders] = useState({});

  // API 호출 공통 함수
  const fetchData = async (params = { page: 1 }) => {
    try {
      setLoading(true);
      const ordersResponse = await fetchOrders(params);
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

  useEffect(() => {
    fetchData({ page: 1 });
  }, []);

  const handleSearch = () => {
    if (!selectedYear || !selectedMonth || !selectedWeek) {
      alert("년도, 월, 주차를 모두 선택해주세요.");
      return;
    }
    const formattedMonth = selectedMonth.toString().padStart(2, '0');
    const period = `${selectedYear}.${formattedMonth}.${selectedWeek}`;
    fetchData({ 기간: period });
  };

  const handleReset = () => {
    setSelectedYear('');
    setSelectedMonth('');
    setSelectedWeek('');
    fetchData({ page: 1 });
  };

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

  const tableRows = items.map(item => {
    const supplier = suppliers.find(s => s.협력사_id === item.협력사_id) || {};
    return {
      itemId: item.품목_id,
      supplierName: supplier.협력사명 || "N/A",
      itemName: item.품목명 || "N/A",
      type: item.종류 || "",
      orders: ordersByItem[item.품목_id] || {}
    };
  });

  const sortedTableRows = tableRows.sort((a, b) => {
    const cmpSupplier = a.supplierName.localeCompare(b.supplierName);
    if (cmpSupplier !== 0) return cmpSupplier;
    const cmpType = a.type.localeCompare(b.type);
    if (cmpType !== 0) return cmpType;
    return a.itemName.localeCompare(b.itemName);
  });

  const orderedStores = desiredStoreOrder
    .map(storeName => stores.find(s => s.매장명 === storeName))
    .filter(Boolean);

  // 각 행의 합계 계산
  const getRowSum = (row) =>
    orderedStores.reduce((sum, store) => {
      const val = row.orders[store.매장_id];
      return sum + (val ? Number(val) : 0);
    }, 0);

  // 각 매장별 합계 계산
  const storeTotals = orderedStores.map(store =>
    sortedTableRows.reduce((sum, row) => sum + (row.orders[store.매장_id] ? Number(row.orders[store.매장_id]) : 0), 0)
  );
  // 전체 합계 계산
  const grandTotal = sortedTableRows.reduce((sum, row) => sum + getRowSum(row), 0);

  // 편집 모드 토글: 수정 버튼 클릭 시, 기존 주문 데이터를 복사해 editedOrders 초기화
  const handleEditToggle = () => {
    if (!isEditMode) {
      const init = {};
      sortedTableRows.forEach(row => {
        init[row.itemId] = { ...row.orders };
      });
      setEditedOrders(init);
    }
    setIsEditMode(!isEditMode);
  };

  // 수정 중 해당 셀의 값을 변경
  const handleOrderChange = (itemId, storeId, value) => {
    setEditedOrders(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [storeId]: value
      }
    }));
  };

  // 수정 완료 버튼 클릭 시, 변경된 주문 데이터를 업데이트 API 호출 후 재조회
  const handleEditSubmit = async () => {
    try {
      const updates = [];
      for (const itemId in editedOrders) {
        for (const storeId in editedOrders[itemId]) {
          const newValue = editedOrders[itemId][storeId];
          // 만약 기존 주문과 변경이 없으면 생략
          const originalVal = tableRows.find(row => row.itemId === itemId)?.orders[storeId];
          // newValue가 빈 문자열이나 0이면, updateStoreOrder API 호출 시 0 값을 보내고(백엔드에서 삭제 처리)
          if (newValue === "" || Number(newValue) === 0) {
            // 여기도 동일하게 보내되, 백엔드에서 0이면 삭제하도록 함
            if (originalVal === 0 || originalVal === "") continue;
          } else if (newValue === originalVal) continue;
          const payload = {
            매장_id: storeId,
            품목_id: itemId,
            기간: ordersData.current_period,
            매장_발주량: Number(newValue)
          };
          updates.push(updateStoreOrder(payload));
        }
      }
      await Promise.all(updates);
      // 업데이트 후 새로 데이터 재조회
      fetchData({ 기간: ordersData.current_period });
      setIsEditMode(false);
    } catch (err) {
      console.error("주문 수정 실패:", err);
      alert("주문 수정에 실패하였습니다.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="store-orders-container">
      <h2 className="title">발주 취합서</h2>
      <div className="period-controls">
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
          {/* <p>기간: {ordersData?.current_period}</p> */}
        </div>
        {/* 수정 버튼은 오른쪽에 그대로 위치 */}
        <button className="edit-button" onClick={handleEditToggle}>
          {isEditMode ? "취소" : "수정"}
        </button>
      </div>
      <hr className="divider" />
      <table className="store-orders-table">
        <thead>
          <tr>
            {/* 번호 헤더: 대각선 대신 "\" 문자 표시 */}
            <th className="so-number-col diagonal-header"></th>
            <th className="so-supplier-col">협력사</th>
            <th className="so-item-col">품목명</th>
            {orderedStores.map(store => (
              <th key={store.매장_id} className="so-order-col">{store.매장명}</th>
            ))}
            <th className="so-sum-col">합계</th>
          </tr>
        </thead>
        <tbody>
          {sortedTableRows.map((row, index) => (
            <tr key={row.itemId}>
              <td className="so-number-col">{index + 1}</td>
              <td className="so-supplier-col">
                <div className="supplier-cell">{row.supplierName}</div>
              </td>
              <td className="so-item-col">
                <div className="item-cell">{row.itemName}</div>
              </td>
              {orderedStores.map(store => (
                <td key={store.매장_id} className="so-order-col">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={
                        editedOrders[row.itemId] &&
                        editedOrders[row.itemId][store.매장_id] !== undefined
                          ? editedOrders[row.itemId][store.매장_id]
                          : ""
                      }
                      onChange={(e) =>
                        handleOrderChange(row.itemId, store.매장_id, e.target.value)
                      }
                      style={{ textAlign: "right" }}
                    />
                  ) : (
                    row.orders[store.매장_id] !== undefined
                      ? row.orders[store.매장_id]
                      : ""
                  )}
                </td>
              ))}
              <td className="so-sum-col">
                {getRowSum(row) === 0 ? "-" : getRowSum(row)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="so-number-col"></td>
            <td className="so-supplier-col" colSpan="2" style={{ textAlign: 'center' }}>합계</td>
            {storeTotals.map((total, idx) => (
              <td key={orderedStores[idx].매장_id} className="so-order-col">
                {total === 0 ? "-" : total}
              </td>
            ))}
            <td className="so-sum-col">
              {grandTotal === 0 ? "-" : grandTotal}
            </td>
          </tr>
        </tfoot>
      </table>
      {isEditMode && (
        <button className="edit-confirm-button" onClick={handleEditSubmit}>
          수정완료
        </button>
      )}
    </div>
  );
};

export default StoreOrders;
