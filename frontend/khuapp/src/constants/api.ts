import { API_BASE_URL, API_TIMEOUT, API_VERSION } from '@env';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: parseInt(API_TIMEOUT),
  version: API_VERSION,
} as const;

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseURL}/api/${API_CONFIG.version}${endpoint}`;
};

// API 엔드포인트 상수
export const API_ENDPOINTS = {
  // 매장 관련 엔드포인트
  STORE: {
    INVENTORY: '/store/inventory', // 추후 수정 
    ORDERS: '/store/orders',
    ORDER_STATUS: '/store/order-status',
  },
  // 창고 관련 엔드포인트
  WAREHOUSE: {
    INVENTORY: '/warehouse/inventory',
    ORDERS: '/warehouse/orders',
    SHIPMENTS: '/warehouse/shipments',
  },
  // 관리자 관련 엔드포인트
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    REPORTS: '/admin/reports',
  },
} as const; 