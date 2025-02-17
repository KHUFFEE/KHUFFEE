import React, { useEffect, useState } from "react";
import { fetchItems, fetchSuppliers, addItem, deleteItems, updateItem } from "../api/api";
import "../styles/Item.css";
import * as XLSX from "xlsx";

const Item = () => {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // 선택된 품목들의 품목_id 배열 (삭제 모드용)
  const [selectedItems, setSelectedItems] = useState([]);
  // 편집 중 변경된 값을 저장하는 객체, key: 품목_id, value: 수정된 데이터
  const [editedItems, setEditedItems] = useState({});
  // 정렬 상태: 각 열에 대해 null, "asc", "desc" 중 하나
  const [sortCriteria, setSortCriteria] = useState({
    품목명: "asc",
    협력사명: "asc",
    종류: "asc",
  });
  // 사용자가 정렬 버튼을 누른 순서를 관리하는 배열
  const [manualSortOrder, setManualSortOrder] = useState([]);
  // 여러 제품을 추가할 수 있도록 newItems 배열로 상태 관리 (초기 1행)
  const [newItems, setNewItems] = useState([
    {
      품목명: "",
      협력사명: "",
      종류: "",
      규격: "",
      단위: "",
      입고단가: "", // 자동 계산됨
      입고단위: "",
      입고단위단가: "",
      출고단위: ""
    }
  ]);

  // 팝업 알림 상태
  const [alertPopup, setAlertPopup] = useState({ show: false, message: "" });

  // 품목 목록 불러오기
  useEffect(() => {
    const getItems = async () => {
      try {
        const data = await fetchItems();
        setItems(data);
      } catch (err) {
        setError("Failed to load items");
      }
    };
    getItems();
  }, []);

  // 협력사 목록 불러오기
  useEffect(() => {
    const getSuppliers = async () => {
      try {
        const supData = await fetchSuppliers();
        setSuppliers(supData);
      } catch (err) {
        console.error("Failed to fetch suppliers", err);
      }
    };
    getSuppliers();
  }, []);

  // 정렬 토글 함수
  const toggleSort = (column) => {
    setSortCriteria((prev) => {
      const current = prev[column];
      let next;
      if (current === null) next = "asc";
      else if (current === "asc") next = "desc";
      else next = null;
      const newCriteria = { ...prev, [column]: next };

      setManualSortOrder((prevOrder) => {
        let newOrder = prevOrder.filter((col) => col !== column);
        if (next !== null) {
          newOrder.push(column);
        }
        return newOrder;
      });

      return newCriteria;
    });
  };

  // 정렬 함수
  const getSortedItems = () => {
    let sorted = [...items];
    const activeOrder =
      (manualSortOrder.length > 0 ? manualSortOrder : ["협력사명", "종류", "품목명"]).filter(
        (col) => sortCriteria[col] !== null
      );
    sorted.sort((a, b) => {
      for (let col of activeOrder) {
        const order = sortCriteria[col];
        let aVal = "";
        let bVal = "";
        if (col === "협력사명") {
          aVal = suppliers.find((s) => s.협력사_id === a.협력사_id)?.협력사명 || "";
          bVal = suppliers.find((s) => s.협력사_id === b.협력사_id)?.협력사명 || "";
        } else {
          aVal = a[col] || "";
          bVal = b[col] || "";
        }
        const comp = aVal.localeCompare(bVal, undefined, { numeric: true });
        if (comp !== 0) return order === "asc" ? comp : -comp;
      }
      return 0;
    });
    return sorted;
  };

  const sortedItems = getSortedItems();

  // 제품 추가 팝업 입력값 변경 핸들러
  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    setNewItems((prev) => {
      const updatedItems = [...prev];
      updatedItems[index] = { ...updatedItems[index], [name]: value };
      // 입고단가는 자동 계산
      const unit = parseFloat(updatedItems[index]["입고단위"]);
      const unitPrice = parseFloat(updatedItems[index]["입고단위단가"]);
      if (!isNaN(unit) && unit !== 0 && !isNaN(unitPrice)) {
        updatedItems[index]["입고단가"] = (unitPrice / unit).toFixed(2);
      } else {
        updatedItems[index]["입고단가"] = "";
      }
      return updatedItems;
    });
  };

  // 삭제 모드 체크박스 핸들러
  const handleCheckboxChange = (e, itemId) => {
    if (e.target.checked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  // 제품 삭제
  const handleDelete = async () => {
    if (selectedItems.length === 0) {
      setAlertPopup({ show: true, message: "삭제할 품목을 선택해주세요." });
      return;
    }
    try {
      await deleteItems(selectedItems);
      setItems((prev) => prev.filter((item) => !selectedItems.includes(item.품목_id)));
      setSelectedItems([]);
      setIsDeleteMode(false);
      setAlertPopup({ show: true, message: "제품이 성공적으로 삭제되었습니다." });
    } catch (err) {
      setAlertPopup({ show: true, message: "제품 삭제에 실패하였습니다." });
    }
  };

  // 제품 추가
  const handleSubmit = async () => {
    try {
      for (const newItem of newItems) {
        const addedItem = await addItem(newItem);
        setItems((prev) => [...prev, addedItem]);
      }
      setShowPopup(false);
      setNewItems([
        {
          품목명: "",
          협력사명: "",
          종류: "",
          규격: "",
          단위: "",
          입고단가: "",
          입고단위: "",
          입고단위단가: "",
          출고단위: ""
        }
      ]);
      setAlertPopup({ show: true, message: "제품이 성공적으로 추가되었습니다." });
    } catch (err) {
      setAlertPopup({ show: true, message: "제품 추가에 실패하였습니다." });
    }
  };

  // 행 추가 (제품 추가 팝업)
  const handleAddRow = () => {
    setNewItems((prev) => [
      ...prev,
      {
        품목명: "",
        협력사명: "",
        종류: "",
        규격: "",
        단위: "",
        입고단가: "",
        입고단위: "",
        입고단위단가: "",
        출고단위: ""
      }
    ]);
  };

  // 행 삭제 (제품 추가 팝업)
  const handleRemoveRow = () => {
    if (newItems.length > 1) {
      setNewItems((prev) => prev.slice(0, prev.length - 1));
    }
  };

  // 수정 모드 토글
  const handleEditToggle = () => {
    if (!isEditMode) {
      const initialEdited = {};
      items.forEach((item) => {
        initialEdited[item.품목_id] = {
          품목_id: item.품목_id,
          품목명: item.품목명,
          협력사명: suppliers.find((s) => s.협력사_id === item.협력사_id)?.협력사명 || "",
          종류: item.종류,
          규격: item.규격,
          단위: item.단위,
          입고단가: item.입고단가,
          입고단위: item.입고단위,
          입고단위단가: item.입고단위단가,
          출고단위: item.출고단위,
        };
      });
      setEditedItems(initialEdited);
      if (isDeleteMode) setIsDeleteMode(false);
    }
    setIsEditMode((prev) => !prev);
  };

  // 수정 모드 핸들러 (입고단위, 입고단위단가 변경 시 자동 계산)
  const handleEditChange = (itemId, field, value) => {
    setEditedItems((prev) => {
      const updatedItem = { ...prev[itemId], [field]: value };
      if (field === "입고단위" || field === "입고단위단가") {
        const unit = parseFloat(updatedItem["입고단위"]);
        const unitPrice = parseFloat(updatedItem["입고단위단가"]);
        if (!isNaN(unit) && unit !== 0 && !isNaN(unitPrice)) {
          updatedItem["입고단가"] = (unitPrice / unit).toFixed(2);
        } else {
          updatedItem["입고단가"] = "";
        }
      }
      return { ...prev, [itemId]: updatedItem };
    });
  };

  // 수정 완료
  const handleEditSubmit = async () => {
    try {
      const updatedItems = { ...editedItems };
      for (const itemId in updatedItems) {
        const updatedData = updatedItems[itemId];
        const res = await updateItem(updatedData);
        setItems((prev) =>
          prev.map((item) => (item.품목_id === itemId ? { ...item, ...res } : item))
        );
      }
      setAlertPopup({ show: true, message: "제품이 성공적으로 수정되었습니다." });
      setIsEditMode(false);
    } catch (err) {
      setAlertPopup({ show: true, message: "제품 수정에 실패하였습니다." });
    }
  };

  // Excel 다운로드 핸들러
  const handleDownloadExcel = () => {
    const data = sortedItems.map(item => {
      const supplier = suppliers.find(s => s.협력사_id === item.협력사_id);
      return {
        "품목명": item.품목명,
        "협력사명": supplier ? supplier.협력사명 : "",
        "종류": item.종류,
        "규격": item.규격,
        "단위": item.단위,
        "입고단가": item.입고단가,
        "입고단위": item.입고단위,
        "입고단위단가": item.입고단위단가,
        "출고단위": item.출고단위
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: ["품목명", "협력사명", "종류", "규격", "단위", "입고단가", "입고단위", "입고단위단가", "출고단위"]
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "제품 목록.xlsx", { bookType: "xlsx" });
  };

  return (
    <div className="item-container">
      <h2 className="title">제품 관리</h2>
      <div className="controls">
        <button onClick={handleDownloadExcel} className="download-button">
          Excel 다운로드
        </button>
        <button
          onClick={() => setShowPopup(true)}
          className="add-button"
          disabled={isEditMode || isDeleteMode}
        >
          + 제품 추가
        </button>
        <button
          onClick={handleEditToggle}
          className="edit-button"
          disabled={isDeleteMode}
        >
          {isEditMode ? "취소" : "수정"}
        </button>
        <button
          onClick={() => {
            setIsDeleteMode((prev) => !prev);
            if (isDeleteMode) setSelectedItems([]);
          }}
          className="delete-button"
          disabled={isEditMode}
        >
          {isDeleteMode ? "취소" : "삭제"}
        </button>
      </div>
      <hr className="divider" />
      {error && <p className="error">{error}</p>}

      {/* 메인 테이블 (목록) */}
      <table className="item-table">
        <thead>
          <tr>
            {isDeleteMode && <th className="narrow-col">선택</th>}
            <th className="number-col diagonal-header"></th>
            {/* 편집 모드일 때 품목명, 협력사명 헤더 폭 늘리기 */}
            <th style={isEditMode ? { width: "200px" } : {}}>
              품목명
              <button className="sort-btn" onClick={() => toggleSort("품목명")}>
                {sortCriteria.품목명 === "asc"
                  ? "▲"
                  : sortCriteria.품목명 === "desc"
                  ? "▼"
                  : "—"}
              </button>
            </th>
            <th style={isEditMode ? { width: "120px" } : {}}>
              협력사명
              <button className="sort-btn" onClick={() => toggleSort("협력사명")}>
                {sortCriteria.협력사명 === "asc"
                  ? "▲"
                  : sortCriteria.협력사명 === "desc"
                  ? "▼"
                  : "—"}
              </button>
            </th>
            <th>
              종류
              <button className="sort-btn" onClick={() => toggleSort("종류")}>
                {sortCriteria.종류 === "asc"
                  ? "▲"
                  : sortCriteria.종류 === "desc"
                  ? "▼"
                  : "—"}
              </button>
            </th>
            <th>규격</th>
            <th style={isEditMode ? { width: "35px" } : {}}>단위</th>
            {/* 헤더는 항상 가운데 정렬 (CSS 적용) */}
            <th className="right-align">입고단가</th>
            <th className="right-align">입고단위</th>
            <th className="right-align">입고단위단가</th>
            <th className="right-align">출고단위</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, index) => {
            const supplier = suppliers.find((s) => s.협력사_id === item.협력사_id);
            return (
              <tr key={item.품목_id}>
                {isDeleteMode && (
                  <td className="narrow-col">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.품목_id)}
                      onChange={(e) => handleCheckboxChange(e, item.품목_id)}
                    />
                  </td>
                )}
                <td className="number-col">{index + 1}</td>
                <td>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedItems[item.품목_id]?.품목명 || ""}
                      onChange={(e) =>
                        handleEditChange(item.품목_id, "품목명", e.target.value)
                      }
                    />
                  ) : (
                    item.품목명
                  )}
                </td>
                <td>
                  {isEditMode ? (
                    <select
                      value={editedItems[item.품목_id]?.협력사명 || ""}
                      onChange={(e) =>
                        handleEditChange(item.품목_id, "협력사명", e.target.value)
                      }
                    >
                      <option value="">-- 선택하세요 --</option>
                      {suppliers.map((supplier, idx) => (
                        <option key={idx} value={supplier.협력사명}>
                          {supplier.협력사명}
                        </option>
                      ))}
                    </select>
                  ) : (
                    supplier ? supplier.협력사명 : "N/A"
                  )}
                </td>
                <td>
                  {isEditMode ? (
                    <select
                      value={editedItems[item.품목_id]?.종류 || ""}
                      onChange={(e) =>
                        handleEditChange(item.품목_id, "종류", e.target.value)
                      }
                    >
                      <option value="">-- 선택하세요 --</option>
                      <option value="소모품">소모품</option>
                      <option value="고체류">고체류</option>
                      <option value="액체류">액체류</option>
                    </select>
                  ) : (
                    item.종류
                  )}
                </td>
                <td>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedItems[item.품목_id]?.규격 || ""}
                      onChange={(e) =>
                        handleEditChange(item.품목_id, "규격", e.target.value)
                      }
                    />
                  ) : (
                    item.규격
                  )}
                </td>
                <td>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedItems[item.품목_id]?.단위 || ""}
                      onChange={(e) =>
                        handleEditChange(item.품목_id, "단위", e.target.value)
                      }
                    />
                  ) : (
                    item.단위
                  )}
                </td>
                <td className="right-align">
                  {isEditMode ? (
                    <input
                      type="number"
                      step="0.01"
                      name="입고단가"
                      value={editedItems[item.품목_id]?.입고단가}
                      disabled
                      className="calc-input"
                      style={{ textAlign: "right" }}
                    />
                  ) : (
                    <span>{item.입고단가}</span>
                  )}
                </td>
                <td className="right-align">
                  {isEditMode ? (
                    <input
                      type="number"
                      name="입고단위"
                      value={editedItems[item.품목_id]?.입고단위 || ""}
                      onChange={(e) =>
                        handleEditChange(item.품목_id, "입고단위", e.target.value)
                      }
                      style={{ textAlign: "right" }}
                    />
                  ) : (
                    item.입고단위
                  )}
                </td>
                <td className="right-align">
                  {isEditMode ? (
                    <input
                      type="number"
                      name="입고단위단가"
                      value={editedItems[item.품목_id]?.입고단위단가 || ""}
                      onChange={(e) =>
                        handleEditChange(item.품목_id, "입고단위단가", e.target.value)
                      }
                      style={{ textAlign: "right" }}
                    />
                  ) : (
                    item.입고단위단가
                  )}
                </td>
                <td className="right-align">
                  {isEditMode ? (
                    <input
                      type="number"
                      name="출고단위"
                      value={editedItems[item.품목_id]?.출고단위 || ""}
                      onChange={(e) =>
                        handleEditChange(item.품목_id, "출고단위", e.target.value)
                      }
                      style={{ textAlign: "right" }}
                    />
                  ) : (
                    item.출고단위
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isDeleteMode && (
        <button
          onClick={handleDelete}
          disabled={selectedItems.length === 0}
          className="delete-confirm-button"
        >
          선택 삭제
        </button>
      )}

      {isEditMode && (
        <button onClick={handleEditSubmit} className="edit-confirm-button">
          수정 완료
        </button>
      )}

      {/* 제품 추가 팝업 */}
      {showPopup && (
        <div className="item-popup">
          <div className="item-popup-content">
            <h3>제품 추가</h3>
            <div className="item-popup-form">
              <table className="item-table">
                <colgroup>
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>품목명</th>
                    <th>협력사명</th>
                    <th>종류</th>
                    <th>규격</th>
                    <th>단위</th>
                    <th className="right-align">입고단가</th>
                    <th className="right-align">입고단위</th>
                    <th className="right-align">입고단위단가</th>
                    <th className="right-align">출고단위</th>
                  </tr>
                </thead>
                <tbody>
                  {newItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          name="품목명"
                          value={item.품목명}
                          onChange={(e) => handleInputChange(index, e)}
                        />
                      </td>
                      <td>
                        <select
                          name="협력사명"
                          value={item.협력사명}
                          onChange={(e) => handleInputChange(index, e)}
                        >
                          <option value="">-- 선택하세요 --</option>
                          {suppliers.map((supplier, idx) => (
                            <option key={idx} value={supplier.협력사명}>
                              {supplier.협력사명}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          name="종류"
                          value={item.종류}
                          onChange={(e) => handleInputChange(index, e)}
                        >
                          <option value="">-- 선택하세요 --</option>
                          <option value="소모품">소모품</option>
                          <option value="고체류">고체류</option>
                          <option value="액체류">액체류</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          name="규격"
                          value={item.규격}
                          onChange={(e) => handleInputChange(index, e)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="단위"
                          value={item.단위}
                          onChange={(e) => handleInputChange(index, e)}
                        />
                      </td>
                      <td className="right-align">
                        <input
                          type="number"
                          step="0.01"
                          name="입고단가"
                          value={item.입고단가}
                          disabled
                          className="calc-input"
                          style={{ textAlign: "right" }}
                        />
                      </td>
                      <td className="right-align">
                        <input
                          type="number"
                          name="입고단위"
                          value={item.입고단위}
                          onChange={(e) => handleInputChange(index, e)}
                          style={{ textAlign: "right" }}
                        />
                      </td>
                      <td className="right-align">
                        <input
                          type="number"
                          name="입고단위단가"
                          value={item.입고단위단가}
                          onChange={(e) => handleInputChange(index, e)}
                          style={{ textAlign: "right" }}
                        />
                      </td>
                      <td className="right-align">
                        <input
                          type="number"
                          name="출고단위"
                          value={item.출고단위}
                          onChange={(e) => handleInputChange(index, e)}
                          style={{ textAlign: "right" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="add-row-container">
                <span className="row-action-label">행 추가/삭제</span>
                <button onClick={handleAddRow} className="add-row-button">
                  +
                </button>
                <button
                  onClick={handleRemoveRow}
                  className="remove-row-button"
                  disabled={newItems.length === 1}
                >
                  -
                </button>
              </div>
            </div>
            <div className="item-popup-buttons">
              <button onClick={() => setShowPopup(false)} className="popup-cancel">
                취소
              </button>
              <button onClick={handleSubmit} className="popup-confirm">
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

export default Item;
