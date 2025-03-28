// frontend/khuweb/src/pages/WarehouseExpiration.js
import React, { useState, useEffect } from "react";
import {
  fetchWarehouseInventory,
  fetchWarehouseExpirations,
  fetchItems,
  fetchSuppliers,
} from "../api/api";
import "../styles/WarehouseExpiration.css";
import "../styles/table.css";
import LoadingSpinner from "../components/LoadingSpinner";

const WarehouseExpiration = () => {
  const [expirationData, setExpirationData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API 데이터 호출: 유통기한, 재고, 품목, 협력사
  const fetchData = async () => {
    try {
      setLoading(true);
      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}.${(
        "0" +
        (currentDate.getMonth() + 1)
      ).slice(-2)}.${("0" + currentDate.getDate()).slice(-2)}`;
      const [expirationRes, inventoryRes, itemsRes, suppliersRes] =
        await Promise.all([
          fetchWarehouseExpirations(),
          fetchWarehouseInventory({ 기간: formattedDate }),
          fetchItems(true),
          fetchSuppliers(),
        ]);
      setExpirationData(expirationRes);
      setInventoryData(inventoryRes);
      setItems(itemsRes);
      setSuppliers(suppliersRes);
      setLoading(false);
    } catch (err) {
      console.error("데이터 불러오기 실패:", err);
      setError("데이터를 불러오는데 실패하였습니다.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 재고 데이터를 품목별로 합산하여 매핑
  const inventoryMap = {};
  inventoryData.forEach((record) => {
    const itemId = record.품목_id;
    inventoryMap[itemId] =
      (inventoryMap[itemId] || 0) + Number(record.창고_재고량);
  });

  // 테이블 행 생성 (품목 데이터에서 협력사, 품목명, 종류 추출)
  const tableRows = expirationData.map((record) => {
    const itemId = record.품목_id;
    const matchedItem = items.find((item) => item.품목_id === itemId);
    let supplierName = "N/A";
    let itemName = "N/A";
    let type = "";
    if (matchedItem) {
      itemName = matchedItem.품목명;
      type = matchedItem.종류 || "";
      const supplier = suppliers.find(
        (s) => s.협력사_id === matchedItem.협력사_id
      );
      supplierName = supplier ? supplier.협력사명 : "N/A";
    }
    return {
      supplierName,
      itemName,
      type,
      expiration: record.유통기한,
      count: Number(record.창고_재고량),
      currentStock: inventoryMap[itemId] || 0,
      remainingDays: "", // 남은 일수는 추후 계산 또는 빈 칸 처리
    };
  });

  // WarehouseInventory.js 와 동일한 정렬 로직 적용 (협력사 오름차순 → 종류 오름차순 → 품목명 오름차순)
  tableRows.sort((a, b) => {
    const cmpSupplier = a.supplierName.localeCompare(b.supplierName);
    if (cmpSupplier !== 0) return cmpSupplier;
    const cmpType = a.type.localeCompare(b.type);
    if (cmpType !== 0) return cmpType;
    return a.itemName.localeCompare(b.itemName);
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <div>{error}</div>;

  return (
    <div className="we-container">
      <h2 className="title">유통 기한 관리</h2>
      <div className="period-controls">
        <div className="warehouse-action-buttons">
          <button
            className="reset-button"
            onClick={() => window.location.reload()}
          >
            새로 고침
          </button>
        </div>
      </div>
      <hr className="divider" />
      <table className="big-table">
        <thead>
          <tr>
            <th className="we-number-col">No.</th>
            <th className="we-supplier-col">협력사</th>
            <th className="we-item-col">품목명</th>
            <th className="we-expiration-col">유통기한</th>
            <th className="we-count-col">개수</th>
            <th className="we-current-stock-col">현재고</th>
            <th className="we-remaining-days-col">남은 일수</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, index) => (
            <tr key={index}>
              <td className="we-number-col">{index + 1}</td>
              <td className="we-supplier-col">{row.supplierName}</td>
              <td className="we-item-col">{row.itemName}</td>
              <td className="we-expiration-col">{row.expiration}</td>
              <td className="we-count-col">{row.count.toLocaleString()}</td>
              <td className="we-current-stock-col">
                {row.currentStock.toLocaleString()}
              </td>
              <td className="we-remaining-days-col">{row.remainingDays}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WarehouseExpiration;
