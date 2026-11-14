import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Layout>
      <Head>
        <title>Contact Us | Meesho</title>
      </Head>

      <div style={{ padding: '16px 14px 60px', background: '#fff', minHeight: '80vh' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
          Contact Us
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
          We are here to help you 24/7.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
              Customer Support Helpline
            </p>
            <p style={{ margin: '0', fontSize: '16px', fontWeight: '800', color: '#038d63' }}>
              📞 1800-890-1234
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
              Available 9:00 AM - 7:00 PM (Mon - Sat)
            </p>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
              Email Support
            </p>
            <p style={{ margin: '0', fontSize: '15px', fontWeight: '800', color: '#9f2089' }}>
              ✉️ support@meesho.com
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
              Guaranteed response within 24 hours
            </p>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '14px' }}>
            Send Us a Message
          </h3>

          {submitted ? (
            <div style={{ background: '#e8f7f1', color: '#038d63', padding: '16px', borderRadius: '8px', textAlign: 'center', fontWeight: '700', fontSize: '14px' }}>
              ✓ Thank you! Your message has been sent. Our support team will get in touch shortly.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>Mobile Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>How can we help? *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your query or order question..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: '#9f2089',
                  color: '#fff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Send Message ➔
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
