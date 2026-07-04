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
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';

import API from '../services/api';
import DataTable from '../components/DataTable';
import AdminHeader from '../components/AdminHeader';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const Vehicles = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Owners list for select dropdown
  const [owners, setOwners] = useState([]);
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState('');

  // Modals state
  const [openForm, setOpenForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit, search };
      if (selectedOwnerFilter) {
        params.ownerId = selectedOwnerFilter;
      }
      const res = await API.vehicles.list(params);
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const res = await API.owners.list({ limit: 100 });
      setOwners(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [page, limit, search, selectedOwnerFilter]);

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleOpenForm = (vehicle = null) => {
    setSelectedVehicle(vehicle);
    if (vehicle) {
      setValue('vehicleNumber', vehicle.vehicleNumber);
      setValue('vehicleType', vehicle.vehicleType);
      setValue('ownerId', vehicle.ownerId);
      setValue('rcNumber', vehicle.rcNumber);
      setValue('insuranceNumber', vehicle.insuranceNumber || '');
      setValue('insuranceExpiry', vehicle.insuranceExpiry || '');
      setValue('fitnessExpiry', vehicle.fitnessExpiry || '');
      setValue('permitExpiry', vehicle.permitExpiry || '');
      setValue('nationalPermitNumber', vehicle.nationalPermitNumber || '');
      setValue('nationalPermitExpiry', vehicle.nationalPermitExpiry || '');
      setValue('pollutionExpiry', vehicle.pollutionExpiry || '');
      setValue('status', vehicle.status);
    } else {
      reset({
        vehicleNumber: '',
        vehicleType: '',
        ownerId: '',
        rcNumber: '',
        insuranceNumber: '',
        insuranceExpiry: '',
        fitnessExpiry: '',
        permitExpiry: '',
        nationalPermitNumber: '',
        nationalPermitExpiry: '',
        pollutionExpiry: '',
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
      if (selectedVehicle) {
        await API.vehicles.update(selectedVehicle.id, formData);
      } else {
        await API.vehicles.create(formData);
      }
      fetchVehicles();
      handleCloseForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await API.vehicles.delete(id);
        fetchVehicles();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getDocExpiryStatus = (expiryDate) => {
    if (!expiryDate) return <Typography variant="caption" color="text.secondary">N/A</Typography>;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Chip label="Expired" size="small" color="error" />;
    } else if (diffDays <= 30) {
      return <Chip label={`${diffDays}d left`} size="small" color="warning" />;
    }
    return <Typography variant="body2" color="text.secondary">{expiryDate}</Typography>;
  };

  const columns = [
    { field: 'vehicleNumber', headerName: 'Vehicle Number', minWidth: 120 },
    { field: 'vehicleType', headerName: 'Type', minWidth: 100 },
    {
      field: 'owner',
      headerName: 'Owner Name',
      minWidth: 150,
      renderCell: (row) => row.owner ? row.owner.name : 'N/A'
    },
    {
      field: 'insuranceExpiry',
      headerName: 'Insurance Expiry',
      minWidth: 120,
      renderCell: (row) => getDocExpiryStatus(row.insuranceExpiry)
    },
    {
      field: 'permitExpiry',
      headerName: 'Permit Expiry',
      minWidth: 120,
      renderCell: (row) => getDocExpiryStatus(row.permitExpiry)
    },
    {
      field: 'nationalPermitNumber',
      headerName: 'Chassis No',
      minWidth: 150,
      renderCell: (row) => row.nationalPermitNumber || 'N/A'
    },
    {
      field: 'nationalPermitExpiry',
      headerName: 'Nat. Permit Expiry',
      minWidth: 140,
      renderCell: (row) => getDocExpiryStatus(row.nationalPermitExpiry)
    },
    {
      field: 'fitnessExpiry',
      headerName: 'Fitness Expiry',
      minWidth: 120,
      renderCell: (row) => getDocExpiryStatus(row.fitnessExpiry)
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
        title="Vehicles Fleet Manager"
        description="Register and manage fleet trucks, trailers, insurance, fitness, permit expiry status, and assigned owners."
        icon={<LocalShippingIcon />}
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
            Add New Vehicle
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
        searchPlaceholder="Search by vehicle number..."
        filterComponent={
          <TextField
            select
            size="small"
            label="Filter by Owner"
            value={selectedOwnerFilter}
            onChange={(e) => setSelectedOwnerFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All Owners</MenuItem>
            {owners.map(o => (
              <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
            ))}
          </TextField>
        }
        actions={(row) => (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <IconButton size="small" color="secondary" onClick={() => handleOpenForm(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      />

      {/* Add/Edit Modal */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {selectedVehicle ? 'Edit Vehicle Fleet Record' : 'Register New Vehicle'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Vehicle Number"
                  {...register('vehicleNumber', { required: 'Vehicle Number is required' })}
                  error={Boolean(errors.vehicleNumber)}
                  helperText={errors.vehicleNumber?.message}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Vehicle Type (e.g. 10-Tyre Truck)"
                  {...register('vehicleType', { required: 'Vehicle Type is required' })}
                  error={Boolean(errors.vehicleType)}
                  helperText={errors.vehicleType?.message}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Fleet Owner"
                  defaultValue=""
                  {...register('ownerId', { required: 'Owner selection is required' })}
                  error={Boolean(errors.ownerId)}
                  helperText={errors.ownerId?.message}
                >
                  <MenuItem value="" disabled>Select Owner</MenuItem>
                  {owners.map(o => (
                    <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="RC Book Number"
                  {...register('rcNumber', { required: 'RC Number is required' })}
                  error={Boolean(errors.rcNumber)}
                  helperText={errors.rcNumber?.message}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Engine number"
                  {...register('insuranceNumber')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Chassis number"
                  {...register('nationalPermitNumber')}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Document Expiration Dates</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label="Insurance Expiry"
                  {...register('insuranceExpiry')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label="Fitness Expiry"
                  {...register('fitnessExpiry')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label="Permit Expiry"
                  {...register('permitExpiry')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label="National Permit Expiry"
                  {...register('nationalPermitExpiry')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label="Pollution Expiry"
                  {...register('pollutionExpiry')}
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
          <DialogActions>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save Vehicle
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Vehicles;
