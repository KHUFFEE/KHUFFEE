// frontend/khuweb/src/pages/WarehouseInventory.js
import React, { useState, useEffect } from "react";
import { fetchWarehouseInventory, fetchItems } from "../api/api";
import "../styles/StoreOrders.css"; // StoreOrders.css의 스타일을 그대로 사용

const WarehouseInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 기간 상태 (창고 재고는 YYYY.MM.DD 형식)
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  // API 호출 함수: 기간이 있으면 해당 기간의 데이터를 불러옴
  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const period = params.기간;
      const inventoryRes = await fetchWarehouseInventory({ 기간: period });
      const itemsRes = await fetchItems();
      setInventoryData(inventoryRes);
      setItems(itemsRes);
      setLoading(false);
    } catch (err) {
      console.error("창고 재고 데이터 불러오기 실패:", err);
      setError("데이터를 불러오는데 실패하였습니다.");
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 현재 날짜로 초기화
  useEffect(() => {
    const today = new Date();
    const defaultYear = today.getFullYear().toString();
    const defaultMonth = (today.getMonth() + 1).toString().padStart(2, "0");
    const defaultDay = today.getDate().toString().padStart(2, "0");
    setSelectedYear(defaultYear);
    setSelectedMonth(defaultMonth);
    setSelectedDay(defaultDay);
    fetchData({ 기간: `${defaultYear}.${defaultMonth}.${defaultDay}` });
  }, []);

  // 선택한 년, 월에 따른 일(day) 옵션 생성 (해당 월의 일수)
  const daysInMonth =
    selectedYear && selectedMonth
      ? new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate()
      : 31;
  const dayOptions = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dayOptions.push(d.toString().padStart(2, "0"));
  }

  // "기간 조회" 버튼 클릭 시: 선택한 년, 월, 일을 조합하여 기간 문자열로 API 호출
  const handleSearch = () => {
    if (!selectedYear || !selectedMonth || !selectedDay) {
      alert("년도, 월, 일 모두 선택해주세요.");
      return;
    }
    const period = `${selectedYear}.${selectedMonth}.${selectedDay}`;
    fetchData({ 기간: period });
  };

  // "최신 조회" 버튼 클릭 시: 현재 날짜로 리셋
  const handleReset = () => {
    const today = new Date();
    const defaultYear = today.getFullYear().toString();
    const defaultMonth = (today.getMonth() + 1).toString().padStart(2, "0");
    const defaultDay = today.getDate().toString().padStart(2, "0");
    setSelectedYear(defaultYear);
    setSelectedMonth(defaultMonth);
    setSelectedDay(defaultDay);
    fetchData({ 기간: `${defaultYear}.${defaultMonth}.${defaultDay}` });
  };

  // 그룹화: 창고 재고 데이터는 품목별로 그룹화하여 재고량 합계를 구함
  const groupedInventory = {};
  inventoryData.forEach((record) => {
    const itemId = record.품목_id;
    if (!groupedInventory[itemId]) {
      groupedInventory[itemId] = 0;
    }
    groupedInventory[itemId] += Number(record.창고_재고량);
  });

  // 각 품목별 행 생성: API에서 받은 아이템 목록으로 품목명을 매칭
  const tableRows = Object.keys(groupedInventory).map((itemId) => {
    const item = items.find((it) => it.품목_id === itemId);
    return {
      itemId,
      itemName: item ? item.품목명 : "N/A",
      inventory: groupedInventory[itemId],
    };
  });
  // 품목명 기준 오름차순 정렬
  tableRows.sort((a, b) => a.itemName.localeCompare(b.itemName));

  // 숫자 포맷: 0이면 "-" 표시
  const formatNumber = (num) => {
    if (num === "" || num === undefined || num === null || Number(num) === 0)
      return "-";
    return Number(num).toLocaleString();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="store-orders-container">
      <h2 className="title">창고 재고 조회</h2>
      <div className="period-controls">
        <div className="period-search">
          {/* 년도와 월 선택 (StoreOrders와 동일한 스타일) */}
          <div className="period-select-box">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {["2020", "2021", "2022", "2023", "2024", "2025"].map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(
                (month) => (
                  <option key={month} value={month}>
                    {month}월
                  </option>
                )
              )}
            </select>
          </div>
          {/* 일(day) 선택: 별도 스크롤 영역 */}
          <div className="period-select-box" style={{ maxHeight: "40px", overflowY: "auto" }}>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}일
                </option>
              ))}
            </select>
          </div>
          <button className="reset-button" onClick={handleReset}>
            최신 조회
          </button>
        </div>
      </div>
      <hr className="divider" />
      <table className="store-orders-table">
        <thead>
          <tr>
            <th className="so-number-col diagonal-header"></th>
            <th className="so-item-col">품목명</th>
            <th className="so-sum-col">재고량</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, index) => (
            <tr key={row.itemId}>
              <td className="so-number-col">{index + 1}</td>
              <td className="so-item-col">{row.itemName}</td>
              <td className="so-sum-col">{formatNumber(row.inventory)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: "20px" }}>
        <button className="reset-button" onClick={handleSearch}>
          기간 조회
        </button>
      </div>
    </div>
  );
};

export default WarehouseInventory;
