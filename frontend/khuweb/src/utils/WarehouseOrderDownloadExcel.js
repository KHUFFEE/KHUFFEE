// frontend/khuweb/src/utils/WarehouseOrderDownloadExcel.js
import * as XLSX from "xlsx-js-style";

export const warehouseOrderDownloadExcel = ({
  selectedYear,
  selectedMonth,
  selectedRound,
  tableRows,
}) => {
  // 1. 기간 정보 추출
  const year = selectedYear;
  const month = selectedMonth ? selectedMonth.toString().padStart(2, "0") : "";
  const round = selectedRound;

  // 2. 파일명 생성 (현재 날짜 포함)
  const now = new Date();
  const yyyymmdd = `${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
  const filename = `카페쿠피_${year}년_${month}월_${round}회차_창고발주_관리자용_(${yyyymmdd}).xlsx`;

  // 3. 상단 제목 및 시트 이름 설정
  const headerTitle = `카페 쿠피 ${month}월 ${round}회차 창고 발주`;
  const sheetName = `${year}년 ${month}월 ${round}회차 창고 발주`;

  // 4. 동적 전년도 월 헤더 계산
  // (예시: 선택된 월이 03월이면 전년도 3월, 4월, 5월)
  const m = Number(month);
  const m1 = m;
  const m2 = m + 1 > 12 ? m + 1 - 12 : m + 1;
  const m3 = m + 2 > 12 ? m + 2 - 12 : m + 2;
  const prevYearLabel1 = `전년도 ${m1}월`;
  const prevYearLabel2 = `전년도 ${m2}월`;
  const prevYearLabel3 = `전년도 ${m3}월`;

  // 5. 워크시트 데이터 배열 구성
  // row0, row1: 제목 영역, row2: 빈행, row3: 헤더 (엑셀상의 4행)
  const ws_data = [];
  ws_data[0] = [];
  ws_data[1] = [];
  ws_data[0][0] = headerTitle;
  ws_data[2] = [];
  const headerRow = [
    "협력사",
    "품목명",
    "규격",
    "입고단가",
    "입고단위단가",
    "전월재고",
    "현재고",
    "현재고 금액",
    "발주량",
    "발주금액",
    "발주합계 부가세x",
    "발주합계 부가세o",
    prevYearLabel1,
    prevYearLabel2,
    prevYearLabel3,
    "월 출고량",
    "월 출고금액",
  ];
  ws_data[3] = headerRow;
  const totalCols = headerRow.length;

  // 6. 헬퍼 함수 정의
  const formatNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const calculateOrderMoney = (row) =>
    formatNumber(row.orderAmount) * formatNumber(row.입고단가);

  const calculateCurrentInvMoney = (row) =>
    formatNumber(row.currInv) * formatNumber(row.입고단가);

  // 7. 데이터 행 구성 (엑셀상의 5행부터 시작)
  const dataStartRow = 4;
  tableRows.forEach((row, i) => {
    const excelRow = [];
    // 협력사, 품목명, 규격, 입고단가, 입고단위단가
    excelRow[0] = row.supplierName || "";
    excelRow[1] = row.itemName || "";
    excelRow[2] = row.규격 || "";
    excelRow[3] = formatNumber(row.입고단가);
    excelRow[4] = formatNumber(row.입고단위단가);
    // 전월재고, 현재고, 현재고 금액
    excelRow[5] = formatNumber(row.prevInv);
    excelRow[6] = formatNumber(row.currInv);
    excelRow[7] = calculateCurrentInvMoney(row);
    // 발주량, 발주금액
    excelRow[8] = formatNumber(row.orderAmount);
    excelRow[9] = calculateOrderMoney(row);
    // 발주합계 부가세x, 부가세o – 후에 공급업체 그룹별 병합 처리로 채워짐
    excelRow[10] = "";
    excelRow[11] = "";
    // 전년도 월별 (동적)
    excelRow[12] = formatNumber(row.prevOutgoing1);
    excelRow[13] = formatNumber(row.prevOutgoing2);
    excelRow[14] = formatNumber(row.prevOutgoing3);
    // 월 출고량, 월 출고금액
    excelRow[15] = formatNumber(row.currentOutgoing);
    excelRow[16] = formatNumber(row.monthlyOutputAmount);

    ws_data[dataStartRow + i] = excelRow;
  });

  // 8. 공급업체별 병합 셀 계산 (발주합계 부가세x, 부가세o)
  const supplierGroupCounts = {};
  const supplierGroupOrderSums = {};
  tableRows.forEach((row) => {
    const supplier = row.supplierName || "";
    supplierGroupCounts[supplier] = (supplierGroupCounts[supplier] || 0) + 1;
    if (!supplierGroupOrderSums[supplier]) {
      supplierGroupOrderSums[supplier] = { sumEx: 0, sumInc: 0 };
    }
    const orderMoney = calculateOrderMoney(row);
    supplierGroupOrderSums[supplier].sumEx += orderMoney;
    supplierGroupOrderSums[supplier].sumInc += orderMoney * 1.1;
  });

  // 9. 공급업체별 그룹 인덱스 계산 (병합 대상)
  let supplierGroupIndices = [];
  let currentSupplier = null;
  let startIdx = dataStartRow;
  for (let i = 0; i < tableRows.length; i++) {
    const supplier = tableRows[i].supplierName || "";
    if (supplier !== currentSupplier) {
      if (currentSupplier !== null) {
        supplierGroupIndices.push({
          supplier: currentSupplier,
          start: startIdx,
          end: dataStartRow + i - 1,
        });
      }
      currentSupplier = supplier;
      startIdx = dataStartRow + i;
    }
  }
  if (currentSupplier !== null) {
    supplierGroupIndices.push({
      supplier: currentSupplier,
      start: startIdx,
      end: dataStartRow + tableRows.length - 1,
    });
  }
  supplierGroupIndices.forEach((group) => {
    const supplier = group.supplier;
    const sums = supplierGroupOrderSums[supplier] || { sumEx: 0, sumInc: 0 };
    ws_data[group.start][10] = sums.sumEx;
    ws_data[group.start][11] = sums.sumInc;
  });

  // 10. 합계 행 추가 (데이터 행 바로 아래)
  const totalsRow = [];
  // 협력사~입고단위단가 병합 후 "합계" 텍스트 중앙 정렬
  totalsRow[0] = "합계";
  for (let c = 1; c < 5; c++) {
    totalsRow[c] = "";
  }
  // 전월재고, 현재고, 현재고 금액, 발주량, 발주금액: 합계 수식 적용 (열 5~9)
  const firstDataRow = dataStartRow + 1;
  const lastDataRow = dataStartRow + tableRows.length;
  for (let col = 5; col <= 9; col++) {
    const colLetter = XLSX.utils.encode_col(col);
    totalsRow[col] = {
      f: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})`,
      z: "#,##0;(#,##0);0",
    };
  }
  // 발주합계 부가세x, 부가세o는 빈 셀
  totalsRow[10] = "";
  totalsRow[11] = "";
  // 전년도 월별, 월 출고량, 월 출고금액: 합계 (열 12~16)
  for (let col = 12; col <= 16; col++) {
    const colLetter = XLSX.utils.encode_col(col);
    totalsRow[col] = {
      f: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})`,
      z: "#,##0;(#,##0);0",
    };
  }
  ws_data[dataStartRow + tableRows.length] = totalsRow;
  const totalsRowIndex = ws_data.length - 1;

  // 11. 워크시트 생성 (AOA 방식)
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // 12. 병합 설정
  ws["!merges"] = ws["!merges"] || [];
  // 상단 제목 병합 (row0~1, 전체 열)
  ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 1, c: totalCols - 1 } });
  // 합계 행의 협력사~입고단위단가 셀 병합 (열 0~4)
  ws["!merges"].push({
    s: { r: totalsRowIndex, c: 0 },
    e: { r: totalsRowIndex, c: 4 },
  });
  // 공급업체별 발주합계 (부가세x, 부가세o) 병합 처리 (열 10, 11)
  supplierGroupIndices.forEach((group) => {
    if (group.end > group.start) {
      ws["!merges"].push({
        s: { r: group.start, c: 10 },
        e: { r: group.end, c: 10 },
      });
      ws["!merges"].push({
        s: { r: group.start, c: 11 },
        e: { r: group.end, c: 11 },
      });
      const mergeAddr10 = XLSX.utils.encode_cell({ r: group.start, c: 10 });
      if (!ws[mergeAddr10]) ws[mergeAddr10] = { t: "s", v: "" };
      ws[mergeAddr10].s = ws[mergeAddr10].s || {};
      ws[mergeAddr10].s.alignment = {
        horizontal: "center",
        vertical: "center",
      };
      const mergeAddr11 = XLSX.utils.encode_cell({ r: group.start, c: 11 });
      if (!ws[mergeAddr11]) ws[mergeAddr11] = { t: "s", v: "" };
      ws[mergeAddr11].s = ws[mergeAddr11].s || {};
      ws[mergeAddr11].s.alignment = {
        horizontal: "center",
        vertical: "center",
      };
    }
  });

  // 13. 스타일 적용 (참고: WarehouseIncomingDownloadExcel.js)
  // (1) 상단 제목 및 첫 두 행 스타일
  const maxCol = Math.min(totalCols, 17);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < maxCol; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
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

  // (2) 헤더 (엑셀상의 4행, 인덱스 3) 스타일
  for (let c = 0; c < totalCols; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 3, c });
    if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
    ws[cellAddr].s = ws[cellAddr].s || {};
    const fontSize = c === 0 ? 12 : 10;
    ws[cellAddr].s.font = { name: "Arial", sz: fontSize, bold: true };
    ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
    ws[cellAddr].s.border = {
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
      top: { style: "thick", color: { rgb: "000000" } },
      bottom: { style: "thick", color: { rgb: "000000" } },
    };
  }

  // (3) 데이터 영역 스타일 (행 index 4 ~ totalsRowIndex-1)
  for (let r = 4; r < totalsRowIndex; r++) {
    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
      ws[cellAddr].s = ws[cellAddr].s || {};
      ws[cellAddr].s.font = { name: "Arial", sz: c === 0 ? 12 : 10 };
      if (c === 0 || c === 10 || c === 11) {
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
      }
      ws[cellAddr].s.border = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };
      if (c === 8) {
        ws[cellAddr].s.fill = {
          patternType: "solid",
          fgColor: { rgb: "C9C9C9" },
        };
      }
    }
  }

  // (4) 합계 행 스타일
  for (let c = 0; c < totalCols; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: totalsRowIndex, c });
    if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
    ws[cellAddr].s = ws[cellAddr].s || {};
    ws[cellAddr].s.font = { name: "Arial", sz: c < 5 ? 12 : 10, bold: false };
    if ((c >= 5 && c <= 9) || (c >= 12 && c <= 16)) {
      ws[cellAddr].s.alignment = { horizontal: "right", vertical: "center" };
    } else {
      ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
    }
  }

  // (5) 열 너비 자동 설정
  const wsRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const colWidths = [];
  for (let col = 0; col < totalCols; col++) {
    let maxLen = 0;
    wsRows.forEach((row) => {
      const cellVal = row[col];
      if (cellVal || cellVal === 0) {
        maxLen = Math.max(maxLen, String(cellVal).length);
      }
    });
    colWidths.push({ wch: maxLen + 10 });
  }
  ws["!cols"] = colWidths;

  // (6) 모든 숫자 셀에 천단위 콤마 포맷 적용
  const numFmtWithDecimals = "#,##0.##";
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellAddr];
      if (cell && cell.t === "n") {
        cell.s = cell.s || {};
        if (c === 3 || c === 4) {
          cell.s.numFmt = numFmtWithDecimals;
        } else if (!cell.s.numFmt) {
          cell.s.numFmt = "#,##0";
        }
      }
    }
  }

  // (7) 공급업체 셀 병합 (같은 협력사)
  let startRowIdx = dataStartRow;
  while (startRowIdx < dataStartRow + tableRows.length) {
    const cellAddr = XLSX.utils.encode_cell({ r: startRowIdx, c: 0 });
    const currentSupplier = ws[cellAddr] ? ws[cellAddr].v : "";
    let endRowIdx = startRowIdx;
    while (endRowIdx + 1 < dataStartRow + tableRows.length) {
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
    }
    const mergeAddr = XLSX.utils.encode_cell({ r: startRowIdx, c: 0 });
    if (ws[mergeAddr]) {
      ws[mergeAddr].s = ws[mergeAddr].s || {};
      ws[mergeAddr].s.alignment = {
        horizontal: "center",
        vertical: "center",
      };
    }
    // 그룹의 마지막 행에 전체 열에 대해 굵은 하단 선 적용
    for (let col = 0; col < totalCols; col++) {
      const bottomCellAddr = XLSX.utils.encode_cell({ r: endRowIdx, c: col });
      if (!ws[bottomCellAddr]) ws[bottomCellAddr] = { t: "s", v: "" };
      ws[bottomCellAddr].s = ws[bottomCellAddr].s || {};
      ws[bottomCellAddr].s.border = ws[bottomCellAddr].s.border || {};
      ws[bottomCellAddr].s.border.bottom = {
        style: "thick",
        color: { rgb: "000000" },
      };
    }
    startRowIdx = endRowIdx + 1;
  }

  // 14. 워크북 생성, 시트 추가 후 파일 저장
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
};
