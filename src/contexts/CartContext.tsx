import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Product } from '@/types/product';
import { trackAddToCart } from '@/services/personalization';
import { demoLog } from '@/services/demoLog';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  /** Mark the cart as converted (purchase completed) */
  markConverted: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Cart persistence to Salesforce Cart__c ─────────────────────────

const SESSION_ID_KEY = 'cart-session-id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

async function persistCart(items: CartItem[], subtotal: number) {
  try {
    await fetch('/api/sf/cart/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: getSessionId(),
        items: items.map(i => ({
          productId: i.product.id,
          salesforceId: i.product.salesforceId,
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
        })),
        subtotal,
      }),
    });
  } catch (err) {
    console.warn('[cart] Persist failed:', err);
  }
}

async function convertCartOnServer() {
  try {
    await fetch('/api/sf/cart/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: getSessionId() }),
    });
  } catch (err) {
    console.warn('[cart] Convert failed:', err);
  }
}

// ─── Provider ───────────────────────────────────────────────────────

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced persist — saves to Salesforce 3s after last change
  const schedulePersist = useCallback((newItems: CartItem[], newSubtotal: number) => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      if (newItems.length > 0) {
        persistCart(newItems, newSubtotal);
        demoLog.log({
          category: 'commerce',
          title: 'Cart Synced to Salesforce',
          subtitle: `${newItems.length} items, $${newSubtotal.toFixed(2)}`,
        });
      }
    }, 3000);
  }, []);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      let next: CartItem[];
      if (existing) {
        next = prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        next = [...prev, { product, quantity }];
      }
      const sub = next.reduce((s, i) => s + i.product.price * i.quantity, 0);
      schedulePersist(next, sub);
      return next;
    });
    // Track in SF Personalization for real-time abandonment signals
    trackAddToCart(product.id, product.name, product.price, product.salesforceId);
  }, [schedulePersist]);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.product.id !== productId);
      const sub = next.reduce((s, i) => s + i.product.price * i.quantity, 0);
      schedulePersist(next, sub);
      return next;
    });
  }, [schedulePersist]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) => {
      const next = prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      const sub = next.reduce((s, i) => s + i.product.price * i.quantity, 0);
      schedulePersist(next, sub);
      return next;
    });
  }, [removeItem, schedulePersist]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
  }, []);

  const markConverted = useCallback(() => {
    convertCartOnServer();
    setItems([]);
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
  }, []);

  const isInCart = useCallback(
    (productId: string) => items.some((item) => item.product.id === productId),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  useEffect(() => {
    return () => { if (persistTimerRef.current) clearTimeout(persistTimerRef.current); };
  }, []);

  return (
    <CartContext.Provider
      value={{
        items, itemCount, subtotal,
        addItem, removeItem, updateQuantity, clearCart, isInCart, markConverted,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
