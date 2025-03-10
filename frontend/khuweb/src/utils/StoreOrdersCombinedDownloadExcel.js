// frontend/khuweb/src/utils/StoreOrdersCombinedDownloadExcel.js
import * as XLSX from "xlsx-js-style";
import {
  fetchOrders,
  fetchItems,
  fetchSuppliers,
  fetchStores,
} from "../api/api";

export const storeOrdersCombinedDownloadExcel = async ({ distinctPeriods }) => {
  if (!distinctPeriods || distinctPeriods.length === 0) {
    alert("다운로드할 기간이 없습니다.");
    return;
  }
  // 오름차순(연도/월/주/회차) 정렬
  const sortedPeriods = [...distinctPeriods].sort((a, b) => {
    const [yearA, monthA, weekA, roundA] = a.split(".").map(Number);
    const [yearB, monthB, weekB, roundB] = b.split(".").map(Number);
    if (yearA !== yearB) return yearA - yearB;
    if (monthA !== monthB) return monthA - monthB;
    if (weekA !== weekB) return weekA - weekB;
    return roundA - roundB;
  });

  // 품목, 협력사, 매장은 공통으로 한 번만 조회
  const [items, suppliers, stores] = await Promise.all([
    fetchItems(true),
    fetchSuppliers(),
    fetchStores(),
  ]);

  // 원하는 매장명 순서 설정
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

  // 새 워크북 생성
  const wb = XLSX.utils.book_new();

  // 내부 헬퍼 함수: Excel용 매장명 포맷
  const formatStoreNameForExcel = (name) => {
    switch (name) {
      case "중앙도서관":
        return "중앙\n도서관";
      case "예술디자인대":
        return "예술\n디자인대";
      case "멀티미디어관":
        return "멀티\n미디어관";
      case "제2기숙사":
        return "제2\n기숙사";
      default:
        return name;
    }
  };

  // 각 distinct period에 대해 시트를 생성
  for (const periodStr of sortedPeriods) {
    // periodStr 형식: "YYYY.MM.W.R"
    const parts = periodStr.split(".");
    const [year, month, week, round] = parts;
    const formattedMonth = month.toString().padStart(2, "0");
    const periodParam = `${year}.${formattedMonth}.${week}`;

    // 해당 기간에 대한 발주 데이터 조회 (회차는 round)
    const ordersResponse = await fetchOrders({
      기간: periodParam,
      회차: round,
    });
    const orders = (ordersResponse && ordersResponse.orders) || [];

    // 그룹화: 품목별 매장 주문량
    const ordersByItem = {};
    orders.forEach((order) => {
      const itemId = order.품목_id;
      if (!ordersByItem[itemId]) ordersByItem[itemId] = {};
      ordersByItem[itemId][order.매장_id] = order.매장_발주량;
    });

    // 기본 행 구성: 주문 데이터에 있는 항목
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
    // 추가 행: 활성화되어 있는 품목 중 주문 데이터에 없는 항목
    const activeItemsNotInOrders = items.filter(
      (item) => item.활성화 && !orderItemIds.includes(item.품목_id),
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
    const tableRows = [...tableRowsFromOrders, ...tableRowsFromActive];

    // 정렬
    const sortedTableRows = tableRows.sort((a, b) => {
      const cmpSupplier = a.supplierName.localeCompare(b.supplierName);
      if (cmpSupplier !== 0) return cmpSupplier;
      const cmpType = a.type.localeCompare(b.type);
      if (cmpType !== 0) return cmpType;
      return a.itemName.localeCompare(b.itemName);
    });

    // 각 행의 합계 계산 헬퍼
    const getRowSum = (row) =>
      orderedStores.reduce((sum, store) => {
        const val = row.orders[store.매장_id];
        return sum + (val ? Number(val) : 0);
      }, 0);
    const storeTotals = orderedStores.map((store) =>
      sortedTableRows.reduce((sum, row) => {
        const val = row.orders[store.매장_id];
        return sum + (val ? Number(val) : 0);
      }, 0),
    );

    // 4. 시트에 들어갈 데이터 배열 구성
    // 행0~1: 상단 제목, 행2: 빈행, 행3: 헤더 (번호열 없이 "협력사", "품목명", [매장들], "합계", "확인")
    const ws_data = [];
    ws_data[0] = []; // row 1
    ws_data[1] = []; // row 2
    // 상단 제목: "카페 쿠피 {월}월 {주}주차 {회}회차 발주 취합"
    const headerTitle = `카페 쿠피 ${formattedMonth}월 ${week}주차 ${round}회차 발주 취합`;
    ws_data[0][0] = headerTitle;
    ws_data[2] = []; // row 3 (빈행)
    const headerRow = ["협력사", "품목명"];
    orderedStores.forEach((store) => {
      headerRow.push(formatStoreNameForExcel(store.매장명));
    });
    headerRow.push("합계");
    headerRow.push("확인");
    ws_data[3] = headerRow;
    const totalCols = headerRow.length; // (예: 13)

    // 5. 데이터 행 (엑셀상의 행 번호는 5부터 시작)
    const dataStartRow = 5;
    sortedTableRows.forEach((row, i) => {
      const excelRow = [];
      // A열: 협력사, B열: 품목명
      excelRow[0] = row.supplierName;
      excelRow[1] = row.itemName;
      // C열부터: 각 매장의 발주량 (없으면 빈 값)
      orderedStores.forEach((store, j) => {
        excelRow[2 + j] = row.orders[store.매장_id] || "";
      });
      // "합계" 열 (header의 끝-1) - 수식 셀
      const firstStoreColLetter = XLSX.utils.encode_col(2);
      const lastStoreColLetter = XLSX.utils.encode_col(totalCols - 3);
      const excelRowNumber = dataStartRow + i;
      excelRow[totalCols - 2] = {
        f: `SUM(${firstStoreColLetter}${excelRowNumber}:${lastStoreColLetter}${excelRowNumber})`,
        z: '#,##0;(#,##0);"-"',
      };
      // "확인" 열: 빈칸
      excelRow[totalCols - 1] = "";
      ws_data.push(excelRow);
    });

    // 6. 합계 행: A,B열 병합, 나머지 열은 각 열의 합계 수식
    const totalsRow = [];
    totalsRow[0] = "합계";
    totalsRow[1] = "";
    for (let col = 2; col < totalCols - 1; col++) {
      const colLetter = XLSX.utils.encode_col(col);
      totalsRow[col] = {
        f: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataStartRow + sortedTableRows.length - 1})`,
        z: '#,##0;(#,##0);"-"',
      };
    }
    totalsRow[totalCols - 1] = "";
    ws_data.push(totalsRow);

    // 7. 박스 수량 행 (추가 행)
    const boxRow = [];
    boxRow[0] = "박스 수량";
    boxRow[1] = "";
    for (let i = 2; i < 10; i++) {
      boxRow[i] = "";
    }
    for (let i = 10; i < totalCols; i++) {
      boxRow[i] = "";
    }
    ws_data.push(boxRow);
    const boxRowIndex = ws_data.length - 1;

    // 8. 워크시트 생성 (AOA 방식)
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // 9. 병합 설정
    ws["!merges"] = ws["!merges"] || [];
    ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 1, c: totalCols - 1 } });
    const totalsRowIndex = ws_data.length - 2;
    ws["!merges"].push({
      s: { r: totalsRowIndex, c: 0 },
      e: { r: totalsRowIndex, c: 1 },
    });
    ws["!merges"].push({
      s: { r: boxRowIndex, c: 0 },
      e: { r: boxRowIndex, c: 1 },
    });

    // 10. 스타일 적용 (StoreOrdersDownloadExcel.js와 동일)
    const maxCol = Math.min(totalCols, 13);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < maxCol; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellAddr]) {
          ws[cellAddr] = { t: "s", v: "" };
        }
        ws[cellAddr].s = ws[cellAddr].s || {};
        if (r === 0 && c === 0) {
          ws[cellAddr].s.font = { name: "맑은 고딕", sz: 14, bold: true };
          ws[cellAddr].s.alignment = {
            horizontal: "center",
            vertical: "center",
          };
        }
        if (r === 0) {
          ws[cellAddr].s.border = ws[cellAddr].s.border || {};
          ws[cellAddr].s.border.top = {
            style: "thin",
            color: { rgb: "000000" },
          };
        }
        if (r === 1) {
          ws[cellAddr].s.border = ws[cellAddr].s.border || {};
          ws[cellAddr].s.border.bottom = {
            style: "thin",
            color: { rgb: "000000" },
          };
        }
        if (c === 0) {
          ws[cellAddr].s.border = ws[cellAddr].s.border || {};
          ws[cellAddr].s.border.left = {
            style: "thin",
            color: { rgb: "000000" },
          };
        }
        if (c === maxCol - 1) {
          ws[cellAddr].s.border = ws[cellAddr].s.border || {};
          ws[cellAddr].s.border.right = {
            style: "thin",
            color: { rgb: "000000" },
          };
        }
      }
    }
    const fullRange = XLSX.utils.decode_range(ws["!ref"]);
    for (let r = fullRange.s.r; r <= fullRange.e.r; r++) {
      for (let c = fullRange.s.c; c <= fullRange.e.c; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellAddr]) continue;
        if (r > 1) {
          ws[cellAddr].s = ws[cellAddr].s || {};
          if (r !== totalsRowIndex && r !== boxRowIndex && r !== 3) {
            ws[cellAddr].s.font = { name: "Arial", sz: 10 };
          }
        }
      }
    }
    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 3, c });
      if (ws[cellAddr]) {
        const fontSize = c === 0 ? 12 : 10;
        ws[cellAddr].s.font = { name: "Arial", sz: fontSize, bold: true };
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
        ws[cellAddr].s.border = {};
      }
    }
    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 3, c });
      if (ws[cellAddr]) {
        ws[cellAddr].s.border = ws[cellAddr].s.border || {};
        if (c === 0)
          ws[cellAddr].s.border.left = {
            style: "thick",
            color: { rgb: "000000" },
          };
        if (c === totalCols - 1)
          ws[cellAddr].s.border.right = {
            style: "thick",
            color: { rgb: "000000" },
          };
        ws[cellAddr].s.border.top = {
          style: "thick",
          color: { rgb: "000000" },
        };
        ws[cellAddr].s.border.bottom = {
          style: "thick",
          color: { rgb: "000000" },
        };
      }
    }
    for (let r = 4; r < totalsRowIndex; r++) {
      for (let c = 0; c < totalCols; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellAddr]) continue;
        ws[cellAddr].s.font = { name: "Arial", sz: c === 0 ? 12 : 10 };
        if (c >= 2 && c < totalCols - 1) {
          ws[cellAddr].s.numFmt = '#,##0;(#,##0);"-"';
        }
        ws[cellAddr].s.border = {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        };
      }
    }
    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: boxRowIndex, c });
      if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
      ws[cellAddr].s = ws[cellAddr].s || {};
      if (c < 2) {
        ws[cellAddr].s.font = { name: "Arial", sz: 12, bold: true };
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
      } else {
        ws[cellAddr].s.font = { name: "Arial", sz: 10 };
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
      }
      ws[cellAddr].s.border = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };
    }
    ws["!rows"] = ws["!rows"] || [];
    ws["!rows"][boxRowIndex] = { hpt: 45 };

    let startRowIdx = 4;
    while (startRowIdx < 4 + sortedTableRows.length) {
      const cellAddr = XLSX.utils.encode_cell({ r: startRowIdx, c: 0 });
      const currentSupplier = ws[cellAddr] ? ws[cellAddr].v : "";
      let endRowIdx = startRowIdx;
      while (endRowIdx + 1 < 4 + sortedTableRows.length) {
        const nextCellAddr = XLSX.utils.encode_cell({ r: endRowIdx + 1, c: 0 });
        const nextSupplier = ws[nextCellAddr] ? ws[nextCellAddr].v : "";
        if (nextSupplier === currentSupplier) {
          endRowIdx++;
        } else {
          break;
        }
      }
      if (endRowIdx > startRowIdx) {
        ws["!merges"].push({
          s: { r: startRowIdx, c: 0 },
          e: { r: endRowIdx, c: 0 },
        });
        const mergeAddr = XLSX.utils.encode_cell({ r: startRowIdx, c: 0 });
        if (ws[mergeAddr]) {
          ws[mergeAddr].s.alignment = {
            horizontal: "center",
            vertical: "center",
          };
        }
        for (let col = 0; col < totalCols; col++) {
          const bottomCellAddr = XLSX.utils.encode_cell({
            r: endRowIdx,
            c: col,
          });
          if (ws[bottomCellAddr]) {
            ws[bottomCellAddr].s.border = ws[bottomCellAddr].s.border || {};
            ws[bottomCellAddr].s.border.bottom = {
              style: "thick",
              color: { rgb: "000000" },
            };
          }
        }
      }
      startRowIdx = endRowIdx + 1;
    }

    for (let r = 3; r < totalsRowIndex; r++) {
      for (let c = 2; c < totalCols - 2; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        if (ws[cellAddr]) {
          ws[cellAddr].s.fill = {
            patternType: "solid",
            fgColor: { rgb: "C9C9C9" },
          };
        }
      }
    }

    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: totalsRowIndex, c });
      if (!ws[cellAddr]) continue;
      ws[cellAddr].s = ws[cellAddr].s || {};
      ws[cellAddr].s.font = { name: "Arial", sz: 10 };
      if (c === 0) {
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
      }
      ws[cellAddr].s.border = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };
    }

    const wsRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const colWidths = [];
    for (let col = 0; col < totalCols; col++) {
      let maxLen = 0;
      wsRows.forEach((row) => {
        const cellVal = row[col];
        if (cellVal) {
          maxLen = Math.max(maxLen, String(cellVal).length);
        }
      });
      colWidths.push({ wch: maxLen + 10 });
    }
    ws["!cols"] = colWidths;

    // 11. 숨기기 기능 구현
    for (let i = 0; i < sortedTableRows.length; i++) {
      if (getRowSum(sortedTableRows[i]) === 0) {
        const rowIndex = dataStartRow + i - 1;
        ws["!rows"] = ws["!rows"] || [];
        ws["!rows"][rowIndex] = { hidden: true };
      }
    }
    for (let i = 0; i < orderedStores.length; i++) {
      if (storeTotals[i] === 0) {
        const colIndex = 2 + i;
        ws["!cols"] = ws["!cols"] || [];
        ws["!cols"][colIndex] = ws["!cols"][colIndex] || {};
        ws["!cols"][colIndex].hidden = true;
      }
    }

    // 시트 이름: "{단축년도}년 {월}월 {주}주차 {회}회차 발주"
    const shortYear = String(year).slice(-2);
    const sheetName = `${shortYear}년 ${formattedMonth}월 ${week}주차 ${round}회차 발주`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // 파일명 생성: "카페쿠피_통합_발주취합서_관리자용_(yyyymmdd).xlsx"
  const now = new Date();
  const yyyymmdd = `${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
  const filename = `카페쿠피_통합_발주취합서_관리자용_(${yyyymmdd}).xlsx`;
  XLSX.writeFile(wb, filename);

  function getRowSum(row) {
    return orderedStores.reduce((sum, store) => {
      const val = row.orders[store.매장_id];
      return sum + (val ? Number(val) : 0);
    }, 0);
  }
};
