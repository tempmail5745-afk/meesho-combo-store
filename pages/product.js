import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { getProductById } from '../lib/products';
import { useCart } from '../lib/cartContext';

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart, buyNow } = useCart();

  const [product, setProduct] = useState(getProductById(1));
  const [activeImage, setActiveImage] = useState(product.image);
  const [selectedSize, setSelectedSize] = useState('M');
  const [timeLeft, setTimeLeft] = useState('14m 28s');

  useEffect(() => {
    if (id) {
      const p = getProductById(id);
      setProduct(p);
      setActiveImage(p.image);
      if (p.sizes && p.sizes.length > 0) {
        setSelectedSize(p.sizes[2] || p.sizes[0]);
      }
      if (typeof window !== 'undefined' && window.fbq && p) {
        try {
          window.fbq('track', 'ViewContent', {
            content_name: p.title,
            content_ids: [String(p.id)],
            content_type: 'product',
            value: p.price,
            currency: 'INR'
          });
        } catch (_) {}
      }
    }
  }, [id]);

  useEffect(() => {
    const updateTimer = () => {
      const period = 15 * 60; // 15-minute rolling countdown nearest to end
      const currentSec = Math.floor(Date.now() / 1000) % period;
      const remaining = period - currentSec;
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      setTimeLeft(`${m}m ${s}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <Head>
        <title>{product.title} | Meesho</title>
        <meta name="description" content={product.description} />
      </Head>

      <div className="product-detail-view-root">
        {/* 1. Main Image Showcase */}
        <div className="pdp-image-container">
          <img
            id="mainProductImg"
            src={activeImage}
            alt={product.title}
            className="pdp-main-img"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          {product.isHotSell && <div className="hot-sell-badge">Hot Sell</div>}
        </div>

        {/* 2. Variant Thumbnails Gallery */}
        <div className="color-div">
          <div className="color-list p-2" style={{ display: 'flex', gap: '8px', padding: '8px', overflowX: 'auto' }}>
            {(product.images && product.images.length > 0 ? product.images : [product.image]).map((img, idx) => (
              <div
                key={idx}
                className={`color-box ${activeImage === img ? 'active' : ''}`}
                onClick={() => setActiveImage(img)}
                style={{
                  width: '60px',
                  height: '60px',
                  flexShrink: 0,
                  border: activeImage === img ? '2px solid #9f2089' : '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={img}
                  alt={`${product.title} view ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 3. Product Info Card */}
        <div className="pdp-info-card">
          <div className="pdp-title-row">
            <h1 className="pdp-product-title">{product.title}</h1>
          </div>

          <div className="pdp-price-row">
            <span className="price">₹{product.price}.00</span>
            <span className="mrp">₹{product.originalPrice}.00</span>
            <span className="discount">{product.discount}</span>
          </div>

          {/* Live Deal Timer */}
          <div className="card-offer-wrapper" style={{ margin: '4px 0 8px', alignSelf: 'flex-start' }}>
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

          {/* Special Offers Tag */}
          <div className="pdp-special-offer-pill">
            <span className="special-offer-text">₹59 with 2 Special Offers</span>
            <svg width="16" height="16" fill="#91E5BD" xmlns="http://www.w3.org/2000/svg">
              <rect width="16" height="16" rx="8"></rect>
              <path
                d="M6.387 4.59a.647.647 0 0 0 0 .908L8.86 8l-2.474 2.502a.647.647 0 0 0 0 .91.63.63 0 0 0 .899 0l2.927-2.96a.647.647 0 0 0 0-.91l-2.927-2.96a.636.636 0 0 0-.9.007Z"
                fill="#038D63"
              />
            </svg>
          </div>

          {/* Rating & Trusted Row */}
          <div className="pdp-ratings-line">
            <div className="rating-pill-green">
              <span>{product.rating} ★</span>
            </div>
            <span className="pdp-reviews-count">{product.reviewsCount} ratings and reviews</span>
            <span className="pdp-dot">&bull;</span>
            <span className="pdp-free-delivery">Free Delivery</span>
          </div>
        </div>

        {/* Size Selector */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="pdp-specs-card" style={{ marginTop: '12px' }}>
            <h6 className="specs-card-title">Select Size</h6>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {product.sizes.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: selectedSize === s ? '2px solid #9f2089' : '1px solid #ccc',
                    background: selectedSize === s ? '#fbeff9' : '#fff',
                    color: selectedSize === s ? '#9f2089' : '#333',
                    fontWeight: selectedSize === s ? '700' : '500',
                    cursor: 'pointer'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Product Details Specs Table */}
        <div className="pdp-specs-card">
          <h6 className="specs-card-title">Product Details</h6>
          <table className="specs-table">
            <tbody>
              <tr>
                <td className="spec-label">Brand</td>
                <td className="spec-val">Meesho Assured</td>
              </tr>
              <tr>
                <td className="spec-label">Category</td>
                <td className="spec-val">{product.category}</td>
              </tr>
              <tr>
                <td className="spec-label">Type</td>
                <td className="spec-val">{product.subCategory}</td>
              </tr>
              <tr>
                <td className="spec-label">Fabric</td>
                <td className="spec-val">{product.fabric}</td>
              </tr>
              <tr>
                <td className="spec-label">Country of Origin</td>
                <td className="spec-val">India</td>
              </tr>
              <tr>
                <td className="spec-label">Net Quantity</td>
                <td className="spec-val">1 Pack</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginTop: '12px' }}>
            {product.description}
          </p>
        </div>

        {/* 5. Rating & Reviews Breakdown */}
        <div className="pdp-ratings-breakdown-card">
          <h6 className="specs-card-title">Product Rating and Review</h6>
          <div className="rating-summary-row">
            <div className="rating-big-box">
              <h2 className="rating-big-num">{product.rating}</h2>
              <span className="rating-big-star">★</span>
              <p className="rating-total-text">{product.reviewsCount} Ratings</p>
            </div>

            <div className="rating-meters-col">
              <div className="meter-row">
                <span className="meter-label">Excellent</span>
                <div className="meter-bar"><div className="meter-fill" style={{ width: '70%' }}></div></div>
                <span className="meter-count">70%</span>
              </div>
              <div className="meter-row">
                <span className="meter-label">Very Good</span>
                <div className="meter-bar"><div className="meter-fill" style={{ width: '18%' }}></div></div>
                <span className="meter-count">18%</span>
              </div>
              <div className="meter-row">
                <span className="meter-label">Good</span>
                <div className="meter-bar"><div className="meter-fill" style={{ width: '8%' }}></div></div>
                <span className="meter-count">8%</span>
              </div>
              <div className="meter-row">
                <span className="meter-label">Average</span>
                <div className="meter-bar"><div className="meter-fill" style={{ width: '3%' }}></div></div>
                <span className="meter-count">3%</span>
              </div>
              <div className="meter-row">
                <span className="meter-label">Poor</span>
                <div className="meter-bar"><div className="meter-fill" style={{ width: '1%' }}></div></div>
                <span className="meter-count">1%</span>
              </div>
            </div>
          </div>

          {/* Customer Reviews List */}
          <div className="reviews-list">
            {(product.reviews && product.reviews.length > 0 ? product.reviews : [
              { id: 1, user: 'Geeta Khan', rating: 5, date: 'October 1, 2026', comment: 'Same as shown, Mst hai, ❤️❤️ Amazing quality and fast delivery!' },
              { id: 2, user: 'Ajay Patil', rating: 4.8, date: 'September 28, 2026', comment: 'Exceeded my expectations, great job! Packaging was awesome.' },
              { id: 3, user: 'Bhumi Shukla', rating: 4.5, date: 'September 24, 2026', comment: 'Really happy with the purchase! Value for money.' }
            ]).map((rev, rIdx) => (
              <div className="review-item" key={rev.id || rIdx}>
                <div className="review-user-row">
                  <div className="user-avatar-circle">{(rev.user || 'U')[0]}</div>
                  <div className="user-name-date">
                    <span className="rev-name">{rev.user}</span>
                    <span className="rev-date">Posted on {rev.date}</span>
                  </div>
                </div>
                <div className="review-rating-pill"><span>{rev.rating} ★</span></div>
                <p className="review-comment-text">{rev.comment}</p>
                <div className="review-helpful-row"><span>👍 Helpful ({500 + (rIdx * 115) + (product.id * 7) % 300})</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Sticky Bottom Action Bar */}
        <div className="pdp-bottom-action-bar">
          <button
            type="button"
            className="btn-pdp-add-cart"
            onClick={() => addToCart({ ...product, size: selectedSize })}
          >
            <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 5h15l-1 7H8L6 2H2" stroke="#9F2089" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="18" r="1.5" fill="#9F2089" />
              <circle cx="17" cy="18" r="1.5" fill="#9F2089" />
            </svg>
            Add to Cart
          </button>

          <button
            type="button"
            className="btn-pdp-buy-now"
            onClick={() => buyNow({ ...product, size: selectedSize }, router)}
          >
            <svg width="20" height="20" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1.894 4.546v11.796a.5.5 0 0 0 .837.369l6.74-6.18a.5.5 0 0 0-.017-.752l-6.74-5.617a.5.5 0 0 0-.82.384ZM11.894 4.546v11.796a.5.5 0 0 0 .837.369l6.74-6.18a.5.5 0 0 0-.017-.752l-6.74-5.617a.5.5 0 0 0-.82.384Z"
                fill="#fff"
              />
            </svg>
            Buy Now
          </button>
        </div>
      </div>
    </Layout>
  );
}

