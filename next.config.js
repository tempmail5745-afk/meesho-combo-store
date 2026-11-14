/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/home.php',
        destination: '/home'
      },
      {
        source: '/product.php',
        destination: '/product'
      },
      {
        source: '/checkout.php',
        destination: '/checkout'
      },
      {
        source: '/privacy-policy.php',
        destination: '/privacy-policy'
      },
      {
        source: '/terms.php',
        destination: '/terms'
      },
      {
        source: '/refund-policy.php',
        destination: '/refund-policy'
      },
      {
        source: '/shipping-policy.php',
        destination: '/shipping-policy'
      },
      {
        source: '/contact.php',
        destination: '/contact'
      }
    ];
  }
};

module.exports = nextConfig;
