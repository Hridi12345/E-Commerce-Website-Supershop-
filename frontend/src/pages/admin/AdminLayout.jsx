import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, FolderTree, Tags, Layers, FileText, 
  Image as ImageIcon, ShoppingCart, Users, Sparkles, Warehouse, 
  CreditCard, Truck, BarChart3, Settings, ShieldCheck, Plus, 
  Download, Upload, RefreshCw, Printer, AlertTriangle, Eye, Edit, Trash2, CheckCircle2,
  RotateCcw, LogOut, ArrowLeft, Search, Check, X, TrendingUp, Clock, DollarSign, Calendar, Filter, Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

export default function AdminLayout({ initialTab = 'dashboard', onExitAdmin, onLogout, onNavigateAdmin }) {
  const { adminUser, user } = useAuth();
  const currentAdmin = adminUser || user;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const getInitialTab = () => {
    const path = window.location.pathname;
    if (path.startsWith('/admin/')) {
      const seg = path.replace('/admin/', '').split('/')[0];
      if (seg && seg !== 'login') return seg === 'users' ? 'roles' : seg;
    }
    return initialTab === 'users' ? 'roles' : (initialTab || 'dashboard');
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'users' ? 'roles' : initialTab);
    }
  }, [initialTab]);

  const roleAllowedTabs = {
    super_admin: ['dashboard', 'products', 'categories', 'brands', 'orders', 'inventory', 'customers', 'marketing', 'content', 'finance', 'shipping', 'analytics', 'settings', 'roles', 'users'],
    admin: ['dashboard', 'products', 'categories', 'brands', 'orders', 'inventory', 'customers', 'marketing', 'content', 'finance', 'shipping', 'analytics', 'settings', 'roles', 'users'],
    product_manager: ['dashboard', 'products', 'categories', 'brands', 'inventory', 'marketing', 'content', 'analytics'],
    order_manager: ['dashboard', 'orders', 'shipping', 'inventory', 'analytics'],
    customer_support: ['dashboard', 'customers', 'orders', 'analytics'],
    operator: ['dashboard', 'orders', 'inventory', 'shipping']
  };

  const allowedTabs = roleAllowedTabs[currentAdmin?.role] || roleAllowedTabs.admin;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
    const urlTab = tabId === 'roles' ? 'users' : tabId;
    window.history.pushState({}, '', `/admin/${urlTab}`);
    if (onNavigateAdmin) onNavigateAdmin(urlTab);
    if (tabId === 'finance') setAnalyticsSubTab('financial');
    if (tabId === 'analytics') setAnalyticsSubTab('fulfillment');
    if (tabId === 'dashboard') setAnalyticsSubTab('dashboard');
  };

  // Analytics, Operations & Reporting state
  const [analyticsSubTab, setAnalyticsSubTab] = useState('dashboard'); // 'dashboard' | 'financial' | 'fulfillment'
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');
  const [analyticsStartDate, setAnalyticsStartDate] = useState('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState('');
  const [financialGatewayFilter, setFinancialGatewayFilter] = useState('all');
  const [financialStatusFilter, setFinancialStatusFilter] = useState('all');
  const [financialOrderFilter, setFinancialOrderFilter] = useState('all');
  const [financialExporting, setFinancialExporting] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [fulfillmentData, setFulfillmentData] = useState(null);

  // Orders table search & filter state
  const [orderSearchText, setOrderSearchText] = useState('');

  // Products state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchProductText, setSearchProductText] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Add Product form state
  const [newProductName, setNewProductName] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState('');
  const [newProductBrandId, setNewProductBrandId] = useState('');
  const [newProductBasePrice, setNewProductBasePrice] = useState(100);
  const [newProductSalePrice, setNewProductSalePrice] = useState('');
  const [newProductCostPrice, setNewProductCostPrice] = useState(70);
  const [newProductStock, setNewProductStock] = useState(50);
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');

  // Variant Matrix Generator state
  const [matrixBaseSku, setMatrixBaseSku] = useState('SUS-RICE');
  const [matrixAttr1Key, setMatrixAttr1Key] = useState('Weight');
  const [matrixAttr1Values, setMatrixAttr1Values] = useState('1kg, 2kg, 5kg');
  const [matrixAttr2Key, setMatrixAttr2Key] = useState('Grade');
  const [matrixAttr2Values, setMatrixAttr2Values] = useState('Standard, Premium');
  const [generatedMatrix, setGeneratedMatrix] = useState([]);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [orderFilterStatus, setOrderFilterStatus] = useState('');

  // Bulk Dispatch state
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [dispatchDocType, setDispatchDocType] = useState('invoice');
  const [generatedDocs, setGeneratedDocs] = useState(null);

  // RMA & Returns state
  const [rmaRequests, setRmaRequests] = useState([]);

  // Inventory state
  const [stockOverview, setStockOverview] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [adjProductId, setAdjProductId] = useState('');
  const [adjWarehouseId, setAdjWarehouseId] = useState(1);
  const [adjNewQty, setAdjNewQty] = useState(50);
  const [adjReason, setAdjReason] = useState('damage');
  const [adjNotes, setAdjNotes] = useState('');

  // Inventory Low Stock Threshold state
  const [globalThreshold, setGlobalThreshold] = useState(8);
  const [thresholdSaving, setThresholdSaving] = useState(false);

  // Category Management state
  const [categoriesList, setCategoriesList] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    parent_id: '',
    icon: 'shopping-bag',
    description: '',
    image_url: '',
    is_active: true
  });

  // Brand Management state
  const [brandsList, setBrandsList] = useState([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandFormData, setBrandFormData] = useState({
    name: '',
    slug: '',
    logo_url: '',
    description: ''
  });

  // CRM 360° Module state
  const [crmSubTab, setCrmSubTab] = useState('dashboard'); // 'dashboard' | 'directory' | 'tags' | 'exports' | 'deletions'
  const [crmDashboardData, setCrmDashboardData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [crmTotal, setCrmTotal] = useState(0);
  const [crmSearch, setCrmSearch] = useState('');
  const [crmTagFilter, setCrmTagFilter] = useState('All');
  const [crmStatusFilter, setCrmStatusFilter] = useState('All');
  const [crmSortBy, setCrmSortBy] = useState('created_at');
  const [crmSortOrder, setCrmSortOrder] = useState('desc');
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState(null);
  const [crmTags, setCrmTags] = useState([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('emerald');
  const [newTagDesc, setNewTagDesc] = useState('');
  const [tagAssignTarget, setTagAssignTarget] = useState(null); // customer object
  const [selectedTagToAssign, setSelectedTagToAssign] = useState('');
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [exportLogs, setExportLogs] = useState([]);
  const [deletionModalCustomer, setDeletionModalCustomer] = useState(null);
  const [deletionReason, setDeletionReason] = useState('');

  // Marketing & Promotions state
  const [coupons, setCoupons] = useState([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState('percentage');
  const [newCouponValue, setNewCouponValue] = useState(10);
  const [newCouponMinSpend, setNewCouponMinSpend] = useState(300);

  // Content & Hero Banners state
  const [contentSubTab, setContentSubTab] = useState('banners'); // 'banners' | 'dam'
  const [banners, setBanners] = useState([]);
  const [viewingBanner, setViewingBanner] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);
  const [deleteConfirmBanner, setDeleteConfirmBanner] = useState(null);
  const [showNewBannerModal, setShowNewBannerModal] = useState(false);
  const [bannerUploadLoading, setBannerUploadLoading] = useState(false);
  const [bannerFormError, setBannerFormError] = useState('');

  const emptyBannerForm = {
    name: '',
    title: '',
    subtitle: '',
    button_text: 'Shop Now',
    image_url: '',
    link_url: '/products',
    start_date: '',
    end_date: '',
    is_active: true,
    display_order: 1,
    position: 'hero_slider'
  };
  const [bannerFormData, setBannerFormData] = useState(emptyBannerForm);

  // Content & Media state
  const [mediaAssets, setMediaAssets] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Bulk Import state
  const [importRowsJson, setImportRowsJson] = useState(`[
  {"sku": "SUS-HONEY-01", "name": "Pure Sundarban Wild Honey 500g", "base_price": 550, "cost_price": 380, "stock_quantity": 40},
  {"sku": "SU-APP-001", "name": "Collision Test Apple", "base_price": 300, "cost_price": 200, "stock_quantity": 10}
]`);
  const [validationResult, setValidationResult] = useState(null);

  // General Settings state
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'SuShop Supershop',
    store_tagline: 'Fresh Groceries & Everyday Essentials Delivered in Minutes',
    logo_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120',
    support_phone: '+880 9610-SUSHOP',
    support_email: 'support@sushop.com',
    business_address: 'House 45, Road 11, Block H, Banani, Dhaka-1213',
    trade_license: 'TRAD/DSCC/019284/2026',
    currency_symbol: '৳',
    currency_code: 'BDT',
    timezone: 'Asia/Dhaka',
    tax_rate_percentage: 5.0,
    tax_display_mode: 'included',
    free_shipping_threshold: 1000.0,
    standard_shipping_charge: 60.0,
    express_shipping_charge: 120.0,
    express_delivery_eta: '60 - 120 Mins',
    standard_delivery_eta: 'Same Day (Within 6 Hours)',
    return_window_days: 7,
    restock_on_refund: true,
    store_status: 'open',
    maintenance_notice: 'We are briefly updating our catalog. We will be back online shortly!',
    low_stock_threshold: 10
  });
  const [settingsSavedMessage, setSettingsSavedMessage] = useState('');

  // Users, Roles & Security Audit state
  const [systemUsers, setSystemUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [securityAuditLogs, setSecurityAuditLogs] = useState([]);
  const [usersSubTab, setUsersSubTab] = useState('admins'); // 'admins' | 'audit' | 'all'
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', password: '', role: 'product_manager', phone: '' });

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadAnalyticsData = (
    period = analyticsPeriod,
    sDate = analyticsStartDate,
    eDate = analyticsEndDate,
    gateway = financialGatewayFilter,
    fStatus = financialStatusFilter,
    oStatus = financialOrderFilter
  ) => {
    setAnalyticsLoading(true);
    const params = { period };
    if (period === 'custom') {
      if (sDate) params.start_date = sDate;
      if (eDate) params.end_date = eDate;
    }

    const finParams = { ...params };
    if (gateway && gateway !== 'all') finParams.payment_gateway = gateway;
    if (fStatus && fStatus !== 'all') finParams.payment_status = fStatus;
    if (oStatus && oStatus !== 'all') finParams.order_status = oStatus;

    Promise.all([
      api.getExecutiveDashboard(params).then(setDashboardData).catch(() => {}),
      api.getFinancialReports(finParams).then(setFinancialData).catch(() => {}),
      api.getFulfillmentMetrics(params).then(setFulfillmentData).catch(() => {})
    ]).finally(() => {
      setAnalyticsLoading(false);
    });
  };

  const handleExportFinancialCsv = async () => {
    setFinancialExporting(true);
    try {
      const params = { period: analyticsPeriod };
      if (analyticsPeriod === 'custom') {
        if (analyticsStartDate) params.start_date = analyticsStartDate;
        if (analyticsEndDate) params.end_date = analyticsEndDate;
      }
      const res = await api.exportFinancialReportsCsv(params);
      const blob = new Blob([res], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sushop_financial_report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (err) {
      alert('Failed to export financial report: ' + err.message);
    } finally {
      setFinancialExporting(false);
    }
  };

  const loadTabData = (tab) => {
    if (tab === 'dashboard' || tab === 'analytics' || tab === 'finance') {
      loadAnalyticsData();
    } else if (tab === 'products') {
      api.getProducts({ limit: 100 }).then(res => setProducts(res.items || [])).catch(() => {});
      api.getCategories(true).then(setCategories).catch(() => {});
      api.getBrands().then(setBrands).catch(() => {});
    } else if (tab === 'categories') {
      api.getCategories(true).then(setCategoriesList).catch(() => {});
    } else if (tab === 'brands') {
      api.getBrands().then(setBrandsList).catch(() => {});
    } else if (tab === 'orders') {
      api.getOrders().then(res => setOrders(res.items || [])).catch(() => {});
      api.getRMARequests().then(setRmaRequests).catch(() => {});
    } else if (tab === 'inventory') {
      api.getStockOverview().then(setStockOverview).catch(() => {});
      api.getAuditLogs().then(setAuditLogs).catch(() => {});
      api.getWarehouses().then(setWarehouses).catch(() => {});
      api.getProducts({ limit: 100 }).then(res => setProducts(res.items || [])).catch(() => {});
      api.getGeneralSettings().then(s => {
        if (s && s.low_stock_threshold) setGlobalThreshold(s.low_stock_threshold);
      }).catch(() => {});
    } else if (tab === 'customers') {
      api.getCrmDashboard().then(setCrmDashboardData).catch(() => {});
      loadCrmCustomers();
      api.getCustomerTags().then(setCrmTags).catch(() => {});
      api.getDeletionRequests().then(setDeletionRequests).catch(() => {});
      api.getExportLogs().then(setExportLogs).catch(() => {});
    } else if (tab === 'marketing') {
      api.getCoupons().then(setCoupons).catch(() => {});
      api.getBanners().then(setBanners).catch(() => {});
    } else if (tab === 'content') {
      api.getBanners().then(setBanners).catch(() => {});
      api.getMedia().then(setMediaAssets).catch(() => {});
    } else if (tab === 'settings') {
      api.getGeneralSettings().then(res => {
        setStoreSettings(res || {});
        if (res && res.low_stock_threshold) setGlobalThreshold(res.low_stock_threshold);
      }).catch(() => {});
    } else if (tab === 'roles' || tab === 'users') {
      api.getSystemUsers().then(setSystemUsers).catch(() => {});
      api.getAdminUsers().then(setAdminUsers).catch(() => {});
      api.getAuditLogs().then(setSecurityAuditLogs).catch(() => {});
    }
  };

  const loadCrmCustomers = (search = crmSearch, tag = crmTagFilter, status = crmStatusFilter, sortBy = crmSortBy, sortOrder = crmSortOrder) => {
    const params = {
      search,
      tag: tag !== 'All' ? tag : '',
      status: status !== 'All' ? status.toLowerCase() : '',
      sort_by: sortBy,
      sort_order: sortOrder
    };
    api.getCustomers(params).then(res => {
      setCustomers(res.items || []);
      setCrmTotal(res.total || 0);
    }).catch(() => {});
  };

  // Category CRUD Handlers
  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryFormData({
        name: cat.name || '',
        slug: cat.slug || '',
        parent_id: cat.parent_id || '',
        icon: cat.icon || 'shopping-bag',
        description: cat.description || '',
        image_url: cat.image_url || '',
        is_active: cat.is_active !== undefined ? cat.is_active : true
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        slug: '',
        parent_id: '',
        icon: 'shopping-bag',
        description: '',
        image_url: '',
        is_active: true
      });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const slug = categoryFormData.slug.trim() || categoryFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        name: categoryFormData.name.trim(),
        slug: slug,
        parent_id: categoryFormData.parent_id ? parseInt(categoryFormData.parent_id) : null,
        icon: categoryFormData.icon || 'shopping-bag',
        description: categoryFormData.description,
        image_url: categoryFormData.image_url,
        is_active: Boolean(categoryFormData.is_active)
      };

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload);
        alert('Category updated successfully!');
      } else {
        await api.createCategory(payload);
        alert('Category created successfully!');
      }
      setShowCategoryModal(false);
      loadTabData('categories');
      api.getCategories(true).then(setCategories).catch(() => {});
    } catch (err) {
      alert('Error saving category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"? Any assigned products will be safely reassigned.`)) {
      try {
        await api.deleteCategory(id);
        alert(`Category "${name}" deleted.`);
        loadTabData('categories');
        api.getCategories(true).then(setCategories).catch(() => {});
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Brand CRUD Handlers
  const handleOpenBrandModal = (b = null) => {
    if (b) {
      setEditingBrand(b);
      setBrandFormData({
        name: b.name || '',
        slug: b.slug || '',
        logo_url: b.logo_url || '',
        description: b.description || ''
      });
    } else {
      setEditingBrand(null);
      setBrandFormData({
        name: '',
        slug: '',
        logo_url: '',
        description: ''
      });
    }
    setShowBrandModal(true);
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    try {
      const slug = brandFormData.slug.trim() || brandFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        name: brandFormData.name.trim(),
        slug: slug,
        logo_url: brandFormData.logo_url,
        description: brandFormData.description
      };
      if (editingBrand) {
        await api.updateBrand(editingBrand.id, payload);
        alert('Brand updated successfully!');
      } else {
        await api.createBrand(payload);
        alert('Brand created successfully!');
      }
      setShowBrandModal(false);
      loadTabData('brands');
      api.getBrands().then(setBrands).catch(() => {});
    } catch (err) {
      alert('Error saving brand: ' + err.message);
    }
  };

  const handleDeleteBrand = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete brand "${name}"?`)) {
      try {
        await api.deleteBrand(id);
        alert(`Brand "${name}" deleted.`);
        loadTabData('brands');
        api.getBrands().then(setBrands).catch(() => {});
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Low Stock Safety Threshold Handlers
  const handleSaveGlobalThreshold = async (newVal) => {
    setThresholdSaving(true);
    try {
      const res = await api.updateGlobalStockThreshold(newVal, true);
      alert(res.message);
      setGlobalThreshold(newVal);
      loadTabData('inventory');
    } catch (err) {
      alert('Failed to update threshold: ' + err.message);
    } finally {
      setThresholdSaving(false);
    }
  };

  // CRM Handlers
  const handleOpen360Profile = async (userId) => {
    try {
      const prof = await api.getCustomerProfile(userId);
      setSelectedCustomerProfile(prof);
    } catch (err) {
      alert('Failed to load customer profile: ' + err.message);
    }
  };

  const handleRunAutoSegment = async () => {
    try {
      const res = await api.runAutoSegmentation();
      alert(`Auto-segmentation executed successfully! ${res.tags_assigned} tag(s) assigned.`);
      loadTabData('customers');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportCustomersCsv = async () => {
    try {
      const res = await api.exportCustomersCsv(crmTagFilter);
      const blob = new Blob([res], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sushop_customers_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      api.getExportLogs().then(setExportLogs).catch(() => {});
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  const handleCreateCustomerTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await api.createCustomerTag({
        name: newTagName.trim(),
        color: newTagColor,
        description: newTagDesc
      });
      setShowTagModal(false);
      setNewTagName('');
      setNewTagDesc('');
      api.getCustomerTags().then(setCrmTags).catch(() => {});
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCustomerTag = async (tagId, tagName) => {
    if (window.confirm(`Delete tag "${tagName}"? All assignments of this tag will be removed.`)) {
      try {
        await api.deleteCustomerTag(tagId);
        api.getCustomerTags().then(setCrmTags).catch(() => {});
        loadCrmCustomers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleAssignTag = async (e) => {
    e.preventDefault();
    if (!tagAssignTarget || !selectedTagToAssign) return;
    try {
      await api.assignCustomerTag(tagAssignTarget.id, selectedTagToAssign);
      setTagAssignTarget(null);
      setSelectedTagToAssign('');
      loadCrmCustomers();
      if (selectedCustomerProfile && selectedCustomerProfile.customer.id === tagAssignTarget.id) {
        handleOpen360Profile(tagAssignTarget.id);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveTag = async (userId, tagName) => {
    if (window.confirm(`Remove tag "${tagName}" from this customer?`)) {
      try {
        await api.removeCustomerTag(userId, tagName);
        loadCrmCustomers();
        if (selectedCustomerProfile && selectedCustomerProfile.customer.id === userId) {
          handleOpen360Profile(userId);
        }
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleRequestDeletion = async (e) => {
    e.preventDefault();
    if (!deletionModalCustomer) return;
    try {
      await api.createDeletionRequest(deletionModalCustomer.id, deletionReason);
      alert('Account deletion request logged for admin review.');
      setDeletionModalCustomer(null);
      setDeletionReason('');
      api.getDeletionRequests().then(setDeletionRequests).catch(() => {});
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProcessDeletion = async (reqId, action) => {
    const promptMsg = action === 'approve' 
      ? "Approve deletion? The customer will be anonymized and deactivated. Financial order records will be preserved."
      : "Reject this deletion request?";
    if (window.confirm(promptMsg)) {
      try {
        const res = await api.processDeletionRequest(reqId, action);
        alert(res.message);
        api.getDeletionRequests().then(setDeletionRequests).catch(() => {});
        loadCrmCustomers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleGenerateMatrix = async () => {
    const payload = {
      base_sku: matrixBaseSku,
      attributes: {
        [matrixAttr1Key.trim()]: matrixAttr1Values.split(',').map(s => s.trim()),
        [matrixAttr2Key.trim()]: matrixAttr2Values.split(',').map(s => s.trim())
      }
    };
    try {
      const res = await api.generateVariantMatrix(payload);
      setGeneratedMatrix(res.variants || []);
    } catch (err) {
      alert('Error generating matrix: ' + err.message);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.createProduct({
        name: newProductName,
        slug: newProductName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`,
        sku: newProductSku,
        base_price: parseFloat(newProductBasePrice),
        sale_price: newProductSalePrice ? parseFloat(newProductSalePrice) : null,
        cost_price: parseFloat(newProductCostPrice),
        stock_quantity: parseInt(newProductStock),
        category_id: parseInt(newProductCategoryId || categories[0]?.id || 1),
        brand_id: parseInt(newProductBrandId || brands[0]?.id || 1),
        short_description: newProductDescription,
        images: newProductImageUrl ? [newProductImageUrl] : []
      });
      setShowProductModal(false);
      setNewProductName('');
      setNewProductSku('');
      setNewProductSalePrice('');
      setNewProductDescription('');
      setNewProductImageUrl('');
      loadTabData('products');
      alert('Product created successfully!');
    } catch (err) {
      alert('Failed to create product: ' + err.message);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await api.updateProduct(editingProduct.id, {
        name: editingProduct.name,
        sku: editingProduct.sku,
        base_price: parseFloat(editingProduct.base_price),
        sale_price: editingProduct.sale_price !== '' && editingProduct.sale_price !== null ? parseFloat(editingProduct.sale_price) : null,
        cost_price: parseFloat(editingProduct.cost_price || 0),
        stock_quantity: parseInt(editingProduct.stock_quantity),
        short_description: editingProduct.short_description || '',
        category_id: parseInt(editingProduct.category_id || categories[0]?.id || 1),
        brand_id: parseInt(editingProduct.brand_id || brands[0]?.id || 1)
      });
      setEditingProduct(null);
      loadTabData('products');
      alert('Product updated successfully!');
    } catch (err) {
      alert('Failed to update product: ' + err.message);
    }
  };

  const handleTransitionStatus = async (orderNum, newStatus) => {
    try {
      await api.transitionOrderStatus(orderNum, newStatus, `Transitioned to ${newStatus} in admin`);
      loadTabData('orders');
      if (selectedOrderDetails) {
        const updated = await api.getOrder(orderNum);
        setSelectedOrderDetails(updated);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateStockAdjustment = async (e) => {
    e.preventDefault();
    if (!adjProductId) {
      alert('Please select a Product from the dropdown.');
      return;
    }
    try {
      await api.createStockAdjustment({
        warehouse_id: parseInt(adjWarehouseId),
        product_id: parseInt(adjProductId),
        new_qty: parseInt(adjNewQty),
        reason_code: adjReason,
        notes: adjNotes || 'Manual inventory reconciliation'
      });
      alert('Stock adjustment logged successfully.');
      loadTabData('inventory');
      setAdjNotes('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTriggerRefund = async (rmaId) => {
    if (window.confirm("Trigger automated refund via original payment channel and restock inventory?")) {
      try {
        const res = await api.triggerRefund(rmaId, { restock_inventory: true });
        alert(res.message);
        loadTabData('orders');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleValidateImport = async () => {
    try {
      const rows = JSON.parse(importRowsJson);
      const res = await api.validateCatalogImport(rows);
      setValidationResult(res);
    } catch (err) {
      alert('Invalid JSON syntax in rows: ' + err.message);
    }
  };

  const handleCommitImport = async () => {
    try {
      const rows = JSON.parse(importRowsJson);
      const res = await api.commitCatalogImport(rows);
      alert(res.message);
      setValidationResult(null);
      loadTabData('products');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkDispatch = async () => {
    if (selectedOrderIds.length === 0) {
      alert('Please check at least one order to generate dispatch documents.');
      return;
    }
    try {
      const res = await api.generateBulkDispatch(selectedOrderIds, dispatchDocType);
      setGeneratedDocs(res);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('alt_text', file.name.split('.')[0]);
      await api.uploadMedia(fd);
      loadTabData('content');
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.createCoupon({
        code: newCouponCode,
        discount_type: newCouponType,
        discount_value: parseFloat(newCouponValue),
        min_spend: parseFloat(newCouponMinSpend)
      });
      setNewCouponCode('');
      loadTabData('marketing');
      alert('Coupon activated successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await api.deleteCoupon(couponId);
        loadTabData('marketing');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const toDatetimeLocal = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const formatDisplayDate = (isoStr) => {
    if (!isoStr) return 'Always Visible';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return 'Always Visible';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Always Visible';
    }
  };

  const handleBannerFileUpload = async (file, isEdit = false) => {
    if (!file) return;
    setBannerFormError('');

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(file.type) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      setBannerFormError('Invalid file format. Only JPG, JPEG, PNG, and WebP are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setBannerFormError('File size exceeds the 5MB limit. Please upload an image under 5MB.');
      return;
    }

    setBannerUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.uploadBannerImage(fd);
      if (isEdit) {
        setEditingBanner((prev) => ({ ...prev, image_url: res.image_url }));
      } else {
        setBannerFormData((prev) => ({ ...prev, image_url: res.image_url }));
      }
    } catch (err) {
      setBannerFormError('Upload failed: ' + (err.message || 'Server error'));
    } finally {
      setBannerUploadLoading(false);
    }
  };

  const handleCreateBanner = async (e) => {
    e.preventDefault();
    setBannerFormError('');

    if (!bannerFormData.image_url || !bannerFormData.image_url.trim()) {
      setBannerFormError('A banner image is required. Please upload an image or provide an image URL.');
      return;
    }
    if (!bannerFormData.title || !bannerFormData.title.trim()) {
      setBannerFormError('Main Heading (title) is required.');
      return;
    }
    if (bannerFormData.start_date && bannerFormData.end_date) {
      if (new Date(bannerFormData.start_date) > new Date(bannerFormData.end_date)) {
        setBannerFormError('Start Date & Time cannot be after End Date & Time.');
        return;
      }
    }

    try {
      await api.createBanner({
        name: bannerFormData.name ? bannerFormData.name.trim() : bannerFormData.title.trim(),
        title: bannerFormData.title.trim(),
        subtitle: bannerFormData.subtitle ? bannerFormData.subtitle.trim() : '',
        button_text: bannerFormData.button_text ? bannerFormData.button_text.trim() : 'Shop Now',
        image_url: bannerFormData.image_url.trim(),
        link_url: bannerFormData.link_url ? bannerFormData.link_url.trim() : '/products',
        position: bannerFormData.position || 'hero_slider',
        start_date: bannerFormData.start_date ? new Date(bannerFormData.start_date).toISOString() : null,
        end_date: bannerFormData.end_date ? new Date(bannerFormData.end_date).toISOString() : null,
        is_active: Boolean(bannerFormData.is_active),
        display_order: parseInt(bannerFormData.display_order) || 0
      });
      setShowNewBannerModal(false);
      setBannerFormData(emptyBannerForm);
      api.getBanners().then(setBanners).catch(() => {});
    } catch (err) {
      setBannerFormError('Failed to create banner: ' + err.message);
    }
  };

  const handleUpdateBanner = async (e) => {
    e.preventDefault();
    if (!editingBanner) return;
    setBannerFormError('');

    if (!editingBanner.image_url || !editingBanner.image_url.trim()) {
      setBannerFormError('A banner image is required. Please upload an image or enter an image URL.');
      return;
    }
    if (!editingBanner.title || !editingBanner.title.trim()) {
      setBannerFormError('Main Heading (title) is required.');
      return;
    }
    if (editingBanner.start_date && editingBanner.end_date) {
      if (new Date(editingBanner.start_date) > new Date(editingBanner.end_date)) {
        setBannerFormError('Start Date & Time cannot be after End Date & Time.');
        return;
      }
    }

    try {
      await api.updateBanner(editingBanner.id, {
        name: editingBanner.name ? editingBanner.name.trim() : editingBanner.title.trim(),
        title: editingBanner.title.trim(),
        subtitle: editingBanner.subtitle ? editingBanner.subtitle.trim() : '',
        button_text: editingBanner.button_text ? editingBanner.button_text.trim() : 'Shop Now',
        image_url: editingBanner.image_url.trim(),
        link_url: editingBanner.link_url ? editingBanner.link_url.trim() : '/products',
        position: editingBanner.position || 'hero_slider',
        start_date: editingBanner.start_date ? new Date(editingBanner.start_date).toISOString() : null,
        end_date: editingBanner.end_date ? new Date(editingBanner.end_date).toISOString() : null,
        is_active: Boolean(editingBanner.is_active),
        display_order: parseInt(editingBanner.display_order) || 0
      });
      setEditingBanner(null);
      api.getBanners().then(setBanners).catch(() => {});
    } catch (err) {
      setBannerFormError('Failed to update banner: ' + err.message);
    }
  };

  const handleToggleBannerStatus = async (banner) => {
    try {
      await api.toggleBannerStatus(banner.id, !banner.is_active);
      api.getBanners().then(setBanners).catch(() => {});
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteBanner = async () => {
    if (!deleteConfirmBanner) return;
    try {
      await api.deleteBanner(deleteConfirmBanner.id);
      setDeleteConfirmBanner(null);
      api.getBanners().then(setBanners).catch(() => {});
    } catch (err) {
      alert('Failed to delete banner: ' + err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateGeneralSettings(storeSettings);
      setSettingsSavedMessage('Settings successfully saved to database!');
      setTimeout(() => setSettingsSavedMessage(''), 3500);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      alert(`User role updated to ${newRole}`);
      loadTabData('roles');
    } catch (err) {
      alert('Failed to update role: ' + err.message);
    }
  };

  const handleCreateAdminUser = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminUser(newAdminForm);
      setShowCreateAdminModal(false);
      setNewAdminForm({ name: '', email: '', password: '', role: 'product_manager', phone: '' });
      loadTabData('roles');
      alert('Administrator account successfully created.');
    } catch (err) {
      alert('Failed to create administrator: ' + err.message);
    }
  };

  const handleDeleteAdminUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete administrator '${name}'?`)) return;
    try {
      await api.deleteAdminUser(id);
      loadTabData('roles');
    } catch (err) {
      alert('Failed to delete administrator: ' + err.message);
    }
  };

  const filteredProducts = products.filter(p => {
    if (!searchProductText) return true;
    const q = searchProductText.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-800">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col shrink-0 border-r border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-950">
              S
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">SuShop Admin</h2>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Control Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-semibold">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1">Modules</p>
          
          {[
            { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
            { id: 'products', label: 'Product Catalog (PIM)', icon: Package },
            { id: 'categories', label: 'Category Management', icon: FolderTree },
            { id: 'brands', label: 'Brand Management', icon: Tags },
            { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingCart },
            { id: 'inventory', label: 'Inventory & Warehouses', icon: Warehouse },
            { id: 'customers', label: 'Customer CRM 360°', icon: Users },
            { id: 'marketing', label: 'Marketing & Coupons', icon: Sparkles },
            { id: 'content', label: 'Content Management', icon: FileText },
            { id: 'finance', label: 'Payment & Finance', icon: CreditCard },
            { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
            { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Store Configuration', icon: Settings },
            { id: 'roles', label: 'Users & Permissions', icon: ShieldCheck }
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id || (item.id === 'roles' && activeTab === 'users');
            const isPermitted = allowedTabs.includes(item.id) || (item.id === 'roles' && allowedTabs.includes('users'));
            if (!isPermitted) return null; // RBAC: hide modules user has no permission for
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  active ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 text-xs bg-slate-950/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Authenticated:</span>
            <span className="text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded">
              {currentAdmin?.role || 'Admin'}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <aside 
            className="w-72 max-w-[85vw] h-full bg-slate-900 text-slate-300 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-950">
                  S
                </div>
                <div>
                  <h2 className="text-sm font-black text-white tracking-tight">SuShop Admin</h2>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Control Panel</p>
                </div>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-semibold">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1">Modules</p>
              {[
                { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
                { id: 'products', label: 'Product Catalog (PIM)', icon: Package },
                { id: 'categories', label: 'Category Management', icon: FolderTree },
                { id: 'brands', label: 'Brand Management', icon: Tags },
                { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingCart },
                { id: 'inventory', label: 'Inventory & Warehouses', icon: Warehouse },
                { id: 'customers', label: 'Customer CRM 360°', icon: Users },
                { id: 'marketing', label: 'Marketing & Coupons', icon: Sparkles },
                { id: 'content', label: 'Content Management', icon: FileText },
                { id: 'finance', label: 'Payment & Finance', icon: CreditCard },
                { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
                { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
                { id: 'settings', label: 'Store Configuration', icon: Settings },
                { id: 'roles', label: 'Users & Permissions', icon: ShieldCheck }
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id || (item.id === 'roles' && activeTab === 'users');
                const isPermitted = allowedTabs.includes(item.id) || (item.id === 'roles' && allowedTabs.includes('users'));
                if (!isPermitted) return null;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                      active ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-800 text-xs bg-slate-950/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Authenticated:</span>
                <span className="text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded">
                  {currentAdmin?.role || 'Admin'}
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top workspace bar */}
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm sm:text-base font-black text-slate-900 capitalize tracking-tight truncate">
              {activeTab.replace('_', ' ')}
            </h1>
            {currentAdmin?.role === 'operator' && (
              <span className="bg-amber-100 text-amber-900 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                🔒 PII Masking
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 text-xs shrink-0">
            <span className="text-slate-500 font-medium hidden lg:inline">
              Signed in: <strong className="text-slate-800">{currentAdmin?.name || 'Administrator'}</strong>
            </span>

            {/* Back to Customer Storefront */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              title="Open customer storefront in a new tab"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Store</span>
            </a>

            {/* Direct Logout Button */}
            <button
              onClick={onLogout}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              title="Log out and return to Homepage"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        {/* Tab Contents */}
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 flex-1">
          {/* ================= 1. ANALYTICS, OPERATIONS & REPORTING ================= */}
          {(activeTab === 'dashboard' || activeTab === 'analytics' || activeTab === 'finance') && (
            <div className="space-y-6">
              {/* Header & Sub-section Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Analytics, Operations & Reporting</h2>
                  <p className="text-xs text-slate-500">Live sales performance, financial liabilities, conversion rates, and fulfillment metrics</p>
                </div>

                {/* Sub-Tabs: Executive Dashboard | Financial Reports | Fulfillment Metrics */}
                <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                  {[
                    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
                    { id: 'financial', label: 'Financial Reports', icon: CreditCard },
                    { id: 'fulfillment', label: 'Fulfillment Metrics', icon: Truck }
                  ].map((st) => {
                    const StIcon = st.icon;
                    return (
                      <button
                        key={st.id}
                        onClick={() => setAnalyticsSubTab(st.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          analyticsSubTab === st.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <StIcon className="w-3.5 h-3.5" />
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Master Date Range Filter Toolbar */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 font-bold uppercase text-[10px] mr-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Timeframe:
                  </span>
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: '7d', label: 'Last 7 Days' },
                    { id: '30d', label: 'Last 30 Days' },
                    { id: 'this_month', label: 'This Month' },
                    { id: 'last_month', label: 'Last Month' },
                    { id: 'custom', label: 'Custom Range' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setAnalyticsPeriod(p.id);
                        if (p.id !== 'custom') {
                          loadAnalyticsData(p.id);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                        analyticsPeriod === p.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {analyticsPeriod === 'custom' && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
                    <input
                      type="date"
                      value={analyticsStartDate}
                      onChange={(e) => setAnalyticsStartDate(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-bold text-xs"
                    />
                    <span className="text-slate-400 font-bold">to</span>
                    <input
                      type="date"
                      value={analyticsEndDate}
                      onChange={(e) => setAnalyticsEndDate(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-bold text-xs"
                    />
                    <button
                      onClick={() => loadAnalyticsData('custom', analyticsStartDate, analyticsEndDate)}
                      className="bg-slate-900 text-white font-bold px-3 py-1 rounded-lg cursor-pointer hover:bg-black transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* ================= SUBSECTION 1: EXECUTIVE DASHBOARD ================= */}
              {analyticsSubTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Executive Metrics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase flex items-center justify-between">
                        <span>Gross Revenue</span>
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </span>
                      <div className="text-2xl font-black text-slate-900">৳{dashboardData?.gross_revenue || 0}</div>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Sales before deductions (excl. cancelled)
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase flex items-center justify-between">
                        <span>Net Operating Revenue</span>
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </span>
                      <div className="text-2xl font-black text-emerald-700">৳{dashboardData?.net_revenue || 0}</div>
                      <span className="text-[10px] text-slate-500 font-medium block truncate">
                        After discounts (৳{dashboardData?.total_discounts || 0}) & refunds (৳{dashboardData?.refund_totals || 0})
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase flex items-center justify-between">
                        <span>Conversion Rate</span>
                        <Clock className="w-4 h-4 text-blue-600" />
                      </span>
                      {dashboardData?.visitor_tracking_active ? (
                        <>
                          <div className="text-2xl font-black text-blue-600">{dashboardData.conversion_rate_percentage}%</div>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            Based on {dashboardData.visitor_sessions_count} tracked visitor sessions
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="text-lg font-black text-slate-400 mt-1">Tracking Inactive</div>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            0 tracked visitor sessions for this period
                          </span>
                        </>
                      )}
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-semibold uppercase flex items-center justify-between">
                        <span>Total Orders</span>
                        <ShoppingCart className="w-4 h-4 text-indigo-600" />
                      </span>
                      <div className="text-2xl font-black text-slate-900">{dashboardData?.total_orders || 0}</div>
                      <span className="text-[10px] text-slate-500">Orders placed during timeframe</span>
                    </div>
                  </div>

                  {/* Revenue Trend Over Time (SVG Visualization) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-600" /> Revenue Trends Over Time
                        </h3>
                        <p className="text-[11px] text-slate-500">Daily trajectory of gross volume and net operating revenue</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Gross Revenue
                        </span>
                        <span className="flex items-center gap-1 text-blue-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Net Revenue
                        </span>
                      </div>
                    </div>

                    {/* SVG Chart Rendering */}
                    {dashboardData?.revenue_trends?.length > 0 ? (
                      <div className="w-full overflow-x-auto">
                        <div className="min-w-[600px] h-52">
                          {(() => {
                            const trends = dashboardData.revenue_trends;
                            const maxVal = Math.max(...trends.map(t => Math.max(t.gross, t.net)), 100);
                            const w = 600;
                            const h = 180;
                            const paddingLeft = 50;
                            const paddingRight = 20;
                            const paddingTop = 15;
                            const paddingBottom = 25;
                            const plotW = w - paddingLeft - paddingRight;
                            const plotH = h - paddingTop - paddingBottom;

                            const getX = (idx) => paddingLeft + (idx / Math.max(1, trends.length - 1)) * plotW;
                            const getY = (val) => paddingTop + plotH - (val / maxVal) * plotH;

                            const grossPoints = trends.map((t, i) => `${getX(i)},${getY(t.gross)}`).join(' ');
                            const netPoints = trends.map((t, i) => `${getX(i)},${getY(t.net)}`).join(' ');

                            return (
                              <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
                                {/* Grid Lines */}
                                {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                                  const y = paddingTop + plotH * (1 - pct);
                                  return (
                                    <g key={idx}>
                                      <line x1={paddingLeft} y1={y} x2={w - paddingRight} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                                      <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                                        ৳{Math.round(maxVal * pct)}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Net Revenue Path */}
                                <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" points={netPoints} strokeLinecap="round" strokeLinejoin="round" />

                                {/* Gross Revenue Path */}
                                <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={grossPoints} strokeLinecap="round" strokeLinejoin="round" />

                                {/* Data circles & tooltips */}
                                {trends.map((t, i) => (
                                  <g key={i}>
                                    <circle cx={getX(i)} cy={getY(t.gross)} r="3.5" fill="#10b981" className="hover:r-5 transition-all cursor-pointer">
                                      <title>{`${t.label} - Gross: ৳${t.gross}, Net: ৳${t.net} (${t.orders} orders)`}</title>
                                    </circle>
                                    <circle cx={getX(i)} cy={getY(t.net)} r="3" fill="#3b82f6" className="hover:r-4 transition-all cursor-pointer">
                                      <title>{`${t.label} - Net: ৳${t.net}`}</title>
                                    </circle>
                                    {/* X-axis labels (render every few steps) */}
                                    {(i === 0 || i === Math.floor(trends.length / 2) || i === trends.length - 1) && (
                                      <text x={getX(i)} y={h - 6} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">
                                        {t.label}
                                      </text>
                                    )}
                                  </g>
                                ))}
                              </svg>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="h-44 flex items-center justify-center text-slate-400 text-xs italic">
                        No revenue recorded for this date period.
                      </div>
                    )}
                  </div>

                  {/* Orders by Status & Top 10 Bestselling SKUs */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Orders by State Machine */}
                    <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Orders by Status</h3>
                        <p className="text-[11px] text-slate-500">Click any status to inspect matching orders</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { id: 'pending', label: 'Pending', color: 'amber' },
                          { id: 'payment_confirmed', label: 'Paid / Confirmed', color: 'blue' },
                          { id: 'processing_picking', label: 'Processing', color: 'purple' },
                          { id: 'packed', label: 'Packed', color: 'indigo' },
                          { id: 'shipped', label: 'Shipped', color: 'sky' },
                          { id: 'delivered', label: 'Delivered', color: 'emerald' },
                          { id: 'cancelled', label: 'Cancelled', color: 'rose' },
                          { id: 'returned', label: 'Returned', color: 'orange' }
                        ].map((st) => {
                          const count = dashboardData?.orders_by_status?.[st.id] || 0;
                          return (
                            <button
                              key={st.id}
                              onClick={() => {
                                setOrderFilterStatus(st.id);
                                setActiveTab('orders');
                              }}
                              className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-100 rounded-xl text-left transition-colors cursor-pointer group"
                              title={`View ${st.label} orders`}
                            >
                              <span className="text-[10px] text-slate-500 group-hover:text-emerald-700 uppercase font-bold block truncate">
                                {st.label}
                              </span>
                              <span className="text-lg font-black text-slate-800 group-hover:text-emerald-900">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top 10 Bestselling SKUs */}
                    <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Top 10 Bestselling SKUs</h3>
                        <p className="text-[11px] text-slate-500">Ranked by actual fulfilled units sold in selected period</p>
                      </div>

                      <div className="divide-y divide-slate-100 text-xs overflow-y-auto max-h-80 pr-1">
                        {dashboardData?.top_10_bestselling_skus?.map((sku, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 text-center font-bold text-slate-400 text-xs">#{idx + 1}</span>
                              <img
                                src={sku.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80"}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">{sku.name}</p>
                                <span className="text-[10px] text-slate-400 font-mono">SKU: {sku.sku}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-slate-900">{sku.units_sold} sold</p>
                              <span className="text-[10px] text-emerald-700 font-bold">৳{sku.revenue}</span>
                            </div>
                          </div>
                        ))}
                        {(!dashboardData?.top_10_bestselling_skus || dashboardData.top_10_bestselling_skus.length === 0) && (
                          <p className="text-slate-400 italic py-6 text-center">No product sales recorded for this timeframe.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SUBSECTION 2: FINANCIAL REPORTS ================= */}
              {analyticsSubTab === 'financial' && (
                <div className="space-y-6">
                  {/* Financial Filter Toolbar */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      {/* Payment Gateway Filter */}
                      <select
                        value={financialGatewayFilter}
                        onChange={(e) => {
                          setFinancialGatewayFilter(e.target.value);
                          loadAnalyticsData(analyticsPeriod, analyticsStartDate, analyticsEndDate, e.target.value, financialStatusFilter, financialOrderFilter);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs"
                      >
                        <option value="all">All Payment Gateways</option>
                        <option value="bkash">bKash Mobile Wallet</option>
                        <option value="nagad">Nagad Digital Wallet</option>
                        <option value="card">Cards (SSLCommerz)</option>
                        <option value="cod">Cash on Delivery (COD)</option>
                        <option value="bnpl">Buy Now Pay Later</option>
                      </select>

                      {/* Payment Status Filter */}
                      <select
                        value={financialStatusFilter}
                        onChange={(e) => {
                          setFinancialStatusFilter(e.target.value);
                          loadAnalyticsData(analyticsPeriod, analyticsStartDate, analyticsEndDate, financialGatewayFilter, e.target.value, financialOrderFilter);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs"
                      >
                        <option value="all">All Payment Statuses</option>
                        <option value="paid">Paid Only</option>
                        <option value="pending">Pending Payment</option>
                        <option value="refunded">Refunded Only</option>
                      </select>

                      {/* Order Status Filter */}
                      <select
                        value={financialOrderFilter}
                        onChange={(e) => {
                          setFinancialOrderFilter(e.target.value);
                          loadAnalyticsData(analyticsPeriod, analyticsStartDate, analyticsEndDate, financialGatewayFilter, financialStatusFilter, e.target.value);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs"
                      >
                        <option value="all">All Order Statuses</option>
                        <option value="delivered">Delivered Only</option>
                        <option value="shipped">Shipped Only</option>
                        <option value="returned">Returned Only</option>
                      </select>
                    </div>

                    <button
                      onClick={handleExportFinancialCsv}
                      disabled={financialExporting}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{financialExporting ? 'Exporting CSV...' : 'Export Financial CSV'}</span>
                    </button>
                  </div>

                  {/* 4 Financial Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-bold uppercase">Sales Tax Liabilities</span>
                      <div className="text-2xl font-black text-slate-900">৳{financialData?.tax_liabilities?.tax_liabilities || 0}</div>
                      <span className="text-[10px] text-slate-400">
                        Collected: ৳{financialData?.tax_liabilities?.total_tax_collected || 0} • Refunded: ৳{financialData?.tax_liabilities?.tax_refunded || 0}
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-bold uppercase">Gateway Fee Deductions</span>
                      <div className="text-2xl font-black text-rose-600">৳{financialData?.payment_gateway_fees?.total_gateway_fees || 0}</div>
                      <span className="text-[10px] text-slate-400">
                        Net Settled: ৳{financialData?.payment_gateway_fees?.total_net_settlement || 0}
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-bold uppercase">Cost of Goods Sold (COGS)</span>
                      <div className="text-2xl font-black text-slate-900">৳{financialData?.cogs_and_margins?.total_cogs || 0}</div>
                      {financialData?.cogs_and_margins?.items_missing_cost_count > 0 ? (
                        <span className="text-[10px] text-amber-600 font-bold">
                          ⚠ {financialData.cogs_and_margins.items_missing_cost_count} item(s) missing cost
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold">✓ Complete item cost data</span>
                      )}
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-bold uppercase">Gross Margin %</span>
                      <div className="text-2xl font-black text-blue-600">
                        {financialData?.cogs_and_margins?.gross_profit_margin_percentage || 0}%
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Gross Profit: ৳{financialData?.cogs_and_margins?.gross_profit || 0}
                      </span>
                    </div>
                  </div>

                  {/* Payment Gateway Fee Deductions Breakdown */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Payment Gateway Processing Fee Breakdown
                      </h3>
                      <p className="text-[11px] text-slate-500">Configured gateway fee schedules and net settlement reconciliation</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {financialData?.payment_gateway_fees?.gateway_summaries?.map((gw) => (
                        <div key={gw.key} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                          <span className="font-bold text-slate-900 block truncate">{gw.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">Fee: {gw.rate_percent}%</span>
                          <p className="font-black text-slate-900 text-sm">৳{gw.gross_volume}</p>
                          <span className="text-[10px] text-rose-600 font-bold block">Fee: -৳{gw.total_fees}</span>
                        </div>
                      ))}
                    </div>

                    {/* Gateway Transaction Ledger Table */}
                    <div className="overflow-x-auto max-h-60 border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="p-2.5">Order Number</th>
                            <th className="p-2.5">Gateway</th>
                            <th className="p-2.5">Transaction ID</th>
                            <th className="p-2.5">Gross Amount</th>
                            <th className="p-2.5">Gateway Fee</th>
                            <th className="p-2.5">Net Settlement</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {financialData?.payment_gateway_fees?.recent_transactions?.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold font-sans text-slate-900">{tx.order_number}</td>
                              <td className="p-2.5 font-sans">{tx.gateway_name}</td>
                              <td className="p-2.5 text-slate-500">{tx.transaction_id}</td>
                              <td className="p-2.5 font-black text-slate-900">৳{tx.amount}</td>
                              <td className="p-2.5 text-rose-600 font-bold">-৳{tx.gateway_fee}</td>
                              <td className="p-2.5 text-emerald-700 font-bold">৳{tx.net_settlement}</td>
                              <td className="p-2.5 font-sans">
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700">
                                  {tx.payment_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Refund Totals & Audit Breakdown */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Refund Ledger & RMA Settlement Totals
                        </h3>
                        <p className="text-[11px] text-slate-500">Processed returns, pending approvals, and original channel refunds</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-full font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          Total Refunds: ৳{financialData?.refund_totals?.total_refund_amount || 0}
                        </span>
                        <span className="px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Pending: {financialData?.refund_totals?.pending_refunds_count || 0}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-60 border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="p-2.5">Order #</th>
                            <th className="p-2.5">Customer</th>
                            <th className="p-2.5">Payment Method</th>
                            <th className="p-2.5">Refund Amount</th>
                            <th className="p-2.5">Reason</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {financialData?.refund_totals?.refund_records?.map((rf, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono font-bold text-slate-900">{rf.order_number}</td>
                              <td className="p-2.5 font-bold text-slate-800">{rf.customer_name}</td>
                              <td className="p-2.5 uppercase font-mono text-[11px]">{rf.payment_method}</td>
                              <td className="p-2.5 font-black text-rose-700">৳{rf.refund_amount}</td>
                              <td className="p-2.5 text-slate-600 max-w-xs truncate">{rf.reason}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${rf.return_status === 'refund_issued' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {rf.return_status}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-400 font-mono text-[11px]">{rf.date}</td>
                            </tr>
                          ))}
                          {(!financialData?.refund_totals?.refund_records || financialData.refund_totals.refund_records.length === 0) && (
                            <tr>
                              <td colSpan={7} className="text-center py-6 text-slate-400 italic">No refund records for this period.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SUBSECTION 3: FULFILLMENT METRICS ================= */}
              {analyticsSubTab === 'fulfillment' && (
                <div className="space-y-6">
                  {/* Fulfillment Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-bold uppercase flex items-center justify-between">
                        <span>Average Fulfillment Turnaround</span>
                        <Clock className="w-4 h-4 text-emerald-600" />
                      </span>
                      <div className="text-3xl font-black text-slate-900">
                        {fulfillmentData?.average_fulfillment_time_display || '2h 24m'}
                      </div>
                      <p className="text-xs text-emerald-600 font-semibold mt-1">
                        Across {fulfillmentData?.total_fulfilled_orders || 0} completed deliveries
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-bold uppercase flex items-center justify-between">
                        <span>Delivery Delay Warnings</span>
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </span>
                      <div className={`text-3xl font-black ${fulfillmentData?.delayed_orders_count > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {fulfillmentData?.delayed_orders_count || 0} Overdue
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Exceeding standard 48-hour delivery SLA</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 font-bold uppercase flex items-center justify-between">
                        <span>Monitored Categories</span>
                        <FolderTree className="w-4 h-4 text-blue-600" />
                      </span>
                      <div className="text-3xl font-black text-slate-900">
                        {fulfillmentData?.category_return_rates?.length || 0}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Tracking units sold vs units returned</p>
                    </div>
                  </div>

                  {/* Overdue Delivery Delay Warnings Table */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Delivery Delay Warnings (Orders Exceeding 48h SLA)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Orders marked Delivered or Cancelled automatically clear from this list.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-72 border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="p-3">Order Number</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Courier</th>
                            <th className="p-3">Order Placed</th>
                            <th className="p-3">Expected SLA</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Delayed By</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {fulfillmentData?.delivery_delay_warnings?.map((dw) => (
                            <tr key={dw.order_id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-slate-900">{dw.order_number}</td>
                              <td className="p-3">
                                <p className="font-bold text-slate-900">{dw.customer_name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{dw.customer_phone}</p>
                              </td>
                              <td className="p-3 text-slate-600 font-medium">{dw.courier_name}</td>
                              <td className="p-3 text-slate-500 font-mono text-[11px]">{dw.placed_at}</td>
                              <td className="p-3 text-slate-500 font-mono text-[11px]">{dw.expected_delivery}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                  {dw.current_status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${dw.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                                  +{dw.days_delayed} Days ({dw.severity})
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={async () => {
                                    const details = await api.getOrder(dw.order_number);
                                    setSelectedOrderDetails(details);
                                  }}
                                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer"
                                >
                                  Inspect Order
                                </button>
                              </td>
                            </tr>
                          ))}
                          {(!fulfillmentData?.delivery_delay_warnings || fulfillmentData.delivery_delay_warnings.length === 0) && (
                            <tr>
                              <td colSpan={8} className="text-center py-6 text-emerald-700 bg-emerald-50/50 font-semibold">
                                ✓ No delivery delay warnings. All active orders are within the 48-hour delivery timeline!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Return Rate Breakdown by Product Category */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Return Rate Breakdown by Product Category
                      </h3>
                      <p className="text-[11px] text-slate-500">Formula: (Returned Units / Sold Units) × 100</p>
                    </div>

                    <div className="space-y-3">
                      {fulfillmentData?.category_return_rates?.map((cr) => (
                        <div key={cr.category_id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-slate-900">{cr.category_name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cr.return_rate_percentage > 5 ? 'bg-rose-100 text-rose-800' : cr.return_rate_percentage > 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              Return Rate: {cr.return_rate_percentage}%
                            </span>
                          </div>
                          {/* Visual progress bar */}
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${cr.return_rate_percentage > 5 ? 'bg-rose-500' : cr.return_rate_percentage > 2 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, Math.max(cr.return_rate_percentage * 5, 2))}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                            <span>Sold: <strong>{cr.units_sold} units</strong></span>
                            <span>Returned: <strong>{cr.units_returned} units</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 2. PRODUCT MANAGEMENT (PIM) ================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Product Information Management (PIM)</h2>
                  <p className="text-xs text-slate-500">Add, edit, delete products, generate variant combos, and validate CSV imports</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                  <button
                    onClick={async () => {
                      const res = await api.exportCatalogCsv();
                      const blob = new Blob([res.csv_content], { type: 'text/csv' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = res.filename;
                      a.click();
                    }}
                    className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>

              {/* Products Catalog Table with Live Search Filter */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search catalog by name or SKU..."
                      value={searchProductText}
                      onChange={(e) => setSearchProductText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-emerald-600"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    Showing {filteredProducts.length} of {products.length} products
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <tr>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Base Price</th>
                        <th className="p-3">Sale Price</th>
                        <th className="p-3">COGS</th>
                        <th className="p-3">Stock Quantity</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                            <img src={p.thumbnail || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80"} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100" />
                            <span>{p.name}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-600 font-bold">{p.sku}</td>
                          <td className="p-3 font-black text-slate-900">৳{p.base_price}</td>
                          <td className="p-3 font-black text-emerald-700">
                            {p.sale_price ? `৳${p.sale_price}` : <span className="text-slate-400 font-normal">None</span>}
                          </td>
                          <td className="p-3 text-slate-500">৳{p.cost_price || 0}</td>
                          <td className="p-3 font-bold text-slate-800">{p.stock_quantity} units</td>
                          <td className="p-3 whitespace-nowrap">
                            <button
                              onClick={() => setEditingProduct({ ...p })}
                              className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Delete ${p.name}?`)) {
                                  await api.deleteProduct(p.id);
                                  loadTabData('products');
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Variant Matrix Generator Box */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" /> Parent-Child Variant SKU Matrix Generator
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Base SKU Prefix</label>
                    <input
                      type="text"
                      value={matrixBaseSku}
                      onChange={(e) => setMatrixBaseSku(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Attribute 1 (Name: Values)</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={matrixAttr1Key}
                        onChange={(e) => setMatrixAttr1Key(e.target.value)}
                        className="w-1/3 bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                      />
                      <input
                        type="text"
                        value={matrixAttr1Values}
                        onChange={(e) => setMatrixAttr1Values(e.target.value)}
                        className="w-2/3 bg-slate-50 border border-slate-200 rounded-xl p-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Attribute 2 (Name: Values)</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={matrixAttr2Key}
                        onChange={(e) => setMatrixAttr2Key(e.target.value)}
                        className="w-1/3 bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                      />
                      <input
                        type="text"
                        value={matrixAttr2Values}
                        onChange={(e) => setMatrixAttr2Values(e.target.value)}
                        className="w-2/3 bg-slate-50 border border-slate-200 rounded-xl p-2"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerateMatrix}
                  className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Generate Variant Matrix Combos
                </button>

                {generatedMatrix.length > 0 && (
                  <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold">
                        <tr>
                          <th className="p-2">Generated SKU</th>
                          <th className="p-2">Barcode</th>
                          <th className="p-2">Attributes Combination</th>
                          <th className="p-2">Default Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {generatedMatrix.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-900">{m.sku}</td>
                            <td className="p-2 text-slate-500">{m.barcode}</td>
                            <td className="p-2 font-sans font-medium">{JSON.stringify(m.attributes)}</td>
                            <td className="p-2">{m.stock_quantity} units</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bulk Catalog Import Pipeline */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-600" /> Bulk Catalog Pre-Validation Pipeline
                </h3>
                <p className="text-xs text-slate-500">
                  Flags SKU collisions, missing attributes, or negative prices prior to database commit.
                </p>

                <textarea
                  rows={4}
                  value={importRowsJson}
                  onChange={(e) => setImportRowsJson(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs outline-none focus:border-emerald-500"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleValidateImport}
                    className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Run Pre-Validation Check
                  </button>
                  {validationResult && (
                    <button
                      onClick={handleCommitImport}
                      disabled={!validationResult.can_commit}
                      className="bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                    >
                      Commit Validated Rows to DB
                    </button>
                  )}
                </div>

                {validationResult && (
                  <div className={`p-3 rounded-xl text-xs space-y-1.5 ${validationResult.can_commit ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
                    <p className="font-bold">
                      Pre-validation Result: {validationResult.can_commit ? '✓ All rows valid! Ready to commit.' : `✕ Found ${validationResult.errors.length} blocking collision/schema errors:`}
                    </p>
                    {validationResult.errors.map((err, idx) => (
                      <p key={idx} className="font-mono text-[11px] pl-2">• Row {err.row_index} ({err.sku}): {err.issues.join('; ')}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= CATEGORY MANAGEMENT ================= */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Category Management & Taxonomy</h2>
                  <p className="text-xs text-slate-500">Create, edit, organize categories, manage nested subcategories, and active storefront visibility</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenCategoryModal()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add New Category
                  </button>
                </div>
              </div>

              {/* Category Directory Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search categories by name or slug..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-emerald-600"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    {categoriesList.filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase()) || c.slug.toLowerCase().includes(categorySearch.toLowerCase())).length} Categories Registered
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <tr>
                        <th className="p-3">Category</th>
                        <th className="p-3">Slug</th>
                        <th className="p-3">Hierarchy / Parent</th>
                        <th className="p-3">Icon</th>
                        <th className="p-3">Products</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoriesList
                        .filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase()) || c.slug.toLowerCase().includes(categorySearch.toLowerCase()))
                        .map((cat) => (
                          <tr key={cat.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900 flex items-center gap-2.5">
                              {cat.image_url ? (
                                <img src={cat.image_url} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
                                  {cat.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900">{cat.name}</p>
                                {cat.description && <p className="text-[10px] text-slate-400 line-clamp-1">{cat.description}</p>}
                              </div>
                            </td>
                            <td className="p-3 font-mono text-slate-600 font-semibold">{cat.slug}</td>
                            <td className="p-3">
                              {cat.parent_name ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  ↳ {cat.parent_name}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Root / Top Level
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-500">{cat.icon || 'shopping-bag'}</td>
                            <td className="p-3 font-bold text-slate-800">{cat.product_count || 0} items</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                {cat.is_active ? 'Active' : 'Hidden'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenCategoryModal(cat)}
                                  className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                                  title="Edit Category"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                  className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                  title="Delete Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= BRAND MANAGEMENT ================= */}
          {activeTab === 'brands' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Brand Management</h2>
                  <p className="text-xs text-slate-500">Manage manufacturers, brand logos, brand slugs, and product associations</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenBrandModal()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add New Brand
                  </button>
                </div>
              </div>

              {/* Brand Directory Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search brands by name..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-emerald-600"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    {brandsList.filter(b => !brandSearch || b.name.toLowerCase().includes(brandSearch.toLowerCase())).length} Brands Registered
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <tr>
                        <th className="p-3">Brand</th>
                        <th className="p-3">Slug</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Associated Products</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {brandsList
                        .filter(b => !brandSearch || b.name.toLowerCase().includes(brandSearch.toLowerCase()))
                        .map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900 flex items-center gap-2.5">
                              {b.logo_url ? (
                                <img src={b.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                                  {b.name.charAt(0)}
                                </div>
                              )}
                              <span className="font-bold text-slate-900">{b.name}</span>
                            </td>
                            <td className="p-3 font-mono text-slate-600 font-semibold">{b.slug}</td>
                            <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate">{b.description || 'No description provided'}</td>
                            <td className="p-3 font-bold text-slate-800">{b.product_count || 0} products</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenBrandModal(b)}
                                  className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                                  title="Edit Brand"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBrand(b.id, b.name)}
                                  className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                  title="Delete Brand"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. ORDER MANAGEMENT & DISPATCH TOOLS ================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Order Fulfillment & Lifecycle Engine</h2>
                  <p className="text-xs text-slate-500">Deterministic state machine transitions and batch dispatch document generator</p>
                </div>

                {/* Bulk Dispatch Batch Generator */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                  <select
                    value={dispatchDocType}
                    onChange={(e) => setDispatchDocType(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-1.5"
                  >
                    <option value="invoice">Shipping Invoices</option>
                    <option value="picking_list">Picking Lists</option>
                    <option value="packing_slip">Packing Slips</option>
                    <option value="shipping_label">Courier Shipping Labels</option>
                  </select>
                  <button
                    onClick={handleBulkDispatch}
                    className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Batch Print Selected ({selectedOrderIds.length})
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              {(() => {
                const filteredOrders = orders.filter((o) => {
                  if (orderFilterStatus && o.status !== orderFilterStatus) return false;
                  if (orderSearchText) {
                    const q = orderSearchText.toLowerCase();
                    const matchNum = o.order_number?.toLowerCase().includes(q);
                    const matchName = o.customer_name?.toLowerCase().includes(q);
                    const matchPhone = o.customer_phone?.toLowerCase().includes(q);
                    if (!matchNum && !matchName && !matchPhone) return false;
                  }
                  return true;
                });

                return (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[220px]">
                          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search by order #, customer name, or phone..."
                            value={orderSearchText}
                            onChange={(e) => setOrderSearchText(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                          {orderSearchText && (
                            <button
                              onClick={() => setOrderSearchText('')}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Clear search"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-slate-400" />
                          <select
                            value={orderFilterStatus}
                            onChange={(e) => setOrderFilterStatus(e.target.value)}
                            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 cursor-pointer"
                          >
                            <option value="">All Statuses ({orders.length})</option>
                            <option value="pending">Pending</option>
                            <option value="payment_confirmed">Paid / Confirmed</option>
                            <option value="processing_picking">Processing / Picking</option>
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="returned">Returned</option>
                          </select>
                        </div>
                      </div>

                      {/* Active Filter Indicators */}
                      {(orderFilterStatus || orderSearchText) && (
                        <div className="flex items-center gap-2">
                          {orderFilterStatus && (
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-bold">
                              <span>Status: <strong className="uppercase">{orderFilterStatus.replace('_', ' ')}</strong></span>
                              <button
                                onClick={() => setOrderFilterStatus('')}
                                className="hover:text-emerald-950 p-0.5 rounded cursor-pointer"
                                title="Clear status filter"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => { setOrderFilterStatus(''); setOrderSearchText(''); }}
                            className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer font-bold"
                          >
                            Reset all ({filteredOrders.length} shown)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Order State Machine Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                            <tr>
                              <th className="p-3">
                                <input
                                  type="checkbox"
                                  checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedOrderIds(filteredOrders.map(o => o.order_number));
                                    else setSelectedOrderIds([]);
                                  }}
                                  className="accent-emerald-600"
                                />
                              </th>
                              <th className="p-3">Order Number</th>
                              <th className="p-3">Customer Details</th>
                              <th className="p-3">Total Amount</th>
                              <th className="p-3">Current Status</th>
                              <th className="p-3">Transitions</th>
                              <th className="p-3">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredOrders.map((o) => (
                              <tr key={o.order_number} className="hover:bg-slate-50">
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedOrderIds.includes(o.order_number)}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedOrderIds(prev => [...prev, o.order_number]);
                                      else setSelectedOrderIds(prev => prev.filter(id => id !== o.order_number));
                                    }}
                                    className="accent-emerald-600"
                                  />
                                </td>
                                <td className="p-3 font-mono font-bold text-slate-900">{o.order_number}</td>
                                <td className="p-3">
                                  <p className="font-bold text-slate-800">{o.customer_name}</p>
                                  <p className="text-[11px] text-slate-500">{o.customer_phone}</p>
                                </td>
                                <td className="p-3 font-black text-slate-900">৳{o.total_amount}</td>
                                <td className="p-3">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                                    {o.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-wrap gap-1">
                                    {o.allowed_next_statuses?.map((st) => (
                                      <button
                                        key={st}
                                        onClick={() => handleTransitionStatus(o.order_number, st)}
                                        className="text-[10px] font-bold bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 px-2 py-1 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                                      >
                                        → {st.replace('_', ' ')}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <button
                                    onClick={async () => {
                                      const details = await api.getOrder(o.order_number);
                                      setSelectedOrderDetails(details);
                                    }}
                                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] px-2.5 py-1 rounded-md cursor-pointer"
                                  >
                                    Inspect
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                              <tr>
                                <td colSpan="7" className="p-8 text-center text-slate-400">
                                  <p className="font-bold text-sm text-slate-600">No matching orders found</p>
                                  <p className="text-xs mt-1">Try clearing your search query or status filter.</p>
                                  {(orderFilterStatus || orderSearchText) && (
                                    <button
                                      onClick={() => { setOrderFilterStatus(''); setOrderSearchText(''); }}
                                      className="mt-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                                    >
                                      Reset All Filters
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* RMA & Returns Portal */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-emerald-600" /> RMA Returns & Refund Processing
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {rmaRequests.map((r) => (
                    <div key={r.id} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-800">{r.order_number}</span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span>Reason: <strong>{r.reason}</strong></span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span>Status: <strong className="capitalize">{r.return_status}</strong></span>
                      </div>
                      <div>
                        {r.return_status === 'requested' && (
                          <button
                            onClick={() => handleTriggerRefund(r.id)}
                            className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                          >
                            Trigger Refund & Restock Inventory
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {rmaRequests.length === 0 && (
                    <p className="text-xs text-slate-400 py-3 italic">No open RMA return requests.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= 4. INVENTORY & WAREHOUSE ================= */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Inventory & Multi-Warehouse Tracking</h2>
                <p className="text-xs text-slate-500">Multi-warehouse stock distribution, low-stock safety thresholds, and reason-coded adjustments</p>
              </div>

              {/* Configurable Low-Stock Safety Threshold Control */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Low-Stock Safety Stock Threshold Configuration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set the catalog minimum quantity that flags a product as low-stock and triggers alert notifications.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <span className="text-xs font-bold text-slate-600">Threshold (units):</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={globalThreshold}
                      onChange={(e) => setGlobalThreshold(parseInt(e.target.value) || 1)}
                      className="w-16 bg-white border border-slate-300 rounded-lg p-1 text-center font-black text-slate-900 text-xs"
                    />
                  </div>
                  <button
                    onClick={() => handleSaveGlobalThreshold(globalThreshold)}
                    disabled={thresholdSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    {thresholdSaving ? 'Applying...' : 'Save & Update Threshold'}
                  </button>
                </div>
              </div>

              {/* Low Stock Alerts Banner */}
              {stockOverview?.low_stock_alerts?.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-2">
                  <h3 className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Low-Stock Dashboard Alerts ({stockOverview.low_stock_alerts.length} items below safety threshold):
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {stockOverview.low_stock_alerts.map((al, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-rose-200 text-slate-800 font-medium">
                        <strong>{al.product_name}</strong> ({al.sku}) — Stock: <span className="text-rose-600 font-bold">{al.stock_quantity}</span> (Threshold: {al.safety_stock_threshold})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Stock Adjustment Form with Dropdown */}
              <form onSubmit={handleCreateStockAdjustment} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Manual Stock Adjustment Form (Audit Tracked)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">Select Product from Catalog</label>
                    <select
                      required
                      value={adjProductId}
                      onChange={(e) => {
                        setAdjProductId(e.target.value);
                        const p = products.find(prod => prod.id === parseInt(e.target.value));
                        if (p) setAdjNewQty(p.stock_quantity);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.sku}] {p.name} (Current: {p.stock_quantity} units)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Target Warehouse</label>
                    <select
                      value={adjWarehouseId}
                      onChange={(e) => setAdjWarehouseId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                    >
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">New Total Quantity</label>
                    <input
                      type="number"
                      required
                      value={adjNewQty}
                      onChange={(e) => setAdjNewQty(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Mandatory Reason Code</label>
                    <select
                      value={adjReason}
                      onChange={(e) => setAdjReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                    >
                      <option value="damage">Damage (Spoiled / Crushed)</option>
                      <option value="return">Return Restock</option>
                      <option value="recount">Physical Recount</option>
                      <option value="shrinkage">Shrinkage / Discrepancy</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">Mandatory Audit Explanation</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Physical inventory check in Banani Central Aisle 4"
                        value={adjNotes}
                        onChange={(e) => setAdjNotes(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                      <button type="submit" className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer shadow-xs">
                        Commit Adjustment
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Historical Audit Logs */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Historical Stock Adjustment Audit Logs</span>
                </div>
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3">Previous Qty</th>
                        <th className="p-3">New Qty</th>
                        <th className="p-3">Change</th>
                        <th className="p-3">Reason Code</th>
                        <th className="p-3">Adjusted By</th>
                        <th className="p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold font-sans text-slate-900">{log.product_name}</td>
                          <td className="p-3">{log.previous_qty}</td>
                          <td className="p-3 font-bold">{log.new_qty}</td>
                          <td className={`p-3 font-bold ${log.change_qty >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {log.change_qty >= 0 ? `+${log.change_qty}` : log.change_qty}
                          </td>
                          <td className="p-3 font-sans font-bold uppercase text-[10px] text-slate-700">{log.reason_code}</td>
                          <td className="p-3 font-sans">{log.adjusted_by}</td>
                          <td className="p-3 text-slate-400 font-sans text-[11px]">{log.created_at?.slice(0, 16)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= 5. CUSTOMER RELATIONSHIP & SUPPORT (CRM) ================= */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Customer Relationship Management (CRM 360°)</h2>
                  <p className="text-xs text-slate-500">Comprehensive customer profiles, segmentation rules, lifetime metrics, and compliance workflows</p>
                </div>

                {/* Subtab Navigation Pills */}
                <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                  {[
                    { id: 'dashboard', label: 'CRM Dashboard' },
                    { id: 'directory', label: 'Customer Directory' },
                    { id: 'tags', label: 'Segments & Tags' },
                    { id: 'deletions', label: 'Deletion Requests' },
                    { id: 'exports', label: 'Export Audit Logs' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setCrmSubTab(st.id)}
                      className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${crmSubTab === st.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtab 1: CRM Dashboard */}
              {crmSubTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* 7 Dynamic KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                    {[
                      { label: 'Total Customers', value: crmDashboardData?.total_customers || 0, color: 'slate', icon: Users },
                      { label: 'Active (30d)', value: crmDashboardData?.active_customers || 0, color: 'emerald', icon: CheckCircle2 },
                      { label: 'Inactive (90d+)', value: crmDashboardData?.inactive_customers || 0, color: 'amber', icon: AlertTriangle },
                      { label: 'VIP Spenders', value: crmDashboardData?.vip_customers || 0, color: 'indigo', icon: Sparkles },
                      { label: 'Wholesale B2B', value: crmDashboardData?.wholesale_customers || 0, color: 'blue', icon: Warehouse },
                      { label: 'High Risk / Fraud', value: crmDashboardData?.high_risk_customers || 0, color: 'rose', icon: AlertTriangle },
                      { label: 'New Registrations', value: crmDashboardData?.new_customers_30d || 0, color: 'teal', icon: Plus }
                    ].map((kpi, idx) => (
                      <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">{kpi.label}</span>
                        <p className="text-xl font-black text-slate-900">{kpi.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* LTV & Segmentation Action Bar */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Total Platform Customer LTV</span>
                        <p className="text-2xl font-black text-emerald-400">৳{crmDashboardData?.total_ltv || 0}</p>
                      </div>
                      <div className="h-8 w-px bg-slate-700 hidden sm:block" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Average Customer Lifetime Value</span>
                        <p className="text-2xl font-black text-white">৳{crmDashboardData?.average_ltv || 0}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleRunAutoSegment}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                    >
                      <Sparkles className="w-4 h-4" /> Run Automated Tagging Engine
                    </button>
                  </div>

                  {/* Realtime CRM Activity Feed */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" /> Recent Customer Activity Stream
                    </h3>
                    <div className="divide-y divide-slate-100 text-xs max-h-80 overflow-y-auto">
                      {(crmDashboardData?.recent_activities || []).map((act, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                              {act.action_type}
                            </span>
                            <span className="font-semibold text-slate-800">{act.description}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{act.created_at?.slice(0, 16)}</span>
                        </div>
                      ))}
                      {(crmDashboardData?.recent_activities || []).length === 0 && (
                        <p className="text-xs text-slate-400 py-4 italic text-center">No recent activity logs recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: Customer Directory */}
              {crmSubTab === 'directory' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4">
                  {/* Filter Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      <div className="relative min-w-[220px]">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by name, email, phone..."
                          value={crmSearch}
                          onChange={(e) => {
                            setCrmSearch(e.target.value);
                            loadCrmCustomers(e.target.value, crmTagFilter, crmStatusFilter, crmSortBy, crmSortOrder);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-emerald-600"
                        />
                      </div>

                      {/* Tag Filter */}
                      <select
                        value={crmTagFilter}
                        onChange={(e) => {
                          setCrmTagFilter(e.target.value);
                          loadCrmCustomers(crmSearch, e.target.value, crmStatusFilter, crmSortBy, crmSortOrder);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 text-xs"
                      >
                        <option value="All">All Segment Tags</option>
                        {crmTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                      </select>

                      {/* Status Filter */}
                      <select
                        value={crmStatusFilter}
                        onChange={(e) => {
                          setCrmStatusFilter(e.target.value);
                          loadCrmCustomers(crmSearch, crmTagFilter, e.target.value, crmSortBy, crmSortOrder);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 text-xs"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active Only</option>
                        <option value="Inactive">Inactive / Suspended</option>
                      </select>

                      {/* Sort Dropdown */}
                      <select
                        value={`${crmSortBy}:${crmSortOrder}`}
                        onChange={(e) => {
                          const [by, ord] = e.target.value.split(':');
                          setCrmSortBy(by);
                          setCrmSortOrder(ord);
                          loadCrmCustomers(crmSearch, crmTagFilter, crmStatusFilter, by, ord);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 text-xs"
                      >
                        <option value="created_at:desc">Newest First</option>
                        <option value="ltv:desc">Highest Lifetime Spend (LTV)</option>
                        <option value="orders_count:desc">Most Orders</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {user?.role === 'operator' && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                          PII Masked for Operators
                        </span>
                      )}
                      <button
                        onClick={handleExportCustomersCsv}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Export Customers CSV
                      </button>
                    </div>
                  </div>

                  {/* Customer Records Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3">Customer Profile</th>
                          <th className="p-3">Segment Tags</th>
                          <th className="p-3">Orders</th>
                          <th className="p-3">Net LTV Spend</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customers.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{c.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{c.email}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{c.phone}</p>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {(c.tags || []).map((t, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {t}
                                  </span>
                                ))}
                                {(!c.tags || c.tags.length === 0) && (
                                  <span className="text-[10px] text-slate-400 italic">No tags</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-bold text-slate-800">{c.lifetime_orders_count} orders</td>
                            <td className="p-3 font-black text-slate-900">৳{c.ltv}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                {c.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpen360Profile(c.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                                >
                                  360° Profile
                                </button>
                                <button
                                  onClick={() => {
                                    setTagAssignTarget(c);
                                    setSelectedTagToAssign(crmTags[0]?.name || 'VIP');
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2 py-1 rounded-lg cursor-pointer"
                                  title="Assign Tag"
                                >
                                  + Tag
                                </button>
                                <button
                                  onClick={() => {
                                    setDeletionModalCustomer(c);
                                    setDeletionReason('');
                                  }}
                                  className="text-rose-600 hover:bg-rose-50 font-bold text-[10px] px-2 py-1 rounded-lg cursor-pointer"
                                  title="GDPR Account Deletion"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {customers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-400">
                              No matching customer accounts found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtab 3: Segments & Tags */}
              {crmSubTab === 'tags' && (
                <div className="space-y-6">
                  {/* Create New Tag Box */}
                  <form onSubmit={handleCreateCustomerTag} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Create Custom Segmentation Tag
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Tag Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. VIP, Loyal, High Returns"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Color Palette</label>
                        <select
                          value={newTagColor}
                          onChange={(e) => setNewTagColor(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                        >
                          <option value="emerald">Emerald Green</option>
                          <option value="indigo">Indigo / Royal</option>
                          <option value="amber">Amber Gold</option>
                          <option value="rose">Rose Red</option>
                          <option value="blue">Sky Blue</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Tag Description</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Optional note"
                            value={newTagDesc}
                            onChange={(e) => setNewTagDesc(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                          />
                          <button
                            type="submit"
                            className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                          >
                            Save Tag
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Tags Directory Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-700">All Registered Customer Segment Tags</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="p-3">Tag Name</th>
                            <th className="p-3">Description</th>
                            <th className="p-3">Assigned Customers</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {crmTags.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                  {t.name}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500">{t.description || 'No description'}</td>
                              <td className="p-3 font-bold">{t.customer_count || 0} customers</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleDeleteCustomerTag(t.id, t.name)}
                                  className="text-rose-600 hover:text-rose-800 font-bold p-1 cursor-pointer"
                                  title="Delete Tag"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 4: Deletion Requests */}
              {crmSubTab === 'deletions' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Privacy & GDPR Account Deletion Requests
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Approve to anonymize customer PII (name, email, phone) while preserving financial order records for audit and accounting.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Reason</th>
                          <th className="p-3">Requested At</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Decision</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deletionRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{req.customer_name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{req.customer_email}</p>
                            </td>
                            <td className="p-3 text-slate-700">{req.reason || 'Requested by customer / admin'}</td>
                            <td className="p-3 text-slate-400 font-mono text-[11px]">{req.requested_at?.slice(0, 16)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {req.status === 'pending' && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleProcessDeletion(req.id, 'approve')}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer"
                                  >
                                    Approve & Anonymize
                                  </button>
                                  <button
                                    onClick={() => handleProcessDeletion(req.id, 'reject')}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2 py-1 rounded-lg cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {deletionRequests.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-slate-400">
                              No account deletion requests pending.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtab 5: Export Audit Logs */}
              {crmSubTab === 'exports' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Customer Data Export Audit Logs
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Compliance records tracking every administrator and operator who exported customer data to CSV.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 font-sans">
                        <tr>
                          <th className="p-3">Exported By</th>
                          <th className="p-3">Filter / Segment</th>
                          <th className="p-3">Records Count</th>
                          <th className="p-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {exportLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold font-sans text-slate-900">{log.exported_by}</td>
                            <td className="p-3">{log.filter_applied || 'All'}</td>
                            <td className="p-3 font-bold">{log.records_count} rows</td>
                            <td className="p-3 text-slate-400 text-[11px]">{log.created_at?.slice(0, 16)}</td>
                          </tr>
                        ))}
                        {exportLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-slate-400 font-sans">
                              No customer data exports recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 6. MARKETING & PROMOTIONS ================= */}
          {activeTab === 'marketing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Marketing & Promotion Rules</h2>
                <p className="text-xs text-slate-500">Manage hero slider carousels, banner promotions, discount coupons, and spend thresholds</p>
              </div>

              {/* Hero Slider & Homepage Banners Section */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" /> Hero Slider & Homepage Banners ({banners.length})
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-0.5">Control the images, headlines, and call-to-actions on the Storefront homepage hero carousel.</p>
                  </div>
                  <button
                    onClick={() => setShowNewBannerModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Hero Banner
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map((b) => (
                    <div key={b.id} className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 text-white shadow-xs group">
                      <div className="h-44 w-full relative">
                        <img src={b.image_url} alt={b.title} className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-end">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600/90 text-white px-2 py-0.5 rounded-full w-fit mb-1">
                            {b.position}
                          </span>
                          <h4 className="font-black text-base text-white leading-snug">{b.title}</h4>
                          <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">{b.subtitle}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-white text-slate-800 flex justify-between items-center text-xs">
                        <span className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">Link: {b.link_url || '/products'}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingBanner({ ...b })}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-xs cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(b.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-xs cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {banners.length === 0 && (
                    <div className="col-span-2 p-8 text-center text-slate-400 text-xs">
                      No banners found. Click "Add New Hero Banner" to add one.
                    </div>
                  )}
                </div>
              </div>

              {/* Create Coupon Form */}
              <form onSubmit={handleCreateCoupon} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Create Promotion Coupon</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Coupon Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FLASH25"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Discount Type</label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Flat (৳)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Minimum Spend (৳)</label>
                    <input
                      type="number"
                      required
                      value={newCouponMinSpend}
                      onChange={(e) => setNewCouponMinSpend(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                    />
                  </div>
                </div>
                <button type="submit" className="bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-xs">
                  Activate Coupon Code
                </button>
              </form>

              {/* Coupons List */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <tr>
                        <th className="p-3">Code</th>
                        <th className="p-3">Discount</th>
                        <th className="p-3">Min Spend</th>
                        <th className="p-3">Times Used</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {coupons.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{c.code}</td>
                          <td className="p-3">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `৳${c.discount_value}`}</td>
                          <td className="p-3">৳{c.min_spend}</td>
                          <td className="p-3">{c.times_used} / {c.global_usage_limit}</td>
                          <td className="p-3 font-sans">
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleDeleteCoupon(c.id)}
                              className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= 7. CONTENT MANAGEMENT & HERO BANNERS ================= */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Header with Sub-tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Content Management</h2>
                  <p className="text-xs text-slate-500">
                    Configure homepage hero banner sliders, visual assets, and DAM media library.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-2xl w-fit">
                  <button
                    onClick={() => setContentSubTab('banners')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      contentSubTab === 'banners'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hero Banners ({banners.length})
                  </button>
                  <button
                    onClick={() => setContentSubTab('dam')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      contentSubTab === 'dam'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Media Assets (DAM) ({mediaAssets.length})
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Hero Banner Management */}
              {contentSubTab === 'banners' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        Hero Banner Management System
                      </h3>
                      <p className="text-xs text-slate-500">
                        Create, schedule, reorder, and activate/deactivate homepage hero carousel banners.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setBannerFormError('');
                        setBannerFormData(emptyBannerForm);
                        setShowNewBannerModal(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" /> Add New Hero Banner
                    </button>
                  </div>

                  {/* Banner Management Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3.5 w-24">Thumbnail</th>
                            <th className="p-3.5">Banner Name</th>
                            <th className="p-3.5">Heading & Promo</th>
                            <th className="p-3.5">Start Date</th>
                            <th className="p-3.5">End Date</th>
                            <th className="p-3.5 text-center">Display Order</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {banners.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="p-12 text-center text-slate-400">
                                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                <p className="font-bold text-slate-600">No Hero Banners Found</p>
                                <p className="text-xs mt-1">Get started by creating your first hero slider banner.</p>
                                <button
                                  onClick={() => {
                                    setBannerFormError('');
                                    setBannerFormData(emptyBannerForm);
                                    setShowNewBannerModal(true);
                                  }}
                                  className="mt-4 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                                >
                                  <Plus className="w-4 h-4" /> Create First Banner
                                </button>
                              </td>
                            </tr>
                          ) : (
                            banners.map((b) => (
                              <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                                {/* Thumbnail */}
                                <td className="p-3.5">
                                  <div
                                    onClick={() => setViewingBanner(b)}
                                    className="w-20 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative cursor-pointer group shadow-2xs"
                                    title="Click to preview banner"
                                  >
                                    <img
                                      src={b.thumbnail_url || b.image_url}
                                      alt={b.name || b.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <Eye className="w-4 h-4" />
                                    </div>
                                  </div>
                                </td>

                                {/* Banner Name */}
                                <td className="p-3.5">
                                  <div className="space-y-0.5">
                                    <p className="font-black text-slate-900 line-clamp-1">{b.name || b.title}</p>
                                    <span className="text-[10px] text-slate-400 font-mono block">
                                      ID: #{b.id} • {b.position || 'hero_slider'}
                                    </span>
                                  </div>
                                </td>

                                {/* Heading & Subtitle */}
                                <td className="p-3.5">
                                  <div className="max-w-[240px] space-y-0.5">
                                    <p className="font-bold text-slate-800 line-clamp-1">{b.title}</p>
                                    {b.subtitle && (
                                      <p className="text-[11px] text-slate-500 line-clamp-1">{b.subtitle}</p>
                                    )}
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                                        CTA: "{b.button_text || 'Shop Now'}"
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-500 truncate max-w-[110px]" title={b.link_url || '/products'}>
                                        → {b.link_url || '/products'}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Start Date */}
                                <td className="p-3.5">
                                  <div className="space-y-0.5">
                                    <span className="text-slate-700 font-medium whitespace-nowrap block">
                                      {formatDisplayDate(b.start_date)}
                                    </span>
                                    {b.start_date && new Date(b.start_date) > new Date() && (
                                      <span className="inline-block text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-sans">
                                        Future Scheduled
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* End Date */}
                                <td className="p-3.5">
                                  <div className="space-y-0.5">
                                    <span className="text-slate-700 font-medium whitespace-nowrap block">
                                      {formatDisplayDate(b.end_date)}
                                    </span>
                                    {b.end_date && new Date(b.end_date) < new Date() && (
                                      <span className="inline-block text-[9px] font-black uppercase text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded font-sans">
                                        Expired
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Display Order */}
                                <td className="p-3.5 text-center">
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 font-black text-slate-800 font-mono border border-slate-200">
                                    {b.display_order ?? 0}
                                  </span>
                                </td>

                                {/* Status */}
                                <td className="p-3.5">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                        b.is_active
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${b.is_active ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                                      {b.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleBannerStatus(b)}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                        b.is_active
                                          ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                      }`}
                                      title={b.is_active ? 'Deactivate banner' : 'Activate banner'}
                                    >
                                      {b.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                  </div>
                                </td>

                                {/* Actions */}
                                <td className="p-3.5 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      onClick={() => setViewingBanner(b)}
                                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                      title="View banner preview & simulation"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setBannerFormError('');
                                        setEditingBanner({
                                          ...b,
                                          name: b.name || b.title,
                                          button_text: b.button_text || 'Shop Now',
                                          link_url: b.link_url || '/products',
                                          start_date: toDatetimeLocal(b.start_date),
                                          end_date: toDatetimeLocal(b.end_date),
                                          display_order: b.display_order ?? 0,
                                          is_active: b.is_active !== undefined ? b.is_active : true
                                        });
                                      }}
                                      className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                      title="Edit banner"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmBanner(b)}
                                      className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete banner"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Digital Asset Management (DAM) */}
              {contentSubTab === 'dam' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        Digital Asset Management (DAM) & Media Library
                      </h3>
                      <p className="text-xs text-slate-500">
                        Automatic WebP compression, thumbnail generation, and alt-text SEO tagging.
                      </p>
                    </div>
                    <label className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingMedia ? 'Compressing WebP...' : 'Upload Media Asset'}</span>
                      <input type="file" accept="image/*" onChange={handleMediaUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {mediaAssets.map((asset) => (
                      <div key={asset.id} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                        <img src={asset.thumbnail_url || asset.file_url} alt={asset.alt_text} className="w-full aspect-square rounded-xl object-cover bg-slate-100" />
                        <p className="font-bold text-slate-900 truncate">{asset.original_name}</p>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase">
                          {asset.format} • {(asset.size_bytes / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 9. SHIPPING & DELIVERY ================= */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Shipping & Delivery Configuration</h2>
                <p className="text-xs text-slate-500">Coverage zones, delivery charges, and courier fleet management</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Dhaka Metro - Express 2-Hour Delivery</p>
                    <p className="text-slate-500">Banani, Gulshan, Dhanmondi, Uttara, Mirpur, Motijheel</p>
                  </div>
                  <span className="font-black text-slate-900 text-sm">৳60.00</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Dhaka Suburbs (Same Day Delivery)</p>
                    <p className="text-slate-500">Gazipur, Savar, Narayanganj</p>
                  </div>
                  <span className="font-black text-slate-900 text-sm">৳90.00</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">All Bangladesh Divisional Centers</p>
                    <p className="text-slate-500">Chattogram, Sylhet, Rajshahi, Khulna (24-48 Hours)</p>
                  </div>
                  <span className="font-black text-slate-900 text-sm">৳120.00</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= 11. SETTINGS & CONFIGURATION ================= */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-base font-black text-slate-900">Store Configuration & Business Policies</h2>
                  <p className="text-slate-500 text-[11px]">Control regional settings, tax rules, shipping fees, returns, and operating status</p>
                </div>
                <div className="flex items-center gap-2">
                  {settingsSavedMessage && (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 animate-fade-in">
                      <Check className="w-4 h-4 text-emerald-600" /> {settingsSavedMessage}
                    </span>
                  )}
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    Save All Changes
                  </button>
                </div>
              </div>

              {/* Grid Section 1: Store Branding & Identity */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                  1. Store Branding & Legal Identity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Store Name</label>
                    <input
                      type="text"
                      required
                      value={storeSettings.store_name || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Store Tagline / Slogan</label>
                    <input
                      type="text"
                      value={storeSettings.store_tagline || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_tagline: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Logo URL</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="url"
                        value={storeSettings.logo_url || ''}
                        onChange={(e) => setStoreSettings({ ...storeSettings, logo_url: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]"
                      />
                      {storeSettings.logo_url && (
                        <img
                          src={storeSettings.logo_url}
                          alt="Logo Preview"
                          className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white p-1 shrink-0"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Trade License / Incorporation ID</label>
                    <input
                      type="text"
                      value={storeSettings.trade_license || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, trade_license: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Business Registered Address</label>
                  <input
                    type="text"
                    value={storeSettings.business_address || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, business_address: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Grid Section 2: Store Operational Status */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                  2. Store Operational Status & Notices
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Operating Status</label>
                    <select
                      value={storeSettings.store_status || 'open'}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_status: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800"
                    >
                      <option value="open">🟢 Open (Storefront Active)</option>
                      <option value="maintenance">🟡 Maintenance Mode</option>
                      <option value="closed">🔴 Closed Temporarily</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Maintenance / Offline Notice to Customers</label>
                    <input
                      type="text"
                      value={storeSettings.maintenance_notice || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, maintenance_notice: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                      placeholder="Message visible when storefront is in maintenance mode"
                    />
                  </div>
                </div>
              </div>

              {/* Grid Section 3: Contact, Regional & Currency */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                  3. Contact, Regional & Currency Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Customer Support Phone</label>
                    <input
                      type="text"
                      value={storeSettings.support_phone || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, support_phone: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Support Email Address</label>
                    <input
                      type="email"
                      value={storeSettings.support_email || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, support_email: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Currency Code</label>
                    <input
                      type="text"
                      value={storeSettings.currency_code || 'BDT'}
                      onChange={(e) => setStoreSettings({ ...storeSettings, currency_code: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={storeSettings.currency_symbol || '৳'}
                      onChange={(e) => setStoreSettings({ ...storeSettings, currency_symbol: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-black text-center text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Timezone</label>
                    <input
                      type="text"
                      value={storeSettings.timezone || 'Asia/Dhaka'}
                      onChange={(e) => setStoreSettings({ ...storeSettings, timezone: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Grid Section 4: Taxes & Shipping Configuration */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                  4. Tax Rules & Shipping Charges
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Statutory Sales Tax / VAT (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={storeSettings.tax_rate_percentage ?? 5.0}
                      onChange={(e) => setStoreSettings({ ...storeSettings, tax_rate_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Tax Presentation Mode</label>
                    <select
                      value={storeSettings.tax_display_mode || 'included'}
                      onChange={(e) => setStoreSettings({ ...storeSettings, tax_display_mode: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800"
                    >
                      <option value="included">Prices Include Sales Tax / VAT</option>
                      <option value="excluded">Tax Added on Checkout Summary</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Standard Shipping (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={storeSettings.standard_shipping_charge ?? 60}
                      onChange={(e) => setStoreSettings({ ...storeSettings, standard_shipping_charge: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Express Shipping (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={storeSettings.express_shipping_charge ?? 120}
                      onChange={(e) => setStoreSettings({ ...storeSettings, express_shipping_charge: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Free Shipping Threshold (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={storeSettings.free_shipping_threshold ?? 1000}
                      onChange={(e) => setStoreSettings({ ...storeSettings, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Grid Section 5: Returns & Inventory Policies */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                  5. Returns, RMA & Inventory Thresholds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Customer Return Window (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={storeSettings.return_window_days ?? 7}
                      onChange={(e) => setStoreSettings({ ...storeSettings, return_window_days: parseInt(e.target.value) || 7 })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Days after delivery customer can request an RMA return</p>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Global Low Stock Threshold</label>
                    <input
                      type="number"
                      min="1"
                      value={storeSettings.low_stock_threshold ?? 10}
                      onChange={(e) => setStoreSettings({ ...storeSettings, low_stock_threshold: parseInt(e.target.value) || 10 })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Products below this count trigger warehouse restocking alerts</p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(storeSettings.restock_on_refund)}
                      onChange={(e) => setStoreSettings({ ...storeSettings, restock_on_refund: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Automatic Inventory Restock on Approved Return</span>
                      <p className="text-[11px] text-slate-500">When an RMA refund is processed, immediately return the item quantity to warehouse stock</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl cursor-pointer shadow-sm text-xs transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save Store Configuration
                </button>
              </div>
            </form>
          )}

          {/* ================= 12. USER, ROLE & PERMISSIONS ================= */}
          {(activeTab === 'roles' || activeTab === 'users') && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">User, Role & Security Management</h2>
                  <p className="text-xs text-slate-500">Role-based access control (RBAC), administrator accounts, and security audit trail</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                    {[
                      { id: 'admins', label: `Staff Accounts (${adminUsers.length})` },
                      { id: 'audit', label: `Security Audit Trail (${securityAuditLogs.length})` },
                      { id: 'all', label: `All Users (${systemUsers.length})` }
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setUsersSubTab(st.id)}
                        className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          usersSubTab === st.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCreateAdminModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Administrator</span>
                  </button>
                </div>
              </div>

              {/* View 1: Administrator Staff Directory */}
              {usersSubTab === 'admins' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Authorized Administrative Personnel ({adminUsers.length})</span>
                    <span className="text-[11px] text-slate-400">Restricted role privileges strictly enforced on backend APIs</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3">Staff Member</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Role Level</th>
                          <th className="p-3">Permissions Matrix</th>
                          <th className="p-3">Modify Role</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {adminUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">
                              <p>{u.name}</p>
                              {u.phone && <p className="text-[11px] text-slate-400 font-normal">{u.phone}</p>}
                            </td>
                            <td className="p-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                u.role === 'super_admin' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                u.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                u.role === 'product_manager' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                u.role === 'order_manager' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                u.role === 'customer_support' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                                'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}>
                                {u.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(u.permissions || []).slice(0, 3).map((perm, idx) => (
                                  <span key={idx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-mono">
                                    {perm}
                                  </span>
                                ))}
                                {(u.permissions || []).length > 3 && (
                                  <span className="text-[9px] text-slate-400 font-bold self-center">
                                    +{u.permissions.length - 3} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 cursor-pointer"
                              >
                                <option value="super_admin">Super Administrator</option>
                                <option value="admin">Administrator</option>
                                <option value="product_manager">Product Manager</option>
                                <option value="order_manager">Order Manager</option>
                                <option value="customer_support">Customer Support</option>
                                <option value="operator">Operator (Fulfillment)</option>
                                <option value="customer">Demote to Customer</option>
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              {user?.id !== u.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdminUser(u.id, u.name)}
                                  className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer font-bold"
                                  title="Revoke Admin Access"
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* View 2: Security & Admin Audit Trail */}
              {usersSubTab === 'audit' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-2">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">Administrative Operation Audit Logs</h3>
                      <p className="text-[11px] text-slate-500">Deterministic record of role updates, login events, and critical store modifications</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Staff Member</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Target Details</th>
                          <th className="p-3">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {securityAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-[11px] text-slate-500">{log.created_at?.slice(0, 16)}</td>
                            <td className="p-3 font-bold text-slate-900">{log.admin_name || 'System / API'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                {log.admin_role || 'Staff'}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-emerald-800">
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-mono">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 max-w-sm truncate" title={log.details}>
                              {log.details || `${log.target_type} #${log.target_id}`}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                          </tr>
                        ))}
                        {securityAuditLogs.length === 0 && (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                              No administrative audit log entries recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* View 3: All Registered Users */}
              {usersSubTab === 'all' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">All Registered Accounts ({systemUsers.length})</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3">User</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">Current Role</th>
                          <th className="p-3">Change Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {systemUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{u.name}</td>
                            <td className="p-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                            <td className="p-3 text-slate-500">{u.phone || 'N/A'}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                u.role.includes('admin') ? 'bg-purple-100 text-purple-800' :
                                u.role === 'operator' ? 'bg-amber-100 text-amber-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3">
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 cursor-pointer"
                              >
                                <option value="customer">Customer</option>
                                <option value="operator">Operator</option>
                                <option value="customer_support">Customer Support</option>
                                <option value="order_manager">Order Manager</option>
                                <option value="product_manager">Product Manager</option>
                                <option value="admin">Administrator</option>
                                <option value="super_admin">Super Administrator</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal: Create Administrator */}
          {showCreateAdminModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900">Provision Administrator Account</h3>
                  <button
                    onClick={() => setShowCreateAdminModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateAdminUser} className="space-y-3 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newAdminForm.name}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                      placeholder="e.g. Asif Mahmud"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={newAdminForm.email}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                      placeholder="asif@supershop.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={newAdminForm.password}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Assigned Role</label>
                    <select
                      value={newAdminForm.role}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                    >
                      <option value="product_manager">Product Manager (Catalog, PIM, Inventory)</option>
                      <option value="order_manager">Order Manager (Fulfillment, Dispatch, Shipping)</option>
                      <option value="customer_support">Customer Support (CRM, Tickets, Masked PII)</option>
                      <option value="operator">Fulfillment Operator (Picking, Packing)</option>
                      <option value="admin">Administrator (Full Store Operations)</option>
                      <option value="super_admin">Super Administrator (Full System Control)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={newAdminForm.phone}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                      placeholder="+8801700000000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowCreateAdminModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                    >
                      Create Staff Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Add New Catalog Product</h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Seedless Watermelon"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUS-WML-001"
                    value={newProductSku}
                    onChange={(e) => setNewProductSku(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Category</label>
                  <select
                    value={newProductCategoryId}
                    onChange={(e) => setNewProductCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Original Price (৳)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newProductBasePrice}
                    onChange={(e) => setNewProductBasePrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Sale Price (৳)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Optional"
                    value={newProductSalePrice}
                    onChange={(e) => setNewProductSalePrice(e.target.value)}
                    className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newProductImageUrl}
                  onChange={(e) => setNewProductImageUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Fresh organic farm produce delivered within hours."
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl cursor-pointer shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Edit Product: {editingProduct.name}</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Category</label>
                  <select
                    value={editingProduct.category_id || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Original Price (৳)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingProduct.base_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, base_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Sale / Discount Price (৳)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingProduct.sale_price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sale_price: e.target.value })}
                    className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 font-bold text-emerald-800"
                    placeholder="None"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock_quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.short_description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD HERO BANNER MODAL (12 FIELDS) ================= */}
      {showNewBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  Create New Hero Banner
                </h3>
                <p className="text-slate-500 text-[11px]">Configure promotional visuals, schedules, and destinations</p>
              </div>
              <button
                onClick={() => setShowNewBannerModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bannerFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{bannerFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBanner} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Banner Name */}
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    1. Banner Name <span className="text-slate-400 font-normal">(Internal identifier)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Mega Fresh Fruits Festival 2026"
                    value={bannerFormData.name}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 5. Main Heading */}
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    5. Main Heading <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Farm Fresh Produce Delivered Daily"
                    value={bannerFormData.title}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-sm focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 6. Subtitle */}
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    6. Subtitle <span className="text-slate-400 font-normal">(Optional supporting description)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100% Organic, Crisp, and Hand-Picked from Bangladesh’s Best Orchards."
                    value={bannerFormData.subtitle}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, subtitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 7. Button Text */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    7. Button Text <span className="text-slate-400 font-normal">(CTA text)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Shop Now"
                    value={bannerFormData.button_text}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, button_text: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 8. Redirect URL */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    8. Redirect URL <span className="text-slate-400 font-normal">(Target link)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="/products"
                    value={bannerFormData.link_url}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, link_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 9. Start Date & Time */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    9. Start Date & Time <span className="text-slate-400 font-normal">(Schedule visibility)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={bannerFormData.start_date}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, start_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank for immediate visibility</span>
                </div>

                {/* 10. End Date & Time */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    10. End Date & Time <span className="text-slate-400 font-normal">(Expiration)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={bannerFormData.end_date}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank to never expire</span>
                </div>

                {/* 11. Display Status */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">11. Display Status</label>
                  <select
                    value={bannerFormData.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, is_active: e.target.value === 'active' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="active">Active (Visible to customers)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>

                {/* 12. Display Order */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">12. Display Order</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="1"
                    value={bannerFormData.display_order}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, display_order: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Lower numbers appear first in the slider</span>
                </div>

                {/* 2 & 3. Banner Image Upload or Image URL */}
                <div className="md:col-span-2 space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-slate-800 font-black">
                      2 & 3. Banner Image Source <span className="text-emerald-700">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Upload from device (JPG, PNG, WebP &le; 5MB) OR paste URL
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Direct Upload */}
                    <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 flex flex-col items-center justify-center text-center gap-2 hover:border-emerald-500 transition-colors">
                      <Upload className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Direct Image Upload</p>
                        <p className="text-[10px] text-slate-500">Converts to WebP with DAM thumbnail</p>
                      </div>
                      <label className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition-colors">
                        <span>{bannerUploadLoading ? 'Uploading & Compressing...' : 'Select File from Device'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={(e) => handleBannerFileUpload(e.target.files?.[0], false)}
                          disabled={bannerUploadLoading}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* External URL */}
                    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col justify-center space-y-2">
                      <label className="block text-slate-700 font-bold text-xs">
                        Or External Image URL:
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={bannerFormData.image_url}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, image_url: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400">Paste CDN or external hosting link</span>
                    </div>
                  </div>

                  {/* 4. Image Preview */}
                  {bannerFormData.image_url && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">4. Image Preview:</span>
                        <div className="flex gap-2">
                          <label className="text-emerald-700 hover:underline cursor-pointer font-bold text-[11px]">
                            Replace Image
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/jpg"
                              onChange={(e) => handleBannerFileUpload(e.target.files?.[0], false)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setBannerFormData({ ...bannerFormData, image_url: '' })}
                            className="text-rose-600 hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-slate-200 h-36 w-full relative bg-slate-900 shadow-inner">
                        <img
                          src={bannerFormData.image_url}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 flex flex-col justify-end text-white">
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded w-fit mb-1">
                            Live Preview
                          </span>
                          <h4 className="font-black text-sm text-white line-clamp-1">{bannerFormData.title || 'Banner Title'}</h4>
                          {bannerFormData.subtitle && (
                            <p className="text-[10px] text-slate-200 line-clamp-1">{bannerFormData.subtitle}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewBannerModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bannerUploadLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save & Activate Banner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT HERO BANNER MODAL (12 FIELDS) ================= */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-600" />
                  Edit Banner #{editingBanner.id}
                </h3>
                <p className="text-slate-500 text-[11px]">Update fields, schedule, and imagery</p>
              </div>
              <button
                onClick={() => setEditingBanner(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bannerFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{bannerFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateBanner} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Banner Name */}
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    1. Banner Name <span className="text-slate-400 font-normal">(Internal identifier)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBanner.name || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 5. Main Heading */}
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    5. Main Heading <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBanner.title}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-sm focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 6. Subtitle */}
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    6. Subtitle <span className="text-slate-400 font-normal">(Optional supporting description)</span>
                  </label>
                  <input
                    type="text"
                    value={editingBanner.subtitle || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 7. Button Text */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    7. Button Text <span className="text-slate-400 font-normal">(CTA text)</span>
                  </label>
                  <input
                    type="text"
                    value={editingBanner.button_text || 'Shop Now'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, button_text: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 8. Redirect URL */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    8. Redirect URL <span className="text-slate-400 font-normal">(Target link)</span>
                  </label>
                  <input
                    type="text"
                    value={editingBanner.link_url || '/products'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, link_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 9. Start Date & Time */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    9. Start Date & Time <span className="text-slate-400 font-normal">(Schedule visibility)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editingBanner.start_date || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, start_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank for immediate visibility</span>
                </div>

                {/* 10. End Date & Time */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    10. End Date & Time <span className="text-slate-400 font-normal">(Expiration)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editingBanner.end_date || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank to never expire</span>
                </div>

                {/* 11. Display Status */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">11. Display Status</label>
                  <select
                    value={editingBanner.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setEditingBanner({ ...editingBanner, is_active: e.target.value === 'active' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="active">Active (Visible to customers)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>

                {/* 12. Display Order */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">12. Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={editingBanner.display_order ?? 0}
                    onChange={(e) => setEditingBanner({ ...editingBanner, display_order: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Lower numbers appear first</span>
                </div>

                {/* 2 & 3. Banner Image Upload or Image URL */}
                <div className="md:col-span-2 space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-slate-800 font-black">
                      2 & 3. Banner Image Source <span className="text-emerald-700">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Upload from device (JPG, PNG, WebP &le; 5MB) OR paste URL
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Direct Upload */}
                    <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 flex flex-col items-center justify-center text-center gap-2 hover:border-emerald-500 transition-colors">
                      <Upload className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Upload New Image</p>
                        <p className="text-[10px] text-slate-500">Replaces current banner image</p>
                      </div>
                      <label className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition-colors">
                        <span>{bannerUploadLoading ? 'Compressing WebP...' : 'Select File from Device'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={(e) => handleBannerFileUpload(e.target.files?.[0], true)}
                          disabled={bannerUploadLoading}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* External URL */}
                    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col justify-center space-y-2">
                      <label className="block text-slate-700 font-bold text-xs">
                        Or External Image URL:
                      </label>
                      <input
                        type="url"
                        value={editingBanner.image_url}
                        onChange={(e) => setEditingBanner({ ...editingBanner, image_url: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400">Direct CDN or web image URL</span>
                    </div>
                  </div>

                  {/* 4. Image Preview */}
                  {editingBanner.image_url && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">4. Image Preview:</span>
                        <div className="flex gap-2">
                          <label className="text-emerald-700 hover:underline cursor-pointer font-bold text-[11px]">
                            Replace Image
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/jpg"
                              onChange={(e) => handleBannerFileUpload(e.target.files?.[0], true)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setEditingBanner({ ...editingBanner, image_url: '' })}
                            className="text-rose-600 hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-slate-200 h-36 w-full relative bg-slate-900 shadow-inner">
                        <img
                          src={editingBanner.image_url}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 flex flex-col justify-end text-white">
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded w-fit mb-1">
                            Live Preview
                          </span>
                          <h4 className="font-black text-sm text-white line-clamp-1">{editingBanner.title}</h4>
                          {editingBanner.subtitle && (
                            <p className="text-[10px] text-slate-200 line-clamp-1">{editingBanner.subtitle}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bannerUploadLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW BANNER SIMULATION MODAL ================= */}
      {viewingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-600" />
                  Homepage Hero Banner Simulation
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Realistic preview of how customers experience this banner on the storefront homepage
                </p>
              </div>
              <button
                onClick={() => setViewingBanner(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Simulated Live Hero Slide */}
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden shadow-xl bg-slate-900 group">
              <img
                src={viewingBanner.image_url}
                alt={viewingBanner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent flex items-center p-6 sm:p-10">
                <div className="max-w-md space-y-3">
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white px-3 py-1 rounded-full shadow-xs">
                    Order #{viewingBanner.display_order ?? 0} • {viewingBanner.position || 'Hero Slider'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                    {viewingBanner.title}
                  </h2>
                  {viewingBanner.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 drop-shadow-xs">
                      {viewingBanner.subtitle}
                    </p>
                  )}
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/30">
                      {viewingBanner.button_text || 'Shop Now'} →
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Metadata Grid */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Internal Name</span>
                <span className="font-bold text-slate-800 truncate block">{viewingBanner.name || viewingBanner.title}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination URL</span>
                <span className="font-mono font-bold text-emerald-700 truncate block">{viewingBanner.link_url || '/products'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Start Date</span>
                <span className="font-medium text-slate-700 block">{formatDisplayDate(viewingBanner.start_date)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">End Date</span>
                <span className="font-medium text-slate-700 block">{formatDisplayDate(viewingBanner.end_date)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Display Order</span>
                <span className="font-mono font-bold text-slate-800 block">#{viewingBanner.display_order ?? 0}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-full ${viewingBanner.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {viewingBanner.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Image Source</span>
                <span className="font-mono text-[10px] text-slate-500 truncate block" title={viewingBanner.image_url}>
                  {viewingBanner.image_url}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingBanner(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  const b = viewingBanner;
                  setViewingBanner(null);
                  setBannerFormError('');
                  setEditingBanner({
                    ...b,
                    name: b.name || b.title,
                    button_text: b.button_text || 'Shop Now',
                    link_url: b.link_url || '/products',
                    start_date: toDatetimeLocal(b.start_date),
                    end_date: toDatetimeLocal(b.end_date),
                    display_order: b.display_order ?? 0,
                    is_active: b.is_active !== undefined ? b.is_active : true
                  });
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Edit className="w-4 h-4" /> Edit This Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      {deleteConfirmBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Delete Hero Banner?</h3>
              <p className="text-slate-500 text-xs">
                Are you sure you want to permanently delete the banner{' '}
                <strong className="text-slate-800 font-bold">"{deleteConfirmBanner.name || deleteConfirmBanner.title}"</strong>?
              </p>
              <p className="text-[11px] text-rose-600 font-semibold pt-1">
                This action cannot be undone and will immediately remove the banner from the customer homepage.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmBanner(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBanner}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                Yes, Delete Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Order #{selectedOrderDetails.order_number}</h3>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Status: <strong className="text-emerald-700">{selectedOrderDetails.status?.replace('_', ' ')}</strong>
                </span>
              </div>
              <button onClick={() => setSelectedOrderDetails(null)} className="text-slate-400 font-bold text-sm">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Customer</span>
                <p className="font-bold text-slate-900">{selectedOrderDetails.customer_name}</p>
                <p className="text-slate-500">{selectedOrderDetails.customer_phone}</p>
                <p className="text-slate-500">{selectedOrderDetails.customer_email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Delivery Address</span>
                <p className="font-medium text-slate-800">{JSON.stringify(selectedOrderDetails.shipping_address)}</p>
                <p className="text-slate-500 font-semibold mt-1">Payment Method: <strong className="uppercase">{selectedOrderDetails.payment_method}</strong></p>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Ordered Items</span>
              <div className="divide-y divide-slate-100 mt-1">
                {selectedOrderDetails.items?.map((item) => (
                  <div key={item.id} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{item.product_name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku} × {item.quantity}</span>
                    </div>
                    <span className="font-black text-slate-900">৳{item.total_price}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                <span>Total Amount</span>
                <span>৳{selectedOrderDetails.total_amount}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Dispatch Document Printable Modal */}
      {generatedDocs && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div onClick={() => setGeneratedDocs(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Generated {generatedDocs.doc_type?.replace('_', ' ')}s ({generatedDocs.batch_count} orders)
              </h3>
              <button onClick={() => setGeneratedDocs(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-4 pr-1 text-xs">
              {generatedDocs.documents?.map((doc, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>SUSHOP DISPATCH #{doc.order_number}</span>
                    <span>Date: {doc.date}</span>
                  </div>
                  <div>
                    <span>Recipient: {doc.customer_name} ({doc.phone})</span>
                    <p className="text-slate-500">{doc.shipping_address}</p>
                  </div>
                  <div className="border-t border-slate-200 pt-1 text-[11px]">
                    <div className="flex justify-between font-bold">
                      <span>Total: ৳{doc.total_amount}</span>
                      <span>Payment: {doc.payment_method?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Batch
              </button>
              <button
                onClick={() => setGeneratedDocs(null)}
                className="bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CATEGORY ADD / EDIT MODAL ================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
                </h3>
                <p className="text-slate-500 text-[11px]">Define taxonomy, display attributes, and parent relationship</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Fruits & Berries"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Custom Slug (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. fresh-fruits"
                    value={categoryFormData.slug}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Parent Category</label>
                  <select
                    value={categoryFormData.parent_id || ''}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, parent_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="">None (Top-Level Root)</option>
                    {categoriesList
                      .filter(c => !editingCategory || c.id !== editingCategory.id)
                      .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Icon Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. apple, shopping-bag"
                    value={categoryFormData.icon}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select
                    value={categoryFormData.is_active ? 'true' : 'false'}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, is_active: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Hidden / Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={categoryFormData.image_url}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, image_url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional category description for SEO & storefront display"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl cursor-pointer shadow-xs"
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BRAND ADD / EDIT MODAL ================= */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Create New Brand'}
                </h3>
                <p className="text-slate-500 text-[11px]">Manage brand identity, logo URL, and slug</p>
              </div>
              <button onClick={() => setShowBrandModal(false)} className="text-slate-400 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pran, Square, Aarong"
                  value={brandFormData.name}
                  onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Custom Slug (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. pran-foods"
                  value={brandFormData.slug}
                  onChange={(e) => setBrandFormData({ ...brandFormData, slug: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Brand Logo URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={brandFormData.logo_url}
                  onChange={(e) => setBrandFormData({ ...brandFormData, logo_url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description of the brand"
                  value={brandFormData.description}
                  onChange={(e) => setBrandFormData({ ...brandFormData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl cursor-pointer shadow-xs"
                >
                  {editingBrand ? 'Update Brand' : 'Save Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= UNIFIED 360° CUSTOMER PROFILE MODAL ================= */}
      {selectedCustomerProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-5 my-8 text-xs">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {selectedCustomerProfile.customer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{selectedCustomerProfile.customer.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {selectedCustomerProfile.customer.segment_tag}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] font-mono">
                    {selectedCustomerProfile.customer.email} • {selectedCustomerProfile.customer.phone || 'No phone'}
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Customer ID #{selectedCustomerProfile.customer.id} • Registered {selectedCustomerProfile.customer.created_at?.slice(0, 10)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerProfile(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 4 Metrics Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Net Lifetime Spend (LTV)</span>
                <p className="text-xl font-black text-emerald-950">৳{selectedCustomerProfile.metrics?.net_ltv || 0}</p>
                <span className="text-[9px] text-emerald-600 block mt-0.5">Deducts refunds & cancelled</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Average Order Value (AOV)</span>
                <p className="text-xl font-black text-slate-900">৳{selectedCustomerProfile.metrics?.aov || 0}</p>
                <span className="text-[9px] text-slate-400 block mt-0.5">Per delivered order</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Lifetime Orders</span>
                <p className="text-xl font-black text-slate-900">{selectedCustomerProfile.metrics?.total_orders || 0}</p>
                <span className="text-[9px] text-slate-400 block mt-0.5">Total orders placed</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Open Returns / RMA</span>
                <p className="text-xl font-black text-slate-900">{selectedCustomerProfile.metrics?.open_returns_count || 0}</p>
                <span className="text-[9px] text-slate-400 block mt-0.5">Active return requests</span>
              </div>
            </div>

            {/* Customer Tags & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-600 mr-1">Assigned Tags:</span>
                {(selectedCustomerProfile.tags || []).map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white border border-slate-200 text-slate-800 shadow-2xs"
                  >
                    <span>{t}</span>
                    <button
                      onClick={() => handleRemoveTag(selectedCustomerProfile.customer.id, t)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer font-black ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={() => {
                  setTagAssignTarget(selectedCustomerProfile.customer);
                  setSelectedTagToAssign(crmTags[0]?.name || 'VIP');
                }}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl cursor-pointer"
              >
                + Assign New Tag
              </button>
            </div>

            {/* Lifetime Orders Section */}
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-emerald-600" /> Order History ({selectedCustomerProfile.orders?.length || 0})
              </h4>
              <div className="overflow-x-auto max-h-48 border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-2.5">Order #</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Items</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedCustomerProfile.orders || []).map((o) => (
                      <tr key={o.order_number} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{o.order_number}</td>
                        <td className="p-2.5 text-slate-400 font-mono text-[11px]">{o.created_at?.slice(0, 10)}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                            {o.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {o.items?.map(it => `${it.product_name} (${it.quantity})`).join(', ') || 'No item details'}
                        </td>
                        <td className="p-2.5 text-right font-black text-slate-900">৳{o.total_amount}</td>
                      </tr>
                    ))}
                    {(selectedCustomerProfile.orders || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-slate-400 italic">No orders placed by this customer yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chronological Unified Activity Timeline */}
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" /> Chronological Activity Timeline
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(selectedCustomerProfile.activity_timeline || []).map((ev, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-700 font-mono">
                        {ev.event_type}
                      </span>
                      <span className="font-semibold text-slate-800">{ev.summary}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{ev.timestamp?.slice(0, 16)}</span>
                  </div>
                ))}
                {(selectedCustomerProfile.activity_timeline || []).length === 0 && (
                  <p className="text-xs text-slate-400 italic py-2">No activity events recorded.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedCustomerProfile(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Close 360° Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ASSIGN TAG MODAL ================= */}
      {tagAssignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm">Assign Tag to {tagAssignTarget.name}</h3>
              <button onClick={() => setTagAssignTarget(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleAssignTag} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Select Tag</label>
                <select
                  value={selectedTagToAssign}
                  onChange={(e) => setSelectedTagToAssign(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                >
                  <option value="">-- Choose a Tag --</option>
                  {crmTags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTagAssignTarget(null)}
                  className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedTagToAssign}
                  className="bg-emerald-600 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Assign Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ACCOUNT DELETION REQUEST MODAL ================= */}
      {deletionModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-rose-700 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Request Account Anonymization
              </h3>
              <button onClick={() => setDeletionModalCustomer(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <p className="text-slate-600">
              You are logging an account deletion/anonymization request for customer <strong>{deletionModalCustomer.name}</strong> ({deletionModalCustomer.email}).
            </p>
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              Note: This initiates the compliance workflow. Approval anonymizes personal identity (name, email, phone) while preserving ledger orders for tax and accounting records.
            </p>
            <form onSubmit={handleRequestDeletion} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Deletion Request</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. User requested account deletion under GDPR / privacy policy"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletionModalCustomer(null)}
                  className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
