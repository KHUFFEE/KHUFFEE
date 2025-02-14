import React, { useEffect, useState } from "react";
import { fetchSuppliers, addSupplier, deleteSuppliers } from "../api/api";
import "../styles/Suppliers.css";

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [error, setError] = useState("");
    const [newSupplier, setNewSupplier] = useState("");
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        const getSuppliers = async () => {
            try {
                const data = await fetchSuppliers();
                setSuppliers(data);
            } catch (err) {
                setError("Failed to load suppliers");
            }
        };
        getSuppliers();
    }, []);

    const handleAddSupplier = async () => {
        if (!newSupplier.trim()) return;
        try {
            const addedSupplier = await addSupplier(newSupplier);
            setSuppliers((prev) => [...prev, addedSupplier]);
            setNewSupplier("");
            setShowPopup(false);
        } catch (err) {
            setError("Failed to add supplier");
        }
    };

    const handleDeleteSuppliers = async () => {
        try {
            await deleteSuppliers(selectedSuppliers);
            setSuppliers((prev) =>
                prev.filter((supplier) => !selectedSuppliers.includes(supplier.협력사명))
            );
            setSelectedSuppliers([]);
            setIsDeleteMode(false);
        } catch (err) {
            setError("Failed to delete suppliers");
        }
    };

    const toggleSelect = (name) => {
        setSelectedSuppliers((prev) =>
            prev.includes(name)
                ? prev.filter((selectedName) => selectedName !== name)
                : [...prev, name]
        );
    };

    return (
        <div className="suppliers-container">
            <h2 className="suppliers-title">협력사 관리</h2>
            <div className="controls">
                <button onClick={() => setShowPopup(true)} className="add-button">
                    + 협력사 추가
                </button>
                <button
                    onClick={() => {
                        setIsDeleteMode((prev) => !prev);
                        if (isDeleteMode) setSelectedSuppliers([]);
                    }}
                    className="delete-button"
                >
                    {isDeleteMode ? "취소" : "삭제"}
                </button>
            </div>
            <hr className="divider" />
            {error && <p className="error">{error}</p>}
            <table className="suppliers-table">
                <thead>
                    <tr>
                        {isDeleteMode && <th className="narrow-col">선택</th>}
                        <th>번호</th>
                        <th>협력사명</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers.map((supplier, index) => (
                        <tr key={index}>
                            {isDeleteMode && (
                                <td className="narrow-col">
                                    <input
                                        type="checkbox"
                                        checked={selectedSuppliers.includes(supplier.협력사명)}
                                        onChange={() => toggleSelect(supplier.협력사명)}
                                    />
                                </td>
                            )}
                            <td>{index + 1}</td>
                            <td>{supplier.협력사명}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isDeleteMode && (
                <button
                    onClick={handleDeleteSuppliers}
                    disabled={selectedSuppliers.length === 0}
                    className="delete-confirm-button"
                >
                    선택 삭제
                </button>
            )}
            {showPopup && (
                <div className="popup">
                    <div className="popup-content">
                        <h3>협력사 추가</h3>
                        <input
                            type="text"
                            placeholder="협력사명 입력"
                            value={newSupplier}
                            onChange={(e) => setNewSupplier(e.target.value)}
                        />
                        <div className="popup-buttons">
                            <button onClick={() => setShowPopup(false)} className="popup-cancel">
                                취소
                            </button>
                            <button onClick={handleAddSupplier} className="popup-confirm">
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
