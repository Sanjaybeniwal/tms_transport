import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  MenuItem,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';

import API from '../services/api';
import DataTable from '../components/DataTable';
import AdminHeader from '../components/AdminHeader';
import PersonIcon from '@mui/icons-material/Person';
import { formatDate } from '../utils/dateFormatter';

const Drivers = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [openForm, setOpenForm] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverHistory, setDriverHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await API.drivers.list({ page: page + 1, limit, search });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [page, limit, search]);

  const handleOpenForm = (driver = null) => {
    setSelectedDriver(driver);
    if (driver) {
      setValue('name', driver.name);
      setValue('mobile', driver.mobile);
      setValue('address', driver.address || '');
      setValue('licenseNumber', driver.licenseNumber);
      setValue('licenseExpiry', driver.licenseExpiry);
      setValue('joiningDate', driver.joiningDate || '');
      setValue('salary', driver.salary);
      setValue('status', driver.status);
    } else {
      reset({
        name: '',
        mobile: '',
        address: '',
        licenseNumber: '',
        licenseExpiry: '',
        joiningDate: '',
        salary: '',
        status: 'Active'
      });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const onSubmitForm = async (formData) => {
    try {
      if (selectedDriver) {
        await API.drivers.update(selectedDriver.id, formData);
      } else {
        await API.drivers.create(formData);
      }
      fetchDrivers();
      handleCloseForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await API.drivers.delete(id);
        fetchDrivers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleViewHistory = async (driver) => {
    setSelectedDriver(driver);
    setOpenHistory(true);
    setHistoryLoading(true);
    try {
      const res = await API.drivers.history(driver.id);
      setDriverHistory(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns = [
    { field: 'name', headerName: 'Driver Name', minWidth: 150 },
    { field: 'mobile', headerName: 'Mobile', minWidth: 120 },
    { field: 'licenseNumber', headerName: 'License No', minWidth: 130 },
    {
      field: 'licenseExpiry',
      headerName: 'License Expiry',
      minWidth: 120,
      renderCell: (row) => {
        const today = new Date();
        const expiry = new Date(row.licenseExpiry);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return <Chip label="Expired" size="small" color="error" />;
        if (diffDays <= 30) return <Chip label={`${diffDays}d left`} size="small" color="warning" />;
        return formatDate(row.licenseExpiry);
      }
    },
    {
      field: 'salary',
      headerName: 'Salary',
      minWidth: 100,
      renderCell: (row) => `₹${row.salary}`
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 100,
      renderCell: (row) => (
        <Chip
          label={row.status}
          color={row.status === 'Active' ? 'success' : 'default'}
          size="small"
        />
      )
    }
  ];

  return (
    <Box>
      <AdminHeader
        title="Drivers Fleet Registry"
        description="Register and manage transport drivers, license categories, medical/license expiry alerts, and trip history."
        icon={<PersonIcon />}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            sx={{
              background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}
          >
            Register Driver
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={limit}
        loading={loading}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, license..."
        actions={(row) => (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <IconButton size="small" color="primary" onClick={() => handleViewHistory(row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="secondary" onClick={() => handleOpenForm(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
            {selectedDriver ? 'Edit Driver Registry Record' : 'Register New Driver'}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Driver Name"
                  {...register('name', { required: 'Driver Name is required' })}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">📞</InputAdornment>
                  }}
                  {...register('mobile', { required: 'Mobile is required' })}
                  error={Boolean(errors.mobile)}
                  helperText={errors.mobile?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Driving License Number"
                  {...register('licenseNumber', { required: 'License is required' })}
                  error={Boolean(errors.licenseNumber)}
                  helperText={errors.licenseNumber?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label="License Expiration Date"
                  {...register('licenseExpiry', { required: 'License Expiry is required' })}
                  error={Boolean(errors.licenseExpiry)}
                  helperText={errors.licenseExpiry?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label="Date of Joining"
                  {...register('joiningDate')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Monthly Base Salary"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                  {...register('salary', { required: 'Salary is required' })}
                  error={Boolean(errors.salary)}
                  helperText={errors.salary?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Permanent Address"
                  multiline
                  rows={2}
                  {...register('address')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  defaultValue="Active"
                  {...register('status')}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Button onClick={handleCloseForm} variant="outlined" sx={{ color: 'text.secondary', borderColor: '#cbd5e1', borderRadius: '8px', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: '8px',
                px: 3,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
              }}
            >
              Save Driver
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Driver History Dialog */}
      <Dialog open={openHistory} onClose={() => setOpenHistory(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Driver Trip Assignment Logs</DialogTitle>
        <DialogContent dividers>
          {historyLoading || !driverHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Driver: {driverHistory.driver.name} | Mobile: {driverHistory.driver.mobile}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Assigned Trips History</Typography>
              {driverHistory.trips.length > 0 ? (
                <List>
                  {driverHistory.trips.map((trip) => (
                    <ListItem key={trip.id} sx={{ px: 0 }}>
                      <ListItemText
                        primary={`Trip #${trip.tripNumber} (${trip.fromLocation?.city} to ${trip.toLocation?.city})`}
                        secondary={`Vehicle: ${trip.vehicle?.vehicleNumber} | Freight: ₹${trip.freightAmount} | Date: ${formatDate(trip.startDate)} | Status: ${trip.status}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">No historical trip logs found for this driver.</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Drivers;
