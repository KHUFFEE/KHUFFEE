import * as XLSX from "xlsx-js-style";

export const warehouseInventoryDownloadExcel = ({
  selectedYearMonth,
  selectedDay,
  stores,
  selectedStore,
  tableRows,
}) => {
  // 분리한 다운로드 기능 코드

  const [year, month] = selectedYearMonth.split(".");
  const day = selectedDay;
  const now = new Date();
  const yyyyNow = now.getFullYear();
  const mmNow = (now.getMonth() + 1).toString().padStart(2, "0");
  const ddNow = now.getDate().toString().padStart(2, "0");
  const currentDateStr = `${yyyyNow}${mmNow}${ddNow}`;
  const filename = `카페쿠피_${year}년_${month}월_${day}일_창고재고_관리자용_(${currentDateStr}).xlsx`;
  const sheetName = `${month}월 ${day}일 창고 재고`;
  const headerTitle = `카페 쿠피 ${month}월 ${day}일 창고 재고`;

  // 데이터 생성: tableRows 배열에서 필요한 값을 추출
  const data = tableRows.map((row) => ({
    협력사: row.supplierName,
    품목명: row.itemName,
    재고량: row.inventory,
    "재고 금액": row.inventory * row.unitPrice,
  }));

  const headers = ["협력사", "품목명", "재고량", "재고 금액"];
  const ws = XLSX.utils.json_to_sheet(data, {
    header: headers,
    origin: "A4",
  });

  ws["!merges"] = ws["!merges"] || [];
  const titleMerge = { s: { r: 0, c: 0 }, e: { r: 1, c: headers.length - 1 } };
  ws["!merges"].push(titleMerge);
  ws["A1"] = {
    v: headerTitle,
    t: "s",
    s: {
      font: { name: "맑은 고딕", sz: 14, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
        left: { style: "medium", color: { rgb: "000000" } },
        right: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  // 제목 영역의 병합된 셀에 테두리 적용
  for (let r = titleMerge.s.r; r <= titleMerge.e.r; r++) {
    for (let c = titleMerge.s.c; c <= titleMerge.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (addr === "A1") continue;
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };
      ws[addr].s = ws[addr].s || {};
      ws[addr].s.border = {
        top:
          r === titleMerge.s.r
            ? { style: "medium", color: { rgb: "000000" } }
            : undefined,
        bottom:
          r === titleMerge.e.r
            ? { style: "medium", color: { rgb: "000000" } }
            : undefined,
        left:
          c === titleMerge.s.c
            ? { style: "medium", color: { rgb: "000000" } }
            : undefined,
        right:
          c === titleMerge.e.c
            ? { style: "medium", color: { rgb: "000000" } }
            : undefined,
      };
    }
  }

  // 헤더 행 (row 3; A4부터) 스타일 적용
  for (let i = 0; i < headers.length; i++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 3, c: i });
    if (ws[cellAddr]) {
      ws[cellAddr].s = ws[cellAddr].s || {};
      ws[cellAddr].s.font = { name: "Arial", bold: true };
      ws[cellAddr].s.alignment = { horizontal: "center", vertical: "center" };
      const borderObj = {
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
      };
      if (i === 0)
        borderObj.left = { style: "medium", color: { rgb: "000000" } };
      if (i === headers.length - 1)
        borderObj.right = { style: "medium", color: { rgb: "000000" } };
      ws[cellAddr].s.border = borderObj;
    }
  }

  // 전체 셀에 기본 폰트 적용 (Arial)
  for (let cell in ws) {
    if (cell[0] === "!") continue;
    if (cell === "A1") continue;
    ws[cell].s = ws[cell].s || {};
    const existingFont = ws[cell].s.font || {};
    ws[cell].s.font = { ...existingFont, name: "Arial" };
  }

  // 각 열의 너비 자동 조정
  const allRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const colWidths = [];
  if (allRows && allRows.length > 0) {
    const numCols = Math.max(...allRows.map((r) => r.length));
    for (let col = 0; col < numCols; col++) {
      let maxLen = 0;
      allRows.forEach((row) => {
        const cellVal = row[col];
        if (cellVal) {
          maxLen = Math.max(maxLen, String(cellVal).length);
        }
      });
      colWidths.push({ wch: maxLen + 10 });
    }
  }
  ws["!cols"] = colWidths;

  // 전체 테이블 영역에 외부 테두리 적용
  if (ws["!ref"]) {
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellAddr]) continue;
        let borderObj = ws[cellAddr].s.border || {};
        if (r === range.s.r) {
          borderObj.top = { style: "medium", color: { rgb: "000000" } };
        }
        if (r === range.e.r) {
          borderObj.bottom = { style: "medium", color: { rgb: "000000" } };
        }
        if (c === range.s.c) {
          borderObj.left = { style: "medium", color: { rgb: "000000" } };
        }
        if (c === range.e.c) {
          borderObj.right = { style: "medium", color: { rgb: "000000" } };
        }
        ws[cellAddr].s.border = borderObj;
      }
    }
  }

  // 숫자 포맷 및 오른쪽 정렬 적용 (재고량과 재고 금액)
  if (ws["!ref"]) {
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let r = 4; r <= range.e.r; r++) {
      const qtyCellAddr = XLSX.utils.encode_cell({ r, c: 2 });
      if (ws[qtyCellAddr]) {
        ws[qtyCellAddr].t = "n";
        ws[qtyCellAddr].z = "#,##0";
      }
      const amtCellAddr = XLSX.utils.encode_cell({ r, c: 3 });
      if (ws[amtCellAddr]) {
        ws[amtCellAddr].t = "n";
        ws[amtCellAddr].z = "#,##0";
        ws[amtCellAddr].s = ws[amtCellAddr].s || {};
        ws[amtCellAddr].s.alignment = {
          horizontal: "right",
          vertical: "center",
        };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
};
