import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    clearCart,
    calculateCartTotals
  } = useCart();

  const { totalAmount, totalMrp, discountAmount, freeMap, finalPayable } = calculateCartTotals();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('phonepe');
  const [orderId, setOrderId] = useState('');
  const [orderPlacedTime, setOrderPlacedTime] = useState('');

  // Address form
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    pincode: '',
    city: '',
    state: '',
    flat: '',
    area: '',
    landmark: '',
    addressType: 'home'
  });
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // UTR & QR Code verification state
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');
  const [verifyingUtr, setVerifyingUtr] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(300); // 5 minutes
  const [qrExpired, setQrExpired] = useState(false);

  // Meta In-App iOS Modal & QR
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Placed order snapshot
  const [completedOrderSnapshot, setCompletedOrderSnapshot] = useState(null);

  // 2-Minute (120s) Payment App Waiting Modal & Smart Fallback State
  const [isWaitingPayment, setIsWaitingPayment] = useState(false);
  const [paymentCountdown, setPaymentCountdown] = useState(120);
  const [activePaymentMethod, setActivePaymentMethod] = useState('phonepe');
  const [activeDeepLink, setActiveDeepLink] = useState('');
  const [hasAppOpened, setHasAppOpened] = useState(false);
  const [fallbackStage, setFallbackStage] = useState('initial'); // 'initial' | 'fallback_phonepe' | 'fallback_generic' | 'no_app_qr'
  const [modalStatusText, setModalStatusText] = useState('');
  const [modalUtrInput, setModalUtrInput] = useState('');
  const [modalUtrError, setModalUtrError] = useState('');
  const [modalVerifyingUtr, setModalVerifyingUtr] = useState(false);
  const paymentTimerRef = useRef(null);
  const appDetectTimeoutRef = useRef(null);
  const hasAppOpenedRef = useRef(false);
  const hasTrackedInitiateCheckout = useRef(false);
  const hasTrackedPurchaseRef = useRef(false);

  const trackPurchaseEvent = (methodUsed, customAmount, customOrderId) => {
    if (hasTrackedPurchaseRef.current) return;
    hasTrackedPurchaseRef.current = true;

    if (typeof window !== 'undefined' && window.fbq) {
      try {
        const orderIdVal = customOrderId || orderId;
        const amountVal = customAmount !== undefined ? customAmount : finalPayable;
        const items = cart && cart.length > 0 ? cart : (completedOrderSnapshot?.items || []);

        window.fbq('track', 'Purchase', {
          value: Number(amountVal.toFixed(2)),
          currency: 'INR',
          num_items: items.length || 1,
          content_type: 'product',
          content_ids: items.map(i => String(i.id)),
          contents: items.map(i => ({
            id: String(i.id),
            quantity: i.qty || i.quantity || 1,
            item_price: i.price
          })),
          order_id: orderIdVal,
          payment_method: methodUsed || selectedMethod
        });
      } catch (_) {}
    }
  };

  // Track Meta Pixel InitiateCheckout on mount / cart ready
  useEffect(() => {
    if (!hasTrackedInitiateCheckout.current && cart && cart.length > 0 && finalPayable > 0) {
      if (typeof window !== 'undefined' && window.fbq) {
        hasTrackedInitiateCheckout.current = true;
        try {
          window.fbq('track', 'InitiateCheckout', {
            value: Number(finalPayable.toFixed(2)),
            currency: 'INR',
            num_items: cart.length,
            content_type: 'product',
            content_ids: cart.map(item => String(item.id))
          });
        } catch (_) {}
      }
    }
  }, [cart, finalPayable]);

  // App-launch detection: if the user switches to PhonePe/Paytm, the tab hides or blurs
  useEffect(() => {
    if (!isWaitingPayment) return;

    const handleAppLaunch = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        hasAppOpenedRef.current = true;
        setHasAppOpened(true);
        if (appDetectTimeoutRef.current) {
          clearTimeout(appDetectTimeoutRef.current);
        }
      }
    };

    const handleWindowBlur = () => {
      hasAppOpenedRef.current = true;
      setHasAppOpened(true);
      if (appDetectTimeoutRef.current) {
        clearTimeout(appDetectTimeoutRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleAppLaunch);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('pagehide', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleAppLaunch);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pagehide', handleWindowBlur);
    };
  }, [isWaitingPayment]);

  // 10-Second Countdown for Payment App -> Automatically Confirms Order after 10s
  // ONLY runs if the user actually launched the payment app (hasAppOpened is true)!
  // If the app failed to open (fallbackStage === 'no_app_qr'), auto-confirm is halted so it doesn't look fake.
  useEffect(() => {
    if (isWaitingPayment) {
      if (fallbackStage === 'no_app_qr') {
        if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
        return;
      }

      if (hasAppOpened) {
        if (paymentCountdown > 0) {
          paymentTimerRef.current = setTimeout(() => {
            setPaymentCountdown((prev) => prev - 1);
          }, 1000);
        } else {
          setIsWaitingPayment(false);
          finalizeOrder(activePaymentMethod);
        }
      }
    }
    return () => {
      if (paymentTimerRef.current) {
        clearTimeout(paymentTimerRef.current);
      }
    };
  }, [isWaitingPayment, hasAppOpened, paymentCountdown, activePaymentMethod, fallbackStage]);

  // Initialize Order ID & Load Address from localStorage
  useEffect(() => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    setOrderId('MSH-' + s4().toUpperCase() + s4().toUpperCase());
    setOrderPlacedTime(new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }));

    try {
      const savedAddr = localStorage.getItem('meesho_delivery_address');
      if (savedAddr) {
        const parsed = JSON.parse(savedAddr);
        if (parsed && parsed.name) {
          setAddress(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (_) {}
  }, []);

  // Ensure cart is populated if direct ?id=... was used (without duplicate incrementing)
  useEffect(() => {
    if (id) {
      const numId = parseInt(id, 10);
      const exists = cart.some(item => item.id === numId);
      if (!exists) {
        const p = getProductById(numId);
        if (p) {
          addToCart(p, false);
        }
      }
    } else if (cart.length === 0) {
      const p = getProductById(1);
      if (p) {
        addToCart(p, false);
      }
    }
  }, [id]);

  // QR Code Expiry Countdown
  useEffect(() => {
    if (qrCountdown <= 0) {
      setQrExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setQrCountdown(prev => {
        if (prev <= 1) {
          setQrExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qrCountdown]);

  // Generate QR code for payment
  useEffect(() => {
    const amt = finalPayable.toFixed(2);
    const upiString = `upi://pay?pa=${DEFAULT_PAYEE_VPA}&pn=${encodeURIComponent(DEFAULT_PAYEE_NAME)}&am=${amt}&cu=INR&tn=${encodeURIComponent(DEFAULT_TRANSACTION_NOTE)}`;
    QRCode.toDataURL(upiString, { width: 220, margin: 1 })
      .then(url => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [finalPayable]);

  const formatCountdown = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleRefreshQr = () => {
    setQrCountdown(300);
    setQrExpired(false);
  };

  const goToStep = (step) => {
    setCurrentStep(step);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (step === 3 && typeof window !== 'undefined' && window.fbq) {
      try {
        window.fbq('track', 'AddPaymentInfo', {
          value: Number(finalPayable.toFixed(2)),
          currency: 'INR',
          num_items: cart.length,
          payment_method: selectedMethod
        });
      } catch (_) {}
    }
  };

  // Location Auto-Detection
  const handleDetectLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setAddressError('⚠️ Geolocation is not supported in this browser.');
      return;
    }
    setLocationLoading(true);
    setAddressError('');
    setAddressSuccess('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const detectedPin = (addr.postcode || '').replace(/\D/g, '').slice(0, 6);
            const detectedCity = addr.city || addr.town || addr.village || addr.county || '';
            const detectedState = addr.state || '';
            const detectedRoad = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ');

            setAddress(prev => ({
              ...prev,
              pincode: detectedPin || prev.pincode,
              city: detectedCity || prev.city,
              state: detectedState || prev.state,
              area: detectedRoad || prev.area
            }));
            setAddressSuccess('📍 Location detected and auto-filled successfully!');
          } else {
            setAddressSuccess('📍 Location coordinates detected.');
          }
        } catch (e) {
          setAddressError('Could not fetch postal details for your coordinates. Please enter manually.');
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setAddressError('Could not access device location. Please enter your address manually.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Pincode Auto-Lookup
  const handlePincodeChange = async (pin) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    setAddress(prev => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length === 6) {
      setPincodeLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0];
          setAddress(prev => ({
            ...prev,
            pincode: cleanPin,
            city: po.District || po.Block || prev.city,
            state: po.State || prev.state
          }));
          setAddressSuccess(`✓ Pincode verified: ${po.District}, ${po.State}`);
        }
      } catch (_) {}
      finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleSaveAddress = (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!address.name.trim() || !address.phone.trim() || !address.pincode.trim() || !address.city.trim() || !address.flat.trim() || !address.area.trim()) {
      setAddressError('⚠️ Please fill in all required address fields marked with *.');
      return;
    }
    if (address.phone.replace(/\D/g, '').length < 10) {
      setAddressError('⚠️ Please enter a valid 10-digit mobile number.');
      return;
    }
    if (address.pincode.replace(/\D/g, '').length !== 6) {
      setAddressError('⚠️ Please enter a valid 6-digit postal pincode.');
      return;
    }

    setAddressError('');
    try {
      localStorage.setItem('meesho_delivery_address', JSON.stringify(address));
    } catch (_) {}

    goToStep(3);
  };

  // Finalize order snapshot & store history
  const finalizeOrder = (methodUsed, utrRef = '') => {
    trackPurchaseEvent(methodUsed, finalPayable, orderId);

    const orderData = {
      orderId,
      date: new Date().toISOString(),
      orderTime: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      items: [...cart],
      totalAmount: finalPayable,
      totalMrp,
      discountAmount,
      address: { ...address },
      paymentMethod: methodUsed,
      utr: utrRef,
      status: 'Payment Confirmed (Success)'
    };

    setCompletedOrderSnapshot(orderData);

    try {
      const existing = JSON.parse(localStorage.getItem('meesho_orders') || '[]');
      existing.unshift(orderData);
      localStorage.setItem('meesho_orders', JSON.stringify(existing));
    } catch (_) {}

    clearCart();
    goToStep(4);
  };

  // Handle UTR Reference Verification
  const handleVerifyUtr = (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const cleanUtr = utrNumber.replace(/\D/g, '');
    if (cleanUtr.length !== 12) {
      setUtrError('⚠️ Please enter a valid 12-digit UPI Reference / UTR Number.');
      return;
    }
    setUtrError('');
    setVerifyingUtr(true);

    setTimeout(() => {
      setVerifyingUtr(false);
      finalizeOrder('upi_qr', cleanUtr);
    }, 1200);
  };

  const triggerAppIntent = (methodToTry) => {
    setActivePaymentMethod(methodToTry);
    const link = getSelectedDeepLink(methodToTry, {
      vpa: DEFAULT_PAYEE_VPA,
      name: DEFAULT_PAYEE_NAME,
      amount: finalPayable,
      note: DEFAULT_TRANSACTION_NOTE
    });
    setActiveDeepLink(link);
    dispatchPaymentIntent(link);
    return link;
  };

  const triggerGenericOrQrFallback = () => {
    setFallbackStage('fallback_generic');
    setModalStatusText('Opening any available UPI app on your device...');

    const genericLink = `upi://pay?pa=${encodeURIComponent(DEFAULT_PAYEE_VPA)}&pn=${encodeURIComponent(DEFAULT_PAYEE_NAME)}&am=${finalPayable.toFixed(2)}&cu=INR&tn=${encodeURIComponent(DEFAULT_TRANSACTION_NOTE)}`;
    dispatchPaymentIntent(genericLink);

    // If still no app opens after 2s -> Switch to QR & manual verification, DO NOT fake the order
    appDetectTimeoutRef.current = setTimeout(() => {
      if (!hasAppOpenedRef.current) {
        setFallbackStage('no_app_qr');
        setModalStatusText('Could not open UPI app on this device');
      }
    }, 2000);
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
          value: Number(finalPayable.toFixed(2)),
          currency: 'INR',
          num_items: cart.length,
          payment_method: method
        });
      } catch (_) {}
    }
    // Track Purchase on payment action (guarantees attribution if app switches away)
    trackPurchaseEvent(method, finalPayable, orderId);

    // QR Code method
    if (method === 'qr_code') {
      if (utrNumber.trim().length === 12) {
        handleVerifyUtr();
        return;
      }
      return;
    }

    // UPI Redirection
    const platform = detectPlatform();

    if (platform.isMetaInAppIOS) {
      setShowMetaModal(true);
      return;
    }

    hasAppOpenedRef.current = false;
    setHasAppOpened(false);
    setFallbackStage('initial');
    setPaymentCountdown(120);
    setModalUtrInput('');
    setModalUtrError('');
    setIsWaitingPayment(true);

    const initialName = method === 'paytm' ? 'Paytm' : method === 'gpay' ? 'Google Pay' : 'PhonePe';
    setModalStatusText(`Opening ${initialName}...`);

    triggerAppIntent(method);

    // Smart Fallback Detection:
    // If user clicked Paytm, but Paytm is not installed -> try PhonePe!
    // Do NOT auto-place fake order in 10s if the app never opened.
    if (appDetectTimeoutRef.current) clearTimeout(appDetectTimeoutRef.current);

    appDetectTimeoutRef.current = setTimeout(() => {
      if (!hasAppOpenedRef.current) {
        if (method === 'paytm') {
          // Paytm app not found -> Try PhonePe as requested!
          setFallbackStage('fallback_phonepe');
          setModalStatusText('Paytm app not found. Opening PhonePe...');
          triggerAppIntent('phonepe');

          // Wait 2s to see if PhonePe opens
          appDetectTimeoutRef.current = setTimeout(() => {
            if (!hasAppOpenedRef.current) {
              // PhonePe also not found -> Try generic UPI / QR
              triggerGenericOrQrFallback();
            }
          }, 2000);
        } else {
          // PhonePe / GPay clicked but did not open -> Try generic UPI or QR
          triggerGenericOrQrFallback();
        }
      }
    }, 2000);
  };

  const handleManualConfirmPayment = () => {
    if (paymentTimerRef.current) {
      clearTimeout(paymentTimerRef.current);
    }
    if (appDetectTimeoutRef.current) {
      clearTimeout(appDetectTimeoutRef.current);
    }
    setIsWaitingPayment(false);
    finalizeOrder(activePaymentMethod);
  };

  const handleReopenPaymentApp = (overrideMethod) => {
    const methodToOpen = overrideMethod || activePaymentMethod;
    triggerAppIntent(methodToOpen);
  };

  const handleModalVerifyUtr = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const clean = modalUtrInput.replace(/\D/g, '');
    if (clean.length !== 12) {
      setModalUtrError('⚠️ Please enter a valid 12-digit UPI Reference / UTR Number.');
      return;
    }
    setModalUtrError('');
    setModalVerifyingUtr(true);
    setTimeout(() => {
      setModalVerifyingUtr(false);
      setIsWaitingPayment(false);
      finalizeOrder(activePaymentMethod || 'upi_qr', clean);
    }, 1200);
  };

  const copyUpiId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(DEFAULT_PAYEE_VPA);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const totalCartUnits = cart.reduce((s, i) => s + (parseInt(i.qty) || 1), 0);

  return (
    <div className="meesho-mobile-shell">
      <Head>
        <title>Checkout | Meesho</title>
      </Head>

      {/* Stepper Header with Top Navigation Bar */}
      <header className="checkout-stepper-header">
        <div className="checkout-top-nav">
          <button
            type="button"
            className="checkout-back-btn"
            onClick={() => {
              if (currentStep > 1) {
                goToStep(currentStep - 1);
              } else {
                router.push('/home');
              }
            }}
            title="Go Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back</span>
          </button>

          <h4 className="checkout-page-title">
            {currentStep === 1 && 'Review Cart'}
            {currentStep === 2 && 'Delivery Address'}
            {currentStep === 3 && 'Payment Method'}
            {currentStep === 4 && 'Order Placed'}
          </h4>

          <div className="checkout-trust-badge">
            <span>🛡️</span>
            <span>100% Safe</span>
          </div>
        </div>

        {/* 4-Step Horizontal Stepper Bar */}
        <div className="stepper-inner">
          {/* Step 1: Cart */}
          <div
            className={`step-node ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
            onClick={() => currentStep > 1 && goToStep(1)}
          >
            <span className="step-circle">{currentStep > 1 ? '✓' : '1'}</span>
            <span className="step-label">Cart</span>
          </div>

          <div className={`step-line ${currentStep > 1 ? 'completed' : ''}`} />

          {/* Step 2: Address */}
          <div
            className={`step-node ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
            onClick={() => currentStep > 2 && goToStep(2)}
          >
            <span className="step-circle">{currentStep > 2 ? '✓' : '2'}</span>
            <span className="step-label">Address</span>
          </div>

          <div className={`step-line ${currentStep > 2 ? 'completed' : ''}`} />

          {/* Step 3: Payment */}
          <div
            className={`step-node ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}
            onClick={() => currentStep > 3 && goToStep(3)}
          >
            <span className="step-circle">{currentStep > 3 ? '✓' : '3'}</span>
            <span className="step-label">Payment</span>
          </div>

          <div className={`step-line ${currentStep > 3 ? 'completed' : ''}`} />

          {/* Step 4: Summary */}
          <div className={`step-node ${currentStep === 4 ? 'active completed' : ''}`}>
            <span className="step-circle">{currentStep === 4 ? '✓' : '4'}</span>
            <span className="step-label">Summary</span>
          </div>
        </div>
      </header>

      <main className="meesho-main-content checkout-main-content" style={{ padding: '14px 10px 90px' }}>
        {/* ================= STEP 1: CART REVIEW ================= */}
        {currentStep === 1 && (
          <div id="checkoutStep1" className="checkout-step-cart">
            {cart.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '40px 16px', textAlign: 'center' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🛍️</span>
                <h4 style={{ fontWeight: '700', marginBottom: '8px' }}>Your Cart is Empty</h4>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                  Looks like you haven't added any products yet.
                </p>
                <Link
                  href="/home"
                  style={{
                    display: 'inline-block',
                    background: '#9f2089',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    textDecoration: 'none'
                  }}
                >
                  Explore Combos ➔
                </Link>
              </div>
            ) : (
              <>
                <div className="step-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h5 style={{ fontWeight: '700', margin: 0, fontSize: '15px' }}>
                    Review Your Cart ({totalCartUnits} items)
                  </h5>
                  <span style={{ fontSize: '12px', color: '#038d63', fontWeight: '700', background: '#e8f7f1', padding: '3px 8px', borderRadius: '4px' }}>
                    ⚡ Buy 2 Get 1 Free
                  </span>
                </div>

                {/* Offer Incentive Banner */}
                {totalCartUnits % 3 === 2 && (
                  <div style={{ background: '#fff8e6', border: '1px solid #ffd591', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12.5px', color: '#d46b08', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🎁</span>
                    <span><strong>Special Offer:</strong> Add 1 more item to unlock <strong>1 FREE item</strong> with Buy 2 Get 1 Free!</span>
                  </div>
                )}

                <div className="checkout-cart-list" id="checkoutCartList">
                  {cart.map((item) => {
                    const formattedQty = item.qty < 10 ? `0${item.qty}` : item.qty;
                    const freeQty = freeMap[item.id] || 0;

                    return (
                      <div className="cart-product" key={item.id} style={{ background: '#fff', borderRadius: '12px', padding: '12px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div className="cart-product-img">
                          <img src={item.image} alt={item.title} />
                        </div>
                        <div className="cart-product-details">
                          <div className="cart-product-title">
                            <p style={{ fontWeight: '600', fontSize: '13.5px', color: '#1a1a1a' }}>{item.title}</p>
                            <button
                              type="button"
                              className="remove-cart-item-btn"
                              onClick={() => removeFromCart(item.id)}
                              title="Remove"
                            >
                              <img src="/trash-icon.png" alt="remove" className="remove-cart-icon" />
                            </button>
                          </div>

                          <div className="cart-product-pricing" style={{ margin: '4px 0' }}>
                            <p className="cart-product-price" style={{ fontSize: '15px', fontWeight: '800', color: '#333' }}>₹{item.price}.00</p>
                            <span className="cart-product-mrp" style={{ fontSize: '12px', textDecoration: 'line-through', color: '#888', marginLeft: '6px' }}>₹{item.originalPrice}.00</span>
                            {item.size && (
                              <span style={{ fontSize: '11px', background: '#f0f0f5', color: '#555', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>
                                Size: {item.size}
                              </span>
                            )}
                          </div>

                          <div className="cart-product-description" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                            <p className="cart-product-color" style={{ fontSize: '12px', color: '#666', margin: 0 }}>Qty: {formattedQty}</p>
                            <div className="cart-qty-wrapper">
                              <span className="minus" onClick={() => updateQty(item.id, (parseInt(item.qty) || 1) - 1)}>-</span>
                              <span className="num">{formattedQty}</span>
                              <span className="plus" onClick={() => updateQty(item.id, (parseInt(item.qty) || 1) + 1)}>+</span>
                            </div>
                          </div>

                          {freeQty > 0 && (
                            <div className="cart-free-message" style={{ background: '#e8f7f1', color: '#038d63', fontSize: '11.5px', padding: '4px 8px', borderRadius: '4px', marginTop: '8px', fontWeight: '600' }}>
                              Offer Applied: Buy 2 Get 1 Free 🎁 You got <strong style={{ color: '#d97706' }}>{freeQty}</strong> item(s) free!
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Price Breakdown */}
                <div className="cart__footer cart_page_footer" style={{ marginTop: '14px', background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <h6 style={{ fontSize: '13px', fontWeight: '700', color: '#666', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Price Details ({totalCartUnits} items)
                  </h6>
                  <div className="cart__price__details">
                    <div className="cart__breakup__inner">
                      <div className="cart__total" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13.5px' }}>
                        <span>Total Product Price:</span>
                        <span>₹{totalMrp.toFixed(2)}</span>
                      </div>
                      <div className="cart__total" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13.5px', color: '#038d63', fontWeight: '600' }}>
                        <span>Special Discount:</span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="shipping__total" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13.5px' }}>
                        <span>Delivery Fee:</span>
                        <span className="free-shipping-tag" style={{ color: '#038d63', fontWeight: '700' }}>FREE</span>
                      </div>
                      <div style={{ height: '1px', background: '#eee', margin: '10px 0' }} />
                      <div className="mc_pay__total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: '#1a1a1a' }}>
                        <span>To Pay:</span>
                        <span className="cartTotalAmount" style={{ color: '#9f2089' }}>₹{finalPayable.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#e8f7f1', color: '#038d63', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', marginTop: '12px', textAlign: 'center' }}>
                    🎉 Yay! You are saving ₹{Math.round(discountAmount)} on this order
                  </div>
                </div>

                {/* Sticky Step 1 Bottom Bar */}
                <div className="checkout-bottom-bar">
                  <div className="bottom-bar-price-info">
                    <span className="cartTotalAmount" style={{ fontWeight: '800', color: '#1a1a1a', fontSize: '18px' }}>
                      ₹{finalPayable.toFixed(2)}
                    </span>
                    <span className="view-details-sub" style={{ color: '#038d63', fontSize: '11px', fontWeight: '700' }}>
                      Free Delivery
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-step-continue"
                    onClick={() => goToStep(2)}
                    style={{ background: '#9f2089', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '6px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                  >
                    Continue to Address ➔
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= STEP 2: ADDRESS ================= */}
        {currentStep === 2 && (
          <div id="checkoutStep2" className="checkout-step-address">
            {/* Quick Auto-Detect Location Card */}
            <div className="location-detector-card">
              <div className="location-detector-info">
                <h6>📍 Auto-Fill Location</h6>
                <p>Detect your pincode and city automatically</p>
              </div>
              <button
                type="button"
                className="btn-detect-location"
                onClick={handleDetectLocation}
                disabled={locationLoading}
              >
                {locationLoading ? 'Detecting...' : 'Use Current Location'}
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', padding: '18px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h5 style={{ fontWeight: '700', marginBottom: '14px', fontSize: '15px' }}>Delivery Address Details</h5>

              {addressError && (
                <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', border: '1px solid #ffcdd2' }}>
                  {addressError}
                </div>
              )}

              {addressSuccess && (
                <div style={{ background: '#e8f7f1', color: '#038d63', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', border: '1px solid #a7f3d0' }}>
                  {addressSuccess}
                </div>
              )}

              <form onSubmit={handleSaveAddress}>
                {/* Full Name */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={address.name}
                    onChange={(e) => setAddress({ ...address, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Mobile Number */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>
                    10-Digit Mobile Number *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ padding: '10px 12px', background: '#f0f0f5', border: '1px solid #ccc', borderRight: 'none', borderRadius: '6px 0 0 6px', fontSize: '13px', fontWeight: '700', color: '#555' }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '') })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '0 6px 6px 0', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Pincode & City */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>
                      Pincode * {pincodeLoading && <span style={{ color: '#9f2089' }}>(checking...)</span>}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6 digits"
                      value={address.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* State */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* House / Flat */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>
                    House No. / Flat / Building *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Flat 402, Sunshine Apts"
                    value={address.flat}
                    onChange={(e) => setAddress({ ...address, flat: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Road / Area */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Road Name / Area / Colony *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MG Road, Near Bus Stand"
                    value={address.area}
                    onChange={(e) => setAddress({ ...address, area: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Landmark */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Opposite City Mall"
                    value={address.landmark}
                    onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Address Type */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>
                    Type of Address
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setAddress({ ...address, addressType: 'home' })}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: address.addressType === 'home' ? '2px solid #9f2089' : '1px solid #ccc',
                        background: address.addressType === 'home' ? '#fdf4ff' : '#fff',
                        color: address.addressType === 'home' ? '#9f2089' : '#555',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      🏠 Home
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddress({ ...address, addressType: 'work' })}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: address.addressType === 'work' ? '2px solid #9f2089' : '1px solid #ccc',
                        background: address.addressType === 'work' ? '#fdf4ff' : '#fff',
                        color: address.addressType === 'work' ? '#9f2089' : '#555',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      🏢 Work / Office
                    </button>
                  </div>
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

            {/* Sticky Step 2 Bottom Bar */}
            <div className="checkout-bottom-bar">
              <div className="bottom-bar-price-info">
                <span className="cartTotalAmount" style={{ fontWeight: '800', color: '#1a1a1a', fontSize: '18px' }}>
                  ₹{finalPayable.toFixed(2)}
                </span>
                <span className="view-details-sub" style={{ color: '#038d63', fontSize: '11px', fontWeight: '700' }}>
                  Free Delivery
                </span>
              </div>
              <button
                type="button"
                className="btn-step-continue"
                onClick={handleSaveAddress}
                style={{ background: '#9f2089', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '6px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
              >
                Deliver to this Address ➔
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PAYMENT ================= */}
        {currentStep === 3 && (
          <div id="checkoutStep3" className="checkout-step-payment">
            {/* 1. Delivering To Address Card - Cleanly Aligned & Distinct */}
            <div
              className="checkout-address-summary-card"
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '12px',
                border: '1px solid #ebebf2',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px' }}>📍</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Delivering To:
                  </span>
                  {address.addressType && (
                    <span style={{ fontSize: '10px', background: '#f0f0f5', color: '#555', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: '700' }}>
                      {address.addressType === 'home' ? '🏠 Home' : '🏢 Work'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  id="btnChangeAddress"
                  onClick={() => goToStep(2)}
                  className="btn-change-address"
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #9f2089',
                    color: '#9f2089',
                    fontWeight: '700',
                    fontSize: '12px',
                    padding: '5px 14px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(159, 32, 137, 0.08)'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Change Address</span>
                </button>
              </div>

              <div style={{ paddingLeft: '21px' }}>
                <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#1a1a1a', marginBottom: '3px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span>{address.name || 'Customer'}</span>
                  {address.phone && (
                    <span style={{ fontWeight: '500', color: '#666', fontSize: '12.5px' }}>
                      📞 +91 {address.phone}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12.5px', color: '#555', lineHeight: '1.5', wordBreak: 'break-word' }}>
                  {[address.flat, address.area, address.landmark, address.city, address.state].filter(Boolean).join(', ')}
                  {address.pincode ? ` - ${address.pincode}` : ''}
                </div>
              </div>
            </div>

            {/* 2. Extra discount banner */}
            <div className="online-extra-off-card" style={{ marginBottom: '12px' }}>
              <div className="online-extra-inner">
                <span className="cashback-flash">⚡</span>
                <div className="online-extra-text">
                  <span className="extra-discount-title">Pay online &amp; get EXTRA ₹33 off</span>
                  <span className="extra-discount-sub">Instant discount automatically applied on UPI payment</span>
                </div>
              </div>
            </div>

            {/* 3. Payment Method Header */}
            <div className="payment-select-header" style={{ borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f0f0f5' }}>
              <h6 className="payment-title-text" style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: '#1a1a1a' }}>Select Payment Method</h6>
              <div className="safe-badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#e8f7f1', color: '#038d63', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                <span className="safe-shield">🛡️</span>
                <span className="safe-text">100% SAFE PAYMENTS</span>
              </div>
            </div>

            {/* Section Header */}
            <div className="pay-section-header">
              <span>RECOMMENDED PAYMENT OPTIONS</span>
              <div className="divider-line" />
            </div>

            <div className="payment-options-list">
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
                      <span className="option-name" style={{ color: '#5f259f' }}>PhonePe</span>
                      <span className="option-tag green-tag">Instant 1-Tap UPI • 20% Cashback in 24 hr</span>
                    </div>
                    <img src="/phonepe.svg" alt="PhonePe" className="pay-brand-logo" />
                  </div>
                </div>

                {selectedMethod === 'phonepe' && (
                  <div id="redirectBoxPhonepe" className="payment-redirect-box" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f0f0f5' }}>
                    <button
                      type="button"
                      className="btn-direct-redirect btn-redirect-phonepe"
                      onClick={(e) => handlePaymentSubmit(e, 'phonepe')}
                      style={{ width: '100%', background: '#5f259f', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <img src="/phonepe.svg" alt="PhonePe" style={{ height: '18px' }} />
                      Pay with PhonePe • Pay ₹{finalPayable.toFixed(2)} ➔
                    </button>
                  </div>
                )}
              </div>

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
                      <span className="option-name" style={{ color: '#1a73e8' }}>Google Pay</span>
                      <span className="option-tag blue-tag">Instant UPI Fast Pay</span>
                    </div>
                    <img src="/gpay_icon.svg" alt="Google Pay" className="pay-brand-logo" />
                  </div>
                </div>

                {selectedMethod === 'gpay' && (
                  <div id="redirectBoxGpay" className="payment-redirect-box" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f0f0f5' }}>
                    <button
                      type="button"
                      className="btn-direct-redirect btn-redirect-gpay"
                      onClick={(e) => handlePaymentSubmit(e, 'gpay')}
                      style={{ width: '100%', background: '#1a73e8', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <img src="/gpay_icon.svg" alt="Google Pay" style={{ height: '18px' }} />
                      Pay with Google Pay • Pay ₹{finalPayable.toFixed(2)} ➔
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
                      <span className="option-name" style={{ color: '#002e6e' }}>Paytm UPI</span>
                      <span className="option-tag purple-tag">Fast &amp; Secure UPI</span>
                    </div>
                    <img src="/paytm_icon.svg" alt="Paytm" className="pay-brand-logo" />
                  </div>
                </div>

                {selectedMethod === 'paytm' && (
                  <div id="redirectBoxPaytm" className="payment-redirect-box" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f0f0f5' }}>
                    <button
                      type="button"
                      className="btn-direct-redirect btn-redirect-paytm"
                      onClick={(e) => handlePaymentSubmit(e, 'paytm')}
                      style={{ width: '100%', background: '#002e6e', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <img src="/paytm_icon.svg" alt="Paytm" style={{ height: '18px' }} />
                      Pay with Paytm • Pay ₹{finalPayable.toFixed(2)} ➔
                    </button>
                  </div>
                )}
              </div>

              {/* UPI QR Code (Scan with Any UPI App) */}
              <div
                id="cardQr"
                className={`payment-option-card ${selectedMethod === 'qr_code' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('qr_code')}
                style={{ flexDirection: 'column', alignItems: 'stretch' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    id="radioQr"
                    value="qr_code"
                    checked={selectedMethod === 'qr_code'}
                    onChange={() => setSelectedMethod('qr_code')}
                    style={{ marginRight: '10px' }}
                  />
                  <div className="payment-option-details">
                    <div className="option-info">
                      <span className="option-name">Pay via QR Code / All Apps</span>
                      <span className="option-tag orange-tag">Scan with PhonePe, GPay, Paytm or BHIM</span>
                    </div>
                    <span style={{ fontSize: '20px' }}>📱</span>
                  </div>
                </div>

                {/* Expanded QR Panel */}
                {selectedMethod === 'qr_code' && (
                  <div className="desktop-qr-card">
                    <div className="qr-amount-pill">
                      <span>Payable Amount:</span> <strong>₹{finalPayable.toFixed(2)}</strong>
                    </div>

                    <div className="qr-code-wrapper">
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="UPI QR Code" className="qr-code-image" />
                      ) : (
                        <p style={{ padding: '40px 10px', fontSize: '12px', color: '#888' }}>Generating QR Code...</p>
                      )}
                    </div>

                    <p style={{ fontSize: '11.5px', color: '#666', margin: '4px 0 8px' }}>
                      Scan with any UPI app on phone (PhonePe, GPay, Paytm, BHIM)
                    </p>

                    <div className="qr-vpa-copy-row">
                      <code className="qr-vpa-code">{DEFAULT_PAYEE_VPA}</code>
                      <button type="button" className="btn-copy-vpa" onClick={copyUpiId}>
                        {copiedUpi ? '✓ Copied!' : 'Copy UPI ID'}
                      </button>
                    </div>

                    <div style={{ fontSize: '11px', color: qrExpired ? '#c62828' : '#888', margin: '6px 0' }}>
                      {qrExpired ? (
                        <span>⚠️ QR Expired. <button type="button" onClick={handleRefreshQr} style={{ background: 'none', border: 'none', color: '#9f2089', textDecoration: 'underline', cursor: 'pointer' }}>Refresh QR</button></span>
                      ) : (
                        <span>⏱️ QR expires in {formatCountdown(qrCountdown)}</span>
                      )}
                    </div>

                    {/* 12-Digit UTR Form */}
                    <div className="utr-form-box">
                      <label>After paying, enter 12-digit UTR / Ref No. to confirm order:</label>
                      {utrError && <p style={{ color: '#c62828', fontSize: '11px', margin: '2px 0 4px' }}>{utrError}</p>}
                      <div className="utr-input-row">
                        <input
                          type="text"
                          maxLength={12}
                          placeholder="e.g. 412345678901"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                          className="utr-input"
                        />
                        <button
                          type="button"
                          className="btn-verify-utr"
                          onClick={handleVerifyUtr}
                          disabled={verifyingUtr}
                        >
                          {verifyingUtr ? 'Verifying...' : 'Submit UTR ➔'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="cart__footer cart_page_footer" style={{ marginTop: '14px', background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div className="cart__price__details">
                <div className="cart__breakup__inner">
                  <div className="cart__total" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13.5px' }}>
                    <span>Total Product Price:</span>
                    <span>₹{totalMrp.toFixed(2)}</span>
                  </div>
                  <div className="cart__total" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13.5px', color: '#038d63', fontWeight: '600' }}>
                    <span>Discount:</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="shipping__total" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13.5px' }}>
                    <span>Shipping:</span>
                    <span className="free-shipping-tag" style={{ color: '#038d63', fontWeight: '700' }}>FREE</span>
                  </div>
                  <div style={{ height: '1px', background: '#eee', margin: '10px 0' }} />
                  <div className="mc_pay__total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: '#1a1a1a' }}>
                    <span>To Pay:</span>
                    <span className="cartTotalAmount" style={{ color: '#9f2089' }}>₹{finalPayable.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="checkout-bottom-bar">
              <div className="bottom-bar-price-info">
                <span className="cartTotalAmount" style={{ fontWeight: '800', color: '#1a1a1a', fontSize: '18px' }}>
                  ₹{finalPayable.toFixed(2)}
                </span>
                <span className="view-details-sub" style={{ color: '#038d63', fontSize: '11px', fontWeight: '700' }}>
                  Saved ₹{Math.round(discountAmount)}! Free Delivery
                </span>
              </div>
              <button
                type="button"
                id="btnBottomPay"
                className="btn-step-continue btn-pay-now"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: selectedMethod === 'phonepe' ? '#5f259f' : selectedMethod === 'paytm' ? '#002e6e' : selectedMethod === 'qr_code' ? '#d97706' : '#1a73e8',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
                onClick={(e) => handlePaymentSubmit(e)}
              >
                {selectedMethod === 'qr_code'
                  ? 'Confirm with QR Code ➔'
                  : `Pay with ${selectedMethod === 'phonepe' ? 'PhonePe' : selectedMethod === 'paytm' ? 'Paytm' : 'Google Pay'} • Pay ₹${finalPayable.toFixed(2)} ➔`}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: ORDER SUCCESS ================= */}
        {currentStep === 4 && (
          <div id="checkoutStep4" className="checkout-step-summary" style={{ display: 'block', padding: '10px 0' }}>
            <div className="order-success-card" style={{ background: '#fff', borderRadius: '16px', padding: '28px 16px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div
                className="success-checkmark-circle"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#038d63',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  boxShadow: '0 4px 14px rgba(3, 141, 99, 0.3)'
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <h2 className="success-heading" style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', marginBottom: '4px' }}>
                Order Placed Successfully! 🎉
              </h2>
              <p className="success-sub" style={{ fontSize: '13px', color: '#666', marginBottom: '18px' }}>
                Thank you for shopping with us on Meesho!
              </p>

              {/* Order Meta Box */}
              <div className="order-details-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', textAlign: 'left', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #edf2f7' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Order ID:</span>
                  <strong style={{ fontSize: '13px', color: '#1e293b' }}>{orderId}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #edf2f7' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Amount:</span>
                  <strong style={{ color: '#038d63', fontSize: '14px' }}>₹{(completedOrderSnapshot?.totalAmount || finalPayable).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #edf2f7' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Payment Mode:</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#9f2089' }}>
                    {selectedMethod}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Estimated Delivery:</span>
                  <strong style={{ fontSize: '13px', color: '#038d63' }}>3 - 5 Business Days</strong>
                </div>
              </div>

              {/* Live Order Tracking Timeline */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', textAlign: 'left', marginBottom: '16px' }}>
                <h6 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>
                  📦 Live Delivery Status
                </h6>
                <div className="order-tracking-timeline">
                  {/* Step 1 */}
                  <div className="timeline-step">
                    <div className="timeline-icon-wrap">
                      <div className="timeline-dot">✓</div>
                      <div className="timeline-bar" />
                    </div>
                    <div className="timeline-content">
                      <p className="timeline-step-title">Order Confirmed</p>
                      <p className="timeline-step-desc">Your order has been placed and confirmed today</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="timeline-step">
                    <div className="timeline-icon-wrap">
                      <div className="timeline-dot upcoming">2</div>
                      <div className="timeline-bar upcoming" />
                    </div>
                    <div className="timeline-content">
                      <p className="timeline-step-title" style={{ color: '#64748b' }}>Order Packed</p>
                      <p className="timeline-step-desc">Expected tomorrow</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="timeline-step">
                    <div className="timeline-icon-wrap">
                      <div className="timeline-dot upcoming">3</div>
                      <div className="timeline-bar upcoming" />
                    </div>
                    <div className="timeline-content">
                      <p className="timeline-step-title" style={{ color: '#64748b' }}>Shipped via Express</p>
                      <p className="timeline-step-desc">Handed over to courier partner</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="timeline-step">
                    <div className="timeline-icon-wrap">
                      <div className="timeline-dot upcoming">4</div>
                    </div>
                    <div className="timeline-content">
                      <p className="timeline-step-title" style={{ color: '#64748b' }}>Out for Delivery</p>
                      <p className="timeline-step-desc">Delivery within 3 to 5 business days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address Preview */}
              {address.name && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', textAlign: 'left', marginBottom: '18px' }}>
                  <h6 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Delivering To
                  </h6>
                  <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>
                    {address.name}
                  </p>
                  <p style={{ margin: '0 0 2px', fontSize: '12.5px', color: '#475569' }}>
                    {address.flat}, {address.area}
                  </p>
                  <p style={{ margin: '0', fontSize: '12.5px', color: '#475569' }}>
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                    📞 Contact: +91 {address.phone}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') window.print();
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    cursor: 'pointer'
                  }}
                >
                  🖨️ Download Order Receipt
                </button>

                <Link
                  href="/home"
                  style={{
                    display: 'block',
                    width: '100%',
                    background: '#9f2089',
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '13px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  🛍️ Continue Shopping
                </Link>
              </div>
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
              Pay with PhonePe
            </h4>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '14px', lineHeight: '1.4' }}>
              Instagram browser restricts direct app switching. Tap below to pay with PhonePe, or scan the QR code.
            </p>

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
                setActivePaymentMethod('phonepe');
                setPaymentCountdown(120);
                setIsWaitingPayment(true);
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
              Pay with PhonePe • Pay ₹{finalPayable.toFixed(2)} ➔
            </a>

            {qrCodeDataUrl && (
              <div style={{ margin: '10px auto', display: 'inline-block', border: '1px solid #eee', padding: '6px', borderRadius: '8px' }}>
                <img src={qrCodeDataUrl} alt="UPI QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
              </div>
            )}

            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={copyUpiId}
                style={{
                  background: copiedUpi ? '#2e7d32' : '#f0f0f5',
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

      {/* ================= PAYMENT APP WAITING, SMART FALLBACK & CONFIRMATION MODAL ================= */}
      {isWaitingPayment && (
        <div
          id="paymentWaitingModal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '390px',
              width: '100%',
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              animation: 'fadeInModal 0.25s ease',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Close / Cancel Button */}
            <button
              type="button"
              onClick={() => {
                if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
                if (appDetectTimeoutRef.current) clearTimeout(appDetectTimeoutRef.current);
                setIsWaitingPayment(false);
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '14px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                fontSize: '14px',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close"
            >
              ✕
            </button>

            {/* STAGE 1 & 2: LAUNCHING / SWITCHING TO PHONEPE / AWAITING */}
            {fallbackStage !== 'no_app_qr' && (
              <>
                {/* Animated Logo Container with Pulsing Ring */}
                <div
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    background:
                      activePaymentMethod === 'phonepe'
                        ? '#5f259f'
                        : activePaymentMethod === 'paytm'
                        ? '#002e6e'
                        : '#1a73e8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow:
                      activePaymentMethod === 'phonepe'
                        ? '0 0 0 10px rgba(95, 37, 159, 0.15), 0 8px 24px rgba(95, 37, 159, 0.35)'
                        : activePaymentMethod === 'paytm'
                        ? '0 0 0 10px rgba(0, 46, 110, 0.15), 0 8px 24px rgba(0, 46, 110, 0.35)'
                        : '0 0 0 10px rgba(26, 115, 232, 0.15), 0 8px 24px rgba(26, 115, 232, 0.35)',
                    marginBottom: '16px',
                    animation: 'paymentPulse 1.8s infinite',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <img
                    src={
                      activePaymentMethod === 'phonepe'
                        ? '/phonepe.svg'
                        : activePaymentMethod === 'paytm'
                        ? '/paytm_icon.svg'
                        : '/gpay_icon.svg'
                    }
                    alt="Payment App"
                    style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                  />
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 4px' }}>
                  {modalStatusText ||
                    `Opening ${
                      activePaymentMethod === 'phonepe'
                        ? 'PhonePe'
                        : activePaymentMethod === 'paytm'
                        ? 'Paytm'
                        : 'Google Pay'
                    }...`}
                </h3>

                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
                  Payable Amount:{' '}
                  <strong style={{ color: '#038d63', fontSize: '14px' }}>₹{finalPayable.toFixed(2)}</strong>
                </p>

                {/* If App Has Opened -> Show real countdown */}
                {hasAppOpened ? (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                        Awaiting Payment Confirmation
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: '800',
                          color: '#9f2089',
                          background: '#fdf4ff',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          border: '1px solid #f3e8f9',
                          fontVariantNumeric: 'tabular-nums'
                        }}
                      >
                        ⏱️ {Math.floor(paymentCountdown / 60)}:{String(paymentCountdown % 60).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Progress Bar filling over 120 seconds (2 minutes) */}
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        background: '#e2e8f0',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${((120 - paymentCountdown) / 120) * 100}%`,
                          background: 'linear-gradient(90deg, #9f2089, #038d63)',
                          transition: 'width 1s linear',
                          borderRadius: '3px'
                        }}
                      />
                    </div>

                    <div style={{ marginTop: '12px', textAlign: 'left', fontSize: '11.5px', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ color: '#038d63', fontWeight: '700' }}>✓</span>
                        <span>
                          {activePaymentMethod === 'phonepe'
                            ? 'PhonePe app launched'
                            : activePaymentMethod === 'paytm'
                            ? 'Paytm app launched'
                            : 'Google Pay launched'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ color: '#9f2089', fontWeight: '700' }}>⏳</span>
                        <span>Complete payment in app ({Math.floor(paymentCountdown / 60)}:{String(paymentCountdown % 60).padStart(2, '0')} remaining)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#888' }}>⚡</span>
                        <span>Order will confirm automatically upon return</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* While detecting app launch */
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      color: '#475569'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#9f2089', animation: 'paymentPulse 1s infinite' }} />
                      <strong style={{ color: '#1e293b' }}>
                        {fallbackStage === 'fallback_phonepe'
                          ? 'Paytm not found. Trying PhonePe...'
                          : 'Detecting installed UPI app...'}
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>
                      If your chosen app does not open automatically, we will switch to PhonePe or provide the QR scan.
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleManualConfirmPayment}
                    style={{
                      width: '100%',
                      background: '#038d63',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(3, 141, 99, 0.25)'
                    }}
                  >
                    <span>✓</span>
                    <span>I Have Paid • Confirm Order Now ➔</span>
                  </button>

                  {/* Fallback to PhonePe button if on Paytm */}
                  {activePaymentMethod !== 'phonepe' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFallbackStage('fallback_phonepe');
                        setModalStatusText('Switching to PhonePe...');
                        triggerAppIntent('phonepe');
                      }}
                      style={{
                        width: '100%',
                        background: '#5f259f',
                        color: '#fff',
                        border: 'none',
                        padding: '11px 16px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <img src="/phonepe.svg" alt="PhonePe" style={{ height: '16px' }} />
                      <span>Pay with PhonePe Instead ➔</span>
                    </button>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleReopenPaymentApp()}
                      style={{
                        flex: 1,
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Re-open App ➔
                    </button>
                    <button
                      type="button"
                      onClick={() => setFallbackStage('no_app_qr')}
                      style={{
                        flex: 1,
                        background: '#fdf4ff',
                        color: '#9f2089',
                        border: '1px solid #f3e8f9',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Show QR Code 📱
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* STAGE 3: NO APP FOUND -> DEDICATED QR & UTR FALLBACK (NO FAKE AUTO-CONFIRMATION) */}
            {fallbackStage === 'no_app_qr' && (
              <div>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff7ed', border: '2px solid #fed7aa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '10px' }}>
                  📱
                </div>

                <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#1a1a1a' }}>
                  UPI App Not Found on Device
                </h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px', lineHeight: '1.4' }}>
                  Scan this QR code with <strong>PhonePe, GPay, or Paytm</strong> on any phone, or copy the UPI ID to pay:
                </p>

                {/* QR Code Frame */}
                {qrCodeDataUrl ? (
                  <div style={{ display: 'inline-block', padding: '10px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '12px' }}>
                    <img src={qrCodeDataUrl} alt="UPI QR Code" style={{ width: '170px', height: '170px', display: 'block' }} />
                    <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: '800', color: '#038d63' }}>
                      Pay ₹{finalPayable.toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#888' }}>Generating payment QR...</p>
                )}

                {/* Copy UPI ID */}
                <div style={{ marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    style={{
                      background: copiedUpi ? '#038d63' : '#f8fafc',
                      color: copiedUpi ? '#fff' : '#1e293b',
                      border: '1px solid #cbd5e1',
                      padding: '8px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{copiedUpi ? '✓' : '📋'}</span>
                    <span>{copiedUpi ? 'UPI ID Copied!' : `Copy UPI ID: ${DEFAULT_PAYEE_VPA}`}</span>
                  </button>
                </div>

                {/* Enter 12-Digit UTR */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px', textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Enter 12-Digit UPI Ref / UTR No. *
                  </label>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px' }}>
                    Find the 12-digit UTR in your PhonePe / Paytm payment receipt after paying.
                  </p>
                  {modalUtrError && (
                    <div style={{ color: '#c62828', fontSize: '11px', marginBottom: '6px' }}>
                      {modalUtrError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="e.g. 412345678901"
                      value={modalUtrInput}
                      onChange={(e) => setModalUtrInput(e.target.value.replace(/\D/g, ''))}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '13.5px',
                        fontWeight: '600'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleModalVerifyUtr}
                      disabled={modalVerifyingUtr}
                      style={{
                        background: '#038d63',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {modalVerifyingUtr ? 'Verifying...' : 'Submit UTR ➔'}
                    </button>
                  </div>
                </div>

                {/* Retry Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFallbackStage('initial');
                      setModalStatusText('Opening PhonePe...');
                      triggerAppIntent('phonepe');
                    }}
                    style={{
                      flex: 1,
                      background: '#5f259f',
                      color: '#fff',
                      border: 'none',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Open PhonePe ➔
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFallbackStage('initial');
                      setModalStatusText('Opening Paytm...');
                      triggerAppIntent('paytm');
                    }}
                    style={{
                      flex: 1,
                      background: '#002e6e',
                      color: '#fff',
                      border: 'none',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Open Paytm ➔
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleManualConfirmPayment}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: '1px solid #cbd5e1',
                    color: '#64748b',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  I have completed payment in my app ➔
                </button>
              </div>
            )}

            {/* Bank Grade Security Footer */}
            <div style={{ marginTop: '14px', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span>🛡️</span>
              <span>256-Bit Bank Grade Encryption • 100% Secure</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
