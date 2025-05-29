import React, { useState, useEffect } from "react";
import {
  fetchItems,
  fetchSuppliers,
  fetchStores,
  fetchStoreInventory,
} from "../api/api";
import "../styles/StoreInventory.css";
import "../styles/table.css";
import LoadingSpinner from "../components/LoadingSpinner";
import { storeInventoryDownloadExcel } from "../utils/StoreInventoryDownloadExcel";

const StoreInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 기간, 일, 매장 선택 관련 상태
  const [yearMonthOptions, setYearMonthOptions] = useState([]);
  const [selectedYearMonth, setSelectedYearMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedStore, setSelectedStore] = useState("");

  // 드롭다운 토글 상태
  const [isYMOpen, setIsYMOpen] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  // API 호출: 매장_일별 테이블에서 재고 데이터를 가져오고,
  // fetchItems(true)를 호출하여 활성/비활성 상관없이 모든 품목 조회 후 매칭 처리
  const fetchData = async (params = {}, manual = false) => {
    try {
      if (manual) setLoading(true);
      const period = params.기간; // 예: "2023.04.05"
      const storeId = params.매장_id;
      const [inventoryRes, itemsRes, suppliersRes] = await Promise.all([
        fetchStoreInventory({ 기간: period, 매장_id: storeId }),
        fetchItems(true), // all=true로 호출하여 모든 품목 조회
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

  // 기간 옵션 재갱신 함수 (최초 로드 및 최신 조회)
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
      setYearMonthOptions([...new Set(options)]);
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

  useEffect(() => {
    refreshPeriods();
  }, []);

  // 매장 목록을 불러오고 기본 매장 선택 (ST_101, ST_102 제외)
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

  // 사용자가 기간, 일 또는 매장을 변경하면 데이터 재조회
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
    year && month
      ? new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate()
      : 31;
  const dayOptions = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dayOptions.push(d.toString().padStart(2, "0"));
  }

  // 최신 조회 버튼 클릭 시 기간 옵션 갱신 후 데이터 조회
  const handleReset = async (manual = false) => {
    await refreshPeriods();
    if (yearMonthOptions.length > 0) {
      const latest = [...yearMonthOptions].sort((a, b) => {
        const [yA, mA] = a.split(".").map(Number);
        const [yB, mB] = b.split(".").map(Number);
        if (yA !== yB) return yB - yA;
        return mB - mA;
      })[0];
      const period = `${latest}.${selectedDay}`;
      fetchData({ 기간: period, 매장_id: selectedStore }, manual);
    } else {
      fetchData({ page: 1 }, manual);
    }
  };

  // --- 품목명 열 표시를 위한 로직 ---
  // 1. 매장_일별 테이블 API로 불러온 inventoryData에서 품목_id별로 재고량을 그룹화
  const groupedInventory = {};
  inventoryData.forEach((record) => {
    const itemId = record.품목_id;
    groupedInventory[itemId] =
      (groupedInventory[itemId] || 0) + Number(record.매장_재고량);
  });

  // 2. 그룹화된 품목_id를 순회하면서, fetchItems(true)로 불러온 모든 품목(활성/비활성 무관)에서 매칭하여 품목명 등 정보를 채움
  const tableRows = Object.keys(groupedInventory).map((itemId) => {
    const matchedItem = items.find((i) => i.품목_id === itemId);
    const itemName = matchedItem ? matchedItem.품목명 : "N/A";
    const supplier = matchedItem
      ? suppliers.find((s) => s.협력사_id === matchedItem.협력사_id) || {}
      : {};
    return {
      itemId,
      supplierName: supplier.협력사명 || "N/A",
      itemName,
      type: matchedItem ? matchedItem.종류 : "",
      inventory: groupedInventory[itemId] || 0,
      unitPrice: matchedItem ? Number(matchedItem.입고단가) : 0,
    };
  });

  // 오름차순 정렬: 협력사 → 종류 → 품목명
  tableRows.sort((a, b) => {
    const cmpSupplier = a.supplierName.localeCompare(b.supplierName);
    if (cmpSupplier !== 0) return cmpSupplier;
    const cmpType = a.type.localeCompare(b.type);
    if (cmpType !== 0) return cmpType;
    return a.itemName.localeCompare(b.itemName);
  });
  // --------------------------------

  const formatNumber = (num) => {
    if (num === "" || num === undefined || num === null || Number(num) === 0)
      return "-";
    return Number(num).toLocaleString();
  };

  const totalInventory = tableRows.reduce(
    (sum, row) => sum + Number(row.inventory),
    0
  );
  const totalCost = tableRows.reduce(
    (sum, row) => sum + Number(row.inventory) * row.unitPrice,
    0
  );

  // 헬퍼: "YYYY.MM" → "YYYY년 MM월" 형식 변환
  const formatYMLabel = (ymStr) => {
    const [y, m] = ymStr.split(".");
    return `${y}년 ${m}월`;
  };

  // 엑셀 다운로드 함수는 별도의 유틸 파일로 분리하여 호출
  const handleExcelDownload = () => {
    storeInventoryDownloadExcel({
      selectedYearMonth,
      selectedDay,
      stores,
      selectedStore,
      tableRows,
    });
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
                  fill="#445382"
                  transform={isStoreOpen ? "rotate(180 11 11)" : ""}
                />
              </svg>
            </span>
          </div>
          {/* 년/월 선택 */}
          <div className="period-select-box">
            <div className="select-display">
              {selectedYearMonth
                ? formatYMLabel(selectedYearMonth)
                : "년월 선택"}
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
                  fill="#445382"
                  transform={isDayOpen ? "rotate(180 11 11)" : ""}
                />
              </svg>
            </span>
          </div>
          {/* 최신 조회 버튼 */}
          <button className="reset-button" onClick={() => handleReset(true)}>
            최신 조회
          </button>
        </div>
        <div className="warehouse-action-buttons">
          <button onClick={handleExcelDownload} className="download-button">
            Excel 다운
          </button>
        </div>
      </div>
      <hr className="divider" />
      <table className="small-table">
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
        <tfoot>
          <tr>
            <td className="si-number-col"></td>
            <td
              className="si-supplier-col"
              colSpan="2"
              style={{ textAlign: "center" }}
            >
              합계
            </td>
            <td className="si-sum-col">{formatNumber(totalInventory)}</td>
            <td className="si-cost-col">{formatNumber(totalCost)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default StoreInventory;
