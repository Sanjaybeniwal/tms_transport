import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import API from '../services/api';
import AdminHeader from '../components/AdminHeader';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const Ledgers = () => {
  const location = useLocation();
  const [ledgerType, setLedgerType] = useState('pump');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown lists
  const [entities, setEntities] = useState([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // Ledger calculation data
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerData, setLedgerData] = useState(null);
  const [openPrint, setOpenPrint] = useState(false);
  const handleOpenPrint = () => setOpenPrint(true);
  const handleClosePrint = () => setOpenPrint(false);

  // Sync selection with router URL paths
  useEffect(() => {
    if (location.pathname.includes('/ledgers/vehicles')) setLedgerType('vehicle');
    else if (location.pathname.includes('/ledgers/owners')) setLedgerType('owner');
    else if (location.pathname.includes('/ledgers/drivers')) setLedgerType('driver');
    else if (location.pathname.includes('/ledgers/parties')) setLedgerType('party');
    else if (location.pathname.includes('/ledgers/pumps')) setLedgerType('pump');
  }, [location.pathname]);

  // Fetch entities list based on ledger type
  const fetchEntities = async () => {
    setLoadingEntities(true);
    setSelectedEntityId('');
    setLedgerData(null);
    try {
      let res;
      if (ledgerType === 'pump') res = await API.pumps.list({ limit: 100 });
      else if (ledgerType === 'vehicle') res = await API.vehicles.list({ limit: 100 });
      else if (ledgerType === 'owner') res = await API.owners.list({ limit: 100 });
      else if (ledgerType === 'driver') res = await API.drivers.list({ limit: 100 });
      else if (ledgerType === 'party') res = await API.parties.list({ limit: 100 });

      setEntities(res.data.data);
      setSelectedEntityId('all');
    } catch (err) {
      console.error('Error fetching dropdown list:', err);
    } finally {
      setLoadingEntities(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [ledgerType]);

  const handleSearchLedger = async () => {
    if (!selectedEntityId) return;
    setLoadingLedger(true);
    try {
      const params = { startDate, endDate };
      let res;
      if (ledgerType === 'pump') res = await API.ledgers.pump(selectedEntityId, params);
      else if (ledgerType === 'vehicle') res = await API.ledgers.vehicle(selectedEntityId, params);
      else if (ledgerType === 'owner') res = await API.ledgers.owner(selectedEntityId, params);
      else if (ledgerType === 'driver') res = await API.ledgers.driver(selectedEntityId, params);
      else if (ledgerType === 'party') res = await API.ledgers.party(selectedEntityId, params);

      setLedgerData(res.data.data);
    } catch (err) {
      console.error('Error fetching ledger details:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  // Trigger search automatically when entity changes
  useEffect(() => {
    if (selectedEntityId) {
      handleSearchLedger();
    }
  }, [selectedEntityId]);

  // Combined history for party ledger
  let partyHistory = [];
  if (ledgerType === 'party' && ledgerData) {
    if (ledgerData.trips) {
      ledgerData.trips.forEach(t => {
        partyHistory.push({
          date: t.startDate ? t.startDate.substring(0, 10) : 'N/A',
          type: 'Freight Charge',
          reference: `Trip: ${t.tripNumber} (${t.vehicle ? t.vehicle.vehicleNumber : 'N/A'})`,
          debit: parseFloat(t.freightAmount || 0),
          credit: 0,
          rawDate: t.startDate ? new Date(t.startDate) : new Date(0)
        });
      });
    }
    if (ledgerData.incomes) {
      ledgerData.incomes.forEach(i => {
        partyHistory.push({
          date: i.date ? i.date.substring(0, 10) : 'N/A',
          type: 'Payment Received',
          reference: `Log: ${i.paymentMode || 'Cash'} (Ref: ${i.referenceNumber || 'N/A'})`,
          debit: 0,
          credit: parseFloat(i.amount || 0),
          rawDate: i.date ? new Date(i.date) : new Date(0)
        });
      });
    }
    partyHistory.sort((a, b) => a.rawDate - b.rawDate);
    
    let balance = 0;
    partyHistory = partyHistory.map(item => {
      balance += (item.debit - item.credit);
      return {
        ...item,
        runningBalance: balance
      };
    });
  }

  return (
    <Box>
      <AdminHeader
        title="Financial Ledger Center"
        description="Review detailed debit/credit logs, transaction statements, diesel station dues, and outstanding balances."
        icon={<AccountBalanceIcon />}
      />

      {/* Filter Toolbar */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              select
              label="Ledger Type"
              value={ledgerType}
              onChange={(e) => setLedgerType(e.target.value)}
            >
              <MenuItem value="pump">Pump Ledger</MenuItem>
              <MenuItem value="vehicle">Vehicle Wise Ledger</MenuItem>
              <MenuItem value="owner">Owner Ledger</MenuItem>
              <MenuItem value="driver">Driver Ledger</MenuItem>
              <MenuItem value="party">Customer (Party) Ledger</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            {loadingEntities ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>
            ) : (
              <TextField
                fullWidth
                select
                label="Select Entity"
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                {entities.map((ent) => (
                  <MenuItem key={ent.id} value={ent.id}>
                    {ent.name || ent.vehicleNumber}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true }}
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true }}
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearchLedger}
              sx={{ height: 56 }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Ledger Result View */}
      {loadingLedger ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : ledgerData ? (
        <Box>
          {/* Summary Cards */}
          {ledgerType === 'pump' && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderLeft: '6px solid #6366f1' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Opening Balance</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.openingBalance}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderLeft: '6px solid #f59e0b' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Total Fuel Purchased</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.totalDieselPurchased}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderLeft: '6px solid #ef4444' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Total Payments Made</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.totalPayment}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Card sx={{ bgcolor: 'primary.light', color: '#ffffff' }}>
                  <CardContent>
                    <Typography variant="body2">Current Outstanding Dues</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.outstandingBalance}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {ledgerType === 'vehicle' && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={3}>
                <Card sx={{ borderLeft: '6px solid #f59e0b' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Diesel Costs</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.totalDiesel}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ borderLeft: '6px solid #ec4899' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Misc. Expenses</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.totalExpenses}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ borderLeft: '6px solid #10b981' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Total Incomes</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.totalIncome}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ bgcolor: parseFloat(ledgerData.summary.profit) >= 0 ? 'success.main' : 'error.main', color: '#ffffff' }}>
                  <CardContent>
                    <Typography variant="body2">Net Vehicle Earnings</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.profit}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {ledgerType === 'owner' && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderLeft: '6px solid #10b981' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Total Earnings</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.totalIncome}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderLeft: '6px solid #ef4444' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Total Costs (Fuel + Misc)</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.totalCost}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: parseFloat(ledgerData.summary.netProfit) >= 0 ? 'success.main' : 'error.main', color: '#ffffff' }}>
                  <CardContent>
                    <Typography variant="body2">Net Profit/Loss</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.netProfit}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {ledgerType === 'driver' && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderLeft: '6px solid #6366f1' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Base Contract Salary</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.baseSalary}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderLeft: '6px solid #f59e0b' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Advances Received</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.totalAdvances}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: parseFloat(ledgerData.summary.balanceDue) >= 0 ? 'primary.main' : 'error.main', color: '#ffffff' }}>
                  <CardContent>
                    <Typography variant="body2">Balance Outstanding</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.balanceDue}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {ledgerType === 'party' && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderLeft: '6px solid #6366f1' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Total Invoiced Freight</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.totalFreight}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderLeft: '6px solid #10b981' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Total Payments Received</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.totalReceived}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: parseFloat(ledgerData.summary.outstanding) > 0 ? 'warning.main' : 'success.main', color: '#ffffff' }}>
                  <CardContent>
                    <Typography variant="body2">Balance Outstanding</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{ledgerData.summary.outstanding}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Running balance table specifically for Pump Ledger */}
          {ledgerType === 'pump' && ledgerData && ledgerData.history && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Pump Transaction running balance statement
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Transaction Type</TableCell>
                      <TableCell>Description / References</TableCell>
                      <TableCell align="right">Debit (+ Dues)</TableCell>
                      <TableCell align="right">Credit (- Paid)</TableCell>
                      <TableCell align="right">Running Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ledgerData.history.map((tx, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{tx.date}</TableCell>
                        <TableCell>
                          <Chip
                            label={tx.type}
                            size="small"
                            color={tx.type === 'Payment Made' ? 'success' : tx.type === 'Opening Balance' ? 'primary' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{tx.reference}</TableCell>
                        <TableCell align="right" sx={{ color: tx.debit > 0 ? 'error.main' : 'inherit' }}>
                          {tx.debit > 0 ? `₹${tx.debit.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: tx.credit > 0 ? 'success.main' : 'inherit' }}>
                          {tx.credit > 0 ? `₹${tx.credit.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ₹{tx.runningBalance.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Detailed Statement Table for Customer (Party) Ledger */}
          {ledgerType === 'party' && ledgerData && (
            <Paper sx={{ p: 3, mt: 3, border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Customer Account Ledger Statement
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleOpenPrint}
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#2563eb',
                    '&:hover': { bgcolor: '#1d4ed8' }
                  }}
                >
                  Export Ledger / Print Statement
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Transaction Type</TableCell>
                      <TableCell>Description / Reference</TableCell>
                      <TableCell align="right">Debit (+ Freight)</TableCell>
                      <TableCell align="right">Credit (- Paid)</TableCell>
                      <TableCell align="right">Running Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {partyHistory.map((tx, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{tx.date}</TableCell>
                        <TableCell>
                          <Chip
                            label={tx.type}
                            size="small"
                            sx={{
                              bgcolor: tx.type === 'Payment Received' ? '#eff6ff' : '#f8fafc',
                              color: tx.type === 'Payment Received' ? '#2563eb' : '#475569',
                              border: '1px solid',
                              borderColor: tx.type === 'Payment Received' ? '#dbeafe' : '#e2e8f0',
                              fontWeight: 700,
                              borderRadius: '6px'
                            }}
                          />
                        </TableCell>
                        <TableCell>{tx.reference}</TableCell>
                        <TableCell align="right" sx={{ color: tx.debit > 0 ? '#ef4444' : 'inherit', fontWeight: tx.debit > 0 ? 600 : 'inherit' }}>
                          {tx.debit > 0 ? `₹${tx.debit.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: tx.credit > 0 ? '#10b981' : 'inherit', fontWeight: tx.credit > 0 ? 600 : 'inherit' }}>
                          {tx.credit > 0 ? `₹${tx.credit.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ₹{tx.runningBalance.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {partyHistory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No transactions recorded for this customer in selected date range.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Ledger display for general resources (except pump & party) */}
          {ledgerType !== 'pump' && ledgerType !== 'party' && (
            <Paper sx={{ p: 3, border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: 3 }}>
              <Typography variant="body1" color="text.secondary">
                To view detailed transaction breakdown sheets for this account, please visit the **Reports Center** to download print-ready PDFs.
              </Typography>
            </Paper>
          )}

          {/* Print Statement Dialog */}
          <Dialog open={openPrint} onClose={handleClosePrint} maxWidth="md" fullWidth>
            <DialogTitle className="non-printable" sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
              Ledger Statement Preview
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
              {ledgerData && (
                <Box id="printable-ledger-statement" sx={{ p: 4, bgcolor: '#ffffff', color: '#000000' }}>
                  {/* Statement Letterhead Styling */}
                  <style>
                    {`
                      @media print {
                        body * {
                          visibility: hidden;
                        }
                        #printable-ledger-statement, #printable-ledger-statement * {
                          visibility: visible;
                        }
                        #printable-ledger-statement {
                          position: absolute;
                          left: 0;
                          top: 0;
                          width: 100%;
                          padding: 0 !important;
                        }
                        .non-printable {
                          display: none !important;
                        }
                      }
                    `}
                  </style>

                  {/* Company Header */}
                  <Box sx={{ textAlign: 'center', pb: 3, borderBottom: '2px solid #000000', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                      Bombay Uttaranchal Tempo Service
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>
                      Leading Transport Contractors & Fleet Operators
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                      Regd. Office: Mumbai / New Delhi | Tel: +91 98925 XXXXX | Email: info@buts.in
                    </Typography>
                  </Box>

                  {/* Statement Metadata */}
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Billing Account Statement
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#2563eb', mt: 0.5 }}>
                        {ledgerData.party?.name || 'All Customers'}
                      </Typography>
                      {ledgerData.party?.gstNumber && (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
                          GSTIN: {ledgerData.party.gstNumber}
                        </Typography>
                      )}
                      {ledgerData.party?.mobile && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>
                          Mob: +91 {ledgerData.party.mobile}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Statement Duration
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {startDate ? startDate : 'Beginning'} to {endDate ? endDate : 'Present'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                        Statement Generated on: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Statement Breakdown Table */}
                  <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', mb: 4 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Transaction Type</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Description / Reference</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Debit (+ Freight)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Credit (- Paid)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Running Balance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {partyHistory.map((tx, idx) => (
                          <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ py: 1.2 }}>{tx.date}</TableCell>
                            <TableCell sx={{ py: 1.2, fontWeight: 600 }}>{tx.type}</TableCell>
                            <TableCell sx={{ py: 1.2 }}>{tx.reference}</TableCell>
                            <TableCell align="right" sx={{ py: 1.2 }}>
                              {tx.debit > 0 ? `₹${tx.debit.toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.2 }}>
                              {tx.credit > 0 ? `₹${tx.credit.toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.2, fontWeight: 700 }}>
                              ₹{tx.runningBalance.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Ledger Summary */}
                  <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Total Freight Invoiced
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        ₹{parseFloat(ledgerData.summary.totalFreight).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Total Receipts Cleared
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                        ₹{parseFloat(ledgerData.summary.totalReceived).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Net Outstanding Balance
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: 'error.main' }}>
                        ₹{parseFloat(ledgerData.summary.outstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Authorized Signatory Block */}
                  <Box sx={{ mt: 8, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                        * This is a computer-generated ledger statement and requires no physical signature.
                      </Typography>
                    </Box>
                    <Box sx={{ borderTop: '1px solid #000000', pt: 1, width: 220, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Authorized Signatory
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Bombay Uttaranchal Tempo Service
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions className="non-printable" sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <Button onClick={handleClosePrint} variant="outlined" sx={{ color: 'text.secondary', borderColor: '#cbd5e1', borderRadius: '8px', fontWeight: 600 }}>
                Close Preview
              </Button>
              <Button
                onClick={() => window.print()}
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
                Print Ledger / Save PDF
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Select an account from the filters above and search to view the ledger logs.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Ledgers;
