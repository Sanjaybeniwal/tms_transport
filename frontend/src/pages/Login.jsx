import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Container
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const { login, verifyOtp } = useContext(AuthContext);
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification States
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await login(data.email, data.password);
      setLoading(false);
      
      if (res.success) {
        if (res.otpRequired) {
          setOtpStep(true);
          setOtpEmail(res.email);
        } else {
          navigate('/admin');
        }
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('An unexpected error occurred. Please try again.');
    }
  };

  const onVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setErrorMsg('Please enter the verification code.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await verifyOtp(otpEmail, otpCode);
      setLoading(false);
      if (res.success) {
        navigate('/admin');
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Verification failed. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', // Deep slate space background
        py: 6
      }}
    >
      <Container maxWidth="xs">
        <Card sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(10px)',
          border: 'none',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        }}>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ 
              mb: 2,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <img src="/logo.png" alt="BUTS Logo" style={{ height: '140px', marginTop: '-20px', marginBottom: '-20px', objectFit: 'contain' }} />
            </Box>

            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Bombay Uttaranchal Tempo Service Portal
            </Typography>

            {errorMsg && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {errorMsg}
              </Alert>
            )}

            {otpStep ? (
              <form onSubmit={onVerifyOtpSubmit} style={{ width: '100%' }}>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 500 }}>
                  Enter the 6-digit verification code sent to your registered administrator emails.
                </Typography>
                
                <TextField
                  fullWidth
                  label="Verification Code (OTP)"
                  margin="normal"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter Code"
                  required
                  autoFocus
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3, mb: 1, py: 1.5, background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Log In'}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  onClick={() => { setOtpStep(false); setErrorMsg(''); }}
                  sx={{ mt: 1, color: 'text.secondary' }}
                >
                  Back to Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  margin="normal"
                  type="email"
                  {...register('email', { 
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                />

                <TextField
                  fullWidth
                  label="Password"
                  margin="normal"
                  type="password"
                  {...register('password', { 
                    required: 'Password is required'
                  })}
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3, mb: 1, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;
