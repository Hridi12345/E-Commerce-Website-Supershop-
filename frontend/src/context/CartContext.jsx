import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api';

const CartContext = createContext();

export function CartProvider({ children, onNavigate }) {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('doorbaz_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [abandonmentNotice, setAbandonmentNotice] = useState(null);

  useEffect(() => {
    localStorage.setItem('doorbaz_cart', JSON.stringify(items));
  }, [items]);

  // Cart abandonment trigger simulation: notify if cart has items and user hasn't checked out
  useEffect(() => {
    if (items.length > 0 && !abandonmentNotice) {
      const timer = setTimeout(() => {
        setAbandonmentNotice("🔥 Don't miss out! Complete your fresh essentials order before your reserved stock expires.");
      }, 45000); // 45 seconds trigger
      return () => clearTimeout(timer);
    }
  }, [items, abandonmentNotice]);

  const addToCart = (product, variant = null, quantity = 1, customRedirect = null) => {
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

    setItems(prev => {
      const variantId = variant ? variant.id : null;
      const sku = variant ? variant.sku : product.sku;
      const price = variant && variant.price_override ? variant.price_override : (product.sale_price || product.base_price);
      const variantDetails = variant ? Object.entries(variant.attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ') : null;

      const existingIndex = prev.findIndex(item => item.product_id === product.id && item.variant_id === variantId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        const img = (variant && variant.image_url) || (product.images && product.images[0]) || product.thumbnail;
        return [...prev, {
          product_id: product.id,
          variant_id: variantId,
          name: product.name,
          sku: sku,
          price: price,
          quantity: quantity,
          image: img,
          variant_details: variantDetails,
          all_variants: product.variants || []
        }];
      }
    });
    setIsMiniCartOpen(true);
  };

  const updateQuantity = (productId, variantId, qty) => {
    if (qty <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setItems(prev => prev.map(item => {
      if (item.product_id === productId && item.variant_id === variantId) {
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const modifyVariant = (productId, oldVariantId, newVariant) => {
    setItems(prev => prev.map(item => {
      if (item.product_id === productId && item.variant_id === oldVariantId) {
        const details = Object.entries(newVariant.attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
        return {
          ...item,
          variant_id: newVariant.id,
          sku: newVariant.sku,
          price: newVariant.price_override || item.price,
          variant_details: details,
          image: newVariant.image_url || item.image
        };
      }
      return item;
    }));
  };

  const removeItem = (productId, variantId) => {
    setItems(prev => prev.filter(item => !(item.product_id === productId && item.variant_id === variantId)));
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
    setAbandonmentNotice(null);
    localStorage.removeItem('doorbaz_cart');
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Free shipping over 1000 BDT
  const freeShippingThreshold = 1000;
  const standardShippingFee = 60;
  const shippingFee = subtotal >= freeShippingThreshold || items.length === 0 ? 0 : standardShippingFee;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);

  // Coupon application
  const applyCoupon = async (code) => {
    setCouponError(null);
    try {
      const res = await api.validateCoupon(code, subtotal);
      setCoupon(res);
      return res;
    } catch (err) {
      setCouponError(err.message);
      setCoupon(null);
      throw err;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
  };

  const discountAmount = coupon ? coupon.calculated_discount : 0;
  const taxAmount = Math.round((Math.max(0, subtotal - discountAmount) * 0.05) * 100) / 100; // 5% VAT
  const totalAmount = Math.round((Math.max(0, subtotal - discountAmount) + shippingFee + taxAmount) * 100) / 100;

  return (
    <CartContext.Provider value={{
      items,
      isMiniCartOpen,
      setIsMiniCartOpen,
      addToCart,
      updateQuantity,
      modifyVariant,
      removeItem,
      clearCart,
      subtotal,
      totalItemCount,
      shippingFee,
      freeShippingThreshold,
      freeShippingRemaining,
      taxAmount,
      totalAmount,
      coupon,
      couponError,
      discountAmount,
      applyCoupon,
      removeCoupon,
      abandonmentNotice,
      dismissAbandonmentNotice: () => setAbandonmentNotice(null)
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

