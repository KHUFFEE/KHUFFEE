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
    body: JSON.stringify({ names: supplierNames }),
  });

  if (!response.ok) {
    throw new Error("Failed to delete suppliers");
  }

  return await response.json();
};

export const addItem = async (newItem) => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/api/suppliers/items/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newItem),
  });
  if (!response.ok) {
    throw new Error("Failed to add item");
  }
  return await response.json();
};

export const deleteItems = async (ids) => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/api/suppliers/items/delete/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new Error("Failed to delete items");
  }
  return await response.json();
};

export const updateItem = async (itemData) => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/api/suppliers/items/update/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(itemData),
  });
  if (!response.ok) {
    throw new Error("Failed to update item");
  }
  return await response.json();
};

export const fetchOrders = async (params) => {
  // 기간(예: "2025.02.3")이 전달되면 해당 기간으로 조회,
  // 그렇지 않으면 기본적으로 page 값을 사용 (기본값 page=1)
  let url = `${process.env.REACT_APP_API_URL}/api/orders/store_order_list/?`;
  if (params.기간) {
    url += `기간=${params.기간}`;
  } else {
    url += `page=${params.page || 1}`;
  }
  if (params.store_id) {
    url += `&store_id=${params.store_id}`;
  }
  if (params.order) {
    url += `&order=${params.order}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch orders");
  }
  return await response.json();
};


/* 추가: 매장 목록 불러오기 (StoreListView 활용) */
export const fetchStores = async () => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/api/accounts/stores/`);
  if (!response.ok) {
    throw new Error("Failed to fetch stores");
  }
  return await response.json();
};

export const updateStoreOrder = async (orderData) => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/store_order_update/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });
  if (!response.ok) {
    throw new Error("Failed to update store order");
  }
  return await response.json();
};

export const fetchWarehouseInventory = async (params) => {
  let url = `${process.env.REACT_APP_API_URL}/api/inventory/warehouse/?`;
  if (params.기간) {
    url += `기간=${params.기간}`;
  } else {
    url += `page=${params.page || 1}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch warehouse inventory");
  }
  return await response.json();
};

export const fetchStoreInventory = async (params) => {
  let url = `${process.env.REACT_APP_API_URL}/api/inventory/store/?`;
  if (params.기간) {
    url += `기간=${params.기간}`;
  }
  if (params.매장_id) {
    url += `&매장_id=${params.매장_id}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch store inventory");
  }
  return await response.json();
};

export const fetchStoreMonthEndInventory = async (params) => {
  let url = `${process.env.REACT_APP_API_URL}/api/inventory/store_monthend/?`;
  if (params.기간) {
    url += `기간=${params.기간}`;
  }
  if (params.매장_id) {
    url += `&매장_id=${params.매장_id}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch store_monthend");
  }
  return await response.json();
};

// 월말 재고 업데이트 함수
export const updateStoreMonthEndInventory = async (data) => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/api/inventory/store_monthend_inventory_update/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update store month-end inventory");
  }

  return await response.json();
};

// 상태 관리(상태_관리 테이블) 업데이트 함수
export const updateTableStatus = async (data) => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/api/management/table-status/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update table status");
  }

  return await response.json();
};
