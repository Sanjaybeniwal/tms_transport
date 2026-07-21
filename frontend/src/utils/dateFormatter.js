/**
 * Safely formats a date string (YYYY-MM-DD or ISO) into DD-MM-YYYY format.
 * Prevents local timezone shift for YYYY-MM-DD input formats.
 * @param {string|Date} dateStr - The date to format.
 * @returns {string} The formatted date or empty string.
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string') {
    // If it is already in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    // Match YYYY-MM-DD
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Safely formats a datetime string into DD-MM-YYYY HH:mm format.
 * @param {string|Date} dateStr - The datetime to format.
 * @returns {string} The formatted date and time or empty string.
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};
