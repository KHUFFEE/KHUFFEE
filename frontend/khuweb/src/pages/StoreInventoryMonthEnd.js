import React, { useState, useEffect, useRef } from "react";
import {
  fetchItems,
  fetchSuppliers,
  fetchStores,
  fetchStoreMonthEndInventory,
  updateStoreMonthEndInventory,
  getTableStatusList,
  updateTableStatus,
} from "../api/api";
import "../styles/StoreInventoryMonthEnd.css";
import LoadingSpinner from "../components/LoadingSpinner";

const StoreInventoryMonthEnd = () => {
  // ※ 기존 StoreOrders.js의 ordersData 대신 재고 관련 데이터를 사용
  const [inventoryData, setInventoryData] = useState(null);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  // 초기 로드시에는 로딩 스피너가 뜨지 않도록 false로 설정
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tableStatus, setTableStatus] = useState(null); // 테이블 상태

  // 기간 선택: 매장은 월말재고이므로 "년"과 "월"만 사용 (주차 제거)
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isFreeInput] = useState(false);
  const [freePeriod, setFreePeriod] = useState("");

  const [distinctPeriods, setDistinctPeriods] = useState([]);

  // Dropdown 관련
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef(null);

  // 원하는 매장 순서 (헤더에 출력할 매장명 – 기존과 동일)
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

  // 팝업 관련 상태 (null, "open", "close")
  const [popupType, setPopupType] = useState(null);

  // API 호출 공통 함수 – manual이 true일 때만 로딩 스피너 동작
  const fetchData = async (params = { page: 1 }, manual = false) => {
    try {
      if (manual) setLoading(true);
      const inventoryResponse = await fetchStoreMonthEndInventory(params);
      // 모든 품목(활성/비활성 구분 없이)을 조회하여, 매장_월말재고 API의 품목_id와 매칭
      const [itemsData, suppliersData, storesData] = await Promise.all([
        fetchItems(true),
        fetchSuppliers(),
        fetchStores(),
      ]);
      setInventoryData(inventoryResponse);
      setItems(itemsData);
      setSuppliers(suppliersData);
      setStores(storesData);
      if (manual) setLoading(false);
    } catch (err) {
      console.error("데이터 불러오기 실패:", err);
      setError("데이터를 불러오는데 실패하였습니다.");
      if (manual) setLoading(false);
    }
  };

  // 초기 로드시에는 manual=false로 호출 → 로딩 스피너 미표시
  useEffect(() => {
    fetchData({ page: 1 }, false);
  }, []);

  // inventoryData.current_period는 "YYYY.MM" 형식임을 가정 (주차 없음)
  useEffect(() => {
    if (inventoryData && inventoryData.current_period) {
      const parts = inventoryData.current_period.split(".");
      setSelectedYear(parts[0]);
      setSelectedMonth(parts[1]);
    }
  }, [inventoryData]);

  // 최신(현재) 기간의 테이블 상태 조회
  const fetchTableStatus = async () => {
    try {
      const statusList = await getTableStatusList();
      const targetStatus = statusList.find(
        (item) => item.테이블 === "매장_월말재고"
      );
      if (targetStatus !== undefined) {
        setTableStatus(targetStatus.상태);
      }
    } catch (err) {
      console.error("테이블 상태 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    if (
      inventoryData &&
      inventoryData.current_period &&
      `${selectedYear}.${selectedMonth}` === inventoryData.current_period
    ) {
      fetchTableStatus();
    } else {
      setTableStatus(null);
    }
  }, [inventoryData, selectedYear, selectedMonth]);

  // distinctPeriods 채우기 (전체 페이지 정보를 별도 호출하여 이용)
  const refreshDistinctPeriods = async () => {
    try {
      // 첫 페이지를 별도로 호출하여 전체 페이지 수를 가져옴
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/inventory/store_monthend/?page=1`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch distinct period");
      }
      const data = await response.json();
      const totalPages = data.total_pages;
      const periodPromises = [];
      for (let p = 1; p <= totalPages; p++) {
        periodPromises.push(
          fetch(
            `${process.env.REACT_APP_API_URL}/api/inventory/store_monthend/?page=${p}`
          )
            .then((response) => {
              if (!response.ok) {
                throw new Error("Failed to fetch distinct period");
              }
              return response.json();
            })
            .then((data) => data.current_period)
        );
      }
      const periods = await Promise.all(periodPromises);
      const unique = Array.from(new Set(periods));
      setDistinctPeriods(unique);
      return unique;
    } catch (err) {
      console.error("Failed to fetch distinct periods", err);
      return [];
    }
  };

  useEffect(() => {
    if (inventoryData && inventoryData.total_pages && distinctPeriods.length === 0) {
      refreshDistinctPeriods();
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
      fetchData({ 기간: freePeriod }, false);
    } else {
      if (!periodValue) {
        alert("년도와 월을 모두 선택해주세요.");
        return;
      }
      fetchData({ 기간: periodValue }, false);
    }
  };

  // 수정 전 최신 조회 버튼 클릭 시 (오직 해당 버튼 클릭 시에만 manual=true → 로딩 스피너 발생)
  const handleReset = async (manual = false) => {
    if (inventoryData && inventoryData.current_period) {
      const parts = inventoryData.current_period.split(".");
      setSelectedYear(parts[0]);
      setSelectedMonth(parts[1]);
    } else {
      setSelectedYear("");
      setSelectedMonth("");
    }
    setFreePeriod("");
    const allPeriods = await refreshDistinctPeriods();
    if (allPeriods.length > 0) {
      const sorted = [...allPeriods].sort((a, b) => {
        const [yearA, monthA] = a.split(".").map(Number);
        const [yearB, monthB] = b.split(".").map(Number);
        if (yearA !== yearB) return yearB - yearA;
        return monthB - monthA;
      });
      const latest = sorted[0];
      fetchData({ 기간: latest }, manual);
    } else {
      fetchData({ page: 1 }, manual);
    }
  };

  // Handle table status toggle
  const handleStatusToggle = async () => {
    try {
      const newStatus = tableStatus === 0 ? 1 : 0;
      await updateTableStatus({ "테이블": "매장_월말재고", "상태": newStatus });
      setTableStatus(newStatus);
    } catch (err) {
      console.error("테이블 상태 업데이트 실패:", err);
      alert("테이블 상태 업데이트에 실패하였습니다.");
    }
  };

  // ───────── 요청사항 반영 ─────────
  // 오픈하기 버튼 클릭 시 0을 post할 때,
  // **품목 테이블에서 활성화가 1인 모든 제품**을 대상으로 업데이트하도록 변경함.
  const handleOpenButtonClick = async () => {
    if (tableStatus === 0) {
      setLoading(true);
      if (!latestPeriodValue) return;
      const [yearStr, monthStr] = latestPeriodValue.split(".");
      let year = parseInt(yearStr, 10);
      let month = parseInt(monthStr, 10) + 1; // next month
      if (month > 12) {
        month = 1;
        year += 1;
      }
      const newPeriod = `${year}.${month.toString().padStart(2, "0")}`;
      try {
        const updatePromises = [];
        // activeItems: 품목 테이블에서 활성화가 1인 제품만 대상으로 함.
        const activeItems = items.filter((item) => item.활성화);
        activeItems.forEach((item) => {
          orderedStores.forEach((store) => {
            const payload = {
              매장_id: store.매장_id,
              품목_id: item.품목_id,
              기간: newPeriod,
              월말_재고량: 0,
            };
            updatePromises.push(updateStoreMonthEndInventory(payload));
          });
        });
        await Promise.all(updatePromises);
        await refreshDistinctPeriods();
        await fetchData({ 기간: newPeriod }, true);
      } catch (err) {
        console.error("오픈 업데이트 실패:", err);
        alert("오픈 업데이트에 실패하였습니다.");
        return;
      }
    }
    handleStatusToggle();
  };
  // ─────────────────────────────────────────

  // 그룹화: inventoryData.inventories의 각 품목별로, 매장별 월말 재고량을 분류
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
  // tableRows를 생성할 때, items 테이블에서 조회한 전체 품목(활성/비활성 모두) 중
  // inventoryData에서 가져온 품목_id와 매칭하여 품목명을 표시하도록 함.
  const tableRows = Object.keys(inventoriesByItem).map((itemId) => {
    const matchedItem = items.find((i) => i.품목_id === itemId);
    const supplier = matchedItem
      ? suppliers.find((s) => s.협력사_id === matchedItem.협력사_id)
      : {};
    return {
      itemId,
      supplierName: supplier ? supplier.협력사명 : "N/A",
      itemName: matchedItem ? matchedItem.품목명 : "N/A",
      type: matchedItem ? matchedItem.종류 : "",
      inventory: inventoriesByItem[itemId] || {},
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
      case "제2기숙사":
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
  const getCellValue = (row, storeId) => {
    if (
      isEditMode &&
      editedInventories[row.itemId] &&
      editedInventories[row.itemId][storeId] !== undefined
    ) {
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
      fetchData({ 기간: inventoryData.current_period }, false);
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

  // 요청사항 1,2: 가장 최근인 기간(최신 기간) 계산 및 버튼 문구 설정
  const latestPeriodValue =
    distinctPeriods.length > 0
      ? [...distinctPeriods].sort((a, b) => {
          const [yearA, monthA] = a.split(".").map(Number);
          const [yearB, monthB] = b.split(".").map(Number);
          if (yearA !== yearB) return yearB - yearA;
          return monthB - monthA;
        })[0]
      : null;
  let latestMonthForButton = null;
  if (latestPeriodValue) {
    const parts = latestPeriodValue.split(".");
    latestMonthForButton = parts[1];
  }

  // 팝업 메시지에 사용할 현재월과 다음월 계산 (버튼 컨텍스트와 일치하도록)
  const currentMonthNumber = latestMonthForButton ? parseInt(latestMonthForButton, 10) : null;
  const nextMonthNumber =
    latestMonthForButton && currentMonthNumber !== null
      ? currentMonthNumber + 1 > 12
        ? 1
        : currentMonthNumber + 1
      : null;

  const openButtonText =
    tableStatus === 0
      ? `${nextMonthNumber}월 오픈하기`
      : `${currentMonthNumber}월 마감하기`;
    
  // 요청사항 2: 최신 기간일 때, 상태 메시지 표시 (3월 마감 상태와 4월 오픈 상태에 따른 메시지)
  let statusMessage = "";
  if (
    latestPeriodValue &&
    `${selectedYear}.${selectedMonth}` === latestPeriodValue &&
    tableStatus !== null
  ) {
    const [latestYear, latestMonth] = latestPeriodValue.split(".");
    if (tableStatus === 1) {
      statusMessage = `현재 매니저가 ${parseInt(latestMonth, 10)}월 재고 입력이 가능한 상태입니다.\n매니저의 ${parseInt(latestMonth, 10)}월 재고 입력을 제한하기 위해서는 마감 버튼을 클릭해주세요.`;
    } else if (tableStatus === 0) {
      let newMonth = parseInt(latestMonth, 10) + 1;
      if (newMonth > 12) {
        newMonth = 1;
      }
      statusMessage = `현재 ${parseInt(latestMonth, 10)}월말 재고 입력은 마감 되었습니다.\n매니저의 ${newMonth}월 재고 입력을 허용하기 위해서는 ${newMonth}월 오픈 버튼을 클릭해주세요.`;
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div>{error}</div>;

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
          {/* 최신 조회 버튼 클릭 시 handleReset(true)로 호출하여 로딩 스피너 발생 */}
          <button className="reset-button" onClick={() => handleReset(true)} disabled={isEditMode}>
            최신 조회
          </button>
          {latestPeriodValue &&
            `${selectedYear}.${selectedMonth}` === latestPeriodValue &&
            tableStatus !== null && (
              <div className="status-message" style={{ whiteSpace: "pre-wrap" }}>
                {statusMessage}
              </div>
            )}
        </div>
        <div className="store-action-buttons">
          {latestPeriodValue &&
            `${selectedYear}.${selectedMonth}` === latestPeriodValue &&
            tableStatus !== null && (
              <button
                className={tableStatus === 0 ? "status-open-button" : "status-close-button"}
                onClick={() => setPopupType(tableStatus === 0 ? "open" : "close")}
                disabled={isEditMode}
              >
                {openButtonText}
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
                      inputMode="decimal"
                      pattern="^\\d*(\\.\\d{0,2})?$"
                      value={
                        editedInventories[row.itemId] &&
                        editedInventories[row.itemId][store.매장_id] !== undefined
                          ? editedInventories[row.itemId][store.매장_id]
                          : ""
                      }
                      onChange={(e) => {
                        let newValue = e.target.value.replace(/,/g, "");
                        if (/^\d*(\.\d{0,2})?$/.test(newValue)) {
                          handleInventoryChange(row.itemId, store.매장_id, newValue);
                        }                        
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

      {/* 팝업 모달 */}
      {popupType && (
        <div className="sime-popup">
          <div className="sime-popup-content">
            {popupType === "open" ? (
              <>
                <h3>!! 주의 !!</h3>
                <p>
                  확인 버튼을 누르면 매니저의 {nextMonthNumber}월말 재고 입력이 허용됩니다.
                </p>
              </>
            ) : (
              <>
                <h3>!! 주의 !!</h3>
                <p>
                  확인 버튼을 누르면 매니저는 {currentMonthNumber}월말 재고 입력이 불가능해지며
                  <br />
                  관리자 외에는 수정 권한이 제한됩니다.
                </p>
              </>
            )}
            <div className="sime-popup-buttons">
              <button className="popup-cancel" onClick={() => setPopupType(null)}>취소</button>
              <button
                className="popup-confirm"
                onClick={() => {
                  if (popupType === "open") {
                    // 오픈하기 버튼 클릭 시 로딩 스피너 발생하도록 manual=true
                    handleOpenButtonClick();
                  } else if (popupType === "close") {
                    handleStatusToggle();
                  }
                  setPopupType(null);
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreInventoryMonthEnd;
