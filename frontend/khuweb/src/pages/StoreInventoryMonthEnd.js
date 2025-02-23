import React, { useState, useEffect, useRef } from "react";
import {
  fetchItems,
  fetchSuppliers,
  fetchStores,
  fetchStoreMonthEndInventory,
  updateStoreMonthEndInventory,
} from "../api/api";
import "../styles/StoreInventoryMonthEnd.css";

const StoreInventoryMonthEnd = () => {
  // ※ 기존 StoreOrders.js의 ordersData 대신 재고 관련 데이터를 사용
  const [inventoryData, setInventoryData] = useState(null);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 기간 선택: 매장은 월말재고이므로 "년"과 "월"만 사용 (주차 제거)
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isFreeInput] = useState(false);
  const [freePeriod, setFreePeriod] = useState("");

  const [distinctPeriods, setDistinctPeriods] = useState([]);

  // Dropdown 관련
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef(null);

  // 원하는 매장 순서 (헤더에 출력할 매장명 – 주의: 기존 StoreOrders.js에서는 "so-"로 관리되던 것이 여기서는 "sime-"로 변경됨)
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

  // 수정 모드 관련 상태 (재고 수정)
  const [isEditMode, setIsEditMode] = useState(false);
  // editedInventories: { [itemId]: { [storeId]: newValue, ... } }
  const [editedInventories, setEditedInventories] = useState({});

  // API 호출 공통 함수 – 기존 fetchOrders 대신 fetchStoreMonthEndInventory 사용
  const fetchData = async (params = { page: 1 }) => {
    try {
      setLoading(true);
      const inventoryResponse = await fetchStoreMonthEndInventory(params);
      const [itemsData, suppliersData, storesData] = await Promise.all([
        fetchItems(),
        fetchSuppliers(),
        fetchStores(),
      ]);
      setInventoryData(inventoryResponse);
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

  // inventoryData.current_period는 "YYYY.MM" 형식임을 가정 (주차 없음)
  useEffect(() => {
    if (inventoryData && inventoryData.current_period) {
      const parts = inventoryData.current_period.split(".");
      setSelectedYear(parts[0]);
      setSelectedMonth(parts[1]);
    }
  }, [inventoryData]);

  // distinctPeriods 채우기 (페이지 수(total_pages)를 이용)
  useEffect(() => {
    if (inventoryData && inventoryData.total_pages && distinctPeriods.length === 0) {
      const totalPages = inventoryData.total_pages;
      const periodPromises = [];
      for (let p = 1; p <= totalPages; p++) {
        periodPromises.push(
          fetch(`${process.env.REACT_APP_API_URL}/api/inventory/store_monthend/?page=${p}`)
            .then((response) => {
              if (!response.ok) {
                throw new Error("Failed to fetch distinct period");
              }
              return response.json();
            })
            .then((data) => data.current_period)
        );
      }
      Promise.all(periodPromises)
        .then((periods) => {
          const unique = Array.from(new Set(periods));
          setDistinctPeriods(unique);
        })
        .catch((err) => {
          console.error("Failed to fetch distinct periods", err);
        });
    }
  }, [inventoryData, distinctPeriods.length]);
  
  // 기간 드롭다운 옵션 – "YYYY년 MM월" 형식
  const generatePeriodOptions = () => {
    const sortedPeriods = [...distinctPeriods].sort((a, b) => {
      const [yearA, monthA] = a.split(".").map(Number);
      const [yearB, monthB] = b.split(".").map(Number);
      if (yearA !== yearB) return yearB - yearA;
      return monthB - monthA;
    });
    return sortedPeriods.map((periodStr) => {
      const parts = periodStr.split(".");
      const label = `${parts[0]}년 ${parts[1].padStart(2, "0")}월`;
      return { value: periodStr, label };
    });
  };

  const getDisplayPeriod = () => {
    if (isFreeInput) {
      return freePeriod
        ? freePeriod.split(".").length === 2
          ? `${freePeriod.split(".")[0]}년 ${freePeriod.split(".")[1].padStart(2, "0")}월`
          : freePeriod
        : "";
    } else if (selectedYear && selectedMonth) {
      return `${selectedYear}년 ${selectedMonth.padStart(2, "0")}월`;
    } else if (inventoryData && inventoryData.current_period) {
      const parts = inventoryData.current_period.split(".");
      return `${parts[0]}년 ${parts[1].padStart(2, "0")}월`;
    }
    return "";
  };

  const displayPeriod = getDisplayPeriod();

  const handleSearch = (periodValue) => {
    if (isFreeInput) {
      if (!freePeriod) {
        alert("기간을 입력해주세요. (예: 2024.04)");
        return;
      }
      fetchData({ 기간: freePeriod });
    } else {
      if (!periodValue) {
        alert("년도와 월을 모두 선택해주세요.");
        return;
      }
      fetchData({ 기간: periodValue });
    }
  };

  const handleReset = () => {
    if (inventoryData && inventoryData.current_period) {
      const parts = inventoryData.current_period.split(".");
      setSelectedYear(parts[0]);
      setSelectedMonth(parts[1]);
      handleSearch(inventoryData.current_period);
    } else {
      setSelectedYear("");
      setSelectedMonth("");
    }
    setFreePeriod("");
    fetchData({ page: 1 });
  };

  // 그룹화: API에서 받은 재고 데이터(inventories)의 각 품목별로, 매장별 월말 재고량을 분류
  const groupedInventory = () => {
    const grouping = {};
    if (inventoryData && inventoryData.inventories) {
      inventoryData.inventories.forEach((record) => {
        const itemId = record.품목_id;
        if (!grouping[itemId]) {
          grouping[itemId] = {};
        }
        grouping[itemId][record.매장_id] = record.월말_재고량;
      });
    }
    return grouping;
  };

  const inventoriesByItem = groupedInventory();

  const tableRows = items.map((item) => {
    const supplier = suppliers.find((s) => s.협력사_id === item.협력사_id) || {};
    return {
      itemId: item.품목_id,
      supplierName: supplier.협력사명 || "N/A",
      itemName: item.품목명 || "N/A",
      type: item.종류 || "",
      // 각 매장의 월말 재고량
      inventory: inventoriesByItem[item.품목_id] || {},
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
    .map((storeName) => stores.find((s) => s.매장명 === storeName))
    .filter(Boolean);

  const formatStoreHeader = (name) => {
    switch (name) {
      case "중앙도서관":
        return (
          <>
            중앙
            <br />
            도서관
          </>
        );
      case "예술디자인대":
        return (
          <>
            예술
            <br />
            디자인대
          </>
        );
      case "멀티미디어관":
        return (
          <>
            멀티
            <br />
            미디어관
          </>
        );
      case "제2기기숙사":
        return (
          <>
            제2
            <br />
            기숙사
          </>
        );
      default:
        return name;
    }
  };

  // 편집 모드 관련 헬퍼 함수
  const formatInputValue = (value) => {
    if (value === "" || value === undefined || value === null) return "";
    const num = Number(value);
    if (!isNaN(num)) {
      return num.toLocaleString();
    }
    return value;
  };

  const getCellValue = (row, storeId) => {
    if (isEditMode && editedInventories[row.itemId] && editedInventories[row.itemId][storeId] !== undefined) {
      return editedInventories[row.itemId][storeId];
    }
    return row.inventory[storeId];
  };

  // 각 매장별 합계 계산 (합계는 footer에만 출력)
  const storeTotals = orderedStores.map((store) =>
    sortedTableRows.reduce((sum, row) => {
      const val = getCellValue(row, store.매장_id);
      return sum + (val ? Number(val) : 0);
    }, 0)
  );
  const grandTotal = sortedTableRows.reduce((sum, row) => {
    const rowSum = orderedStores.reduce((s, store) => {
      const val = getCellValue(row, store.매장_id);
      return s + (val ? Number(val) : 0);
    }, 0);
    return sum + rowSum;
  }, 0);

  const formatNumber = (num) => {
    if (num === "" || num === undefined || num === null || Number(num) === 0)
      return "-";
    return Number(num).toLocaleString();
  };

  const handleEditToggle = () => {
    if (!isEditMode) {
      const init = {};
      sortedTableRows.forEach((row) => {
        init[row.itemId] = { ...row.inventory };
      });
      setEditedInventories(init);
    }
    setIsEditMode(!isEditMode);
  };

  const handleInventoryChange = (itemId, storeId, value) => {
    setEditedInventories((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [storeId]: value,
      },
    }));
  };

  const handleEditSubmit = async () => {
    try {
      const updates = [];
      for (const itemId in editedInventories) {
        for (const storeId in editedInventories[itemId]) {
          const newValue = editedInventories[itemId][storeId];
          const originalVal = tableRows.find((row) => row.itemId === itemId)?.inventory[storeId];
          if (newValue === "" || Number(newValue) === 0) {
            if (originalVal === 0 || originalVal === "") continue;
          } else if (newValue === originalVal) continue;
          const payload = {
            매장_id: storeId,
            품목_id: itemId,
            기간: inventoryData.current_period,
            월말_재고량: Number(newValue),
          };
          updates.push(updateStoreMonthEndInventory(payload));
        }
      }
      await Promise.all(updates);
      fetchData({ 기간: inventoryData.current_period });
      setIsEditMode(false);
    } catch (err) {
      console.error("재고 수정 실패:", err);
      alert("재고 수정에 실패하였습니다.");
    }
  };

  // 엑셀 다운로드 함수는 미구현 상태로 안내 (요청사항 7)
  const handleExcelDownload = () => {
    alert("Excel 다운로드 기능은 미구현입니다.");
  };

  return (
    <div className="store-orders-container">
      <h2 className="title">매장 월말 재고 조회</h2>
      <div className="period-controls">
        <div className="period-search">
          <div
            className="period-select-box"
            onClick={() => {
              if (!isEditMode && selectRef.current) {
                selectRef.current.focus();
                setIsDropdownOpen(true);
              }
            }}
            style={{
              pointerEvents: isEditMode ? "none" : "auto",
              opacity: isEditMode ? 0.5 : 1,
            }}
          >
            <div className="select-display">{displayPeriod}</div>
            <select
              ref={selectRef}
              value={`${selectedYear}.${selectedMonth}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split(".");
                setSelectedYear(year);
                setSelectedMonth(month);
                const formattedMonth = month.toString().padStart(2, "0");
                const period = `${year}.${formattedMonth}`;
                handleSearch(period);
                setIsDropdownOpen(false);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setIsDropdownOpen(false)}
              className="custom-select"
            >
              {generatePeriodOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span
              className="toggle"
              onClick={(e) => {
                e.stopPropagation();
                if (!isEditMode && selectRef.current) {
                  selectRef.current.focus();
                  setIsDropdownOpen(true);
                }
              }}
            >
              <svg width="24" height="24" viewBox="0 0 22 22">
                <path
                  d="M7 10l5 5 5-5z"
                  fill="#8B0000"
                  transform={isDropdownOpen ? "rotate(180 11 11)" : ""}
                />
              </svg>
            </span>
          </div>
          <button className="reset-button" onClick={handleReset} disabled={isEditMode}>
            최신 조회
          </button>
        </div>
        <div className="store-action-buttons">
          <button onClick={handleExcelDownload} className="download-button" disabled={isEditMode}>
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
            <th className="sime-number-col">No.</th>
            <th className="sime-supplier-col">협력사</th>
            <th className="sime-item-col">품목명</th>
            {orderedStores.map((store) => (
              <th key={store.매장_id} className="sime-order-col">
                {formatStoreHeader(store.매장명)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedTableRows.map((row, index) => (
            <tr key={row.itemId}>
              <td className="sime-number-col">{index + 1}</td>
              <td className="sime-supplier-col">
                <div className="supplier-cell">{row.supplierName}</div>
              </td>
              <td className="sime-item-col">
                <div className="item-cell">{row.itemName}</div>
              </td>
              {orderedStores.map((store) => (
                <td key={store.매장_id} className="sime-order-col">
                  {isEditMode ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        editedInventories[row.itemId] &&
                        editedInventories[row.itemId][store.매장_id] !== undefined
                          ? formatInputValue(editedInventories[row.itemId][store.매장_id])
                          : ""
                      }
                      onChange={(e) => {
                        const valueWithoutCommas = e.target.value.replace(/,/g, "");
                        const numericValue = valueWithoutCommas.replace(/\D/g, "");
                        handleInventoryChange(row.itemId, store.매장_id, numericValue);
                      }}
                      style={{ textAlign: "right" }}
                    />
                  ) : getCellValue(row, store.매장_id) !== undefined ? (
                    formatNumber(getCellValue(row, store.매장_id))
                  ) : (
                    ""
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="sime-number-col"></td>
            <td className="sime-supplier-col" colSpan="2" style={{ textAlign: "center" }}>
              합계
            </td>
            {storeTotals.map((total, idx) => (
              <td key={orderedStores[idx].매장_id} className="sime-order-col">
                {total === 0 ? "-" : formatNumber(total)}
              </td>
            ))}
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

export default StoreInventoryMonthEnd;
