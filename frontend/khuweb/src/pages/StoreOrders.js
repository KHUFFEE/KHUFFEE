import React, { useState, useEffect, useRef } from "react";
import {
  fetchOrders,
  fetchItems,
  fetchSuppliers,
  fetchStores,
  updateStoreOrder,
  getTableStatusList,
  updateTableStatus,
  fetchWarehouseInventory,
} from "../api/api";
import "../styles/StoreOrders.css";
import { storeOrdersDownloadExcel } from "../utils/StoreOrdersDownloadExcel";
import LoadingSpinner from "../components/LoadingSpinner";

const StoreOrders = () => {
  // 기본 상태
  const [ordersData, setOrdersData] = useState(null); // API로부터 받은 주문 데이터
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false); // 초기 로드 시 스피너 없음
  const [error, setError] = useState(null);

  // 수정 모드 관련 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedOrders, setEditedOrders] = useState({});

  // 기간 선택 (YYYY.MM.W.R 형식)
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedRound, setSelectedRound] = useState("");

  // 토글 관련 (현재 사용 안함)
  const [isFreeInput] = useState(false);
  const [freePeriod, setFreePeriod] = useState("");

  // distinctPeriods 배열: "YYYY.MM.W.R" 형식
  const [distinctPeriods, setDistinctPeriods] = useState([]);
  const [refreshDistinct, setRefreshDistinct] = useState(false);
  const [hasFetchedHighestRound, setHasFetchedHighestRound] = useState(false);

  // 드롭다운 open 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef(null);

  // 팝업 관련 상태 (회차 관리)
  const [showPopup, setShowPopup] = useState(false);
  const [managerOrderRound, setManagerOrderRound] = useState(1);

  // New state for warehouse data from 창고_재고 API
  const [warehouseData, setWarehouseData] = useState([]);

  // ----------------------- Helper functions -----------------------
  // Format a Date object as "YYYY.MM.DD"
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  };

  // Compute the Sunday date for a given year, month, week (for past weeks)
  // (If week*7 exceeds the month length, use the last day)
  const getWeekSunday = (year, month, week) => {
    const lastDay = new Date(year, month, 0).getDate();
    let day = week * 7;
    if (day > lastDay) day = lastDay;
    return new Date(year, month - 1, day);
  };

  // ----------------------- Determine if Latest Period -----------------------
  let isLatestPeriod = false;
  if (
    distinctPeriods.length > 0 &&
    selectedYear &&
    selectedMonth &&
    selectedWeek &&
    selectedRound
  ) {
    const sortedDistinct = [...distinctPeriods].sort((a, b) => {
      const [yearA, monthA, weekA, roundA] = a.split(".").map(Number);
      const [yearB, monthB, weekB, roundB] = b.split(".").map(Number);
      if (yearA !== yearB) return yearB - yearA;
      if (monthA !== monthB) return monthB - monthA;
      if (weekA !== weekB) return weekB - weekA;
      return roundB - roundA;
    });
    const currentPeriod = [
      Number(selectedYear),
      Number(selectedMonth),
      Number(selectedWeek),
      Number(selectedRound),
    ].join(".");
    const latestPeriod = sortedDistinct[0]
      .split(".")
      .map(Number)
      .join(".");
    isLatestPeriod = currentPeriod === latestPeriod;
  }

  // Determine if the current period is the latest period
  let isLatestPeriodFlag = false;
  if (
    distinctPeriods.length > 0 &&
    selectedYear &&
    selectedMonth &&
    selectedWeek &&
    selectedRound
  ) {
    const sortedDistinct = [...distinctPeriods].sort((a, b) => {
      const [yearA, monthA, weekA, roundA] = a.split(".").map(Number);
      const [yearB, monthB, weekB, roundB] = b.split(".").map(Number);
      if (yearA !== yearB) return yearB - yearA;
      if (monthA !== monthB) return monthB - monthA;
      if (weekA !== weekB) return weekB - weekA;
      return roundB - roundA;
    });
    const currentPeriod = [
      Number(selectedYear),
      Number(selectedMonth),
      Number(selectedWeek),
      Number(selectedRound),
    ].join(".");
    const latestPeriod = sortedDistinct[0].split(".").map(Number).join(".");
    isLatestPeriodFlag = currentPeriod === latestPeriod;
  }
  
  // ----------------------- Fetch Warehouse Data -----------------------
  // When the selected period (year, month, week) or latest flag changes, compute a date
  // and fetch warehouse inventory from 창고_재고 API.
  useEffect(() => {
    if (selectedYear && selectedMonth && selectedWeek) {
      let computedWarehouseDate = "";
      if (isLatestPeriodFlag) {
        // 최신 주차: 현재 날짜 사용
        computedWarehouseDate = formatDate(new Date());
      } else {
        // 과거 주차: 해당 주의 일요일 사용
        const sunday = getWeekSunday(Number(selectedYear), Number(selectedMonth), Number(selectedWeek));
        computedWarehouseDate = formatDate(sunday);
      }
      // computedWarehouseDate를 이용하여 창고 재고 API 호출
      fetchWarehouseInventory({ 기간: computedWarehouseDate })
        .then((data) => setWarehouseData(data))
        .catch((err) => console.error("창고 재고 불러오기 실패:", err));
    }
  }, [selectedYear, selectedMonth, selectedWeek, isLatestPeriodFlag]);
  

  // ----------------------- Existing API Data Fetch -----------------------
  const fetchData = async (params = { page: 1 }, manual = false) => {
    try {
      if (manual) setLoading(true);
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
      // 품목 API: 활성/비활성 상관없이 모든 품목 조회
      const [itemsData, suppliersData, storesData] = await Promise.all([
        fetchItems(true),
        fetchSuppliers(),
        fetchStores(),
      ]);
      setOrdersData(ordersResponse);
      setItems(itemsData);
      setSuppliers(suppliersData);
      setStores(storesData);
      if (manual) setLoading(false);
      return ordersResponse;
    } catch (err) {
      console.error("데이터 불러오기 실패:", err);
      setError("데이터를 불러오는데 실패하였습니다.");
      if (manual) setLoading(false);
      return null;
    }
  };


  // handleReset: on initial load and "최신 조회" button click
  const handleReset = async (manual = false) => {
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedWeek("");
    setSelectedRound("");
    setFreePeriod("");
    setHasFetchedHighestRound(false);
    if (manual) setLoading(true);
    try {
      const initialOrders = await fetchOrders({ page: 1 });
      const totalPages =
        initialOrders && initialOrders.total_pages ? initialOrders.total_pages : 1;
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
      const results = await Promise.all(periodPromises);
      const allPeriods = results.flat();
      const unique = Array.from(new Set(allPeriods));
      setDistinctPeriods(unique);

      if (unique.length > 0) {
        const sortedPeriods = unique.sort((a, b) => {
          const [yearA, monthA, weekA, roundA] = a.split(".").map(Number);
          const [yearB, monthB, weekB, roundB] = b.split(".").map(Number);
          if (yearA !== yearB) return yearB - yearA;
          if (monthA !== monthB) return monthB - monthA;
          if (weekA !== weekB) return weekB - weekA;
          return roundB - roundA;
        });
        const latest = sortedPeriods[0];
        const parts = latest.split(".");
        setSelectedYear(parts[0]);
        setSelectedMonth(parts[1]);
        setSelectedWeek(parts[2]);
        setSelectedRound(parts[3]);
        const formattedMonth = parts[1].padStart(2, "0");
        const period = `${parts[0]}.${formattedMonth}.${parts[2]}`;
        await fetchData({ 기간: period, 회차: parts[3] }, manual);
        setHasFetchedHighestRound(true);
      } else {
        await fetchData({ page: 1 }, manual);
      }
    } catch (err) {
      console.error("Failed to fetch distinct periods", err);
    }
    if (manual) setLoading(false);
  };

  // handleSearch: when user selects a period via dropdown
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
      fetchData({ 기간: periodValue, 회차: roundValue });
    }
  };

  // Helper to format the store name in header
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

  // 최초 로드 시 handleReset 실행 (로딩 동작 없음)
  useEffect(() => {
    handleReset();
  }, []);

  // Update managerOrderRound on first load
  useEffect(() => {
    const fetchManagerRound = async () => {
      try {
        const statusList = await getTableStatusList();
        const storeOrderStatus = statusList.find((s) => s.테이블 === "매장_발주");
        const currentStatus = storeOrderStatus ? storeOrderStatus.상태 : 1;
        setManagerOrderRound(currentStatus);
      } catch (err) {
        console.error("Failed to fetch manager order round:", err);
        setManagerOrderRound(1);
      }
    };
    fetchManagerRound();
  }, []);

  // displayPeriod 계산 (선택된 값 우선)
  const getDisplayPeriodText = () => {
    if (isFreeInput) {
      return freePeriod && freePeriod.split(".").length === 4
        ? `${freePeriod.split(".")[0]}년 ${freePeriod.split(".")[1].padStart(2, "0")}월 ${freePeriod.split(".")[2]}주차 ${freePeriod.split(".")[3]}회차`
        : freePeriod || "";
    } else if (selectedYear && selectedMonth && selectedWeek && selectedRound) {
      return `${selectedYear}년 ${selectedMonth.padStart(2, "0")}월 ${selectedWeek}주차 ${selectedRound}회차`;
    }
    return "";
  };

  const displayPeriod = getDisplayPeriodText();

  // Group orders data by item
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

  // ★ 요청사항 반영 ★  
  // 기본 행: 주문 데이터의 품목_id를 기준으로 구성
  const orderItemIds = Object.keys(ordersByItem);
  const tableRowsFromOrders = orderItemIds.map((itemId) => {
    const matchedItem = items.find((item) => item.품목_id === itemId);
    const supplier = matchedItem ? suppliers.find((s) => s.협력사_id === matchedItem.협력사_id) : {};
    return {
      itemId,
      supplierName: supplier ? supplier.협력사명 : "N/A",
      itemName: matchedItem ? matchedItem.품목명 : "N/A",
      type: matchedItem ? matchedItem.종류 : "",
      orders: ordersByItem[itemId] || {},
    };
  });
  // 추가 행: 활성화되어 있는 품목 중 주문 데이터에 포함되지 않은 항목들
  const activeItemsNotInOrders = items.filter(
    (item) => item.활성화 && !orderItemIds.includes(item.품목_id)
  );
  const tableRowsFromActive = activeItemsNotInOrders.map((item) => {
    const supplier = suppliers.find((s) => s.협력사_id === item.협력사_id) || {};
    return {
      itemId: item.품목_id,
      supplierName: supplier.협력사명 || "N/A",
      itemName: item.품목명 || "N/A",
      type: item.종류 || "",
      orders: {},
    };
  });
  const tableRows = [...tableRowsFromOrders, ...tableRowsFromActive];

  const sortedTableRows = tableRows.sort((a, b) => {
    const cmpSupplier = a.supplierName.localeCompare(b.supplierName);
    if (cmpSupplier !== 0) return cmpSupplier;
    const cmpType = a.type.localeCompare(b.type);
    if (cmpType !== 0) return cmpType;
    return a.itemName.localeCompare(b.itemName);
  });

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
  const orderedStores = desiredStoreOrder
    .map((storeName) => stores.find((s) => s.매장명 === storeName))
    .filter(Boolean);

  const formatInputValue = (value) => {
    if (value === "" || value === undefined || value === null) return "";
    const num = Number(value);
    if (!isNaN(num)) {
      return num.toLocaleString();
    }
    return value;
  };

  const getCellValue = (row, storeId) => {
    if (
      isEditMode &&
      editedOrders[row.itemId] &&
      editedOrders[row.itemId][storeId] !== undefined
    ) {
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
    if (
      num === "" ||
      num === undefined ||
      num === null ||
      Number(num) === 0
    )
      return "-";
    return Number(num).toLocaleString();
  };

  // New: Helper to get warehouse value for a given item (summing over ordered stores)
  const getWarehouseValue = (itemId) => {
    if (!warehouseData || warehouseData.length === 0) return 0;
    // 현재 화면에 표시된 품목(itemId)에 해당하는 창고 재고 데이터를 필터링
    const matchingRecords = warehouseData.filter(
      (record) => record.품목_id === itemId
    );
    // 여러 매장의 값이 있을 경우, 첫 번째 레코드의 창고_재고량을 사용 (필요에 따라 합산 가능)
    return matchingRecords.length > 0
      ? Number(matchingRecords[0].창고_재고량 || 0)
      : 0;
  };
  

  // Compute total warehouse value for footer
  const warehouseTotal = sortedTableRows.reduce(
    (sum, row) => sum + getWarehouseValue(row.itemId),
    0
  );  

  // 수정 모드 토글 및 관련 이벤트 핸들러
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
            기간: ordersData?.current_period || "",
            회차: selectedRound,
            매장_발주량: Number(newValue),
          };
          updates.push(updateStoreOrder(payload));
        }
      }
      await Promise.all(updates);
      fetchData({ 기간: ordersData?.current_period || "", 회차: selectedRound });
      setIsEditMode(false);
    } catch (err) {
      console.error("주문 수정 실패:", err);
      alert("주문 수정에 실패하였습니다.");
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

  // 회차 관리 버튼 클릭 시: getTableStatusList API 호출 후 팝업 표시
  const handleSessionButtonClick = async () => {
    try {
      const statusList = await getTableStatusList();
      const storeOrderStatus = statusList.find((s) => s.테이블 === "매장_발주");
      const currentStatus = storeOrderStatus ? storeOrderStatus.상태 : 1;
      setManagerOrderRound(currentStatus);
    } catch (err) {
      console.error("테이블 상태 조회 실패:", err);
      setManagerOrderRound(1);
    }
    setShowPopup(true);
  };

  const handleUpdateSession = async () => {
    try {
      const newRound = managerOrderRound + 1;
      await updateTableStatus({ 테이블: "매장_발주", 상태: newRound });
      setManagerOrderRound(newRound);
      setShowPopup(false);
    } catch (err) {
      console.error("회차 관리 업데이트 실패:", err);
      alert("회차 관리 업데이트에 실패하였습니다.");
    }
  };



  if (loading) return <LoadingSpinner />;
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
              {distinctPeriods
                .sort((a, b) => {
                  const [yearA, monthA, weekA, roundA] = a.split(".").map(Number);
                  const [yearB, monthB, weekB, roundB] = b.split(".").map(Number);
                  if (yearA !== yearB) return yearB - yearA;
                  if (monthA !== monthB) return monthB - monthA;
                  if (weekA !== weekB) return weekB - weekA;
                  return roundB - roundA;
                })
                .map((dp) => {
                  const parts = dp.split(".");
                  const label = `${parts[0]}년 ${parts[1].padStart(2, "0")}월 ${parts[2]}주차 ${parts[3]}회차`;
                  return (
                    <option key={dp} value={dp}>
                      {label}
                    </option>
                  );
                })}
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
          <button className="reset-button" onClick={() => handleReset(true)} disabled={isEditMode}>
            최신 조회
          </button>
          <span className="control-description">
            현재 매니저의 발주는 {managerOrderRound}회차로 저장됩니다.
            <br />
            {managerOrderRound + 1}회차로 변경하려면 회차 관리 버튼을 클릭해주세요.
          </span>
        </div>
        <div className="store-action-buttons">
          {isLatestPeriodFlag && (
            <button className="session-button" onClick={handleSessionButtonClick} disabled={isEditMode}>
              회차 관리
            </button>
          )}
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
            {/* New "창고" header added before the "합계" column */}
            <th className="so-warehouse-col">창고</th>
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
                        editedOrders[row.itemId] && editedOrders[row.itemId][store.매장_id] !== undefined
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
              {/* New "창고" column cell: display the aggregated warehouse inventory value for the product */}
              <td className="so-warehouse-col">
                {formatNumber(getWarehouseValue(row.itemId))}
              </td>
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
            {/* New warehouse footer cell */}
            <td className="so-warehouse-col">
              {warehouseTotal === 0 ? "-" : formatNumber(warehouseTotal)}
            </td>
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
      {/* 회차 관리 팝업 */}
      {showPopup && (
        <div className="order-popup">
          <div className="order-popup-content">
            <h3>!! 주의 !!</h3>
            <p>
              현재 매니저의 발주는 {managerOrderRound}회차로 저장됩니다.
              <br />
              {managerOrderRound + 1}회차로 변경하려면 변경 버튼을 클릭해주세요.
            </p>
            <div className="order-popup-buttons">
              <button className="popup-cancel" onClick={() => setShowPopup(false)}>
                취소
              </button>
              <button className="popup-confirm" onClick={handleUpdateSession}>
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreOrders;
