import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Header from './components/Header';
import Footer from './components/Footer';
import MiniCartDrawer from './components/MiniCartDrawer';
import QuickViewModal from './components/QuickViewModal';

import HomePage from './pages/storefront/HomePage';
import ProductListingPage from './pages/storefront/ProductListingPage';
import ProductDetailPage from './pages/storefront/ProductDetailPage';
import CartPage from './pages/storefront/CartPage';
import CheckoutPage from './pages/storefront/CheckoutPage';
import CustomerPortalPage from './pages/storefront/CustomerPortalPage';
import CustomerAuthPage from './pages/storefront/CustomerAuthPage';
import { ContentPageView, StoreLocatorView, FAQHubView } from './pages/storefront/InstitutionalPages';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import { api } from './api';

function parseRoute(pathname) {
  // 1. Admin Portal Routes
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || pathname === '/admin/login/') {
      return { portal: 'admin', page: 'admin-login' };
    }
    const cleanPath = pathname.replace('/admin', '').replace(/^\/+/, '');
    const tab = cleanPath.split('/')[0] || 'dashboard';
    return { portal: 'admin', page: 'admin-panel', tab };
  }

  // 2. Customer Storefront Routes
  if (pathname === '/' || pathname === '') {
    return { portal: 'storefront', page: 'home' };
  }
  if (pathname === '/login' || pathname === '/login/') {
    return { portal: 'storefront', page: 'login', mode: 'login' };
  }
  if (pathname === '/register' || pathname === '/register/') {
    return { portal: 'storefront', page: 'register', mode: 'register' };
  }
  if (pathname === '/cart' || pathname === '/cart/') {
    return { portal: 'storefront', page: 'cart' };
  }
  if (pathname === '/checkout' || pathname === '/checkout/') {
    return { portal: 'storefront', page: 'checkout' };
  }
  if (pathname === '/products' || pathname === '/products/') {
    return { portal: 'storefront', page: 'plp' };
  }
  if (pathname.startsWith('/products/')) {
    const slug = pathname.replace('/products/', '').split('/')[0];
    return { portal: 'storefront', page: 'pdp', slug };
  }
  if (pathname === '/my-account' || pathname === '/my-account/') {
    return { portal: 'storefront', page: 'portal', tab: 'overview' };
  }
  if (pathname === '/my-account/orders' || pathname === '/my-account/orders/') {
    return { portal: 'storefront', page: 'portal', tab: 'orders' };
  }
  if (pathname === '/my-account/profile' || pathname === '/my-account/profile/') {
    return { portal: 'storefront', page: 'portal', tab: 'profile' };
  }
  if (pathname === '/my-account/wishlist' || pathname === '/my-account/wishlist/') {
    return { portal: 'storefront', page: 'portal', tab: 'wishlist' };
  }
  if (pathname === '/store-locator' || pathname === '/store-locator/') {
    return { portal: 'storefront', page: 'locator' };
  }
  if (pathname === '/faq' || pathname === '/faq/') {
    return { portal: 'storefront', page: 'faq' };
  }
  if (pathname === '/about-us' || pathname === '/privacy-policy' || pathname === '/terms-of-service') {
    return { portal: 'storefront', page: 'page', slug: pathname.replace('/', '') };
  }

  // Fallback to home
  return { portal: 'storefront', page: 'home' };
}

