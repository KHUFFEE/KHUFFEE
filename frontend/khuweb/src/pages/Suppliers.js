import React, { useEffect, useState } from "react";
import { fetchSuppliers, addSupplier, deleteSuppliers } from "../api/api";
import "../styles/Suppliers.css";

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

  // Excel 다운로드 핸들러
  const handleDownloadExcel = () => {
    // CSV 형식으로 협력사명만 추출
    const header = "협력사명\n";
    const rows = suppliers.map((supplier) => supplier.협력사명).join("\n");
    // UTF-8 BOM 추가
    const csvContent = "\uFEFF" + header + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "협력사 목록.excel");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            className="suppliers-add-button"
          >
            + 협력사 추가
          </button>
          <button
            onClick={() => {
              setIsDeleteMode((prev) => !prev);
              if (isDeleteMode) setSelectedSuppliers([]);
            }}
            className="suppliers-delete-button"
          >
            {isDeleteMode ? "취소" : "삭제"}
          </button>
        </div>
      <hr className="suppliers-divider" />
      {error && <p className="suppliers-error">{error}</p>}
      <table className="suppliers-table">
        <thead>
          <tr>
            {isDeleteMode && <th className="suppliers-narrow-col">선택</th>}
            <th className="suppliers-number-col">번호</th>
            <th>협력사명</th>
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
          className="suppliers-delete-confirm-button"
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
