// frontend/khuweb/src/utils/StoreOrdersDownloadExcel.js
import * as XLSX from "xlsx-js-style";

export const storeOrdersDownloadExcel = ({
  selectedYear,
  selectedMonth,
  selectedWeek,
  isFreeInput,
  freePeriod,
  ordersData,
  orderedStores,
  sortedTableRows,
  storeTotals,
}) => {
  // 1. 기간 정보 추출 (선택값 또는 ordersData.current_period)
  let year, month, week;
  if (selectedYear && selectedMonth && selectedWeek && !isFreeInput) {
    year = selectedYear;
    month = selectedMonth.toString().padStart(2, "0");
    week = selectedWeek;
  } else if (isFreeInput && freePeriod) {
    const parts = freePeriod.split(".");
    year = parts[0];
    month = parts[1];
    week = parts[2];
  } else if (ordersData && ordersData.current_period) {
    const parts = ordersData.current_period.split(".");
    year = parts[0];
    month = parts[1];
    week = parts[2];
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = (now.getMonth() + 1).toString().padStart(2, "0");
    week = "1";
  }

  // 2. 파일명 생성
  const now = new Date();
  const yyyymmdd = `${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
  const filename = `카페쿠피_${year}년_${month}월_${week}주차_발주서_발주서용_(${yyyymmdd}).xlsx`;

  // 3. 상단 제목 (병합된 셀; 제목은 맑은 고딕)
  const headerTitle = `카페 쿠피 ${month}월 ${week}주차 발주 취합`;

  // 4. 시트에 들어갈 데이터 배열 구성
  // 행0~1: 상단 제목, 행2: 빈행, 행3: 헤더 (번호열 없이 "협력사", "품목명", [매장들], "합계", "확인")
  const ws_data = [];
  ws_data[0] = []; // row 1
  ws_data[1] = []; // row 2
  ws_data[0][0] = headerTitle;
  ws_data[2] = []; // row 3 (빈행)

  const headerRow = ["협력사", "품목명"];
  orderedStores.forEach((store) => {
    headerRow.push(formatStoreNameForExcel(store.매장명));
  });
  headerRow.push("합계");
  headerRow.push("확인");
  ws_data[3] = headerRow;
  const totalCols = headerRow.length; // (보통 13)

  // 5. 데이터 행 (엑셀상의 행번호는 5부터 시작)
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
      z: "#,##0;(#,##0);\"-\"",
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
      f: `SUM(${colLetter}${dataStartRow}:${colLetter}${
        dataStartRow + sortedTableRows.length - 1
      })`,
      z: "#,##0;(#,##0);\"-\"",
    };
  }
  totalsRow[totalCols - 1] = ""; // "확인" 열 : 빈칸
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

  // 10. 스타일 적용 (기존 코드와 동일)
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
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
      }
      if (r === 0) {
        ws[cellAddr].s.border = ws[cellAddr].s.border || {};
        ws[cellAddr].s.border.top = { style: "thin", color: { rgb: "000000" } };
      }
      if (r === 1) {
        ws[cellAddr].s.border = ws[cellAddr].s.border || {};
        ws[cellAddr].s.border.bottom = { style: "thin", color: { rgb: "000000" } };
      }
      if (c === 0) {
        ws[cellAddr].s.border = ws[cellAddr].s.border || {};
        ws[cellAddr].s.border.left = { style: "thin", color: { rgb: "000000" } };
      }
      if (c === maxCol - 1) {
        ws[cellAddr].s.border = ws[cellAddr].s.border || {};
        ws[cellAddr].s.border.right = { style: "thin", color: { rgb: "000000" } };
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
        ws[cellAddr].s.border.left = { style: "thick", color: { rgb: "000000" } };
      if (c === totalCols - 1)
        ws[cellAddr].s.border.right = { style: "thick", color: { rgb: "000000" } };
      ws[cellAddr].s.border.top = { style: "thick", color: { rgb: "000000" } };
      ws[cellAddr].s.border.bottom = { style: "thick", color: { rgb: "000000" } };
    }
  }

  for (let r = 4; r < totalsRowIndex; r++) {
    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellAddr]) continue;
      ws[cellAddr].s.font = { name: "Arial", sz: c === 0 ? 12 : 10 };
      if (c >= 2 && c < totalCols - 1) {
        ws[cellAddr].s.numFmt = "#,##0;(#,##0);\"-\"";
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
        ws[mergeAddr].s.alignment = { horizontal: "center", vertical: "center" };
      }
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

  const wb = XLSX.utils.book_new();
  const sheetName = `${month}월 ${week}주차 발주`;
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
      const val = row.orders[store.매장_id];
      return sum + (val ? Number(val) : 0);
    }, 0);
  }
};
