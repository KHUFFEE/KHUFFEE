// frontend/khuweb/src/pages/Suppliers.js
import React, { useEffect, useState } from "react";
import { fetchSuppliers, addSupplier, deleteSuppliers } from "../api/api";
import "../styles/Suppliers.css";
import * as XLSX from "xlsx-js-style";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  // 공용 팝업 알림 상태
  const [alertPopup, setAlertPopup] = useState({ show: false, message: "" });

  useEffect(() => {
    const getSuppliers = async () => {
      try {
        const data = await fetchSuppliers();
        setSuppliers(data);
      } catch (err) {
        setError("Failed to load suppliers");
      }
    };
    getSuppliers();
  }, []);

  const handleAddSupplier = async () => {
    if (!newSupplier.trim()) return;
    try {
      const addedSupplier = await addSupplier(newSupplier);
      setSuppliers((prev) => [...prev, addedSupplier]);
      setNewSupplier("");
      setShowPopup(false);
      setAlertPopup({ show: true, message: "협력사가 성공적으로 추가되었습니다." });
    } catch (err) {
      setAlertPopup({ show: true, message: "협력사 추가에 실패하였습니다." });
    }
  };

  const handleDeleteSuppliers = async () => {
    try {
      await deleteSuppliers(selectedSuppliers);
      setSuppliers((prev) =>
        prev.filter(
          (supplier) => !selectedSuppliers.includes(supplier.협력사명)
        )
      );
      setSelectedSuppliers([]);
      setIsDeleteMode(false);
      setAlertPopup({ show: true, message: "협력사가 성공적으로 삭제되었습니다." });
    } catch (err) {
      setAlertPopup({ show: true, message: "협력사 삭제에 실패하였습니다." });
    }
  };

  const toggleSelect = (name) => {
    setSelectedSuppliers((prev) =>
      prev.includes(name)
        ? prev.filter((selectedName) => selectedName !== name)
        : [...prev, name]
    );
  };

  // Excel 다운로드 핸들러 (xlsx-js-style 적용)
  const handleDownloadExcel = () => {
    // 1. 현재 날짜 및 파일명 생성
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = (now.getMonth() + 1).toString().padStart(2, "0");
    const dd = now.getDate().toString().padStart(2, "0");
    const filename = `카페쿠피_협력사목록_관리자용_${yyyy}${mm}${dd}.xlsx`;

    // 2. JSON 데이터 준비 (협력사명만)
    const data = suppliers.map((supplier) => ({
      "협력사명": supplier.협력사명,
    }));

    // 3. 워크시트 생성 (테이블은 A1부터 시작)
    const ws = XLSX.utils.json_to_sheet(data, {
      header: ["협력사명"],
      origin: "A1",
    });

    // 4. 헤더 셀 (A1) 스타일 적용: 가운데 정렬, 굵은 글씨, 외부 테두리
    const headerCellAddr = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (ws[headerCellAddr]) {
      ws[headerCellAddr].s = ws[headerCellAddr].s || {};
      ws[headerCellAddr].s.font = { name: "Arial", bold: true };
      ws[headerCellAddr].s.alignment = { horizontal: "center", vertical: "center" };
      ws[headerCellAddr].s.border = {
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
        left: { style: "medium", color: { rgb: "000000" } },
        right: { style: "medium", color: { rgb: "000000" } },
      };
    }

    // 5. 전체 폰트를 Arial 로 설정 (헤더 셀 포함)
    for (let cell in ws) {
      if (cell[0] === "!") continue;
      ws[cell].s = ws[cell].s || {};
      // 기존 폰트 속성이 있으면 병합, 없으면 Arial 만 적용
      ws[cell].s.font = { name: "Arial", ...(ws[cell].s.font || {}) };
    }

    // 6. 각 열의 너비 조정 (각 열의 최대 문자열 길이에 +10 여유)
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

    // 7. 테이블 전체 외부 테두리 적용 (헤더부터 마지막 데이터 셀까지)
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

    // 8. 워크북 생성 및 시트 추가
    // 시트 이름은 "카페 쿠피 ${mm}월 협력사 목록" 으로 설정
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `카페 쿠피 ${mm}월 협력사 목록`);
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="suppliers-container">
      <h2 className="title">협력사 관리</h2>
      <div className="controls">
        <button onClick={handleDownloadExcel} className="download-button">
          Excel 다운로드
        </button>
        <button
          onClick={() => setShowPopup(true)}
          className="add-button"
        >
          + 협력사 추가
        </button>
        <button
          onClick={() => {
            setIsDeleteMode((prev) => !prev);
            if (isDeleteMode) setSelectedSuppliers([]);
          }}
          className="delete-button"
        >
          {isDeleteMode ? "취소" : "삭제"}
        </button>
      </div>
      <hr className="divider" />
      {error && <p className="suppliers-error">{error}</p>}
      <table className="suppliers-table">
        <thead>
          <tr>
            {isDeleteMode && <th className="suppliers-narrow-col">선택</th>}
            <th className="suppliers-number-col diagonal-header"></th>
            <th className="suppliers-center-col">협력사명</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier, index) => (
            <tr key={index}>
              {isDeleteMode && (
                <td className="suppliers-narrow-col">
                  <input
                    type="checkbox"
                    checked={selectedSuppliers.includes(supplier.협력사명)}
                    onChange={() => toggleSelect(supplier.협력사명)}
                  />
                </td>
              )}
              <td className="suppliers-number-col">{index + 1}</td>
              <td>{supplier.협력사명}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {isDeleteMode && (
        <button
          onClick={handleDeleteSuppliers}
          disabled={selectedSuppliers.length === 0}
          className="delete-confirm-button"
        >
          선택 삭제
        </button>
      )}

      {/* 협력사 추가 팝업 */}
      {showPopup && (
        <div className="suppliers-popup">
          <div className="suppliers-popup-content">
            <h3>협력사 추가</h3>
            <input
              type="text"
              placeholder="협력사명 입력"
              value={newSupplier}
              onChange={(e) => setNewSupplier(e.target.value)}
              className="suppliers-popup-input"
            />
            <div className="suppliers-popup-buttons">
              <button onClick={() => setShowPopup(false)} className="popup-cancel">
                취소
              </button>
              <button onClick={handleAddSupplier} className="popup-confirm">
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공용 팝업 알림 */}
      {alertPopup.show && (
        <div className="alert-popup">
          <div className="alert-popup-content">
            <p>{alertPopup.message}</p>
            <button
              className="alert-popup-button"
              onClick={() => setAlertPopup({ show: false, message: "" })}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
