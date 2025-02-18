// frontend/khuweb/src/pages/StoreOrders.js
import React, { useState, useEffect, useRef } from "react";
import {
  fetchOrders,
  fetchItems,
  fetchSuppliers,
  fetchStores,
  updateStoreOrder,
} from "../api/api";
import "../styles/StoreOrders.css";
import { storeOrdersDownloadExcel } from "../utils/StoreOrdersDownloadExcel";

const StoreOrders = () => {
  const [ordersData, setOrdersData] = useState(null); // API로부터 받은 주문 데이터
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 기간 선택 (단일 선택값: "YYYY.MM.W")
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");

  // 토글에 따른 전체 입력 상태 (현재 사용 안함)
  const [isFreeInput] = useState(false);
  const [freePeriod, setFreePeriod] = useState("");

  // 기존의 generatePeriodOptions 대신, API에서 받아온 distinctPeriods를 활용
  const [distinctPeriods, setDistinctPeriods] = useState([]);

  // 드롭다운용 옵션은 API에서 받아온 기간들을 오름차순으로 정렬하여 사용
  const generatePeriodOptions = () => {
    // distinctPeriods는 "YYYY.MM.W" 형식 (월은 이미 2자리여야 함)
    const sortedPeriods = [...distinctPeriods].sort();
    return sortedPeriods.map((periodStr) => {
      const parts = periodStr.split(".");
      const label = `${parts[0]}년 ${parts[1].padStart(2, "0")}월 ${parts[2]}주차`;
      return { value: periodStr, label };
    });
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
        fetchStores(),
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
      const parts = ordersData.current_period.split(".");
      setSelectedYear(parts[0]);
      setSelectedMonth(parts[1]);
      setSelectedWeek(parts[2]);
    }
  }, [ordersData]);

  // 한 번 API로부터 받은 total_pages (distinct 기간 수)를 활용해 distinctPeriods 배열 채우기
  useEffect(() => {
    if (ordersData && ordersData.total_pages && distinctPeriods.length === 0) {
      const totalPages = ordersData.total_pages;
      const periodPromises = [];
      for (let p = 1; p <= totalPages; p++) {
        periodPromises.push(
          fetchOrders({ page: p }).then((res) => res.current_period)
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
  }, [ordersData, distinctPeriods.length]);

  // displayPeriod 계산 함수 (월이 1~9일 경우 앞에 0을 붙여서 표시)
  const getDisplayPeriod = () => {
    if (isFreeInput) {
      return freePeriod
        ? freePeriod.split(".").length === 3
          ? `${freePeriod.split(".")[0]}년 ${freePeriod
              .split(".")[1]
              .padStart(2, "0")}월 ${freePeriod.split(".")[2]}주차`
          : freePeriod
        : "";
    } else if (selectedYear && selectedMonth && selectedWeek) {
      return `${selectedYear}년 ${selectedMonth.padStart(2, "0")}월 ${selectedWeek}주차`;
    } else if (ordersData && ordersData.current_period) {
      const parts = ordersData.current_period.split(".");
      return `${parts[0]}년 ${parts[1].padStart(2, "0")}월 ${parts[2]}주차`;
    }
    return "";
  };

  const displayPeriod = getDisplayPeriod();

  // 기존의 handleSearch 함수: 버튼 대신 자동 검색 시에 호출
  const handleSearch = (periodValue) => {
    if (isFreeInput) {
      if (!freePeriod) {
        alert("기간을 입력해주세요. (예: 2024.04.2)");
        return;
      }
      fetchData({ 기간: freePeriod });
    } else {
      if (!periodValue) {
        alert("년도, 월, 주차를 모두 선택해주세요.");
        return;
      }
      fetchData({ 기간: periodValue });
    }
  };

  const handleReset = () => {
    if (ordersData && ordersData.current_period) {
      const parts = ordersData.current_period.split(".");
      setSelectedYear(parts[0]);
      setSelectedMonth(parts[1]);
      setSelectedWeek(parts[2]);
      // 리셋 후에도 자동 검색 실행
      handleSearch(ordersData.current_period);
    } else {
      setSelectedYear("");
      setSelectedMonth("");
      setSelectedWeek("");
    }
    setFreePeriod("");
    fetchData({ page: 1 });
  };

  const groupedOrders = () => {
    const grouping = {};
    if (ordersData && ordersData.orders) {
      ordersData.orders.forEach((order) => {
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

  const tableRows = items.map((item) => {
    const supplier = suppliers.find((s) => s.협력사_id === item.협력사_id) || {};
    return {
      itemId: item.품목_id,
      supplierName: supplier.협력사명 || "N/A",
      itemName: item.품목명 || "N/A",
      type: item.종류 || "",
      orders: ordersByItem[item.품목_id] || {},
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
  
  // 입력값을 포맷팅하여 표시하는 헬퍼 함수
  const formatInputValue = (value) => {
    if (value === "" || value === undefined || value === null) return "";
    const num = Number(value);
    // 숫자로 변환 가능한 경우에만 포맷팅
    if (!isNaN(num)) {
      return num.toLocaleString();
    }
    return value;
  };

  // 헬퍼: 수정 모드 시 editedOrders가 있다면 그 값을, 아니면 기존 orders 값을 사용
  const getCellValue = (row, storeId) => {
    if (isEditMode && editedOrders[row.itemId] && editedOrders[row.itemId][storeId] !== undefined) {
      return editedOrders[row.itemId][storeId];
    }
    return row.orders[storeId];
  };

  // 각 행의 합계 계산 (매장 발주량 합) - 수정 중이면 editedOrders 반영
  const getRowSum = (row) =>
    orderedStores.reduce((sum, store) => {
      const val = getCellValue(row, store.매장_id);
      return sum + (val ? Number(val) : 0);
    }, 0);

  // 각 매장별 합계 계산 - 수정 중이면 editedOrders 반영
  const storeTotals = orderedStores.map((store) =>
    sortedTableRows.reduce((sum, row) => {
      const val = getCellValue(row, store.매장_id);
      return sum + (val ? Number(val) : 0);
    }, 0)
  );
  // 전체 합계 계산
  const grandTotal = sortedTableRows.reduce((sum, row) => sum + getRowSum(row), 0);

  // 숫자에 천단위 콤마 적용 (0인 경우 "-"로 표시)
  const formatNumber = (num) => {
    if (num === "" || num === undefined || num === null || Number(num) === 0)
      return "-";
    return Number(num).toLocaleString();
  };

  // 편집 모드 토글
  const handleEditToggle = () => {
    if (!isEditMode) {
      const init = {};
      sortedTableRows.forEach((row) => {
        init[row.itemId] = { ...row.orders };
      });
      setEditedOrders(init);
    }
    setIsEditMode(!isEditMode);
  };

  // 수정 중 값 변경
  const handleOrderChange = (itemId, storeId, value) => {
    setEditedOrders((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [storeId]: value,
      },
    }));
  };

  // 수정 완료 후 API 호출
  const handleEditSubmit = async () => {
    try {
      const updates = [];
      for (const itemId in editedOrders) {
        for (const storeId in editedOrders[itemId]) {
          const newValue = editedOrders[itemId][storeId];
          const originalVal = tableRows.find((row) => row.itemId === itemId)?.orders[storeId];
          if (newValue === "" || Number(newValue) === 0) {
            if (originalVal === 0 || originalVal === "") continue;
          } else if (newValue === originalVal) continue;
          const payload = {
            매장_id: storeId,
            품목_id: itemId,
            기간: ordersData.current_period,
            매장_발주량: Number(newValue),
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
    switch (name) {
      case "중앙도서관":
        return (
          <>
            중앙
            <br />도서관
          </>
        );
      case "예술디자인대":
        return (
          <>
            예술
            <br />디자인대
          </>
        );
      case "멀티미디어관":
        return (
          <>
            멀티
            <br />미디어관
          </>
        );
      case "제2기숙사":
        return (
          <>
            제2
            <br />기숙사
          </>
        );
      default:
        return name;
    }
  };

  // 기존 handleDownloadExcel 대신, 새로 분리한 함수를 호출 (매개변수 전달)
  const handleExcelDownload = () => {
    storeOrdersDownloadExcel({
      selectedYear,
      selectedMonth,
      selectedWeek,
      isFreeInput,
      freePeriod,
      ordersData,
      orderedStores,
      sortedTableRows,
      storeTotals,
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="store-orders-container">
      <h2 className="title">발주 취합서</h2>
      <div className="period-controls">
        <div className="period-search">
          {/* 수정 모드일 때는 클릭 불가능하도록 처리 */}
          <div
            className="period-select-box"
            onClick={() => {
              if (!isEditMode && selectRef.current) {
                selectRef.current.focus();
                setIsDropdownOpen(true); // 클릭 시 토글을 위로
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
              value={`${selectedYear}.${selectedMonth}.${selectedWeek}`}
              onChange={(e) => {
                const [year, month, week] = e.target.value.split(".");
                setSelectedYear(year);
                setSelectedMonth(month);
                setSelectedWeek(week);
                const formattedMonth = month.toString().padStart(2, "0");
                const period = `${year}.${formattedMonth}.${week}`;
                // 기간 선택 시 자동 검색 후 토글을 아래로
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
                {/* 토글 아이콘: isDropdownOpen이 true이면 180도 회전 */}
                <path
                  d="M7 10l5 5 5-5z"
                  fill="#8B0000"
                  transform={isDropdownOpen ? "rotate(180 11 11)" : ""}
                />
              </svg>
            </span>
          </div>
          {/* 검색 버튼 제거 */}
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
            <th className="so-number-col diagonal-header"></th>
            <th className="so-supplier-col">협력사</th>
            <th className="so-item-col">품목명</th>
            {orderedStores.map((store) => (
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
              {orderedStores.map((store) => (
                <td key={store.매장_id} className="so-order-col">
                  {isEditMode ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        editedOrders[row.itemId] &&
                        editedOrders[row.itemId][store.매장_id] !== undefined
                          ? formatInputValue(editedOrders[row.itemId][store.매장_id])
                          : ""
                      }
                      onChange={(e) => {
                        // 입력 시 쉼표 제거 후 숫자 이외의 문자를 모두 제거
                        const valueWithoutCommas = e.target.value.replace(/,/g, "");
                        const numericValue = valueWithoutCommas.replace(/\D/g, "");
                        handleOrderChange(row.itemId, store.매장_id, numericValue);
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
              <td className="so-sum-col">
                {getRowSum(row) === 0 ? "-" : formatNumber(getRowSum(row))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="so-number-col"></td>
            <td className="so-supplier-col" colSpan="2" style={{ textAlign: "center" }}>
              합계
            </td>
            {storeTotals.map((total, idx) => (
              <td key={orderedStores[idx].매장_id} className="so-order-col">
                {total === 0 ? "-" : formatNumber(total)}
              </td>
            ))}
            <td className="so-sum-col">
              {grandTotal === 0 ? "-" : formatNumber(grandTotal)}
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
