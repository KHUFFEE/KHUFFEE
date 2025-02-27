import React, { useState, useEffect, useRef } from "react";
import {
  fetchItems,
  fetchSuppliers,
  fetchStores,
  fetchStoreInventory,
  // fetchStoreInventory는 사용되지 않고 fetchStoreInventory 대신 API 호출 로직 사용 중
  fetchStoreMonthEndInventory,
  updateStoreMonthEndInventory,
  getTableStatusList,
  updateTableStatus,
} from "../api/api";
import "../styles/StoreInventory.css";
import * as XLSX from "xlsx-js-style";
import LoadingSpinner from "../components/LoadingSpinner";

const StoreInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  // 초기 로드시에는 로딩 스피너가 뜨지 않도록 false로 설정
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 기간 선택 관련 상태
  const [yearMonthOptions, setYearMonthOptions] = useState([]);
  const [selectedYearMonth, setSelectedYearMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  // 매장 선택 상태 (기본 매장은 "ST_103")
  const [selectedStore, setSelectedStore] = useState("");

  // 드롭다운 토글 상태
  const [isYMOpen, setIsYMOpen] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  // API 호출: 기간(YYYY.MM.DD)와 매장_id에 해당하는 매장 재고, 품목, 협력사 데이터를 가져옴
  // manual 인자가 true일 때만 로딩 스피너가 발생
  const fetchData = async (params = {}, manual = false) => {
    try {
      if (manual) setLoading(true);
      const period = params.기간; // 예: "2023.04.05"
      const storeId = params.매장_id;
      const [inventoryRes, itemsRes, suppliersRes] = await Promise.all([
        fetchStoreInventory({ 기간: period, 매장_id: storeId }),
        fetchItems(),
        fetchSuppliers(),
      ]);
      setInventoryData(inventoryRes);
      setItems(itemsRes);
      setSuppliers(suppliersRes);
      if (manual) setLoading(false);
    } catch (err) {
      console.error("매장 재고 데이터 불러오기 실패:", err);
      setError("데이터를 불러오는데 실패하였습니다.");
      if (manual) setLoading(false);
    }
  };

  // 기간 옵션 재갱신 함수 (페이지 로드시와 최신 조회 버튼에서 사용)
  const refreshPeriods = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/inventory/store/?range=first_last`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch period range");
      }
      const periodData = await response.json();
      if (!periodData.earliest_period || !periodData.latest_period) return;
      const parsePeriod = (str) => {
        const parts = str.split(".");
        return new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );
      };
      const minDate = parsePeriod(periodData.earliest_period);
      const maxDate = parsePeriod(periodData.latest_period);
      let current = new Date(maxDate);
      const options = [];
      while (current >= minDate) {
        const y = current.getFullYear();
        const m = (current.getMonth() + 1).toString().padStart(2, "0");
        const ym = `${y}.${m}`;
        options.push(ym);
        current.setMonth(current.getMonth() - 1);
      }
      setYearMonthOptions(options);
      const today = new Date();
      const defaultYM = `${today.getFullYear()}.${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      if (options.includes(defaultYM)) {
        setSelectedYearMonth(defaultYM);
      } else {
        setSelectedYearMonth(options[0]);
      }
      const defaultDay = today.getDate().toString().padStart(2, "0");
      setSelectedDay(defaultDay);
    } catch (err) {
      console.error("Failed to fetch all periods:", err);
    }
  };

  // 페이지 로드시 기간 옵션 설정
  useEffect(() => {
    refreshPeriods();
  }, []);

  // 매장 목록을 fetchStores API로 불러와 기본 선택 설정 (ST_101, ST_102 제외)
  useEffect(() => {
    const fetchAllStores = async () => {
      try {
        const res = await fetchStores();
        const filteredStores = res.filter(
          (store) => store.매장_id !== "ST_101" && store.매장_id !== "ST_102"
        );
        setStores(filteredStores);
        const defaultStore = filteredStores.find(
          (store) => store.매장_id === "ST_103"
        );
        if (defaultStore) {
          setSelectedStore("ST_103");
        } else if (filteredStores.length > 0) {
          setSelectedStore(filteredStores[0].매장_id);
        }
      } catch (err) {
        console.error("매장 데이터를 불러오는데 실패했습니다:", err);
      }
    };
    fetchAllStores();
  }, []);

  // 기본 일(day)값 설정 (오늘 날짜)
  useEffect(() => {
    const today = new Date();
    const defaultDay = today.getDate().toString().padStart(2, "0");
    setSelectedDay(defaultDay);
  }, []);

  // 사용자가 기간(년월, 일) 또는 매장을 변경하면 바로 API 호출 (manual=false)
  useEffect(() => {
    if (selectedYearMonth && selectedDay && selectedStore) {
      const [year, month] = selectedYearMonth.split(".");
      const period = `${year}.${month}.${selectedDay}`;
      fetchData({ 기간: period, 매장_id: selectedStore }, false);
    }
  }, [selectedYearMonth, selectedDay, selectedStore]);

  // 선택된 년월에 따른 일(day) 옵션 생성
  const [year, month] = selectedYearMonth.split(".");
  const daysInMonth =
    year && month ? new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate() : 31;
  const dayOptions = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dayOptions.push(d.toString().padStart(2, "0"));
  }

  // "최신 조회" 버튼: 매장은 유지하고 기간을 최신으로 갱신하여 데이터 조회 (manual=true)
  const handleReset = async (manual = false) => {
    await refreshPeriods();
    // 매장은 유지
    // 최신 조회 시, 최신 기간 옵션을 가져와 API 호출
    if (yearMonthOptions.length > 0) {
      // 최신 기간은 yearMonthOptions의 첫번째 (내림차순 정렬되어 있다고 가정)
      const latest = [...yearMonthOptions].sort((a, b) => {
        const [yA, mA] = a.split(".").map(Number);
        const [yB, mB] = b.split(".").map(Number);
        if (yA !== yB) return yB - yA;
        return mB - mA;
      })[0];
      fetchData({ 기간: latest }, manual);
    } else {
      fetchData({ page: 1 }, manual);
    }
  };

  // ===== 수정된 부분: LoadingSpinner를 사용하여 최신 조회 버튼 클릭 시만 로딩 동작 발생 =====
  // 최신 조회 버튼 onClick에서는 handleReset(true)를 호출합니다.
  // 나머지 fetchData 호출에서는 manual=false를 전달하여 로딩 스피너를 표시하지 않습니다.
  // ==========================================================================================

  // ===== 이하 품목 기반 테이블 생성 로직 =====
  // 재고 데이터를 품목_id별로 그룹화 (매장_재고량 합산)
  const groupedInventory = {};
  inventoryData.forEach((record) => {
    const itemId = record.품목_id;
    groupedInventory[itemId] = (groupedInventory[itemId] || 0) + Number(record.매장_재고량);
  });

  // 품목 데이터를 기준으로 테이블 행 생성
  const tableRows = items.map((item) => {
    const supplier = suppliers.find((s) => s.협력사_id === item.협력사_id) || {};
    return {
      itemId: item.품목_id,
      supplierName: supplier.협력사명 || "N/A",
      itemName: item.품목명 || "N/A",
      type: item.종류 || "",
      inventory: groupedInventory[item.품목_id] || 0,
      unitPrice: item ? Number(item.입고단가) : 0,
    };
  });

  // 협력사 → 종류 → 품목명 오름차순 정렬
  tableRows.sort((a, b) => {
    const cmpSupplier = a.supplierName.localeCompare(b.supplierName);
    if (cmpSupplier !== 0) return cmpSupplier;
    const cmpType = a.type.localeCompare(b.type);
    if (cmpType !== 0) return cmpType;
    return a.itemName.localeCompare(b.itemName);
  });
  // ====================================================================

  const formatNumber = (num) => {
    if (num === "" || num === undefined || num === null || Number(num) === 0)
      return "-";
    return Number(num).toLocaleString();
  };

  // 헬퍼: "YYYY.MM" → "YYYY년 MM월" 변환
  const formatYMLabel = (ymStr) => {
    const [y, m] = ymStr.split(".");
    return `${y}년 ${m}월`;
  };

  // 엑셀 다운로드 함수 (동작은 그대로 유지)
  const handleExcelDownload = () => {
    const [year, month] = selectedYearMonth.split(".");
    const day = selectedDay;
    const storeObj = stores.find((s) => s.매장_id === selectedStore);
    const storeName = storeObj ? storeObj.매장명 : "매장";
    
    const now = new Date();
    const yyyyNow = now.getFullYear();
    const mmNow = (now.getMonth() + 1).toString().padStart(2, "0");
    const ddNow = now.getDate().toString().padStart(2, "0");
    const currentDateStr = `${yyyyNow}${mmNow}${ddNow}`;
    
    const filename = `카페쿠피_${year}년_${month}월_${day}일_${storeName}_매장재고_관리자용_(${currentDateStr}).xlsx`;
    const sheetName = `${month}월 ${day}일 ${storeName} 재고`;
    const headerTitle = `카페 쿠피 ${month}월 ${day}일 ${storeName} 재고`;
  
    const data = tableRows.map((row) => ({
      "협력사": row.supplierName,
      "품목명": row.itemName,
      "재고량": row.inventory,
      "재고 금액": row.inventory * row.unitPrice,
    }));
  
    const headers = ["협력사", "품목명", "재고량", "재고 금액"];
    const ws = XLSX.utils.json_to_sheet(data, {
      header: headers,
      origin: "A4",
    });
  
    ws["!merges"] = ws["!merges"] || [];
    const titleMerge = { s: { r: 0, c: 0 }, e: { r: 1, c: headers.length - 1 } };
    ws["!merges"].push(titleMerge);
    ws["A1"] = {
      v: headerTitle,
      t: "s",
      s: {
        font: { name: "맑은 고딕", sz: 14, bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
          left: { style: "medium", color: { rgb: "000000" } },
          right: { style: "medium", color: { rgb: "000000" } },
        },
      },
    };
  
    for (let r = titleMerge.s.r; r <= titleMerge.e.r; r++) {
      for (let c = titleMerge.s.c; c <= titleMerge.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (addr === "A1") continue;
        if (!ws[addr]) ws[addr] = { t: "s", v: "" };
        if (!ws[addr].s) ws[addr].s = {};
        ws[addr].s.border = {
          top: r === titleMerge.s.r ? { style: "medium", color: { rgb: "000000" } } : undefined,
          bottom: r === titleMerge.e.r ? { style: "medium", color: { rgb: "000000" } } : undefined,
          left: c === titleMerge.s.c ? { style: "medium", color: { rgb: "000000" } } : undefined,
          right: c === titleMerge.e.c ? { style: "medium", color: { rgb: "000000" } } : undefined,
        };
      }
    }
  
    for (let i = 0; i < headers.length; i++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 3, c: i });
      if (ws[cellAddr]) {
        ws[cellAddr].s = ws[cellAddr].s || {};
        ws[cellAddr].s.font = { name: "Arial", bold: true };
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
        const borderObj = {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
        };
        if (i === 0) borderObj.left = { style: "medium", color: { rgb: "000000" } };
        if (i === headers.length - 1) borderObj.right = { style: "medium", color: { rgb: "000000" } };
        ws[cellAddr].s.border = borderObj;
      }
    }
  
    for (let cell in ws) {
      if (cell[0] === "!") continue;
      if (cell === "A1") continue;
      ws[cell].s = ws[cell].s || {};
      const existingFont = ws[cell].s.font || {};
      ws[cell].s.font = { ...existingFont, name: "Arial" };
    }
  
    const allRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const colWidths = [];
    if (allRows && allRows.length > 0) {
      const numCols = Math.max(...allRows.map((r) => r.length));
      for (let col = 0; col < numCols; col++) {
        let maxLen = 0;
        allRows.forEach((row) => {
          const cellVal = row[col];
          if (cellVal) {
            maxLen = Math.max(maxLen, String(cellVal).length);
          }
        });
        colWidths.push({ wch: maxLen + 10 });
      }
    }
    ws["!cols"] = colWidths;
  
    if (ws["!ref"]) {
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cellAddr = XLSX.utils.encode_cell({ r, c });
          if (!ws[cellAddr]) continue;
          let borderObj = ws[cellAddr].s.border || {};
          if (r === range.s.r) {
            borderObj.top = { style: "medium", color: { rgb: "000000" } };
          }
          if (r === range.e.r) {
            borderObj.bottom = { style: "medium", color: { rgb: "000000" } };
          }
          if (c === range.s.c) {
            borderObj.left = { style: "medium", color: { rgb: "000000" } };
          }
          if (c === range.e.c) {
            borderObj.right = { style: "medium", color: { rgb: "000000" } };
          }
          ws[cellAddr].s.border = borderObj;
        }
      }
    }
  
    if (ws["!ref"]) {
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let r = 4; r <= range.e.r; r++) {
        const qtyCellAddr = XLSX.utils.encode_cell({ r, c: 2 });
        if (ws[qtyCellAddr]) {
          ws[qtyCellAddr].t = "n";
          ws[qtyCellAddr].z = "#,##0";
        }
        const amtCellAddr = XLSX.utils.encode_cell({ r, c: 3 });
        if (ws[amtCellAddr]) {
          ws[amtCellAddr].t = "n";
          ws[amtCellAddr].z = "#,##0";
          ws[amtCellAddr].s = ws[amtCellAddr].s || {};
          ws[amtCellAddr].s.alignment = { horizontal: "right", vertical: "center" };
        }
      }
    }
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div>{error}</div>;

  return (
    <div className="si-container">
      <h2 className="title">매장 일별 재고 조회</h2>
      <div className="period-controls">
        <div className="period-search">
          {/* 매장 선택 */}
          <div className="period-select-box">
            <div className="select-display">
              {selectedStore
                ? stores.find((s) => s.매장_id === selectedStore)?.매장명 ||
                  "매장 선택"
                : "매장 선택"}
            </div>
            <select
              className="custom-select"
              value={selectedStore}
              onChange={(e) => {
                setSelectedStore(e.target.value);
                setIsStoreOpen(false);
              }}
              onFocus={() => setIsStoreOpen(true)}
              onBlur={() => setIsStoreOpen(false)}
            >
              {stores.map((store) => (
                <option key={store.매장_id} value={store.매장_id}>
                  {store.매장명}
                </option>
              ))}
            </select>
            <span className="toggle">
              <svg width="24" height="24" viewBox="0 0 22 22">
                <path
                  d="M7 10l5 5 5-5z"
                  fill="#8B0000"
                  transform={isStoreOpen ? "rotate(180 11 11)" : ""}
                />
              </svg>
            </span>
          </div>
          {/* 년/월 선택 */}
          <div className="period-select-box">
            <div className="select-display">
              {selectedYearMonth ? formatYMLabel(selectedYearMonth) : "년월 선택"}
            </div>
            <select
              className="custom-select"
              value={selectedYearMonth}
              onChange={(e) => {
                setSelectedYearMonth(e.target.value);
                setIsYMOpen(false);
              }}
              onFocus={() => setIsYMOpen(true)}
              onBlur={() => setIsYMOpen(false)}
            >
              {yearMonthOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {formatYMLabel(opt)}
                </option>
              ))}
            </select>
            <span className="toggle">
              <svg width="24" height="24" viewBox="0 0 22 22">
                <path
                  d="M7 10l5 5 5-5z"
                  fill="#8B0000"
                  transform={isYMOpen ? "rotate(180 11 11)" : ""}
                />
              </svg>
            </span>
          </div>
          {/* 일(day) 선택 */}
          <div className="period-select-box">
            <div className="select-display">{selectedDay}일</div>
            <select
              className="custom-select"
              value={selectedDay}
              onChange={(e) => {
                setSelectedDay(e.target.value);
                setIsDayOpen(false);
              }}
              onFocus={() => setIsDayOpen(true)}
              onBlur={() => setIsDayOpen(false)}
            >
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}일
                </option>
              ))}
            </select>
            <span className="toggle">
              <svg width="24" height="24" viewBox="0 0 22 22">
                <path
                  d="M7 10l5 5 5-5z"
                  fill="#8B0000"
                  transform={isDayOpen ? "rotate(180 11 11)" : ""}
                />
              </svg>
            </span>
          </div>
          {/* 최신 조회 버튼: onClick에서 handleReset(true) 호출 */}
          <button className="reset-button" onClick={() => handleReset(true)}>
            최신 조회
          </button>
        </div>
        <div className="warehouse-action-buttons">
          <button onClick={handleExcelDownload} className="download-button">
            Excel 다운로드
          </button>
        </div>
      </div>
      <hr className="divider" />
      <table className="si-table">
        <thead>
          <tr>
            <th className="si-number-col">No.</th>
            <th className="si-supplier-col">협력사</th>
            <th className="si-item-col">품목명</th>
            <th className="si-sum-col">재고량</th>
            <th className="si-cost-col">재고 금액</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, index) => (
            <tr key={row.itemId}>
              <td className="si-number-col">{index + 1}</td>
              <td className="si-supplier-col">
                <div className="supplier-cell">{row.supplierName}</div>
              </td>
              <td className="si-item-col">
                <div className="item-cell">{row.itemName}</div>
              </td>
              <td className="si-sum-col">{formatNumber(row.inventory)}</td>
              <td className="si-cost-col">
                {formatNumber(row.inventory * row.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StoreInventory;
