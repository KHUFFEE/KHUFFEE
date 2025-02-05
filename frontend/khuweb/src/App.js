import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";

function App() {
    return (
        <>
            <nav>
                <Link to="/">홈</Link> | 
                <Link to="/orders">발주</Link> | 
                <Link to="/inventory">재고 관리</Link>
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/inventory" element={<Inventory />} />
            </Routes>
        </>
    );
}

export default App;
