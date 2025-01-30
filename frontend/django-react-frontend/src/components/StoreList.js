import React, { useEffect, useState } from "react";
import { fetchStores } from "../api";

const StoreList = () => {
    const [stores, setStores] = useState([]);

    useEffect(() => {
        const getStores = async () => {
            const data = await fetchStores();
            setStores(data);
        };
        getStores();
    }, []);

    return (
        <div>
            <h2>매장 목록</h2>
            <ul>
                {stores.map((store) => (
                    <li key={store.store_id}>
                        {store.store_name} (ID: {store.store_id})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StoreList;
