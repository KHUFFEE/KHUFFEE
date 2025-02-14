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
  // selectedItems: 선택된 품목들의 품목_id를 배열로 관리
  const [selectedItems, setSelectedItems] = useState([]);
  const [newItem, setNewItem] = useState({
    품목명: "",
    협력사명: "", // 드롭다운으로 선택된 협력사명 (서버에 전달되어 해당 Supplier 조회)
    종류: "",
    규격: "",
    단위: "",
    입고단가: "",
    입고단위: "",
    입고단위단가: "",
    출고단위: ""
  });

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

  // 제품 추가 팝업에 사용할 협력사 목록 조회
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  // 체크박스 선택 토글 (삭제 모드일 때만 작동)
  const handleCheckboxChange = (e, itemId) => {
    if (e.target.checked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleSubmit = async () => {
    try {
      const addedItem = await addItem(newItem);
      setItems((prev) => [...prev, addedItem]);
      setShowPopup(false);
      // 입력값 초기화
      setNewItem({
        품목명: "",
        협력사명: "",
        종류: "",
        규격: "",
        단위: "",
        입고단가: "",
        입고단위: "",
        입고단위단가: "",
        출고단위: ""
      });
    } catch (err) {
      alert("제품 추가에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (selectedItems.length === 0) {
      alert("삭제할 품목을 선택해주세요.");
      return;
    }
    try {
      await deleteItems(selectedItems);
      // 삭제 후, 화면에서 비활성화된 품목은 상태에서 제거
      setItems((prev) => prev.filter((item) => !selectedItems.includes(item.품목_id)));
      setSelectedItems([]);
      setIsDeleteMode(false);
    } catch (err) {
      alert("제품 삭제에 실패했습니다.");
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
            // item에는 협력사_id만 있으므로, suppliers 배열에서 일치하는 Supplier를 찾아 협력사명을 표시합니다.
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

      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>제품 추가</h3>
            <div className="form-group">
              <label>품목명</label>
              <input
                type="text"
                name="품목명"
                value={newItem.품목명}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>협력사 선택</label>
              <select
                name="협력사명"
                value={newItem.협력사명}
                onChange={handleInputChange}
              >
                <option value="">-- 선택하세요 --</option>
                {suppliers.map((supplier, index) => (
                  <option key={index} value={supplier.협력사명}>
                    {supplier.협력사명}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>종류</label>
              <input
                type="text"
                name="종류"
                value={newItem.종류}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>규격</label>
              <input
                type="text"
                name="규격"
                value={newItem.규격}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>단위</label>
              <input
                type="text"
                name="단위"
                value={newItem.단위}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>입고단가</label>
              <input
                type="number"
                step="0.01"
                name="입고단가"
                value={newItem.입고단가}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>입고단위</label>
              <input
                type="number"
                name="입고단위"
                value={newItem.입고단위}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>입고단위단가</label>
              <input
                type="number"
                name="입고단위단가"
                value={newItem.입고단위단가}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>출고단위</label>
              <input
                type="number"
                name="출고단위"
                value={newItem.출고단위}
                onChange={handleInputChange}
              />
            </div>
            <div className="popup-buttons">
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
