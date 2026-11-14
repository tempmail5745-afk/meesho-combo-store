import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../lib/cartContext';
import { getProductById } from '../lib/products';
import {
  DEFAULT_PAYEE_VPA,
  DEFAULT_PAYEE_NAME,
  DEFAULT_TRANSACTION_NOTE,
  detectPlatform,
  getSelectedDeepLink,
  dispatchPaymentIntent
} from '../lib/upiPayment';
import QRCode from 'qrcode';

export default function CheckoutPage() {
  const router = useRouter();
  const { id } = router.query;
  const {
    cart,
    addToCart,
    updateQty,
    removeFromCart,
    calculateCartTotals
  } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('gpay');
  const [orderId, setOrderId] = useState('');

  // Address form
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    pincode: '',
    city: '',
    flat: '',
    area: ''
  });
  const [addressError, setAddressError] = useState('');

  // Meta In-App iOS Modal & QR
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Initialize Order ID
  useEffect(() => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    setOrderId('MSH-' + s4() + s4().toUpperCase());
  }, []);

  // Ensure cart is populated if direct ?id=... was used
  useEffect(() => {
    if (id) {
      const p = getProductById(id);
      if (p) {
        addToCart(p, false);
      }
    } else if (cart.length === 0) {
      // Default initial product if opened cold
      const p = getProductById(1);
      if (p) {
        addToCart(p, false);
      }
    }
  }, [id]);

  const { totalAmount, totalMrp, discountAmount, freeMap, finalPayable } = calculateCartTotals();

  // Generate QR code for Meta iOS modal or scan
  useEffect(() => {
    const amt = finalPayable.toFixed(2);
    const upiString = `upi://pay?pa=${DEFAULT_PAYEE_VPA}&pn=${encodeURIComponent(DEFAULT_PAYEE_NAME)}&am=${amt}&cu=INR&tn=${encodeURIComponent(DEFAULT_TRANSACTION_NOTE)}`;
    QRCode.toDataURL(upiString, { width: 220, margin: 1 })
      .then(url => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [finalPayable]);

  const goToStep = (step) => {
    setCurrentStep(step);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!address.name || !address.phone || !address.pincode || !address.city || !address.flat || !address.area) {
      setAddressError('⚠️ Please fill in all address fields to continue.');
      return;
    }
    if (address.phone.replace(/\D/g, '').length < 10) {
      setAddressError('⚠️ Please enter a valid 10-digit mobile number.');
      return;
    }
    setAddressError('');
    goToStep(3);
  };

  const handlePaymentSubmit = (e, specificMethod) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const method = specificMethod || selectedMethod;

    // Track Meta Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      try {
        window.fbq('track', 'AddPaymentInfo', {
          value: finalPayable,
          currency: 'INR',
          num_items: cart.length,
          payment_method: method
        });
        window.fbq('track', 'Purchase', {
          value: finalPayable,
          currency: 'INR',
          num_items: cart.length,
          content_type: 'product',
          order_id: orderId
        });
      } catch (_) {}
    }

    // Cash on Delivery
    if (method === 'cod') {
      goToStep(4);
      return;
    }

    // UPI Redirection
    const platform = detectPlatform();

    if (platform.isMetaInAppIOS) {
      // Avoid WKWebView navigation crash in Instagram/FB iOS
      setShowMetaModal(true);
      return;
    }

    const deepLink = getSelectedDeepLink(method, {
      vpa: DEFAULT_PAYEE_VPA,
      name: DEFAULT_PAYEE_NAME,
      amount: finalPayable,
      note: DEFAULT_TRANSACTION_NOTE
    });

    dispatchPaymentIntent(deepLink);

    // Show Step 4 confirmation for user when they return
    setTimeout(() => {
      goToStep(4);
    }, 1200);
  };

  const copyUpiId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(DEFAULT_PAYEE_VPA);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  return (
    <div className="meesho-mobile-shell">
      <Head>
        <title>Checkout | Meesho</title>
      </Head>

      {/* Stepper Header */}
      <header className="checkout-stepper-header">
        <div className="stepper-inner">
          <div className={`step-node ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
            <span className="step-circle">{currentStep > 1 ? '✓' : '1'}</span>
            <span className="step-label">Cart</span>
          </div>
          <div className="step-line" />
          <div className={`step-node ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
            <span className="step-circle">{currentStep > 2 ? '✓' : '2'}</span>
            <span className="step-label">Address</span>
          </div>
          <div className="step-line" />
          <div className={`step-node ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}>
            <span className="step-circle">{currentStep > 3 ? '✓' : '3'}</span>
            <span className="step-label">Payment</span>
          </div>
          <div className="step-line" />
          <div className={`step-node ${currentStep === 4 ? 'active' : ''}`}>
            <span className="step-circle">4</span>
            <span className="step-label">Summary</span>
          </div>
        </div>
      </header>

      <main className="meesho-main-content checkout-main-content" style={{ padding: '14px 10px 90px' }}>
        {/* ================= STEP 1: CART REVIEW ================= */}
        {currentStep === 1 && (
          <div id="checkoutStep1" className="checkout-step-cart">
            <div className="step-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h5 style={{ fontWeight: '700', margin: 0 }}>Review Your Cart ({cart.reduce((s, i) => s + (parseInt(i.qty) || 1), 0)} items)</h5>
              <span style={{ fontSize: '12px', color: '#038d63', fontWeight: '700' }}>⚡ Buy 2 Get 1 Free</span>
            </div>

            <div className="checkout-cart-list" id="checkoutCartList">
              {cart.map((item) => {
                const formattedQty = item.qty < 10 ? `0${item.qty}` : item.qty;
                const freeQty = freeMap[item.id] || 0;

                return (
                  <div className="cart-product" key={item.id} style={{ background: '#fff', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
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
                          <img src="/trash-icon.png" alt="remove" className="remove-cart-icon" />
                        </button>
                      </div>
                      <div className="cart-product-pricing">
                        <p className="cart-product-price">₹{item.price}.00</p>
                        <span className="cart-product-mrp">₹{item.originalPrice}.00</span>
                      </div>
                      <div className="cart-product-description">
                        <p className="cart-product-color">Qty: {formattedQty}</p>
                        <div className="cart-qty-wrapper">
                          <span className="minus" onClick={() => updateQty(item.id, (parseInt(item.qty) || 1) - 1)}>-</span>
                          <span className="num">{formattedQty}</span>
                          <span className="plus" onClick={() => updateQty(item.id, (parseInt(item.qty) || 1) + 1)}>+</span>
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
              })}
            </div>

            {/* Price Breakdown */}
            <div className="cart__footer cart_page_footer" style={{ marginTop: '16px', background: '#fff', padding: '16px', borderRadius: '12px' }}>
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
            </div>

            {/* Sticky Step 1 Bottom */}
            <div className="checkout-bottom-bar">
              <div className="bottom-bar-price-info">
                <span className="cartTotalAmount" style={{ fontWeight: '700', color: '#333' }}>₹{finalPayable.toFixed(2)}</span>
                <span className="view-details-sub">Free Delivery</span>
              </div>
              <button
                type="button"
                className="btn-step-continue"
                onClick={() => goToStep(2)}
                style={{ background: '#9f2089', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
              >
                Continue to Address ➔
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: ADDRESS ================= */}
        {currentStep === 2 && (
          <div id="checkoutStep2" className="checkout-step-address">
            <div style={{ background: '#fff', borderRadius: '12px', padding: '18px 14px' }}>
              <h5 style={{ fontWeight: '700', marginBottom: '14px' }}>Delivery Address</h5>

              {addressError && (
                <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
                  {addressError}
                </div>
              )}

              <form onSubmit={handleSaveAddress}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={address.name}
                    onChange={(e) => setAddress({ ...address, name: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '') })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6 digits"
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>House / Flat / Building No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="Flat 402, Sunshine Apts"
                    value={address.flat}
                    onChange={(e) => setAddress({ ...address, flat: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>Road / Area / Colony *</label>
                  <input
                    type="text"
                    required
                    placeholder="MG Road, Near Bus Stand"
                    value={address.area}
                    onChange={(e) => setAddress({ ...address, area: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: '#9f2089',
                    color: '#fff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}
                >
                  Deliver to this Address ➔
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PAYMENT ================= */}
        {currentStep === 3 && (
          <div id="checkoutStep3" className="checkout-step-payment">
            {/* Header row */}
            <div className="payment-select-header">
              <h6 className="payment-title-text">Select Payment Method</h6>
              <div className="safe-badge-pill">
                <span className="safe-shield">🛡️</span>
                <span className="safe-text">100% SAFE PAYMENTS</span>
              </div>
            </div>

            {/* Extra discount banner */}
            <div className="online-extra-off-card">
              <div className="online-extra-inner">
                <span className="cashback-flash">⚡</span>
                <div className="online-extra-text">
                  <span className="extra-discount-title">Pay online &amp; get EXTRA ₹33 off</span>
                  <span className="extra-discount-sub">Instant discount applied on UPI payment</span>
                </div>
              </div>
            </div>

            {/* Section Header */}
            <div className="pay-section-header">
              <span>PAY ONLINE (INSTANT EXTRA ₹33 OFF)</span>
              <div className="divider-line" />
            </div>

            <div className="payment-options-list">
              {/* Google Pay */}
              <div
                id="cardGpay"
                className={`payment-option-card ${selectedMethod === 'gpay' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('gpay')}
                style={{ flexDirection: 'column', alignItems: 'stretch' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    id="radioGpay"
                    value="gpay"
                    checked={selectedMethod === 'gpay'}
                    onChange={() => setSelectedMethod('gpay')}
                    style={{ marginRight: '10px' }}
                  />
                  <div className="payment-option-details">
                    <div className="option-info">
                      <span className="option-name">G Pay</span>
                      <span className="option-tag blue-tag">Instant UPI Fast Pay</span>
                    </div>
                    <img src="/gpay_icon.svg" alt="Google Pay" className="pay-brand-logo" />
                  </div>
                </div>

                {selectedMethod === 'gpay' && (
                  <div id="redirectBoxGpay" className="payment-redirect-box">
                    <button
                      type="button"
                      className="btn-direct-redirect btn-redirect-gpay"
                      onClick={(e) => handlePaymentSubmit(e, 'gpay')}
                    >
                      <img src="/gpay_icon.svg" alt="G Pay" style={{ height: '16px' }} />
                      Redirect to G Pay • Pay ₹{finalPayable.toFixed(2)} ➔
                    </button>
                  </div>
                )}
              </div>

              {/* PhonePe */}
              <div
                id="cardPhonepe"
                className={`payment-option-card ${selectedMethod === 'phonepe' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('phonepe')}
                style={{ flexDirection: 'column', alignItems: 'stretch' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    id="radioPhonepe"
                    value="phonepe"
                    checked={selectedMethod === 'phonepe'}
                    onChange={() => setSelectedMethod('phonepe')}
                    style={{ marginRight: '10px' }}
                  />
                  <div className="payment-option-details">
                    <div className="option-info">
                      <span className="option-name" style={{ color: '#038d63' }}>PhonePe</span>
                      <span className="option-tag green-tag">20% Cashback in 24 hour</span>
                    </div>
                    <img src="/phonepe.svg" alt="PhonePe" className="pay-brand-logo" />
                  </div>
                </div>

                {selectedMethod === 'phonepe' && (
                  <div id="redirectBoxPhonepe" className="payment-redirect-box">
                    <button
                      type="button"
                      className="btn-direct-redirect btn-redirect-phonepe"
                      onClick={(e) => handlePaymentSubmit(e, 'phonepe')}
                    >
                      <img src="/phonepe.svg" alt="PhonePe" style={{ height: '16px' }} />
                      Redirect to PhonePe • Pay ₹{finalPayable.toFixed(2)} ➔
                    </button>
                  </div>
                )}
              </div>

              {/* Paytm */}
              <div
                id="cardPaytm"
                className={`payment-option-card ${selectedMethod === 'paytm' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('paytm')}
                style={{ flexDirection: 'column', alignItems: 'stretch' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    id="radioPaytm"
                    value="paytm"
                    checked={selectedMethod === 'paytm'}
                    onChange={() => setSelectedMethod('paytm')}
                    style={{ marginRight: '10px' }}
                  />
                  <div className="payment-option-details">
                    <div className="option-info">
                      <span className="option-name">Paytm</span>
                      <span className="option-tag purple-tag">Fast &amp; Secure UPI</span>
                    </div>
                    <img src="/paytm_icon.svg" alt="Paytm" className="pay-brand-logo" />
                  </div>
                </div>

                {selectedMethod === 'paytm' && (
                  <div id="redirectBoxPaytm" className="payment-redirect-box">
                    <button
                      type="button"
                      className="btn-direct-redirect btn-redirect-paytm"
                      onClick={(e) => handlePaymentSubmit(e, 'paytm')}
                    >
                      <img src="/paytm_icon.svg" alt="Paytm" style={{ height: '16px' }} />
                      Redirect to Paytm • Pay ₹{finalPayable.toFixed(2)} ➔
                    </button>
                  </div>
                )}
              </div>

              {/* Cash on Delivery (COD) */}
              <div
                id="cardCod"
                className={`payment-option-card ${selectedMethod === 'cod' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('cod')}
                style={{ flexDirection: 'column', alignItems: 'stretch' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    id="radioCod"
                    value="cod"
                    checked={selectedMethod === 'cod'}
                    onChange={() => setSelectedMethod('cod')}
                    style={{ marginRight: '10px' }}
                  />
                  <div className="payment-option-details">
                    <div className="option-info">
                      <span className="option-name">Cash on Delivery</span>
                      <span className="option-tag" style={{ background: '#f0f0f0', color: '#666' }}>Pay at Doorstep</span>
                    </div>
                    <span style={{ fontSize: '20px' }}>💵</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="cart__footer cart_page_footer" style={{ marginTop: '16px', background: '#fff', padding: '16px', borderRadius: '12px' }}>
              <div className="cart__price__details">
                <div className="cart__breakup__inner">
                  <div className="cart__total">
                    <span>Total Product Price:</span>
                    <span id="step3Subtotal">₹{totalMrp.toFixed(2)}</span>
                  </div>
                  <div className="cart__total" style={{ color: '#038d63' }}>
                    <span>Discount:</span>
                    <span id="step3DiscountText">-₹{discountAmount.toFixed(2)}</span>
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
            </div>

            {/* Sticky Bottom Bar */}
            <div className="checkout-bottom-bar">
              <div className="bottom-bar-price-info">
                <span className="cartTotalAmount" style={{ fontWeight: '700', color: '#333' }}>
                  ₹{finalPayable.toFixed(2)}
                </span>
                <span className="view-details-sub">Saved ₹{Math.round(discountAmount)}! Free Delivery</span>
              </div>
              <button
                type="button"
                id="btnBottomPay"
                className="btn-step-continue btn-pay-now"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: selectedMethod === 'phonepe' ? '#5f259f' : selectedMethod === 'paytm' ? '#002e6e' : selectedMethod === 'cod' ? '#2e7d32' : '#1a73e8'
                }}
                onClick={(e) => handlePaymentSubmit(e)}
              >
                {selectedMethod === 'cod'
                  ? 'Place Order via COD ➔'
                  : `Pay ₹${finalPayable.toFixed(2)} via ${selectedMethod === 'phonepe' ? 'PhonePe' : selectedMethod === 'paytm' ? 'Paytm' : 'G Pay'} ➔`}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: ORDER SUCCESS ================= */}
        {currentStep === 4 && (
          <div id="checkoutStep4" className="checkout-step-summary" style={{ display: 'block', padding: '20px 0' }}>
            <div className="order-success-card" style={{ background: '#fff', borderRadius: '16px', padding: '32px 18px', textAlign: 'center' }}>
              <div
                className="success-checkmark-circle"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#2e7d32',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <h2 className="success-heading" style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', marginBottom: '6px' }}>
                Order Placed Successfully! 🎉
              </h2>
              <p className="success-sub" style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                Thank you for shopping on Meesho
              </p>

              <div className="order-details-box" style={{ background: '#f9f9f9', borderRadius: '12px', padding: '14px', textAlign: 'left', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ color: '#777', fontSize: '13px' }}>Order ID:</span>
                  <strong style={{ fontSize: '13px' }}>{orderId}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ color: '#777', fontSize: '13px' }}>Amount:</span>
                  <strong style={{ color: '#038d63', fontSize: '14px' }}>₹{finalPayable.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ color: '#777', fontSize: '13px' }}>Payment Mode:</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#9f2089' }}>
                    {selectedMethod}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: '#777', fontSize: '13px' }}>Estimated Delivery:</span>
                  <strong style={{ fontSize: '13px' }}>3 - 5 Business Days</strong>
                </div>
              </div>

              <Link
                href="/home"
                style={{
                  display: 'inline-block',
                  background: '#9f2089',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '12px 28px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '14px'
                }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Meta In-App iOS Safari Fallback Modal */}
      {showMetaModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '24px 18px',
              maxWidth: '360px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <h4 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: '800', color: '#1a1a1a' }}>
              Complete Payment in PhonePe
            </h4>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '14px', lineHeight: '1.4' }}>
              Instagram browser restricts direct app switching. Tap below to launch PhonePe, or scan the QR code.
            </p>

            {/* Direct Link Anchor Button */}
            <a
              href={getSelectedDeepLink('phonepe', {
                vpa: DEFAULT_PAYEE_VPA,
                name: DEFAULT_PAYEE_NAME,
                amount: finalPayable,
                note: DEFAULT_TRANSACTION_NOTE
              })}
              target="_top"
              rel="noopener noreferrer"
              onClick={() => {
                setShowMetaModal(false);
                setTimeout(() => goToStep(4), 1000);
              }}
              style={{
                display: 'block',
                background: '#5f259f',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                textDecoration: 'none',
                marginBottom: '14px'
              }}
            >
              Open PhonePe App (₹{finalPayable.toFixed(2)}) ➔
            </a>

            {/* QR Code */}
            {qrCodeDataUrl && (
              <div style={{ margin: '10px auto', display: 'inline-block', border: '1px solid #eee', padding: '6px', borderRadius: '8px' }}>
                <img src={qrCodeDataUrl} alt="UPI QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
              </div>
            )}

            {/* Copy UPI ID */}
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={copyUpiId}
                style={{
                  background: copiedUpi ? '#2e7d32' : '#f0f0f0',
                  color: copiedUpi ? '#fff' : '#333',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {copiedUpi ? '✓ UPI ID Copied!' : `Copy UPI ID: ${DEFAULT_PAYEE_VPA}`}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowMetaModal(false)}
              style={{
                marginTop: '16px',
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
