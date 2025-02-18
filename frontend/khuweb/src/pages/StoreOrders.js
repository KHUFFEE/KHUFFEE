// frontend/khuweb/src/pages/StoreOrders.js
import React, { useState, useEffect, useRef } from 'react';
import { fetchOrders, fetchItems, fetchSuppliers, fetchStores, updateStoreOrder } from '../api/api';
import '../styles/StoreOrders.css';
import * as XLSX from "xlsx-js-style";

const StoreOrders = () => {
  const [ordersData, setOrdersData] = useState(null); // API로부터 받은 주문 데이터
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 기간 선택 (단일 선택값: "YYYY.MM.W")
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');

  // 토글에 따른 전체 입력 상태 (현재 사용 안함)
  const [isFreeInput] = useState(false);
  const [freePeriod, setFreePeriod] = useState("");

  // 드롭다운용 옵션 생성
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y);
  }
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const weeks = [1, 2, 3, 4, 5];

  // 모든 조합 옵션 생성 (예: { value: "2024.04.2", label: "2024년 4월 2주차" })
  const generatePeriodOptions = () => {
    const options = [];
    years.forEach(year => {
      months.forEach(month => {
        weeks.forEach(week => {
          const formattedMonth = month.toString().padStart(2, '0');
          const value = `${year}.${formattedMonth}.${week}`;
          const label = `${year}년 ${month}월 ${week}주차`;
          options.push({ value, label });
        });
      });
    });
    return options;
  };

  // 원하는 매장명 순서
  const desiredStoreOrder = [
    "푸른솔",
    "의과대학",
    "중앙도서관",
    "학생회관",
    "예술디자인대",
    "선승관",
    "공학관",
    "멀티미디어관",
    "제2기숙사",
  ];

  // 수정 모드 관련 상태
  const [isEditMode, setIsEditMode] = useState(false);
  // editedOrders: { [itemId]: { [storeId]: newValue, ... } }
  const [editedOrders, setEditedOrders] = useState({});

  // 드롭다운 open 상태 (select의 focus/blur로 제어)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef(null);

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

  // ordersData.current_period 값이 있으면 해당 기간을 초기 선택값으로 설정
  useEffect(() => {
    if (ordersData && ordersData.current_period) {
      const parts = ordersData.current_period.split('.');
      setSelectedYear(parts[0]);
      setSelectedMonth(parts[1]);
      setSelectedWeek(parts[2]);
    }
  }, [ordersData]);

  // displayPeriod 계산 함수 (개별 선택, 전체 입력, API 기본값)
  const getDisplayPeriod = () => {
    if (isFreeInput) {
      return freePeriod
        ? freePeriod.split('.').length === 3
          ? `${freePeriod.split('.')[0]}년 ${Number(freePeriod.split('.')[1])}월 ${freePeriod.split('.')[2]}주차`
          : freePeriod
        : "";
    } else if (selectedYear && selectedMonth && selectedWeek) {
      return `${selectedYear}년 ${Number(selectedMonth)}월 ${selectedWeek}주차`;
    } else if (ordersData && ordersData.current_period) {
      const parts = ordersData.current_period.split('.');
      return `${parts[0]}년 ${Number(parts[1])}월 ${parts[2]}주차`;
    }
    return "";
  };

  const displayPeriod = getDisplayPeriod();

  const handleSearch = () => {
    if (isFreeInput) {
      if (!freePeriod) {
        alert("기간을 입력해주세요. (예: 2024.04.2)");
        return;
      }
      fetchData({ 기간: freePeriod });
    } else {
      if (!selectedYear || !selectedMonth || !selectedWeek) {
        alert("년도, 월, 주차를 모두 선택해주세요.");
        return;
      }
      const formattedMonth = selectedMonth.toString().padStart(2, '0');
      const period = `${selectedYear}.${formattedMonth}.${selectedWeek}`;
      fetchData({ 기간: period });
    }
  };

  const handleReset = () => {
    // 초기값은 빈값 대신 ordersData.current_period가 있다면 해당값을 유지하도록 함
    if (ordersData && ordersData.current_period) {
      const parts = ordersData.current_period.split('.');
      setSelectedYear(parts[0]);
      setSelectedMonth(parts[1]);
      setSelectedWeek(parts[2]);
    } else {
      setSelectedYear('');
      setSelectedMonth('');
      setSelectedWeek('');
    }
    setFreePeriod('');
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

  // 각 행의 합계 계산 (매장 발주량 합)
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
          // 기존 주문과 변경이 없으면 생략
          const originalVal = tableRows.find(row => row.itemId === itemId)?.orders[storeId];
          if (newValue === "" || Number(newValue) === 0) {
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
      fetchData({ 기간: ordersData.current_period });
      setIsEditMode(false);
    } catch (err) {
      console.error("주문 수정 실패:", err);
      alert("주문 수정에 실패하였습니다.");
    }
  };

  // ─────────────────────────────────────────────
  // 매장 헤더 표시를 위한 포맷 함수 (UI에서는 <br />를 사용하여 줄바꿈 처리)
  const formatStoreName = (name) => {
    switch(name) {
      case "중앙도서관":
        return <>중앙<br />도서관</>;
      case "예술디자인대":
        return <>예술<br />디자인대</>;
      case "멀티미디어관":
        return <>멀티<br />미디어관</>;
      case "제2기숙사":
        return <>제2<br />기숙사</>;
      default:
        return name;
    }
  };

  // Excel 다운로드용 포맷 함수 (줄바꿈 문자는 \n)
  const formatStoreNameForExcel = (name) => {
    switch(name) {
      case "중앙도서관":
        return "중앙\n도서관";
      case "예술디자인대":
        return "예술\n디자인대";
      case "멀티미디어관":
        return "멀티\n미디어관";
      case "제2기숙사":
        return "제2\n기숙사";
      default:
        return name;
    }
  };
  // ─────────────────────────────────────────────

  // Excel 다운로드 함수 (xlsx-js-style 적용)
  const handleDownloadExcel = () => {
    let year, month, week;
    if (selectedYear && selectedMonth && selectedWeek && !isFreeInput) {
      year = selectedYear;
      month = selectedMonth.toString().padStart(2, '0');
      week = selectedWeek;
    } else if (isFreeInput && freePeriod) {
      const parts = freePeriod.split('.');
      year = parts[0];
      month = parts[1];
      week = parts[2];
    } else if (ordersData && ordersData.current_period) {
      const parts = ordersData.current_period.split('.');
      year = parts[0];
      month = parts[1];
      week = parts[2];
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = (now.getMonth() + 1).toString().padStart(2, '0');
      week = '1';
    }
  
    const now = new Date();
    const yyyymmdd = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const filename = `카페쿠피_${year}년_${month}월_${week}주차_발주서_발주서용_(${yyyymmdd}).xlsx`;
    const headerTitle = `카페 쿠피 ${month}월 ${week}주차 발주 취합`;
  
    const ws_data = [];
    ws_data[0] = []; // row 1
    ws_data[1] = []; // row 2
    ws_data[0][0] = headerTitle;
    ws_data[2] = []; // row 3 (빈행)
  
    const headerRow = ["협력사", "품목명"];
    orderedStores.forEach(store => {
      headerRow.push(formatStoreNameForExcel(store.매장명));
    });
    headerRow.push("합계");
    headerRow.push("확인");
    ws_data[3] = headerRow;
    const totalCols = headerRow.length;
  
    const dataStartRow = 5;
    sortedTableRows.forEach((row, i) => {
      const excelRow = [];
      excelRow[0] = row.supplierName;
      excelRow[1] = row.itemName;
      orderedStores.forEach((store, j) => {
        excelRow[2 + j] = row.orders[store.매장_id] || "";
      });
      const firstStoreColLetter = XLSX.utils.encode_col(2);
      const lastStoreColLetter = XLSX.utils.encode_col(totalCols - 3);
      const excelRowNumber = dataStartRow + i;
      excelRow[totalCols - 2] = { 
        f: `SUM(${firstStoreColLetter}${excelRowNumber}:${lastStoreColLetter}${excelRowNumber})`, 
        z: "#,##0;(#,##0);\"-\"" 
      };
      excelRow[totalCols - 1] = "";
      ws_data.push(excelRow);
    });
  
    const totalsRow = [];
    totalsRow[0] = "합계";
    totalsRow[1] = "";
    for (let col = 2; col < totalCols - 1; col++) {
      const colLetter = XLSX.utils.encode_col(col);
      totalsRow[col] = { 
        f: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataStartRow + sortedTableRows.length - 1})`, 
        z: "#,##0;(#,##0);\"-\"" 
      };
    }
    totalsRow[totalCols - 1] = "";
    ws_data.push(totalsRow);
  
    const boxRow = [];
    boxRow[0] = "박스 수량";
    boxRow[1] = "";
    for (let i = 2; i < 10; i++) {
      boxRow[i] = "";
    }
    for (let i = 10; i < totalCols; i++) {
      boxRow[i] = "";
    }
    ws_data.push(boxRow);
    const boxRowIndex = ws_data.length - 1;
  
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws["!merges"] = ws["!merges"] || [];
    ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 1, c: totalCols - 1 } });
    const totalsRowIndex = ws_data.length - 2;
    ws["!merges"].push({ s: { r: totalsRowIndex, c: 0 }, e: { r: totalsRowIndex, c: 1 } });
    ws["!merges"].push({ s: { r: boxRowIndex, c: 0 }, e: { r: boxRowIndex, c: 1 } });
  
    // 스타일 적용 (생략 – 기존 코드와 동일)
    // ... (중략)
  
    // 행/열 숨기기
    for (let i = 0; i < sortedTableRows.length; i++) {
      if (getRowSum(sortedTableRows[i]) === 0) {
        const rowIndex = dataStartRow + i - 1;
        ws["!rows"] = ws["!rows"] || [];
        ws["!rows"][rowIndex] = { hidden: true };
      }
    }
    for (let i = 0; i < orderedStores.length; i++) {
      if (storeTotals[i] === 0) {
        const colIndex = 2 + i;
        ws["!cols"] = ws["!cols"] || [];
        ws["!cols"][colIndex] = ws["!cols"][colIndex] || {};
        ws["!cols"][colIndex].hidden = true;
      }
    }
  
    const wb = XLSX.utils.book_new();
    const sheetName = `${month}월 ${week}주차 발주`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  };
  
  // ========================
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  
  return (
    <div className="store-orders-container">
      <h2 className="title">발주 취합서</h2>
      <div className="period-controls">
        <div className="period-search">
          {/* 전체 박스 클릭 시 select에 포커스하도록 onClick 추가 */}
          <div 
            className="period-select-box"
            onClick={() => { if (selectRef.current) selectRef.current.focus(); }}
          >
            <div className="select-display">{displayPeriod}</div>
            <select
              ref={selectRef}
              value={`${selectedYear}.${selectedMonth}.${selectedWeek}`}
              onChange={(e) => {
                const [year, month, week] = e.target.value.split('.');
                setSelectedYear(year);
                setSelectedMonth(month);
                setSelectedWeek(week);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setIsDropdownOpen(false)}
              className="custom-select"
            >
              {generatePeriodOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span 
              className="toggle"
              onClick={(e) => {
                // prevent 이벤트 전파하여 container onClick도 실행
                e.stopPropagation();
                if (selectRef.current) selectRef.current.focus();
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path 
                  d="M7 10l5 5 5-5z" 
                  fill="#8B0000" 
                  transform={isDropdownOpen ? "rotate(180 12 12)" : ""}
                />
              </svg>
            </span>
          </div>
          <button className="search-button" onClick={handleSearch}>검색</button>
          <button className="reset-button" onClick={handleReset}>최신 조회</button>
        </div>
        <div className="store-action-buttons">
          <button onClick={handleDownloadExcel} className="download-button">
            Excel 다운로드
          </button>
          <button className="edit-button" onClick={handleEditToggle}>
            {isEditMode ? "취소" : "수정"}
          </button>
        </div>
      </div>
      <hr className="divider" />
      <table className="store-orders-table">
        <thead>
          <tr>
            <th className="so-number-col diagonal-header"></th>
            <th className="so-supplier-col">협력사</th>
            <th className="so-item-col">품목명</th>
            {orderedStores.map(store => (
              <th key={store.매장_id} className="so-order-col">
                {formatStoreName(store.매장명)}
              </th>
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
