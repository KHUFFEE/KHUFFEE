import React, { useState, useEffect, useCallback  } from "react";
import {
  fetchWarehouseInventory,
  fetchItems,
  fetchSuppliers
} from "../api/api";
import "../styles/WarehouseInventory.css";
import "../styles/table.css";
import LoadingSpinner from "../components/LoadingSpinner";
import { warehouseInventoryDownloadExcel } from "../utils/WarehouseInventoryDownloadExcel";

const WarehouseInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 년/월 옵션: 전체 재고 데이터에서 기간 필드를 이용하여 "YYYY.MM" 형식 옵션 생성
  const [yearMonthOptions, setYearMonthOptions] = useState([]);
  const [selectedYearMonth, setSelectedYearMonth] = useState("");
  // 선택된 일 (예: "05")
  const [selectedDay, setSelectedDay] = useState("");

  // 매장 선택 상태: 무조건 "ST_102"
  const [selectedStore, setSelectedStore] = useState("ST_102");

  // 드롭다운 토글 상태
  const [isYMOpen, setIsYMOpen] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);

  // API 호출: "YYYY.MM.DD" 형식의 기간과 매장_id에 해당하는 데이터를 가져옴
  // manual 인자가 true일 때만 로딩 스피너가 발생
  const fetchData = useCallback(async (params = {}, manual = false) => {
    try {
      if (manual) setLoading(true);
      const period = params.기간; // 예: "2023.04.05"
      const [inventoryRes, itemsRes, suppliersRes] = await Promise.all([
        fetchWarehouseInventory({ 기간: period, 매장_id: selectedStore }),
        fetchItems(true),
        fetchSuppliers()
      ]);
      setInventoryData(inventoryRes);
      setItems(itemsRes);
      setSuppliers(suppliersRes);
      if (manual) setLoading(false);
    } catch (err) {
      console.error("창고 재고 데이터 불러오기 실패:", err);
      setError("데이터를 불러오는데 실패하였습니다.");
      if (manual) setLoading(false);
    }
  }, [selectedStore]);

  // 기간 옵션 재갱신 함수 (페이지 로드시와 최신 조회 버튼에서 사용)
  const refreshPeriods = async () => {
    try {
      const res = await fetchWarehouseInventory({}); // 기간 필터 없이 전체 조회
      const allPeriods = res.map((record) => record.기간);
      if (allPeriods.length === 0) return;
      const dateObjs = allPeriods.map((period) => {
        const parts = period.split(".");
        return new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );
      });
      const minDate = new Date(Math.min(...dateObjs));
      const maxDate = new Date(Math.max(...dateObjs));
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

  // 사용자가 년월 또는 일을 변경하면 바로 API 호출 (manual=false)
  useEffect(() => {
    if (selectedYearMonth && selectedDay && selectedStore) {
      const [year, month] = selectedYearMonth.split(".");
      const period = `${year}.${month}.${selectedDay}`;
      fetchData({ 기간: period, 매장_id: selectedStore }, false);
    }
  }, [selectedYearMonth, selectedDay, selectedStore, fetchData]);

  // 선택된 년월에 따른 일(day) 옵션 생성 (해당 월의 총 일수)
  const [year, month] = selectedYearMonth.split(".");
  const daysInMonth =
    year && month ? new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate() : 31;
  const dayOptions = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dayOptions.push(d.toString().padStart(2, "0"));
  }

  // 매장 관련 API 호출 제거 – 무조건 ST_102 사용
  useEffect(() => {
    setStores([{ 매장_id: "ST_102" }]);
    setSelectedStore("ST_102");
  }, []);

  // "최신 조회" 버튼: 매장은 유지하고 최신 기간 옵션으로 API 호출 (manual=true)
  const handleReset = async (manual = false) => {
    await refreshPeriods();
    const today = new Date();
    const defaultDay = today.getDate().toString().padStart(2, "0");
    setSelectedDay(defaultDay);
    if (yearMonthOptions.length > 0) {
      const latest = [...yearMonthOptions].sort((a, b) => {
        const [yA, mA] = a.split(".").map(Number);
        const [yB, mB] = b.split(".").map(Number);
        if (yA !== yB) return yB - yA;
        return mB - mA;
      })[0];
      // "YYYY.MM"에 기본 일(defaultDay)을 추가하여 "YYYY.MM.DD" 형식으로 만듦
      const period = `${latest}.${defaultDay}`;
      fetchData({ 기간: period, 매장_id: selectedStore }, manual);
    } else {
      fetchData({ page: 1 }, manual);
    }
  };

  // ===== 이하 품목 기반 테이블 생성 로직 =====
  // 창고 재고 데이터를 품목_id 기준으로 그룹화 (창고_재고량 합산)
  const groupedInventory = {};
  inventoryData.forEach((record) => {
    const itemId = record.품목_id;
    groupedInventory[itemId] =
      (groupedInventory[itemId] || 0) + Number(record.창고_재고량);
  });

  // 창고 재고 테이블 API를 기준으로 불러온 품목_id들을 순회하여,
  // fetchItems(true)로 조회한 모든 품목 데이터와 매칭하여 품목명 등 정보를 채움
  const tableRows = Object.keys(groupedInventory).map((itemId) => {
    const matchedItem = items.find((i) => i.품목_id === itemId);
    let supplierName = "N/A";
    let itemName = "N/A";
    let type = "";
    let unitPrice = 0;
    if (matchedItem) {
      itemName = matchedItem.품목명;
      type = matchedItem.종류 || "";
      unitPrice = Number(matchedItem.입고단가);
      const supplier = suppliers.find((s) => s.협력사_id === matchedItem.협력사_id);
      supplierName = supplier ? supplier.협력사명 : "N/A";
    }
    return {
      itemId,
      supplierName,
      itemName,
      type,
      inventory: groupedInventory[itemId] || 0,
      unitPrice,
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

  // 헬퍼: "YYYY.MM" → "YYYY년 MM월" 변환
  const formatYMLabel = (ymStr) => {
    const [y, m] = ymStr.split(".");
    return `${y}년 ${m}월`;
  };

  // 엑셀 다운로드 함수는 별도의 유틸 파일에서 처리
  const handleExcelDownload = () => {
    warehouseInventoryDownloadExcel({
      selectedYearMonth,
      selectedDay,
      stores,
      selectedStore,
      tableRows
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div>{error}</div>;

  return (
    <div className="wi-container">
      <h2 className="title">창고 재고 조회</h2>
      <div className="period-controls">
        <div className="period-search">
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
                  fill="#445382"
                  transform={isYMOpen ? "rotate(180 11 11)" : ""}
                />
              </svg>
            </span>
          </div>
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
                  fill="#445382"
                  transform={isDayOpen ? "rotate(180 11 11)" : ""}
                />
              </svg>
            </span>
          </div>
          {/* 최신 조회 버튼 클릭 시 handleReset(true) 호출 */}
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
      <table className="small-table">
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
