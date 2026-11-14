import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PAYEE_VPA,
  DEFAULT_PAYEE_NAME,
  DEFAULT_TRANSACTION_NOTE,
  buildPhonePeNativeUri,
  buildPaytmCashWalletUri,
  buildIosPhonePeUri
} from '../lib/upiPayment.js';
import { ALL_PRODUCTS, getProductById } from '../lib/products.js';

describe('Merchant Configuration & Routing Verification', () => {
  test('Merchant default values match requested e-com-store credentials', () => {
    assert.equal(DEFAULT_PAYEE_VPA, 'Q98220817@ybl');
    assert.equal(DEFAULT_PAYEE_NAME, 'Online Shopping');
    assert.equal(DEFAULT_TRANSACTION_NOTE, 'Online Shopping');
  });

  test('Android PhonePe native URI encodes valid base64 payload', () => {
    const uri = buildPhonePeNativeUri({
      vpa: 'Q98220817@ybl',
      name: 'Online Shopping',
      amount: 99
    });

    assert.ok(uri.startsWith('phonepe://native?data='));
    assert.ok(uri.includes('&id=p2ppayment'));

    const dataParam = decodeURIComponent(uri.split('data=')[1].split('&')[0]);
    const decoded = JSON.parse(Buffer.from(dataParam, 'base64').toString('utf8'));

    assert.equal(decoded.p2pPaymentCheckoutParams.checkoutType, 'COLLECT');
    assert.equal(decoded.p2pPaymentCheckoutParams.initialAmount, 9900);
    assert.equal(decoded.contact.vpa, 'Q98220817@ybl');
    assert.equal(decoded.contact.name, 'Online Shopping');
  });

  test('Android Paytm cash_wallet URI includes required parameters', () => {
    const uri = buildPaytmCashWalletUri({
      vpa: 'Q98220817@ybl',
      name: 'Online Shopping',
      amount: 99,
      note: 'Online Shopping'
    });

    assert.ok(uri.startsWith('paytmmp://cash_wallet?'));
    assert.ok(uri.includes('pa=Q98220817%40ybl'));
    assert.ok(uri.includes('pn=Online%20Shopping'));
    assert.ok(uri.includes('am=99.00'));
    assert.ok(uri.includes('mc=8999'));
    assert.ok(uri.includes('featuretype=money_transfer'));
  });

  test('iOS PhonePe URI omits tr=, mc=, mode=, and sign= to prevent UPI link block', () => {
    const uri = buildIosPhonePeUri({
      vpa: 'Q98220817@ybl',
      name: 'Online Shopping',
      amount: 99,
      note: 'Online Shopping'
    });

    assert.ok(uri.startsWith('phonepe:upi://pay?'));
    assert.ok(uri.includes('pa=Q98220817@ybl'));
    assert.ok(uri.includes('pn=Online%20Shopping'));
    assert.ok(uri.includes('am=99.00'));
    assert.ok(uri.includes('cu=INR'));
    assert.ok(uri.includes('tn=Online%20Shopping'));

    // Critical negative assertions
    assert.ok(!uri.includes('tr='), 'iOS URI must NOT contain tr= parameter');
    assert.ok(!uri.includes('mc='), 'iOS URI must NOT contain mc= parameter');
    assert.ok(!uri.includes('mode='), 'iOS URI must NOT contain mode= parameter');
    assert.ok(!uri.includes('sign='), 'iOS URI must NOT contain sign= parameter');
  });

  test('Product catalog contains exactly 32 products with local image paths', () => {
    assert.equal(ALL_PRODUCTS.length, 32);
    ALL_PRODUCTS.forEach(p => {
      assert.ok(p.id >= 1 && p.id <= 32);
      assert.ok(p.price === 149);
      assert.ok(p.image.startsWith('/images/products/'));
    });
  });

  test('getProductById retrieves correct combo product', () => {
    const p1 = getProductById(1);
    assert.equal(p1.title, 'Burgundy Ombre Cord Jacket Combo');
    assert.equal(p1.color, 'Burgundy');

    const p2 = getProductById(2);
    assert.equal(p2.title, 'Brown Leather Zip Jacket Combo');
    assert.equal(p2.color, 'Brown');
  });
});

