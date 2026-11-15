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
    assert.equal(DEFAULT_PAYEE_NAME, 'Meesho');
    assert.equal(DEFAULT_TRANSACTION_NOTE, 'Meesho');
  });

  test('Android PhonePe native URI encodes valid base64 payload', () => {
    const uri = buildPhonePeNativeUri({
      vpa: 'Q98220817@ybl',
      name: 'Meesho',
      amount: 99
    });

    assert.ok(uri.startsWith('phonepe://native?data='));
    assert.ok(uri.includes('&id=p2ppayment'));

    const dataParam = decodeURIComponent(uri.split('data=')[1].split('&')[0]);
    const decoded = JSON.parse(Buffer.from(dataParam, 'base64').toString('utf8'));

    assert.equal(decoded.p2pPaymentCheckoutParams.checkoutType, 'COLLECT');
    assert.equal(decoded.p2pPaymentCheckoutParams.initialAmount, 9900);
    assert.equal(decoded.contact.vpa, 'Q98220817@ybl');
    assert.equal(decoded.contact.name, 'Meesho');
  });

  test('Android Paytm cash_wallet URI includes required parameters', () => {
    const uri = buildPaytmCashWalletUri({
      vpa: 'Q98220817@ybl',
      name: 'Meesho',
      amount: 99,
      note: 'Meesho'
    });

    assert.ok(uri.startsWith('paytmmp://cash_wallet?'));
    assert.ok(uri.includes('pa=Q98220817%40ybl'));
    assert.ok(uri.includes('pn=Meesho'));
    assert.ok(uri.includes('am=99.00'));
    assert.ok(uri.includes('mc=8999'));
    assert.ok(uri.includes('featuretype=money_transfer'));
  });

  test('iOS PhonePe URI omits tr=, mc=, mode=, and sign= to prevent UPI link block', () => {
    const uri = buildIosPhonePeUri({
      vpa: 'Q98220817@ybl',
      name: 'Meesho',
      amount: 99,
      note: 'Meesho'
    });

    assert.ok(uri.startsWith('phonepe:upi://pay?'));
    assert.ok(uri.includes('pa=Q98220817@ybl'));
    assert.ok(uri.includes('pn=Meesho'));
    assert.ok(uri.includes('am=99.00'));
    assert.ok(uri.includes('cu=INR'));
    assert.ok(uri.includes('tn=Meesho'));

    // Critical negative assertions
    assert.ok(!uri.includes('tr='), 'iOS URI must NOT contain tr= parameter');
    assert.ok(!uri.includes('mc='), 'iOS URI must NOT contain mc= parameter');
    assert.ok(!uri.includes('mode='), 'iOS URI must NOT contain mode= parameter');
    assert.ok(!uri.includes('sign='), 'iOS URI must NOT contain sign= parameter');
  });

  test('Product catalog contains exactly 150 products (50 in each price tier: 99, 149, 199)', () => {
    assert.equal(ALL_PRODUCTS.length, 150);
    assert.equal(ALL_PRODUCTS.filter(p => p.price === 99).length, 50);
    assert.equal(ALL_PRODUCTS.filter(p => p.price === 149).length, 50);
    assert.equal(ALL_PRODUCTS.filter(p => p.price === 199).length, 50);
    ALL_PRODUCTS.forEach(p => {
      assert.ok(p.id >= 1 && p.id <= 150);
      assert.ok([99, 149, 199].includes(p.price));
      assert.ok(p.image.startsWith('/images/') || p.image.startsWith('https://'));
      assert.ok(Array.isArray(p.images) && p.images.length > 0);
      assert.ok(Array.isArray(p.reviews) && p.reviews.length > 0);
    });
  });

  test('getProductById retrieves correct trending products across price tiers', () => {
    const p1 = getProductById(1);
    assert.ok(p1.title.includes('Biker Jacket Combo'));
    assert.equal(p1.price, 99);
    assert.equal(p1.category, 'Jackets & Winterwear');

    const p51 = getProductById(51);
    assert.ok(p51.title.includes('Fleece Hoodie'));
    assert.equal(p51.price, 149);
    assert.equal(p51.category, 'Hoodies & Winterwear');

    const p101 = getProductById(101);
    assert.ok(p101.title.includes('Smartwatch'));
    assert.equal(p101.price, 199);
  });
});

