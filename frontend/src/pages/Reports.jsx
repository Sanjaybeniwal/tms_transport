import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';

import API from '../services/api';

const Reports = () => {
  const [reportType, setReportType] = useState('profit-loss');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [exportMessage, setExportMessage] = useState('');

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null);
    setExportMessage('');
    try {
      const params = { startDate, endDate };
      let res;
      
      switch (reportType) {
        case 'profit-loss':
          res = await API.reports.profitLoss(params);
          break;
        case 'trips':
          res = await API.reports.trips(params);
          break;
        case 'diesel':
          res = await API.reports.diesels(params);
          break;
        case 'expenses':
          res = await API.reports.expenses(params);
          break;
        case 'pumps':
          res = await API.reports.pumps(params);
          break;
        default:
          res = await API.reports.profitLoss(params);
      }
      setReportData(res.data.data);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const res = await API.reports.export({ reportType, format });
      setExportMessage(res.data.message);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
        Reports Center
      </Typography>

      {/* Query Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Select Report Registry"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <MenuItem value="profit-loss">Profit & Loss Report</MenuItem>
              <MenuItem value="trips">Trips Summary Report</MenuItem>
              <MenuItem value="diesel">Diesel Purchase Report</MenuItem>
              <MenuItem value="expenses">Expenses Detailed Report</MenuItem>
              <MenuItem value="pumps">Pump Outstandings Summary</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true }}
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
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
              onClick={handleGenerateReport}
              sx={{ height: 56 }}
            >
              Generate
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Export Notifications */}
      {exportMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setExportMessage('')}>
          {exportMessage}
        </Alert>
      )}

      {/* Report Viewer */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : reportData ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={() => handleExport('pdf')}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('excel')}
            >
              Export Excel
            </Button>
          </Box>

          {/* Render Profit & Loss Sheet */}
          {reportType === 'profit-loss' && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ borderLeft: '6px solid #10b981' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{reportData.summary.totalIncome}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ borderLeft: '6px solid #ef4444' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Costs (Fuel + Misc)</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{reportData.summary.totalExpense}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: parseFloat(reportData.summary.netProfit) >= 0 ? 'success.light' : 'error.light', color: '#ffffff' }}>
                    <CardContent>
                      <Typography variant="body2">Net Operating Margins</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{reportData.summary.netProfit}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Expenses Breakdown</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Expense Head / Ledger Account</TableCell>
                        <TableCell align="right">Amount Outlay</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 600 }}>Diesel Refueling</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>₹{reportData.summary.dieselExpense}</TableCell>
                      </TableRow>
                      {reportData.expensesBreakdown.map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row.headName}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>₹{row.amount}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Total Expenditures</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>₹{reportData.summary.totalExpense}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          )}

          {/* Render Trips Report */}
          {reportType === 'trips' && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Trips Consolidated Logs</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Trip No</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Driver</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="right">Freight</TableCell>
                      <TableCell align="right">Advance</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.tripNumber}</TableCell>
                        <TableCell>{row.vehicle?.vehicleNumber}</TableCell>
                        <TableCell>{row.driver?.name}</TableCell>
                        <TableCell>{row.party?.name}</TableCell>
                        <TableCell align="right">₹{row.freightAmount}</TableCell>
                        <TableCell align="right">₹{row.advance}</TableCell>
                        <TableCell>{row.startDate}</TableCell>
                        <TableCell>{row.status}</TableCell>
                      </TableRow>
                    ))}
                    {reportData.length === 0 && (
                      <TableRow><TableCell colSpan={8} align="center">No logs found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Render Diesel Refueling logs */}
          {reportType === 'diesel' && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Diesel Refueling Detailed Report</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Pump Name</TableCell>
                      <TableCell>Driver</TableCell>
                      <TableCell align="right">Quantity (Ltrs)</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">Total Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.date}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.vehicle?.vehicleNumber}</TableCell>
                        <TableCell>{row.pump?.name}</TableCell>
                        <TableCell>{row.driver?.name}</TableCell>
                        <TableCell align="right">{row.quantity}L</TableCell>
                        <TableCell align="right">₹{row.rate}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{row.totalAmount}</TableCell>
                      </TableRow>
                    ))}
                    {reportData.length === 0 && (
                      <TableRow><TableCell colSpan={7} align="center">No logs found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Render Pump outstandings */}
          {reportType === 'pumps' && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Pump Outstandings Summary</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pump Name</TableCell>
                      <TableCell>Contact Person</TableCell>
                      <TableCell align="right">Opening Dues</TableCell>
                      <TableCell align="right">Diesel Purchases</TableCell>
                      <TableCell align="right">Payments Made</TableCell>
                      <TableCell align="right">Outstanding Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                        <TableCell>{row.contactPerson || '-'}</TableCell>
                        <TableCell align="right">₹{row.openingBalance}</TableCell>
                        <TableCell align="right">₹{row.totalDieselPurchased}</TableCell>
                        <TableCell align="right">₹{row.totalPayments}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>₹{row.outstandingBalance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Select a report category and date ranges from the filter above, then click **Generate**.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Reports;
