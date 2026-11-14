import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <>
      <Head>
        <title>Featured Products - Welcome</title>
        <meta
          name="description"
          content="Welcome to Meesho - Premium quality dry fruits, grocery combos, and daily essentials at lowest wholesale prices with free delivery."
        />
      </Head>

      <div className="landing-wrapper">
        <Link href="/home" className="popup-card">
          <h1 className="main-heading">Welcome</h1>

          <div className="product-box">
            <div className="single-image-container">
              <img
                className="product-image"
                src="https://cdn.shopify.com/s/files/1/0728/8487/9496/files/Gemini_Generated_Image_mgf77cmgf77cmgf7.png?v=1774764915"
                alt="Dry Fruits Combo Pack"
              />
            </div>

            <div className="product-title">
              Premium 4KG Mix Dry Fruits Combo – Almonds, Cashews, Pistachios &amp; Kishmish (1KG Each)
            </div>

            <div className="rating-container">
              <span className="rating-badge">4.4 ★</span>
              <span className="rating-count">(4,320 Ratings)</span>
            </div>

            <div className="price-container">
              <span className="current-price">₹199</span>
              <span className="original-price">₹5,999</span>
              <span className="discount">97% off</span>
            </div>
          </div>

          {/* Continue to Shopping Button */}
          <span className="cta-button">🛒 Continue to Shopping</span>

          <p className="welcome-text">
            Welcome to our Dryfruit and Grocery Store
          </p>

          <div className="secure-footer">
            <span>🔒 Secure Payment by</span>
            <img
              src="https://razorpay.com/assets/razorpay-logo.svg"
              className="razorpay-logo"
              alt="Razorpay"
            />
            <span className="trusted-box">
              <span className="trusted-icon">✓</span>
              <span>
                <strong className="trusted-title">Trusted &amp; Secure</strong>
                <br />
                <span className="trusted-description">100% Safe Payments</span>
              </span>
            </span>
          </div>
        </Link>

        {/* Compliance Footer Links */}
        <footer className="landing-compliance-footer">
          <div className="landing-compliance-links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <span>&bull;</span>
            <Link href="/terms">Terms of Service</Link>
            <span>&bull;</span>
            <Link href="/refund-policy">Refund Policy</Link>
            <span>&bull;</span>
            <Link href="/shipping-policy">Shipping Policy</Link>
            <span>&bull;</span>
            <Link href="/contact">Contact Us</Link>
          </div>
          <p>&copy; 2026 Meesho. All rights reserved.</p>
        </footer>
      </div>

      <style jsx>{`
        .landing-wrapper {
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 14px;
          background-color: #f0f2f5;
        }

        .popup-card {
          background: #ffffff;
          width: 100%;
          border-radius: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          padding: 36px 26px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .popup-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }

        .main-heading {
          font-size: 34px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #000000;
          margin-bottom: 22px;
          text-transform: uppercase;
        }

        .product-box {
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          border: 1px solid #f1f1f1;
          width: 100%;
          padding: 16px;
          margin-bottom: 22px;
          text-align: left;
        }

        .single-image-container {
          width: 100%;
          background-color: #f9f9f9;
          padding: 10px;
          border-radius: 16px;
          margin-bottom: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .product-image {
          width: 100%;
          max-height: 220px;
          object-fit: contain;
          border-radius: 12px;
        }

        .product-title {
          font-size: 15px;
          font-weight: 600;
          color: #2c2c2c;
          line-height: 1.4;
          margin-bottom: 8px;
        }

        .rating-container {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }

        .rating-badge {
          background-color: #388e3c;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .rating-count {
          font-size: 12px;
          color: #878787;
        }

        .price-container {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 8px;
        }

        .current-price {
          font-size: 22px;
          font-weight: 700;
          color: #000000;
        }

        .original-price {
          font-size: 14px;
          color: #878787;
          text-decoration: line-through;
        }

        .discount {
          font-size: 14px;
          font-weight: 600;
          color: #388e3c;
        }

        .cta-button {
          display: inline-block;
          width: 100%;
          padding: 14px 24px;
          background-color: #fb641b;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          border-radius: 6px;
          text-decoration: none;
          text-align: center;
          letter-spacing: 0.5px;
          margin-bottom: 14px;
          transition: background-color 0.2s ease, transform 0.1s ease;
          cursor: pointer;
          border: none;
        }

        .cta-button:hover {
          background-color: #e05515;
          transform: translateY(-1px);
        }

        .welcome-text {
          font-size: 14px;
          color: #666666;
          margin-bottom: 22px;
          font-weight: 400;
        }

        .secure-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 13px;
          color: #555555;
          margin-bottom: 8px;
        }

        .razorpay-logo {
          height: 16px;
          width: auto;
          vertical-align: middle;
        }

        .trusted-box {
          border-left: 1px solid #dddddd;
          padding-left: 8px;
          margin-left: 4px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          text-align: left;
        }

        .trusted-icon {
          width: 16px;
          height: 16px;
          background: #2f6df6;
          color: #ffffff;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .trusted-title {
          color: #2954c8;
          font-size: 10px;
        }

        .trusted-description {
          color: #5f7fe5;
          font-size: 9px;
        }

        .landing-compliance-footer {
          margin-top: 18px;
          text-align: center;
          font-size: 12px;
          color: #71717a;
          max-width: 440px;
          line-height: 1.6;
        }

        .landing-compliance-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px 12px;
          margin-bottom: 8px;
        }

        .landing-compliance-links a {
          color: #52525b;
          text-decoration: none;
          transition: color 0.2s;
        }

        .landing-compliance-links a:hover {
          color: #09090b;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .popup-card {
            padding: 26px 16px;
            border-radius: 28px;
          }

          .main-heading {
            font-size: 27px;
          }
        }
      `}</style>
    </>
  );
}

