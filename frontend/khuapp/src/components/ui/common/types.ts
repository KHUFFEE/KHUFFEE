/** 화면 전환 타입 */
export type ViewType =
  | "home"
  | "order-request"
  | "order-status"
  | "inventory"
  | "expiration"
  | "stock";
import { RN_API_URL } from "@env";
/** 서버에서 받아오는 "발주 내역" 타입 */
export interface StoreOrderData {
  매장_id: string;
  품목_id: string;
  기간: string; // 예: "2025.02.3"
  매장_발주량: number;
  품목명?: string;
  협력사명?: string;
  종류?: string; // <-- 추가된 속성 (optional)
  출고단위?: number;
  입고단가?: string;
  totalCost?: number;
}

/** 서버에서 받아오는 "품목" 타입 */
export interface APIProduct {
  품목_id: string;
  협력사_id: string;
  품목명: string;
  협력사명: string;
  종류: string;
  규격: string;
  단위: string;
  입고단가: string;
  입고단위: number;
  입고단위단가: number;
  출고단위: number;
}

export interface SelectedItem extends APIProduct {
  quantity: number;
  customQuantity: string;
  error: string | null;
}

/** 로컬 주문 타입 */
export interface LocalOrder {
  id: number;
  date: string;
  items: {
    품목_id: string;
    품목명: string;
    quantity: number;
    단위: string;
    출고단위: number;
  }[];
}
export interface storename {
  storeName: string;
}

/** 발주 요청 컴포넌트 */
export interface StoreOrderRequestProps {
  storeName: string;
  storeId: string;
  onOrderComplete: () => void;
  onNewOrder: (orderData: LocalOrder) => void;
}

// OrderRequest.tsx에서 사용하는 props 타입

export interface OrderRequestProps {
  storeName: string;
  storeId: string;
  onOrderComplete: () => void;
  onNewOrder: (orderData: LocalOrder) => void;
}

/** 협력사 리스트 API 호출 함수 */
export const fetchSuppliers = async (): Promise<any[]> => {
  // async는 비동기로 만듦
  try {
    const response = await fetch(`${RN_API_URL}/api/suppliers/`);
    if (!response.ok) throw new Error("서버 응답 오류");
    return await response.json();
  } catch (error) {
    console.error("공급업체 데이터 불러오기 오류:", error);
    return [];
  }
};
