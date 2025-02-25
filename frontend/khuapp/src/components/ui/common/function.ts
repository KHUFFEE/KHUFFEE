import { RN_API_URL } from '@env';
import {StoreOrderData, APIProduct, SelectedItem, LocalOrder, storename, StoreOrderRequestProps, OrderRequestProps } from '../common/types';

/** 숫자를 천 단위로 포맷하는 함수 */
// f.ts (유틸리티 함수 파일)
export const formatPrice = (value: number | undefined | null): string => {
  const num = value ?? 0; // value가 undefined 혹은 null이면 0을 사용
  return num.toLocaleString();
};

/** "YYYY.MM.W" -> "YYYY년 M월 W주차" (화면 표시용) */
export function formatWeekString(dateKey: string): string {
    const [yearStr, monthStr, weekStr] = dateKey.split('.');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const week = parseInt(weekStr, 10);
    return `${year}년 ${month}월 ${week}주차`;
  }

 /** 기간 문자열을 만드는 헬퍼: (2025, 2, 3) -> "2025.02.3" */
export function buildPeriodString(y: number | null, m: number | null, w: number | null): string {
    if (y === null || m === null || w === null) {
      return '';
    }
    const mm = String(m).padStart(2, '0');
    return `${y}.${mm}.${w}`;
  }


  export function formatDayString(dateKey: string): string {
    const [yearStr, monthStr, dayStr] = dateKey.split('.');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    return `${year}년 ${month}월 ${day}일`;
  }
  
/** 상품 리스트에서 중복되지 않는 카테고리 추출 */
export const getUniqueCategories = (apiItems: any[]): string[] => {
  return Array.from(new Set(apiItems.map((item) => item.종류)));
};

/** 선택된 카테고리에 따라 상품 필터링 */
export const getFilteredProducts = (apiItems: any[], selectedCategory: string | null): any[] => {
  return selectedCategory ? apiItems.filter((item) => item.종류 === selectedCategory) : apiItems;
};


  /** 품목 리스트 API 호출 함수 */
