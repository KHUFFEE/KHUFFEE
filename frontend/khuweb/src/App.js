// frontend/khuweb/src/App.js
import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Orders from "./pages/StoreOrders";
import Item from "./pages/Item";
import Login from "./pages/Login";
import Suppliers from "./pages/Suppliers";
import InventoryLog from "./pages/InventoryLog";
import StoreInventory from "./pages/StoreInventory";
import WarehouseInventory from "./pages/WarehouseInventory";
import WarehouseIncoming from "./pages/WarehouseIncoming";
import WarehouseOutgoing from "./pages/WarehouseOutgoing";
import WarehouseOrder from "./pages/WarehouseOrder";

// React Icons
import { 
  FaHome, 
  FaThLarge, 
  FaStore, 
  FaWarehouse, 
  FaChevronUp, 
  FaChevronDown,
  FaMoon,
  FaSun
} from "react-icons/fa";

// CSS
import "./styles/App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // 모든 토글 메뉴 기본값 '닫힘(false)'
  const [showIntegrationMenu, setShowIntegrationMenu] = useState(true);
  const [showStoreMenu, setShowStoreMenu] = useState(true);
  const [showWarehouseMenu, setShowWarehouseMenu] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    if (accessToken) {
      setIsLoggedIn(true);
      if (location.pathname === "/login") {
        navigate("/"); // 로그인 상태에서 로그인 페이지 접근 방지
      }
    } else {
      setIsLoggedIn(false);
      navigate("/login");
    }
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const handleToggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  return (
    <>
      {isLoggedIn && (
        // 최상위 컨테이너에 darkMode 상태에 따른 클래스를 추가
        <div className={darkMode ? "dark-mode" : ""}>
          <header className="app-header">
            <div className="logo-container">
              <img src="/assets/images/logo2.png" alt="Logo" className="logo" />
              <span className="logo-text">cafeKHUFFEE</span>
            </div>
            <div className="header-buttons">
              {/* 다크모드 토글 버튼 */}
              <button className="dark-mode-btn" onClick={handleToggleDarkMode}>
                {darkMode ? <FaSun className="menu-icon" /> : <FaMoon className="menu-icon" />}
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
            <div className="header-divider"></div>
          </header>
          <div className="app-container">
            <aside className="app-sidebar">
              <nav>
                {/* 1. 홈 */}
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive ? "menu-link active" : "menu-link"
                  }
                >
                  <FaHome className="menu-icon" />
                  <span>홈</span>
                </NavLink>

                {/* 2. 통합 관리 (토글) */}
                <div>
                  <div
                    className="toggle-menu"
                    onClick={() => setShowIntegrationMenu(!showIntegrationMenu)}
                  >
                    <div>
                      <FaThLarge className="menu-icon" />
                      <span>통합 관리</span>
                    </div>
                    {showIntegrationMenu ? (
                      <FaChevronUp className="toggle-icon" />
                    ) : (
                      <FaChevronDown className="toggle-icon" />
                    )}
                  </div>
                  {showIntegrationMenu && (
                    <div className="submenu">
                      <NavLink
                        to="/integration/item"
                        className={({ isActive }) =>
                          isActive ? "active" : ""
                        }
                      >
                        제품
                      </NavLink>
                      <NavLink
                        to="/integration/suppliers"
                        className={({ isActive }) =>
                          isActive ? "active" : ""
                        }
                      >
                        협력사
                      </NavLink>
                      <NavLink
                        to="/integration/inventorylog"
                        className={({ isActive }) =>
                          isActive ? "active" : ""
                        }
                      >
                        입출고관리대장
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* 3. 매장 관리 (토글) */}
                <div>
                  <div
                    className="toggle-menu"
                    onClick={() => setShowStoreMenu(!showStoreMenu)}
                  >
                    <div>
                      <FaStore className="menu-icon" />
                      <span>매장 관리</span>
                    </div>
                    {showStoreMenu ? (
                      <FaChevronUp className="toggle-icon" />
                    ) : (
                      <FaChevronDown className="toggle-icon" />
                    )}
                  </div>
                  {showStoreMenu && (
                    <div className="submenu">
                      <NavLink
                        to="/store/inventory"
                        className={({ isActive }) => (isActive ? "active" : "")}
                      >
                        재고
                      </NavLink>
                      <NavLink
                        to="/store/orders"
                        className={({ isActive }) => (isActive ? "active" : "")}
                      >
                        발주 취합서
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* 4. 창고 관리 (토글) */}
                <div>
                  <div
                    className="toggle-menu"
                    onClick={() => setShowWarehouseMenu(!showWarehouseMenu)}
                  >
                    <div>
                      <FaWarehouse className="menu-icon" />
                      <span>창고 관리</span>
                    </div>
                    {showWarehouseMenu ? (
                      <FaChevronUp className="toggle-icon" />
                    ) : (
                      <FaChevronDown className="toggle-icon" />
                    )}
                  </div>
                  {showWarehouseMenu && (
                    <div className="submenu">
                      <NavLink
                        to="/warehouse/inventory"
                        className={({ isActive }) => (isActive ? "active" : "")}
                      >
                        재고
                      </NavLink>
                      <NavLink
                        to="/warehouse/incoming"
                        className={({ isActive }) => (isActive ? "active" : "")}
                      >
                        입고
                      </NavLink>
                      <NavLink
                        to="/warehouse/outgoing"
                        className={({ isActive }) => (isActive ? "active" : "")}
                      >
                        출고
                      </NavLink>
                      <NavLink
                        to="/warehouse/orders"
                        className={({ isActive }) => (isActive ? "active" : "")}
                      >
                        발주
                      </NavLink>
                    </div>
                  )}
                </div>

              </nav>
            </aside>
            <main className="app-main">
              <Routes>
                <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
                <Route path="/" element={<Home />} />
                <Route path="/store/inventory" element={<StoreInventory />} />
                <Route path="/store/orders" element={<Orders />} />
                <Route path="/integration/suppliers" element={<Suppliers />} />
                <Route path="/integration/inventorylog" element={<InventoryLog />} />
                <Route path="/integration/item" element={<Item />} />
                <Route path="/warehouse/inventory" element={<WarehouseInventory />} />
                <Route path="/warehouse/incoming" element={<WarehouseIncoming />} />
                <Route path="/warehouse/outgoing" element={<WarehouseOutgoing />} />
                <Route path="/warehouse/orders" element={<WarehouseOrder />} />
              </Routes>
            </main>
          </div>
        </div>
      )}
      {!isLoggedIn && (
        <Routes>
          <Route
            path="/login"
            element={<Login setIsLoggedIn={setIsLoggedIn} />}
          />
        </Routes>
      )}
    </>
  );
}

export default App;
