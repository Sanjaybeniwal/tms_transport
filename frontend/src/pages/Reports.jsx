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
  const [companyContact, setCompanyContact] = useState({
    address: '12, Transport Nagar, Phase-II, New Delhi - 110045',
    phone: '+91-9876543210',
    email: 'billing@tmsexpress.com'
  });

  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        const res = await API.settings.getContactInfo();
        if (res.data.status === 'success') {
          setCompanyContact(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load contact info for reports:', err);
      }
    };
    fetchContactDetails();
  }, []);

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

  const handleExportCSV = (reportType, reportData) => {
    let csvRows = [];
    
    if (reportType === 'profit-loss') {
      csvRows.push(["Category", "Amount"]);
      csvRows.push(["Total Revenue", `₹${reportData.summary.totalIncome}`]);
      csvRows.push(["Total Costs", `₹${reportData.summary.totalExpense}`]);
      csvRows.push(["Net Operating Margins", `₹${reportData.summary.netProfit}`]);
      csvRows.push(["Diesel Refueling", `₹${reportData.summary.dieselExpense}`]);
      reportData.expensesBreakdown.forEach(exp => {
        csvRows.push([exp.headName, `₹${exp.amount}`]);
      });
    } else if (reportType === 'trips') {
      csvRows.push(["Trip No", "Vehicle", "Driver", "Customer", "Freight", "Advance", "Start Date", "Status"]);
      reportData.forEach(row => {
        csvRows.push([
          row.tripNumber,
          row.vehicle?.vehicleNumber || '-',
          row.driver?.name || '-',
          row.party?.name || '-',
          `₹${row.freightAmount}`,
          `₹${row.advance}`,
          row.startDate,
          row.status
        ]);
      });
    } else if (reportType === 'diesel') {
      csvRows.push(["Date", "Vehicle", "Pump Name", "Driver", "Quantity (Ltrs)", "Rate", "Total Amount"]);
      reportData.forEach(row => {
        csvRows.push([
          row.date,
          row.vehicle?.vehicleNumber || '-',
          row.pump?.name || '-',
          row.driver?.name || '-',
          `${row.quantity}L`,
          `₹${row.rate}`,
          `₹${row.totalAmount}`
        ]);
      });
    } else if (reportType === 'expenses') {
      csvRows.push(["Date", "Expense Head", "Vehicle", "Amount", "Remarks"]);
      reportData.forEach(row => {
        csvRows.push([
          row.date,
          row.expenseHead?.name || '-',
          row.vehicle?.vehicleNumber || '-',
          `₹${row.amount}`,
          row.remarks || ''
        ]);
      });
    } else if (reportType === 'pumps') {
      csvRows.push(["Pump Name", "Contact Person", "Opening Dues", "Diesel Purchases", "Payments Made", "Outstanding Balance"]);
      reportData.forEach(row => {
        csvRows.push([
          row.name,
          row.contactPerson || '-',
          `₹${row.openingBalance}`,
          `₹${row.totalDieselPurchased}`,
          `₹${row.totalPayments}`,
          `₹${row.outstandingBalance}`
        ]);
      });
    }

    const csvContent = csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = (reportType, reportData) => {
    const printWindow = window.open('', '_blank');
    let html = `
      <html>
        <head>
          <title>${reportType.toUpperCase()} Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header-table { width: 100%; border: none; margin-bottom: 20px; border-collapse: collapse; }
            .header-cell { border: none; padding: 0; }
            .header-title { font-size: 24px; color: #1e3a8a; font-weight: bold; margin: 0; }
            .header-subtitle { font-size: 14px; color: #475569; font-weight: bold; margin: 5px 0 0 0; }
            .header-info { text-align: right; font-size: 11px; color: #64748b; line-height: 1.4; border: none; padding: 0; }
            .report-title-bar { border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-bottom: 20px; margin-top: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f3f4f6; color: #1e3a8a; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .summary-cards { display: flex; gap: 20px; margin-bottom: 30px; }
            .card { flex: 1; padding: 15px; border-radius: 8px; border-left: 5px solid #3b82f6; background-color: #f8fafc; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .card.success { border-left-color: #10b981; }
            .card.error { border-left-color: #ef4444; }
            .card-title { font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
            .card-value { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td class="header-cell">
                <div class="header-title">BOMBAY UTTARANCHAL TEMPO SERVICE</div>
                <div class="header-subtitle">BUTS Express Logistics</div>
              </td>
              <td class="header-cell header-info">
                ${companyContact.address ? `<div style="white-space: pre-line;">📍 ${companyContact.address}</div>` : ''}
                ${companyContact.phone ? `<div>📞 Phone: ${companyContact.phone}</div>` : ''}
                ${companyContact.email ? `<div>✉ Email: ${companyContact.email}</div>` : ''}
              </td>
            </tr>
          </table>
          <div class="report-title-bar">
            <h2 style="margin: 0; color: #1e3a8a; font-size: 18px;">${reportType.replace('-', ' ').toUpperCase()} REPORT</h2>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Generated on: ${new Date().toLocaleString()}</div>
          </div>
    `;

    if (reportType === 'profit-loss') {
      html += `
        <div class="summary-cards">
          <div class="card success">
            <div class="card-title">Total Revenue</div>
            <div class="card-value">₹${reportData.summary.totalIncome}</div>
          </div>
          <div class="card error">
            <div class="card-title">Total Costs</div>
            <div class="card-value">₹${reportData.summary.totalExpense}</div>
          </div>
          <div class="card">
            <div class="card-title">Net Operating Margins</div>
            <div class="card-value">₹${reportData.summary.netProfit}</div>
          </div>
        </div>
        <h2>Expenses Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Expense Head / Ledger Account</th>
              <th>Amount Outlay</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Diesel Refueling</strong></td>
              <td>₹${reportData.summary.dieselExpense}</td>
            </tr>
            ${reportData.expensesBreakdown.map(exp => `
              <tr>
                <td>${exp.headName}</td>
                <td>₹${exp.amount}</td>
              </tr>
            `).join('')}
            <tr style="background-color: #e2e8f0; font-weight: bold;">
              <td>Total Expenditures</td>
              <td>₹${reportData.summary.totalExpense}</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (reportType === 'trips') {
      html += `
        <table>
          <thead>
            <tr>
              <th>Trip No</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Customer</th>
              <th>Freight</th>
              <th>Advance</th>
              <th>Start Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(row => `
              <tr>
                <td><strong>${row.tripNumber}</strong></td>
                <td>${row.vehicle?.vehicleNumber || '-'}</td>
                <td>${row.driver?.name || '-'}</td>
                <td>${row.party?.name || '-'}</td>
                <td>₹${row.freightAmount}</td>
                <td>₹${row.advance}</td>
                <td>${row.startDate}</td>
                <td>${row.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'diesel') {
      html += `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Vehicle</th>
              <th>Pump Name</th>
              <th>Driver</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(row => `
              <tr>
                <td>${row.date}</td>
                <td><strong>${row.vehicle?.vehicleNumber || '-'}</strong></td>
                <td>${row.pump?.name || '-'}</td>
                <td>${row.driver?.name || '-'}</td>
                <td>${row.quantity}L</td>
                <td>₹${row.rate}</td>
                <td><strong>₹${row.totalAmount}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'expenses') {
      html += `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Expense Head</th>
              <th>Vehicle</th>
              <th>Amount</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(row => `
              <tr>
                <td>${row.date}</td>
                <td><strong>${row.expenseHead?.name || '-'}</strong></td>
                <td>${row.vehicle?.vehicleNumber || '-'}</td>
                <td>₹${row.amount}</td>
                <td>${row.remarks || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'pumps') {
      html += `
        <table>
          <thead>
            <tr>
              <th>Pump Name</th>
              <th>Contact Person</th>
              <th>Opening Dues</th>
              <th>Diesel Purchases</th>
              <th>Payments Made</th>
              <th>Outstanding Balance</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(row => `
              <tr>
                <td><strong>${row.name}</strong></td>
                <td>${row.contactPerson || '-'}</td>
                <td>₹${row.openingBalance}</td>
                <td>₹${row.totalDieselPurchased}</td>
                <td>₹${row.totalPayments}</td>
                <td style="font-weight: bold; color: #1e3a8a;">₹${row.outstandingBalance}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    html += `
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleExport = async (format) => {
    if (!reportData) return;
    
    if (format === 'pdf') {
      handleExportPDF(reportType, reportData);
      setExportMessage('PDF report document generated successfully.');
    } else if (format === 'excel') {
      handleExportCSV(reportType, reportData);
      setExportMessage('Excel/CSV spreadsheet generated and downloaded successfully.');
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

          {/* Render Expenses detailed report */}
          {reportType === 'expenses' && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Expenses Detailed Report</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Expense Category</TableCell>
                      <TableCell>Vehicle Link</TableCell>
                      <TableCell align="right">Amount Outlay</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.date}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.expenseHead?.name || '-'}</TableCell>
                        <TableCell>{row.vehicle?.vehicleNumber || '-'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>₹{row.amount}</TableCell>
                        <TableCell>{row.remarks || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {reportData.length === 0 && (
                      <TableRow><TableCell colSpan={5} align="center">No logs found</TableCell></TableRow>
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
