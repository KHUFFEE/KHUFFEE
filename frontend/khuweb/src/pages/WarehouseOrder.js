// frontend/khuweb/src/pages/WarehouseOrder.js
import React, { useState, useEffect, useRef } from "react";
import {
  fetchWarehouseOrders,
  fetchItems,
  fetchSuppliers,
  getTableStatusList,
  updateTableStatus,
  fetchWarehouseInventory, // 추가된 부분
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

  // 회차 관리(세션) 관련 상태 (테이블 이름: "창고_발주")
  const [managerOrderRound, setManagerOrderRound] = useState(1);
  const [showPopup, setShowPopup] = useState(false);

  // 추가: 창고 재고 데이터와 최신 기간 정보를 위한 상태
  const [prevInvData, setPrevInvData] = useState([]);
  const [currInvData, setCurrInvData] = useState([]);
  const [latestPeriod, setLatestPeriod] = useState("");

  // ----------------------- 데이터 조회 함수 -----------------------
  // WarehouseOrder 데이터와 품목, 협력사, 그리고 창고 재고 데이터를 가져옴.
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
        const selectedLastDay = new Date(numericYear, numericMonth, 0).getDate();
        const selectedLastDayStr = `${numericYear}.${String(numericMonth).padStart(2, "0")}.${String(selectedLastDay).padStart(2, "0")}`;
        const selectedYM = `${numericYear}.${String(numericMonth).padStart(2, "0")}`;
        let latestYM = "";
        if (latestPeriod) {
          const latestParts = latestPeriod.split('.');
          latestYM = `${latestParts[0]}.${latestParts[1].padStart(2, "0")}`;
        }
        let currentInvDateStr = selectedLastDayStr;
        if (selectedYM === latestYM) {
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
        initialOrders && initialOrders.total_pages ? initialOrders.total_pages : 1;
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

  // 그룹화된 데이터를 바탕으로 각 행(품목) 정보 구성 (품목명, 협력사, 규격, 단위, 입고단가, 입고단위, 입고단위단가, 전월 재고, 현 재고 포함)
  const tableRows = Object.keys(groupedOrders).map((itemId) => {
    const matchedItem = items.find((i) => i.품목_id === itemId);
    const itemName = matchedItem ? matchedItem.품목명 : "N/A";
    const supplier = matchedItem
      ? suppliers.find((s) => s.협력사_id === matchedItem.협력사_id) || {}
      : {};
    // 전월/현 재고 데이터 조회
    const prevRecord = prevInvData.find((r) => r.품목_id === itemId);
    const currRecord = currInvData.find((r) => r.품목_id === itemId);
    return {
      itemId,
      supplierName: supplier.협력사명 || "N/A",
      itemName,
      type: matchedItem ? matchedItem.종류 : "",
      orderAmount: groupedOrders[itemId] || 0,
      unitPrice: matchedItem ? Number(matchedItem.입고단가) : 0,
      규격: matchedItem ? matchedItem.규격 : "",
      단위: matchedItem ? matchedItem.단위 : "",
      입고단가: matchedItem ? matchedItem.입고단가 : "",
      입고단위: matchedItem ? matchedItem.입고단위 : "",
      입고단위단가: matchedItem ? matchedItem.입고단위단가 : "",
      prevInv: prevRecord ? prevRecord.창고_재고량 : "-",
      currInv: currRecord ? currRecord.창고_재고량 : "-",
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
    const orderAmount = Number(row.orderAmount);
    const price = Number(row.입고단가) || 0;
    return orderAmount * price;
  };

  // 발주합계(부가세 별도): 모든 행의 발주금액 합계
  const totalOrderMoney = tableRows.reduce(
    (sum, row) => sum + calculateOrderMoney(row),
    0
  );
  // 발주합계(부가세 포함): 부가세 별도 합계 x 1.1
  const totalOrderMoneyWithTax = totalOrderMoney * 1.1;

  // 다운로드 버튼 (동작 비활성화)
  const handleExcelDownload = () => {
    alert("다운로드 기능은 현재 비활성화되어 있습니다.");
  };

  // ----------------------- 회차 관리 (세션 관리) -----------------------
  const handleSessionButtonClick = async () => {
    try {
      const statusList = await getTableStatusList();
      const warehouseOrderStatus = statusList.find(
        (s) => s.테이블 === "창고_발주"
      );
      const currentStatus = warehouseOrderStatus ? warehouseOrderStatus.상태 : 1;
      setManagerOrderRound(currentStatus);
    } catch (err) {
      console.error("회차 관리 조회 실패:", err);
      setManagerOrderRound(1);
    }
    setShowPopup(true);
  };

  const handleUpdateSession = async () => {
    try {
      const newRound = managerOrderRound + 1;
      await updateTableStatus({ 테이블: "창고_발주", 상태: newRound });
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
    <div className="wo-container">
      <h2 className="title">창고 발주 취합서</h2>
      <div className="period-controls">
        <div className="period-search">
          {/* 기간 선택 드롭다운 (년/월/회차) */}
          <div
            className="period-select-box"
            onClick={() => {
              if (selectRef.current) {
                selectRef.current.focus();
                setIsDropdownOpen(true);
              }
            }}
          >
            <div className="select-display">
              {displayPeriod || "기간 선택"}
            </div>
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
                  const label = `${parts[0]}년 ${parts[1].padStart(
                    2,
                    "0"
                  )}월 ${parts[2]}회차`;
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
                  fill="#8B0000"
                  transform={isDropdownOpen ? "rotate(180 11 11)" : ""}
                />
              </svg>
            </span>
          </div>
          <button className="reset-button" onClick={() => handleReset(true)}>
            최신 조회
          </button>
          <button className="session-button" onClick={handleSessionButtonClick}>
            회차 관리
          </button>
        </div>
        <div className="warehouse-action-buttons">
          <button onClick={handleExcelDownload} className="download-button">
            Excel 다운로드
          </button>
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
            <th className="wo-unit-col">단위</th>
            <th className="wo-price-col">입고단가</th>
            <th className="wo-inunit-col">입고단위</th>
            <th className="wo-inunitprice-col">입고단위단가</th>
            <th className="wo-previnv-col">전월 재고</th>
            <th className="wo-currinv-col">현 재고</th>
            <th className="wo-sum-col">발주량</th>
            <th className="wo-ordermoney-col">발주금액</th>
            <th className="wo-total-excl-col" rowSpan={tableRows.length > 0 ? tableRows.length : 1}>
              발주합계(부가세 별도)
            </th>
            <th className="wo-total-incl-col" rowSpan={tableRows.length > 0 ? tableRows.length : 1}>
              발주합계(부가세 포함)
            </th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, index) => (
            <tr key={row.itemId}>
              <td className="wo-number-col">{index + 1}</td>
              <td className="wo-supplier-col">
                <div className="supplier-cell">{row.supplierName}</div>
              </td>
              <td className="wo-item-col">
                <div className="item-cell">{row.itemName}</div>
              </td>
              <td className="wo-spec-col">{row.규격 || "-"}</td>
              <td className="wo-unit-col">{row.단위 || "-"}</td>
              <td className="wo-price-col">
                {row.입고단가 ? formatNumber(row.입고단가) : "-"}
              </td>
              <td className="wo-inunit-col">{row.입고단위 || "-"}</td>
              <td className="wo-inunitprice-col">
                {row.입고단위단가 ? formatNumber(row.입고단위단가) : "-"}
              </td>
              <td className="wo-previnv-col">
                {row.prevInv !== "-" ? formatNumber(row.prevInv) : "-"}
              </td>
              <td className="wo-currinv-col">
                {row.currInv !== "-" ? formatNumber(row.currInv) : "-"}
              </td>
              <td className="wo-sum-col">{formatNumber(row.orderAmount)}</td>
              <td className="wo-ordermoney-col">
                {formatNumber(calculateOrderMoney(row))}
              </td>
              {index === 0 && (
                <>
                  <td
                    className="wo-total-excl-col"
                    rowSpan={tableRows.length > 0 ? tableRows.length : 1}
                  >
                    {formatNumber(totalOrderMoney)}
                  </td>
                  <td
                    className="wo-total-incl-col"
                    rowSpan={tableRows.length > 0 ? tableRows.length : 1}
                  >
                    {formatNumber(totalOrderMoneyWithTax)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
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

export default WarehouseOrder;
