import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // 1. Customer Authentication Session (Independent)
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sushop_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [customerToken, setCustomerToken] = useState(() => localStorage.getItem('sushop_customer_token'));

  // 2. Administrator Authentication Session (Independent)
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sushop_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('sushop_admin_token') || localStorage.getItem('sushop_token'));

  const [loading, setLoading] = useState(true);

  // Initialize Administrator Session in background
  useEffect(() => {
    if (adminToken) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Invalid or expired admin session');
        return res.json();
      })
      .then(u => {
        const staffRoles = ['super_admin', 'admin', 'product_manager', 'order_manager', 'customer_support', 'operator'];
        if (staffRoles.includes(u.role)) {
          setAdminUser(u);
          localStorage.setItem('sushop_admin_user', JSON.stringify(u));
          localStorage.setItem('sushop_admin_token', adminToken);
          localStorage.removeItem('sushop_token');
        } else {
          // If a non-staff user token was in admin slot, clear it
          localStorage.removeItem('sushop_admin_token');
          localStorage.removeItem('sushop_admin_user');
          localStorage.removeItem('sushop_token');
          setAdminToken(null);
          setAdminUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('sushop_admin_token');
        localStorage.removeItem('sushop_admin_user');
        localStorage.removeItem('sushop_token');
        setAdminToken(null);
        setAdminUser(null);
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [adminToken]);

  // Initialize Customer Session in background
  useEffect(() => {
    if (customerToken) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Invalid customer session');
        return res.json();
      })
      .then(u => {
        setCustomerUser(u);
        localStorage.setItem('sushop_customer_user', JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem('sushop_customer_token');
        localStorage.removeItem('sushop_customer_user');
        setCustomerToken(null);
        setCustomerUser(null);
      });
    }
  }, [customerToken]);

  // Customer Actions
  const customerLogin = async (email, password) => {
    const data = await api.customerLogin(email, password);
    localStorage.setItem('sushop_customer_token', data.access_token);
    localStorage.setItem('sushop_customer_user', JSON.stringify(data.user));
    setCustomerToken(data.access_token);
    setCustomerUser(data.user);
    return data.user;
  };

  const customerRegister = async (payload) => {
    const data = await api.register(payload);
    localStorage.setItem('sushop_customer_token', data.access_token);
    localStorage.setItem('sushop_customer_user', JSON.stringify(data.user));
    setCustomerToken(data.access_token);
    setCustomerUser(data.user);
    return data.user;
  };

  const customerLogout = () => {
    if (customerToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${customerToken}` }
      }).catch(() => {});
    }
    localStorage.removeItem('sushop_customer_token');
    localStorage.removeItem('sushop_customer_user');
    setCustomerToken(null);
    setCustomerUser(null);
  };

  // Administrator Actions
  const adminLogin = async (email, password) => {
    const data = await api.adminLogin(email, password);
    localStorage.setItem('sushop_admin_token', data.access_token);
    localStorage.setItem('sushop_admin_user', JSON.stringify(data.user));
    localStorage.removeItem('sushop_token');
    setAdminToken(data.access_token);
    setAdminUser(data.user);
    return data;
  };

  const adminLogout = () => {
    if (adminToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    localStorage.removeItem('sushop_admin_token');
    localStorage.removeItem('sushop_admin_user');
    localStorage.removeItem('sushop_token');
    setAdminToken(null);
    setAdminUser(null);
  };

  const isStaff = Boolean(adminUser && ['super_admin', 'admin', 'product_manager', 'order_manager', 'customer_support', 'operator'].includes(adminUser.role));
  const isSuperAdmin = Boolean(adminUser && (adminUser.role === 'super_admin' || adminUser.role === 'admin'));

  return (
    <AuthContext.Provider value={{
      // Customer Portal Context:
      user: customerUser, // Customer storefront ONLY sees customerUser! (null for guests)
      customerUser,
      customerToken,
      login: customerLogin,
      register: customerRegister,
      logout: customerLogout,

      // Administrator Portal Context:
      adminUser,
      adminToken,
      adminLogin,
      adminLogout,
      isStaff,
      isSuperAdmin,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
