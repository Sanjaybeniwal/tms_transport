const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});
export const formatINR = value => rupees.format(Number(value) || 0);
export const formatNumber = value => new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1
}).format(Number(value) || 0);
export const formatCompactINR = value => {
  const amount = Number(value) || 0;
  const absolute = Math.abs(amount);
  if (absolute >= 10000000) return `₹${formatNumber(amount / 10000000)} Cr`;
  if (absolute >= 100000) return `₹${formatNumber(amount / 100000)} L`;
  if (absolute >= 1000) return `₹${formatNumber(amount / 1000)}k`;
  return formatINR(amount);
};
export const indiaToday = () => new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata'
}).format(new Date());

export const formatAmount = (value) => new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(Number(value) || 0);

export const indiaDateInput = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = type => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};
