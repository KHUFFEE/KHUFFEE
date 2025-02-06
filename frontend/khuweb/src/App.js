import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // 로그인 여부 확인 (토큰이 있는지 확인)
        const accessToken = localStorage.getItem("access");
        if (accessToken) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
            navigate("/login"); // 비로그인 상태일 경우 로그인 페이지로 이동
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setIsLoggedIn(false);
        navigate("/login");
    };

    return (
        <>
            {isLoggedIn && (
                <nav>
                    <Link to="/">홈</Link> | 
                    <Link to="/orders">발주</Link> | 
                    <Link to="/inventory">재고 관리</Link> | 
                    <button onClick={handleLogout}>로그아웃</button>
                </nav>
            )}
            <Routes>
                <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
                <Route path="/" element={<Home />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/inventory" element={<Inventory />} />
            </Routes>
        </>
    );
}

export default App;
