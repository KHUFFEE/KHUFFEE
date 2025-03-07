import React, { useEffect, useState } from "react";
import { fetchItems, fetchSuppliers, addItem, deleteItems, updateItem } from "../api/api";
import "../styles/Item.css";
// xlsx-js-style 사용 (스타일 적용 가능)
import * as XLSX from "xlsx-js-style";
import { itemDownloadExcel } from "../utils/ItemDownloadExcel";

const Item = () => {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isActivateMode, setIsActivateMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedActivateItems, setSelectedActivateItems] = useState([]);
  const [editedItems, setEditedItems] = useState({});
  const [sortCriteria, setSortCriteria] = useState({
    품목명: "asc",
    협력사명: "asc",
    종류: "asc",
  });
  const [manualSortOrder, setManualSortOrder] = useState([]);
  const [newItems, setNewItems] = useState([
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
  const [alertPopup, setAlertPopup] = useState({ show: false, message: "" });

  // 숫자 포맷 함수: 입력값에 쉼표를 추가 (숫자 또는 숫자문자열)
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const num = Number(value.toString().replace(/,/g, ""));
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  // 초기 품목 조회: 활성화가 1인 품목만 표시 (전체 중 필터링)
  const fetchAllItems = async () => {
    try {
      // 기본 호출: 활성화된(활성화 === true) 품목만 반환 (백엔드에서 기본 필터)
      const data = await fetchItems();
      setItems(data);
    } catch (err) {
      setError("Failed to load items");
    }
  };

  // 컴포넌트 마운트 시 활성화 품목만 로드
  useEffect(() => {
    fetchAllItems();
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
    // 숫자 필드인 경우 쉼표 제거 후 저장
    const rawValue = ["입고단가", "입고단위", "입고단위단가", "출고단위"].includes(name)
      ? value.replace(/,/g, "")
      : value;
    setNewItems((prev) => {
      const updatedItems = [...prev];
      updatedItems[index] = { ...updatedItems[index], [name]: rawValue };
      // 입고단가 자동 계산
      const unit = parseFloat(updatedItems[index]["입고단위"]);
      const unitPrice = parseFloat(updatedItems[index]["입고단위단가"]);
      if (!isNaN(unit) && unit !== 0 && !isNaN(unitPrice)) {
        updatedItems[index]["입고단가"] = (unitPrice / unit).toFixed(6);
      } else {
        updatedItems[index]["입고단가"] = "";
      }
      return updatedItems;
    });
  };

  // 삭제(비활성화) 모드 체크박스 핸들러
  const handleDeleteCheckboxChange = (e, itemId) => {
    if (e.target.checked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  // 활성화 모드 체크박스 핸들러
  const handleActivateCheckboxChange = (e, itemId) => {
    if (e.target.checked) {
      setSelectedActivateItems((prev) => [...prev, itemId]);
    } else {
      setSelectedActivateItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  // 제품 비활성화: API에 {ids, action:"deactivate"} 전송 후 활성화 품목(활성화===1)만 재조회
  const handleDelete = async () => {
    if (selectedItems.length === 0) {
      setAlertPopup({ show: true, message: "비활성화할 품목을 선택해주세요." });
      return;
    }
    try {
      await deleteItems({ ids: selectedItems, action: "deactivate" });
      // 업데이트 후 기본(active) 목록을 다시 로드 (비활성화된 건 제외됨)
      await fetchAllItems();
      setSelectedItems([]);
      setIsDeleteMode(false);
      setAlertPopup({ show: true, message: "제품이 성공적으로 비활성화되었습니다." });
    } catch (err) {
      setAlertPopup({ show: true, message: "제품 비활성화에 실패하였습니다." });
    }
  };

  // 제품 활성화: API에 {ids, action:"activate"} 전송 후 활성화 상태(활성화===0)인 품목 재조회
  const handleActivateConfirm = async () => {
    if (selectedActivateItems.length === 0) {
      setAlertPopup({ show: true, message: "활성화할 품목을 선택해주세요." });
      return;
    }
    try {
      await deleteItems({ ids: selectedActivateItems, action: "activate" });
      // 업데이트 후 기본(active) 목록을 다시 로드
      await fetchAllItems();
      setSelectedActivateItems([]);
      setIsActivateMode(false);
      setAlertPopup({ show: true, message: "제품이 성공적으로 활성화되었습니다." });
    } catch (err) {
      setAlertPopup({ show: true, message: "제품 활성화에 실패하였습니다." });
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
      if (isActivateMode) setIsActivateMode(false);
    }
    setIsEditMode((prev) => !prev);
  };

  // 수정 모드 핸들러 (입고단위, 입고단위단가 변경 시 자동 계산)
  const handleEditChange = (itemId, field, value) => {
    // 숫자 필드인 경우 쉼표 제거
    const rawValue = ["입고단가", "입고단위", "입고단위단가", "출고단위"].includes(field)
      ? value.replace(/,/g, "")
      : value;
    setEditedItems((prev) => {
      const updatedItem = { ...prev[itemId], [field]: rawValue };
      if (field === "입고단위" || field === "입고단위단가") {
        const unit = parseFloat(updatedItem["입고단위"]);
        const unitPrice = parseFloat(updatedItem["입고단위단가"]);
        if (!isNaN(unit) && unit !== 0 && !isNaN(unitPrice)) {
          updatedItem["입고단가"] = (unitPrice / unit).toFixed(6);
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

  return (
    <div className="item-container">
      <h2 className="title">제품 관리</h2>
      <div className="item-controls">
        <div className="active-controls">
          <button
            onClick={async () => {
              if (!isActivateMode) {
                try {
                  const data = await fetchItems(true);
                  const deactivatedItems = data.filter((item) => item.활성화 === false);
                  setItems(deactivatedItems);
                  setIsActivateMode(true);
                  setSelectedActivateItems([]);
                  if (isDeleteMode) setIsDeleteMode(false);
                } catch (err) {
                  setAlertPopup({ show: true, message: "비활성 품목 불러오기에 실패하였습니다." });
                }
              } else {
                try {
                  await fetchAllItems();
                  setIsActivateMode(false);
                  setSelectedActivateItems([]);
                } catch (err) {
                  setAlertPopup({ show: true, message: "품목 불러오기에 실패하였습니다." });
                }
              }
            }}
            className="activate-button"
            disabled={isEditMode || isDeleteMode}
          >
            {isActivateMode ? "취소" : "활성화"}
          </button>
          <button
            onClick={() => {
              setIsDeleteMode((prev) => !prev);
              if (isDeleteMode) setSelectedItems([]);
            }}
            className="delete-button"
            disabled={isEditMode || isActivateMode}
          >
            {isDeleteMode ? "취소" : "비활성화"}
          </button>
          <span className="control-description">
            모든 품목은 각각 고유하게 관리됩니다.<br />
            제품 추가 및 수정 전에는 활성화/비활성화 기능을 통해 상태를 확인해 주세요.
          </span>
        </div>

        <div className="item-action-buttons">
          <button
            onClick={() => itemDownloadExcel({ sortedItems, suppliers })}
            className="download-button"
          >
            Excel 다운로드
          </button>
          <button
            onClick={() => setShowPopup(true)}
            className="add-button"
            disabled={isEditMode || isDeleteMode || isActivateMode}
          >
            + 제품 추가
          </button>
          <button
            onClick={handleEditToggle}
            className="edit-button"
            disabled={isDeleteMode || isActivateMode}
          >
            {isEditMode ? "취소" : "수정"}
          </button>
        </div>
      </div>

      <hr className="divider" />
      {error && <p className="error">{error}</p>}

      {/* 메인 테이블 (목록) */}
      <table className="item-table">
        <thead>
          <tr>
            {(isDeleteMode || isActivateMode) && <th className="narrow-col">선택</th>}
            <th className="number-col">No.</th>
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
                {isDeleteMode ? (
                  <td className="narrow-col">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.품목_id)}
                      onChange={(e) => handleDeleteCheckboxChange(e, item.품목_id)}
                    />
                  </td>
                ) : isActivateMode ? (
                  <td className="narrow-col">
                    <input
                      type="checkbox"
                      checked={selectedActivateItems.includes(item.품목_id)}
                      onChange={(e) => handleActivateCheckboxChange(e, item.품목_id)}
                    />
                  </td>
                ) : null}
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
                      <option value="상품">상품</option>
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
                      type="text"
                      name="입고단가"
                      value={formatNumber(editedItems[item.품목_id]?.입고단가)}
                      disabled
                      className="calc-input"
                      style={{ textAlign: "right" }}
                    />
                  ) : (
                    <span>{formatNumber(item.입고단가)}</span>
                  )}
                </td>
                <td className="right-align">
                  {isEditMode ? (
                    <input
                      type="text"
                      name="입고단위"
                      value={formatNumber(editedItems[item.품목_id]?.입고단위 || "")}
                      disabled
                      className="calc-input"
                      style={{ textAlign: "right" }}
                    />
                  ) : (
                    <span>{formatNumber(item.입고단위)}</span>
                  )}
                </td>
                <td className="right-align">
                  {isEditMode ? (
                    <input
                      type="text"
                      name="입고단위단가"
                      value={formatNumber(editedItems[item.품목_id]?.입고단위단가 || "")}
                      disabled
                      className="calc-input"
                      style={{ textAlign: "right" }}
                    />
                  ) : (
                    <span>{formatNumber(item.입고단위단가)}</span>
                  )}
                </td>
                <td className="right-align">
                  {isEditMode ? (
                    <input
                      type="text"
                      name="출고단위"
                      value={formatNumber(editedItems[item.품목_id]?.출고단위 || "")}
                      onChange={(e) =>
                        handleEditChange(
                          item.품목_id,
                          "출고단위",
                          e.target.value.replace(/,/g, "")
                        )
                      }
                      style={{ textAlign: "right" }}
                    />
                  ) : (
                    <span>{formatNumber(item.출고단위)}</span>
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
          선택 비활성화
        </button>
      )}
      {isActivateMode && (
        <button
          onClick={handleActivateConfirm}
          disabled={selectedActivateItems.length === 0}
          className="activate-confirm-button"
        >
          선택 활성화
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
                          <option value="상품">상품</option>
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
                          type="text"
                          step="0.01"
                          name="입고단가"
                          value={formatNumber(item.입고단가)}
                          disabled
                          className="calc-input"
                          style={{ textAlign: "right" }}
                        />
                      </td>
                      <td className="right-align">
                        <input
                          type="text"
                          name="입고단위"
                          value={formatNumber(item.입고단위)}
                          onChange={(e) =>
                            handleInputChange(index, {
                              target: {
                                name: "입고단위",
                                value: e.target.value.replace(/,/g, ""),
                              },
                            })
                          }
                          style={{ textAlign: "right" }}
                        />
                      </td>
                      <td className="right-align">
                        <input
                          type="text"
                          name="입고단위단가"
                          value={formatNumber(item.입고단위단가)}
                          onChange={(e) =>
                            handleInputChange(index, {
                              target: {
                                name: "입고단위단가",
                                value: e.target.value.replace(/,/g, ""),
                              },
                            })
                          }
                          style={{ textAlign: "right" }}
                        />
                      </td>
                      <td className="right-align">
                        <input
                          type="text"
                          name="출고단위"
                          value={formatNumber(item.출고단위)}
                          onChange={(e) =>
                            handleInputChange(index, {
                              target: {
                                name: "출고단위",
                                value: e.target.value.replace(/,/g, ""),
                              },
                            })
                          }
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
