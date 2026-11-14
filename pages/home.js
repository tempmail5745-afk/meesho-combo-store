import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { ALL_PRODUCTS } from '../lib/products';
import { useCart } from '../lib/cartContext';

export default function HomePage() {
  const router = useRouter();
  const { buyNow } = useCart();
  const { q } = router.query;

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState('02h 45m 12s');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const totalSec = 86400 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
      const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const s = String(totalSec % 60).padStart(2, '0');
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter products by search query if present
  const displayProducts = React.useMemo(() => {
    if (!q || typeof q !== 'string') return ALL_PRODUCTS;
    const cleanQ = q.toLowerCase().trim();
    return ALL_PRODUCTS.filter(p =>
      p.title.toLowerCase().includes(cleanQ) ||
      p.category.toLowerCase().includes(cleanQ) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(cleanQ)) ||
      (p.color && p.color.toLowerCase().includes(cleanQ)) ||
      (p.fabric && p.fabric.toLowerCase().includes(cleanQ))
    );
  }, [q]);

  return (
    <Layout>
      <Head>
        <title>Sale Sale Sale - Home | Meesho</title>
        <meta
          name="description"
          content="Shop online for Electronics, Fashion, Home & Kitchen, Dry Fruits and more on Meesho at lowest wholesale prices. 100% Free Express Delivery & Instant UPI Payments."
        />
      </Head>

      <div className="home-top-section">
        {/* 1. Free Delivery GIF Banner */}
        <div className="top-gif-banner-wrap">
          <img
            src="/mwccw.gif"
            alt="Meesho Free Delivery"
            className="w-100 mb-1 d-block"
            style={{ width: '100%', display: 'block' }}
          />
        </div>

        {/* 2. Main Sale Banner */}
        <div className="main-banner-carousel">
          <div className="carousel-item active">
            <img
              className="d-block w-100 main-sale-img"
              src="/cloth.webp"
              alt="Meesho Maha Sale"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        </div>

        {/* 3. Running Marquee: Buy 2 Get 1 Free */}
        <div className="marquee-nav">
          <div className="marquee-wrapper">
            <div className="marquee-track">
              {Array.from({ length: 10 }).map((_, i) => (
                <React.Fragment key={i}>
                  <span>Buy 2 Get 1 Free (Add 3 item to cart)</span>
                  <span className="marquee-sep">&bull;</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Lower Sale Tag Banner */}
        <div className="lower-banner-wrap">
          <img
            src="/xwgyl_800.webp"
            alt="Meesho Deals"
            className="w-100 mb-1 d-block"
            style={{ width: '100%', display: 'block' }}
          />
        </div>
      </div>

      {/* Daily Deals Bar with Countdown */}
      <div className="daily-deals-root">
        <div className="daily-deals-container">
          <div className="daily-deals-title-group">
            <h5 className="daily-deals-heading">Daily Deals</h5>
            <span className="daily-deals-badge">Ends in</span>
          </div>
          <div className="offer-timer-pill">
            <img
              alt="Offer clock icon"
              width="16"
              height="16"
              src="/clock-icon.png"
              className="clock-icon"
            />
            <span className="offer-timer-text">{timeLeft}</span>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="products-section-wrap" style={{ padding: '0 8px' }}>
        <h4 className="section-title">
          {q ? `Search Results for "${q}"` : 'Products For You'}
        </h4>

        <div className="product-list-2col" id="productListGrid">
          {displayProducts.map((p) => (
            <div
              className="product-card"
              key={p.id}
              onClick={() => router.push(`/product?id=${p.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="product-img">
                <img src={p.image} alt={p.title} loading="lazy" />
                {p.isHotSell && <div className="hot-sell-badge">Hot Sell</div>}
              </div>

              <div className="product-details">
                <h3 className="product-name" title={p.title}>
                  {p.title}
                </h3>

                <div className="product-price">
                  <span className="sell-price">₹{p.price}.00</span>
                  <span className="mrp-price line-through">₹{p.originalPrice}.00</span>
                  <span className="off-percentage m-0">{p.discount}</span>
                </div>

                <div className="card-offer-wrapper">
                  <img
                    alt="Offer clock icon"
                    loading="lazy"
                    width="14"
                    height="14"
                    src="/clock-icon.png"
                    className="card-clock-icon"
                  />
                  <span className="card-offer-timer-text">{timeLeft}</span>
                </div>

                <button
                  type="button"
                  className="buynow-button product-page-buy buy_now"
                  onClick={(e) => {
                    e.stopPropagation();
                    buyNow(p, router);
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="#ffffff"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: '6px' }}
                  >
                    <path
                      d="M1.894 4.546v11.796a.5.5 0 0 0 .837.369l6.74-6.18a.5.5 0 0 0-.017-.752l-6.74-5.617a.5.5 0 0 0-.82.384ZM11.894 4.546v11.796a.5.5 0 0 0 .837.369l6.74-6.18a.5.5 0 0 0-.017-.752l-6.74-5.617a.5.5 0 0 0-.82.384Z"
                      fill="#fff"
                    />
                  </svg>
                  Buy Now
                </button>

                <div className="card-ratings-row">
                  <div className="rating-section">
                    <span className="rating-pill">
                      <span className="rating-num">{p.rating}</span>
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 20 20"
                        fill="#ffffff"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ marginLeft: '3px' }}
                      >
                        <path d="M19.5399 6.85L13.6199 5.5L10.5099 0.29C10.3999 0.11 10.2099 0 9.99993 0C9.78993 0 9.59993 0.11 9.48993 0.29L6.37993 5.5L0.45993 6.85C0.25993 6.9 0.0899297 7.05 0.0299297 7.25C-0.0300703 7.45 0.00992969 7.67 0.14993 7.83L4.13993 12.4L3.58993 18.44C3.56993 18.65 3.65993 18.85 3.82993 18.98C3.99993 19.1 4.21993 19.13 4.41993 19.05L9.99993 16.64L15.5799 19.03C15.6599 19.06 15.7399 19.08 15.8099 19.08L19.5399 6.85Z" />
                      </svg>
                    </span>
                    <span className="reviews-count">({p.reviewsCount})</span>
                  </div>

                  <span className="meesho-trusted-badge">
                    Meesho Assured
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Banner */}
      <div className="safety-banner" style={{ padding: '16px 12px 6px' }}>
        <img
          src="/safety_banner.webp"
          alt="Safe Payments"
          className="w-100"
          style={{ width: '100%', display: 'block', borderRadius: '8px' }}
        />
      </div>

      {/* Compliance Footer */}
      <footer style={{ padding: '20px 14px 80px', textAlign: 'center', fontSize: '12px', color: '#888' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 12px', marginBottom: '8px' }}>
          <Link href="/privacy-policy" style={{ color: '#555', textDecoration: 'none' }}>Privacy Policy</Link>
          <span>&bull;</span>
          <Link href="/terms" style={{ color: '#555', textDecoration: 'none' }}>Terms of Service</Link>
          <span>&bull;</span>
          <Link href="/refund-policy" style={{ color: '#555', textDecoration: 'none' }}>Refund Policy</Link>
          <span>&bull;</span>
          <Link href="/shipping-policy" style={{ color: '#555', textDecoration: 'none' }}>Shipping Policy</Link>
          <span>&bull;</span>
          <Link href="/contact" style={{ color: '#555', textDecoration: 'none' }}>Contact Us</Link>
        </div>
        <p>&copy; 2026 Meesho. All rights reserved.</p>
      </footer>
    </Layout>
  );
}

