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
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
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
import PeopleIcon from '@mui/icons-material/People';

const Owners = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [openForm, setOpenForm] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerDetail, setOwnerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const res = await API.owners.list({ page: page + 1, limit, search });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, [page, limit, search]);

  const handleOpenForm = (owner = null) => {
    setSelectedOwner(owner);
    if (owner) {
      setValue('name', owner.name);
      setValue('mobile', owner.mobile);
      setValue('email', owner.email || '');
      setValue('address', owner.address || '');
      setValue('status', owner.status);
    } else {
      reset({ name: '', mobile: '', email: '', address: '', status: 'Active' });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const onSubmitForm = async (formData) => {
    try {
      if (selectedOwner) {
        await API.owners.update(selectedOwner.id, formData);
      } else {
        await API.owners.create(formData);
      }
      fetchOwners();
      handleCloseForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this owner?')) {
      try {
        await API.owners.delete(id);
        fetchOwners();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleViewDetail = async (owner) => {
    setSelectedOwner(owner);
    setOpenDetail(true);
    setDetailLoading(true);
    try {
      const res = await API.owners.detail(owner.id);
      setOwnerDetail(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { field: 'name', headerName: 'Owner Name', minWidth: 150 },
    { field: 'mobile', headerName: 'Mobile Number', minWidth: 120 },
    { field: 'email', headerName: 'Email Address', minWidth: 180 },
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
        title="Vehicle Owners Manager"
        description="Register and manage vehicle owners, office addresses, primary contact lines, and ledger status."
        icon={<PeopleIcon />}
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
            Add New Owner
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
        searchPlaceholder="Search owner by name or mobile..."
        actions={(row) => (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <IconButton size="small" color="primary" onClick={() => handleViewDetail(row)}>
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

      {/* Add/Edit Modal */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
            {selectedOwner ? 'Edit Vehicle Owner Details' : 'Add New Vehicle Owner'}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Owner Name"
                  {...register('name', { required: 'Owner Name is required' })}
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
                  label="Email Address"
                  type="email"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">✉</InputAdornment>
                  }}
                  {...register('email')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Office/Home Address"
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
              Save Details
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Owner Detail Drawer/Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Owner Performance & Profile Summary</DialogTitle>
        <DialogContent dividers>
          {detailLoading || !ownerDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: 'primary.light', color: '#ffffff' }}>
                    <CardContent>
                      <Typography variant="body2">Total Trucks Owned</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>{ownerDetail.totalVehicles}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: 'secondary.light', color: '#ffffff' }}>
                    <CardContent>
                      <Typography variant="body2">Active Trips Assigned</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>{ownerDetail.activeTripsCount}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: parseFloat(ownerDetail.financials.profitLoss) >= 0 ? 'success.light' : 'error.light', color: '#ffffff' }}>
                    <CardContent>
                      <Typography variant="body2">Net Owner Earnings</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>₹{ownerDetail.financials.profitLoss}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Fleet vehicles list</Typography>
              <List>
                {ownerDetail.vehicles.map((v) => (
                  <ListItem key={v.id}>
                    <ListItemText
                      primary={v.vehicleNumber}
                      secondary={`Type: ${v.type} | Status: ${v.status}`}
                    />
                  </ListItem>
                ))}
                {ownerDetail.vehicles.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No registered vehicles found for this owner.</Typography>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Owners;
