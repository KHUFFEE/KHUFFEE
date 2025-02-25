import React, { useState, useEffect } from "react";
import { fetchWarehouseInventory, fetchItems, fetchSuppliers } from "../api/api";
import "../styles/WarehouseInventory.css";
import * as XLSX from "xlsx-js-style";

const WarehouseInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 년/월 옵션: 전체 재고 데이터에서 기간 필드를 이용하여 "YYYY.MM" 형식 옵션 생성
  const [yearMonthOptions, setYearMonthOptions] = useState([]);
  const [selectedYearMonth, setSelectedYearMonth] = useState("");
  // 선택된 일 (예: "05")
  const [selectedDay, setSelectedDay] = useState("");

  // 토글 open 상태 (각 드롭다운 별도 관리)
  const [isYMOpen, setIsYMOpen] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);

  // API 호출: "YYYY.MM.DD" 형식의 기간을 전달하여 창고 재고, 품목, 협력사 데이터를 가져옴
  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const period = params.기간; // 예: "2023.04.05"
      const [inventoryRes, itemsRes, suppliersRes] = await Promise.all([
        fetchWarehouseInventory({ 기간: period }),
        fetchItems(),
        fetchSuppliers(),
      ]);
      setInventoryData(inventoryRes);
      setItems(itemsRes);
      setSuppliers(suppliersRes);
      setLoading(false);
    } catch (err) {
      console.error("창고 재고 데이터 불러오기 실패:", err);
      setError("데이터를 불러오는데 실패하였습니다.");
      setLoading(false);
    }
  };

  // 기간 옵션 재갱신 함수 (페이지 로드시와 최신 조회 버튼에서 사용)
  const refreshPeriods = async () => {
    try {
      const res = await fetchWarehouseInventory({}); // 기간 필터 없이 전체 조회
      const allPeriods = res.map(record => record.기간);
      if (allPeriods.length === 0) return;
      const dateObjs = allPeriods.map(period => {
        const parts = period.split(".");
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      });
      const minDate = new Date(Math.min(...dateObjs));
      const maxDate = new Date(Math.max(...dateObjs));
      // maxDate부터 minDate까지의 "YYYY.MM" 값 내림차순으로 생성
      let current = new Date(maxDate);
      const options = [];
      while (current >= minDate) {
        const y = current.getFullYear();
        const m = (current.getMonth() + 1).toString().padStart(2, "0");
        const ym = `${y}.${m}`;
        if (!options.includes(ym)) {
          options.push(ym);
        }
        current.setMonth(current.getMonth() - 1);
      }
      setYearMonthOptions(options);
      // 기본 선택: 오늘의 연월이 옵션에 있으면 사용, 아니면 최신 옵션(맨 앞)
      const today = new Date();
      const defaultYM = `${today.getFullYear()}.${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      if (options.includes(defaultYM)) {
        setSelectedYearMonth(defaultYM);
      } else {
        setSelectedYearMonth(options[0]);
      }
    } catch (err) {
      console.error("Failed to fetch all periods:", err);
    }
  };

  // 페이지 로드시 기간 옵션 설정
  useEffect(() => {
    refreshPeriods();
  }, []);

  // 기본: 오늘 날짜를 이용하여 기본 일(day)값 설정
  useEffect(() => {
    const today = new Date();
    const defaultDay = today.getDate().toString().padStart(2, "0");
    setSelectedDay(defaultDay);
  }, []);

  // 사용자가 년월 또는 일을 변경하면 바로 API 호출
  useEffect(() => {
    if (selectedYearMonth && selectedDay) {
      const [year, month] = selectedYearMonth.split(".");
      const period = `${year}.${month}.${selectedDay}`;
      fetchData({ 기간: period });
    }
  }, [selectedYearMonth, selectedDay]);

  // 선택된 년월에 따른 일(day) 옵션 생성 (해당 월의 총 일수)
  const [year, month] = selectedYearMonth.split(".");
  const daysInMonth = year && month ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31;
  const dayOptions = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dayOptions.push(d.toString().padStart(2, "0"));
  }

  // "최신 조회" 버튼: 오늘 날짜(또는 옵션에서 최신값)으로 리셋하고, 페이지 로드 시와 같이 기간 옵션을 재갱신
  const handleReset = async () => {
    await refreshPeriods();
    const today = new Date();
    const defaultDay = today.getDate().toString().padStart(2, "0");
    setSelectedDay(defaultDay);
  };

  // ===== 수정된 부분: 품목명을 API를 통해 먼저 불러오고 재고량을 붙이는 원리 적용 =====
  // 창고 재고 데이터를 품목별로 그룹화 (품목_id 기준)
  const groupedInventory = {};
  inventoryData.forEach((record) => {
    const itemId = record.품목_id;
    groupedInventory[itemId] = (groupedInventory[itemId] || 0) + Number(record.창고_재고량);
  });

  // 각 품목별 행 생성: 품목, 협력사, 종류, 입고 단가 포함  
  // → items 배열을 순회하여 품목 정보를 먼저 가져오고, 해당 품목의 재고량은 groupedInventory에서 조회
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
  // ============================================================================

  const formatNumber = (num) => {
    if (num === "" || num === undefined || num === null || Number(num) === 0)
      return "-";
    return Number(num).toLocaleString();
  };

  // 헬퍼: "YYYY.MM" → "YYYY년 MM월"
  const formatYMLabel = (ymStr) => {
    const [y, m] = ymStr.split(".");
    return `${y}년 ${m}월`;
  };

  const handleExcelDownload = () => {
    // 1. 선택한 기간 정보 추출 (selectedYearMonth는 "YYYY.MM" 형식, selectedDay는 "DD")
    const [year, month] = selectedYearMonth.split(".");
    const day = selectedDay; // 이미 2자리 문자열로 되어 있음
  
    // 2. 현재 날짜를 이용해 괄호 안에 들어갈 날짜 문자열 생성 (예: 20250219)
    const now = new Date();
    const yyyyNow = now.getFullYear();
    const mmNow = (now.getMonth() + 1).toString().padStart(2, "0");
    const ddNow = now.getDate().toString().padStart(2, "0");
    const currentDateStr = `${yyyyNow}${mmNow}${ddNow}`;
  
    // 3. 파일명 생성: 예) 카페쿠피_2025년_02월_15일_창고재고_관리자용_(20250219).xlsx
    const filename = `카페쿠피_${year}년_${month}월_${day}일_창고재고_관리자용_(${currentDateStr}).xlsx`;
  
    // 4. 시트명과 상단 제목에 선택한 기간 정보 적용
    const sheetName = `${month}월 ${day}일 창고 재고`;
    const headerTitle = `카페 쿠피 ${month}월 ${day}일 창고 재고`;
  
    // 5. Excel에 저장할 데이터 준비 (tableRows를 사용)
    // 재고량과 재고 금액은 숫자로 저장되어 Excel에서 숫자 포맷 적용이 가능하도록 함.
    const data = tableRows.map((row) => ({
      "협력사": row.supplierName,
      "품목명": row.itemName,
      "재고량": row.inventory,
      "재고 금액": row.inventory * row.unitPrice,
    }));
  
    // 6. 워크시트 생성 (데이터는 A4부터 시작: 4행부터 헤더+데이터)
    const headers = ["협력사", "품목명", "재고량", "재고 금액"];
    const ws = XLSX.utils.json_to_sheet(data, {
      header: headers,
      origin: "A4",
    });
  
    // 7. 상단 제목 영역 설정 및 병합 (A1 ~ D2)
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
        ws[addr].s = ws[addr].s || {};
        ws[addr].s.border = {
          top: r === titleMerge.s.r ? { style: "medium", color: { rgb: "000000" } } : undefined,
          bottom: r === titleMerge.e.r ? { style: "medium", color: { rgb: "000000" } } : undefined,
          left: c === titleMerge.s.c ? { style: "medium", color: { rgb: "000000" } } : undefined,
          right: c === titleMerge.e.c ? { style: "medium", color: { rgb: "000000" } } : undefined,
        };
      }
    }
  
    // 8. 헤더 행(4행; 0-indexed row 3) 스타일 적용
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
  
    // 9. 나머지 셀에 기본 Arial 폰트 적용
    for (let cell in ws) {
      if (cell[0] === "!") continue;
      if (cell === "A1") continue;
      ws[cell].s = ws[cell].s || {};
      const existingFont = ws[cell].s.font || {};
      ws[cell].s.font = { ...existingFont, name: "Arial" };
    }
  
    // 10. 각 열의 너비 조정
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
  
    // 11. 전체 테이블 영역에 외부 테두리 적용
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
  
    // 12. "재고량" (세번째 열, index 2)와 "재고 금액" (네번째 열, index 3)에 숫자 형식 및 오른쪽 정렬 적용
    if (ws["!ref"]) {
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let r = 4; r <= range.e.r; r++) {
        // 재고량: 열 인덱스 2
        const qtyCellAddr = XLSX.utils.encode_cell({ r, c: 2 });
        if (ws[qtyCellAddr]) {
          ws[qtyCellAddr].t = "n";
          ws[qtyCellAddr].z = "#,##0";
        }
        // 재고 금액: 열 인덱스 3
        const amtCellAddr = XLSX.utils.encode_cell({ r, c: 3 });
        if (ws[amtCellAddr]) {
          ws[amtCellAddr].t = "n";
          ws[amtCellAddr].z = "#,##0";
          ws[amtCellAddr].s = ws[amtCellAddr].s || {};
          ws[amtCellAddr].s.alignment = { horizontal: "right", vertical: "center" };
        }
      }
    }
  
    // 13. 워크북 생성 및 저장 (시트명에 선택한 기간 적용)
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="wi-container">
      <h2 className="title">창고 재고 조회</h2>
      <div className="period-controls">
        <div className="period-search">
          {/* 년월 선택 버튼 */}
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
          {/* 일(day) 선택 버튼 */}
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
          <button className="reset-button" onClick={handleReset}>
            최신 조회
          </button>
        </div>
        {/* 다운로드 버튼은 오른쪽 끝에 위치 */}
        <div className="warehouse-action-buttons">
          <button onClick={handleExcelDownload} className="download-button">
            Excel 다운로드
          </button>
        </div>
      </div>
      <hr className="divider" />
      <table className="wi-table">
        <thead>
          <tr>
            <th className="wi-number-col">No.</th>
            <th className="wi-supplier-col">협력사</th>
            <th className="wi-item-col">품목명</th>
            <th className="wi-sum-col">재고량</th>
            <th className="wi-cost-col">재고 금액</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, index) => (
            <tr key={row.itemId}>
              <td className="wi-number-col">{index + 1}</td>
              <td className="wi-supplier-col">
                <div className="supplier-cell">{row.supplierName}</div>
              </td>
              <td className="wi-item-col">
                <div className="item-cell">{row.itemName}</div>
              </td>
              <td className="wi-sum-col">{formatNumber(row.inventory)}</td>
              <td className="wi-cost-col">
                {formatNumber(row.inventory * row.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WarehouseInventory;
