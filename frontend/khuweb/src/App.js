import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Item from "./pages/Item";
import Login from "./pages/Login";
import Suppliers from "./pages/Suppliers"; // 추가

import "./styles/App.css";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showStoreMenu, setShowStoreMenu] = useState(false); // 매장 관리 토글
    const [showWarehouseMenu, setShowWarehouseMenu] = useState(false); // 창고 관리 토글
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

    return (
        <>
            {isLoggedIn && (
                <>
                    <header className="app-header">
                        <span>Cafekhuffee</span>
                        <button className="logout-btn" onClick={handleLogout}>
                            로그아웃
                        </button>
                        <div className="header-divider"></div>
                    </header>
                    <div className="app-container">
                        <aside className="app-sidebar">
                            <nav>
                                <Link to="/">홈</Link>
                                <Link to="/item">제품 관리</Link>
                                <Link to="/sales">매출 관리</Link>
                                <Link to="/suppliers">협력사 관리</Link>
                                <div>
                                    <div className="toggle-menu" onClick={() => setShowStoreMenu(!showStoreMenu)}>
                                        매장 관리 {showStoreMenu ? "↑" : "↓"}
                                    </div>
                                    {showStoreMenu && (
                                        <div className="submenu">
                                            <Link to="/store/orders">발주</Link>
                                            <Link to="/store/item">재고</Link>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="toggle-menu" onClick={() => setShowWarehouseMenu(!showWarehouseMenu)}>
                                        창고 관리 {showWarehouseMenu ? "↑" : "↓"}
                                    </div>
                                    {showWarehouseMenu && (
                                        <div className="submenu">
                                            <Link to="/warehouse/incoming">입고</Link>
                                            <Link to="/warehouse/outgoing">출고</Link>
                                            <Link to="/warehouse/orders">발주</Link>
                                            <Link to="/warehouse/expiry">유통 기한 관리</Link>
                                        </div>
                                    )}
                                </div>
                            </nav>
                        </aside>
                        <main className="app-main">
                            <Routes>
                                <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
                                <Route path="/" element={<Home />} />
                                <Route path="/orders" element={<Orders />} />
                                <Route path="/suppliers" element={<Suppliers />} />
                                <Route path="/item" element={<Item />} />
                            </Routes>
                        </main>
                    </div>
                </>
            )}
            {!isLoggedIn && (
                <Routes>
                    <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
                </Routes>
            )}
        </>
    );
}

export default App;
