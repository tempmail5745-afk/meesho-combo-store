import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'meesho_cart_v1';

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch (_) {}
  }, []);

  // Save to localStorage on change
  const saveCart = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
    } catch (_) {}
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 2500);
  };

  const addToCart = (product, open = true) => {
    let currentCart = [...cart];
    const existingIndex = currentCart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      currentCart[existingIndex].qty = (parseInt(currentCart[existingIndex].qty) || 1) + 1;
    } else {
      currentCart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        qty: 1,
        color: product.color || 'Standard',
        size: product.sizes ? product.sizes[0] : 'Free Size'
      });
    }

    saveCart(currentCart);
    showToast('Product added to your cart! 🛍️');

    if (typeof window !== 'undefined' && window.fbq) {
      try {
        window.fbq('track', 'AddToCart', {
          content_name: product.title,
          content_ids: [String(product.id)],
          content_type: 'product',
          value: product.price,
          currency: 'INR'
        });
      } catch (_) {}
    }

    if (open) {
      setIsDrawerOpen(true);
    }
  };

  const buyNow = (product, router) => {
    addToCart(product, false);
    if (router) {
      router.push(`/checkout?id=${product.id}`);
    } else if (typeof window !== 'undefined') {
      window.location.href = `/checkout?id=${product.id}`;
    }
  };

  const updateQty = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    const updated = cart.map(item => item.id === id ? { ...item, qty: newQty } : item);
    saveCart(updated);
  };

  const removeFromCart = (id) => {
    const updated = cart.filter(item => item.id !== id);
    saveCart(updated);
    showToast('Item removed from cart');
  };

  const clearCart = () => {
    saveCart([]);
  };

  const calculateCartTotals = () => {
    let totalQty = 0;
    cart.forEach(p => {
      totalQty += parseInt(p.qty || 1);
    });

    const freeCount = Math.floor(totalQty / 3);

    let flat = [];
    cart.forEach(p => {
      const q = parseInt(p.qty || 1);
      for (let i = 0; i < q; i++) {
        flat.push({ ...p });
      }
    });

    flat.sort((a, b) => a.price - b.price);
    const freeUnits = flat.slice(0, freeCount);

    let calculatedTotal = 0;
    let totalMrp = 0;
    const freeMap = {};

    cart.forEach(item => {
      const freeForItem = freeUnits.filter(f => f.id === item.id).length;
      freeMap[item.id] = freeForItem;
      const paidQty = (parseInt(item.qty || 1)) - freeForItem;
      const itemOriginalPrice = parseFloat(item.originalPrice) || (item.price * 2);

      calculatedTotal += item.price * paidQty;
      totalMrp += itemOriginalPrice * (parseInt(item.qty || 1));
    });

    const finalPayable = Math.max(1, calculatedTotal);
    const discountAmount = Math.max(0, totalMrp - finalPayable);

    return {
      totalQty,
      freeCount,
      freeMap,
      totalMrp,
      totalAmount: calculatedTotal,
      discountAmount,
      finalPayable
    };
  };

  const totalCartCount = cart.reduce((sum, item) => sum + (parseInt(item.qty) || 1), 0);

  return (
    <CartContext.Provider value={{
      cart,
      totalCartCount,
      isDrawerOpen,
      openDrawer: () => setIsDrawerOpen(true),
      closeDrawer: () => setIsDrawerOpen(false),
      addToCart,
      buyNow,
      updateQty,
      removeFromCart,
      clearCart,
      calculateCartTotals,
      showToast,
      toastMessage,
      isToastVisible
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

