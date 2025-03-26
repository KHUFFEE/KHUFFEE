// frontend/khuweb/src/pages/WarehouseOrder.js
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import {
  fetchWarehouseOrders,
  fetchItems,
  fetchSuppliers,
  fetchWarehouseInventory,
  fetchWarehouseOutgoing,
  updateWarehouseOrder,
  createWarehouseOrder,
} from "../api/api";
import "../styles/WarehouseOrder.css";
import "../styles/table.css";
import LoadingSpinner from "../components/LoadingSpinner";

const WarehouseOrder = () => {
  // API 데이터 및 에러/로딩 상태
  const [ordersData, setOrdersData] = useState(null); // fetchWarehouseOrders 응답 (orders, total_pages 등)
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 기간(년, 월, 회차) 선택 관련 상태 (형식: "YYYY.MM.회차")
  const [distinctPeriods, setDistinctPeriods] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedRound, setSelectedRound] = useState("");

  // 드롭다운 관련
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef(null);

  // 추가: 창고 재고 데이터와 최신 기간 정보를 위한 상태
  const [prevInvData, setPrevInvData] = useState([]);
  const [currInvData, setCurrInvData] = useState([]);
  const [latestPeriod, setLatestPeriod] = useState("");

  // 추가: 창고 출고 데이터 (월 출고량) 상태 – 각 기간별(전년도 m1, m2, m3 및 현재월) 항목별 집계
  const [prevOutgoingM1, setPrevOutgoingM1] = useState({});
  const [prevOutgoingM2, setPrevOutgoingM2] = useState({});
  const [prevOutgoingM3, setPrevOutgoingM3] = useState({});
  const [currentMonthlyOutgoing, setCurrentMonthlyOutgoing] = useState({});

  // ----------------------- 수정(편집) 모드 상태 및 핸들러 (발주량 수정) -----------------------
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState({});

  // 발주 오픈하기 모달 관련 상태
  const [warehouseOpenModalVisible, setWarehouseOpenModalVisible] =
    useState(false);
  const [warehouseOpenModalData, setWarehouseOpenModalData] = useState({
    year: selectedYear || new Date().getFullYear().toString(),
    month: selectedMonth || String(new Date().getMonth() + 1).padStart(2, "0"),
    round: selectedRound || "1",
  });

  // 모달 내 토글 드롭다운 상태
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [roundDropdownOpen, setRoundDropdownOpen] = useState(false);

  // 연, 월, 회차 옵션 (StoreOrders.js와 동일한 형식)
  const currentYear = new Date().getFullYear();
  const years = [];
  let minYear = currentYear;
  let maxYear = currentYear;
  if (distinctPeriods.length > 0) {
    const yearsFromDP = distinctPeriods.map((dp) =>
      parseInt(dp.split(".")[0], 10)
    );
    minYear = Math.min(...yearsFromDP);
    maxYear = Math.max(...yearsFromDP);
  }
  for (let y = minYear; y <= maxYear + 1; y++) {
    years.push(y);
  }
  const months = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const rounds = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  const handleEditToggle = () => {
    if (!isEditMode) {
      // 초기값 설정: 각 행의 발주량
      const init = {};
      tableRows.forEach((row) => {
        init[row.itemId] = row.orderAmount;
      });
      setEditedOrder(init);
    }
    setIsEditMode(!isEditMode);
  };

  const handleOrderChange = (itemId, value) => {
    const valueWithoutCommas = value.replace(/,/g, "");
    const numericValue = valueWithoutCommas.replace(/\D/g, "");
    setEditedOrder((prev) => ({
      ...prev,
      [itemId]: numericValue,
    }));
  };

  const handleEditSubmit = async () => {
    try {
      const updates = [];
      const defaultStoreId = "ST_102";
      const period = `${selectedYear}.${selectedMonth}`; // "YYYY.MM" 형식
      const round = selectedRound;
      tableRows.forEach((row) => {
        const edited = editedOrder[row.itemId];
        if (
          edited !== undefined &&
          Number(edited) !== Number(row.orderAmount)
        ) {
          const payload = {
            매장_id: defaultStoreId,
            품목_id: row.itemId,
            기간: period,
            회차: round,
            창고_발주량: Number(edited),
          };
          updates.push(updateWarehouseOrder(payload));
        }
      });
      await Promise.all(updates);
      await fetchData({ 기간: period, 회차: selectedRound }, false);
      setIsEditMode(false);
    } catch (err) {
      console.error("수정 실패:", err);
      alert("수정에 실패하였습니다.");
    }
  };
  // --------------------------------------------------------------------------------------------

  // ----------------------- 데이터 조회 함수 -----------------------
  // WarehouseOrder 데이터와 품목, 협력사, 그리고 창고 재고 및 창고 출고(월 출고량) 데이터를 가져옴.
  // params: { 기간, 회차 } (기간: "YYYY.MM" 형식)
  const fetchData = async (params = { page: 1 }, manual = false) => {
    try {
      if (manual) setLoading(true);
      let url = `${process.env.REACT_APP_API_URL}/api/orders/warehouse_order_list/?`;
      if (params.기간) {
        url += `기간=${params.기간}`;
      } else {
        url += `page=${params.page || 1}`;
      }
      if (params.회차) {
        url += `&회차=${params.회차}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch warehouse orders");
      }
      const data = await response.json();
      setOrdersData(data);
      const [itemsRes, suppliersRes] = await Promise.all([
        fetchItems(true),
        fetchSuppliers(),
      ]);
      setItems(itemsRes);
      setSuppliers(suppliersRes);

      // ----------------- 창고 재고 데이터 불러오기 -----------------
      if (params.기간) {
        // params.기간은 "YYYY.MM" 형식이므로 분해
        const [year, month] = params.기간.split(".");
        const numericYear = parseInt(year, 10);
        const numericMonth = parseInt(month, 10);

        // 전월 재고: 선택된 기간의 전달 마지막 일자 계산
        let prevYear, prevMonth;
        if (numericMonth === 1) {
          prevYear = numericYear - 1;
          prevMonth = 12;
        } else {
          prevYear = numericYear;
          prevMonth = numericMonth - 1;
        }
        const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
        const prevDateStr = `${prevYear}.${String(prevMonth).padStart(2, "0")}.${String(prevLastDay).padStart(2, "0")}`;

        // 현 재고: 최신 기간이면 현재 날짜, 그렇지 않으면 선택된 달의 마지막 일자 사용
        // 현 재고: 최신 기간이면 현재 날짜, 그렇지 않으면 선택된 달의 마지막 일자 사용
        const selectedLastDay = new Date(
          numericYear,
          numericMonth,
          0
        ).getDate();
        const selectedLastDayStr = `${numericYear}.${String(numericMonth).padStart(2, "0")}.${String(selectedLastDay).padStart(2, "0")}`;
        const selectedYM = `${numericYear}.${String(numericMonth).padStart(2, "0")}`;
        // 수정: latestPeriod가 없으면 현재 기간(selectedYM)으로 가정
        const computedLatestYM = latestPeriod
          ? `${latestPeriod.split(".")[0]}.${latestPeriod.split(".")[1].padStart(2, "0")}`
          : selectedYM;
        let currentInvDateStr = selectedLastDayStr;
        if (selectedYM === computedLatestYM) {
          const now = new Date();
          currentInvDateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
        }

        // 두 날짜에 대해 창고 재고 API 호출
        const [prevInvRes, currInvRes] = await Promise.all([
          fetchWarehouseInventory({ 기간: prevDateStr }),
          fetchWarehouseInventory({ 기간: currentInvDateStr }),
        ]);
        setPrevInvData(prevInvRes);
        setCurrInvData(currInvRes);
      }
      // ----------------- 창고 출고(월 출고량) 데이터 불러오기 -----------------
      // params.기간은 "YYYY.MM" 형식임을 전제로 함 → 현재 월 출고량 및 전년도 동일기간부터 m1, m2, m3월 집계
      if (params.기간) {
        const currentPeriod = params.기간; // "YYYY.MM"
        const [year, month] = currentPeriod.split(".");
        const prevYear = Number(year) - 1;
        const m = Number(month);
        const m1 = m; // 전년도 m1월은 현재 선택월과 동일
        const m2 = m + 1 > 12 ? m + 1 - 12 : m + 1;
        const m3 = m + 2 > 12 ? m + 2 - 12 : m + 2;
        const periodPrevM1 = `${prevYear}.${String(m1).padStart(2, "0")}`;
        const periodPrevM2 = `${prevYear}.${String(m2).padStart(2, "0")}`;
        const periodPrevM3 = `${prevYear}.${String(m3).padStart(2, "0")}`;

        // 각 기간별로, WarehouseOutgoing API 호출 (기간에 대해 1~5주차 집계)
        const [
          outgoingCurrent,
          outgoingPrevM1,
          outgoingPrevM2,
          outgoingPrevM3,
        ] = await Promise.all([
          fetchWarehouseOutgoing({
            기간: `${currentPeriod}.1~${currentPeriod}.5`,
          }),
          fetchWarehouseOutgoing({
            기간: `${periodPrevM1}.1~${periodPrevM1}.5`,
          }),
          fetchWarehouseOutgoing({
            기간: `${periodPrevM2}.1~${periodPrevM2}.5`,
          }),
          fetchWarehouseOutgoing({
            기간: `${periodPrevM3}.1~${periodPrevM3}.5`,
          }),
        ]);

        // helper: 주문 데이터(orders)를 품목별 월 출고량으로 집계
        const groupOutgoingData = (data) => {
          const grouped = {};
          if (data && data.orders) {
            data.orders.forEach((record) => {
              const itemId = record.품목_id;
              const value = Number(record.창고_출고량) || 0;
              if (!grouped[itemId]) {
                grouped[itemId] = 0;
              }
              grouped[itemId] += value;
            });
          }
          return grouped;
        };

        setCurrentMonthlyOutgoing(groupOutgoingData(outgoingCurrent));
        setPrevOutgoingM1(groupOutgoingData(outgoingPrevM1));
        setPrevOutgoingM2(groupOutgoingData(outgoingPrevM2));
        setPrevOutgoingM3(groupOutgoingData(outgoingPrevM3));
      }
      // -----------------------------------------------------------
      if (manual) setLoading(false);
      return data;
    } catch (err) {
      console.error("창고 발주 데이터 불러오기 실패:", err);
      setError("데이터를 불러오는데 실패하였습니다.");
      if (manual) setLoading(false);
      return null;
    }
  };

  // distinctPeriods 조회: 창고_발주의 기간 정보를 "YYYY.MM.회차" 형식으로 중복 제거 후 정렬
  const handleReset = async (manual = false) => {
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedRound("");
    try {
      if (manual) setLoading(true);
      const initialOrders = await fetchWarehouseOrders({ page: 1 });
      const totalPages =
        initialOrders && initialOrders.total_pages
          ? initialOrders.total_pages
          : 1;
      const periodPromises = [];
      for (let p = 1; p <= totalPages; p++) {
        periodPromises.push(
          fetchWarehouseOrders({ page: p }).then((res) => {
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
          const [yearA, monthA, roundA] = a.split(".").map(Number);
          const [yearB, monthB, roundB] = b.split(".").map(Number);
          if (yearA !== yearB) return yearB - yearA;
          if (monthA !== monthB) return monthB - monthA;
          return roundB - roundA;
        });
        const latest = sortedPeriods[0];
        setLatestPeriod(latest);
        const parts = latest.split(".");
        setSelectedYear(parts[0]);
        setSelectedMonth(parts[1]);
        setSelectedRound(parts[2]);
        const period = `${parts[0]}.${parts[1]}`; // API에서는 "YYYY.MM" 형식 사용
        await fetchData({ 기간: period, 회차: parts[2] }, manual);
      } else {
        await fetchData({ page: 1 }, manual);
      }
      if (manual) setLoading(false);
    } catch (err) {
      console.error("Failed to fetch distinct periods", err);
      if (manual) setLoading(false);
    }
  };

  // 최초 로드 시 handleReset 실행
  useEffect(() => {
    handleReset();
  }, []);

  // 드롭다운 선택 변경 시 (value: "YYYY.MM.회차")
  const handleSearch = (value) => {
    const parts = value.split(".");
    if (parts.length === 3) {
      const [year, month, round] = parts;
      setSelectedYear(year);
      setSelectedMonth(month);
      setSelectedRound(round);
      const period = `${year}.${month}`;
      fetchData({ 기간: period, 회차: round });
    }
  };

  // 표시용: "YYYY년 MM월 X회차" 형식으로 변환
  const getDisplayPeriodText = () => {
    if (selectedYear && selectedMonth && selectedRound) {
      return `${selectedYear}년 ${selectedMonth.padStart(2, "0")}월 ${selectedRound}회차`;
    }
    return "";
  };

  const displayPeriod = getDisplayPeriodText();

  // ----------------------- 테이블 데이터 구성 -----------------------
  // ordersData.orders를 품목별로 그룹화 (창고_발주량 합산)
  const groupedOrders = {};
  if (ordersData && ordersData.orders) {
    ordersData.orders.forEach((order) => {
      const itemId = order.품목_id;
      groupedOrders[itemId] =
        (groupedOrders[itemId] || 0) + Number(order.창고_발주량);
    });
  }

  // 그룹화된 데이터를 바탕으로 각 행(품목) 정보 구성
  // (품목명, 협력사, 규격, 입고단가, 입고단위단가, 전월 재고, 현재고 포함)
  const tableRows = Object.keys(groupedOrders).map((itemId) => {
    const matchedItem = items.find((i) => i.품목_id === itemId);
    const itemName = matchedItem ? matchedItem.품목명 : "N/A";
    const supplier = matchedItem
      ? suppliers.find((s) => s.협력사_id === matchedItem.협력사_id) || {}
      : {};
    // 전월/현 재고 데이터 조회
    const prevRecord = prevInvData.find((r) => r.품목_id === itemId);
    const currRecord = currInvData.find((r) => r.품목_id === itemId);
    // 추가: 창고 출고(월 출고량) 데이터 – 전년도 및 현재 월
    const prevOut1 = prevOutgoingM1[itemId] || 0;
    const prevOut2 = prevOutgoingM2[itemId] || 0;
    const prevOut3 = prevOutgoingM3[itemId] || 0;
    const currentOut = currentMonthlyOutgoing[itemId] || 0;
    const monthlyOutputAmount =
      currentOut * (matchedItem ? Number(matchedItem.입고단가) : 0);

    return {
      itemId,
      supplierName: supplier.협력사명 || "N/A",
      itemName,
      type: matchedItem ? matchedItem.종류 : "",
      orderAmount: groupedOrders[itemId] || 0,
      unitPrice: matchedItem ? Number(matchedItem.입고단가) : 0,
      규격: matchedItem ? matchedItem.규격 : "",
      // 기존 필드들
      입고단가: matchedItem ? matchedItem.입고단가 : "",
      입고단위단가: matchedItem ? matchedItem.입고단위단가 : "",
      prevInv: prevRecord ? prevRecord.창고_재고량 : "-",
      currInv: currRecord ? currRecord.창고_재고량 : "-",
      // 추가된 창고 출고 데이터
      prevOutgoing1: prevOut1,
      prevOutgoing2: prevOut2,
      prevOutgoing3: prevOut3,
      currentOutgoing: currentOut,
      monthlyOutputAmount,
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

  // 발주금액: 각 행에서 (발주량 x 입고단가)
  const calculateOrderMoney = (row) => {
    const orderAmount =
      isEditMode && editedOrder[row.itemId] !== undefined
        ? Number(editedOrder[row.itemId])
        : Number(row.orderAmount);
    const price = Number(row.입고단가) || 0;
    return orderAmount * price;
  };

  // 현재고 금액: 각 행에서 (입고단가 x 현재고)
  const calculateCurrentInvMoney = (row) => {
    const currInv = Number(row.currInv);
    const price = Number(row.입고단가) || 0;
    if (!isNaN(currInv)) {
      return currInv * price;
    }
    return 0;
  };

  // ----------------------- 공급업체별 병합 셀 계산 -----------------------
  // 각 공급업체별로 행 개수와 발주금액 합계를 계산 (부가세 별도/포함)
  const supplierGroupCounts = {};
  const supplierGroupOrderSums = {};
  tableRows.forEach((row) => {
    if (!supplierGroupCounts[row.supplierName]) {
      supplierGroupCounts[row.supplierName] = 0;
    }
    supplierGroupCounts[row.supplierName] += 1;
    if (!supplierGroupOrderSums[row.supplierName]) {
      supplierGroupOrderSums[row.supplierName] = { sumEx: 0, sumInc: 0 };
    }
    const orderMoney = calculateOrderMoney(row);
    supplierGroupOrderSums[row.supplierName].sumEx += orderMoney;
    supplierGroupOrderSums[row.supplierName].sumInc += orderMoney * 1.1;
  });

  // 현재 선택된 월(selectedMonth)을 기준으로 전년도 월 헤더 계산
  let prevYearHeaders = [];
  if (selectedMonth) {
    const m = Number(selectedMonth);
    const m1 = m;
    const m2 = m + 1 > 12 ? m + 1 - 12 : m + 1;
    const m3 = m + 2 > 12 ? m + 2 - 12 : m + 2;
    prevYearHeaders = [
      <>
        전년도
        <br />
        {m1}월
      </>,
      <>
        전년도
        <br />
        {m2}월
      </>,
      <>
        전년도
        <br />
        {m3}월
      </>,
    ];
  } else {
    prevYearHeaders = [
      <>
        전년도
        <br />
        ?월
      </>,
      <>
        전년도
        <br />
        ?월
      </>,
      <>
        전년도
        <br />
        ?월
      </>,
    ];
  }

  // ----------------------- 합계 계산 (Footer) -----------------------
  const totalPrevInv = tableRows.reduce((sum, row) => {
    let val = 0;
    if (row.prevInv && row.prevInv !== "-" && !isNaN(Number(row.prevInv))) {
      val = Number(row.prevInv);
    }
    return sum + val;
  }, 0);

  const totalCurrInv = tableRows.reduce((sum, row) => {
    let val = 0;
    if (row.currInv && row.currInv !== "-" && !isNaN(Number(row.currInv))) {
      val = Number(row.currInv);
    }
    return sum + val;
  }, 0);

  const totalCurrentInvMoney = tableRows.reduce(
    (sum, row) => sum + calculateCurrentInvMoney(row),
    0
  );

  const totalOrderAmount = tableRows.reduce(
    (sum, row) => sum + Number(row.orderAmount || 0),
    0
  );
  const totalOrderMoney = tableRows.reduce(
    (sum, row) => sum + calculateOrderMoney(row),
    0
  );

  const totalPrevOutgoing1 = tableRows.reduce(
    (sum, row) => sum + Number(row.prevOutgoing1 || 0),
    0
  );
  const totalPrevOutgoing2 = tableRows.reduce(
    (sum, row) => sum + Number(row.prevOutgoing2 || 0),
    0
  );
  const totalPrevOutgoing3 = tableRows.reduce(
    (sum, row) => sum + Number(row.prevOutgoing3 || 0),
    0
  );
  const totalCurrentOutgoing = tableRows.reduce(
    (sum, row) => sum + Number(row.currentOutgoing || 0),
    0
  );
  const totalMonthlyOutputAmount = tableRows.reduce(
    (sum, row) => sum + Number(row.monthlyOutputAmount || 0),
    0
  );

  // 다운로드 버튼 (동작 비활성화)
  const handleExcelDownload = () => {
    alert("다운로드 기능은 현재 비활성화되어 있습니다.");
  };

  const handleWarehouseOpenModalConfirm = async () => {
    const { year, month, round } = warehouseOpenModalData;
    const formattedMonth = month.toString().padStart(2, "0");
    const period = `${year}.${formattedMonth}`; // API에서는 "YYYY.MM" 형식 사용
    try {
      // 활성화된 품목에 대해 창고 발주 생성 (창고_발주량 0)
      const activeItems = items.filter((item) => item.활성화);
      const createPromises = activeItems.map((item) => {
        const payload = {
          매장_id: "ST_102", // 기본 창고 ID (필요 시 수정)
          품목_id: item.품목_id,
          기간: period,
          회차: Number(round),
          창고_발주량: 0,
        };
        return createWarehouseOrder(payload);
      });
      await Promise.all(createPromises);
      await handleReset(true); // 데이터 새로고침
      setWarehouseOpenModalVisible(false);
    } catch (err) {
      console.error("회차 생성 실패:", err);
      alert("회차 생성 처리에 실패하였습니다.");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div>{error}</div>;

  return (
    <div className="wo-container">
      <h2 className="title">창고 발주 관리</h2>
      <div className="period-controls">
        <div className="period-search">
          {/* 기간 선택 드롭다운 (년/월/회차) – 수정 모드일 때 흐릿하게 */}
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
            <div className="select-display">{displayPeriod || "기간 선택"}</div>
            <select
              ref={selectRef}
              value={
                selectedYear && selectedMonth && selectedRound
                  ? `${selectedYear}.${selectedMonth}.${selectedRound}`
                  : ""
              }
              onChange={(e) => {
                handleSearch(e.target.value);
                setIsDropdownOpen(false);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setIsDropdownOpen(false)}
              className="custom-select"
            >
              {distinctPeriods
                .sort((a, b) => {
                  const [yA, mA, rA] = a.split(".").map(Number);
                  const [yB, mB, rB] = b.split(".").map(Number);
                  if (yA !== yB) return yB - yA;
                  if (mA !== mB) return mB - mA;
                  return rB - rA;
                })
                .map((dp) => {
                  const parts = dp.split(".");
                  const label = `${parts[0]}년 ${parts[1].padStart(2, "0")}월 ${parts[2]}회차`;
                  return (
                    <option key={dp} value={dp}>
                      {label}
                    </option>
                  );
                })}
            </select>
            <span className="toggle">
              <svg width="24" height="24" viewBox="0 0 22 22">
                <path
                  d="M7 10l5 5 5-5z"
                  fill="#445382"
                  transform={isDropdownOpen ? "rotate(180 11 11)" : ""}
                />
              </svg>
            </span>
          </div>
          <button
            className="reset-button"
            onClick={() => handleReset(true)}
            disabled={isEditMode}
            style={{ opacity: isEditMode ? 0.5 : 1 }}
          >
            최신 조회
          </button>
          <div className="status-message" style={{ whiteSpace: "pre-wrap" }}>
            창고 발주 테이블은 매월 1일 1회차로 자동 생성됩니다. <br />
            새로운 회차를 관리하고 싶으시면 "회차 생성" 버튼을 클릭해주세요.
          </div>
        </div>
        <div className="warehouse-action-buttons">
          {!isEditMode &&
            selectedYear &&
            selectedMonth &&
            selectedRound &&
            `${selectedYear}.${selectedMonth}.${selectedRound}` ===
              latestPeriod && (
              <button
                className="status-open-button"
                onClick={() => setWarehouseOpenModalVisible(true)}
              >
                회차 생성
              </button>
            )}

          {/* 수정 모드일 때 Excel 다운로드 버튼 숨김 */}
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
      <table className="big-table">
        <thead>
          <tr>
            <th className="wo-number-col">No.</th>
            <th className="wo-supplier-col">협력사</th>
            <th className="wo-item-col">품목명</th>
            <th className="wo-spec-col">규격</th>
            <th className="wo-price-col">입고단가</th>
            <th className="wo-inunitprice-col">
              입고단위
              <br />
              단가
            </th>
            <th className="wo-previnv-col">전월재고</th>
            <th className="wo-currinv-col">현재고</th>
            <th className="wo-currentinv-money-col">
              현재고
              <br />
              금액
            </th>
            <th className="wo-sum-col">발주량</th>
            <th className="wo-ordermoney-col">발주금액</th>
            <th className="wo-order-sum-ex-col">
              발주합계
              <br />
              부가세x
            </th>
            <th className="wo-order-sum-inc-col">
              발주합계
              <br />
              부가세o
            </th>
            <th className="wo-prev-month1-col">{prevYearHeaders[0]}</th>
            <th className="wo-prev-month2-col">{prevYearHeaders[1]}</th>
            <th className="wo-prev-month3-col">{prevYearHeaders[2]}</th>
            <th className="wo-monthly-output-col">
              월<br />
              출고량
            </th>
            <th className="wo-monthly-outputmoney-col">
              월<br />
              출고금액
            </th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, index) => {
            const isFirstRowOfGroup =
              index === 0 ||
              row.supplierName !== tableRows[index - 1].supplierName;
            return (
              <tr key={row.itemId}>
                <td className="wo-number-col">{index + 1}</td>
                <td className="wo-supplier-col">
                  <div className="wo-supplier-cell">{row.supplierName}</div>
                </td>
                <td className="wo-item-col">
                  <div className="wo-item-cell">{row.itemName}</div>
                </td>
                <td className="wo-spec-col">
                  <div className="wo-spec-cell">{row.규격 || "-"}</div>
                </td>
                <td className="wo-price-col">
                  {row.입고단가 ? formatNumber(row.입고단가) : "-"}
                </td>
                <td className="wo-inunitprice-col">
                  {row.입고단위단가 ? formatNumber(row.입고단위단가) : "-"}
                </td>
                <td className="wo-previnv-col">
                  {row.prevInv !== "-" ? formatNumber(row.prevInv) : "-"}
                </td>
                <td className="wo-currinv-col">
                  {row.currInv !== "-" ? formatNumber(row.currInv) : "-"}
                </td>
                <td className="wo-currentinv-money-col">
                  {row.currInv !== "-" && row.입고단가
                    ? formatNumber(calculateCurrentInvMoney(row))
                    : "-"}
                </td>
                <td className="wo-sum-col">
                  {isEditMode ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        editedOrder[row.itemId] !== undefined
                          ? formatNumber(editedOrder[row.itemId])
                          : ""
                      }
                      onChange={(e) =>
                        handleOrderChange(row.itemId, e.target.value)
                      }
                      style={{ textAlign: "right" }}
                    />
                  ) : (
                    formatNumber(row.orderAmount)
                  )}
                </td>
                <td className="wo-ordermoney-col">
                  {formatNumber(calculateOrderMoney(row))}
                </td>
                {isFirstRowOfGroup && (
                  <>
                    <td
                      className="wo-order-sum-ex-col"
                      rowSpan={supplierGroupCounts[row.supplierName]}
                    >
                      {formatNumber(
                        supplierGroupOrderSums[row.supplierName].sumEx
                      )}
                    </td>
                    <td
                      className="wo-order-sum-inc-col"
                      rowSpan={supplierGroupCounts[row.supplierName]}
                    >
                      {formatNumber(
                        supplierGroupOrderSums[row.supplierName].sumInc
                      )}
                    </td>
                  </>
                )}
                <td className="wo-prev-month1-col">
                  {formatNumber(row.prevOutgoing1)}
                </td>
                <td className="wo-prev-month2-col">
                  {formatNumber(row.prevOutgoing2)}
                </td>
                <td className="wo-prev-month3-col">
                  {formatNumber(row.prevOutgoing3)}
                </td>
                <td className="wo-monthly-output-col">
                  {formatNumber(row.currentOutgoing)}
                </td>
                <td className="wo-monthly-outputmoney-col">
                  {formatNumber(row.monthlyOutputAmount)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            {/* No. 열: 빈셀 */}
            <td className="wo-number-col"></td>
            {/* 협력사, 품목명, 규격, 입고단가, 입고단위단가 병합 (colSpan=5) */}
            <td
              className="wo-supplier-col"
              colSpan="5"
              style={{ textAlign: "center" }}
            >
              합계
            </td>
            {/* 전월재고 */}
            <td className="wo-previnv-col">
              {totalPrevInv ? formatNumber(totalPrevInv) : "-"}
            </td>
            {/* 현재고 */}
            <td className="wo-currinv-col">
              {totalCurrInv ? formatNumber(totalCurrInv) : "-"}
            </td>
            {/* 현재고 금액 */}
            <td className="wo-currentinv-money-col">
              {totalCurrentInvMoney ? formatNumber(totalCurrentInvMoney) : "-"}
            </td>
            {/* 발주량 */}
            <td className="wo-sum-col">
              {totalOrderAmount ? formatNumber(totalOrderAmount) : "-"}
            </td>
            {/* 발주금액 */}
            <td className="wo-ordermoney-col">
              {totalOrderMoney ? formatNumber(totalOrderMoney) : "-"}
            </td>
            {/* 발주합계 부가세x (빈셀) */}
            <td className="wo-order-sum-ex-col"></td>
            {/* 발주합계 부가세o (빈셀) */}
            <td className="wo-order-sum-inc-col"></td>
            {/* 전년도 m1 */}
            <td className="wo-prev-month1-col">
              {totalPrevOutgoing1 ? formatNumber(totalPrevOutgoing1) : "-"}
            </td>
            {/* 전년도 m2 */}
            <td className="wo-prev-month2-col">
              {totalPrevOutgoing2 ? formatNumber(totalPrevOutgoing2) : "-"}
            </td>
            {/* 전년도 m3 */}
            <td className="wo-prev-month3-col">
              {totalPrevOutgoing3 ? formatNumber(totalPrevOutgoing3) : "-"}
            </td>
            {/* 월 출고량 */}
            <td className="wo-monthly-output-col">
              {totalCurrentOutgoing ? formatNumber(totalCurrentOutgoing) : "-"}
            </td>
            {/* 월 출고금액 */}
            <td className="wo-monthly-outputmoney-col">
              {totalMonthlyOutputAmount
                ? formatNumber(totalMonthlyOutputAmount)
                : "-"}
            </td>
          </tr>
        </tfoot>
      </table>
      {warehouseOpenModalVisible && (
        <div className="sime-popup">
          <div className="sime-popup-content">
            <h3>기간 설정</h3>
            <div className="toggle-group-container">
              {/* 년도 토글 */}
              <div className="toggle-group">
                <button
                  className="period-select-box"
                  onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                >
                  {warehouseOpenModalData.year}
                  <span className="toggle">
                    <svg width="16" height="16" viewBox="0 0 22 22">
                      <path
                        d="M7 10l5 5 5-5z"
                        fill="#445382"
                        transform={yearDropdownOpen ? "rotate(180 11 11)" : ""}
                      />
                    </svg>
                  </span>
                </button>
                <span className="toggle-label">년도</span>
                {yearDropdownOpen && (
                  <div className="dropdown-options">
                    {years.map((yr) => (
                      <div
                        key={yr}
                        className={`dropdown-option ${yr === warehouseOpenModalData.year ? "selected-dropdown-option" : ""}`}
                        onClick={() => {
                          setWarehouseOpenModalData({
                            ...warehouseOpenModalData,
                            year: yr,
                          });
                          setYearDropdownOpen(false);
                        }}
                      >
                        {yr}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* 월 토글 */}
              <div className="toggle-group">
                <button
                  className="period-select-box"
                  onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                >
                  {warehouseOpenModalData.month}
                  <span className="toggle">
                    <svg width="16" height="16" viewBox="0 0 22 22">
                      <path
                        d="M7 10l5 5 5-5z"
                        fill="#445382"
                        transform={monthDropdownOpen ? "rotate(180 11 11)" : ""}
                      />
                    </svg>
                  </span>
                </button>
                <span className="toggle-label">월</span>
                {monthDropdownOpen && (
                  <div className="dropdown-options">
                    {months.map((mo) => (
                      <div
                        key={mo}
                        className={`dropdown-option ${mo === warehouseOpenModalData.month ? "selected-dropdown-option" : ""}`}
                        onClick={() => {
                          setWarehouseOpenModalData({
                            ...warehouseOpenModalData,
                            month: mo,
                          });
                          setMonthDropdownOpen(false);
                        }}
                      >
                        {mo}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* 회차 토글 */}
              <div className="toggle-group">
                <button
                  className="period-select-box"
                  onClick={() => setRoundDropdownOpen(!roundDropdownOpen)}
                >
                  {warehouseOpenModalData.round}
                  <span className="toggle">
                    <svg width="16" height="16" viewBox="0 0 22 22">
                      <path
                        d="M7 10l5 5 5-5z"
                        fill="#445382"
                        transform={roundDropdownOpen ? "rotate(180 11 11)" : ""}
                      />
                    </svg>
                  </span>
                </button>
                <span className="toggle-label">회차</span>
                {roundDropdownOpen && (
                  <div className="dropdown-options">
                    {rounds.map((rd) => (
                      <div
                        key={rd}
                        className={`dropdown-option ${rd === warehouseOpenModalData.round ? "selected-dropdown-option" : ""}`}
                        onClick={() => {
                          setWarehouseOpenModalData({
                            ...warehouseOpenModalData,
                            round: rd,
                          });
                          setRoundDropdownOpen(false);
                        }}
                      >
                        {rd}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="sime-popup-buttons">
              <button
                className="popup-cancel"
                onClick={() => setWarehouseOpenModalVisible(false)}
              >
                취소
              </button>
              <button
                className="popup-confirm"
                onClick={handleWarehouseOpenModalConfirm}
              >
                오픈
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseOrder;
