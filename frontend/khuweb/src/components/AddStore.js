import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


const AddStore = () => {
    const [storeId, setStoreId] = useState("");
    const [storeName, setStoreName] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_BASE_URL}/stores/`, {
                store_id: storeId,
                store_name: storeName
            });
            setMessage(`매장 추가 성공: ${response.data.store_name}`);
            setStoreId("");
            setStoreName("");
        } catch (error) {
            setMessage("매장 추가 실패");
            console.error("Error adding store:", error);
        }
    };

    return (
        <div>
            <h2>새 매장 추가</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="매장 ID"
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="매장 이름"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                />
                <button type="submit">추가</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default AddStore;
