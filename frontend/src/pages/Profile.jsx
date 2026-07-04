import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Container,
  Grid,
  Avatar,
  Paper,
  TextField
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import SaveIcon from '@mui/icons-material/Save';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import AdminHeader from '../components/AdminHeader';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('/logo.png');

  // Contact info state
  const [contactInfo, setContactInfo] = useState({
    address: '',
    phone: '',
    email: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  // Check if the current user role is authorized to change the logo
  const canModifyBranding = ['Super Admin', 'Admin', 'Manager'].includes(user?.role);

  // Load contact info on mount
  useEffect(() => {
    if (canModifyBranding) {
      loadContactInfo();
    }
  }, []);

  const loadContactInfo = async () => {
    try {
      const response = await API.settings.getContactInfo();
      if (response.data.status === 'success') {
        setContactInfo(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load contact info', err);
    }
  };

  const handleSaveContact = async () => {
    setContactLoading(true);
    setContactSuccess('');
    setContactError('');
    try {
      const response = await API.settings.updateContactInfo(contactInfo);
      if (response.data.status === 'success') {
        setContactSuccess('Contact page details updated successfully! Changes are live on the public website.');
      }
    } catch (err) {
      console.error(err);
      setContactError(err.response?.data?.message || 'Failed to update contact details.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setErrorMsg('Please select an image file (PNG, JPG, or JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      setLogoPreview(base64Data);
      setSuccessMsg('');
      setErrorMsg('');

      setLoading(true);
      try {
        const response = await API.settings.uploadLogo({ logo: base64Data });
        if (response.data.status === 'success') {
          setSuccessMsg('Company logo uploaded and updated successfully!');
          const imgElements = document.querySelectorAll('img[alt="BUTS Logo"]');
          imgElements.forEach(img => {
            img.src = `/logo.png?t=${new Date().getTime()}`;
          });
        } else {
          setErrorMsg('Failed to update logo.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(err.response?.data?.message || 'Error occurred while uploading logo.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box>
      <AdminHeader
        title="Profile & Company Settings"
        description="Manage your login profile, upload/update company brand logos, and configure support contact details."
        icon={<PersonIcon />}
      />

      <Grid container spacing={4}>
        {/* User Information Card */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'secondary.main', mb: 2 }}>
                <PersonIcon sx={{ fontSize: 45 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {user?.name || 'User Account'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 600 }}>
                {user?.role}
              </Typography>

              <Divider sx={{ width: '100%', mb: 3 }} />

              <Box sx={{ width: '100%', textAlign: 'left' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                  Email Address
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                  {user?.email || 'N/A'}
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                  Account Status
                </Typography>
                <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 700 }}>
                  Active
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Company Logo / Settings Card */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}><BusinessIcon /></Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Company Branding
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Customize the logo that appears in your sidebar, header navigation, print sheets, and generated receipt PDFs.
              </Typography>

              {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}
              {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: '#f8fafc',
                    width: '100%',
                    maxWidth: 320,
                    height: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderColor: 'divider',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/logo.png';
                    }}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </Paper>

                {canModifyBranding ? (
                  <Box sx={{ width: '100%', textAlign: 'center' }}>
                    <input
                      accept="image/png, image/jpeg, image/jpg"
                      style={{ display: 'none' }}
                      id="logo-upload-button"
                      type="file"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                    <label htmlFor="logo-upload-button">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                        disabled={loading}
                        size="large"
                      >
                        {loading ? 'Uploading...' : 'Upload New Logo'}
                      </Button>
                    </label>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                      Recommended: Transparent PNG or light background JPG (aspect ratio close to 1:1 or 2:1)
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="warning" sx={{ width: '100%' }}>
                    Only users with Super Admin, Admin, or Manager roles can change the company branding.
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Page Details Card */}
        {canModifyBranding && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Avatar sx={{ bgcolor: '#059669' }}><ContactPhoneIcon /></Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Contact Page Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Update the address, phone number, and email displayed on the public Contact Us page.
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {contactSuccess && <Alert severity="success" sx={{ mb: 3 }}>{contactSuccess}</Alert>}
                {contactError && <Alert severity="error" sx={{ mb: 3 }}>{contactError}</Alert>}

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Office / Depot Address"
                      placeholder="E.g., 12, Transport Nagar, Phase-II, New Delhi - 110045"
                      value={contactInfo.address}
                      onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      placeholder="E.g., +91-9876543210"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      placeholder="E.g., billing@tmsexpress.com"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={contactLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      disabled={contactLoading}
                      onClick={handleSaveContact}
                      size="large"
                    >
                      {contactLoading ? 'Saving...' : 'Save Contact Details'}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Profile;
