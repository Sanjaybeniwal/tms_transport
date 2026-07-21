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
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useForm, Controller } from 'react-hook-form';

import API from '../services/api';
import DataTable from '../components/DataTable';
import AdminHeader from '../components/AdminHeader';
import { formatDate } from '../utils/dateFormatter';

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

const GenericCrud = ({ resource, title, fields }) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [openForm, setOpenForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Printing state
  const [openPrint, setOpenPrint] = useState(false);
  const [printDieselData, setPrintDieselData] = useState(null);

  const handleOpenPrint = (item) => {
    setPrintDieselData(item);
    setOpenPrint(true);
  };

  const handleClosePrint = () => {
    setOpenPrint(false);
    setPrintDieselData(null);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleSendWhatsApp = (row) => {
    const recipientMobile = row.driver?.mobile || row.pump?.mobile || '';
    const cleanNumber = recipientMobile.replace(/[^0-9]/g, '');
    const whatsappPhone = cleanNumber.length === 10 ? '91' + cleanNumber : cleanNumber;

    const messageText = `*DIESEL REFUELING SLIP*
--------------------------------
Slip No: FSL-${row.id}
Date: ${row.date}
Vehicle No: ${row.vehicle?.vehicleNumber || 'N/A'}
Driver Name: ${row.driver?.name || 'N/A'}
Pump Vendor: ${row.pump?.name || 'N/A'}
--------------------------------
Product: High Speed Diesel (HSD)
Quantity: ${parseFloat(row.quantity || 0).toFixed(2)} Liters
Rate: Rs. ${parseFloat(row.rate || 0).toFixed(2)} / L
*Total Cost: Rs. ${parseFloat(row.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}*
--------------------------------
Generated via BUTS Transport Management System`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(messageText)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Autocomplete cache lists
  const [dropdownData, setDropdownData] = useState({});

  const [isDriverAutoFilled, setIsDriverAutoFilled] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm();

  // Watch for quantity and rate changes in diesel log to automatically calculate totalAmount
  const watchedQuantity = watch('quantity');
  const watchedRate = watch('rate');

  useEffect(() => {
    if (resource === 'diesels' && watchedQuantity && watchedRate) {
      const total = parseFloat(watchedQuantity) * parseFloat(watchedRate);
      setValue('totalAmount', isNaN(total) ? 0 : total.toFixed(2));
    }
  }, [watchedQuantity, watchedRate, resource, setValue]);

  const watchedVehicleId = watch('vehicleId');

  useEffect(() => {
    const autoFillDriver = async () => {
      if (watchedVehicleId && fields.some(f => f.name === 'driverId')) {
        try {
          const res = await API.vehicles.lastDriver(watchedVehicleId);
          if (res.data && res.data.driver) {
            setValue('driverId', res.data.driver.id);
            setIsDriverAutoFilled(true);
          } else {
            setIsDriverAutoFilled(false);
          }
        } catch (err) {
          console.error('Error auto-filling driver in generic crud:', err);
          setIsDriverAutoFilled(false);
        }
      }
    };
    autoFillDriver();
  }, [watchedVehicleId, fields, setValue]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API[resource].list({ page: page + 1, limit, search });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(`Error loading generic crud resource ${resource}:`, err);
    } finally {
      setLoading(false);
    }
  };

  // Load dropdown datasets for foreign key columns
  const loadDropdowns = async () => {
    const cache = {};
    try {
      for (const field of fields) {
        if (field.type === 'select' && field.apiResource) {
          const res = await API[field.apiResource].list({ limit: 100 });
          cache[field.name] = res.data.data;
        }
      }
      setDropdownData(cache);
    } catch (err) {
      console.error('Error fetching generic dropdown mappings:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, search, resource]);

  useEffect(() => {
    loadDropdowns();
  }, [resource]);

  const handleOpenForm = (item = null) => {
    setSelectedItem(item);
    setIsDriverAutoFilled(false); // Reset feedback on open
    if (item) {
      fields.forEach(f => {
        let val = item[f.name];
        // If nested relationship (e.g. item.expenseHead.id)
        if (f.nestedKey && item[f.nestedKey]) {
          val = item[f.nestedKey].id;
        }
        setValue(f.name, val || '');
      });
    } else {
      const defaults = {};
      fields.forEach(f => {
        defaults[f.name] = f.defaultValue !== undefined ? f.defaultValue : '';
      });
      reset(defaults);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const onSubmitForm = async (formData) => {
    try {
      if (selectedItem) {
        await API[resource].update(selectedItem.id, formData);
      } else {
        await API[resource].create(formData);
      }
      fetchData();
      handleCloseForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this record?`)) {
      try {
        await API[resource].delete(id);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Convert schema fields to DataTable columns
  const columns = fields
    .filter(f => f.showInTable !== false)
    .map(f => ({
      field: f.name,
      headerName: f.label,
      minWidth: f.minWidth || 120,
      renderCell: (row) => {
        if (f.nestedKey && row[f.nestedKey]) {
          if (f.nestedField) {
            const nestedVal = row[f.nestedKey][f.nestedField];
            if (f.isCurrency) {
              return `₹${parseFloat(nestedVal || 0).toFixed(2)}`;
            }
            return nestedVal !== undefined && nestedVal !== null ? nestedVal : 'N/A';
          }
          return row[f.nestedKey].name || row[f.nestedKey].vehicleNumber || row[f.nestedKey].tripNumber || 'N/A';
        }
        if (f.type === 'select' && !f.apiResource) {
          const status = row[f.name];
          return (
            <Chip
              label={status}
              color={status === 'Active' ? 'success' : 'default'}
              size="small"
            />
          );
        }
        if (f.type === 'date') {
          return formatDate(row[f.name]);
        }
        if (f.isCurrency) {
          return `₹${parseFloat(row[f.name] || 0).toFixed(2)}`;
        }
        return row[f.name];
      }
    }));

  const getResourceDetails = () => {
    switch (resource) {
      case 'expenseHeads':
        return {
          description: 'Manage categorization ledger accounts for operations expenditures.',
          icon: <ReceiptIcon />
        };
      case 'pumps':
        return {
          description: 'Register and manage diesel fueling station vendors and credit contracts.',
          icon: <LocalGasStationIcon />
        };
      case 'expenses':
        return {
          description: 'Log and monitor trip-specific and general vehicle operating expenses.',
          icon: <TrendingDownIcon />
        };
      case 'diesels':
        return {
          description: 'Track fuel refueling quantities, fuel rates, driver signatures, and slips.',
          icon: <LocalGasStationIcon />
        };
      case 'pumpPayments':
        return {
          description: 'Process and log payments made to fuel station vendors against outstanding credit.',
          icon: <PaymentIcon />
        };
      case 'driverAdvances':
        return {
          description: 'Log trip advance cash payments handed out to dispatch drivers.',
          icon: <AttachMoneyIcon />
        };
      case 'incomeLogs':
        return {
          description: 'Record freight incomes, load bookings revenues, and payment collections.',
          icon: <TrendingUpIcon />
        };
      default:
        return {
          description: 'Manage operational data registry records.',
          icon: <ReceiptIcon />
        };
    }
  };

  const resDetails = getResourceDetails();

  return (
    <Box>
      <AdminHeader
        title={title}
        description={resDetails.description}
        icon={resDetails.icon}
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
            Create Record
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
        searchPlaceholder="Filter list..."
        actions={(row) => (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {(resource === 'diesels' || resource === 'pumpPayments') && (
              <IconButton size="small" color="primary" onClick={() => handleOpenPrint(row)} title={resource === 'diesels' ? "Print Fuel Slip" : "Print Payment Receipt"}>
                <PrintIcon fontSize="small" />
              </IconButton>
            )}
            {resource === 'diesels' && (
              <IconButton size="small" color="success" onClick={() => handleSendWhatsApp(row)} title="Send Slip via WhatsApp">
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            )}
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
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
            {selectedItem ? `Edit ${title} Entry` : `Create New ${title}`}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              {fields.filter(f => !f.formHidden).map((f) => {
                const getPrefix = () => {
                  const name = f.name.toLowerCase();
                  const label = f.label.toLowerCase();
                  if (f.isCurrency || name.includes('amount') || name.includes('rate') || label.includes('amount') || label.includes('freight') || label.includes('advance')) {
                    return <InputAdornment position="start">₹</InputAdornment>;
                  }
                  if (name.includes('phone') || name.includes('mobile') || label.includes('phone') || label.includes('mobile')) {
                    return <InputAdornment position="start">📞</InputAdornment>;
                  }
                  if (name.includes('email') || label.includes('email')) {
                    return <InputAdornment position="start">✉</InputAdornment>;
                  }
                  return null;
                };

                if (f.type === 'select') {
                  const list = dropdownData[f.name] || [];
                  
                  if (f.apiResource) {
                    return (
                      <Grid item xs={12} sm={f.halfWidth ? 6 : 12} key={f.name}>
                        <Controller
                          name={f.name}
                          control={control}
                          rules={{ required: f.required ? `${f.label} is required` : false }}
                          render={({ field: { onChange, value }, fieldState: { error } }) => {
                            const selectedOption = list.find(item => item.id === value) || null;
                            const isAutoFilled = f.name === 'driverId' && isDriverAutoFilled;
                            return (
                              <Autocomplete
                                options={list}
                                getOptionLabel={(option) => option.name || option.vehicleNumber || option.tripNumber || ''}
                                value={selectedOption}
                                onChange={(event, newValue) => {
                                  if (f.name === 'driverId') {
                                    setIsDriverAutoFilled(false);
                                  }
                                  onChange(newValue ? newValue.id : '');
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label={f.label}
                                    error={Boolean(error)}
                                    helperText={error?.message || (isAutoFilled ? "Last active driver auto-selected!" : "")}
                                    FormHelperTextProps={{
                                      sx: { color: isAutoFilled && !error ? 'success.main' : 'inherit', fontWeight: isAutoFilled ? 600 : 'inherit' }
                                    }}
                                  />
                                )}
                              />
                            );
                          }}
                        />
                      </Grid>
                    );
                  }

                  return (
                    <Grid item xs={12} sm={f.halfWidth ? 6 : 12} key={f.name}>
                      <TextField
                        fullWidth
                        select
                        label={f.label}
                        defaultValue={f.defaultValue || ''}
                        {...register(f.name, { required: f.required ? `${f.label} is required` : false })}
                        error={Boolean(errors[f.name])}
                        helperText={errors[f.name]?.message}
                      >
                        <MenuItem value="">Select {f.label}</MenuItem>
                        {f.options.map(opt => (
                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  );
                }

                return (
                  <Grid item xs={12} sm={f.halfWidth ? 6 : 12} key={f.name}>
                    <TextField
                      fullWidth
                      type={f.type || 'text'}
                      label={f.label}
                      multiline={f.multiline}
                      rows={f.rows || 1}
                      InputLabelProps={f.type === 'date' ? { shrink: true } : undefined}
                      InputProps={getPrefix() ? { startAdornment: getPrefix() } : undefined}
                      {...register(f.name, { required: f.required ? `${f.label} is required` : false })}
                      error={Boolean(errors[f.name])}
                      helperText={errors[f.name]?.message}
                    />
                  </Grid>
                );
              })}
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
              Save Record
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Diesel Fuel Slip Print Dialog */}
      <Dialog open={openPrint && resource === 'diesels'} onClose={handleClosePrint} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="non-printable">
          <span>Fuel Refueling Receipt Print Preview</span>
          <Button variant="contained" color="error" startIcon={<PrintIcon />} onClick={handleTriggerPrint}>
            Print Refuel Slip
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {printDieselData && (
            <Box>
              {/* Dynamic print-only style block */}
              <style dangerouslySetInnerHTML={{ __html: printStyles }} />
              
              <Paper id="receipt-print-area" elevation={3} sx={{ p: 4, bgcolor: '#fff', color: '#1e293b' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, borderBottom: '2px solid #ef4444', pb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img src="/logo.png" alt="BUTS Logo" style={{ height: '110px', marginTop: '-25px', marginBottom: '-25px', objectFit: 'contain' }} />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'error.main', mb: 0.5 }}>
                        Fuel Refueling Slip
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bombay Uttaranchal Tempo Service Fuel Network
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      REFUEL RECEIPT
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Slip No: FSL-{printDieselData.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {formatDate(printDieselData.date)}
                    </Typography>
                  </Box>
                </Box>

                {/* Info Grid */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1 }}>
                      Vehicle & Driver Information
                    </Typography>
                    <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Vehicle No:</strong> {printDieselData.vehicle?.vehicleNumber || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Driver Name:</strong> {printDieselData.driver?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Associated Trip:</strong> {printDieselData.trip?.tripNumber || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1 }}>
                      Fuel Station Details
                    </Typography>
                    <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Station Vendor:</strong> {printDieselData.pump?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Product:</strong> High Speed Diesel (HSD)
                      </Typography>
                      <Typography variant="body2">
                        <strong>Payment Account:</strong> Debited from allocated limit
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Refueling Table */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1 }}>
                  Fuel Quantity & Cost Details
                </Typography>
                <Table sx={{ mb: 4, border: '1px solid #e2e8f0' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Quantity</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Rate per Liter</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Total Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        High Speed Diesel Refueling Charges
                      </TableCell>
                      <TableCell align="right">{parseFloat(printDieselData.quantity || 0).toFixed(2)} Liters</TableCell>
                      <TableCell align="right">₹{parseFloat(printDieselData.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / L</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>₹{parseFloat(printDieselData.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell colSpan={3} sx={{ fontWeight: 800 }}>Total Debited / Outstanding</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'error.main' }}>
                        ₹{parseFloat(printDieselData.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Footer Signatures */}
                <Grid container spacing={4} sx={{ mt: 6 }}>
                  <Grid item xs={6}>
                    <Box sx={{ borderTop: '1px solid #cbd5e1', pt: 1, textAlign: 'center', width: '80%', mx: 'auto' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Driver Signature
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ borderTop: '1px solid #cbd5e1', pt: 1, textAlign: 'center', width: '80%', mx: 'auto' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Pump Attendant Signature
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Terms info */}
                <Box sx={{ mt: 6, pt: 2, borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                    * Please verify fuel volume and vehicle details before signing. Generated by TMS Express fuel tracking module.
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

      {/* Pump Payment Settlement Print Dialog */}
      <Dialog open={openPrint && resource === 'pumpPayments'} onClose={handleClosePrint} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="non-printable">
          <span>Payment Settlement Receipt Print Preview</span>
          <Button variant="contained" color="success" startIcon={<PrintIcon />} onClick={handleTriggerPrint}>
            Print Settlement Voucher
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {printDieselData && (
            <Box>
              {/* Dynamic print-only style block */}
              <style dangerouslySetInnerHTML={{ __html: printStyles }} />
              
              <Paper id="receipt-print-area" elevation={3} sx={{ p: 4, bgcolor: '#fff', color: '#1e293b' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, borderBottom: '2px solid #2e7d32', pb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img src="/logo.png" alt="BUTS Logo" style={{ height: '110px', marginTop: '-25px', marginBottom: '-25px', objectFit: 'contain' }} />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main', mb: 0.5 }}>
                        Fuel Payment Settlement Voucher
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bombay Uttaranchal Tempo Service Accounts Department
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      SETTLEMENT RECEIPT
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Voucher No: PV-{printDieselData.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {formatDate(printDieselData.date)}
                    </Typography>
                  </Box>
                </Box>

                {/* Info Grid */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1 }}>
                      Payment Settled To
                    </Typography>
                    <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Pump Vendor:</strong> {printDieselData.pump?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Account Type:</strong> Diesel Fuel Account
                      </Typography>
                      <Typography variant="body2">
                        <strong>Dues Clearance:</strong> Settlement Voucher
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1 }}>
                      Transaction Details
                    </Typography>
                    <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Payment Method:</strong> {printDieselData.paymentMethod}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Txn/Check Reference:</strong> {printDieselData.transactionNumber || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Settlement Status:</strong> Processed & Approved
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Settlement Table */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1 }}>
                  Settlement Amount Summary
                </Typography>
                <Table sx={{ mb: 4, border: '1px solid #e2e8f0' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Settled Dues Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        Payment against outstanding refueling invoices and vendor credit ledger for pump: <strong>{printDieselData.pump?.name || 'N/A'}</strong>
                        {printDieselData.remarks && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                            Memo: {printDieselData.remarks}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>₹{parseFloat(printDieselData.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 800 }}>Total Settled Amount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'success.main' }}>
                        ₹{parseFloat(printDieselData.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Footer Signatures */}
                <Grid container spacing={4} sx={{ mt: 6 }}>
                  <Grid item xs={6}>
                    <Box sx={{ borderTop: '1px solid #cbd5e1', pt: 1, textAlign: 'center', width: '80%', mx: 'auto' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Receiver's Signature (Pump Agent)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ borderTop: '1px solid #cbd5e1', pt: 1, textAlign: 'center', width: '80%', mx: 'auto' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Authorized Signatory
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (Bombay Uttaranchal Tempo Service)
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Terms info */}
                <Box sx={{ mt: 6, pt: 2, borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                    * This is an official settlement payment voucher. Please balance accounts records against this voucher ID.
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

export default GenericCrud;
