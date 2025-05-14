// frontend/khuweb/src/pages/Home.js
import React, { useState, useEffect, useRef } from "react";
import { fetchOrders } from "../api/api";
import "../styles/Home.css";
import "../styles/StoreOrders.css"; // StoreOrders와 동일한 스타일 적용
import { IODownloadExcel } from "../utils/IODownloadExcel";

const Home = () => {
  // 기간 드롭다운 관련 상태
  const [periodOptions, setPeriodOptions] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef(null);

  // 컴포넌트 마운트 시, store_order_list API를 통해 가장 오래된 기간(회차 무시)을 가져와서
  // 해당 기간(YYYY.MM)부터 현재 월까지의 목록을 생성한 뒤 내림차순(최신→이전)으로 정렬하여 최신기간이 default로 선택되도록 함.
  useEffect(() => {
    fetchOrders({ order: "asc", page: 1 })
      .then((data) => {
        if (data && data.current_period) {
          // 예: "2024.04.2" → 년, 월은 앞 두 부분만 사용
          const parts = data.current_period.split(".");
          const startYear = parseInt(parts[0], 10);
          const startMonth = parseInt(parts[1], 10);
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth() + 1;
          const options = [];
          let year = startYear;
          let month = startMonth;
          // startYear/startMonth부터 currentYear/currentMonth까지 반복하여 옵션 생성
          while (
            year < currentYear ||
            (year === currentYear && month <= currentMonth)
          ) {
            const monthStr = month.toString().padStart(2, "0");
            const value = `${year}.${monthStr}`;
            const label = `${year}년 ${monthStr}월`;
            options.push({ value, label });
            month++;
            if (month > 12) {
              month = 1;
              year++;
            }
          }
          // 내림차순 정렬: 최신(현재월)이 첫 번째에 오도록
          const descendingOptions = options.reverse();
          setPeriodOptions(descendingOptions);
          // 기본 선택은 내림차순 배열의 첫 번째(최신 기간)
          if (descendingOptions.length > 0) {
            setSelectedPeriod(descendingOptions[0].value);
          }
        }
      })
      .catch((err) => {
        console.error("가장 오래된 기간을 불러오는데 실패했습니다.", err);
      });
  }, []);

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
    // 선택 변경 시 추가 로직(API 호출 등)이 필요하면 여기에 작성하면 됨.
  };

  return (
    <div className="home-container">
      {/* 기존 Home 콘텐츠 유지 */}
      <h2 className="title">관리 대장</h2>
      <div>
        {/* StoreOrders.js에서 복사해온 기간 선택 토글 버튼 및 divider */}
        <div className="period-controls">
          <div className="period-search">
            <div
              className="period-select-box"
              onClick={() => {
                if (selectRef.current) {
                  selectRef.current.focus();
                  setIsDropdownOpen(true);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="select-display">
                {selectedPeriod
                  ? `${selectedPeriod.split(".")[0]}년 ${selectedPeriod.split(".")[1]}월`
                  : "기간 선택"}
              </div>
              <select
                ref={selectRef}
                value={selectedPeriod}
                onChange={handlePeriodChange}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setIsDropdownOpen(false)}
                className="custom-select"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span
                className="toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectRef.current) {
                    selectRef.current.focus();
                    setIsDropdownOpen(true);
                  }
                }}
              >
                <svg width="24" height="24" viewBox="0 0 22 22">
                  <path
                    d="M7 10l5 5 5-5z"
                    fill="#445382"
                    transform={isDropdownOpen ? "rotate(180 11 11)" : ""}
                  />
                </svg>
              </span>
            </div>
            <button
              className="reset-button"
              onClick={() => window.location.reload()}
            >
              새로고침
            </button>
            <button
              className="download-button"
              onClick={() => IODownloadExcel({ selectedPeriod })}
            >
              Excel 다운
            </button>
          </div>
        </div>
        <br />
        <hr className="divider" />
      </div>

      <br />
      {/* 운영 메뉴얼 섹션 */}
      <h2 className="manual-title">운영 메뉴얼</h2>
      <div className="manual-content">
        <h3>통합 관리</h3>
        <ul>
          <li>
            생성되는 모든 테이블은 제품관리에서 활성화된 제품을 기준으로
            생성되므로, 제품의 활성화 상태를 정확히 관리하는 것이 중요합니다.
          </li>
          <li>
            새로운 협력사와 제품이 추가될 경우, 먼저 협력사를 등록한 후 제품을
            추가해주세요.
          </li>
          <li>
            제품 가격이 변경된 경우에는 기존 제품을 비활성화하고, '제품 추가'
            버튼을 통해 새로 등록해주세요.
          </li>
        </ul>
        <h3>매장 관리</h3>
        <ul>
          <li>
            관리 대장을 다운로드하기 전에 월말 재고와 매장 발주를 반드시
            마감해주세요.
          </li>
          <li>
            관리대장에서 매장시트의 '전월재고' 열은 월말 재고 데이터를 기준으로
            불러옵니다.
          </li>
        </ul>
        <h3>창고 관리</h3>
        <ul>
          <li>
            관리 대장을 다운로드하기 전에 발주, 입고, 출고 데이터를 모두
            확인해주세요.
          </li>
          <li>유통기한 수정은 APP에서만 가능합니다.</li>
          <li>
            '전월재고' 열은 항상 전달의 마지막 일자 데이터를 기준으로
            불러옵니다.
          </li>
          <li>
            창고 발주 관리의 ‘현재고’ 열은 과거 기간일 경우, 해당 월의 마지막 날
            데이터를 기준으로 표시됩니다.
          </li>
        </ul>
      </div>
      <br />
      <br />
      <hr className="divider" />
    </div>
  );
};

export default Home;
