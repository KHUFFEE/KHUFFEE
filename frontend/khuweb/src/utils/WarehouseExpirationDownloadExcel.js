// frontend/khuweb/src/utils/WarehouseExpirationDownloadExcel.js
import * as XLSX from "xlsx-js-style";

export const warehouseExpirationDownloadExcel = ({ tableRows }) => {
  // ① 현재 월(두 자리) 및 날짜정보
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const yyyymmdd = `${year}${month}${day}`;

  // ② 파일명, 헤더 제목, 시트명 설정
  const filename = `카페쿠피_${month}월_유통기한관리_관리자용_(${yyyymmdd}).xlsx`;
  const headerTitle = `카페 쿠피 ${month}월 유통기한 관리`;
  const sheetName = `${month}월 유통기한 관리`;

  // ③ 헤더 행 (칼럼: 협력사, 품목명, 유통기한, 개수, 합산, 현재고, 남은 일수)
  const headerRow = [
    "협력사",
    "품목명",
    "유통기한",
    "개수",
    "합산",
    "현재고",
    "남은 일수",
  ];
  const totalCols = headerRow.length;

  // ④ 엑셀 데이터 배열 구성
  // - 행1~2: 상단 제목 (병합)
  // - 행3: 빈 행
  // - 행4: 헤더
  const ws_data = [];
  ws_data[0] = []; // 행 1
  ws_data[1] = []; // 행 2
  ws_data[0][0] = headerTitle;
  ws_data[2] = []; // 행 3 (빈 행)
  ws_data[3] = headerRow; // 행 4: 헤더

  // ④-1 합산값 계산 (품목명별 총합)
  const aggregatedCounts = {};
  tableRows.forEach((row) => {
    const itemName = row.itemName;
    aggregatedCounts[itemName] =
      (aggregatedCounts[itemName] || 0) + Number(row.count);
  });

  // 데이터 행은 4번 행 이후(Excel상 5번 행부터)
  const dataStartRow = 5; // Excel 행번호 (1-indexed)
  tableRows.forEach((row) => {
    const excelRow = [];
    excelRow[0] = row.supplierName;
    excelRow[1] = row.itemName;
    excelRow[2] = row.expiration;
    excelRow[3] = Number(row.count);
    excelRow[4] = aggregatedCounts[row.itemName];
    excelRow[5] = Number(row.currentStock);
    excelRow[6] = row.remainingDays;
    ws_data.push(excelRow);
  });

  // ⑤ 워크시트 생성 (AOA 방식)
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // ⑥ 병합 설정
  ws["!merges"] = ws["!merges"] || [];
  // 상단 제목 행(행1~2)을 전체 칼럼에 대해 병합
  ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 1, c: totalCols - 1 } });

  // ⑦ Header Title 영역에 외부 테두리 적용
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellAddr]) {
        ws[cellAddr] = { t: "s", v: "" };
      }
      ws[cellAddr].s = ws[cellAddr].s || {};
      // (r===0, c===0)인 셀에 폰트 및 가운데 정렬 적용
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
      if (c === totalCols - 1) {
        ws[cellAddr].s.border = ws[cellAddr].s.border || {};
        ws[cellAddr].s.border.right = {
          style: "thin",
          color: { rgb: "000000" },
        };
      }
    }
  }

  // ⑧ 헤더(행4)에 굵은 테두리 적용 (외부 테두리 포함)
  for (let c = 0; c < totalCols; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 3, c });
    if (ws[cellAddr]) {
      ws[cellAddr].s = ws[cellAddr].s || {};
      ws[cellAddr].s.font = { bold: true };
      ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
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

  // ⑨ 데이터 행 기본 스타일 (Arial, 크기 10, 얇은 테두리 및 숫자 서식, 정렬)
  const fullRange = XLSX.utils.decode_range(ws["!ref"]);
  for (let r = 4; r <= fullRange.e.r; r++) {
    for (let c = 0; c < totalCols; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      if (ws[cellAddr]) {
        ws[cellAddr].s = ws[cellAddr].s || {};
        if (c === 0) {
          ws[cellAddr].s.alignment = {
            horizontal: "center",
            vertical: "center",
          };
        }
        // '개수'(col 3)의 숫자 서식
        if (c === 3) {
          ws[cellAddr].s.numFmt = "#,##0;(#,##0);'-'";
        }
        // '합산'(col 4)의 숫자 서식
        if (c === 4) {
          ws[cellAddr].s.numFmt = "#,##0;(#,##0);'-'";
          ws[cellAddr].s.alignment = {
            horizontal: "center",
            vertical: "center",
          };
        }
        // '현재고'(col 5)의 숫자 서식 (0일 때 0으로 표시)
        if (c === 5) {
          ws[cellAddr].s.numFmt = "#,##0;(#,##0);0";
          ws[cellAddr].s.alignment = {
            horizontal: "center",
            vertical: "center",
          };
        }
        // "남은 일수"(col 6)는 오른쪽 정렬 적용
        if (c === 6) {
          ws[cellAddr].s.alignment = {
            horizontal: "right",
            vertical: "center",
          };
        }
        ws[cellAddr].s.font = { name: "Arial", sz: 10 };
        ws[cellAddr].s.border = {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        };
      }
    }
  }

  // ⑩ 협력사(첫번째 칼럼) 기준으로 연속된 행 병합 및 그룹별 하단에 굵은 선 적용
  let startRowIdx = dataStartRow - 1; // 데이터 시작 인덱스 (0-indexed)
  const totalDataRows = tableRows.length;
  while (startRowIdx < dataStartRow - 1 + totalDataRows) {
    const cellAddr = XLSX.utils.encode_cell({ r: startRowIdx, c: 0 });
    const currentSupplier = ws[cellAddr] ? ws[cellAddr].v : "";
    let endRowIdx = startRowIdx;
    while (
      endRowIdx + 1 < dataStartRow - 1 + totalDataRows &&
      ws[XLSX.utils.encode_cell({ r: endRowIdx + 1, c: 0 })] &&
      ws[XLSX.utils.encode_cell({ r: endRowIdx + 1, c: 0 })].v ===
        currentSupplier
    ) {
      endRowIdx++;
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
      // 협력사 그룹의 마지막 행에 대해 전체 열에 굵은 하단 테두리 적용
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

  // ⑩-1 품목명(두 번째 칼럼) 기준으로 '합산'(col 4) 및 '현재고'(col 5) 열 병합 적용
  let startItemRowIdx = dataStartRow - 1; // 0-indexed
  while (startItemRowIdx < dataStartRow - 1 + totalDataRows) {
    const cellAddrItem = XLSX.utils.encode_cell({
      r: startItemRowIdx,
      c: 1,
    });
    const currentItemName = ws[cellAddrItem] ? ws[cellAddrItem].v : "";
    let endItemRowIdx = startItemRowIdx;
    while (
      endItemRowIdx + 1 < dataStartRow - 1 + totalDataRows &&
      ws[XLSX.utils.encode_cell({ r: endItemRowIdx + 1, c: 1 })] &&
      ws[XLSX.utils.encode_cell({ r: endItemRowIdx + 1, c: 1 })].v ===
        currentItemName
    ) {
      endItemRowIdx++;
    }
    if (endItemRowIdx > startItemRowIdx) {
      // '합산' 열(col 4) 병합
      ws["!merges"].push({
        s: { r: startItemRowIdx, c: 4 },
        e: { r: endItemRowIdx, c: 4 },
      });
      const mergeSumAddr = XLSX.utils.encode_cell({
        r: startItemRowIdx,
        c: 4,
      });
      if (ws[mergeSumAddr]) {
        ws[mergeSumAddr].s.alignment = {
          horizontal: "center",
          vertical: "center",
        };
      }
      // '현재고' 열(col 5) 병합
      ws["!merges"].push({
        s: { r: startItemRowIdx, c: 5 },
        e: { r: endItemRowIdx, c: 5 },
      });
      const mergeCurrentAddr = XLSX.utils.encode_cell({
        r: startItemRowIdx,
        c: 5,
      });
      if (ws[mergeCurrentAddr]) {
        ws[mergeCurrentAddr].s.alignment = {
          horizontal: "center",
          vertical: "center",
        };
      }
    }
    startItemRowIdx = endItemRowIdx + 1;
  }

  // ⑪ 데이터 행에서 '합산'(col 4) 값과 '현재고'(col 5) 값이 다르면 두 셀을 붉은 글씨로 지정
  for (let r = 4; r <= fullRange.e.r; r++) {
    const sumCellAddr = XLSX.utils.encode_cell({ r, c: 4 });
    const currentCellAddr = XLSX.utils.encode_cell({ r, c: 5 });
    const sumCell = ws[sumCellAddr];
    const currentCell = ws[currentCellAddr];
    if (sumCell && currentCell && Number(sumCell.v) !== Number(currentCell.v)) {
      // 붉은 글씨 적용
      sumCell.s = sumCell.s || {};
      sumCell.s.font = {
        ...sumCell.s.font,
        color: { rgb: "FF0000" },
      };
      currentCell.s = currentCell.s || {};
      currentCell.s.font = {
        ...currentCell.s.font,
        color: { rgb: "FF0000" },
      };
    }
  }

  // ⑫ 마지막 데이터 행 아래쪽에도 굵은 테두리 적용 (보조)
  const lastDataRow = dataStartRow - 1 + totalDataRows - 1;
  for (let c = 0; c < totalCols; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: lastDataRow, c });
    if (ws[cellAddr]) {
      ws[cellAddr].s = ws[cellAddr].s || {};
      ws[cellAddr].s.border = ws[cellAddr].s.border || {};
      ws[cellAddr].s.border.bottom = {
        style: "thick",
        color: { rgb: "000000" },
      };
    }
  }

  // ⑬ "유통기한" 열 (col index 2) 데이터 값 오른쪽 정렬
  for (let r = 4; r <= fullRange.e.r; r++) {
    const cellAddr = XLSX.utils.encode_cell({ r, c: 2 });
    if (ws[cellAddr]) {
      ws[cellAddr].s.alignment = { horizontal: "right", vertical: "center" };
    }
  }

  // ⑭ 열 너비 자동 조정
  const wsRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const colWidths = [];
  for (let c = 0; c < totalCols; c++) {
    let maxLen = 0;
    wsRows.forEach((row) => {
      const cellVal = row[c];
      if (cellVal) {
        maxLen = Math.max(maxLen, String(cellVal).length);
      }
    });
    colWidths.push({ wch: maxLen + 10 });
  }
  ws["!cols"] = colWidths;

  // ⑮ 워크북 생성 및 파일 저장
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
};
