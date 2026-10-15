import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAmount, indiaDateInput } from '../src/utils/indiaFormat.js';
import { formatDate, formatDateTime } from '../src/utils/dateFormatter.js';
import { normalizeIndianMobile, validateIndianMobile } from '../src/utils/formValidation.js';

test('Indian money retains paise and lakh grouping', () => {
  assert.equal(formatAmount('125000.5'), '1,25,000.50');
  assert.equal(formatAmount(-12500.25), '-12,500.25');
});

test('India date defaults cross midnight independently of host timezone', () => {
  assert.equal(indiaDateInput(new Date('2026-10-14T20:00:00Z')), '2026-10-15');
  assert.equal(formatDateTime('2026-10-14T20:00:00Z'), '15-10-2026 01:30 IST');
  assert.equal(formatDate('2026-10-15'), '15-10-2026');
});

test('accepted mobile formats produce the ten digits required by the API', () => {
  for (const value of ['9876543210', '98765 43210', '+91 9876543210', '00919876543210', '919876543210']) {
    assert.equal(validateIndianMobile(value), true);
    assert.equal(normalizeIndianMobile(value), '9876543210');
  }
  for (const value of ['123', 'abcdefghij', '1234567890', '+1 9876543210']) {
    assert.notEqual(validateIndianMobile(value), true);
  }
});
