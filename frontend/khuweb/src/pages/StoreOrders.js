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

  // 기간 선택 (기존 "YYYY.MM.W"에 회차까지 포함하여 "YYYY.MM.W.R")
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedRound, setSelectedRound] = useState(""); // 회차

  // 토글 관련 (현재 사용 안함)
  const [isFreeInput] = useState(false);
  const [freePeriod, setFreePeriod] = useState("");

  // distinctPeriods 배열: "YYYY.MM.W.R" 형식
  const [distinctPeriods, setDistinctPeriods] = useState([]);

  // 자동 최고 회차 조회 여부 플래그 (초기 로드시/최신 조회 시 사용)
  const [hasFetchedHighestRound, setHasFetchedHighestRound] = useState(false);

  // 드롭다운 옵션 생성 (내림차순 정렬 후 "YYYY년 MM월 W주차 R회차" 표기)
  const generatePeriodOptions = () => {
    const sortedPeriods = [...distinctPeriods].sort((a, b) => {
      const [yearA, monthA, weekA, roundA] = a.split(".").map(Number);
      const [yearB, monthB, weekB, roundB] = b.split(".").map(Number);
      if (yearA !== yearB) return yearB - yearA;
      if (monthA !== monthB) return monthB - monthA;
      if (weekA !== weekB) return weekB - weekA;
      return roundB - roundA;
    });
    return sortedPeriods.map((periodStr) => {
      const parts = periodStr.split(".");
      const label = `${parts[0]}년 ${parts[1].padStart(2, "0")}월 ${parts[2]}주차 ${parts[3]}회차`;
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
  const [editedOrders, setEditedOrders] = useState({});

  // 드롭다운 open 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef(null);

  // fetchData: 회차 파라미터도 URL에 포함 (반환값 추가)
  const fetchData = async (params = { page: 1 }) => {
    try {
      setLoading(true);
      let url = `${process.env.REACT_APP_API_URL}/api/orders/store_order_list/?`;
      if (params.기간) {
        url += `기간=${params.기간}`;
      } else {
        url += `page=${params.page || 1}`;
      }
      if (params.store_id) {
        url += `&store_id=${params.store_id}`;
      }
      if (params.order) {
        url += `&order=${params.order}`;
      }
      if (params.회차) {
        url += `&회차=${params.회차}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const ordersResponse = await response.json();
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
      return ordersResponse; // 새 ordersResponse 반환
    } catch (err) {
      console.error("데이터 불러오기 실패:", err);
      setError("데이터를 불러오는데 실패하였습니다.");
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    fetchData({ page: 1 });
  }, []);

  // 초기 선택값 설정: ordersData.current_period("YYYY.MM.W")와 함께,
  // ordersData.orders의 회차 중 최대값을 selectedRound에 반영하고,
  // 자동으로 최고 회차를 대상으로 handleSearch를 실행합니다.
  useEffect(() => {
    if (ordersData && ordersData.current_period) {
      const parts = ordersData.current_period.split(".");
      setSelectedYear(parts[0]);
      setSelectedMonth(parts[1]);
      setSelectedWeek(parts[2]);
      let computedRound = "1";
      if (ordersData.orders && ordersData.orders.length > 0) {
        const rounds = ordersData.orders.map((order) => Number(order.회차) || 1);
        computedRound = Math.max(...rounds).toString();
        setSelectedRound(computedRound);
      } else {
        setSelectedRound("1");
      }
      // 자동 조회가 아직 안되었으면 최고 회차로 검색 후 플래그 true 처리
      if (!hasFetchedHighestRound) {
        const formattedMonth = parts[1].padStart(2, "0");
        const period = `${parts[0]}.${formattedMonth}.${parts[2]}`;
        handleSearch(period, computedRound);
        setHasFetchedHighestRound(true);
      }
    }
  }, [ordersData, hasFetchedHighestRound]);

  // 추가: refreshDistinct 상태 변수 선언
  const [refreshDistinct, setRefreshDistinct] = useState(false);

  useEffect(() => {
    if (ordersData && ordersData.total_pages && (distinctPeriods.length === 0 || refreshDistinct)) {
      const totalPages = ordersData.total_pages;
      const periodPromises = [];
      for (let p = 1; p <= totalPages; p++) {
        periodPromises.push(
          fetchOrders({ page: p }).then((res) => {
            if (res.orders && res.orders.length > 0) {
              return res.orders.map(
                (order) =>
                  `${order.기간}.${order.회차 ? order.회차.toString() : "1"}`
              );
            }
            return [];
          })
        );
      }
      Promise.all(periodPromises)
        .then((results) => {
          const allPeriods = results.flat();
          const unique = Array.from(new Set(allPeriods));
          setDistinctPeriods(unique);
          setRefreshDistinct(false);
        })
        .catch((err) => {
          console.error("Failed to fetch distinct periods", err);
        });
    }
  }, [ordersData, distinctPeriods.length, refreshDistinct]);

  // displayPeriod 계산 (회차 포함)
  const getDisplayPeriod = () => {
    if (isFreeInput) {
      return freePeriod
        ? freePeriod.split(".").length === 4
          ? `${freePeriod.split(".")[0]}년 ${freePeriod.split(".")[1].padStart(2, "0")}월 ${freePeriod.split(".")[2]}주차 ${freePeriod.split(".")[3]}회차`
          : freePeriod
        : "";
    } else if (selectedYear && selectedMonth && selectedWeek && selectedRound) {
      return `${selectedYear}년 ${selectedMonth.padStart(2, "0")}월 ${selectedWeek}주차 ${selectedRound}회차`;
    } else if (ordersData && ordersData.current_period) {
      const parts = ordersData.current_period.split(".");
      return `${parts[0]}년 ${parts[1].padStart(2, "0")}월 ${parts[2]}주차 1회차`;
    }
    return "";
  };

  const displayPeriod = getDisplayPeriod();

  // handleSearch: 선택된 기간과 회차를 GET 요청에 포함하여 데이터를 불러옵니다.
  const handleSearch = (periodValue, roundValue) => {
    if (isFreeInput) {
      if (!freePeriod) {
        alert("기간을 입력해주세요. (예: 2024.04.2.1)");
        return;
      }
      const parts = freePeriod.split(".");
      const searchPeriod = `${parts[0]}.${parts[1].padStart(2, "0")}.${parts[2]}`;
      fetchData({ 기간: searchPeriod, 회차: parts[3] });
    } else {
      if (!periodValue) {
        alert("년도, 월, 주차를 모두 선택해주세요.");
        return;
      }
      fetchData({ 기간: periodValue, 회차: roundValue || selectedRound });
    }
  };

  // 수정된 handleReset 함수: 최신 조회 버튼 클릭 시 상태 초기화와 함께
  // hasFetchedHighestRound를 false로 재설정하여 자동 최고 회차 조회가 다시 이루어지도록 합니다.
  const handleReset = async () => {
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedWeek("");
    setSelectedRound("");
    setFreePeriod("");
    setHasFetchedHighestRound(false);
    // fetchData가 완료된 후, 전체 distinctPeriods를 다시 불러옴
    const newOrders = await fetchData({ page: 1 });
    if (newOrders && newOrders.total_pages) {
      const totalPages = newOrders.total_pages;
      const periodPromises = [];
      for (let p = 1; p <= totalPages; p++) {
        periodPromises.push(
          fetchOrders({ page: p }).then((res) => {
            if (res.orders && res.orders.length > 0) {
              return res.orders.map(
                (order) =>
                  `${order.기간}.${order.회차 ? order.회차.toString() : "1"}`
              );
            }
            return [];
          })
        );
      }
      try {
        const results = await Promise.all(periodPromises);
        const allPeriods = results.flat();
        const unique = Array.from(new Set(allPeriods));
        setDistinctPeriods(unique);
      } catch (err) {
        console.error("Failed to fetch distinct periods", err);
      }
    }
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
  
  // 헬퍼: 입력값 포맷팅
  const formatInputValue = (value) => {
    if (value === "" || value === undefined || value === null) return "";
    const num = Number(value);
    if (!isNaN(num)) {
      return num.toLocaleString();
    }
    return value;
  };

  // 헬퍼: 수정 모드 시 editedOrders가 있다면, 아니면 기존 orders 값을 사용
  const getCellValue = (row, storeId) => {
    if (isEditMode && editedOrders[row.itemId] && editedOrders[row.itemId][storeId] !== undefined) {
      return editedOrders[row.itemId][storeId];
    }
    return row.orders[storeId];
  };

  const getRowSum = (row) =>
    orderedStores.reduce((sum, store) => {
      const val = getCellValue(row, store.매장_id);
      return sum + (val ? Number(val) : 0);
    }, 0);

  const storeTotals = orderedStores.map((store) =>
    sortedTableRows.reduce((sum, row) => {
      const val = getCellValue(row, store.매장_id);
      return sum + (val ? Number(val) : 0);
    }, 0)
  );
  const grandTotal = sortedTableRows.reduce((sum, row) => sum + getRowSum(row), 0);

  const formatNumber = (num) => {
    if (num === "" || num === undefined || num === null || Number(num) === 0)
      return "-";
    return Number(num).toLocaleString();
  };

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

  const handleOrderChange = (itemId, storeId, value) => {
    setEditedOrders((prev) => ({
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
            기간: ordersData.current_period, // 기존 API가 사용하는 기간
            회차: selectedRound,            // 선택한 회차를 추가합니다.
            매장_발주량: Number(newValue),
          };
          updates.push(updateStoreOrder(payload));
        }
      }
      await Promise.all(updates);
      fetchData({ 기간: ordersData.current_period, 회차: selectedRound });
      setIsEditMode(false);
    } catch (err) {
      console.error("주문 수정 실패:", err);
      alert("주문 수정에 실패하였습니다.");
    }
  };
  

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

  const handleExcelDownload = () => {
    storeOrdersDownloadExcel({
      selectedYear,
      selectedMonth,
      selectedWeek,
      selectedRound,
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
              value={`${selectedYear}.${selectedMonth}.${selectedWeek}.${selectedRound}`}
              onChange={(e) => {
                const parts = e.target.value.split(".");
                const [year, month, week, round] = parts;
                setSelectedYear(year);
                setSelectedMonth(month);
                setSelectedWeek(week);
                setSelectedRound(round);
                const formattedMonth = month.toString().padStart(2, "0");
                const period = `${year}.${formattedMonth}.${week}`;
                handleSearch(period, round);
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
            <th className="so-number-col">No.</th>
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
            {orderedStores.map((store, idx) => (
              <td key={store.매장_id} className="so-order-col">
                {storeTotals[idx] === 0 ? "-" : formatNumber(storeTotals[idx])}
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