function MainApp() {
  const { user, isStaff, adminUser, adminLogout, logout } = useAuth();
  const [currentRoute, setCurrentRoute] = useState(() => parseRoute(window.location.pathname));
  const [routeParams, setRouteParams] = useState({});
  const [quickViewSlug, setQuickViewSlug] = useState(null);

  // Sync with browser URL navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRoute(window.location.pathname);
      setCurrentRoute(parsed);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Track site visit session for genuine analytics conversion calculation
  useEffect(() => {
    let sessId = sessionStorage.getItem('sushop_session_id');
    if (!sessId) {
      sessId = 'sess_' + Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem('sushop_session_id', sessId);
    }
    api.trackSiteVisit(sessId, window.location.pathname).catch(() => { });
  }, [currentRoute]);

  const navigateTo = (target, param = {}) => {
    let targetUrl = '/';

    if (target.startsWith('/')) {
      targetUrl = target;
    } else {
      switch (target) {
        case 'home':
          targetUrl = '/';
          break;
        case 'login':
          targetUrl = '/login';
          break;
        case 'register':
          targetUrl = '/register';
          break;
        case 'cart':
          targetUrl = '/cart';
          break;
        case 'checkout':
          targetUrl = '/checkout';
          break;
        case 'products':
        case 'plp':
          targetUrl = '/products';
          break;
        case 'pdp':
          targetUrl = `/products/${param.slug || param.id || ''}`;
          break;
        case 'my-account':
        case 'portal':
          targetUrl = param.tab && param.tab !== 'overview' ? `/my-account/${param.tab}` : '/my-account';
          break;
        case 'admin':
        case 'admin-dashboard':
          targetUrl = '/admin/dashboard';
          break;
        case 'admin-login':
          targetUrl = '/admin/login';
          break;
        case 'admin-tab':
          targetUrl = `/admin/${param.tab || 'dashboard'}`;
          break;
        case 'locator':
          targetUrl = '/store-locator';
          break;
        case 'faq':
          targetUrl = '/faq';
          break;
        case 'page':
          targetUrl = `/${param.slug || 'terms-of-service'}`;
          break;
        default:
          targetUrl = '/';
      }
    }

    window.history.pushState({}, '', targetUrl);
    const parsed = parseRoute(targetUrl);
    setCurrentRoute(parsed);
    setRouteParams(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = () => {
    adminLogout();
    navigateTo('/admin/login');
  };

  const handleAdminLoginSuccess = (loggedInUser) => {
    const role = loggedInUser?.role;
    let targetTab = 'dashboard';
    if (role === 'product_manager') {
      targetTab = 'products';
    } else if (role === 'order_manager' || role === 'operator') {
      targetTab = 'orders';
    } else if (role === 'customer_support') {
      targetTab = 'customers';
    } else {
      targetTab = 'dashboard';
    }
    navigateTo(`/admin/${targetTab}`);
  };

  // ----------------- ADMIN PORTAL -----------------
  if (currentRoute.portal === 'admin') {
    // If not logged in as staff and trying to access admin pages, redirect to /admin/login
    if (!isStaff && currentRoute.page !== 'admin-login') {
      return (
        <AdminLoginPage
          onExitAdmin={() => navigateTo('/')}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      );
    }

    if (currentRoute.page === 'admin-login') {
      // If already signed in as staff, return directly to management dashboard without re-prompting login
      if (isStaff) {
        const role = adminUser?.role;
        const targetTab = role === 'product_manager' ? 'products' : (role === 'order_manager' || role === 'operator' ? 'orders' : 'dashboard');
        return (
          <AdminLayout
            initialTab={targetTab}
            onExitAdmin={() => navigateTo('/')}
            onLogout={handleAdminLogout}
            onNavigateAdmin={(tab) => navigateTo(`/admin/${tab}`)}
          />
        );
      }
      return (
        <AdminLoginPage
          onExitAdmin={() => navigateTo('/')}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      );
    }

    // Authenticated Admin Portal with requested module tab
    return (
      <AdminLayout
        initialTab={currentRoute.tab || 'dashboard'}
        onExitAdmin={() => navigateTo('/')}
        onLogout={handleAdminLogout}
        onNavigateAdmin={(tab) => navigateTo(`/admin/${tab}`)}
      />
    );
  }

  // ----------------- CUSTOMER STOREFRONT -----------------
  const isAuthPage = currentRoute.page === 'login' || currentRoute.page === 'register';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full">
      {!isAuthPage && (
        <Header
          onNavigate={navigateTo}
          currentPage={currentRoute.page}
          currentParam={routeParams}
        />
      )}

      <main className="flex-1 w-full pb-16 md:pb-0">
        {currentRoute.page === 'home' && (
          <HomePage
            onNavigate={navigateTo}
            onQuickView={(slug) => setQuickViewSlug(slug)}
          />
        )}

        {currentRoute.page === 'login' && (
          <CustomerAuthPage
            initialMode="login"
            onNavigate={navigateTo}
          />
        )}

        {currentRoute.page === 'register' && (
          <CustomerAuthPage
            initialMode="register"
            onNavigate={navigateTo}
          />
        )}

        {currentRoute.page === 'plp' && (
          <ProductListingPage
            key={JSON.stringify(routeParams)}
            initialParams={routeParams}
            onNavigate={navigateTo}
            onQuickView={(slug) => setQuickViewSlug(slug)}
          />
        )}

        {currentRoute.page === 'pdp' && (
          <ProductDetailPage
            key={currentRoute.slug || routeParams.slug}
            productSlug={currentRoute.slug || routeParams.slug}
            onNavigate={navigateTo}
            onQuickView={(slug) => setQuickViewSlug(slug)}
          />
        )}

        {currentRoute.page === 'cart' && (
          <CartPage onNavigate={navigateTo} />
        )}

        {currentRoute.page === 'checkout' && (
          <CheckoutPage onNavigate={navigateTo} />
        )}

        {currentRoute.page === 'portal' && (
          <CustomerPortalPage
            initialTab={currentRoute.tab || routeParams.tab || 'overview'}
            onNavigate={navigateTo}
          />
        )}

        {currentRoute.page === 'locator' && (
          <StoreLocatorView />
        )}

        {currentRoute.page === 'faq' && (
          <FAQHubView />
        )}

        {currentRoute.page === 'page' && (
          <ContentPageView slug={currentRoute.slug || routeParams.slug || 'terms-of-service'} />
        )}
      </main>

      {!isAuthPage && <Footer onNavigate={navigateTo} />}

      {/* Mini-Cart Drawer */}
      <MiniCartDrawer onNavigate={navigateTo} />

      {/* Quick-View Modal */}
      {quickViewSlug && (
        <QuickViewModal
          productSlug={quickViewSlug}
          onClose={() => setQuickViewSlug(null)}
          onNavigate={navigateTo}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <MainApp />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
