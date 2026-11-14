# Meesho Combo Store - Next.js Reverse-Engineered Storefront

A high-performance, responsive Next.js storefront faithfully reverse-engineered from `https://darkorange-goose-402785.hostingersite.com/home.php`, featuring 32 Men & Unisex Fashion Combo sets (₹99 sale price, ₹2,999 MRP), slide-out cart drawer with **Buy 2 Get 1 Free** calculation, 3-step checkout, and verified multi-channel UPI routing for `e-com-store` merchant credentials (`Q98220817@ybl` / `Online Shopping`).

---

## 1. Key Features

- **Welcome Popup (`/`, `/welcome`):** Clean modal landing card promoting the featured wholesale combo with 1-click continuation into shopping.
- **Home Catalog (`/home`, `/home.php`):**
  - Top delivery & return GIF banner (`mwccw.gif`)
  - Meesho Maha Sale main banner (`cloth.webp`)
  - Animated running marquee: *Buy 2 Get 1 Free • Extra ₹33 off on UPI payments • 100% Free Delivery*
  - Lower deals tag banner (`xwgyl_800.webp`)
  - Live synchronized countdown deal timer (`clock-icon.png`)
  - 2-column mobile-optimized product grid with all 32 fashion combos (₹99, 93% off, Hot Sell badge, ratings, reviews, Meesho Assured tag)
  - Real-time search query filtering (`/home?q=...`)
- **Product Details Page (`/product?id=...`, `/product.php?id=...`):**
  - Dynamic ID resolution for all 32 products
  - High-resolution showcase & color variant selector
  - Size selection pill buttons (XS to 6XL)
  - Specifications table & full product details
  - Verified ratings breakdown (5-star meters & real customer reviews)
  - Sticky bottom action bar with **Add to Cart** and **Buy Now** buttons
- **3-Step Stepper Checkout (`/checkout`, `/checkout.php`):**
  - **Step 1 (Cart Review):** Item list, quantity increment/decrement (`+/-`), instant item removal, and automated **Buy 2 Get 1 Free** unit deduction.
  - **Step 2 (Address Form):** Full Name, 10-digit mobile number validation, 6-digit Pincode, City, House/Flat No., and Area.
  - **Step 3 (Payment Selection):**
    - Google Pay (Instant UPI Fast Pay)
    - PhonePe (20% Cashback in 24 hours)
    - Paytm (Fast & Secure UPI)
    - Cash on Delivery (COD - Pay at Doorstep)
  - **Step 4 (Order Placed Successfully 🎉):**
    - Animated green checkmark
    - Unique Order ID (e.g. `MSH-XXXX`)
    - Order summary with paid amount and payment method
    - Estimated delivery timeframe (3-5 business days)
- **Legal Compliance Pages:**
  - `/privacy-policy` (`/privacy-policy.php`)
  - `/terms` (`/terms.php`)
  - `/refund-policy` (`/refund-policy.php`)
  - `/shipping-policy` (`/shipping-policy.php`)
  - `/contact` (`/contact.php`)

---

## 2. Payment Engine & Merchant Configuration

The payment subsystem integrates the verified high-conversion routing from `e-com-store`:

### Credentials
- **Payee VPA (`pa`):** `Q98220817@ybl` (configurable via `NEXT_PUBLIC_UPI_MERCHANT_VPA`)
- **Payee Name (`pn`):** `Online Shopping` (configurable via `NEXT_PUBLIC_UPI_MERCHANT_NAME`)
- **Transaction Note (`tn`):** `Online Shopping` (configurable via `NEXT_PUBLIC_UPI_TRANSACTION_NOTE`)

### Platform-Specific Deep Link Strategies
1. **Android PhonePe & Google Pay:**
   - Emits PhonePe's native external merchant collect deep link with base64-encoded checkout parameters:
     ```
     phonepe://native?data=<base64-payload>&id=p2ppayment
     ```
2. **Android Paytm:**
   - Emits Paytm's money transfer cash wallet link:
     ```
     paytmmp://cash_wallet?pa=Q98220817@ybl&pn=Online%20Shopping&am=99.00&tr=&mc=8999&cu=INR&tn=Online%20Shopping&featuretype=money_transfer
     ```
3. **iPhone (iOS Safari / Chrome):**
   - Routes all UPI app selections exclusively to PhonePe using the verified baseline:
     ```
     phonepe:upi://pay?pa=Q98220817@ybl&pn=Online%20Shopping&am=99.00&cu=INR&tn=Online%20Shopping
     ```
   - **Crucial Rule:** Omits `tr=`, `mc=`, `mode=`, and `sign=` to completely prevent PhonePe's blocking modal: *"As per UPI guidelines, payment through a link is not allowed for this merchant"*.
4. **Meta In-App Browser on iOS (Instagram / Facebook / Messenger):**
   - Detects `isMetaInAppIOS` to prevent `window.location.href` navigation crashes.
   - Automatically presents a sleek fallback modal with:
     - Direct `<a target="_top">` deep link
     - Dynamic UPI QR code generated on-the-fly with `qrcode`
     - 1-tap **Copy UPI ID** button with clipboard feedback
5. **Cash on Delivery (COD):**
   - Bypasses external UPI redirection and advances straight to Step 4 Order Confirmation.

---

## 3. Environment Variables

Create `.env.local` for custom deployments:

```env
NEXT_PUBLIC_UPI_MERCHANT_VPA=Q98220817@ybl
NEXT_PUBLIC_UPI_MERCHANT_NAME=Online Shopping
NEXT_PUBLIC_UPI_TRANSACTION_NOTE=Online Shopping
NEXT_PUBLIC_META_PIXEL_ID=1190211293630447
```

---

## 4. Development & Testing

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run development server
npm run dev

# Production build
npm run build
npm start
```

---

## 5. Deployment

Deployable instantly to Vercel, Netlify, or any Node.js hosting platform with zero configuration. All legacy `.php` paths (`/home.php`, `/checkout.php`, `/product.php`) automatically rewrite to Next.js routes via `next.config.js`.

