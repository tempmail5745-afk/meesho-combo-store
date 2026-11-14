import React from 'react';
import Link from 'next/link';

export default function SideMenu({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="drawer-overlay"
        style={{ display: 'block' }}
        onClick={onClose}
      />
      <div
        className="sidenav"
        style={{
          width: '300px',
          left: 0,
          right: 'auto',
          display: 'block',
          boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
        }}
      >
        <div className="sidenav-div">
          <div
            style={{
              background: '#9f2089',
              color: '#fff',
              padding: '24px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#fff',
                  color: '#9f2089',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '18px'
                }}
              >
                M
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Hello User</h4>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>Welcome to Meesho</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '26px',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
          </div>

          <div style={{ padding: '16px 0', flex: 1, overflowY: 'auto' }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
              <Link
                href="/home"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  color: '#333',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                🏠 Home
              </Link>
              <Link
                href="/home"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  color: '#333',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                🔥 Hot Selling Combos (₹99)
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  color: '#333',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                🛍️ View Cart
              </Link>
            </div>

            <div style={{ padding: '12px 0' }}>
              <span style={{ padding: '0 20px', fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: '700' }}>
                Legal & Policies
              </span>
              <Link
                href="/privacy-policy"
                onClick={onClose}
                style={{
                  display: 'block',
                  padding: '10px 20px',
                  color: '#555',
                  textDecoration: 'none',
                  fontSize: '13px'
                }}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                onClick={onClose}
                style={{
                  display: 'block',
                  padding: '10px 20px',
                  color: '#555',
                  textDecoration: 'none',
                  fontSize: '13px'
                }}
              >
                Terms of Service
              </Link>
              <Link
                href="/refund-policy"
                onClick={onClose}
                style={{
                  display: 'block',
                  padding: '10px 20px',
                  color: '#555',
                  textDecoration: 'none',
                  fontSize: '13px'
                }}
              >
                Refund Policy
              </Link>
              <Link
                href="/shipping-policy"
                onClick={onClose}
                style={{
                  display: 'block',
                  padding: '10px 20px',
                  color: '#555',
                  textDecoration: 'none',
                  fontSize: '13px'
                }}
              >
                Shipping Policy
              </Link>
              <Link
                href="/contact"
                onClick={onClose}
                style={{
                  display: 'block',
                  padding: '10px 20px',
                  color: '#555',
                  textDecoration: 'none',
                  fontSize: '13px'
                }}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

