// Centralized API client for Doorbaz Supershop & Admin Panel

const BASE_URL = '/api';

export function getAuthHeaders(options = {}) {
  const isAdminEndpoint = options.isAdmin || 
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));
  
  // Use admin token for admin portal/endpoints, customer token for storefront
  let token = null;
  if (isAdminEndpoint) {
    token = localStorage.getItem('sushop_admin_token') || localStorage.getItem('sushop_token');
  } else {
    token = localStorage.getItem('sushop_customer_token');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const isAdminApi = endpoint.startsWith('/analytics') || 
                     endpoint.startsWith('/settings') || 
                     endpoint.startsWith('/inventory') || 
                     endpoint.startsWith('/auth/admin') ||
                     (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  const baseHeaders = getAuthHeaders({ isAdmin: isAdminApi, ...(options || {}) });
  const headers = options.isFormData 
    ? { ...(options.headers || {}) } 
    : { ...baseHeaders, ...(options.headers || {}) };

  if (options.isFormData) {
    const token = isAdminApi 
      ? (localStorage.getItem('sushop_admin_token') || localStorage.getItem('sushop_token'))
      : localStorage.getItem('sushop_customer_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data && data.detail ? data.detail : (typeof data === 'string' ? data : 'API Request Failed');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth & Profile
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  adminLogin: (email, password) => apiRequest('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  customerLogin: (email, password) => apiRequest('/auth/customer/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logoutSession: () => apiRequest('/auth/logout', { method: 'POST' }),
  getPermissions: () => apiRequest('/auth/permissions'),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (data) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  gdprExport: () => apiRequest('/auth/gdpr-export'),
  gdprDelete: () => apiRequest('/auth/gdpr-delete', { method: 'DELETE' }),

  // Products & PIM
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/products${query ? '?' + query : ''}`);
  },
  getProduct: (idOrSlug) => apiRequest(`/products/${idOrSlug}`),
  getCategories: (flat = false) => apiRequest(`/products/categories${flat ? '?flat=true' : ''}`),
  createCategory: (data) => apiRequest('/products/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => apiRequest(`/products/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => apiRequest(`/products/categories/${id}`, { method: 'DELETE' }),
  getBrands: () => apiRequest('/products/brands'),
  createBrand: (data) => apiRequest('/products/brands', { method: 'POST', body: JSON.stringify(data) }),
  updateBrand: (id, data) => apiRequest(`/products/brands/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBrand: (id) => apiRequest(`/products/brands/${id}`, { method: 'DELETE' }),
  getAttributes: () => apiRequest('/products/attributes'),
  createAttribute: (data) => apiRequest('/products/attributes', { method: 'POST', body: JSON.stringify(data) }),
  generateVariantMatrix: (data) => apiRequest('/products/generate-variant-matrix', { method: 'POST', body: JSON.stringify(data) }),
  createProduct: (data) => apiRequest('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
  addReview: (productId, data) => apiRequest(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
  askQuestion: (productId, data) => apiRequest(`/products/${productId}/qas`, { method: 'POST', body: JSON.stringify(data) }),
  answerQuestion: (qaId, data) => apiRequest(`/products/qas/${qaId}/answer`, { method: 'PUT', body: JSON.stringify(data) }),
  validateCatalogImport: (rows) => apiRequest('/products/import/validate', { method: 'POST', body: JSON.stringify({ rows }) }),
  commitCatalogImport: (rows) => apiRequest('/products/import/commit', { method: 'POST', body: JSON.stringify({ rows }) }),
  exportCatalogCsv: () => apiRequest('/products/export/csv'),

  // Inventory & Warehouses
  getWarehouses: () => apiRequest('/inventory/warehouses'),
  createWarehouse: (data) => apiRequest('/inventory/warehouses', { method: 'POST', body: JSON.stringify(data) }),
  getStockOverview: () => apiRequest('/inventory/stock-overview'),
  createStockAdjustment: (data) => apiRequest('/inventory/adjustments', { method: 'POST', body: JSON.stringify(data) }),
  getAuditLogs: () => apiRequest('/inventory/audit-logs'),
  transferStock: (data) => apiRequest('/inventory/transfers', { method: 'POST', body: JSON.stringify(data) }),
  updateGlobalStockThreshold: (threshold, applyToAll = true) => apiRequest('/inventory/threshold', { method: 'PUT', body: JSON.stringify({ threshold, apply_to_all: applyToAll }) }),
  updateProductStockThreshold: (productId, threshold) => apiRequest(`/inventory/products/${productId}/threshold`, { method: 'PUT', body: JSON.stringify({ threshold }) }),

  // Orders & Fulfillment State Machine
  checkout: (data) => apiRequest('/orders/checkout', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/orders${query ? '?' + query : ''}`);
  },
  getOrder: (orderNumber) => apiRequest(`/orders/${orderNumber}`),
  transitionOrderStatus: (orderNumber, status, notes) => apiRequest(`/orders/${orderNumber}/transition`, { method: 'POST', body: JSON.stringify({ status, notes }) }),
  generateBulkDispatch: (orderNumbers, docType) => apiRequest('/orders/bulk-dispatch-documents', { method: 'POST', body: JSON.stringify({ order_numbers: orderNumbers, doc_type: docType }) }),
  requestRMA: (data) => apiRequest('/orders/rma/request', { method: 'POST', body: JSON.stringify(data) }),
  getRMARequests: () => apiRequest('/orders/rma/requests'),
  triggerRefund: (rmaId, data) => apiRequest(`/orders/rma/${rmaId}/trigger-refund`, { method: 'POST', body: JSON.stringify(data) }),

  // CRM & Customer Management
  getCrmDashboard: () => apiRequest('/customers/dashboard'),
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/customers${query ? '?' + query : ''}`);
  },
  getCustomerProfile: (userId) => apiRequest(`/customers/${userId}/profile`),
  getCustomerTimeline: (userId) => apiRequest(`/customers/${userId}/profile`),
  updateCustomerSegment: (userId, segmentTag) => apiRequest(`/customers/${userId}/tags`, { method: 'POST', body: JSON.stringify({ tag_name: segmentTag }) }),
  getCustomerTags: () => apiRequest('/customers/tags'),
  createCustomerTag: (data) => apiRequest('/customers/tags', { method: 'POST', body: JSON.stringify(data) }),
  deleteCustomerTag: (tagId) => apiRequest(`/customers/tags/${tagId}`, { method: 'DELETE' }),
  assignCustomerTag: (userId, tagName) => apiRequest(`/customers/${userId}/tags`, { method: 'POST', body: JSON.stringify({ tag_name: tagName }) }),
  removeCustomerTag: (userId, tagName) => apiRequest(`/customers/${userId}/tags/${tagName}`, { method: 'DELETE' }),
  runAutoSegmentation: () => apiRequest('/customers/auto-segment', { method: 'POST' }),
  exportCustomersCsv: (filter = 'all') => apiRequest('/customers/export', { method: 'POST', body: JSON.stringify({ filter }) }),
  getExportLogs: () => apiRequest('/customers/export-logs'),
  createDeletionRequest: (userId, reason) => apiRequest(`/customers/${userId}/delete-request`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getDeletionRequests: () => apiRequest('/customers/deletion-requests'),
  processDeletionRequest: (reqId, action) => apiRequest(`/customers/deletion-requests/${reqId}/action`, { method: 'POST', body: JSON.stringify({ action }) }),

  // Customer Portal
  getMyProfile: () => apiRequest('/customers/portal/profile'),
  updateMyProfile: (data) => apiRequest('/customers/portal/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changeMyPassword: (currentPassword, newPassword) => apiRequest('/customers/portal/change-password', { method: 'POST', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }),
  getMyOrders: () => apiRequest('/customers/portal/orders'),
  repeatOrder: (orderNumber) => apiRequest(`/customers/portal/repeat-order/${orderNumber}`, { method: 'POST' }),
  getSavedAddresses: () => apiRequest('/customers/portal/addresses'),
  saveAddress: (data) => apiRequest('/customers/portal/addresses', { method: 'POST', body: JSON.stringify(data) }),
  updateSavedAddress: (addressId, data) => apiRequest(`/customers/portal/addresses/${addressId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSavedAddress: (addressId) => apiRequest(`/customers/portal/addresses/${addressId}`, { method: 'DELETE' }),
  getMyReviews: () => apiRequest('/customers/portal/reviews'),
  getAvailableCoupons: () => apiRequest('/customers/portal/coupons'),
  getWishlist: () => apiRequest('/customers/portal/wishlist'),
  toggleWishlist: (productId) => apiRequest(`/customers/portal/wishlist/${productId}`, { method: 'POST' }),
  getSupportTickets: () => apiRequest('/customers/portal/tickets'),
  createSupportTicket: (data) => apiRequest('/customers/portal/tickets', { method: 'POST', body: JSON.stringify(data) }),
  replySupportTicket: (ticketNumber, data) => apiRequest(`/customers/portal/tickets/${ticketNumber}/reply`, { method: 'POST', body: JSON.stringify(data) }),

  // Marketing & Promotions
  getCoupons: () => apiRequest('/marketing/coupons'),
  createCoupon: (data) => apiRequest('/marketing/coupons', { method: 'POST', body: JSON.stringify(data) }),
  deleteCoupon: (id) => apiRequest(`/marketing/coupons/${id}`, { method: 'DELETE' }),
  validateCoupon: (code, cartTotal, categoryIds = []) => apiRequest('/marketing/coupons/validate', { method: 'POST', body: JSON.stringify({ code, cart_total: cartTotal, category_ids: categoryIds }) }),
  getFlashSales: () => apiRequest('/marketing/flash-sales'),
  createFlashSale: (data) => apiRequest('/marketing/flash-sales', { method: 'POST', body: JSON.stringify(data) }),
  // Hero Banners & Marketing
  getBanners: (params = {}) => {
    if (typeof params === 'string') {
      return apiRequest(`/content/banners?position=${params}&active_only=true`);
    }
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/content/banners${query ? '?' + query : ''}`);
  },
  getBanner: (id) => apiRequest(`/content/banners/${id}`),
  createBanner: (data) => apiRequest('/content/banners', { method: 'POST', body: JSON.stringify(data) }),
  updateBanner: (id, data) => apiRequest(`/content/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBanner: (id) => apiRequest(`/content/banners/${id}`, { method: 'DELETE' }),
  toggleBannerStatus: (id, isActive) => apiRequest(`/content/banners/${id}/status`, { 
    method: 'PATCH', 
    body: JSON.stringify(isActive !== undefined ? { is_active: isActive } : {}) 
  }),
  uploadBannerImage: (formData) => apiRequest('/content/banners/upload', { 
    method: 'POST', 
    body: formData, 
    isFormData: true 
  }),

  // Analytics & Reports
  getExecutiveDashboard: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/analytics/dashboard${qs ? '?' + qs : ''}`);
  },
  getFinancialReports: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/analytics/financial-reports${qs ? '?' + qs : ''}`);
  },
  exportFinancialReportsCsv: (params = {}) => 
    apiRequest('/analytics/financial-reports/export', { method: 'POST', body: JSON.stringify(params) }),
  getFulfillmentMetrics: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/analytics/fulfillment-metrics${qs ? '?' + qs : ''}`);
  },
  trackSiteVisit: (sessionId, path = '/') =>
    apiRequest('/analytics/track-visit', { method: 'POST', body: JSON.stringify({ session_id: sessionId, path }) }),

  // Content & Legal & DAM
  getPages: () => apiRequest('/content/pages'),
  getPage: (slug) => apiRequest(`/content/pages/${slug}`),
  upsertPage: (data) => apiRequest('/content/pages', { method: 'POST', body: JSON.stringify(data) }),
  getStoreLocations: () => apiRequest('/content/store-locator'),
  getFAQs: () => apiRequest('/content/faqs'),
  getMedia: () => apiRequest('/content/media'),
  uploadMedia: (formData) => apiRequest('/content/media/upload', { method: 'POST', body: formData, isFormData: true }),
  getJsonLd: (productSlug) => apiRequest(`/content/seo/json-ld/${productSlug}`),

  // Settings & System Users
  getGeneralSettings: () => apiRequest('/settings/general'),
  updateGeneralSettings: (data) => apiRequest('/settings/general', { method: 'PUT', body: JSON.stringify(data) }),
  getSystemUsers: () => apiRequest('/settings/users'),
  getAdminUsers: () => apiRequest('/settings/admin-users'),
  createAdminUser: (data) => apiRequest('/settings/admin-users', { method: 'POST', body: JSON.stringify(data) }),
  deleteAdminUser: (userId) => apiRequest(`/settings/admin-users/${userId}`, { method: 'DELETE' }),
  getAuditLogs: (params) => {
    const q = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/settings/audit-logs${q ? '?' + q : ''}`);
  },
  updateUserRole: (userId, role) => apiRequest(`/settings/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  getPaymentMethods: () => apiRequest('/settings/payment-methods'),
  getShippingZones: () => apiRequest('/settings/shipping-zones'),
  getRolesPermissions: () => apiRequest('/settings/roles-permissions')
};

