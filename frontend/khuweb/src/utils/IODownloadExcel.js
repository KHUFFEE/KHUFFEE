import * as XLSX from "xlsx-js-style";
import { fetchItems, fetchSuppliers } from "../api/api";

export const IODownloadExcel = async ({ selectedPeriod }) => {
  // selectedPeriod 예: "2025.05"
  const [year, month] = selectedPeriod.split(".");
  const monthPadded = month.padStart(2, "0");

  // 현재 날짜 포맷 (YYYYMMDD)
  const now = new Date();
  const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

  // 파일명 및 시트명
  const filename = `카페쿠피입출고관리대장_${year}년_${monthPadded}월_관리자용_(${yyyymmdd}).xlsx`;
  const sheetName = "본사창고";

  // 데이터 조회
  let items = [];
  let suppliers = [];
  try {
    items = await fetchItems();
    suppliers = await fetchSuppliers();
  } catch (error) {
    console.error("Failed to fetch items or suppliers", error);
  }

  // AOA 데이터 준비
  const ws_data = [];
  const titleText = `카페 쿠피 ${monthPadded}월 입출고 관리 대장 (본사창고)`;
  ws_data[0] = [titleText];
  ws_data[1] = [titleText];
  ws_data[2] = [];
  ws_data[3] = [
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
    "1주차 출고량",
    "2주차 출고량",
    "3주차 출고량",
    "4주차 출고량",
    "5주차 출고량",
    "월 출고량",
    "월 출고 금액",
    "현재고",
    "현재고 금액",
    "전년도 4월",
    "전년도 5월",
    "전년도 6월",
    "발주량",
    "발주금액",
    "발주합계 (부가세 별도)",
    "발주합계 (부가세 포함)",
  ];
  const headerCount = ws_data[3].length;

  // 데이터 행 채우기 (첫 7개 열만)
  items.forEach((item) => {
    const sup = suppliers.find((s) => s.협력사_id === item.협력사_id);
    const supplierName = sup ? sup.협력사명 : "";
    const row = new Array(headerCount).fill("");
    row[0] = supplierName;
    row[1] = item.품목명;
    row[2] = item.규격;
    row[3] = item.단위;
    row[4] = item.입고단가;
    row[5] = item.입고단위;
    row[6] = item.입고단위단가;
    ws_data.push(row);
  });

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // 제목 병합 (1행~2행, 전체 컬럼)
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 1, c: headerCount - 1 } }];

  // 제목 스타일 적용
  for (let r = 0; r <= 1; r++) {
    for (let c = 0; c < headerCount; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };
      ws[addr].s = ws[addr].s || {};
      ws[addr].s.alignment = { horizontal: "center", vertical: "center" };
      if (r === 0) {
        ws[addr].s.font = { name: "맑은 고딕", sz: 14, bold: true };
      }
    }
  }

  // 헤더 행 스타일 적용 (4행)
  for (let c = 0; c < headerCount; c++) {
    const addr = XLSX.utils.encode_cell({ r: 3, c });
    if (!ws[addr]) ws[addr] = { t: "s", v: ws_data[3][c] };
    ws[addr].s = ws[addr].s || {};
    ws[addr].s.alignment = { horizontal: "center", vertical: "center" };
    ws[addr].s.font = { bold: true };
  }

  // 워크북 생성 및 저장
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
};
