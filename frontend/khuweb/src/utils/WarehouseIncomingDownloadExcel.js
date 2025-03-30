// frontend/khuweb/src/utils/WarehouseIncomingDownloadExcel.js
import * as XLSX from "xlsx-js-style";

export const warehouseIncomingDownloadExcel = ({
  selectedPeriod,
  tableRows,
}) => {
  // 1. 기간 정보 추출 (selectedPeriod: "YYYY.MM")
  let year, month;
  if (selectedPeriod) {
    const parts = selectedPeriod.split(".");
    year = parts[0];
    month = parts[1].padStart(2, "0");
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
  const filename = `카페쿠피_${year}년_${month}월_창고입고_관리자용_(${yyyymmdd}).xlsx`;

  // 3. 상단 제목 및 시트 이름 설정
  const headerTitle = `카페 쿠피 ${month}월 창고 입고`;
  const sheetName = `${year}년 ${month}월 창고 입고`;

  // 4. 워크시트 데이터 배열 구성
  // - row0, row1: 제목 (병합 대상)
  // - row2: 빈 행
  // - row3: 헤더 (엑셀상의 4행)
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
    "1주차 입고",
    "2주차 입고",
    "3주차 입고",
    "4주차 입고",
    "5주차 입고",
    "월 입고량",
    "월 입고금액",
    "발주량",
    "발주금액",
    "발주합계 부가세x",
    "발주합계 부가세o",
  ];
  ws_data[3] = headerRow;
  const totalCols = headerRow.length;

  // 5. 데이터 행 구성 (엑셀상의 행번호는 5행부터 시작)
  // helper: 발주금액 = 발주량 * 입고단가
  const calculateOrderMoney = (row) => {
    return formatNumber(row.orderAmount) * formatNumber(row.입고단가);
  };

  // 헬퍼 함수: 숫자 변환 – null, NaN인 경우 항상 0 반환
  const formatNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const dataStartRow = 4;
  tableRows.forEach((row, i) => {
    const excelRow = [];
    // 텍스트 필드
    excelRow[0] = row.supplierName || "";
    excelRow[1] = row.itemName || "";
    excelRow[2] = row.규격 || "";
    // 숫자 필드 (값이 null, NaN, 0 인 경우 0으로 처리)
    excelRow[3] = formatNumber(row.입고단가);
    excelRow[4] = formatNumber(row.입고단위단가);
    excelRow[5] = formatNumber(row.prevInv);
    excelRow[6] = formatNumber(row.week1);
    excelRow[7] = formatNumber(row.week2);
    excelRow[8] = formatNumber(row.week3);
    excelRow[9] = formatNumber(row.week4);
    excelRow[10] = formatNumber(row.week5);
    excelRow[11] = formatNumber(row.monthlyIncoming);
    excelRow[12] = formatNumber(row.monthlyAmount);
    excelRow[13] = formatNumber(row.orderAmount);
    excelRow[14] = calculateOrderMoney(row);
    // 발주합계 부가세x, 부가세o – 추후 공급업체별 병합 적용 (우선 빈 값)
    excelRow[15] = "";
    excelRow[16] = "";
    ws_data[dataStartRow + i] = excelRow;
  });

  // 6. 공급업체별 발주합계 (부가세x, 부가세o) 계산 및 그룹별 병합 처리
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
  const supplierGroupOrderSums = {};
  tableRows.forEach((row) => {
    const supplier = row.supplierName || "";
    if (!supplierGroupOrderSums[supplier]) {
      supplierGroupOrderSums[supplier] = { sumEx: 0, sumInc: 0 };
    }
    const orderMoney = calculateOrderMoney(row);
    supplierGroupOrderSums[supplier].sumEx += orderMoney;
    supplierGroupOrderSums[supplier].sumInc += orderMoney * 1.1;
  });
  // 각 그룹의 첫번째 행에 발주합계 값을 기록
  supplierGroupIndices.forEach((group) => {
    const supplier = group.supplier;
    const sums = supplierGroupOrderSums[supplier] || { sumEx: 0, sumInc: 0 };
    ws_data[group.start][15] = sums.sumEx;
    ws_data[group.start][16] = sums.sumInc;
  });

  // 7. 합계 행 추가 (데이터 행 바로 아래)
  const totalsRow = [];
  // 협력사 ~ 입고단위단가 열(0~4) 병합 후 "합계" 텍스트 중앙 정렬
  totalsRow[0] = "합계";
  for (let c = 1; c < 5; c++) {
    totalsRow[c] = "";
  }
  // 전월재고부터 발주금액까지 (열 5 ~ 14)는 수식 셀로 합계 계산
  for (let col = 5; col < 15; col++) {
    const colLetter = XLSX.utils.encode_col(col);
    const firstDataRow = dataStartRow + 1;
    const lastDataRow = dataStartRow + tableRows.length;
    totalsRow[col] = {
      f: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})`,
      // 0인 경우 '-' 대신 0으로 표시
      z: "#,##0;(#,##0);0",
    };
  }
  // 발주합계 부가세x, 부가세o 열은 빈 값 처리
  totalsRow[15] = "";
  totalsRow[16] = "";
  ws_data[dataStartRow + tableRows.length] = totalsRow;
  const totalsRowIndex = ws_data.length - 1;

  // 8. 워크시트 생성 (AOA 방식)
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // 9. 병합 설정
  ws["!merges"] = ws["!merges"] || [];
  // 상단 제목 병합 (row0~1, 전체 열)
  ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 1, c: totalCols - 1 } });
  // 합계 행의 협력사~입고단위단가 셀 병합 (열 0~4)
  ws["!merges"].push({
    s: { r: totalsRowIndex, c: 0 },
    e: { r: totalsRowIndex, c: 4 },
  });
  // 공급업체별 발주합계 열(열 15, 16) 병합 처리
  supplierGroupIndices.forEach((group) => {
    if (group.end > group.start) {
      ws["!merges"].push({
        s: { r: group.start, c: 15 },
        e: { r: group.end, c: 15 },
      });
      ws["!merges"].push({
        s: { r: group.start, c: 16 },
        e: { r: group.end, c: 16 },
      });
      const mergeAddr15 = XLSX.utils.encode_cell({ r: group.start, c: 15 });
      if (!ws[mergeAddr15]) ws[mergeAddr15] = { t: "s", v: "" };
      ws[mergeAddr15].s = ws[mergeAddr15].s || {};
      ws[mergeAddr15].s.alignment = {
        horizontal: "center",
        vertical: "center",
      };
      const mergeAddr16 = XLSX.utils.encode_cell({ r: group.start, c: 16 });
      if (!ws[mergeAddr16]) ws[mergeAddr16] = { t: "s", v: "" };
      ws[mergeAddr16].s = ws[mergeAddr16].s || {};
      ws[mergeAddr16].s.alignment = {
        horizontal: "center",
        vertical: "center",
      };
    }
  });

  // 10. 스타일 적용

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

  // (2) 헤더(엑셀상의 4행, 인덱스 3) 스타일
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

  // (3) 데이터 영역 스타일 (데이터 행: row index 4 ~ totalsRowIndex-1)
  for (let r = 4; r < totalsRowIndex; r++) {
    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
      ws[cellAddr].s = ws[cellAddr].s || {};
      ws[cellAddr].s.font = { name: "Arial", sz: c === 0 ? 12 : 10 };
      // 1주차 입고 ~ 5주차 입고 (열 6~10): 배경색 C9C9C9 적용
      if (c >= 6 && c <= 10) {
        ws[cellAddr].s.fill = {
          patternType: "solid",
          fgColor: { rgb: "C9C9C9" },
        };
      }
      // 발주합계 부가세x, 부가세o (열 15, 16) 및 협력사 열(열 0)은 항상 가운데 정렬
      if (c === 0 || c === 15 || c === 16) {
        ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
      }
      ws[cellAddr].s.border = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };
    }
  }

  // (4) 합계 행 스타일
  for (let c = 0; c < totalCols; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: totalsRowIndex, c });
    if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
    ws[cellAddr].s = ws[cellAddr].s || {};
    // (6) 합계 행의 굵은 글씨 적용 해제 (bold 제거)
    ws[cellAddr].s.font = { name: "Arial", sz: c < 5 ? 12 : 10, bold: false };
    // (7) 합계 행의 숫자(수식) 셀은 우측 정렬 (단, 협력사, 발주합계 부가세x/부가세o는 가운데)
    if (c >= 5 && c < 15) {
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

  // 11. 모든 숫자 셀에 천단위 콤마 포맷 적용
  const numFmtWithDecimals = "#,##0.##"; // 소숫점이 있을 경우 출력 (입고단가만 적용)
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellAddr];
      if (cell && cell.t === "n") {
        cell.s = cell.s || {};
        // 오직 '입고단가'(열 인덱스 3)만 소숫점 표시, 나머지는 정수형식 적용
        if (c === 3) {
          cell.s.numFmt = numFmtWithDecimals;
        } else if (!cell.s.numFmt) {
          cell.s.numFmt = "#,##0";
        }
      }
    }
  }

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
    // 병합은 같은 협력사가 2개 이상일 때만 수행
    if (endRowIdx > startRowIdx) {
      ws["!merges"].push({
        s: { r: startRowIdx, c: 0 },
        e: { r: endRowIdx, c: 0 },
      });
    }
    // 병합된(또는 단일) 협력사 셀 가운데 정렬 적용
    const mergeAddr = XLSX.utils.encode_cell({ r: startRowIdx, c: 0 });
    if (ws[mergeAddr]) {
      ws[mergeAddr].s = ws[mergeAddr].s || {};
      ws[mergeAddr].s.alignment = {
        horizontal: "center",
        vertical: "center",
      };
    }
    // ★ 여기서 그룹의 마지막 행(endRowIdx)에 전체 열에 대해 굵은 하단 선 적용
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

  // 12. 워크북 생성, 시트 추가 후 파일 저장
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
};
