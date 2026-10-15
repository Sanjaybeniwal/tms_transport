// Integer minor units throughout; never add or subtract binary floating point money.
const AppError = require('../utils/appError');
function cents(value = '0') {
  const text = String(value);
  if (!/^-?\d{1,12}(\.\d{1,2})?$/.test(text)) throw new AppError('Money must have at most two decimal places', 400);
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = text.replace('-', '').split('.');
  return (negative ? -1n : 1n) * (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')));
}
function money(value) {
  const sign = value < 0n ? '-' : ''; const n = value < 0n ? -value : value;
  return `${sign}${n / 100n}.${String(n % 100n).padStart(2, '0')}`;
}
const sum = (rows, key = 'amount') => rows.reduce((n, row) => n + cents(row[key] || '0'), 0n);
module.exports = { cents, money, sum };
