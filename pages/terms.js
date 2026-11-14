import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function TermsPage() {
  return (
    <Layout>
      <Head>
        <title>Terms & Conditions | Meesho</title>
      </Head>

      <div style={{ padding: '16px 14px 60px', background: '#fff', minHeight: '80vh' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
          Terms & Conditions
        </h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
          Last Updated: October 2026
        </p>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            1. Overview & Acceptance
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            This website is operated by <strong>Meesho</strong>. Throughout the site, the terms &quot;we&quot;, &quot;us&quot;, and &quot;our&quot; refer to Meesho. By visiting our site and/or purchasing something from us, you engage in our &quot;Service&quot; and agree to be bound by the following terms and conditions.
          </p>
        </section>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            2. Online Store Terms
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            By agreeing to these Terms, you represent that you are at least the age of majority in your state or province of residence. You may not use our products for any illegal or unauthorized purpose nor may you violate any laws in your jurisdiction.
          </p>
        </section>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            3. Products & Pricing
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue any product or service without notice. We make every effort to display the colors and images of our products accurately.
          </p>
        </section>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            4. Orders & Billing Accuracy
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            We reserve the right to refuse or cancel any order you place with us. In the event that we make a change to or cancel an order, we will attempt to notify you by contacting the email and/or billing address/phone number provided at the time the order was made.
          </p>
        </section>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            5. Payments & Security
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            All payments are securely processed via UPI, QR, or verified payment partners. We use industry-standard end-to-end 256-bit SSL encryption to protect your transactions.
          </p>
        </section>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            6. Governing Law
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India.
          </p>
        </section>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginTop: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
            Contact Information
          </h3>
          <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 4px' }}>
            <strong>Merchant:</strong> Meesho
          </p>
          <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 4px' }}>
            <strong>Customer Helpline:</strong> 1800-890-1234 (Toll-Free, 9 AM - 7 PM)
          </p>
          <p style={{ fontSize: '12.5px', color: '#475569', margin: '0' }}>
            <strong>Email:</strong> support@meesho.com
          </p>
        </div>
      </div>
    </Layout>
  );
}
