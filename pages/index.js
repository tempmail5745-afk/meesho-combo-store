import HomePage from './home';

// Export HomePage directly as the root index route
// This removes the "Welcome" single-product bridge popup so that clicking "Order Now" on ads
// opens the full, proper e-commerce store immediately with all 150 trending products,
// urgent countdown timer, and price store sections (₹99, ₹149, ₹199).
export default HomePage;
