// frontend/khuweb/src/pages/StoreOrders.js
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
  createStoreOrder, // backend의 StoreOrderCreateView 대응
  deleteStoreOrder, // 추가: store_order_delete API 함수
} from "../api/api";
import "../styles/StoreOrders.css";
import "../styles/table.css";
import { storeOrdersDownloadExcel } from "../utils/StoreOrdersDownloadExcel";
import { storeOrdersCombinedDownloadExcel } from "../utils/StoreOrdersCombinedDownloadExcel";
import LoadingSpinner from "../components/LoadingSpinner";

const StoreOrders = () => {
  // 기본 상태
  const [ordersData, setOrdersData] = useState(null); // API로부터 받은 주문 데이터
  const [items, setItems] = useState([]); // fetchItems(true)를 통해 모든 품목 불러옴
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // 드롭다운 open 상태 (기간 검색용)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef(null);

  // 신규: 매장_발주 테이블의 상태 (0이면 오픈, 1이면 마감)
  const [orderTableStatus, setOrderTableStatus] = useState(null);

  // 신규: 오픈하기 팝업 관련 상태
  const [openModalVisible, setOpenModalVisible] = useState(false);

  const [closeModalVisible, setCloseModalVisible] = useState(false);

  // 신규: "기간 수정" 팝업 관련 상태
  const [editPeriodModalVisible, setEditPeriodModalVisible] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  const [editPeriodData, setEditPeriodData] = useState({
    year: currentYear,
    month: currentMonth,
    week: "1",
    round: "1",
  });

  // 신규: 삭제 팝업 관련 상태
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // --- 오픈하기 팝업 내 토글 드롭다운 상태 및 기본값 ---
  const [openModalData, setOpenModalData] = useState({
    year: currentYear,
    month: currentMonth,
    week: "1",
    round: "1",
  });
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [weekDropdownOpen, setWeekDropdownOpen] = useState(false);
  const [roundDropdownOpen, setRoundDropdownOpen] = useState(false);

  // 창고 재고 데이터
  const [warehouseData, setWarehouseData] = useState([]);

  // 새로운: 다운로드 버튼 토글 옵션 표시 여부
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  // ----------------------- Helper functions -----------------------
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  };

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
    const latestPeriod = sortedDistinct[0].split(".").map(Number).join(".");
    isLatestPeriod = currentPeriod === latestPeriod;
  }

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

  // 최신 기간(가장 최근 회차 포함) 계산 (distinctPeriods는 "YYYY.MM.W.R" 형식)
  const latestPeriodValue =
    distinctPeriods.length > 0
      ? [...distinctPeriods].sort((a, b) => {
          const [yearA, monthA, weekA, roundA] = a.split(".").map(Number);
          const [yearB, monthB, weekB, roundB] = b.split(".").map(Number);
          if (yearA !== yearB) return yearB - yearA;
          if (monthA !== monthB) return monthB - monthA;
          if (weekA !== weekB) return weekB - weekA;
          return roundB - roundA;
        })[0]
      : null;

  // ----------------------- Fetch Warehouse Data -----------------------
  useEffect(() => {
    if (selectedYear && selectedMonth && selectedWeek) {
      let computedWarehouseDate = "";
      if (isLatestPeriodFlag) {
        computedWarehouseDate = formatDate(new Date());
      } else {
        const sunday = getWeekSunday(
          Number(selectedYear),
          Number(selectedMonth),
          Number(selectedWeek)
        );
        computedWarehouseDate = formatDate(sunday);
      }
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
      if (!response.ok) throw new Error("Failed to fetch orders");
      const ordersResponse = await response.json();
      // 품목 API: 쿼리 파라미터 all=true를 사용해 활성/비활성 상관없이 모든 품목 조회
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
        initialOrders && initialOrders.total_pages
          ? initialOrders.total_pages
          : 1;
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
      } else {
        await fetchData({ page: 1 }, manual);
      }
    } catch (err) {
      console.error("Failed to fetch distinct periods", err);
    }
    if (manual) setLoading(false);
  };

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

  const formatStoreName = (name) => {
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

  useEffect(() => {
    handleReset(true);
  }, []);

  const fetchOrderTableStatus = async () => {
    try {
      const statusList = await getTableStatusList();
      const targetStatus = statusList.find((s) => s.테이블 === "매장_발주");
      if (targetStatus !== undefined) {
        setOrderTableStatus(targetStatus.상태);
      }
    } catch (err) {
      console.error("Failed to fetch order table status:", err);
    }
  };

  useEffect(() => {
    if (isLatestPeriodFlag) {
      fetchOrderTableStatus();
    } else {
      setOrderTableStatus(null);
    }
  }, [
    ordersData,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedRound,
    isLatestPeriodFlag,
  ]);

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

  // 그룹화: 주문 데이터(매장_발주)에서 품목_id를 기준으로 매장별 주문량 집계
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

  // 매장_발주에 있는 품목_id를 기준으로 품목 테이블의 품목명을 매칭 (fetchItems(true) 사용)
  const orderItemIds = Object.keys(ordersByItem);
  const tableRowsFromOrders = orderItemIds.map((itemId) => {
    const matchedItem = items.find((item) => item.품목_id === itemId);
    const supplier = matchedItem
      ? suppliers.find((s) => s.협력사_id === matchedItem.협력사_id)
      : {};
    return {
      itemId,
      supplierName: supplier ? supplier.협력사명 : "N/A",
      itemName: matchedItem ? matchedItem.품목명 : "N/A",
      type: matchedItem ? matchedItem.종류 : "",
      orders: ordersByItem[itemId] || {},
    };
  });
  const activeItemsNotInOrders = items.filter(
    (item) => item.활성화 && !orderItemIds.includes(item.품목_id)
  );
  const tableRowsFromActive = activeItemsNotInOrders.map((item) => {
    const supplier =
      suppliers.find((s) => s.협력사_id === item.협력사_id) || {};
    return {
      itemId: item.품목_id,
      supplierName: supplier.협력사명 || "N/A",
      itemName: item.품목명 || "N/A",
      type: item.종류 || "",
      orders: {},
    };
  });
  const tableRows = tableRowsFromOrders;

  const sortedTableRows = tableRows.sort((a, b) => {
    const cmpSupplier = a.supplierName.localeCompare(b.supplierName);
    if (cmpSupplier !== 0) return cmpSupplier;
    const cmpType = a.type.localeCompare(b.type);
    if (cmpType !== 0) return cmpType;
    return a.itemName.localeCompare(b.itemName);
  });

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
  const grandTotal = sortedTableRows.reduce(
    (sum, row) => sum + getRowSum(row),
    0
  );

  const formatNumber = (num) => {
    if (num === "" || num === undefined || num === null || Number(num) === 0)
      return "-";
    return Number(num).toLocaleString();
  };

  // 차이 계산: 창고 재고 - 주문 합계
  const getDifference = (row) => {
    const warehouseVal =
      warehouseData && warehouseData.length > 0
        ? Number(
            warehouseData.filter((record) => record.품목_id === row.itemId)[0]
              ?.창고_재고량 || 0
          )
        : 0;
    const rowSum = getRowSum(row);
    return warehouseVal - rowSum;
  };

  // 오픈하기 확인 시 처리
  const handleOpenModalConfirm = async () => {
    const { year, month, week, round } = openModalData;
    const formattedMonth = month.toString().padStart(2, "0");
    const period = `${year}.${formattedMonth}.${week}`;
    const newPeriodFull = `${year}.${formattedMonth}.${week}.${round}`;

    // 중복 기간 체크
    if (distinctPeriods.includes(newPeriodFull)) {
      alert("중복되는 기간으로 오픈 불가능합니다.");
      return;
    }

    setLoading(true);
    try {
      await updateTableStatus({ 테이블: "매장_발주", 상태: 1 });
      const activeItems = items.filter((item) => item.활성화);
      const createPromises = [];
      orderedStores.forEach((store) => {
        activeItems.forEach((item) => {
          const payload = {
            매장_id: store.매장_id,
            품목_id: item.품목_id,
            기간: period,
            회차: Number(round),
            매장_발주량: 0,
          };
          createPromises.push(createStoreOrder(payload));
        });
      });
      await Promise.all(createPromises);
      await handleReset(true);
      fetchData({ 기간: period, 회차: round });
      setOrderTableStatus(1);
      setOpenModalVisible(false);
    } catch (err) {
      console.error("오픈 처리 실패:", err);
      alert("오픈 처리에 실패하였습니다.");
    }
    setLoading(false);
  };

  // 기간 수정 확인 시 처리:
  // 현재 화면에 보이는 모든 주문의 기존 기간/회차를 새롭게 선택한 기간/회차로 업데이트하고,
  // 최신 조회 버튼 클릭 효과와 동일하게 화면을 갱신함.
  // ※ payload에 창고 관련 필드는 포함되지 않음.
  const handlePeriodEditConfirm = async () => {
    const { year, month, week, round } = editPeriodData;
    const formattedMonth = month.toString().padStart(2, "0");
    const newPeriod = `${year}.${formattedMonth}.${week}`;
    const newPeriodFull = `${year}.${formattedMonth}.${week}.${round}`;

    // 중복 기간 체크
    if (distinctPeriods.includes(newPeriodFull)) {
      alert("중복되는 기간으로 변경 불가능합니다.");
      return;
    }

    setLoading(true);
    try {
      const updates = ordersData.orders.map((order) =>
        updateStoreOrder({
          매장_id: order.매장_id,
          품목_id: order.품목_id,
          old_기간: order.기간,
          old_회차: order.회차,
          기간: newPeriod,
          회차: Number(round),
          매장_발주량: order.매장_발주량,
        })
      );
      const results = await Promise.allSettled(updates);
      const rejected = results.filter((r) => r.status === "rejected");
      if (rejected.length > 0) {
        console.error("일부 업데이트 실패:", rejected);
      }
      await handleReset(true);
      setEditPeriodModalVisible(false);
      setIsEditMode(false);
    } catch (err) {
      console.error("기간 수정 실패:", err);
    }
    setLoading(false);
  };

  // 삭제 확인 시 처리: 현재 선택된 기간 및 회차의 데이터를 삭제
  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      if (ordersData && ordersData.orders && ordersData.orders.length > 0) {
        const deletePromises = ordersData.orders.map((order) =>
          deleteStoreOrder({
            매장_id: order.매장_id,
            품목_id: order.품목_id,
            기간: order.기간,
            회차: order.회차,
          })
        );
        await Promise.all(deletePromises);
        if (isEditMode) setIsEditMode(false);
        // 삭제 후 handleReset(true)를 호출하면 최신 기간/회차의 데이터로 화면이 갱신됨
        await handleReset(true);
        setDeleteModalVisible(false);
      } else {
        alert("삭제할 데이터가 없습니다.");
      }
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제에 실패하였습니다.");
    }
    setLoading(false);
  };

  const handleCloseButtonClick = async () => {
    try {
      await updateTableStatus({ 테이블: "매장_발주", 상태: 0 });
      setOrderTableStatus(0);
    } catch (err) {
      console.error("마감 처리 실패:", err);
      alert("마감 처리에 실패하였습니다.");
    }
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
          const originalVal = tableRows.find((row) => row.itemId === itemId)
            ?.orders[storeId];
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
      fetchData({
        기간: ordersData?.current_period || "",
        회차: selectedRound,
      });
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

  const handleCombinedExcelDownload = async () => {
    try {
      await storeOrdersCombinedDownloadExcel({ distinctPeriods });
    } catch (err) {
      console.error("통합 다운로드 실패:", err);
      alert("통합 다운로드에 실패하였습니다.");
    }
  };

  // ========================= 토글 형식의 오픈하기 팝업 (가로 토글) =========================
  // years, months, weeks, rounds 배열은 dropdown 옵션에 사용
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
  const weeks = ["1", "2", "3", "4", "5"];
  const rounds = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  // 최신 기간(년/월/주차/회차)이 선택된 경우에만 메시지를 표시
  let statusMessage = "";
  if (
    latestPeriodValue &&
    `${selectedYear}.${selectedMonth}` ===
      latestPeriodValue.split(".").slice(0, 2).join(".") &&
    orderTableStatus !== null
  ) {
    if (orderTableStatus === 1) {
      statusMessage = `현재 매니저가 발주 입력이 가능한 상태입니다.\n매니저의 발주는 ${selectedYear}년 ${selectedMonth.padStart(2, "0")}월 ${selectedWeek}주차 ${selectedRound}회차로 입력됩니다.`;
    } else if (orderTableStatus === 0) {
      statusMessage = `현재 발주가 마감된 상태입니다.\n매니저의 발주를 허용하기 위해서는 "발주 오픈" 버튼을 클릭해주세요.`;
    }
  }

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
                  const [yearA, monthA, weekA, roundA] = a
                    .split(".")
                    .map(Number);
                  const [yearB, monthB, weekB, roundB] = b
                    .split(".")
                    .map(Number);
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
          {latestPeriodValue &&
            `${selectedYear}.${selectedMonth}` ===
              latestPeriodValue.split(".").slice(0, 2).join(".") &&
            orderTableStatus !== null && (
              <div
                className="status-message"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {statusMessage}
              </div>
            )}
        </div>
        <div className="store-action-buttons">
          {isEditMode ? (
            <>
              <button
                className="delete-button"
                onClick={() => setDeleteModalVisible(true)}
              >
                현재 회차 삭제
              </button>
              <button
                className="session-button"
                onClick={() => setEditPeriodModalVisible(true)}
              >
                기간 변경
              </button>
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
          ) : showDownloadOptions ? (
            <>
              {orderTableStatus !== null &&
                (orderTableStatus === 1 ? (
                  <button
                    className="status-close-button"
                    onClick={() => setCloseModalVisible(true)}
                  >
                    발주 마감
                  </button>
                ) : (
                  <button
                    className="status-open-button"
                    onClick={() => setOpenModalVisible(true)}
                  >
                    발주 오픈
                  </button>
                ))}
              <button
                className="activate-button"
                onClick={() => {
                  setShowDownloadOptions(false);
                  handleExcelDownload();
                }}
              >
                현재 회차
              </button>
              <button
                className="activate-button"
                onClick={() => {
                  setShowDownloadOptions(false);
                  handleCombinedExcelDownload();
                }}
              >
                전체 기간
              </button>
              <button
                className="activate-button"
                onClick={() => setShowDownloadOptions(false)}
              >
                취소
              </button>
              <button className="edit-button" onClick={handleEditToggle}>
                수정
              </button>
            </>
          ) : (
            <>
              {orderTableStatus !== null &&
                (orderTableStatus === 1 ? (
                  <button
                    className="status-close-button"
                    onClick={() => setCloseModalVisible(true)}
                  >
                    발주 마감
                  </button>
                ) : (
                  <button
                    className="status-open-button"
                    onClick={() => setOpenModalVisible(true)}
                  >
                    발주 오픈
                  </button>
                ))}
              <button
                className="download-button"
                onClick={() => setShowDownloadOptions(true)}
              >
                Excel 다운
              </button>
              <button className="edit-button" onClick={handleEditToggle}>
                수정
              </button>
            </>
          )}
        </div>
      </div>
      <hr className="divider" />
      <table className="big-table">
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
            {isLatestPeriodFlag && <th className="so-warehouse-col">창고</th>}
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
                          ? formatNumber(
                              editedOrders[row.itemId][store.매장_id]
                            )
                          : ""
                      }
                      onChange={(e) => {
                        const valueWithoutCommas = e.target.value.replace(
                          /,/g,
                          ""
                        );
                        const numericValue = valueWithoutCommas.replace(
                          /\D/g,
                          ""
                        );
                        handleOrderChange(
                          row.itemId,
                          store.매장_id,
                          numericValue
                        );
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
              <td
                className={`so-sum-col ${
                  isLatestPeriodFlag && getDifference(row) < 0
                    ? "negative-difference"
                    : ""
                }`}
              >
                {getRowSum(row) === 0 ? "-" : formatNumber(getRowSum(row))}
              </td>
              {isLatestPeriodFlag && (
                <td
                  className={`so-warehouse-col ${
                    isLatestPeriodFlag && getDifference(row) < 0
                      ? "negative-difference"
                      : ""
                  }`}
                >
                  {formatNumber(
                    warehouseData.find((rec) => rec.품목_id === row.itemId)
                      ?.창고_재고량 || 0
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="so-number-col"></td>
            <td
              className="so-supplier-col"
              colSpan="2"
              style={{ textAlign: "center" }}
            >
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
            {isLatestPeriodFlag && (
              <td className="so-warehouse-col">
                {warehouseData && warehouseData.length > 0
                  ? formatNumber(
                      sortedTableRows.reduce((sum, row) => {
                        const matchingRecords = warehouseData.filter(
                          (record) => record.품목_id === row.itemId
                        );
                        const value =
                          matchingRecords.length > 0
                            ? Number(matchingRecords[0].창고_재고량 || 0)
                            : 0;
                        return sum + value;
                      }, 0)
                    )
                  : "-"}
              </td>
            )}
          </tr>
        </tfoot>
      </table>

      {/* 오픈하기 팝업 */}
      {openModalVisible && (
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
                  {openModalData.year}
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
                        className={`dropdown-option ${yr === openModalData.year ? "selected-dropdown-option" : ""}`}
                        onClick={() => {
                          setOpenModalData({ ...openModalData, year: yr });
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
                  {openModalData.month}
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
                        className={`dropdown-option ${mo === openModalData.month ? "selected-dropdown-option" : ""}`}
                        onClick={() => {
                          setOpenModalData({ ...openModalData, month: mo });
                          setMonthDropdownOpen(false);
                        }}
                      >
                        {mo}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* 주차 토글 */}
              <div className="toggle-group">
                <button
                  className="period-select-box"
                  onClick={() => setWeekDropdownOpen(!weekDropdownOpen)}
                >
                  {openModalData.week}
                  <span className="toggle">
                    <svg width="16" height="16" viewBox="0 0 22 22">
                      <path
                        d="M7 10l5 5 5-5z"
                        fill="#445382"
                        transform={weekDropdownOpen ? "rotate(180 11 11)" : ""}
                      />
                    </svg>
                  </span>
                </button>
                <span className="toggle-label">주차</span>
                {weekDropdownOpen && (
                  <div className="dropdown-options">
                    {weeks.map((wk) => (
                      <div
                        key={wk}
                        className={`dropdown-option ${wk === openModalData.week ? "selected-dropdown-option" : ""}`}
                        onClick={() => {
                          setOpenModalData({ ...openModalData, week: wk });
                          setWeekDropdownOpen(false);
                        }}
                      >
                        {wk}
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
                  {openModalData.round}
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
                        className={`dropdown-option ${rd === openModalData.round ? "selected-dropdown-option" : ""}`}
                        onClick={() => {
                          setOpenModalData({ ...openModalData, round: rd });
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
                onClick={() => setOpenModalVisible(false)}
              >
                취소
              </button>
              <button
                className="popup-confirm"
                onClick={handleOpenModalConfirm}
              >
                오픈
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 기간 수정 팝업 */}
      {editPeriodModalVisible && (
        <div className="sime-popup">
          <div className="sime-popup-content">
            <h3>기간 변경</h3>
            <div className="toggle-group-container">
              {/* 년도 토글 */}
              <div className="toggle-group">
                <button
                  className="period-select-box"
                  onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                >
                  {editPeriodData.year}
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
                        className={`dropdown-option ${yr === editPeriodData.year ? "selected-dropdown-option" : ""}`}
                        onClick={() => {
                          setEditPeriodData({ ...editPeriodData, year: yr });
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
                  {editPeriodData.month}
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
                        className={`dropdown-option ${mo === editPeriodData.month ? "selected-dropdown-option" : ""}`}
                        onClick={() => {
                          setEditPeriodData({ ...editPeriodData, month: mo });
                          setMonthDropdownOpen(false);
                        }}
                      >
                        {mo}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* 주차 토글 */}
              <div className="toggle-group">
                <button
                  className="period-select-box"
                  onClick={() => setWeekDropdownOpen(!weekDropdownOpen)}
                >
                  {editPeriodData.week}
                  <span className="toggle">
                    <svg width="16" height="16" viewBox="0 0 22 22">
                      <path
                        d="M7 10l5 5 5-5z"
                        fill="#445382"
                        transform={weekDropdownOpen ? "rotate(180 11 11)" : ""}
                      />
                    </svg>
                  </span>
                </button>
                <span className="toggle-label">주차</span>
                {weekDropdownOpen && (
                  <div className="dropdown-options">
                    {weeks.map((wk) => (
                      <div
                        key={wk}
                        className={`dropdown-option ${wk === editPeriodData.week ? "selected-dropdown-option" : ""}`}
                        onClick={() => {
                          setEditPeriodData({ ...editPeriodData, week: wk });
                          setWeekDropdownOpen(false);
                        }}
                      >
                        {wk}
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
                  {editPeriodData.round}
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
                        className={`dropdown-option ${rd === editPeriodData.round ? "selected-dropdown-option" : ""}`}
                        onClick={() => {
                          setEditPeriodData({ ...editPeriodData, round: rd });
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
                onClick={() => setEditPeriodModalVisible(false)}
              >
                취소
              </button>
              <button
                className="popup-confirm"
                onClick={handlePeriodEditConfirm}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 발주 마감 팝업 */}
      {closeModalVisible && (
        <div className="sime-popup">
          <div className="sime-popup-content">
            <h3>!! 주의 !!</h3>
            <p>확인 버튼을 누르면 현재 회차 발주가 마감됩니다.</p>
            <div className="sime-popup-buttons">
              <button
                className="popup-cancel"
                onClick={() => setCloseModalVisible(false)}
              >
                취소
              </button>
              <button
                className="popup-confirm"
                onClick={() => {
                  handleCloseButtonClick();
                  setCloseModalVisible(false);
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 삭제 팝업 */}
      {deleteModalVisible && (
        <div className="sime-popup">
          <div className="sime-popup-content">
            <h3>!! 주의 !!</h3>
            <p>확인 버튼을 누르면 현재 회차 데이터가 영구히 삭제됩니다.</p>
            <div className="sime-popup-buttons">
              <button
                className="popup-cancel"
                onClick={() => setDeleteModalVisible(false)}
              >
                취소
              </button>
              <button className="popup-confirm" onClick={handleDeleteConfirm}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreOrders;
