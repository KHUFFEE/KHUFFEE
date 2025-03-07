import * as XLSX from "xlsx-js-style";

export const itemDownloadExcel = ({ sortedItems, suppliers }) => {
  // 1. 현재 날짜 및 파일명 생성
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");
  const filename = `카페쿠피_제품목록_관리자용_${yyyy}${mm}${dd}.xlsx`;

  // 2. JSON 데이터 준비 (헤더 순서 유지)
  const headers = [
    "품목명",
    "협력사명",
    "종류",
    "규격",
    "단위",
    "입고단가",
    "입고단위",
    "입고단위단가",
    "출고단위",
  ];
  const data = sortedItems.map((item) => {
    const supplier = suppliers.find((s) => s.협력사_id === item.협력사_id);
    return {
      품목명: item.품목명,
      협력사명: supplier ? supplier.협력사명 : "",
      종류: item.종류,
      규격: item.규격,
      단위: item.단위,
      // 숫자형으로 저장
      입고단가: Number(item.입고단가),
      입고단위: Number(item.입고단위),
      입고단위단가: Number(item.입고단위단가),
      출고단위: Number(item.출고단위),
    };
  });

  // 3. 워크시트 생성: 데이터는 A4부터 시작 (즉, 4행부터 헤더+데이터)
  const ws = XLSX.utils.json_to_sheet(data, {
    header: headers,
    origin: "A4",
  });

  // 4. 상단 제목 영역 설정 및 병합 (A1 ~ I2)
  ws["!merges"] = ws["!merges"] || [];
  const titleMerge = { s: { r: 0, c: 0 }, e: { r: 1, c: headers.length - 1 } };
  ws["!merges"].push(titleMerge);
  ws["A1"] = {
    v: `카페 쿠피 ${mm}월 제품 목록`,
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
  for (let r = titleMerge.s.r; r <= titleMerge.e.r; r++) {
    for (let c = titleMerge.s.c; c <= titleMerge.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (addr === "A1") continue;
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };
      ws[addr].s = ws[addr].s || {};
      ws[addr].s.border = {
        top: r === titleMerge.s.r ? { style: "medium", color: { rgb: "000000" } } : undefined,
        bottom: r === titleMerge.e.r ? { style: "medium", color: { rgb: "000000" } } : undefined,
        left: c === titleMerge.s.c ? { style: "medium", color: { rgb: "000000" } } : undefined,
        right: c === titleMerge.e.c ? { style: "medium", color: { rgb: "000000" } } : undefined,
      };
    }
  }

  // 5. 헤더 행(4행; 0-indexed row 3) 스타일 적용
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
      if (i === 0) borderObj.left = { style: "medium", color: { rgb: "000000" } };
      if (i === headers.length - 1) borderObj.right = { style: "medium", color: { rgb: "000000" } };
      ws[cellAddr].s.border = borderObj;
    }
  }

  // 6. 나머지 셀에 기본 Arial 폰트 적용
  for (let cell in ws) {
    if (cell[0] === "!") continue;
    if (cell === "A1") continue;
    ws[cell].s = ws[cell].s || {};
    const existingFont = ws[cell].s.font || {};
    ws[cell].s.font = { ...existingFont, name: "Arial" };
  }

  // 7. 각 열의 너비 조정
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

  // 8. 전체 테이블 영역에 외부 테두리 적용
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

  // 9. 입고단가 열 오른쪽 정렬
  {
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let r = 4; r <= range.e.r; r++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c: 5 });
      if (ws[cellAddr]) {
        ws[cellAddr].s = ws[cellAddr].s || {};
        ws[cellAddr].s.alignment = { horizontal: "right", vertical: "center" };
        ws[cellAddr].s.numFmt = "0.000000";
      }
    }
  }

  // ★ 새로 추가: 입고단위, 입고단위단가, 출고단위 열에 숫자 포맷 적용
  {
    const numericColumns = [6, 7, 8]; // 입고단위, 입고단위단가, 출고단위
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let r = 4; r <= range.e.r; r++) {
      numericColumns.forEach((c) => {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        if (ws[cellAddr] && typeof ws[cellAddr].v === "number") {
          ws[cellAddr].s = ws[cellAddr].s || {};
          ws[cellAddr].s.numFmt = "#,##0";
        }
      });
    }
  }

  // 10. 워크북 생성 및 저장
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `카페 쿠피 ${mm}월 제품 목록`);
  XLSX.writeFile(wb, filename);
};
