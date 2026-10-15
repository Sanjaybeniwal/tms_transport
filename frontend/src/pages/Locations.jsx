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
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';

import API from '../services/api';
import DataTable from '../components/DataTable';
import AdminHeader from '../components/AdminHeader';
import ManagementNotice from '../components/ManagementNotice';
import useManagementFeedback from '../hooks/useManagementFeedback';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const Locations = () => {
  const { notice, clearNotice, reportError, reportSuccess } = useManagementFeedback();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);

  // Modals state
  const [openForm, setOpenForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  const fetchLocations = async () => {
    setLoading(true);
    setListError(false);
    try {
      const res = await API.locations.list({ page: page + 1, limit, search });
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
    fetchLocations();
  }, [page, limit, search]);

  const handleOpenForm = (loc = null) => {
    clearNotice();
    reset();
    setSelectedLocation(loc);
    if (loc) {
      setValue('name', loc.name);
      setValue('city', loc.city);
      setValue('state', loc.state);
      setValue('status', loc.status);
    } else {
      reset({ name: '', city: '', state: '', status: 'Active' });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const onSubmitForm = async (formData) => {
    try {
      if (selectedLocation) {
        await API.locations.update(selectedLocation.id, formData);
      } else {
        await API.locations.create(formData);
      }
      fetchLocations();
      reportSuccess();
      handleCloseForm();
    } catch (err) {
      reportError(err);
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await API.locations.delete(id);
        if (data.length === 1 && page > 0) setPage(page - 1);
        else fetchLocations();
      } catch (err) {
        reportError(err);
        console.error(err);
      }
    }
  };

  const columns = [
    { field: 'name', headerName: 'Location / Hub Name', minWidth: 150 },
    { field: 'city', headerName: 'City', minWidth: 120 },
    { field: 'state', headerName: 'State', minWidth: 120 },
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
        title="Locations"
        description="Add loading points, delivery locations and transport yards."
        icon={<LocationOnIcon />}
        action={
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
            Add location
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
        error={listError}
        onRetry={fetchLocations}
        onPageChange={setPage}
        onLimitChange={(value) => { setLimit(value); setPage(0); }}
        searchQuery={search}
        onSearchChange={(value) => { setSearch(value); setPage(0); }}
        searchPlaceholder="Search location by name or city..."
        actions={(row) => (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <IconButton aria-label="Edit record" size="small" color="secondary" onClick={() => handleOpenForm(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="Delete record" size="small" color="error" onClick={() => handleDelete(row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      />

      {/* Add/Edit Modal */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
            {selectedLocation ? 'Edit location' : 'Add location'}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField required
                  fullWidth
                  label="Location Name (e.g. Mumbai Yard)"
                  {...register('name', { required: 'Name is required' })}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required
                  fullWidth
                  label="City"
                  {...register('city', { required: 'City is required' })}
                  error={Boolean(errors.city)}
                  helperText={errors.city?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required
                  fullWidth
                  label="State"
                  {...register('state', { required: 'State is required' })}
                  error={Boolean(errors.state)}
                  helperText={errors.state?.message}
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
              Save Hub
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Locations;
