import { useState } from 'react';

export default function useManagementFeedback() {
  const [notice, setNotice] = useState(null);
  const clearNotice = () => setNotice(null);
  const reportError = (error, fallback = 'Could not complete the request. Please try again.') => {
    setNotice({ severity: 'error', message: error.response?.data?.message || fallback });
  };
  const reportSuccess = (message = 'Saved successfully.') => setNotice({ severity: 'success', message });
  return { notice, clearNotice, reportError, reportSuccess };
}
