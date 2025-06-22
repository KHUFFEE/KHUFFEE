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
import { warehouseExpirationDownloadExcel } from "../utils/WarehouseExpirationDownloadExcel";
import LoadingSpinner from "../components/LoadingSpinner";

const WarehouseExpiration = () => {
  const [expirationData, setExpirationData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 유통기한 문자열(예: "2026.05.05")를 Date 객체로 변환 후 현재 날짜와의 차이를 계산하여
  // "~~개월 ~~일" 형식으로 반환하며, 만약 만료되었으면 "만료"를 반환하는 함수
  const calculateRemaining = (expirationStr) => {
    const parts = expirationStr.split(".");
    const expDate = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    const now = new Date();
    const currentDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    if (expDate <= currentDate) {
      return "만료";
    }

    let years = expDate.getFullYear() - currentDate.getFullYear();
    let months = expDate.getMonth() - currentDate.getMonth() + years * 12;
    let days = expDate.getDate() - currentDate.getDate();

    if (days < 0) {
      months -= 1;
      const previousMonthDate = new Date(
        expDate.getFullYear(),
        expDate.getMonth(),
        0
      );
      days =
        expDate.getDate() +
        (previousMonthDate.getDate() - currentDate.getDate());
    }

    const formattedMonths = months < 10 ? `0${months}` : months;
    const formattedDays = days < 10 ? `0${days}` : days;

    if (months === 0) {
      return `${formattedDays}일`;
    }

    return `${formattedMonths}개월 ${formattedDays}일`;
  };

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

  // 재고 데이터를 품목별로 합산하여 매핑 (현재고)
  const inventoryMap = {};
  inventoryData.forEach((record) => {
    const itemId = record.품목_id;
    inventoryMap[itemId] =
      (inventoryMap[itemId] || 0) + Number(record.창고_재고량);
  });

  // expirationData의 개수를 품목별로 합산 (개수)
  const aggregatedCounts = {};
  expirationData.forEach((record) => {
    const itemId = record.품목_id;
    aggregatedCounts[itemId] =
      (aggregatedCounts[itemId] || 0) + Number(record.창고_재고량);
  });

  // 테이블 행 생성 (품목 데이터에서 협력사, 품목명, 종류 추출 및 남은 일수 계산)
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
    const totalCount = aggregatedCounts[itemId] || 0;
    const currentStock = inventoryMap[itemId] || 0;
    const isMismatch = totalCount !== currentStock;
    return {
      itemId,
      supplierName,
      itemName,
      type,
      expiration: record.유통기한,
      count: Number(record.창고_재고량),
      currentStock: currentStock,
      remainingDays: calculateRemaining(record.유통기한),
      isMismatch,
    };
  });

  // 정렬: 협력사 → 품목명 → 종류 → 유통기한
  // 정렬: 협력사 → 종류(type) → 품목명(itemName) → 유통기한
  tableRows.sort((a, b) => {
    // 1) 협력사
    const cmpSupplier = a.supplierName.localeCompare(b.supplierName);
    if (cmpSupplier !== 0) return cmpSupplier;

    // 2) 종류(type)
    const cmpType = a.type.localeCompare(b.type);
    if (cmpType !== 0) return cmpType;

    // 3) 품목명(itemName)
    const cmpItemName = a.itemName.localeCompare(b.itemName);
    if (cmpItemName !== 0) return cmpItemName;

    // 4) 유통기한 (오래된 날짜가 먼저)
    const dateA = new Date(a.expiration.replace(/\./g, "-"));
    const dateB = new Date(b.expiration.replace(/\./g, "-"));
    return dateA - dateB;
  });

  // rowCounts: 동일 품목_id(row.itemId)에 해당하는 행의 개수 (rowSpan 용)
  const rowCounts = {};
  tableRows.forEach((row) => {
    rowCounts[row.itemId] = (rowCounts[row.itemId] || 0) + 1;
  });

  // JSX 렌더링 시 첫 등장 체크용
  const seenItems = {};

  if (loading) return <LoadingSpinner />;
  if (error) return <div>{error}</div>;

  return (
    <div className="we-container">
      <h2 className="title">유통 기한 관리</h2>
      <div className="period-controls">
        <div className="period-search">
          <button
            className="reset-button"
            onClick={() => window.location.reload()}
          >
            새로고침
          </button>
          <button
            className="download-button"
            onClick={() => warehouseExpirationDownloadExcel({ tableRows })}
          >
            Excel 다운
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
            <th className="we-sum-col">합산</th>
            <th className="we-current-stock-col">현재고</th>
            <th className="we-remaining-days-col">남은 일수</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, index) => {
            const {
              itemId,
              supplierName,
              itemName,
              type,
              expiration,
              count,
              currentStock,
              remainingDays,
              isMismatch,
            } = row;

            // 첫 번째 등장인지 확인
            const isFirstOccurrence = !seenItems[itemId];
            if (isFirstOccurrence) {
              seenItems[itemId] = true;
            }

            return (
              <tr key={index}>
                <td className="we-number-col">{index + 1}</td>
                <td className="we-supplier-col">
                  <div className="we-supplier-cell">{supplierName}</div>
                </td>
                <td className="we-item-col">
                  <div className="we-item-cell">{itemName}</div>
                </td>
                <td className="we-expiration-col">{expiration}</td>
                <td className="we-count-col">{count.toLocaleString()}</td>
                {isFirstOccurrence ? (
                  <td className="we-sum-col" rowSpan={rowCounts[itemId]}>
                    <span className={isMismatch ? "red-text" : ""}>
                      {(aggregatedCounts[itemId] || 0).toLocaleString()}
                    </span>
                  </td>
                ) : null}
                {isFirstOccurrence ? (
                  <td
                    className={`we-current-stock-col ${isMismatch ? "mismatch" : ""}`}
                    rowSpan={rowCounts[itemId]}
                  >
                    <span className={isMismatch ? "red-text" : ""}>
                      {currentStock.toLocaleString()}
                    </span>
                  </td>
                ) : null}
                <td
                  className={`we-remaining-days-col ${
                    remainingDays === "만료" || !remainingDays.includes("개월")
                      ? "red-text"
                      : ""
                  }`}
                >
                  {remainingDays}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default WarehouseExpiration;
