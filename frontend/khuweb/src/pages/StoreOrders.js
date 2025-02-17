// frontend/khuweb/src/pages/StoreOrders.js
import React, { useState, useEffect } from 'react';
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

  // ========================
  // Excel 다운로드 함수 (xlsx-js-style 적용)
  // ------------------------
  // 아래는 handleDownloadExcel 함수의 수정본입니다.
  const handleDownloadExcel = () => {
    // 1. 기간 정보 추출 (선택값 또는 ordersData.current_period)
    let year, month, week;
    if (selectedYear && selectedMonth && selectedWeek) {
      year = selectedYear;
      month = selectedMonth.toString().padStart(2, '0');
      week = selectedWeek;
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
  
    // 2. 파일명 생성
    const now = new Date();
    const yyyymmdd = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const filename = `카페쿠피_${year}년_${month}월_${week}주차_발주서_발주서용_(${yyyymmdd}).xlsx`;
  
    // 3. 상단 제목 (병합된 셀; 제목은 맑은 고딕)
    const headerTitle = `카페 쿠피 ${month}월 ${week}주차 발주 취합`;
  
    // 4. 시트에 들어갈 데이터 배열 구성
    //    행0~1: 상단 제목, 행2: 빈행, 행3: 헤더 (번호열 없이 "협력사", "품목명", [매장들], "합계", "확인")
    const ws_data = [];
    ws_data[0] = []; // row 1
    ws_data[1] = []; // row 2
    ws_data[0][0] = headerTitle;
    ws_data[2] = []; // row 3 (빈행)
  
    const headerRow = ["협력사", "품목명"];
    orderedStores.forEach(store => {
      headerRow.push(store.매장명);
    });
    headerRow.push("합계");
    headerRow.push("확인");
    ws_data[3] = headerRow;
    const totalCols = headerRow.length; // 새로 생성된 열 포함
  
    // 5. 데이터 행 (엑셀상의 행번호는 5부터 시작)
    const dataStartRow = 5;
    sortedTableRows.forEach((row, i) => {
      const excelRow = [];
      // A열: 협력사, B열: 품목명
      excelRow[0] = row.supplierName;
      excelRow[1] = row.itemName;
      // C열부터: 각 매장의 발주량 (없으면 빈 값)
      orderedStores.forEach((store, j) => {
        excelRow[2 + j] = row.orders[store.매장_id] || "";
      });
      // "합계" 열 (header의 끝-1)
      const firstStoreColLetter = XLSX.utils.encode_col(2);
      const lastStoreColLetter = XLSX.utils.encode_col(totalCols - 3);
      const excelRowNumber = dataStartRow + i;
      // ★ numFmt 수정: 0이면 "-" (큰따옴표 안의 하이픈) 출력
      excelRow[totalCols - 2] = { f: `SUM(${firstStoreColLetter}${excelRowNumber}:${lastStoreColLetter}${excelRowNumber})`, 
        z: "#,##0;(#,##0);\"-\"" 
      };
      // "확인" 열: 빈칸
      excelRow[totalCols - 1] = "";
      ws_data.push(excelRow);
    });
  
    // 6. 합계 행: A,B열 병합, 나머지 열은 각 열의 합계 수식
    const totalsRow = [];
    totalsRow[0] = "합계";
    totalsRow[1] = "";
    for (let col = 2; col < totalCols - 1; col++) {
      const colLetter = XLSX.utils.encode_col(col);
      totalsRow[col] = { f: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataStartRow + sortedTableRows.length - 1})`, 
        z: "#,##0;(#,##0);\"-\"" 
      };
    }
    totalsRow[totalCols - 1] = ""; // "확인" 열 : 빈칸
    ws_data.push(totalsRow);
  
    // 7. 박스 수량 행 (추가 행)
    //    - A,B열 병합 후 "박스 수량" 텍스트, 수직·수평 가운데 정렬, Arial 12
    //    - C열부터 J열(즉, 열 2~9)는 빈칸
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
    
    // 8. 워크시트 생성 (AOA 방식)
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // 9. 병합 설정
    ws["!merges"] = ws["!merges"] || [];
    // 상단 제목: A1 ~ (마지막 열)까지, 1행~2행 병합
    ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 1, c: totalCols - 1 } });
    // 합계 행: A,B열 병합
    const totalsRowIndex = ws_data.length - 2;
    ws["!merges"].push({ s: { r: totalsRowIndex, c: 0 }, e: { r: totalsRowIndex, c: 1 } });
    // 박스 수량 행: A,B열 병합
    ws["!merges"].push({ s: { r: boxRowIndex, c: 0 }, e: { r: boxRowIndex, c: 1 } });
    
    // 10. 스타일 적용
    
    // (a) 상단 제목: 맑은 고딕, 14, bold, 가운데 정렬 + 외부 테두리 (전체)
    if (ws["A1"]) {
      ws["A1"].s = {
        font: { name: "맑은 고딕", sz: 14, bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        }
      };
    }
    
    // (b) 나머지 셀 기본 폰트: Arial (행 >=2는 Arial 10, 단 헤더와 박스 수량 별도)
    const fullRange = XLSX.utils.decode_range(ws["!ref"]);
    for (let r = fullRange.s.r; r <= fullRange.e.r; r++) {
      for (let c = fullRange.s.c; c <= fullRange.e.c; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellAddr]) continue;
        if (r > 1) {
          ws[cellAddr].s = ws[cellAddr].s || {};
          if (r !== totalsRowIndex && r !== boxRowIndex && r !== 3) {
            ws[cellAddr].s.font = { name: "Arial", sz: 10 };
          }
        }
      }
    }
    
    // (c) 헤더 행 (엑셀 행 4, index 3)
    //    - 협력사 열 (col 0): Arial, 12; 나머지 헤더: Arial, 10; 모두 bold, 가운데 정렬
    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 3, c });
      if (ws[cellAddr]) {
        const fontSize = (c === 0) ? 12 : 10;
        ws[cellAddr].s.font = { name: "Arial", sz: fontSize, bold: true };
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
        // 헤더 전체 외곽에만 굵은 테두리 (내부는 없음)
        ws[cellAddr].s.border = {};
      }
    }
    // 외곽 굵은 테두리 (헤더 전체 블록)
    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 3, c });
      if (ws[cellAddr]) {
        ws[cellAddr].s.border = ws[cellAddr].s.border || {};
        if (c === 0) ws[cellAddr].s.border.left = { style: "thick", color: { rgb: "000000" } };
        if (c === totalCols - 1) ws[cellAddr].s.border.right = { style: "thick", color: { rgb: "000000" } };
        ws[cellAddr].s.border.top = { style: "thick", color: { rgb: "000000" } };
        ws[cellAddr].s.border.bottom = { style: "thick", color: { rgb: "000000" } };
      }
    }
    
    // (d) 데이터 영역 (엑셀 행 5부터 합계 행 전까지)
    //     - 협력사 열 (col 0): Arial, 12; 나머지: Arial, 10; 숫자값은 "#,##0;(#,##0);"-"" 서식 적용
    for (let r = 4; r < totalsRowIndex; r++) {
      for (let c = 0; c < totalCols; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellAddr]) continue;
        ws[cellAddr].s.font = { name: "Arial", sz: (c === 0 ? 12 : 10) };
        if (c >= 2 && c < totalCols - 1) {
          ws[cellAddr].s.numFmt = "#,##0;(#,##0);\"-\"";
        }
        ws[cellAddr].s.border = {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        };
      }
    }
    
    // (e) 합계 행 (마지막 행): 폰트 크기를 10으로 설정, 숫자 서식 동일
    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: totalsRowIndex, c });
      if (!ws[cellAddr]) continue;
      if (c >= 2 && c < totalCols - 1) {
        ws[cellAddr].s.numFmt = "#,##0;(#,##0);\"-\"";
      }
      if (c === 0) {
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
        ws[cellAddr].s.font = { name: "Arial", sz: 10, bold: true };
      }
      ws[cellAddr].s.border = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };
    }
    
    // (f) 박스 수량 행 (추가 행)
    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: boxRowIndex, c });
      if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
      ws[cellAddr].s = ws[cellAddr].s || {};
      if (c < 2) {
        ws[cellAddr].s.font = { name: "Arial", sz: 12, bold: true };
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
      } else {
        ws[cellAddr].s.font = { name: "Arial", sz: 10 };
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
      }
      ws[cellAddr].s.border = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };
    }
    ws["!rows"] = ws["!rows"] || [];
    ws["!rows"][boxRowIndex] = { hpt: 45 };
    
    // (g) 같은 협력사 셀 병합 (열 0) in 데이터 영역 & 병합 그룹 마지막 행에 굵은(thick) 아래쪽 테두리
    let startRowIdx = 4;
    while (startRowIdx < 4 + sortedTableRows.length) {
      const cellAddr = XLSX.utils.encode_cell({ r: startRowIdx, c: 0 });
      const currentSupplier = ws[cellAddr] ? ws[cellAddr].v : "";
      let endRowIdx = startRowIdx;
      while (endRowIdx + 1 < 4 + sortedTableRows.length) {
        const nextCellAddr = XLSX.utils.encode_cell({ r: endRowIdx + 1, c: 0 });
        const nextSupplier = ws[nextCellAddr] ? ws[nextCellAddr].v : "";
        if (nextSupplier === currentSupplier) {
          endRowIdx++;
        } else {
          break;
        }
      }
      if (endRowIdx > startRowIdx) {
        ws["!merges"].push({
          s: { r: startRowIdx, c: 0 },
          e: { r: endRowIdx, c: 0 }
        });
        const mergeAddr = XLSX.utils.encode_cell({ r: startRowIdx, c: 0 });
        if (ws[mergeAddr]) {
          ws[mergeAddr].s.alignment = { horizontal: "center", vertical: "center" };
        }
        for (let col = 0; col < totalCols; col++) {
          const bottomCellAddr = XLSX.utils.encode_cell({ r: endRowIdx, c: col });
          if (ws[bottomCellAddr]) {
            ws[bottomCellAddr].s.border = ws[bottomCellAddr].s.border || {};
            ws[bottomCellAddr].s.border.bottom = { style: "thick", color: { rgb: "000000" } };
          }
        }
      }
      startRowIdx = endRowIdx + 1;
    }
    
    // (h) 매장 열 (헤더 포함, "합계" 행 전까지; 매장 열은 index 2 ~ totalCols-3)
    for (let r = 3; r < totalsRowIndex; r++) {
      for (let c = 2; c < totalCols - 2; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        if (ws[cellAddr]) {
          ws[cellAddr].s.fill = {
            patternType: "solid",
            fgColor: { rgb: "C9C9C9" }
          };
        }
      }
    }
    
    // (i) 각 열의 너비 자동 조절
    const wsRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const colWidths = [];
    for (let col = 0; col < totalCols; col++) {
      let maxLen = 0;
      wsRows.forEach(row => {
        const cellVal = row[col];
        if (cellVal) {
          maxLen = Math.max(maxLen, String(cellVal).length);
        }
      });
      colWidths.push({ wch: maxLen + 10 });
    }
    ws["!cols"] = colWidths;
    
    // 11. 워크북 생성 및 시트 이름 설정
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
        {/* 다운로드 버튼: 수정 버튼 왼쪽에 배치, Item.js의 download-button 클래스 사용 */}
        <button onClick={handleDownloadExcel} className="download-button">
          Excel 다운로드
        </button>
        <button className="edit-button" onClick={handleEditToggle}>
          {isEditMode ? "취소" : "수정"}
        </button>
      </div>
      <hr className="divider" />
      <table className="store-orders-table">
        <thead>
          <tr>
            <th className="so-number-col diagonal-header">{"\\"}</th>
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
