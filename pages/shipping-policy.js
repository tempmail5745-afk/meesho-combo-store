import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function ShippingPolicyPage() {
  return (
    <Layout>
      <Head>
        <title>Shipping & Delivery Policy | Meesho</title>
      </Head>

      <div style={{ padding: '16px 14px 60px', background: '#fff', minHeight: '80vh' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
          Shipping & Delivery Policy
        </h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
          Last Updated: October 2026
        </p>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            1. Free Express Shipping
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            We provide <strong>100% Free Shipping</strong> on all orders across India. There are no hidden fees or extra delivery charges.
          </p>
        </section>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            2. Delivery Timelines
          </h2>
          <ul style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li><strong>Order Processing:</strong> Orders are confirmed and packed within 24 hours.</li>
            <li><strong>Transit Time:</strong> 3 to 5 business days across all major metro cities and pin codes in India.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            3. Order Tracking
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            Once dispatched, you will receive tracking updates via SMS / notification with the courier AWB number.
          </p>
        </section>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginTop: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
            Shipping Inquiries
          </h3>
          <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 4px' }}>
            <strong>Email:</strong> shipping@meesho.com
          </p>
          <p style={{ fontSize: '12.5px', color: '#475569', margin: '0' }}>
            <strong>Helpline:</strong> 1800-890-1234
          </p>
        </div>
      </div>
    </Layout>
  );
}
