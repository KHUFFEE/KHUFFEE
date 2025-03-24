/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import {
  fetchWarehouseOutgoing,
  fetchItems,
  fetchSuppliers,
  fetchWarehouseInventory,
  updateWarehouseOutgoing,
} from "../api/api";
import "../styles/WarehouseOutgoing.css";
import "../styles/table.css";
import LoadingSpinner from "../components/LoadingSpinner";

const WarehouseOutgoing = () => {
  // API 데이터 및 에러/로딩 상태
  const [outgoingData, setOutgoingData] = useState(null);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [prevInventory, setPrevInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 기간 선택 상태 (형식: "YYYY.MM")
  const [distinctPeriods, setDistinctPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");

  // 드롭다운 관련
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef(null);

  // ----------------------- 수정(편집) 모드 상태 -----------------------
  // 수정 대상은 1주차 ~ 5주차 출고량 열
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedOutgoing, setEditedOutgoing] = useState({});

  // ----------------------- 데이터 조회 함수 -----------------------
  // params.기간이 있으면 "YYYY.MM" 형식이며, 해당 월의 1~5주차 범위를 전달
  const fetchData = async (params = { page: 1 }, manual = false) => {
    try {
      if (manual) setLoading(true);
      let queryParams = "";
      if (params.기간) {
        // 선택된 월(YYYY.MM) 기준으로 1주차부터 5주차까지 범위 조회
        queryParams = `기간=${params.기간}.1~${params.기간}.5`;
      } else {
        queryParams = `page=${params.page || 1}`;
      }
      const url = `${process.env.REACT_APP_API_URL}/api/orders/warehouse_outgoing_list/?${queryParams}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch warehouse outgoing records");
      }
      const data = await response.json();
      setOutgoingData(data);

      const [itemsRes, suppliersRes] = await Promise.all([
        fetchItems(true),
        fetchSuppliers(),
      ]);
      setItems(itemsRes);
      setSuppliers(suppliersRes);

      // 선택된 기간이 있으면, 전달의 마지막 일자를 기준으로 창고 재고 데이터를 조회
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
        // new Date(prevYear, prevMonth, 0) → 전달의 마지막 일자
        const lastDay = new Date(prevYear, prevMonth, 0).getDate();
        const prevDateStr = `${prevYear}.${String(prevMonth).padStart(2, "0")}.${String(lastDay).padStart(2, "0")}`;
        const invResponse = await fetchWarehouseInventory({
          기간: prevDateStr,
        });
        setPrevInventory(invResponse);
      }
      if (manual) setLoading(false);
      return data;
    } catch (err) {
      console.error("창고 출고 데이터 불러오기 실패:", err);
      setError("데이터를 불러오는데 실패하였습니다.");
      if (manual) setLoading(false);
      return null;
    }
  };

  // distinctPeriods 조회: 창고_출고의 기간 정보(YYYY.MM.N)에서 회차를 제외한 "YYYY.MM"만 추출하여 중복 제거
  const handleReset = async (manual = false) => {
    try {
      if (manual) setLoading(true);
      const initialData = await fetchWarehouseOutgoing({ page: 1 });
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
          fetchWarehouseOutgoing({ page: p }).then((res) => {
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

  // ----------------------- 테이블 데이터 구성 -----------------------
  // 창고 출고 데이터(outgoingData.orders)를 품목별로 그룹화하여 각 주차(1~5주차) 출고량 집계
  let tableRows = [];
  if (outgoingData && outgoingData.orders) {
    const grouped = {};
    outgoingData.orders.forEach((record) => {
      const itemId = record.품목_id;
      const parts = record.기간.split(".");
      // parts[2] represents the week number
      const week = parts.length === 3 ? parts[2] : "0";
      if (!grouped[itemId]) {
        grouped[itemId] = { week1: 0, week2: 0, week3: 0, week4: 0, week5: 0 };
      }
      const weekKey = `week${week}`;
      if (grouped[itemId][weekKey] !== undefined) {
        grouped[itemId][weekKey] += Number(record.창고_출고량);
      }
    });
    tableRows = Object.keys(grouped).map((itemId) => {
      const matchedItem = items.find((i) => i.품목_id === itemId);
      const itemName = matchedItem ? matchedItem.품목명 : "N/A";
      const supplier = matchedItem
        ? suppliers.find((s) => s.협력사_id === matchedItem.협력사_id) || {}
        : {};
      const week1 =
        isEditMode &&
        editedOutgoing[itemId] &&
        editedOutgoing[itemId].week1 !== undefined
          ? Number(editedOutgoing[itemId].week1)
          : Number(grouped[itemId].week1) || 0;
      const week2 =
        isEditMode &&
        editedOutgoing[itemId] &&
        editedOutgoing[itemId].week2 !== undefined
          ? Number(editedOutgoing[itemId].week2)
          : Number(grouped[itemId].week2) || 0;
      const week3 =
        isEditMode &&
        editedOutgoing[itemId] &&
        editedOutgoing[itemId].week3 !== undefined
          ? Number(editedOutgoing[itemId].week3)
          : Number(grouped[itemId].week3) || 0;
      const week4 =
        isEditMode &&
        editedOutgoing[itemId] &&
        editedOutgoing[itemId].week4 !== undefined
          ? Number(editedOutgoing[itemId].week4)
          : Number(grouped[itemId].week4) || 0;
      const week5 =
        isEditMode &&
        editedOutgoing[itemId] &&
        editedOutgoing[itemId].week5 !== undefined
          ? Number(editedOutgoing[itemId].week5)
          : Number(grouped[itemId].week5) || 0;
      const monthlyOutgoing = week1 + week2 + week3 + week4 + week5;
      const unitPrice =
        matchedItem && matchedItem.입고단가 ? Number(matchedItem.입고단가) : 0;
      const monthlyAmount = monthlyOutgoing * unitPrice;
      // 전월 재고: prevInventory는 배열 형태이므로, 직접 find
      const prevInvValue = Array.isArray(prevInventory)
        ? (prevInventory.find((r) => r.품목_id === itemId)?.창고_재고량 ?? "-")
        : "-";

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
        monthlyOutgoing,
        monthlyAmount,
      };
    });
    // 협력사명, 종류, 품목명 기준 오름차순 정렬
    tableRows.sort((a, b) => {
      const cmpSupplier = a.supplierName.localeCompare(b.supplierName);
      if (cmpSupplier !== 0) return cmpSupplier;
      const cmpType = a.종류.localeCompare(b.종류);
      if (cmpType !== 0) return cmpType;
      return a.itemName.localeCompare(b.itemName);
    });
  }

  // ----------------------- 헬퍼 함수 -----------------------
  const formatInputValue = (value) => {
    if (
      value === "" ||
      value === undefined ||
      value === null ||
      Number(value) === 0
    )
      return "-";
    const num = Number(value);
    if (!isNaN(num)) return num.toLocaleString();
    return value;
  };

  // 새로운 총합계 포매팅 함수 (합계가 0이면 "-" 표시)
  const formatNumber = (num) => {
    if (num === "" || num === undefined || num === null || Number(num) === 0)
      return "-";
    return Number(num).toLocaleString();
  };

  // ----------------------- 수정 모드 핸들러 -----------------------
  const handleEditToggle = () => {
    if (!isEditMode) {
      // 초기값 설정: 각 행의 1~5주차 출고량
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
      setEditedOutgoing(init);
    }
    setIsEditMode(!isEditMode);
  };

  const handleOutgoingChange = (itemId, weekKey, value) => {
    const valueWithoutCommas = value.replace(/,/g, "");
    const numericValue = valueWithoutCommas.replace(/\D/g, "");
    setEditedOutgoing((prev) => ({
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
      const defaultStoreId = "ST_102";
      const currentPeriod = selectedPeriod; // "YYYY.MM" format

      // 원본 출고 데이터를 그룹화 (수정 전 값)
      const originalGrouped = {};
      if (outgoingData && outgoingData.orders) {
        outgoingData.orders.forEach((record) => {
          const itemId = record.품목_id;
          const parts = record.기간.split(".");
          const week = parts.length === 3 ? parts[2] : "0";
          if (!originalGrouped[itemId]) {
            originalGrouped[itemId] = {
              week1: 0,
              week2: 0,
              week3: 0,
              week4: 0,
              week5: 0,
            };
          }
          const weekKey = `week${week}`;
          originalGrouped[itemId][weekKey] += Number(record.창고_출고량);
        });
      }

      tableRows.forEach((row) => {
        const edited = editedOutgoing[row.itemId];
        if (!edited) return;
        ["week1", "week2", "week3", "week4", "week5"].forEach(
          (weekKey, index) => {
            // 원본 값은 originalGrouped에서 가져옴
            const original = originalGrouped[row.itemId]
              ? Number(originalGrouped[row.itemId][weekKey])
              : 0;
            const newValue = edited[weekKey];
            if (Number(newValue) !== original) {
              const periodForUpdate = `${currentPeriod}.${index + 1}`;
              const payload = {
                매장_id: defaultStoreId,
                품목_id: row.itemId,
                기간: periodForUpdate,
                회차: 1,
                창고_출고량: Number(newValue),
              };
              updates.push(updateWarehouseOutgoing(payload));
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

  // ----------------------- 합계 계산 -----------------------
  const totalPrevinv = tableRows.reduce(
    (sum, row) => sum + (typeof row.prevInv === "number" ? row.prevInv : 0),
    0
  );
  const totalWeek1 = tableRows.reduce(
    (sum, row) => sum + Number(row.week1 || 0),
    0
  );
  const totalWeek2 = tableRows.reduce(
    (sum, row) => sum + Number(row.week2 || 0),
    0
  );
  const totalWeek3 = tableRows.reduce(
    (sum, row) => sum + Number(row.week3 || 0),
    0
  );
  const totalWeek4 = tableRows.reduce(
    (sum, row) => sum + Number(row.week4 || 0),
    0
  );
  const totalWeek5 = tableRows.reduce(
    (sum, row) => sum + Number(row.week5 || 0),
    0
  );
  const totalMonthlyOutgoing = tableRows.reduce(
    (sum, row) => sum + Number(row.monthlyOutgoing || 0),
    0
  );
  const totalMonthlyAmount = tableRows.reduce(
    (sum, row) => sum + Number(row.monthlyAmount || 0),
    0
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <div>{error}</div>;

  return (
    <div className="wg-container">
      <h2 className="title">창고 출고 관리</h2>
      <div className="period-controls">
        <div className="period-search">
          {/* 기간 선택 드롭다운 (년/월) – 수정 모드일 때는 흐릿하게 표시 및 클릭 불가 */}
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
          {/* 최신 조회 버튼 – 수정 모드일 때는 disabled 및 흐릿하게 표시 */}
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
          {/* 수정 모드일 때는 다운로드 버튼을 숨김 */}
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
            <th className="wg-number-col">No.</th>
            <th className="wg-supplier-col nowrap">협력사</th>
            <th className="wg-item-col nowrap">품목명</th>
            <th className="wg-spec-col nowrap">규격</th>
            <th className="wg-price-col nowrap">입고단가</th>
            <th className="wg-inunitprice-col">
              입고단위
              <br />
              단가
            </th>
            <th className="wg-previnv-col nowrap">전월재고</th>
            <th className="wg-week-col">
              1주차
              <br />
              출고
            </th>
            <th className="wg-week-col">
              2주차
              <br />
              출고
            </th>
            <th className="wg-week-col">
              3주차
              <br />
              출고
            </th>
            <th className="wg-week-col">
              4주차
              <br />
              출고
            </th>
            <th className="wg-week-col">
              5주차
              <br />
              출고
            </th>
            <th className="wg-month-col">
              월
              <br />
              출고량
            </th>
            <th className="wg-month-col">
              월
              <br />
              출고금액
            </th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, index) => (
            <tr key={row.itemId}>
              <td className="wg-number-col">{index + 1}</td>
              <td className="wg-supplier-col">
                <div className="wg-supplier-cell">{row.supplierName}</div>
              </td>
              <td className="wg-item-col">
                <div className="wg-item-cell">{row.itemName}</div>
              </td>
              <td className="wg-spec-col">
                <div className="wg-spec-cell">{row.규격 || "-"}</div>
              </td>
              <td className="wg-price-col">
                {row.입고단가 ? Number(row.입고단가).toLocaleString() : "-"}
              </td>
              <td className="wg-inunitprice-col">
                {row.입고단위단가
                  ? Number(row.입고단위단가).toLocaleString()
                  : "-"}
              </td>
              <td className="wg-previnv-col">
                {row.prevInv !== undefined
                  ? typeof row.prevInv === "number"
                    ? Number(row.prevInv).toLocaleString()
                    : row.prevInv
                  : "-"}
              </td>
              <td className="wg-week-col">
                {isEditMode ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={
                      editedOutgoing[row.itemId] &&
                      editedOutgoing[row.itemId].week1 !== undefined
                        ? formatInputValue(editedOutgoing[row.itemId].week1)
                        : ""
                    }
                    onChange={(e) =>
                      handleOutgoingChange(row.itemId, "week1", e.target.value)
                    }
                    style={{ textAlign: "right" }}
                  />
                ) : row.week1 ? (
                  Number(row.week1).toLocaleString()
                ) : (
                  "-"
                )}
              </td>
              <td className="wg-week-col">
                {isEditMode ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={
                      editedOutgoing[row.itemId] &&
                      editedOutgoing[row.itemId].week2 !== undefined
                        ? formatInputValue(editedOutgoing[row.itemId].week2)
                        : ""
                    }
                    onChange={(e) =>
                      handleOutgoingChange(row.itemId, "week2", e.target.value)
                    }
                    style={{ textAlign: "right" }}
                  />
                ) : row.week2 ? (
                  Number(row.week2).toLocaleString()
                ) : (
                  "-"
                )}
              </td>
              <td className="wg-week-col">
                {isEditMode ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={
                      editedOutgoing[row.itemId] &&
                      editedOutgoing[row.itemId].week3 !== undefined
                        ? formatInputValue(editedOutgoing[row.itemId].week3)
                        : ""
                    }
                    onChange={(e) =>
                      handleOutgoingChange(row.itemId, "week3", e.target.value)
                    }
                    style={{ textAlign: "right" }}
                  />
                ) : row.week3 ? (
                  Number(row.week3).toLocaleString()
                ) : (
                  "-"
                )}
              </td>
              <td className="wg-week-col">
                {isEditMode ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={
                      editedOutgoing[row.itemId] &&
                      editedOutgoing[row.itemId].week4 !== undefined
                        ? formatInputValue(editedOutgoing[row.itemId].week4)
                        : ""
                    }
                    onChange={(e) =>
                      handleOutgoingChange(row.itemId, "week4", e.target.value)
                    }
                    style={{ textAlign: "right" }}
                  />
                ) : row.week4 ? (
                  Number(row.week4).toLocaleString()
                ) : (
                  "-"
                )}
              </td>
              <td className="wg-week-col">
                {isEditMode ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={
                      editedOutgoing[row.itemId] &&
                      editedOutgoing[row.itemId].week5 !== undefined
                        ? formatInputValue(editedOutgoing[row.itemId].week5)
                        : ""
                    }
                    onChange={(e) =>
                      handleOutgoingChange(row.itemId, "week5", e.target.value)
                    }
                    style={{ textAlign: "right" }}
                  />
                ) : row.week5 ? (
                  Number(row.week5).toLocaleString()
                ) : (
                  "-"
                )}
              </td>
              <td className="wg-month-col">
                {row.monthlyOutgoing
                  ? Number(row.monthlyOutgoing).toLocaleString()
                  : "-"}
              </td>
              <td className="wg-month-col">
                {row.monthlyAmount
                  ? Number(row.monthlyAmount).toLocaleString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            {/* No. 열: 빈셀 */}
            <td className="wg-number-col"></td>
            {/* 협력사, 품목명, 규격, 입고단가, 입고단위 단가 병합 */}
            <td
              className="wg-supplier-col"
              colSpan="5"
              style={{ textAlign: "center" }}
            >
              합계
            </td>
            {/* 전월재고 */}
            <td className="wg-previnv-col">
              {totalPrevinv ? formatNumber(totalPrevinv) : "-"}
            </td>
            {/* 1주차 ~ 5주차 출고 */}
            <td className="wg-week-col">
              {totalWeek1 ? formatNumber(totalWeek1) : "-"}
            </td>
            <td className="wg-week-col">
              {totalWeek2 ? formatNumber(totalWeek2) : "-"}
            </td>
            <td className="wg-week-col">
              {totalWeek3 ? formatNumber(totalWeek3) : "-"}
            </td>
            <td className="wg-week-col">
              {totalWeek4 ? formatNumber(totalWeek4) : "-"}
            </td>
            <td className="wg-week-col">
              {totalWeek5 ? formatNumber(totalWeek5) : "-"}
            </td>
            {/* 월 출고량, 월 출고금액 */}
            <td className="wg-month-col">
              {totalMonthlyOutgoing ? formatNumber(totalMonthlyOutgoing) : "-"}
            </td>
            <td className="wg-month-col">
              {totalMonthlyAmount ? formatNumber(totalMonthlyAmount) : "-"}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default WarehouseOutgoing;
