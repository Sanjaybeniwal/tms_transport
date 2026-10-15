export const normalizeIndianMobile = (value) => {
  let number = String(value || '').trim().replace(/[\s()-]/g, '');
  number = number.replace(/^(\+91|0091)/, '');
  if (/^91\d{10}$/.test(number)) number = number.slice(2);
  return number;
};

export const validateIndianMobile = (value) => (
  /^[6-9]\d{9}$/.test(normalizeIndianMobile(value)) ||
  'Enter a 10-digit mobile number, with or without +91.'
);
