import React, { useEffect, useState } from "react";
import { fetchItems } from "../api/api";
import "../styles/Item.css";

const Item = () => {
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");

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

    return (
        <div className="item-container">
            <h2>제품 관리</h2>
            <hr className="divider" />
            {error && <p className="error">{error}</p>}
            <table className="item-table">
                <thead>
                    <tr>
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
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{item.품목명}</td>
                            <td>{item.협력사명}</td>
                            <td>{item.종류}</td>
                            <td>{item.규격}</td>
                            <td>{item.단위}</td>
                            <td>{item.입고단가}</td>
                            <td>{item.입고단위}</td>
                            <td>{item.입고단위단가}</td>
                            <td>{item.출고단위}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Item;
