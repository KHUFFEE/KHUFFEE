// frontend/khuweb/src/utils/StoreInventoryMonthEndDownloadExcel.js
import * as XLSX from "xlsx-js-style";

export const storeInventoryMonthEndDownloadExcel = ({
  selectedYear,
  selectedMonth,
  isFreeInput,
  freePeriod,
  inventoryData,
  orderedStores,
  sortedTableRows,
  storeTotals,
}) => {
  // 1. 기간 정보 추출 (선택값 또는 inventoryData.current_period 사용)
  let year, month;
  if (selectedYear && selectedMonth && !isFreeInput) {
    year = selectedYear;
    month = selectedMonth.toString().padStart(2, "0");
  } else if (isFreeInput && freePeriod) {
    const parts = freePeriod.split(".");
    year = parts[0];
    month = parts[1];
  } else if (inventoryData && inventoryData.current_period) {
    const parts = inventoryData.current_period.split(".");
    year = parts[0];
    month = parts[1];
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = (now.getMonth() + 1).toString().padStart(2, "0");
  }

  // 2. 파일명 생성 (현재 날짜 포함)
  const now = new Date();
  const yyyymmdd = `${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
  const filename = `카페쿠피_${year}년_${month}월_매장월말재고_관리자용_(${yyyymmdd}).xlsx`;

  // 3. 상단 제목 (병합 대상)
  const headerTitle = `카페 쿠피 ${month}월 매장 월말 재고`;

  // 4. 시트 데이터 배열 구성
  // 행0~1: 상단 제목(병합), 행2: 빈 행, 행3: 헤더
  const ws_data = [];
  ws_data[0] = []; // row 1
  ws_data[1] = []; // row 2
  ws_data[0][0] = headerTitle;
  ws_data[2] = []; // row 3 (빈 행)

  // 헤더: "협력사", "품목명", [매장명(각각)], "합계"
  const headerRow = ["협력사", "품목명"];
  orderedStores.forEach((store) => {
    headerRow.push(formatStoreNameForExcel(store.매장명));
  });
  headerRow.push("합계");
  ws_data[3] = headerRow;
  const totalCols = headerRow.length;

  // 5. 데이터 행 (엑셀상의 행번호는 5부터 시작)
  const dataStartRow = 4; // ws_data index 4 corresponds to Excel row 5
  sortedTableRows.forEach((row, i) => {
    const excelRow = [];
    // A열: 협력사, B열: 품목명
    excelRow[0] = row.supplierName;
    excelRow[1] = row.itemName;
    // C열부터: 각 매장의 재고 (없으면 빈 값)
    orderedStores.forEach((store, j) => {
      excelRow[2 + j] = row.inventory[store.매장_id] || "";
    });
    // "합계" 열: 수식 셀 (각 매장 열의 합계)
    const firstStoreColLetter = XLSX.utils.encode_col(2);
    const lastStoreColLetter = XLSX.utils.encode_col(totalCols - 2);
    // Excel row numbering is 1-indexed; 데이터 행은 5행부터 시작하므로 add 1
    const excelRowNumber = dataStartRow + i + 1;
    excelRow[totalCols - 1] = {
      f: `SUM(${firstStoreColLetter}${excelRowNumber}:${lastStoreColLetter}${excelRowNumber})`,
      z: '#,##0;(#,##0);"-"',
    };
    ws_data.push(excelRow);
  });

  // 6. 합계 행: A, B열 병합, 나머지 열은 각 열의 합계 수식
  const totalsRow = [];
  totalsRow[0] = "합계";
  totalsRow[1] = "";
  for (let col = 2; col < totalCols - 1; col++) {
    const colLetter = XLSX.utils.encode_col(col);
    // 합계는 항상 5행(= dataStartRow+1)부터 데이터 행의 마지막까지 (즉, 합계 행 직전 행까지)
    totalsRow[col] = {
      f: `SUM(${colLetter}${dataStartRow + 1}:${colLetter}${dataStartRow + sortedTableRows.length})`,
      z: '#,##0;(#,##0);"-"',
    };
  }
  totalsRow[totalCols - 1] = "";
  ws_data.push(totalsRow);
  const totalsRowIndex = ws_data.length - 1;

  // 7. 워크시트 생성 (AOA 방식)
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // 8. 병합 설정
  ws["!merges"] = ws["!merges"] || [];
  // 상단 제목 병합: row0~1, 전체 열
  ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 1, c: totalCols - 1 } });
  // 합계 행에서 A, B열 병합
  ws["!merges"].push({
    s: { r: totalsRowIndex, c: 0 },
    e: { r: totalsRowIndex, c: 1 },
  });

  // 9. 스타일 적용
  const maxCol = Math.min(totalCols, 13);
  // 상단 제목 및 첫 두 행 스타일
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < maxCol; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellAddr]) {
        ws[cellAddr] = { t: "s", v: "" };
      }
      ws[cellAddr].s = ws[cellAddr].s || {};
      if (r === 0 && c === 0) {
        ws[cellAddr].s.font = { name: "맑은 고딕", sz: 14, bold: true };
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
      }
      if (r === 0) {
        ws[cellAddr].s.border = ws[cellAddr].s.border || {};
        ws[cellAddr].s.border.top = { style: "thin", color: { rgb: "000000" } };
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

  // 전체 셀에 기본 폰트 적용
  const fullRange = XLSX.utils.decode_range(ws["!ref"]);
  for (let r = fullRange.s.r; r <= fullRange.e.r; r++) {
    for (let c = fullRange.s.c; c <= fullRange.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellAddr]) continue;
      if (r > 1) {
        ws[cellAddr].s = ws[cellAddr].s || {};
        if (r !== totalsRowIndex && r !== 3) {
          ws[cellAddr].s.font = { name: "Arial", sz: 10 };
        }
      }
    }
  }

  // 헤더(행3) 스타일
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
      ws[cellAddr].s.border.left = { style: "thin", color: { rgb: "000000" } };
      ws[cellAddr].s.border.right = { style: "thin", color: { rgb: "000000" } };
      ws[cellAddr].s.border.top = { style: "thick", color: { rgb: "000000" } };
      ws[cellAddr].s.border.bottom = {
        style: "thick",
        color: { rgb: "000000" },
      };
    }
  }
  // 데이터 영역(행4부터 합계행 전까지) 스타일
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

  // ★ 추가 1: 매장 열(인덱스 2 ~ totalCols-2)에 대학 배경색 지정
  // (합계 열은 제외)
  for (let r = 3; r < totalsRowIndex; r++) {
    for (let c = 2; c < totalCols - 1; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      if (ws[cellAddr]) {
        ws[cellAddr].s.fill = {
          patternType: "solid",
          fgColor: { rgb: "C9C9C9" },
        };
      }
    }
  }

  // ★ 추가 2: 합계행 위(합계행의 top)에 검은 선(두꺼운 선) 표시
  for (let c = 0; c < totalCols; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: totalsRowIndex, c });
    if (ws[cellAddr]) {
      ws[cellAddr].s = ws[cellAddr].s || {};
      ws[cellAddr].s.border = ws[cellAddr].s.border || {};
      ws[cellAddr].s.border.top = { style: "thick", color: { rgb: "000000" } };
    }
  }

  // ★ 추가 3: 협력사 열(첫 번째 열)을 같은 협력사끼리 병합
  let startRowIdx = dataStartRow;
  while (startRowIdx < dataStartRow + sortedTableRows.length) {
    const cellAddr = XLSX.utils.encode_cell({ r: startRowIdx, c: 0 });
    const currentSupplier = ws[cellAddr] ? ws[cellAddr].v : "";
    let endRowIdx = startRowIdx;
    while (endRowIdx + 1 < dataStartRow + sortedTableRows.length) {
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
      // 병합된 마지막 행에 두꺼운 하단 선 적용
      for (let col = 0; col < totalCols; col++) {
        const bottomCellAddr = XLSX.utils.encode_cell({ r: endRowIdx, c: col });
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

  const totalsLabelCellAddr = XLSX.utils.encode_cell({
    r: totalsRowIndex,
    c: 0,
  });
  if (ws[totalsLabelCellAddr]) {
    ws[totalsLabelCellAddr].s.alignment = {
      horizontal: "center",
      vertical: "center",
    };
  }

  // 열 너비 자동 설정
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

  // 10. 숨기기 기능 구현
  //    - 모든 매장에 대해 데이터가 없는(즉, 각 매장의 값이 0인) 행은 숨김 처리
  //    - 각 매장 열의 총합이 0이면 해당 열도 숨김 처리
  for (let i = 0; i < sortedTableRows.length; i++) {
    if (getRowSum(sortedTableRows[i]) === 0) {
      // 수정: 행 인덱스는 dataStartRow + i (즉, Excel상에서 5행부터 시작)
      const rowIndex = dataStartRow + i;
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

  const wb = XLSX.utils.book_new();
  const sheetName = `${year}년 ${month}월 매장 월말 재고`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);

  // ─────────────────────────────
  // 내부 헬퍼 함수들
  function formatStoreNameForExcel(name) {
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
  }

  function getRowSum(row) {
    return orderedStores.reduce((sum, store) => {
      const val = row.inventory[store.매장_id];
      return sum + (val ? Number(val) : 0);
    }, 0);
  }
};
