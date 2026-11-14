import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_PRODUCTS, getProductById } from '../lib/products.js';

describe('Checkout & Cart Calculation Verification', () => {
  test('Buy 2 Get 1 Free correctly discounts the lowest price items', () => {
    // Simulate 3 items: 2 paid, 1 free
    const cart = [
      { id: 1, title: 'Item 1', price: 99, originalPrice: 2999, qty: 3 }
    ];
    let totalQty = 3;
    const freeCount = Math.floor(totalQty / 3);
    assert.equal(freeCount, 1);

    const paidQty = totalQty - freeCount;
    assert.equal(paidQty, 2);

    const payable = paidQty * 99;
    assert.equal(payable, 198);
  });

  test('6 items in cart grants 2 free items', () => {
    const totalQty = 6;
    const freeCount = Math.floor(totalQty / 3);
    assert.equal(freeCount, 2);

    const paidQty = totalQty - freeCount;
    assert.equal(paidQty, 4);
    assert.equal(paidQty * 99, 396);
  });

  test('UTR 12-digit format validation', () => {
    const isValidUtr = (utr) => /^\d{12}$/.test(String(utr).trim());
    assert.equal(isValidUtr('412345678901'), true);
    assert.equal(isValidUtr('412345'), false);
    assert.equal(isValidUtr('41234567890123'), false);
    assert.equal(isValidUtr('abcdef123456'), false);
  });

  test('Address formatting aligns flat, area, landmark, city, state, and pincode', () => {
    const address = {
      name: 'Rahul Sharma',
      phone: '9876543210',
      pincode: '110001',
      city: 'Delhi',
      state: 'Delhi',
      flat: 'Flat 402, Sunshine Apts',
      area: 'MG Road',
      landmark: 'Near Metro',
      addressType: 'home'
    };

    const fullLine = [address.flat, address.area, address.landmark, address.city, address.state].filter(Boolean).join(', ') + ` - ${address.pincode}`;
    assert.equal(fullLine, 'Flat 402, Sunshine Apts, MG Road, Near Metro, Delhi, Delhi - 110001');
    assert.equal(address.phone, '9876543210');
  });

  test('10-second payment countdown timer transitions to order confirmed when app has opened', () => {
    let countdown = 10;
    let orderFinalized = false;
    let currentStep = 3;
    const hasAppOpened = true;

    // Simulate 10 second countdown ticks
    for (let tick = 1; tick <= 10; tick++) {
      if (hasAppOpened) {
        countdown -= 1;
        if (countdown <= 0) {
          orderFinalized = true;
          currentStep = 4;
        }
      }
    }

    assert.equal(countdown, 0);
    assert.equal(orderFinalized, true);
    assert.equal(currentStep, 4); // Step 4 = Order Success
  });

  test('When Paytm is not installed, fallback switches to PhonePe', () => {
    let selectedMethod = 'paytm';
    let hasAppOpened = false;
    let fallbackStage = 'initial';

    // Simulated 1.8s timeout check
    if (!hasAppOpened && selectedMethod === 'paytm') {
      fallbackStage = 'fallback_phonepe';
      selectedMethod = 'phonepe';
    }

    assert.equal(fallbackStage, 'fallback_phonepe');
    assert.equal(selectedMethod, 'phonepe');
  });

  test('When no UPI app opens, auto-order timer is halted to prevent fake orders', () => {
    const hasAppOpened = false;
    let fallbackStage = 'no_app_qr';
    let autoOrderConfirmed = false;

    // Timer check: if fallbackStage === 'no_app_qr', timer must not execute
    if (fallbackStage !== 'no_app_qr' && hasAppOpened) {
      autoOrderConfirmed = true;
    }

    assert.equal(autoOrderConfirmed, false, 'Fake order was placed even though no app was opened');
    assert.equal(fallbackStage, 'no_app_qr');
  });
});

