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
  InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';

import API from '../services/api';
import { validateIndianMobile, normalizeIndianMobile } from '../utils/formValidation';
import DataTable from '../components/DataTable';
import AdminHeader from '../components/AdminHeader';
import ManagementNotice from '../components/ManagementNotice';
import useManagementFeedback from '../hooks/useManagementFeedback';
import BusinessIcon from '@mui/icons-material/Business';

const Parties = () => {
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
  const [selectedParty, setSelectedParty] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  const fetchParties = async () => {
    setLoading(true);
    setListError(false);
    try {
      const res = await API.parties.list({ page: page + 1, limit, search });
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
    fetchParties();
  }, [page, limit, search]);

  const handleOpenForm = (party = null) => {
    clearNotice();
    reset();
    setSelectedParty(party);
    if (party) {
      setValue('name', party.name);
      setValue('contactPerson', party.contactPerson || '');
      setValue('mobile', party.mobile);
      setValue('gstNumber', party.gstNumber || '');
      setValue('address', party.address || '');
      setValue('status', party.status);
    } else {
      reset({ name: '', contactPerson: '', mobile: '', gstNumber: '', address: '', status: 'Active' });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const onSubmitForm = async (formData) => {
    try {
      if (selectedParty) {
        await API.parties.update(selectedParty.id, formData);
      } else {
        await API.parties.create(formData);
      }
      fetchParties();
      reportSuccess();
      handleCloseForm();
    } catch (err) {
      reportError(err);
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await API.parties.delete(id);
        if (data.length === 1 && page > 0) setPage(page - 1);
        else fetchParties();
      } catch (err) {
        reportError(err);
        console.error(err);
      }
    }
  };

  const columns = [
    { field: 'name', headerName: 'Customer (Party) Name', minWidth: 150 },
    { field: 'contactPerson', headerName: 'Contact Person', minWidth: 120 },
    { field: 'mobile', headerName: 'Mobile Number', minWidth: 120 },
    { field: 'gstNumber', headerName: 'GSTIN', minWidth: 120 },
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
        title="Customers / parties"
        description="Manage party contacts, GSTIN and freight accounts."
        icon={<BusinessIcon />}
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
            Add New Customer
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
        onRetry={fetchParties}
        onPageChange={setPage}
        onLimitChange={(value) => { setLimit(value); setPage(0); }}
        searchQuery={search}
        onSearchChange={(value) => { setSearch(value); setPage(0); }}
        searchPlaceholder="Search customer by name or GST..."
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
            {selectedParty ? 'Edit Customer Details' : 'Register New Customer'}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField required
                  fullWidth
                  label="Company Name"
                  {...register('name', { required: 'Company Name is required' })}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  {...register('contactPerson')}
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
                <TextField
                  fullWidth
                  label="GSTIN (optional)"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  inputProps={{ maxLength: 15, style: { textTransform: 'uppercase' } }}
                  {...register('gstNumber', { setValueAs: value => value?.trim().toUpperCase() })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Billing Address"
                  multiline
                  rows={2}
                  {...register('address')}
                />
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
              Save Customer
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Parties;
