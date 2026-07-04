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
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import { useForm, Controller } from 'react-hook-form';

import API from '../services/api';
import DataTable from '../components/DataTable';
import AdminHeader from '../components/AdminHeader';
import AltRouteIcon from '@mui/icons-material/AltRoute';

const printStyles = `
@media print {
  /* Hide all app components */
  body > #root, 
  header, 
  nav, 
  aside,
  footer,
  .MuiBackdrop-root,
  .non-printable,
  .MuiDialogActions-root,
  .MuiDialogTitle-root {
    display: none !important;
  }
  
  /* Reset page body margins and padding */
  body, html {
    margin: 0 !important;
    padding: 0 !important;
    background-color: #fff !important;
  }
  
  /* Make the print container fill the page */
  .MuiDialog-root {
    position: relative !important;
    height: auto !important;
    width: 100% !important;
  }
  
  .MuiDialog-container {
    height: auto !important;
    display: block !important;
  }
  
  .MuiDialog-paper {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
  }
  
  .MuiDialogContent-root {
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
  }

  #receipt-print-area {
    width: 100% !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
}
`;

const Trips = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // supporting data lists for form dropdowns
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [parties, setParties] = useState([]);

  // Modals state
  const [openForm, setOpenForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isDriverAutoFilled, setIsDriverAutoFilled] = useState(false);

  // Printing state
  const [openPrint, setOpenPrint] = useState(false);
  const [printTripData, setPrintTripData] = useState(null);

  const handleOpenPrint = (trip) => {
    setPrintTripData(trip);
    setOpenPrint(true);
  };

  const handleClosePrint = () => {
    setOpenPrint(false);
    setPrintTripData(null);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm();

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await API.trips.list({ page: page + 1, limit, search });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [vRes, dRes, lRes, pRes] = await Promise.all([
        API.vehicles.list({ limit: 100, status: 'Active' }),
        API.drivers.list({ limit: 100, status: 'Active' }),
        API.locations.list({ limit: 100, status: 'Active' }),
        API.parties.list({ limit: 100, status: 'Active' })
      ]);
      setVehicles(vRes.data.data);
      setDrivers(dRes.data.data);
      setLocations(lRes.data.data);
      setParties(pRes.data.data);
    } catch (err) {
      console.error('Error fetching masters for trip formulation:', err);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [page, limit, search]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const watchedVehicleId = watch('vehicleId');

  useEffect(() => {
    const autoFillDriver = async () => {
      if (watchedVehicleId) {
        try {
          const res = await API.vehicles.lastDriver(watchedVehicleId);
          if (res.data && res.data.driver) {
            setValue('driverId', res.data.driver.id);
            setIsDriverAutoFilled(true);
          } else {
            setIsDriverAutoFilled(false);
          }
        } catch (err) {
          console.error('Error auto-filling driver:', err);
          setIsDriverAutoFilled(false);
        }
      }
    };
    autoFillDriver();
  }, [watchedVehicleId, setValue]);

  const handleOpenForm = (trip = null) => {
    setSelectedTrip(trip);
    setIsDriverAutoFilled(false); // Reset feedback flag on form open
    if (trip) {
      setValue('tripNumber', trip.tripNumber);
      setValue('vehicleId', trip.vehicleId);
      setValue('driverId', trip.driverId);
      setValue('fromLocationId', trip.fromLocationId);
      setValue('toLocationId', trip.toLocationId);
      setValue('partyId', trip.partyId);
      setValue('freightAmount', trip.freightAmount);
      setValue('advance', trip.advance);
      setValue('startDate', trip.startDate);
      setValue('endDate', trip.endDate || '');
      setValue('status', trip.status);
    } else {
      reset({
        tripNumber: `TRP-${Date.now().toString().slice(-6)}`,
        vehicleId: '',
        driverId: '',
        fromLocationId: '',
        toLocationId: '',
        partyId: '',
        freightAmount: '',
        advance: 0.00,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'Pending'
      });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const onSubmitForm = async (formData) => {
    try {
      if (selectedTrip) {
        await API.trips.update(selectedTrip.id, formData);
      } else {
        await API.trips.create(formData);
      }
      fetchTrips();
      handleCloseForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trip record?')) {
      try {
        await API.trips.delete(id);
        fetchTrips();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Pending': return 'default';
      case 'Running': return 'primary';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const columns = [
    { field: 'tripNumber', headerName: 'Trip No', minWidth: 100 },
    {
      field: 'vehicle',
      headerName: 'Vehicle',
      minWidth: 110,
      renderCell: (row) => row.vehicle ? row.vehicle.vehicleNumber : 'N/A'
    },
    {
      field: 'driver',
      headerName: 'Driver',
      minWidth: 120,
      renderCell: (row) => row.driver ? row.driver.name : 'N/A'
    },
    {
      field: 'route',
      headerName: 'Route',
      minWidth: 180,
      renderCell: (row) => {
        const from = row.fromLocation ? row.fromLocation.city : '?';
        const to = row.toLocation ? row.toLocation.city : '?';
        return `${from} ➔ ${to}`;
      }
    },
    {
      field: 'party',
      headerName: 'Customer',
      minWidth: 150,
      renderCell: (row) => row.party ? row.party.name : 'N/A'
    },
    {
      field: 'freightAmount',
      headerName: 'Freight',
      minWidth: 100,
      renderCell: (row) => `₹${row.freightAmount}`
    },
    {
      field: 'advance',
      headerName: 'Advance',
      minWidth: 100,
      renderCell: (row) => `₹${row.advance}`
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 110,
      renderCell: (row) => (
        <Chip
          label={row.status}
          color={getStatusChipColor(row.status)}
          size="small"
        />
      )
    }
  ];

  return (
    <Box>
      <AdminHeader
        title="Trips Management Hub"
        description="Plan, formulate, and monitor cargo transport trips, route logs, fuel slip allocations, and driver payments."
        icon={<AltRouteIcon />}
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
            Formulate New Trip
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
        searchPlaceholder="Search by trip number..."
        actions={(row) => (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <IconButton size="small" color="primary" onClick={() => handleOpenPrint(row)} title="Print Receipt / Manifest">
              <PrintIcon fontSize="small" />
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

      {/* Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
            {selectedTrip ? 'Update Trip Manifest' : 'Initiate New Delivery Trip'}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Trip Number"
                  {...register('tripNumber', { required: 'Trip Number is required' })}
                  error={Boolean(errors.tripNumber)}
                  helperText={errors.tripNumber?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="vehicleId"
                  control={control}
                  rules={{ required: 'Vehicle selection is required' }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => {
                    const selectedOption = vehicles.find(v => v.id === value) || null;
                    return (
                      <Autocomplete
                        options={vehicles}
                        getOptionLabel={(option) => `${option.vehicleNumber} (${option.vehicleType})`}
                        value={selectedOption}
                        onChange={(event, newValue) => {
                          onChange(newValue ? newValue.id : '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Assign Vehicle"
                            error={Boolean(error)}
                            helperText={error?.message}
                          />
                        )}
                      />
                    );
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="driverId"
                  control={control}
                  rules={{ required: 'Driver is required' }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => {
                    const selectedOption = drivers.find(d => d.id === value) || null;
                    return (
                      <Autocomplete
                        options={drivers}
                        getOptionLabel={(option) => `${option.name} (${option.mobile})`}
                        value={selectedOption}
                        onChange={(event, newValue) => {
                          setIsDriverAutoFilled(false);
                          onChange(newValue ? newValue.id : '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Assign Driver"
                            error={Boolean(error)}
                            helperText={error?.message || (isDriverAutoFilled ? "Last active driver auto-selected!" : "")}
                            FormHelperTextProps={{
                              sx: { color: isDriverAutoFilled && !error ? 'success.main' : 'inherit', fontWeight: isDriverAutoFilled ? 600 : 'inherit' }
                            }}
                          />
                        )}
                      />
                    );
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="partyId"
                  control={control}
                  rules={{ required: 'Customer is required' }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => {
                    const selectedOption = parties.find(p => p.id === value) || null;
                    return (
                      <Autocomplete
                        options={parties}
                        getOptionLabel={(option) => option.name}
                        value={selectedOption}
                        onChange={(event, newValue) => {
                          onChange(newValue ? newValue.id : '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Customer (Party)"
                            error={Boolean(error)}
                            helperText={error?.message}
                          />
                        )}
                      />
                    );
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="fromLocationId"
                  control={control}
                  rules={{ required: 'Source is required' }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => {
                    const selectedOption = locations.find(l => l.id === value) || null;
                    return (
                      <Autocomplete
                        options={locations}
                        getOptionLabel={(option) => `${option.name} (${option.city})`}
                        value={selectedOption}
                        onChange={(event, newValue) => {
                          onChange(newValue ? newValue.id : '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Source Location"
                            error={Boolean(error)}
                            helperText={error?.message}
                          />
                        )}
                      />
                    );
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="toLocationId"
                  control={control}
                  rules={{ required: 'Destination is required' }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => {
                    const selectedOption = locations.find(l => l.id === value) || null;
                    return (
                      <Autocomplete
                        options={locations}
                        getOptionLabel={(option) => `${option.name} (${option.city})`}
                        value={selectedOption}
                        onChange={(event, newValue) => {
                          onChange(newValue ? newValue.id : '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Destination Location"
                            error={Boolean(error)}
                            helperText={error?.message}
                          />
                        )}
                      />
                    );
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Freight Billing Amount"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                  {...register('freightAmount', { required: 'Freight amount is required' })}
                  error={Boolean(errors.freightAmount)}
                  helperText={errors.freightAmount?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Advance Amount Paid"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                  {...register('advance')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label="Start Date"
                  {...register('startDate', { required: 'Start Date is required' })}
                  error={Boolean(errors.startDate)}
                  helperText={errors.startDate?.message}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label="End Date (Optional)"
                  {...register('endDate')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Trip Status"
                  defaultValue="Pending"
                  {...register('status')}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Running">Running</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
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
              Save Trip Manifest
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={openPrint} onClose={handleClosePrint} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="non-printable">
          <span>Manifest Receipt Print Preview</span>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handleTriggerPrint}>
            Print / Save PDF
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {printTripData && (
            <Box>
              {/* Dynamic print-only style block */}
              <style dangerouslySetInnerHTML={{ __html: printStyles }} />
              
              <Paper id="receipt-print-area" elevation={3} sx={{ p: 4, bgcolor: '#fff', color: '#1e293b' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, borderBottom: '2px solid #1976d2', pb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img src="/logo.png" alt="BUTS Logo" style={{ height: '120px', marginTop: '-30px', marginBottom: '-30px', objectFit: 'contain' }} />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
                        Bombay Uttaranchal Tempo Service
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        12, Transport Nagar, Phase-II
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        New Delhi - 110045
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Phone: +91-9876543210 | Email: billing@tmsexpress.com
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      TRIP MANIFEST
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Manifest No: {printTripData.tripNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {new Date(printTripData.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                  </Box>
                </Box>

                {/* Info Grid */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1 }}>
                      Vehicle & Driver Details
                    </Typography>
                    <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Vehicle No:</strong> {printTripData.vehicle?.vehicleNumber || 'N/A'} ({printTripData.vehicle?.vehicleType || 'N/A'})
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Driver:</strong> {printTripData.driver?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Mobile:</strong> {printTripData.driver?.mobile || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1 }}>
                      Route & Customer Details
                    </Typography>
                    <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Customer:</strong> {printTripData.party?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>From:</strong> {printTripData.fromLocation ? `${printTripData.fromLocation.name}, ${printTripData.fromLocation.city} (${printTripData.fromLocation.state})` : 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>To:</strong> {printTripData.toLocation ? `${printTripData.toLocation.name}, ${printTripData.toLocation.city} (${printTripData.toLocation.state})` : 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Billing Table */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1 }}>
                  Financial Summary
                </Typography>
                <Table sx={{ mb: 4, border: '1px solid #e2e8f0' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        Freight charges for transport from{' '}
                        <strong>{printTripData.fromLocation?.city || 'N/A'}</strong> to{' '}
                        <strong>{printTripData.toLocation?.city || 'N/A'}</strong>
                      </TableCell>
                      <TableCell align="right">₹{parseFloat(printTripData.freightAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>Less: Advance Paid</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>- ₹{parseFloat(printTripData.advance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 800 }}>Net Outstanding Balance</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'primary.main' }}>
                        ₹{parseFloat((printTripData.freightAmount || 0) - (printTripData.advance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Footer Signatures */}
                <Grid container spacing={4} sx={{ mt: 6 }}>
                  <Grid item xs={6}>
                    <Box sx={{ borderTop: '1px solid #cbd5e1', pt: 1, textAlign: 'center', width: '80%', mx: 'auto' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Driver / Receiver Signature
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ borderTop: '1px solid #cbd5e1', pt: 1, textAlign: 'center', width: '80%', mx: 'auto' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        For Bombay Uttaranchal Tempo Service
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (Authorized Signatory)
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Terms info */}
                <Box sx={{ mt: 6, pt: 2, borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                    * Subject to terms and conditions of carriage. This is a computer-generated document and requires no physical signature.
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="non-printable">
          <Button onClick={handleClosePrint}>Close Preview</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Trips;
