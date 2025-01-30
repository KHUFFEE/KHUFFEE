import React, { useEffect, useState } from 'react';

const StoresTable = () => {
    const [stores, setStores] = useState([]);

    useEffect(() => {
        // Fetching the data from the local server
        fetch('http://localhost:8000/api/stores/?format=api')
            .then(response => response.json())
            .then(data => setStores(data))
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Kyunghee University Store List</h1>
            <div className="shadow-lg rounded-lg border border-gray-200 p-4">
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 p-2">Store ID</th>
                            <th className="border border-gray-300 p-2">Store Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stores.map((store) => (
                            <tr key={store.store_id}>
                                <td className="border border-gray-300 p-2">{store.store_id}</td>
                                <td className="border border-gray-300 p-2">{store.store_name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StoresTable;