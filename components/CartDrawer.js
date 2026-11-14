import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../lib/cartContext';

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    isDrawerOpen,
    closeDrawer,
    updateQty,
    removeFromCart,
    calculateCartTotals
  } = useCart();

  if (!isDrawerOpen) return null;

  const { totalAmount, totalMrp, discountAmount, freeMap, finalPayable } = calculateCartTotals();
  const totalItemsCount = cart.reduce((s, i) => s + (parseInt(i.qty) || 1), 0);

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="drawer-overlay active"
        style={{
          display: 'block',
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          zIndex: 999998,
          backdropFilter: 'blur(2px)',
          transition: 'opacity 0.25s ease'
        }}
        onClick={closeDrawer}
      />

      {/* Slide-out Cart Drawer Sidenav */}
      <div
        id="mySidenav"
        className="sidenav open"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          backgroundColor: '#ffffff',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-6px 0 25px rgba(0, 0, 0, 0.15)',
          transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          className="sidenav-div"
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid #ebebf2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🛍️</span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1a1a1a' }}>
              Your Cart ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
            </h3>
          </div>
          <button
            type="button"
            className="closebtn"
            onClick={closeDrawer}
            title="Close Cart"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '26px',
              lineHeight: 1,
              color: '#555',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '50%'
            }}
          >
            &times;
          </button>
        </div>

        {/* Cart Body */}
        <div
          className="cart-products-list"
          id="cartDrawerBody"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            backgroundColor: '#f8fafc'
          }}
        >
          {cart.length === 0 ? (
            <div className="empty-cart-view" style={{ padding: '60px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: '50px', display: 'block', marginBottom: '14px' }}>🛒</span>
              <p className="empty-cart-text" style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px' }}>
                Your cart is empty!
              </p>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>
                Explore our popular combos starting from ₹149.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  router.push('/home');
                }}
                className="start-shopping-btn"
                style={{
                  background: '#9f2089',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Start Shopping ➔
              </button>
            </div>
          ) : (
            <>
              {/* Buy 2 Get 1 Free Promo Strip */}
              <div
                style={{
                  background: '#e8f7f1',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginBottom: '12px',
                  fontSize: '12px',
                  color: '#038d63',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>⚡</span>
                <span>Buy 2 Get 1 Free active! Extra ₹33 off on UPI.</span>
              </div>

              {cart.map((item) => {
                const formattedQty = item.qty < 10 ? `0${item.qty}` : item.qty;
                const freeQty = freeMap[item.id] || 0;

                return (
                  <div
                    className="cart-product"
                    key={item.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '10px',
                      padding: '12px',
                      marginBottom: '10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      gap: '12px'
                    }}
                  >
                    <div
                      className="cart-product-img"
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#f1f5f9',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div className="cart-product-details" style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="cart-product-title"
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '6px'
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#1e293b',
                            lineHeight: 1.3
                          }}
                        >
                          {item.title}
                        </p>
                        <button
                          type="button"
                          className="remove-cart-item-btn"
                          onClick={() => removeFromCart(item.id)}
                          title="Remove item"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            opacity: 0.7
                          }}
                        >
                          <img
                            src="/trash-icon.png"
                            alt="remove"
                            style={{ width: '16px', height: '16px' }}
                          />
                        </button>
                      </div>

                      <div className="cart-product-pricing" style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#1e293b' }}>
                          ₹{item.price}.00
                        </span>
                        <span style={{ fontSize: '12px', textDecoration: 'line-through', color: '#94a3b8' }}>
                          ₹{item.originalPrice}.00
                        </span>
                        {item.size && (
                          <span style={{ fontSize: '10.5px', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px' }}>
                            {item.size}
                          </span>
                        )}
                      </div>

                      <div
                        className="cart-product-description"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '6px'
                        }}
                      >
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                          Qty: {formattedQty}
                        </span>
                        <div
                          className="cart-qty-wrapper"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            background: '#fff'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, (parseInt(item.qty) || 1) - 1)}
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: '2px 8px',
                              cursor: 'pointer',
                              fontWeight: '700',
                              color: '#475569'
                            }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: '12px', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>
                            {formattedQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, (parseInt(item.qty) || 1) + 1)}
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: '2px 8px',
                              cursor: 'pointer',
                              fontWeight: '700',
                              color: '#475569'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {freeQty > 0 && (
                        <div
                          style={{
                            color: '#038d63',
                            fontSize: '11px',
                            marginTop: '6px',
                            fontWeight: '700',
                            background: '#ecfdf5',
                            padding: '3px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          🎁 Combo Benefit: {freeQty} unit(s) FREE!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div
            className="cart__footer"
            id="cartDrawerFooter"
            style={{
              background: '#ffffff',
              borderTop: '1px solid #ebebf2',
              padding: '14px 18px',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <div className="cart__breakup__inner" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                <span>Total Product MRP:</span>
                <span>₹{totalMrp.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#038d63', fontWeight: '700', marginBottom: '4px' }}>
                <span>Offer Discount:</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                <span>Delivery:</span>
                <span style={{ color: '#038d63', fontWeight: '700' }}>FREE</span>
              </div>
              <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                <span>To Pay:</span>
                <span style={{ color: '#9f2089' }}>₹{finalPayable.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="btn-checkout-now"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#9f2089',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '13px 20px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14.5px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              Proceed to Checkout • ₹{finalPayable.toFixed(2)} ➔
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
