// frontend/khuweb/src/utils/IODownloadExcel.js
import * as XLSX from "xlsx-js-style";
import {
  fetchItems,
  fetchSuppliers,
  fetchWarehouseInventory,
  fetchWarehouseIncoming,
  fetchWarehouseOutgoing,
  fetchWarehouseOrders,
} from "../api/api";

export const IODownloadExcel = async ({ selectedPeriod }) => {
  // selectedPeriod 예: "2025.05"
  const [year, month] = selectedPeriod.split(".");
  const monthPadded = month.padStart(2, "0");

  // 현재 날짜 포맷 (YYYYMMDD)
  const now = new Date();
  const yyyyNow = now.getFullYear();
  const mmNow = String(now.getMonth() + 1).padStart(2, "0");
  const ddNow = String(now.getDate()).padStart(2, "0");
  const yyyymmdd = `${yyyyNow}${mmNow}${ddNow}`;

  // 파일명 및 시트명
  const filename = `카페쿠피입출고관리대장_${year}년_${monthPadded}월_관리자용_(${yyyymmdd}).xlsx`;
  const sheetName = "본사창고";

  // 1) 품목·협력사 조회
  let items = [],
    suppliers = [];
  try {
    items = await fetchItems();
    suppliers = await fetchSuppliers();
  } catch (e) {
    console.error("Failed to fetch items or suppliers", e);
  }

  // 2) 정렬: 협력사 asc → 종류 asc → 품목명 asc
  items.sort((a, b) => {
    const nameA =
      suppliers.find((s) => s.협력사_id === a.협력사_id)?.협력사명 || "";
    const nameB =
      suppliers.find((s) => s.협력사_id === b.협력사_id)?.협력사명 || "";
    let cmp = nameA.localeCompare(nameB, undefined, { numeric: true });
    if (cmp !== 0) return cmp;
    cmp = (a.종류 || "").localeCompare(b.종류 || "", undefined, {
      numeric: true,
    });
    if (cmp !== 0) return cmp;
    return (a.품목명 || "").localeCompare(b.품목명 || "", undefined, {
      numeric: true,
    });
  });

  // 3) 주차별 입고 집계
  const weekRange = `${year}.${monthPadded}.1~${year}.${monthPadded}.5`;
  let incomingOrders = [];
  try {
    const res = await fetchWarehouseIncoming({ 기간: weekRange });
    incomingOrders = res.orders || [];
  } catch (e) {
    console.error("Failed to fetch warehouse incoming", e);
  }
  const weeklyInMap = {};
  incomingOrders.forEach((rec) => {
    const wk = parseInt(rec.기간.split(".")[2], 10);
    if (!weeklyInMap[rec.품목_id]) weeklyInMap[rec.품목_id] = [0, 0, 0, 0, 0];
    weeklyInMap[rec.품목_id][wk - 1] += Number(rec.창고_입고량);
  });

  // 4) 주차별 출고 집계
  let outgoingOrders = [];
  try {
    const res = await fetchWarehouseOutgoing({ 기간: weekRange });
    outgoingOrders = res.orders || [];
  } catch (e) {
    console.error("Failed to fetch warehouse outgoing", e);
  }
  const weeklyOutMap = {};
  outgoingOrders.forEach((rec) => {
    const wk = parseInt(rec.기간.split(".")[2], 10);
    if (!weeklyOutMap[rec.품목_id]) weeklyOutMap[rec.품목_id] = [0, 0, 0, 0, 0];
    weeklyOutMap[rec.품목_id][wk - 1] += Number(rec.창고_출고량);
  });

  // 5) 전월 재고 & 현재고 계산
  let prevYear = parseInt(year, 10),
    prevMonth = parseInt(month, 10) - 1;
  if (prevMonth === 0) {
    prevYear--;
    prevMonth = 12;
  }
  const prevMonthStr = String(prevMonth).padStart(2, "0");
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const periodPrev = `${prevYear}.${prevMonthStr}.${String(prevLastDay).padStart(2, "0")}`;
  let periodCurr;
  if (String(yyyyNow) === year && mmNow === monthPadded) {
    periodCurr = `${year}.${monthPadded}.${ddNow}`;
  } else {
    const selLast = new Date(parseInt(year), parseInt(month), 0).getDate();
    periodCurr = `${year}.${monthPadded}.${String(selLast).padStart(2, "0")}`;
  }
  let prevRecs = [],
    currRecs = [];
  try {
    prevRecs = await fetchWarehouseInventory({
      기간: periodPrev,
      매장_id: "ST_102",
    });
    currRecs = await fetchWarehouseInventory({
      기간: periodCurr,
      매장_id: "ST_102",
    });
  } catch (e) {
    console.error("Failed to fetch inventory", e);
  }
  const prevMap = {},
    currMap = {};
  prevRecs.forEach((r) => {
    prevMap[r.품목_id] = Number(r.창고_재고량);
  });
  currRecs.forEach((r) => {
    currMap[r.품목_id] = Number(r.창고_재고량);
  });

  // 5.5) 전년도 해당월 출고 집계 (3개월)
  const prevYearBase = parseInt(year, 10) - 1;
  const baseMon = parseInt(month, 10);
  const prevMonths = [];
  for (let i = 0; i < 3; i++) {
    let m = baseMon + i,
      y = prevYearBase;
    if (m > 12) {
      m -= 12;
      y++;
    }
    prevMonths.push({
      year: y,
      month: String(m).padStart(2, "0"),
      title: String(m),
    });
  }
  const monthlyPrevOut = {};
  prevMonths.forEach((pm, idx) => {
    const range = `${pm.year}.${pm.month}.1~${pm.year}.${pm.month}.5`;
    fetchWarehouseOutgoing({ 기간: range })
      .then((res) => {
        res.orders.forEach((rec) => {
          monthlyPrevOut[idx] = monthlyPrevOut[idx] || {};
          monthlyPrevOut[idx][rec.품목_id] =
            (monthlyPrevOut[idx][rec.품목_id] || 0) + Number(rec.창고_출고량);
        });
      })
      .catch(() => {});
  });

  // 5.75) 발주량 합산 (모든 회차)
  let orderData = [];
  try {
    const resO = await fetchWarehouseOrders({ 기간: `${year}.${monthPadded}` });
    orderData = resO.orders || [];
  } catch (e) {
    console.error("Failed to fetch warehouse orders", e);
  }
  const orderMap = {};
  orderData.forEach((rec) => {
    orderMap[rec.품목_id] =
      (orderMap[rec.품목_id] || 0) + Number(rec.창고_발주량);
  });

  // 6) AOA 준비
  const ws_data = [];
  const title = `카페 쿠피 ${monthPadded}월 입출고 관리 대장 (본사창고)`;
  ws_data[0] = [title];
  ws_data[1] = [title];
  ws_data[2] = [];

  const part1 = [
    "협력사",
    "품목명",
    "규격",
    "단위",
    "입고단가",
    "입고단위",
    "입고단위단가",
    "전월 재고",
    "1주차 입고",
    "2주차 입고",
    "3주차 입고",
    "4주차 입고",
    "5주차 입고",
    "월 입고량",
    "월 입고 금액",
    "1주차 출고",
    "2주차 출고",
    "3주차 출고",
    "4주차 출고",
    "5주차 출고",
    "월 출고량",
    "월 출고 금액",
    "현재고",
    "현재고 금액",
  ];
  const prevTitles = prevMonths.map((pm) => `전년도 ${pm.title}월`);
  const part2 = [
    "발주량",
    "발주금액",
    "발주합계\n(부가세 별도)",
    "발주합계\n(부가세 포함)",
  ];
  ws_data[3] = [...part1, ...prevTitles, ...part2];
  const headerCount = ws_data[3].length;

  // 7) 데이터 채우기
  items.forEach((item) => {
    const sup = suppliers.find((s) => s.협력사_id === item.협력사_id);
    const row = new Array(headerCount).fill("");
    row[0] = sup ? sup.협력사명 : "";
    row[1] = item.품목명;
    row[2] = item.규격;
    row[3] = item.단위;
    row[4] = Number(item.입고단가);
    row[5] = item.입고단위;
    row[6] = item.입고단위단가;
    row[7] = prevMap[item.품목_id] || 0;
    const inWk = weeklyInMap[item.품목_id] || [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) row[8 + i] = inWk[i];
    row[13] = {
      f: `SUM(I${ws_data.length + 1}:M${ws_data.length + 1})`,
      t: "n",
    };
    row[14] = { f: `E${ws_data.length + 1}*N${ws_data.length + 1}`, t: "n" };
    const outWk = weeklyOutMap[item.품목_id] || [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) row[15 + i] = outWk[i];
    row[20] = {
      f: `SUM(P${ws_data.length + 1}:T${ws_data.length + 1})`,
      t: "n",
    };
    row[21] = { f: `E${ws_data.length + 1}*U${ws_data.length + 1}`, t: "n" };
    row[22] = currMap[item.품목_id] || 0;
    row[23] = { f: `E${ws_data.length + 1}*W${ws_data.length + 1}`, t: "n" };
    prevMonths.forEach((pm, idx) => {
      row[24 + idx] = monthlyPrevOut[idx]?.[item.품목_id] || 0;
    });

    // 발주량/발주금액
    const orderColIdx = 24 + prevMonths.length;
    row[orderColIdx] = orderMap[item.품목_id] || 0;
    row[orderColIdx + 1] = {
      f: `E${ws_data.length + 1}*${XLSX.utils.encode_cell({ r: ws_data.length, c: orderColIdx })}`,
      t: "n",
    };
    row[orderColIdx + 2] = "";
    row[orderColIdx + 3] = "";

    ws_data.push(row);
  });

  // --- 합계 행 추가 (전월 재고~발주금액) ---
  const totalsRowIndex = ws_data.length;
  const totalsRow = new Array(headerCount).fill("");
  // 협력사~입고단위단가(0~6) 병합하여 "합계"
  totalsRow[0] = "합계";
  for (let c = 1; c <= 6; c++) totalsRow[c] = "";
  // 전월 재고(7)부터 발주금액(28)까지 SUM 수식
  const firstDataRow = 5;
  const lastDataRow = totalsRowIndex;
  for (let c = 7; c <= 28; c++) {
    const colLetter = XLSX.utils.encode_col(c);
    totalsRow[c] = {
      f: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})`,
      t: "n",
    };
  }
  ws_data.push(totalsRow);

  // 8) 워크시트 생성 & 스타일
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // ─── 행 높이 설정 ───
  ws["!rows"] = [];
  // 4행(0-based r=3)의 높이를 26.25pt로
  ws["!rows"][3] = { hpt: 26.25 };
  // 5행(r=4)부터 합계행(r=totalsRowIndex)까지 높이를 16.5pt로
  for (let r = 4; r <= totalsRowIndex; r++) {
    ws["!rows"][r] = { hpt: 16.5 };
  }
  // ──────────────────────

  // ─── 열 너비 지정 ───
  const cols = Array(headerCount).fill({ width: 12 }); // 기본 너비 11
  cols[0] = { width: 17.85 }; // A열
  cols[1] = { width: 29.45 }; // B열
  cols[2] = { width: 14.73 }; // C열
  cols[3] = { width: 5.88 }; // D열
  cols[4] = { width: 8.98 }; // E열
  cols[5] = { width: 8.98 }; // F열
  // E열부터 AE열(인덱스 4~30)은 기본 11로 그대로
  ws["!cols"] = cols;

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 6 } }, // 0–1행, 0–6열(A–G) 병합
  ];

  // ─── totals row A–G 병합 & 가운데 정렬 ───
  // totals row index는 ws_data.length-1 (마지막 요소)
  const totalRow = ws_data.length - 1;
  // A열(col 0)부터 G열(col 6)까지 병합
  ws["!merges"].push({
    s: { r: totalRow, c: 0 },
    e: { r: totalRow, c: 6 },
  });
  // 병합된 셀(0,0)에 합계 텍스트가 이미 들어있으니 스타일만 지정
  const totalLabelCell = XLSX.utils.encode_cell({ r: totalRow, c: 0 });
  ws[totalLabelCell].s = {
    alignment: { horizontal: "center", vertical: "center" },
  };
  // ───────────────────────────────────────────

  // 상단/헤더 스타일
  for (let r = 0; r <= 1; r++) {
    for (let c = 0; c < headerCount; c++) {
      const a = XLSX.utils.encode_cell({ r, c });
      if (!ws[a]) ws[a] = { t: "s", v: "" };
      ws[a].s = { alignment: { horizontal: "center", vertical: "center" } };
      if (r === 0) ws[a].s.font = { name: "맑은 고딕", sz: 14, bold: true };
      if (c <= 6) {
        ws[a].s.border = {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "medium" },
          right: { style: "medium" },
        };
      }
    }
  }

  for (let c = 0; c < headerCount; c++) {
    const a = XLSX.utils.encode_cell({ r: 3, c });
    if (!ws[a]) ws[a] = { t: "s", v: ws_data[3][c] };
    ws[a].s = {
      alignment: { horizontal: "center", vertical: "center" },
      font: { bold: true },
    };
    ws[a].s = {
      border: {
        top: { style: "medium" },
        bottom: { style: "medium" },
      },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      font: { name: "맑은 고딕", bold: true, sz: 10 },
    };
  }

  // 공급업체 병합
  const merges = ws["!merges"];
  const dataStart = 4,
    dataEnd = ws_data.length - 2; // 최종 합계 전까지
  let groupStart = dataStart,
    prevName = ws_data[dataStart][0];
  for (let r = dataStart + 1; r <= dataEnd; r++) {
    const nm = ws_data[r][0];
    if (nm !== prevName) {
      merges.push({ s: { r: groupStart, c: 0 }, e: { r: r - 1, c: 0 } });
      groupStart = r;
      prevName = nm;
    }
  }
  merges.push({ s: { r: groupStart, c: 0 }, e: { r: dataEnd, c: 0 } });
  ws["!merges"] = merges;
  merges
    .filter((m) => m.s.c === 0 && m.s.r >= dataStart)
    .forEach((m) => {
      const a = XLSX.utils.encode_cell({ r: m.s.r, c: 0 });
      if (!ws[a]) ws[a] = { t: "s", v: ws_data[m.s.r][0] };
      ws[a].s = { alignment: { horizontal: "center", vertical: "center" } };
    });

  // 9) 발주합계 (부가세 별도/포함) 병합 & 수식
  const orderColIdx = 24 + prevMonths.length;
  groupStart = dataStart;
  prevName = ws_data[dataStart][0];
  for (let r = dataStart + 1; r <= dataEnd + 1; r++) {
    const end = r === dataEnd + 1 || ws_data[r][0] !== prevName ? r - 1 : null;
    if (end !== null) {
      const exCol = orderColIdx + 2,
        incCol = orderColIdx + 3;
      merges.push({ s: { r: groupStart, c: exCol }, e: { r: end, c: exCol } });
      merges.push({
        s: { r: groupStart, c: incCol },
        e: { r: end, c: incCol },
      });
      const addrEx = XLSX.utils.encode_cell({ r: groupStart, c: exCol });
      ws[addrEx] = {
        t: "n",
        f: `SUM(${XLSX.utils.encode_col(orderColIdx + 1)}${groupStart + 1}:${XLSX.utils.encode_col(orderColIdx + 1)}${end + 1})`,
      };
      ws[addrEx].s = {
        alignment: { horizontal: "center", vertical: "center" },
      };
      const addrInc = XLSX.utils.encode_cell({ r: groupStart, c: incCol });
      ws[addrInc] = {
        t: "n",
        f: `SUM(${XLSX.utils.encode_col(orderColIdx + 1)}${groupStart + 1}:${XLSX.utils.encode_col(orderColIdx + 1)}${end + 1})*1.1`,
      };
      ws[addrInc].s = {
        alignment: { horizontal: "center", vertical: "center" },
      };
      groupStart = r;
      prevName = ws_data[groupStart]?.[0];
    }
  }
  ws["!merges"] = merges;

  // 10) 나머지 수식(입출고,현재고 등)
  for (let r = dataStart; r <= dataEnd; r++) {
    const rowNum = r + 1;
    const pE = XLSX.utils.encode_col(4),
      startIn = 8,
      endIn = 12;
    ws[XLSX.utils.encode_cell({ r, c: 13 })] = {
      f: `SUM(${XLSX.utils.encode_col(startIn)}${rowNum}:${XLSX.utils.encode_col(endIn)}${rowNum})`,
      t: "n",
    };
    ws[XLSX.utils.encode_cell({ r, c: 14 })] = {
      f: `${pE}${rowNum}*${XLSX.utils.encode_cell({ r, c: 13 })}`,
      t: "n",
    };
    const startOut = 15,
      endOut = 19;
    ws[XLSX.utils.encode_cell({ r, c: 20 })] = {
      f: `SUM(${XLSX.utils.encode_col(startOut)}${rowNum}:${XLSX.utils.encode_col(endOut)}${rowNum})`,
      t: "n",
    };
    ws[XLSX.utils.encode_cell({ r, c: 21 })] = {
      f: `${pE}${rowNum}*${XLSX.utils.encode_cell({ r, c: 20 })}`,
      t: "n",
    };
    ws[XLSX.utils.encode_cell({ r, c: 23 })] = {
      f: `${pE}${rowNum}*${XLSX.utils.encode_col(22)}${rowNum}`,
      t: "n",
    };
  }

  // ─── 사용자 지정 숫자 서식 적용 (H열 전월 재고 ~ AE열 발주합계 포함) ───
  // H열(인덱스 7)부터 AE열(인덱스 30)까지,
  // 헤더(3행) 아래부터 총합계 행(totalsRowIndex) 까지
  const fmtStartCol = 5; // 'H' 열
  const fmtEndCol = 30; // 'AE' 열
  for (let r = dataStart; r <= totalsRowIndex; r++) {
    for (let c = fmtStartCol; c <= fmtEndCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr]) {
        // 사용자 지정 표시 형식 지정
        ws[addr].z = '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';
      }
    }
  }
  // ─── H열~AE열 헤더 아래 데이터 폰트 Arial, 크기 10 ───
  for (let r = dataStart; r <= dataEnd; r++) {
    for (let c = fmtStartCol; c <= fmtEndCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr]) {
        ws[addr].s = ws[addr].s || {};
        ws[addr].s.font = { name: "Arial", sz: 10 };
      }
    }
  }

  // ─── 입고단가 열(‘입고단가’ 헤더 아래 값들) 소수 4자리 사용자 지정 서식 ───
  // ‘입고단가’는 0-based index 기준으로 4번째 열입니다.
  const priceCol = 4; // E열 (입고단가)
  for (let r = dataStart; r <= dataEnd; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: priceCol });
    if (ws[addr]) {
      // 소수점 넉넉히 4자리까지 표시하는 사용자 서식
      ws[addr].z = '_-* #,##0.####_-;-* #,##0.####_-;_-* "-"_-;_-@_-';
    }
  }
  // merges 배열 안에서 협력사 병합 구간만 뽑아냅니다.
  ws["!merges"]
    .filter((m) => m.s.c === 0 && m.e.c === 0 && m.s.r >= dataStart)
    .forEach((m) => {
      const lastRow = m.e.r;
      for (let c = 0; c < headerCount; c++) {
        const addr = XLSX.utils.encode_cell({ r: lastRow, c });
        if (!ws[addr]) ws[addr] = { t: "s", v: ws_data[lastRow][c] || "" };
        // **아래쪽 테두리만 설정**
        ws[addr].s = ws[addr].s || {};
        ws[addr].s.border = ws[addr].s.border || {};
        ws[addr].s.border.bottom = { style: "medium" };
      }
    });

  // ─── 배경색 설정 (Excel 4행부터, 0-based r=3) ───
  const bgStartRow = 3; // Excel 의 4행
  for (let r = bgStartRow; r <= totalsRowIndex; r++) {
    // H열 (c=7) → 노랑 #FFFF00
    const addrH = XLSX.utils.encode_cell({ r, c: 7 });
    if (ws[addrH]) {
      ws[addrH].s = ws[addrH].s || {};
      ws[addrH].s.fill = { patternType: "solid", fgColor: { rgb: "FFFF00" } };
    }

    // I~M열 (c=8~12) → 회색 #C9C9C9
    for (let c = 8; c <= 12; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr]) {
        ws[addr].s = ws[addr].s || {};
        ws[addr].s.fill = { patternType: "solid", fgColor: { rgb: "C9C9C9" } };
      }
    }

    // N열 (c=13) → 연파랑 #BDD7EE
    const addrN = XLSX.utils.encode_cell({ r, c: 13 });
    if (ws[addrN]) {
      ws[addrN].s = ws[addrN].s || {};
      ws[addrN].s.fill = { patternType: "solid", fgColor: { rgb: "BDD7EE" } };
    }

    // O열 (c=14) → 연주황 #F8CBAD
    const addrO = XLSX.utils.encode_cell({ r, c: 14 });
    if (ws[addrO]) {
      ws[addrO].s = ws[addrO].s || {};
      ws[addrO].s.fill = { patternType: "solid", fgColor: { rgb: "F8CBAD" } };
    }

    // U,V열 (c=20,21) → 연노랑 #FFD966
    [20, 21].forEach((cIdx) => {
      const addrUV = XLSX.utils.encode_cell({ r, c: cIdx });
      if (ws[addrUV]) {
        ws[addrUV].s = ws[addrUV].s || {};
        ws[addrUV].s.fill = {
          patternType: "solid",
          fgColor: { rgb: "FFD966" },
        };
      }
    });

    // W열 (c=22) → 회갈색 #D0CECE
    const addrW = XLSX.utils.encode_cell({ r, c: 22 });
    if (ws[addrW]) {
      ws[addrW].s = ws[addrW].s || {};
      ws[addrW].s.fill = { patternType: "solid", fgColor: { rgb: "D0CECE" } };
    }

    // X열 (c=23) → 진파랑 #00B0F0
    const addrX = XLSX.utils.encode_cell({ r, c: 23 });
    if (ws[addrX]) {
      ws[addrX].s = ws[addrX].s || {};
      ws[addrX].s.fill = { patternType: "solid", fgColor: { rgb: "00B0F0" } };
    }
  }
  // ─── A~AE열 모든 셀 thin 테두리 적용 (4행부터 합계행까지) ───
  for (let r = bgStartRow; r <= totalsRowIndex; r++) {
    for (let c = 0; c <= 30; c++) {
      // 0:A열 ~ 30:AE열
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;
      ws[addr].s = ws[addr].s || {};
      const prevBorder = ws[addr].s.border || {};
      ws[addr].s.border = {
        top:
          prevBorder.top && prevBorder.top.style === "medium"
            ? prevBorder.top
            : { style: "thin" },
        bottom:
          prevBorder.bottom && prevBorder.bottom.style === "medium"
            ? prevBorder.bottom
            : { style: "thin" },
        left:
          prevBorder.left && prevBorder.left.style === "medium"
            ? prevBorder.left
            : { style: "thin" },
        right:
          prevBorder.right && prevBorder.right.style === "medium"
            ? prevBorder.right
            : { style: "thin" },
      };
    }
  }
  // ───────────────────────────────────────────

  // 11) 워크북 생성 & 저장
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
};
