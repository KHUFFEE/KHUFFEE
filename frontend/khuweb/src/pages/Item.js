// frontend/khuweb/src/pages/Item.js
import React, { useEffect, useState } from "react";
import { fetchItems, fetchSuppliers, addItem, deleteItems } from "../api/api";
import "../styles/Item.css";

const Item = () => {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  // 선택된 품목들의 품목_id 배열
  const [selectedItems, setSelectedItems] = useState([]);
  // 여러 제품을 추가할 수 있도록 newItems 배열로 상태 관리 (초기 1행)
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

  // 입력값 변경 핸들러 (여러 행)
  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    setNewItems((prev) => {
      const updatedItems = [...prev];
      updatedItems[index] = { ...updatedItems[index], [name]: value };
      return updatedItems;
    });
  };

  // 삭제 모드일 때 체크박스 선택/해제 핸들러 추가
  const handleCheckboxChange = (e, itemId) => {
    if (e.target.checked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  // 제품 삭제(비활성화)
  const handleDelete = async () => {
    if (selectedItems.length === 0) {
      alert("삭제할 품목을 선택해주세요.");
      return;
    }
    try {
      await deleteItems(selectedItems);
      // 삭제 후, 상태에서 해당 품목 제거
      setItems((prev) => prev.filter((item) => !selectedItems.includes(item.품목_id)));
      setSelectedItems([]);
      setIsDeleteMode(false);
    } catch (err) {
      alert("제품 삭제에 실패했습니다.");
    }
  };

  // 제품 추가 (여러 행 추가)
  const handleSubmit = async () => {
    try {
      for (const newItem of newItems) {
        const addedItem = await addItem(newItem);
        setItems((prev) => [...prev, addedItem]);
      }
      setShowPopup(false);
      // 입력값 초기화 (한 행으로 초기화)
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
    } catch (err) {
      alert("제품 추가에 실패했습니다.");
    }
  };

  // 행 추가 버튼 핸들러
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

  // 행 삭제 버튼 핸들러 (최소 1행은 남도록)
  const handleRemoveRow = () => {
    if (newItems.length > 1) {
      setNewItems((prev) => prev.slice(0, prev.length - 1));
    }
  };

  return (
    <div className="item-container">
      <div className="header">
        <h2>제품 관리</h2>
        <div className="controls">
          <button onClick={() => setShowPopup(true)} className="add-button">
            + 제품 추가
          </button>
          <button
            onClick={() => {
              setIsDeleteMode((prev) => !prev);
              if (isDeleteMode) setSelectedItems([]);
            }}
            className="delete-button"
          >
            {isDeleteMode ? "취소" : "삭제"}
          </button>
        </div>
      </div>
      <hr className="divider" />
      {error && <p className="error">{error}</p>}

      {/* 메인 품목 테이블 */}
      <table className="item-table">
        <thead>
          <tr>
            {isDeleteMode && <th className="narrow-col">선택</th>}
            <th>번호</th>
            <th>품목명</th>
            <th>협력사명</th>
            <th>종류</th>
            <th>규격</th>
            <th>단위</th>
            <th>입고단가</th>
            <th>입고단위</th>
            <th>입고단위단가</th>
            <th>출고단위</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
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
                <td>{index + 1}</td>
                <td>{item.품목명}</td>
                <td>{supplier ? supplier.협력사명 : "N/A"}</td>
                <td>{item.종류}</td>
                <td>{item.규격}</td>
                <td>{item.단위}</td>
                <td>{item.입고단가}</td>
                <td>{item.입고단위}</td>
                <td>{item.입고단위단가}</td>
                <td>{item.출고단위}</td>
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
                    <th>입고단가</th>
                    <th>입고단위</th>
                    <th>입고단위단가</th>
                    <th>출고단위</th>
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
                        <input
                          type="text"
                          name="종류"
                          value={item.종류}
                          onChange={(e) => handleInputChange(index, e)}
                        />
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
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          name="입고단가"
                          value={item.입고단가}
                          onChange={(e) => handleInputChange(index, e)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="입고단위"
                          value={item.입고단위}
                          onChange={(e) => handleInputChange(index, e)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="입고단위단가"
                          value={item.입고단위단가}
                          onChange={(e) => handleInputChange(index, e)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="출고단위"
                          value={item.출고단위}
                          onChange={(e) => handleInputChange(index, e)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* 행 추가/삭제 라벨과 +, - 버튼을 같은 행에 위치 */}
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
    </div>
  );
};

export default Item;