export const fetchApiItems = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${RN_API_URL}/api/suppliers/items/`);
    if (!response.ok) throw new Error('서버 응답 오류');
    return await response.json();
  } catch (error) {
    console.error('품목 데이터 불러오기 오류:', error);
    return [];
  }
};


/** 협력사 리스트 API 호출 함수 */
export const fetchSuppliers = async (): Promise<any[]> => { // async는 비동기로 만듦
  try {
      const response = await fetch(`${RN_API_URL}/api/suppliers/`);
      if (!response.ok) throw new Error('서버 응답 오류');
      return await response.json();
  } catch (error) {
      console.error('공급업체 데이터 불러오기 오류:', error);
      return [];
  }
};

 /** 협력사 목록에서 특정 품목의 협력사 찾는 헬퍼  */
 export const getSupplierName = (product: APIProduct, suppliers: any[]): string => {
  const supplier = suppliers.find((s: any) => s.협력사_id === product.협력사_id);
  return supplier ? supplier.협력사명 : product.협력사명;  // 사용방법: getSupplierName(product, suppliers)
};




/** 품목 리스트를 협력사명 및 품목명 기준으로 정렬하는 함수 */
export const sortProductsBySupplierAndName = (filteredProducts: APIProduct[], suppliers: any[]): APIProduct[] => {
  return filteredProducts.slice().sort((a, b) => {
    const supplierA = getSupplierName(a, suppliers);
    const supplierB = getSupplierName(b, suppliers);

    if (supplierA < supplierB) return -1;
    if (supplierA > supplierB) return 1;

    const aStartsWithNumber = /^\d/.test(a.품목명);
    const bStartsWithNumber = /^\d/.test(b.품목명);
    if (aStartsWithNumber !== bStartsWithNumber) {
      return aStartsWithNumber ? 1 : -1;
    }
    if (a.품목명 < b.품목명) return -1;
    if (a.품목명 > b.품목명) return 1;
    return 0;
  });
};
 
/** 품목을 선택된 리스트에 추가하는 함수 */
export const addItemToSelectedItems = (
  selectedItems: SelectedItem[],
  product: APIProduct
): SelectedItem[] => {
  const existingItem = selectedItems.find((item) => item.품목_id === product.품목_id);
  
  if (existingItem) {
    return selectedItems.map((item) =>
      item.품목_id === product.품목_id
        ? {
            ...item,
            quantity: item.quantity + product.출고단위,
            customQuantity: (item.quantity + product.출고단위).toString(),
            error: null,
          }
        : item
    );
  } else {
    return [
      ...selectedItems,
      {
        ...product,
        quantity: product.출고단위,
        customQuantity: product.출고단위.toString(),
        error: null,
      },
    ];
  }
};



/** 선택된 품목의 수량을 업데이트하는 함수 */
export const updateQuantity = (
  selectedItems: SelectedItem[],
  productId: string,
  increment: number
): SelectedItem[] => {
  return selectedItems.map((item) => {
    if (item.품목_id === productId) {
      const newQuantity = item.quantity + increment;
      const validQuantity = newQuantity < item.출고단위 ? item.출고단위 : newQuantity;
      return {
        ...item,
        quantity: validQuantity,
        customQuantity: validQuantity.toString(),
        error: null,
      };
    }
    return item;
  });
};


/** 사용자 입력에 따른 수량 업데이트 함수 */
export const updateCustomQuantityUtil = (
  selectedItems: SelectedItem[],
  productId: string,
  text: string
): SelectedItem[] => {
  return selectedItems.map((item) => {
    if (item.품목_id === productId) {
      const numericValue = parseInt(text, 10);
      if (!isNaN(numericValue)) {
        if (numericValue === 0) {
          return {
            ...item,
            customQuantity: text,
            error: `최소 수량은 ${item.출고단위}${item.단위}입니다.`,
          };
        }
        if (numericValue % item.출고단위 === 0) {
          return {
            ...item,
            quantity: numericValue,
            customQuantity: text,
            error: null,
          };
        } else {
          return {
            ...item,
            customQuantity: text,
            error: `출고 단위는 ${item.출고단위}의 배수여야 합니다.`,
          };
        }
      } else {
        return {
          ...item,
          customQuantity: text,
          error: '유효한 숫자를 입력하세요.',
        };
      }
    }
    return item;
  });
};

/** 품목 제거 함수 */
export const removeItemUtil = (
  selectedItems: SelectedItem[],
  productId: string
): SelectedItem[] => {
  return selectedItems.filter((item) => item.품목_id !== productId);
};

 // 발주 확인 (상품 선택 유무 / 각종 유효성 체크)
export const handleConfirmOrderUtil = (    
  selectedItems: SelectedItem[]
): string[] => {
  const errors: string[] = [];
  
  if (selectedItems.length === 0) {
    errors.push('상품을 선택해 주세요.');
    return errors;
  }
  selectedItems.forEach((item) => {
    if (item.quantity === 0) {
      errors.push(`${item.품목명}의 수량이 0입니다. 최소 수량은 ${item.출고단위}${item.단위}입니다.`);
    }
    if (item.quantity % item.출고단위 !== 0) {
      errors.push(`${item.품목명}의 수량은 ${item.출고단위}${item.단위}의 배수여야 합니다.`);
    }
    if (item.error) {
      errors.push(`${item.품목명}: ${item.error}`);
    }
  });
  return errors;
};


/** 발주 요청 처리 함수 (비동기 함수)  
 *  storeId와 selectedItems를 받아서 각 품목별 발주 API를 호출하고,
 *  실패한 항목이 있으면 { failures }를, 모두 성공하면 { newOrder } 객체를 반환합니다.
 */
export const handleOrderSubmitUtil = async (
  storeId: string,
  selectedItems: SelectedItem[]
): Promise<{ newOrder?: LocalOrder; failures?: string[] }> => {
  const failures: string[] = [];

  // 기본 회차와 기간 계산: 현재 날짜를 기준으로 (예시)
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const week = Math.ceil(currentDate.getDate() / 7);
  let currentRound = 1;
  let currentPeriod = `${year}.${month}.${week}`;

  // 먼저 store_order_list에서 기간 정보를 가져오기 (회차는 여기서 사용하지 않음)
  try {
    const orderListResponse = await fetch(
      `${RN_API_URL}/api/orders/store_order_list?store_id=${storeId}&page=1&order=desc`
    );
    if (orderListResponse.ok) {
      const orderListData = await orderListResponse.json();
      if (orderListData.current_period) {
        currentPeriod = orderListData.current_period;
      }
    }
  } catch (error) {
    console.error("기간 정보를 가져오는 중 오류 발생, 기본값 사용:", error);
  }

  // table_status_list에서 "매장_발주"의 상태 값을 회차로 사용
  try {
    const tableStatusResponse = await fetch(
      `${RN_API_URL}/api/management/table_status_list/`
    );
    if (tableStatusResponse.ok) {
      const tableStatusData = await tableStatusResponse.json();
      // "매장_발주"에 해당하는 항목 찾기
      const 매장발주Status = tableStatusData.find(
        (item: any) => item.테이블 === "매장_발주"
      );
      if (매장발주Status && 매장발주Status.상태 !== undefined) {
        currentRound = parseInt(매장발주Status.상태, 10);
      }
    }
  } catch (error) {
    console.error("테이블 상태 정보를 가져오는 중 오류 발생, 기본 회차 사용:", error);
  }

  // 선택된 각 품목에 대해 POST 요청 전송
  for (const item of selectedItems) {
    // payload에 회차와 기간 추가
    const payload = {
      매장_id: storeId,
      품목_id: item.품목_id,
      기간: currentPeriod,
      회차: currentRound,
      매장_발주량: item.quantity,
    };

    try {
      const response = await fetch(`${RN_API_URL}/api/orders/store_order_create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        failures.push(`${item.품목명} 발주 전송 실패`);
      }
    } catch (error) {
      failures.push(`${item.품목명} 발주 전송 실패`);
    }
  }

  // 예시에서는 성공 시 newOrder를 빈 객체로 반환 (필요에 따라 로직 수정)
  return { newOrder: {} as LocalOrder, failures: failures.length > 0 ? failures : undefined };
};



/** 선택된 품목들의 총 가격 계산 함수 */
export const calculateTotalPrice = (selectedItems: SelectedItem[]): number => {
  return selectedItems.reduce((sum, item) => {
    const price = parseFloat(item.입고단가);
    return sum + item.quantity * (isNaN(price) ? 0 : price);
  }, 0);
};


