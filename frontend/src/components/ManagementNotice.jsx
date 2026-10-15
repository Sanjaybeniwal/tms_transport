import React from 'react';
import { Alert, Snackbar } from '@mui/material';

export default function ManagementNotice({ notice, onClose }) {
  return <Snackbar open={Boolean(notice)} autoHideDuration={notice?.severity === 'error' ? null : 4500} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
    <Alert severity={notice?.severity || 'info'} onClose={onClose} variant="filled" sx={{ width: '100%', maxWidth: 560 }}>{notice?.message}</Alert>
  </Snackbar>;
}
