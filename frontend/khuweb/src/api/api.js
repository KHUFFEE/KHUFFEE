export const fetchItems = async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/suppliers/items/`);
    if (!response.ok) {
        throw new Error("Failed to fetch items");
    }
    return await response.json();
};

export const fetchSuppliers = async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/suppliers/`);
    if (!response.ok) {
        throw new Error("Failed to fetch suppliers");
    }
    return await response.json();
};

export const addSupplier = async (supplierName) => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/suppliers/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ 협력사명: supplierName }),
    });
    if (!response.ok) {
        throw new Error("Failed to add supplier");
    }
    return await response.json();
};

export const deleteSuppliers = async (supplierNames) => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/suppliers/delete/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ names: supplierNames }), // 협력사명을 기준으로 삭제 요청
    });

    if (!response.ok) {
        throw new Error("Failed to delete suppliers");
    }

    return await response.json();
};
