import { formatAmount } from '../utils/indiaFormat';
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
import DownloadIcon from '@mui/icons-material/Download';
import { useForm } from 'react-hook-form';

import API from '../services/api';
import { validateIndianMobile, normalizeIndianMobile } from '../utils/formValidation';
import DataTable from '../components/DataTable';
import AdminHeader from '../components/AdminHeader';
import ManagementNotice from '../components/ManagementNotice';
import useManagementFeedback from '../hooks/useManagementFeedback';
import PersonIcon from '@mui/icons-material/Person';
import { formatDate } from '../utils/dateFormatter';

const Drivers = () => {
  const { notice, clearNotice, reportError, reportSuccess } = useManagementFeedback();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modals state
  const [openForm, setOpenForm] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverHistory, setDriverHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  const fetchDrivers = async () => {
    setLoading(true);
    setListError(false);
    try {
      const res = await API.drivers.list({ page: page + 1, limit, search });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      setListError(true);
      reportError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [page, limit, search]);

  const handleOpenForm = (driver = null) => {
    clearNotice();
    reset();
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
      reportSuccess();
      handleCloseForm();
    } catch (err) {
      reportError(err);
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await API.drivers.delete(id);
        if (data.length === 1 && page > 0) setPage(page - 1);
        else fetchDrivers();
      } catch (err) {
        reportError(err);
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
      reportError(err);
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await API.drivers.list({ page: 1, limit: 10000, search });
      const driversList = res.data.data || [];

      if (driversList.length === 0) {
        alert('No driver records available to export.');
        return;
      }

      const csvRows = [];
      csvRows.push(['Drivers List']);
      csvRows.push(['Generated On', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })]);
      csvRows.push([]);

      csvRows.push([
        'S.No',
        'Driver Name',
        'Mobile Number',
        'License Number',
        'Licence expiry',
        'Joining Date',
        'Salary (₹)',
        'Status',
        'Address'
      ]);

      driversList.forEach((driver, idx) => {
        csvRows.push([
          idx + 1,
          driver.name || '-',
          driver.mobile || '-',
          driver.licenseNumber || '-',
          driver.licenseExpiry ? formatDate(driver.licenseExpiry) : '-',
          driver.joiningDate ? formatDate(driver.joiningDate) : '-',
          driver.salary !== undefined && driver.salary !== null ? Number(driver.salary).toFixed(2) : '0.00',
          driver.status || 'Active',
          driver.address || '-'
        ]);
      });

      const csvContent = '\uFEFF' + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `drivers_list_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      reportError(err);
      console.error('Failed to export drivers list to Excel:', err);
      alert('Failed to export driver list. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { field: 'name', headerName: 'Driver Name', minWidth: 150 },
    { field: 'mobile', headerName: 'Mobile', minWidth: 120 },
    { field: 'licenseNumber', headerName: 'Licence no.', minWidth: 130 },
    {
      field: 'licenseExpiry',
      headerName: 'Licence expiry',
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
      renderCell: (row) => `₹${formatAmount(row.salary)}`
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
      <ManagementNotice notice={notice} onClose={clearNotice} />
      <AdminHeader
        title="Drivers"
        description="Keep driver contacts, driving licences, salaries and trip history in one place."
        icon={<PersonIcon />}
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="success"
              startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
              onClick={handleExportExcel}
              disabled={exporting}
              sx={{
                fontWeight: 700,
                borderColor: '#10b981',
                color: '#059669',
                bgcolor: '#ecfdf5',
                '&:hover': {
                  borderColor: '#059669',
                  bgcolor: '#d1fae5'
                }
              }}
            >
              {exporting ? 'Exporting...' : 'Download Excel'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm()}
              sx={{
                background: '#197769',
                color: '#ffffff',
                fontWeight: 700,
                boxShadow: 'none'
              }}
            >
              Register Driver
            </Button>
          </Box>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={limit}
        loading={loading}
        error={listError}
        onRetry={fetchDrivers}
        onPageChange={setPage}
        onLimitChange={(value) => { setLimit(value); setPage(0); }}
        searchQuery={search}
        onSearchChange={(value) => { setSearch(value); setPage(0); }}
        searchPlaceholder="Search by name, license..."
        filterComponent={
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon fontSize="small" />}
            onClick={handleExportExcel}
            disabled={exporting}
            sx={{ fontWeight: 600 }}
          >
            {exporting ? 'Exporting...' : 'Export Excel'}
          </Button>
        }
        actions={(row) => (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <IconButton aria-label="View details" size="small" color="primary" onClick={() => handleViewHistory(row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="Edit record" size="small" color="secondary" onClick={() => handleOpenForm(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="Delete record" size="small" color="error" onClick={() => handleDelete(row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
            {selectedDriver ? 'Edit driver' : 'Add driver'}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField required
                  fullWidth
                  label="Driver Name"
                  {...register('name', { required: 'Driver Name is required' })}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required
                  fullWidth
                  label="Mobile number"
                  type="tel"
                  autoComplete="tel-national"
                  inputProps={{ inputMode: 'tel' }}
                  placeholder="98765 43210"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">IN</InputAdornment>
                  }}
                  {...register('mobile', { required: 'Mobile number is required', validate: validateIndianMobile, setValueAs: normalizeIndianMobile })}
                  error={Boolean(errors.mobile)}
                  helperText={errors.mobile?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required
                  fullWidth
                  label="Driving licence number"
                  {...register('licenseNumber', { required: 'License is required' })}
                  error={Boolean(errors.licenseNumber)}
                  helperText={errors.licenseNumber?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label="Licence expiry date"
                  {...register('licenseExpiry', { required: 'Licence expiry is required' })}
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
                <TextField required
                  fullWidth
                  type="number"
                  inputProps={{ step: '0.01', inputMode: 'decimal' }}
                  label="Monthly salary (₹)"
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
              disabled={isSubmitting}
              variant="contained"
              sx={{
                background: '#197769',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: '8px',
                px: 3,
                boxShadow: 'none'
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
