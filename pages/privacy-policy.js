import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <Head>
        <title>Privacy Policy | Meesho</title>
      </Head>

      <div style={{ padding: '16px 14px 60px', background: '#fff', minHeight: '80vh' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
          Last Updated: October 2026
        </p>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            1. Introduction
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            Welcome to <strong>Meesho</strong>. We respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, and protect your data.
          </p>
        </section>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            2. Information We Collect
          </h2>
          <ul style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li><strong>Contact Details:</strong> Full name, delivery address, phone number, and email.</li>
            <li><strong>Order Information:</strong> Items purchased, order amount, and payment mode (UPI / Online Payment). We never store UPI PINs or card details.</li>
            <li><strong>Device Information:</strong> Browser type, operating system, and visit statistics to optimize shopping experience.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            3. How We Use Your Information
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            We use your information strictly to process, pack, and deliver orders, provide customer support, detect and prevent fraud, and keep you informed about delivery milestones.
          </p>
        </section>

        <section style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            4. Data Security & Encryption
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            We implement 256-bit SSL encryption and strict security standards to ensure your personal details are fully protected against unauthorized access.
          </p>
        </section>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginTop: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
            Grievance Officer
          </h3>
          <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 4px' }}>
            <strong>Store:</strong> Meesho
          </p>
          <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 4px' }}>
            <strong>Helpline:</strong> 1800-890-1234
          </p>
          <p style={{ fontSize: '12.5px', color: '#475569', margin: '0' }}>
            <strong>Email:</strong> privacy@meesho.com
          </p>
        </div>
      </div>
    </Layout>
  );
}
