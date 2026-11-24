import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api';

const WishlistContext = createContext();

export function WishlistProvider({ children, onNavigate }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      api.getWishlist()
        .then(items => {
          setWishlist(Array.isArray(items) ? items : []);
        })
        .catch(() => {
          setWishlist([]);
        })
        .finally(() => setLoading(false));
    } else {
      setWishlist([]);
    }
  }, [user]);

  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlist.some(item => (item.product_id === productId || item.id === productId));
  };

  const toggleWishlist = async (product, customRedirect = null) => {
    if (!user) {
      if (customRedirect) {
        customRedirect();
      } else if (onNavigate) {
        onNavigate('login');
      } else {
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      return false;
    }

    const productId = product?.id || product?.product_id;
    if (!productId) return false;

    try {
      const res = await api.toggleWishlist(productId);
      if (res && res.action === 'removed') {
        setWishlist(prev => prev.filter(item => (item.product_id !== productId && item.id !== productId)));
      } else {
        // Added or re-fetch
        api.getWishlist().then(items => {
          setWishlist(Array.isArray(items) ? items : []);
        }).catch(() => {});
      }
      return true;
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
      return false;
    }
  };

  return (
    <WishlistContext.Provider value={{
      wishlist,
      wishlistCount: wishlist.length,
      isInWishlist,
      toggleWishlist,
      loading
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    return {
      wishlist: [],
      wishlistCount: 0,
      isInWishlist: () => false,
      toggleWishlist: () => {},
      loading: false
    };
  }
  return context;
}
