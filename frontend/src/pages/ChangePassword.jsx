import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Grid,
  Avatar
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { AuthContext } from '../context/AuthContext';
import AdminHeader from '../components/AdminHeader';

const ChangePassword = () => {
  const { changePassword } = useContext(AuthContext);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    
    const res = await changePassword(data.oldPassword, data.newPassword);
    setLoading(false);
    
    if (res.success) {
      setSuccessMsg('Password changed successfully.');
      reset();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <Box>
      <AdminHeader
        title="Security & Password Change"
        description="Update your account credentials to keep your dispatcher ledger records safe."
        icon={<LockOpenIcon />}
      />

      <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
        <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
          <CardContent sx={{ p: 4 }}>
            {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
            {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  {...register('oldPassword', { required: 'Current password is required' })}
                  error={Boolean(errors.oldPassword)}
                  helperText={errors.oldPassword?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  {...register('newPassword', { 
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters long' }
                  })}
                  error={Boolean(errors.newPassword)}
                  helperText={errors.newPassword?.message}
                />
              </Grid>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  size="large"
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
};

export default ChangePassword;
