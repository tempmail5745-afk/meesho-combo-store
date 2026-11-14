import React from 'react';
import Link from 'next/link';
import { useCart } from '../lib/cartContext';

export default function CartDrawer() {
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="drawer-overlay"
        style={{ display: 'block' }}
        onClick={closeDrawer}
      />

      {/* Sidenav */}
      <div id="mySidenav" className="sidenav" style={{ width: '380px' }}>
        <div className="sidenav-div">
          <div className="drawer__title">
            <h3 className="ui2-heading">
              Order Summary ({cart.reduce((s, i) => s + (parseInt(i.qty) || 1), 0)} items)
            </h3>
            <button
              type="button"
              className="drawer__close-btn"
              onClick={closeDrawer}
              title="Close"
            >
              &times;
            </button>
          </div>

          <div className="drawer__body" id="cartDrawerBody">
            {cart.length === 0 ? (
              <div className="empty-cart-view" style={{ padding: '40px 14px', textAlign: 'center' }}>
                <p className="empty-cart-text" style={{ fontSize: '15px', color: '#666', marginBottom: '14px' }}>
                  Your cart is empty.
                </p>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="start-shopping-btn"
                  style={{
                    background: '#9f2089',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}
                >
                  Start shopping
                </button>
              </div>
            ) : (
              cart.map(item => {
                const formattedQty = item.qty < 10 ? `0${item.qty}` : item.qty;
                const freeQty = freeMap[item.id] || 0;

                return (
                  <div className="cart-product" key={item.id}>
                    <div className="cart-product-img">
                      <img src={item.image} alt={item.title} />
                    </div>
                    <div className="cart-product-details">
                      <div className="cart-product-title">
                        <p>{item.title}</p>
                        <button
                          type="button"
                          className="remove-cart-item-btn"
                          onClick={() => removeFromCart(item.id)}
                          title="Remove"
                        >
                          <img
                            src="/trash-icon.png"
                            alt="remove"
                            className="remove-cart-icon"
                          />
                        </button>
                      </div>
                      <div className="cart-product-pricing">
                        <p className="cart-product-price">₹{item.price}.00</p>
                        <span className="cart-product-mrp">₹{item.originalPrice}.00</span>
                      </div>
                      <div className="cart-product-description">
                        <p className="cart-product-color">Qty: {formattedQty}</p>
                        <div className="cart-qty-wrapper">
                          <span
                            className="minus"
                            onClick={() => updateQty(item.id, (parseInt(item.qty) || 1) - 1)}
                          >
                            -
                          </span>
                          <span className="num">{formattedQty}</span>
                          <span
                            className="plus"
                            onClick={() => updateQty(item.id, (parseInt(item.qty) || 1) + 1)}
                          >
                            +
                          </span>
                        </div>
                      </div>
                      {freeQty > 0 && (
                        <div className="cart-free-message" style={{ color: '#038d63', fontSize: '12px', marginTop: '4px' }}>
                          Offer: Buy 2 Get 1 Free 🎁 <br />
                          You got <strong style={{ color: '#ff0000' }}>{freeQty}</strong> item(s) free!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart__footer" id="cartDrawerFooter">
              <div className="cart__price__details">
                <div className="cart__breakup__inner">
                  <div className="cart__total">
                    <span>Total Product Price:</span>
                    <span>₹{totalMrp.toFixed(2)}</span>
                  </div>
                  <div className="cart__total" style={{ color: '#038d63' }}>
                    <span>Discount:</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="shipping__total">
                    <span>Shipping:</span>
                    <span className="free-shipping-tag">FREE</span>
                  </div>
                  <div className="mc_pay__total">
                    <span>To Pay :</span>
                    <span className="cartTotalAmount">₹{finalPayable.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="checkout-btn-wrap" style={{ padding: '12px 14px' }}>
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="btn-checkout-now"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#9f2089',
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '14px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '15px'
                  }}
                >
                  Proceed to Checkout • ₹{finalPayable.toFixed(2)} ➔
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
