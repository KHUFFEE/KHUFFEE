// frontend/khuweb/src/utils/ItemDownloadExcel.js
import * as XLSX from "xlsx-js-style";
import { fetchItems, fetchSuppliers } from "../api/api";

export const itemDownloadExcel = async ({
  sortedItems: _ignored1,
  suppliers: _ignored2,
}) => {
  // 0. API에서 데이터 로드
  const items = await fetchItems();
  const suppliers = await fetchSuppliers();

  // 1. 협력사명 → 종류 → 품목명 오름차순 정렬
  items.sort((a, b) => {
    const aSup =
      suppliers.find((s) => s.협력사_id === a.협력사_id)?.협력사명 || "";
    const bSup =
      suppliers.find((s) => s.협력사_id === b.협력사_id)?.협력사명 || "";
    if (aSup !== bSup) {
      return aSup.localeCompare(bSup, undefined, { numeric: true });
    }
    if (a.종류 !== b.종류) {
      return a.종류.localeCompare(b.종류, undefined, { numeric: true });
    }
    return a.품목명.localeCompare(b.품목명, undefined, { numeric: true });
  });

  // 2. 파일명 생성
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");
  const filename = `카페쿠피_제품목록_관리자용_${yyyy}${mm}${dd}.xlsx`;

  // 3. 헤더 정의 및 데이터 매핑
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
  const data = items.map((item) => {
    const sup = suppliers.find((s) => s.협력사_id === item.협력사_id);
    return {
      품목명: item.품목명,
      협력사명: sup ? sup.협력사명 : "",
      종류: item.종류,
      규격: item.규격,
      단위: item.단위,
      입고단가: Number(item.입고단가),
      입고단위: Number(item.입고단위),
      입고단위단가: Number(item.입고단위단가),
      출고단위: Number(item.출고단위),
    };
  });

  // 4. 워크시트 생성 (데이터는 A4부터)
  const ws = XLSX.utils.json_to_sheet(data, {
    header: headers,
    origin: "A4",
  });

  // 5. 상단 제목 영역 병합 및 스타일
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
      ws[addr] = ws[addr] || { t: "s", v: "" };
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

  // 6. 헤더(4행) 스타일 적용
  for (let i = 0; i < headers.length; i++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 3, c: i });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = {
      font: { name: "Arial", bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
        left:
          i === 0 ? { style: "medium", color: { rgb: "000000" } } : undefined,
        right:
          i === headers.length - 1
            ? { style: "medium", color: { rgb: "000000" } }
            : undefined,
      },
    };
  }

  // 7. 나머지 셀 기본 폰트 적용
  Object.keys(ws).forEach((cell) => {
    if (cell[0] === "!" || cell === "A1") return;
    ws[cell].s = ws[cell].s || {};
    ws[cell].s.font = { ...(ws[cell].s.font || {}), name: "Arial" };
  });

  // 8. 열 너비 자동 조정
  const allRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const colWidths = [];
  if (allRows.length) {
    const numCols = Math.max(...allRows.map((r) => r.length));
    for (let c = 0; c < numCols; c++) {
      let maxLen = 0;
      allRows.forEach((row) => {
        if (row[c]) maxLen = Math.max(maxLen, String(row[c]).length);
      });
      colWidths.push({ wch: maxLen + 10 });
    }
    ws["!cols"] = colWidths;
  }

  // 9. 테두리 설정 (전체 영역)
  if (ws["!ref"]) {
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) continue;
        const b = ws[addr].s.border || {};
        if (r === range.s.r)
          b.top = { style: "medium", color: { rgb: "000000" } };
        if (r === range.e.r)
          b.bottom = { style: "medium", color: { rgb: "000000" } };
        if (c === range.s.c)
          b.left = { style: "medium", color: { rgb: "000000" } };
        if (c === range.e.c)
          b.right = { style: "medium", color: { rgb: "000000" } };
        ws[addr].s.border = b;
      }
    }
  }

  // 10. 숫자 포맷 설정
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let r = 4; r <= range.e.r; r++) {
    // 입고단가 (col 5)
    const addr5 = XLSX.utils.encode_cell({ r, c: 5 });
    if (ws[addr5]) {
      ws[addr5].s.alignment = { horizontal: "right", vertical: "center" };
      ws[addr5].s.numFmt = "0.000000";
    }
    // 입고단위(6), 입고단위단가(7), 출고단위(8)
    [6, 7, 8].forEach((c) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr] && typeof ws[addr].v === "number") {
        ws[addr].s.numFmt = "#,##0";
      }
    });
  }

  // 11. 워크북 생성 및 저장
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `카페 쿠피 ${mm}월 제품 목록`);
  XLSX.writeFile(wb, filename);
};
