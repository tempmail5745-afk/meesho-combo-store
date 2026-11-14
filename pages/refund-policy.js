import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function RefundPolicyPage() {
  return (
    <Layout>
      <Head>
        <title>Refund & Cancellation Policy | Meesho</title>
      </Head>

      <div style={{ padding: '16px 14px 60px', background: '#fff', minHeight: '80vh' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
          Refund & Return Policy
        </h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
          Last Updated: October 2026
        </p>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            1. 7-Day Hassle-Free Returns
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            We want you to love your purchase. If you receive a damaged, defective, or incorrect product, you can request a return or replacement within 7 days of delivery.
          </p>
        </section>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            2. Return Eligibility
          </h2>
          <ul style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li>Item must be unused, in the same condition as received, and with original tags intact.</li>
            <li>Original combo items must be returned together with packaging.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            3. Refund Process
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            Once your returned item is received and inspected, refunds are credited back to your original payment method within 5-7 business days.
          </p>
        </section>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginTop: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
            Need Help with Returns?
          </h3>
          <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 4px' }}>
            <strong>Email:</strong> returns@meesho.com
          </p>
          <p style={{ fontSize: '12.5px', color: '#475569', margin: '0' }}>
            <strong>Toll-Free Helpline:</strong> 1800-890-1234
          </p>
        </div>
      </div>
    </Layout>
  );
}
