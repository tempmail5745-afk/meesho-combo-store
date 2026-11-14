import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useCart } from '../lib/cartContext';

export default function CartPage() {
  const router = useRouter();
  const { openDrawer } = useCart();

  useEffect(() => {
    // Automatically redirect to checkout or open drawer
    router.replace('/checkout');
  }, [router]);

  return (
    <Layout>
      <Head>
        <title>Your Cart | Meesho</title>
      </Head>
      <div style={{ padding: '40px 14px', textAlign: 'center', minHeight: '60vh' }}>
        <p style={{ fontSize: '15px', color: '#666' }}>Redirecting to your cart...</p>
      </div>
    </Layout>
  );
}

