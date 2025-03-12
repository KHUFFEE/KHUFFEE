/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import {
  fetchWarehouseIncoming,
  fetchItems,
  fetchSuppliers,
  fetchWarehouseInventory,
  updateWarehouseIncoming,
  fetchWarehouseOrders, // 추가: 발주량 조회를 위한 API 함수
} from "../api/api";
import "../styles/WarehouseIncoming.css";
import "../styles/table.css";
import LoadingSpinner from "../components/LoadingSpinner";

const WarehouseIncoming = () => {
  // API 데이터 및 에러/로딩 상태
  const [incomingData, setIncomingData] = useState(null);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [prevInventory, setPrevInventory] = useState(null);
  // 발주 데이터를 품목별로 그룹화한 결과 (여러 회차의 창고_발주량을 합산)
  const [ordersGrouped, setOrdersGrouped] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 기간 선택 상태 (형식: "YYYY.MM")
  const [distinctPeriods, setDistinctPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");

  // 드롭다운 관련
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef(null);

  // 수정(편집) 모드 상태 (입고 수정)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedIncoming, setEditedIncoming] = useState({});

  // ----------------------- 데이터 조회 함수 -----------------------
  // params.기간: "YYYY.MM" 형식이며, 해당 월의 1~5주차 범위를 조회
  const fetchData = async (params = { page: 1 }, manual = false) => {
    try {
      if (manual) setLoading(true);
      let queryParams = "";
      if (params.기간) {
        // 창고 입고는 해당 월의 1주차부터 5주차까지 조회
        queryParams = `기간=${params.기간}.1~${params.기간}.5`;
      } else {
        queryParams = `page=${params.page || 1}`;
      }
      const url = `${process.env.REACT_APP_API_URL}/api/orders/warehouse_incoming_list/?${queryParams}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch warehouse incoming records");
      }
      const data = await response.json();
      setIncomingData(data);

      const [itemsRes, suppliersRes] = await Promise.all([
        fetchItems(true),
        fetchSuppliers(),
      ]);
      setItems(itemsRes);
      setSuppliers(suppliersRes);

      // 전월 재고 조회: 선택된 기간의 전달 마지막 일자를 기준으로 함
      if (params.기간) {
        const [year, month] = params.기간.split(".").map(Number);
        let prevYear, prevMonth;
        if (month === 1) {
          prevYear = year - 1;
          prevMonth = 12;
        } else {
          prevYear = year;
          prevMonth = month - 1;
        }
        const lastDay = new Date(prevYear, prevMonth, 0).getDate();
        const prevDateStr = `${prevYear}.${String(prevMonth).padStart(2, "0")}.${String(lastDay).padStart(2, "0")}`;
        const invResponse = await fetchWarehouseInventory({
          기간: prevDateStr,
        });
        setPrevInventory(invResponse);
      }

      // ----------------------- 발주 데이터 조회 및 그룹화 -----------------------
      // 월 기준으로 창고 발주 데이터를 가져오고, 여러 회차가 있으면 같은 품목_id의 창고_발주량을 합산
      if (params.기간) {
        const ordersRes = await fetchWarehouseOrders({ 기간: params.기간 });
        let groupedOrders = {};
        if (ordersRes && ordersRes.orders) {
          ordersRes.orders.forEach((order) => {
            const itemId = order.품목_id;
            groupedOrders[itemId] =
              (groupedOrders[itemId] || 0) + Number(order.창고_발주량);
          });
        }
        setOrdersGrouped(groupedOrders);
      }
      // --------------------------------------------------------------------

      if (manual) setLoading(false);
      return data;
    } catch (err) {
      console.error("창고 입고 데이터 불러오기 실패:", err);
      setError("데이터를 불러오는데 실패하였습니다.");
      if (manual) setLoading(false);
      return null;
    }
  };

  // distinctPeriods 조회: 창고 입고의 기간 정보(YYYY.MM.N)에서 회차를 제외한 "YYYY.MM"만 추출하여 중복 제거
  const handleReset = async (manual = false) => {
    try {
      if (manual) setLoading(true);
      const initialData = await fetchWarehouseIncoming({ page: 1 });
      let periods = [];
      if (initialData && initialData.orders) {
        initialData.orders.forEach((record) => {
          const parts = record.기간.split(".");
          if (parts.length >= 2) {
            periods.push(`${parts[0]}.${parts[1]}`);
          }
        });
      }
      const totalPages =
        initialData && initialData.total_pages ? initialData.total_pages : 1;
      let periodPromises = [];
      for (let p = 1; p <= totalPages; p++) {
        periodPromises.push(
          fetchWarehouseIncoming({ page: p }).then((res) => {
            if (res.orders && res.orders.length > 0) {
              return res.orders.map((order) => {
                const parts = order.기간.split(".");
                return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : "";
              });
            }
            return [];
          })
        );
      }
      const results = await Promise.all(periodPromises);
      const allPeriods = results.flat().filter((p) => p !== "");
      const uniquePeriods = Array.from(new Set(allPeriods));
      // 내림차순 정렬 (최신 월 우선)
      uniquePeriods.sort((a, b) => {
        const [yA, mA] = a.split(".").map(Number);
        const [yB, mB] = b.split(".").map(Number);
        if (yA !== yB) return yB - yA;
        return mB - mA;
      });
      setDistinctPeriods(uniquePeriods);
      if (uniquePeriods.length > 0) {
        const latest = uniquePeriods[0];
        setSelectedPeriod(latest);
        await fetchData({ 기간: latest }, manual);
      } else {
        await fetchData({ page: 1 }, manual);
      }
      if (manual) setLoading(false);
    } catch (err) {
      console.error("distinctPeriods 조회 실패:", err);
      if (manual) setLoading(false);
    }
  };

  // 최초 로드 시 handleReset 실행
  useEffect(() => {
    handleReset();
  }, []);

  // 드롭다운 선택 변경 시 (value: "YYYY.MM")
  const handleSearch = (value) => {
    setSelectedPeriod(value);
    fetchData({ 기간: value });
  };

  // 표시용: "YYYY년 MM월" 형식으로 변환
  const displayPeriod = selectedPeriod
    ? `${selectedPeriod.split(".")[0]}년 ${selectedPeriod.split(".")[1]}월`
    : "기간 선택";

  // ----------------------- 헬퍼 함수 -----------------------
  const formatNumber = (num) => {
    if (num === "" || num === undefined || num === null || Number(num) === 0)
      return "-";
    return Number(num).toLocaleString();
  };

  const calculateOrderMoney = (row) => {
    const orderAmount = Number(row.orderAmount);
    const price = Number(row.입고단가) || 0;
    return orderAmount * price;
  };

  // ----------------------- 테이블 데이터 구성 -----------------------
  // 창고 입고 데이터(incomingData.orders)를 품목별로 그룹화하여 각 주차(1~5주차) 입고량 집계
  let tableRows = [];
  if (incomingData && incomingData.orders) {
    const grouped = {};
    incomingData.orders.forEach((record) => {
      const itemId = record.품목_id;
      const parts = record.기간.split(".");
      // parts[2] represents the 주차 (1~5)
      const week = parts.length === 3 ? parts[2] : "0";
      if (!grouped[itemId]) {
        grouped[itemId] = { week1: 0, week2: 0, week3: 0, week4: 0, week5: 0 };
      }
      const weekKey = `week${week}`;
      if (grouped[itemId][weekKey] !== undefined) {
        grouped[itemId][weekKey] += Number(record.창고_입고량);
      }
    });
    tableRows = Object.keys(grouped).map((itemId) => {
      const matchedItem = items.find((i) => i.품목_id === itemId);
      const itemName = matchedItem ? matchedItem.품목명 : "N/A";
      const supplier = matchedItem
        ? suppliers.find((s) => s.협력사_id === matchedItem.협력사_id) || {}
        : {};
      const week1 = Number(grouped[itemId].week1) || 0;
      const week2 = Number(grouped[itemId].week2) || 0;
      const week3 = Number(grouped[itemId].week3) || 0;
      const week4 = Number(grouped[itemId].week4) || 0;
      const week5 = Number(grouped[itemId].week5) || 0;
      const monthlyIncoming = week1 + week2 + week3 + week4 + week5;
      const unitPrice =
        matchedItem && matchedItem.입고단가 ? Number(matchedItem.입고단가) : 0;
      const monthlyAmount = monthlyIncoming * unitPrice;
      const prevInvValue = Array.isArray(prevInventory)
        ? (prevInventory.find((r) => r.품목_id === itemId)?.창고_재고량 ?? "-")
        : "-";
      // *** 발주 데이터 적용 ***
      const orderAmount = ordersGrouped[itemId] || 0;
      return {
        itemId,
        supplierName: supplier.협력사명 || "N/A",
        itemName,
        종류: matchedItem ? matchedItem.종류 : "",
        규격: matchedItem ? matchedItem.규격 : "",
        입고단가: matchedItem ? matchedItem.입고단가 : "",
        입고단위:
          matchedItem && matchedItem.입고단위
            ? Number(matchedItem.입고단위)
            : "",
        입고단위단가: matchedItem ? matchedItem.입고단위단가 : "",
        prevInv: prevInvValue,
        week1,
        week2,
        week3,
        week4,
        week5,
        monthlyIncoming,
        monthlyAmount,
        orderAmount,
      };
    });
    // 협력사명, 종류, 품목명을 기준으로 오름차순 정렬
    tableRows.sort((a, b) => {
      const cmpSupplier = a.supplierName.localeCompare(b.supplierName);
      if (cmpSupplier !== 0) return cmpSupplier;
      const cmpType = a.종류.localeCompare(b.종류);
      if (cmpType !== 0) return cmpType;
      return a.itemName.localeCompare(b.itemName);
    });
  }

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

  // ----------------------- 수정 모드 핸들러 -----------------------
  const handleEditToggle = () => {
    if (!isEditMode) {
      // 초기값 설정: 각 행의 1~5주차 입고량
      const init = {};
      tableRows.forEach((row) => {
        init[row.itemId] = {
          week1: row.week1,
          week2: row.week2,
          week3: row.week3,
          week4: row.week4,
          week5: row.week5,
        };
      });
      setEditedIncoming(init);
    }
    setIsEditMode(!isEditMode);
  };

  const handleIncomingChange = (itemId, weekKey, value) => {
    const valueWithoutCommas = value.replace(/,/g, "");
    const numericValue = valueWithoutCommas.replace(/\D/g, "");
    setEditedIncoming((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [weekKey]: numericValue,
      },
    }));
  };

  const handleEditSubmit = async () => {
    try {
      const updates = [];
      // 기본 매장 ID (예: "ST_102")
      const defaultStoreId = "ST_102";
      const currentPeriod = selectedPeriod; // "YYYY.MM" 형식; 주차는 뒤에 붙임
      tableRows.forEach((row) => {
        const edited = editedIncoming[row.itemId];
        if (!edited) return;
        ["week1", "week2", "week3", "week4", "week5"].forEach(
          (weekKey, index) => {
            const original = row[weekKey];
            const newValue = edited[weekKey];
            if (Number(newValue) !== Number(original)) {
              // "YYYY.MM.(주차)" 형식의 기간 구성
              const periodForUpdate = `${currentPeriod}.${index + 1}`;
              const payload = {
                매장_id: defaultStoreId,
                품목_id: row.itemId,
                기간: periodForUpdate,
                회차: 1,
                창고_입고량: Number(newValue),
              };
              updates.push(updateWarehouseIncoming(payload));
            }
          }
        );
      });
      await Promise.all(updates);
      await fetchData({ 기간: selectedPeriod }, false);
      setIsEditMode(false);
    } catch (err) {
      console.error("수정 실패:", err);
      alert("수정에 실패하였습니다.");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div>{error}</div>;

  return (
    <div className="wc-container">
      <h2 className="title">창고 입고 관리</h2>
      <div className="period-controls">
        <div className="period-search">
          {/* 기간 선택 드롭다운 (년/월) – 수정 모드일 때는 클릭 불가 */}
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
              value={selectedPeriod}
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
                  const [yA, mA] = a.split(".").map(Number);
                  const [yB, mB] = b.split(".").map(Number);
                  if (yA !== yB) return yB - yA;
                  return mB - mA;
                })
                .map((dp) => {
                  const parts = dp.split(".");
                  const label = `${parts[0]}년 ${parts[1].padStart(2, "0")}월`;
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
        </div>
        <div className="warehouse-action-buttons">
          {/* 수정 모드일 때는 Excel 다운로드 버튼 숨김 */}
          {!isEditMode && (
            <button
              className="download-button"
              onClick={() => {
                /* Excel 다운로드 처리 */
              }}
            >
              Excel 다운로드
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
            <th className="wc-number-col">No.</th>
            <th className="wc-supplier-col nowrap">협력사</th>
            <th className="wc-item-col nowrap">품목명</th>
            <th className="wc-spec-col nowrap">규격</th>
            <th className="wc-price-col nowrap">입고단가</th>
            <th className="wc-inunitprice-col">
              입고단위
              <br />
              단가
            </th>
            <th className="wc-previnv-col nowrap">전월재고</th>
            <th className="wc-week-col">
              1주차
              <br />
              입고
            </th>
            <th className="wc-week-col">
              2주차
              <br />
              입고
            </th>
            <th className="wc-week-col">
              3주차
              <br />
              입고
            </th>
            <th className="wc-week-col">
              4주차
              <br />
              입고
            </th>
            <th className="wc-week-col">
              5주차
              <br />
              입고
            </th>
            <th className="wc-month-col">
              월
              <br />
              입고량
            </th>
            <th className="wc-month-col">
              월
              <br />
              입고금액
            </th>
            <th className="wc-order-qty-col">발주량</th>
            <th className="wc-order-amount-col">발주금액</th>
            <th className="wc-order-sum-ex-col">
              발주합계
              <br />
              부가세x
            </th>
            <th className="wc-order-sum-inc-col">
              발주합계
              <br />
              부가세o
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
                <td className="wc-number-col">{index + 1}</td>
                <td className="wc-supplier-col">
                  <div className="wc-supplier-cell">{row.supplierName}</div>
                </td>
                <td className="wc-item-col">
                  <div className="wc-item-cell">{row.itemName}</div>
                </td>
                <td className="wc-spec-col">
                  <div className="wc-spec-cell">{row.규격 || "-"}</div>
                </td>
                <td className="wc-price-col">
                  {row.입고단가 ? Number(row.입고단가).toLocaleString() : "-"}
                </td>
                <td className="wc-inunitprice-col">
                  {row.입고단위단가
                    ? Number(row.입고단위단가).toLocaleString()
                    : "-"}
                </td>
                <td className="wc-previnv-col">
                  {row.prevInv !== undefined
                    ? typeof row.prevInv === "number"
                      ? Number(row.prevInv).toLocaleString()
                      : row.prevInv
                    : "-"}
                </td>
                <td className="wc-week-col">
                  {isEditMode ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        editedIncoming[row.itemId] &&
                        editedIncoming[row.itemId].week1 !== undefined
                          ? formatNumber(editedIncoming[row.itemId].week1)
                          : ""
                      }
                      onChange={(e) =>
                        handleIncomingChange(
                          row.itemId,
                          "week1",
                          e.target.value
                        )
                      }
                      style={{ textAlign: "right" }}
                    />
                  ) : row.week1 ? (
                    Number(row.week1).toLocaleString()
                  ) : (
                    "-"
                  )}
                </td>
                <td className="wc-week-col">
                  {isEditMode ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        editedIncoming[row.itemId] &&
                        editedIncoming[row.itemId].week2 !== undefined
                          ? formatNumber(editedIncoming[row.itemId].week2)
                          : ""
                      }
                      onChange={(e) =>
                        handleIncomingChange(
                          row.itemId,
                          "week2",
                          e.target.value
                        )
                      }
                      style={{ textAlign: "right" }}
                    />
                  ) : row.week2 ? (
                    Number(row.week2).toLocaleString()
                  ) : (
                    "-"
                  )}
                </td>
                <td className="wc-week-col">
                  {isEditMode ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        editedIncoming[row.itemId] &&
                        editedIncoming[row.itemId].week3 !== undefined
                          ? formatNumber(editedIncoming[row.itemId].week3)
                          : ""
                      }
                      onChange={(e) =>
                        handleIncomingChange(
                          row.itemId,
                          "week3",
                          e.target.value
                        )
                      }
                      style={{ textAlign: "right" }}
                    />
                  ) : row.week3 ? (
                    Number(row.week3).toLocaleString()
                  ) : (
                    "-"
                  )}
                </td>
                <td className="wc-week-col">
                  {isEditMode ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        editedIncoming[row.itemId] &&
                        editedIncoming[row.itemId].week4 !== undefined
                          ? formatNumber(editedIncoming[row.itemId].week4)
                          : ""
                      }
                      onChange={(e) =>
                        handleIncomingChange(
                          row.itemId,
                          "week4",
                          e.target.value
                        )
                      }
                      style={{ textAlign: "right" }}
                    />
                  ) : row.week4 ? (
                    Number(row.week4).toLocaleString()
                  ) : (
                    "-"
                  )}
                </td>
                <td className="wc-week-col">
                  {isEditMode ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={
                        editedIncoming[row.itemId] &&
                        editedIncoming[row.itemId].week5 !== undefined
                          ? formatNumber(editedIncoming[row.itemId].week5)
                          : ""
                      }
                      onChange={(e) =>
                        handleIncomingChange(
                          row.itemId,
                          "week5",
                          e.target.value
                        )
                      }
                      style={{ textAlign: "right" }}
                    />
                  ) : row.week5 ? (
                    Number(row.week5).toLocaleString()
                  ) : (
                    "-"
                  )}
                </td>
                <td className="wc-month-col">
                  {row.monthlyIncoming
                    ? Number(row.monthlyIncoming).toLocaleString()
                    : "-"}
                </td>
                <td className="wc-month-col">
                  {row.monthlyAmount
                    ? Number(row.monthlyAmount).toLocaleString()
                    : "-"}
                </td>
                <td className="wc-order-qty-col">
                  {formatNumber(row.orderAmount)}
                </td>
                <td className="wc-order-amount-col">
                  {formatNumber(calculateOrderMoney(row))}
                </td>
                {isFirstRowOfGroup && (
                  <>
                    <td
                      className="wc-order-sum-ex-col"
                      rowSpan={supplierGroupCounts[row.supplierName]}
                    >
                      {formatNumber(
                        supplierGroupOrderSums[row.supplierName].sumEx
                      )}
                    </td>
                    <td
                      className="wc-order-sum-inc-col"
                      rowSpan={supplierGroupCounts[row.supplierName]}
                    >
                      {formatNumber(
                        supplierGroupOrderSums[row.supplierName].sumInc
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default WarehouseIncoming;
