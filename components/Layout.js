import React, { useState } from 'react';
import Header from './Header';
import CartDrawer from './CartDrawer';
import SideMenu from './SideMenu';
import { useCart } from '../lib/cartContext';

export default function Layout({ children, hideHeader = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toastMessage, isToastVisible } = useCart();

  return (
    <div className="meesho-mobile-shell">
      {/* Toast Notification */}
      {isToastVisible && (
        <div id="meeshoToast" className="meesho-toast-notification" style={{ display: 'block' }}>
          <span id="meeshoToastText">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      {!hideHeader && <Header onMenuClick={() => setIsMenuOpen(true)} />}

      {/* Main Content */}
      <main className="meesho-main-content">
        {children}
      </main>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Side Menu */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}

