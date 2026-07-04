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
  Chip
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

          {/* Ledger display for general resources */}
          {ledgerType !== 'pump' && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="body1" color="text.secondary">
                To view detailed transaction breakdown sheets for this account, please visit the **Reports Center** to download print-ready PDFs.
              </Typography>
            </Paper>
          )}
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
