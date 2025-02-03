import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";  // Django 서버 주소

// 모든 매장 가져오기
export const fetchStores = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/stores/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching stores:", error);
        return [];
    }
};

// 특정 매장 가져오기
export const fetchStoreDetail = async (storeId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/stores/${storeId}/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching store detail:", error);
        return null;
    }
};
