import React, { useState, useEffect, useCallback } from "react";
import {
  fetchWarehouseInventory,
  fetchItems,
  fetchSuppliers,
  updateWarehouseInventory,
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

  // 년/월 옵션 및 선택된 값
  const [yearMonthOptions, setYearMonthOptions] = useState([]);
  const [selectedYearMonth, setSelectedYearMonth] = useState("");
  // 선택된 일 (예: "05")
  const [selectedDay, setSelectedDay] = useState("");
  // 매장은 무조건 "ST_102"
  const [selectedStore, setSelectedStore] = useState("ST_102");

  // 드롭다운 토글 상태
  const [isYMOpen, setIsYMOpen] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);

  // 수정 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedInventory, setEditedInventory] = useState({});

  // API 데이터 호출 (기간: "YYYY.MM.DD")
  const fetchData = useCallback(
    async (params = {}, manual = false) => {
      try {
        if (manual) setLoading(true);
        const period = params.기간;
        const [inventoryRes, itemsRes, suppliersRes] = await Promise.all([
          fetchWarehouseInventory({ 기간: period, 매장_id: selectedStore }),
          fetchItems(true),
          fetchSuppliers(),
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
    },
    [selectedStore]
  );

  // 전체 기간 옵션 갱신 함수 (페이지 로드 및 최신 조회 시)
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

  useEffect(() => {
    refreshPeriods();
  }, []);

  // 기본 일(day) 값: 오늘 날짜
  useEffect(() => {
    const today = new Date();
    const defaultDay = today.getDate().toString().padStart(2, "0");
    setSelectedDay(defaultDay);
  }, []);

  // 년월, 일, 매장이 변경되면 API 호출
  useEffect(() => {
    if (selectedYearMonth && selectedDay && selectedStore) {
      const [year, month] = selectedYearMonth.split(".");
      const period = `${year}.${month}.${selectedDay}`;
      fetchData({ 기간: period, 매장_id: selectedStore }, false);
    }
  }, [selectedYearMonth, selectedDay, selectedStore, fetchData]);

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

  // 매장 API 호출 제거 – 무조건 ST_102 사용
  useEffect(() => {
    setStores([{ 매장_id: "ST_102" }]);
    setSelectedStore("ST_102");
  }, []);

  // 최신 조회 버튼: 최신 기간 옵션으로 API 호출
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
      const period = `${latest}.${defaultDay}`;
      fetchData({ 기간: period, 매장_id: selectedStore }, manual);
    } else {
      fetchData({ page: 1 }, manual);
    }
  };

  // 그룹화: 품목별 창고 재고 합산
  const groupedInventory = {};
  inventoryData.forEach((record) => {
    const itemId = record.품목_id;
    groupedInventory[itemId] =
      (groupedInventory[itemId] || 0) + Number(record.창고_재고량);
  });

  // 품목 데이터와 매칭하여 테이블 행 생성
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
      const supplier = suppliers.find(
        (s) => s.협력사_id === matchedItem.협력사_id
      );
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

  tableRows.sort((a, b) => {
    const cmpSupplier = a.supplierName.localeCompare(b.supplierName);
    if (cmpSupplier !== 0) return cmpSupplier;
    const cmpType = a.type.localeCompare(b.type);
    if (cmpType !== 0) return cmpType;
    return a.itemName.localeCompare(b.itemName);
  });

  const formatNumber = (num) => {
    if (num === "" || num === undefined || num === null || Number(num) === 0)
      return "-";
    return Number(num).toLocaleString();
  };

  // "YYYY.MM" → "YYYY년 MM월" 형식 변환
  const formatYMLabel = (ymStr) => {
    const [y, m] = ymStr.split(".");
    return `${y}년 ${m}월`;
  };

  // 입력값 천단위 구분 처리
  const formatInputValue = (value) => {
    if (value === "" || value === undefined || value === null) return "";
    const num = Number(value);
    if (!isNaN(num)) return num.toLocaleString();
    return value;
  };

  const handleExcelDownload = () => {
    warehouseInventoryDownloadExcel({
      selectedYearMonth,
      selectedDay,
      stores,
      selectedStore,
      tableRows,
    });
  };

  // 수정 모드 토글: 수정모드 진입 시 기존 데이터를 초기값으로 설정
  const handleEditToggle = () => {
    if (!isEditMode) {
      const init = {};
      tableRows.forEach((row) => {
        init[row.itemId] = row.inventory;
      });
      setEditedInventory(init);
    }
    setIsEditMode(!isEditMode);
  };

  const handleInventoryChange = (itemId, value) => {
    const valueWithoutCommas = value.replace(/,/g, "");
    const numericValue = valueWithoutCommas.replace(/\D/g, "");
    setEditedInventory((prev) => ({
      ...prev,
      [itemId]: numericValue,
    }));
  };

  const handleEditSubmit = async () => {
    try {
      const updates = [];
      const currentPeriod = `${selectedYearMonth}.${selectedDay}`;
      tableRows.forEach((row) => {
        const newVal = editedInventory[row.itemId];
        if (Number(newVal) !== Number(row.inventory)) {
          const payload = {
            매장_id: selectedStore,
            품목_id: row.itemId,
            기간: currentPeriod,
            창고_재고량: Number(newVal),
          };
          updates.push(updateWarehouseInventory(payload));
        }
      });
      await Promise.all(updates);
      fetchData({ 기간: currentPeriod, 매장_id: selectedStore }, true);
      setIsEditMode(false);
    } catch (err) {
      console.error("수정 실패:", err);
      alert("수정에 실패하였습니다.");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div>{error}</div>;

  return (
    <div className="wi-container">
      <h2 className="title">창고 재고 조회</h2>
      <div className="period-controls">
        <div className="period-search">
          {/* 년월 선택: 수정 모드일 경우 흐릿하게 보이고 클릭 불가 */}
          <div
            className="period-select-box"
            style={{
              pointerEvents: isEditMode ? "none" : "auto",
              opacity: isEditMode ? 0.5 : 1,
            }}
          >
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
          {/* 일(day) 선택: 수정 모드일 경우 흐릿하게 보이고 클릭 불가 */}
          <div
            className="period-select-box"
            style={{
              pointerEvents: isEditMode ? "none" : "auto",
              opacity: isEditMode ? 0.5 : 1,
            }}
          >
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
          {/* 최신 조회 버튼: 수정 모드이면 비활성화/흐릿하게 */}
          <button
            className="reset-button"
            onClick={() => handleReset(true)}
            disabled={isEditMode}
            style={{ opacity: isEditMode ? 0.5 : 1 }}
          >
            최신 조회
          </button>
        </div>
        <div className="warehouse-action-buttons">
          {/* 수정 모드일 때는 다운로드 버튼 숨김 */}
          {!isEditMode && (
            <button onClick={handleExcelDownload} className="download-button">
              Excel 다운
            </button>
          )}
          {isEditMode ? (
            <>
              <button
                className="edit-confirm-button"
                onClick={handleEditSubmit}
              >
                수정완료
              </button>
              <button className="edit-button" onClick={handleEditToggle}>
                취소
              </button>
            </>
          ) : (
            <button className="edit-button" onClick={handleEditToggle}>
              수정
            </button>
          )}
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
              <td className="wi-sum-col">
                {isEditMode ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={
                      editedInventory[row.itemId] !== undefined
                        ? formatInputValue(editedInventory[row.itemId])
                        : ""
                    }
                    onChange={(e) =>
                      handleInventoryChange(row.itemId, e.target.value)
                    }
                    style={{ textAlign: "right" }}
                  />
                ) : (
                  formatNumber(row.inventory)
                )}
              </td>
              <td className="wi-cost-col">
                {formatNumber(
                  (isEditMode && editedInventory[row.itemId] !== undefined
                    ? Number(editedInventory[row.itemId])
                    : Number(row.inventory)) * row.unitPrice
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WarehouseInventory;
