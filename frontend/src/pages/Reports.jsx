import React, { useState, useEffect } from 'react';
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
  Alert,
  Tabs,
  Tab,
  TablePagination,
  TableSortLabel,
  Chip,
  IconButton
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import BarChartIcon from '@mui/icons-material/BarChart';

import API from '../services/api';
import AdminHeader from '../components/AdminHeader';
import { formatDate } from '../utils/dateFormatter';

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

  // Driver & Vehicle P&L Report Filter Options
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [parties, setParties] = useState([]);
  const [tripsList, setTripsList] = useState([]);

  // Active sub-tab for Driver & Vehicle P&L Report
  const [plTab, setPlTab] = useState(0);

  // Selected Filter States
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [tripStatus, setTripStatus] = useState('');
  const [selectedTripId, setSelectedTripId] = useState('');

  // Search, Sorting, Pagination States for P&L Report Tabs
  const [plSearch, setPlSearch] = useState('');
  const [plSortField, setPlSortField] = useState('');
  const [plSortOrder, setPlSortOrder] = useState('asc');
  const [plPage, setPlPage] = useState(0);
  const [plRowsPerPage, setPlRowsPerPage] = useState(10);

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

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [driversRes, vehiclesRes, partiesRes, tripsRes] = await Promise.all([
          API.drivers.list({ limit: 300 }),
          API.vehicles.list({ limit: 300 }),
          API.parties.list({ limit: 300 }),
          API.trips.list({ limit: 300 })
        ]);
        setDrivers(driversRes.data.data || []);
        setVehicles(vehiclesRes.data.data || []);
        setParties(partiesRes.data.data || []);
        setTripsList(tripsRes.data.data || []);
      } catch (err) {
        console.error('Failed to load filters data:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    setReportData(null);
    setExportMessage('');
    setPlTab(0);
    setPlSearch('');
    setPlPage(0);
    setDriverId('');
    setVehicleId('');
    setPartyId('');
    setTripStatus('');
    setSelectedTripId('');
  }, [reportType]);

  const handleSort = (field) => {
    const isAsc = plSortField === field && plSortOrder === 'asc';
    setPlSortOrder(isAsc ? 'desc' : 'asc');
    setPlSortField(field);
    setPlPage(0); // Reset page on sort
  };

  const getFilteredTrips = () => {
    if (!reportData || !reportData.trips) return [];
    let list = reportData.trips;
    if (plSearch) {
      const q = plSearch.toLowerCase();
      list = list.filter(t => 
        t.tripNumber.toLowerCase().includes(q) ||
        t.driverName.toLowerCase().includes(q) ||
        t.vehicleNumber.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.route.toLowerCase().includes(q)
      );
    }
    if (plSortField) {
      list = [...list].sort((a, b) => {
        let valA = a[plSortField];
        let valB = b[plSortField];
        if (typeof valA === 'string') {
          return plSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return plSortOrder === 'asc' ? (valA - valB) : (valB - valA);
      });
    }
    return list;
  };

  const getFilteredVehicles = () => {
    if (!reportData || !reportData.vehicles) return [];
    let list = reportData.vehicles;
    if (plSearch) {
      const q = plSearch.toLowerCase();
      list = list.filter(v => 
        v.vehicleNumber.toLowerCase().includes(q)
      );
    }
    if (plSortField) {
      list = [...list].sort((a, b) => {
        let valA = a[plSortField];
        let valB = b[plSortField];
        if (typeof valA === 'string') {
          return plSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return plSortOrder === 'asc' ? (valA - valB) : (valB - valA);
      });
    }
    return list;
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null);
    setExportMessage('');
    try {
      const params = { startDate, endDate };
      if (reportType === 'driver-vehicle-pl') {
        if (driverId) params.driverId = driverId;
        if (vehicleId) params.vehicleId = vehicleId;
        if (partyId) params.partyId = partyId;
        if (tripStatus) params.status = tripStatus;
        if (selectedTripId) params.tripId = selectedTripId;
      }
      let res;
      
      switch (reportType) {
        case 'profit-loss':
          res = await API.reports.profitLoss(params);
          break;
        case 'trips':
          res = await API.reports.trips(params);
          break;
        case 'income':
          res = await API.reports.income(params);
          break;
        case 'driver-vehicle-pl':
          res = await API.reports.driverVehiclePL(params);
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
      csvRows.push(["Total Revenue", `${reportData.summary.totalIncome}`]);
      csvRows.push(["Total Commission Deducted", `${reportData.summary.totalCommission || '0.00'}`]);
      csvRows.push(["Total Costs", `${reportData.summary.totalExpense}`]);
      csvRows.push(["Net Operating Margins", `${reportData.summary.netProfit}`]);
      csvRows.push(["Diesel Refueling", `${reportData.summary.dieselExpense}`]);
      reportData.expensesBreakdown.forEach(exp => {
        csvRows.push([exp.headName, `${exp.amount}`]);
      });
    } else if (reportType === 'trips') {
      csvRows.push(["Trip No", "Vehicle", "Driver", "Customer", "Freight", "Commission", "Advance", "Advance Date", "Remaining", "Hold Amt", "POD Status", "Start Date", "Status"]);
      reportData.forEach(row => {
        csvRows.push([
          row.tripNumber,
          row.vehicle?.vehicleNumber || '-',
          row.driver?.name || '-',
          row.party?.name || '-',
          `${row.freightAmount}`,
          `${row.commission || 0}`,
          `${row.advance}`,
          row.advanceDate || '-',
          `${row.remainingPayment || '0.00'}`,
          `${row.balanceHoldAmount || '0.00'}`,
          row.podStatus || 'Pending',
          formatDate(row.startDate),
          row.status
        ]);
      });
    } else if (reportType === 'income') {
      csvRows.push(["Date", "Customer", "Trip No", "Trip Freight", "Trip Commission", "Amount Collected", "Remarks"]);
      reportData.forEach(row => {
        csvRows.push([
          formatDate(row.date),
          row.party?.name || '-',
          row.trip?.tripNumber || '-',
          `${row.trip?.freightAmount || '0.00'}`,
          `${row.trip?.commission || '0.00'}`,
          `${row.amount}`,
          row.remarks || ''
        ]);
      });
    } else if (reportType === 'diesel') {
      csvRows.push(["Date", "Vehicle", "Pump Name", "Driver", "Quantity (Ltrs)", "Rate", "Total Amount"]);
      reportData.forEach(row => {
        csvRows.push([
          formatDate(row.date),
          row.vehicle?.vehicleNumber || '-',
          row.pump?.name || '-',
          row.driver?.name || '-',
          `${row.quantity}L`,
          `${row.rate}`,
          `${row.totalAmount}`
        ]);
      });
    } else if (reportType === 'expenses') {
      csvRows.push(["Date", "Expense Head", "Vehicle", "Amount", "Remarks"]);
      reportData.forEach(row => {
        csvRows.push([
          formatDate(row.date),
          row.expenseHead?.name || '-',
          row.vehicle?.vehicleNumber || '-',
          `${row.amount}`,
          row.remarks || ''
        ]);
      });
    } else if (reportType === 'pumps') {
      csvRows.push(["Pump Name", "Contact Person", "Opening Dues", "Diesel Purchases", "Payments Made", "Outstanding Balance"]);
      reportData.forEach(row => {
        csvRows.push([
          row.name,
          row.contactPerson || '-',
          `${row.openingBalance}`,
          `${row.totalDieselPurchased}`,
          `${row.totalPayments}`,
          `${row.outstandingBalance}`
        ]);
      });
    } else if (reportType === 'driver-vehicle-pl') {
      if (plTab === 0) {
        csvRows.push([
          "Trip No", "Trip Date", "Driver", "Vehicle", "Customer", "Route", 
          "Freight Amount", "Driver Advance", "Driver Allowance (Bhatta)", "Fuel Expense", 
          "Toll Charges", "Loading/Unloading", "Other Expenses", "Total Expenses", 
          "Settlement Amount", "Remaining Balance", "Profit/Loss", "Payment Status"
        ]);
        const trips = getFilteredTrips();
        trips.forEach(row => {
          csvRows.push([
            row.tripNumber,
            formatDate(row.startDate),
            row.driverName,
            row.vehicleNumber,
            row.customerName,
            row.route,
            `${row.freightAmount.toFixed(2)}`,
            `${row.driverAdvance.toFixed(2)}`,
            `${row.driverAllowance.toFixed(2)}`,
            `${row.fuelExpense.toFixed(2)}`,
            `${row.tollCharges.toFixed(2)}`,
            `${row.loadingUnloading.toFixed(2)}`,
            `${row.otherExpenses.toFixed(2)}`,
            `${row.totalExpenses.toFixed(2)}`,
            `${row.driverSettlementAmount.toFixed(2)}`,
            `${row.remainingDriverBalance.toFixed(2)}`,
            `${row.profitLoss.toFixed(2)}`,
            row.paymentStatus
          ]);
        });
      } else if (plTab === 1) {
        csvRows.push([
          "Vehicle Number", "Total Trips", "Total Revenue", "Fuel Cost", 
          "Maintenance Cost", "Driver Cost", "Toll & Other Expenses", "Total Expenses", "Net Profit/Loss"
        ]);
        const vehicles = getFilteredVehicles();
        vehicles.forEach(row => {
          csvRows.push([
            row.vehicleNumber,
            row.totalTrips,
            `${row.totalRevenue.toFixed(2)}`,
            `${row.fuelCost.toFixed(2)}`,
            `${row.maintenanceCost.toFixed(2)}`,
            `${row.driverCost.toFixed(2)}`,
            `${row.tollOtherCost.toFixed(2)}`,
            `${row.totalExpenses.toFixed(2)}`,
            `${row.netProfitLoss.toFixed(2)}`
          ]);
        });
      } else {
        csvRows.push(["Metric", "Value"]);
        csvRows.push(["Total Revenue", `${reportData.summary.totalRevenue.toFixed(2)}`]);
        csvRows.push(["Total Fleet Expenses", `${reportData.summary.totalExpenses.toFixed(2)}`]);
        csvRows.push(["Net Operating Margins (Profit/Loss)", `${reportData.summary.netProfitLoss.toFixed(2)}`]);
        
        csvRows.push([]);
        csvRows.push(["Driver-wise Profit Summary"]);
        csvRows.push(["Driver Name", "Total Trips", "Revenue", "Net Profit"]);
        reportData.drivers.forEach(d => {
          csvRows.push([d.driverName, d.totalTrips, `${d.totalRevenue.toFixed(2)}`, `${d.netProfitLoss.toFixed(2)}`]);
        });
        
        csvRows.push([]);
        csvRows.push(["Vehicle-wise Profit Summary"]);
        csvRows.push(["Vehicle Number", "Total Trips", "Revenue", "Net Profit"]);
        reportData.vehicles.forEach(v => {
          csvRows.push([v.vehicleNumber, v.totalTrips, `${v.totalRevenue.toFixed(2)}`, `${v.netProfitLoss.toFixed(2)}`]);
        });
      }
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

  const handleExportSingleTrip = (format, row) => {
    if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      let html = `
        <html>
          <head>
            <title>Trip ${row.tripNumber} P&L Details</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 30px; color: #333; line-height: 1.5; }
              .header-table { width: 100%; border: none; margin-bottom: 25px; border-collapse: collapse; }
              .header-cell { border: none; padding: 0; }
              .header-title { font-size: 24px; color: #1e3a8a; font-weight: bold; margin: 0; }
              .header-subtitle { font-size: 14px; color: #475569; font-weight: bold; margin: 5px 0 0 0; }
              .header-info { text-align: right; font-size: 11px; color: #64748b; line-height: 1.4; }
              .title-bar { border-bottom: 3px solid #3b82f6; padding-bottom: 8px; margin-bottom: 25px; }
              .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .details-box { padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
              .details-box h3 { margin-top: 0; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; font-size: 14px; text-transform: uppercase; }
              .details-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
              .details-label { color: #64748b; font-weight: bold; }
              .details-value { font-weight: bold; color: #1e293b; }
              .summary-box { margin-top: 30px; padding: 20px; border-radius: 8px; text-align: center; }
              .summary-box.profit { background-color: #d1fae5; border: 1px solid #10b981; color: #065f46; }
              .summary-box.loss { background-color: #fee2e2; border: 1px solid #ef4444; color: #991b1b; }
              .summary-value { font-size: 28px; font-weight: bold; margin-top: 5px; }
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
            
            <div class="title-bar">
              <h2 style="margin: 0; color: #1e3a8a;">TRIP PROFIT & LOSS ANALYSIS REPORT</h2>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Generated on: ${new Date().toLocaleString()}</div>
            </div>

            <div class="details-grid">
              <div class="details-box">
                <h3>Trip Information</h3>
                <div class="details-row"><span class="details-label">Trip Number:</span><span class="details-value">${row.tripNumber}</span></div>
                <div class="details-row"><span class="details-label">Trip Date:</span><span class="details-value">${formatDate(row.startDate)}</span></div>
                <div class="details-row"><span class="details-label">Vehicle Number:</span><span class="details-value">${row.vehicleNumber}</span></div>
                <div class="details-row"><span class="details-label">Driver Name:</span><span class="details-value">${row.driverName}</span></div>
                <div class="details-row"><span class="details-label">Customer/Party:</span><span class="details-value">${row.customerName}</span></div>
                <div class="details-row"><span class="details-label">Route:</span><span class="details-value">${row.route}</span></div>
                <div class="details-row"><span class="details-label">Trip Status:</span><span class="details-value">${row.status}</span></div>
              </div>

              <div class="details-box">
                <h3>Financial Summary</h3>
                <div class="details-row"><span class="details-label">Freight Amount (A):</span><span class="details-value" style="color: #10b981;">₹${row.freightAmount.toFixed(2)}</span></div>
                <div class="details-row"><span class="details-label">Fuel Expense:</span><span class="details-value">₹${row.fuelExpense.toFixed(2)}</span></div>
                <div class="details-row"><span class="details-label">Driver Advance:</span><span class="details-value">₹${row.driverAdvance.toFixed(2)}</span></div>
                <div class="details-row"><span class="details-label">Bhatta (Allowance):</span><span class="details-value">₹${row.driverAllowance.toFixed(2)}</span></div>
                <div class="details-row"><span class="details-label">Toll Charges:</span><span class="details-value">₹${row.tollCharges.toFixed(2)}</span></div>
                <div class="details-row"><span class="details-label">Loading/Unloading:</span><span class="details-value">₹${row.loadingUnloading.toFixed(2)}</span></div>
                <div class="details-row"><span class="details-label">Other Expenses:</span><span class="details-value">₹${row.rawOtherExpenses.toFixed(2)}</span></div>
                <div class="details-row" style="border-top: 1px solid #cbd5e1; padding-top: 5px;"><span class="details-label">Total Expenses (B):</span><span class="details-value" style="color: #ef4444;">₹${row.totalExpenses.toFixed(2)}</span></div>
              </div>
            </div>

            <div class="details-grid">
              <div class="details-box">
                <h3>Driver Settlement Details</h3>
                <div class="details-row"><span class="details-label">Driver Allowance (Bhatta):</span><span class="details-value">₹${row.driverAllowance.toFixed(2)}</span></div>
                <div class="details-row"><span class="details-label">Driver Advance:</span><span class="details-value">₹${row.driverAdvance.toFixed(2)}</span></div>
                <div class="details-row" style="border-top: 1px solid #cbd5e1; padding-top: 5px;"><span class="details-label">Net Settlement Amount:</span><span class="details-value">₹${row.driverSettlementAmount.toFixed(2)}</span></div>
                <div class="details-row"><span class="details-label">Remaining Balance:</span><span class="details-value">₹${row.remainingDriverBalance.toFixed(2)}</span></div>
                <div class="details-row"><span class="details-label">Payment Status:</span><span class="details-value" style="color: ${row.paymentStatus === 'Settled' ? '#10b981' : '#f59e0b'};">${row.paymentStatus}</span></div>
              </div>

              <div class="details-box" style="display: flex; flex-direction: column; justify-content: center; align-items: center; background: ${row.profitLoss >= 0 ? '#ecfdf5' : '#fef2f2'}; border-color: ${row.profitLoss >= 0 ? '#10b981' : '#ef4444'};">
                <div style="font-size: 14px; font-weight: bold; color: ${row.profitLoss >= 0 ? '#065f46' : '#991b1b'}; text-transform: uppercase;">Net Profit / Loss</div>
                <div style="font-size: 32px; font-weight: 800; color: ${row.profitLoss >= 0 ? '#10b981' : '#ef4444'}; margin-top: 8px;">
                  ₹${row.profitLoss.toFixed(2)}
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else if (format === 'excel') {
      const csvRows = [];
      csvRows.push(["Trip Profit & Loss Analysis Details"]);
      csvRows.push(["Generated on", new Date().toLocaleString()]);
      csvRows.push([]);
      
      csvRows.push(["TRIP INFORMATION"]);
      csvRows.push(["Trip Number", row.tripNumber]);
      csvRows.push(["Trip Date", formatDate(row.startDate)]);
      csvRows.push(["Vehicle Number", row.vehicleNumber]);
      csvRows.push(["Driver Name", row.driverName]);
      csvRows.push(["Customer/Party", row.customerName]);
      csvRows.push(["Route", row.route]);
      csvRows.push(["Status", row.status]);
      csvRows.push([]);

      csvRows.push(["FINANCIAL STATEMENT"]);
      csvRows.push(["Freight Amount (Income)", row.freightAmount.toFixed(2)]);
      csvRows.push(["Fuel Expense", row.fuelExpense.toFixed(2)]);
      csvRows.push(["Driver Advance", row.driverAdvance.toFixed(2)]);
      csvRows.push(["Bhatta (Allowance)", row.driverAllowance.toFixed(2)]);
      csvRows.push(["Toll Charges", row.tollCharges.toFixed(2)]);
      csvRows.push(["Loading/Unloading", row.loadingUnloading.toFixed(2)]);
      csvRows.push(["Other Expenses", row.rawOtherExpenses.toFixed(2)]);
      csvRows.push(["Total Expenses", row.totalExpenses.toFixed(2)]);
      csvRows.push(["Net Profit/Loss", row.profitLoss.toFixed(2)]);
      csvRows.push([]);

      csvRows.push(["DRIVER SETTLEMENT"]);
      csvRows.push(["Bhatta (Allowance)", row.driverAllowance.toFixed(2)]);
      csvRows.push(["Driver Advance", row.driverAdvance.toFixed(2)]);
      csvRows.push(["Settled Amount", row.driverSettlementAmount.toFixed(2)]);
      csvRows.push(["Remaining Balance", row.remainingDriverBalance.toFixed(2)]);
      csvRows.push(["Payment Status", row.paymentStatus]);

      const csvContent = csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Trip_${row.tripNumber}_PL_Details_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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

    if (reportType === 'driver-vehicle-pl') {
      if (plTab === 0) {
        const trips = getFilteredTrips();
        const totalFreight = trips.reduce((acc, t) => acc + t.freightAmount, 0);
        const totalAdvance = trips.reduce((acc, t) => acc + t.driverAdvance, 0);
        const totalAllowance = trips.reduce((acc, t) => acc + t.driverAllowance, 0);
        const totalFuel = trips.reduce((acc, t) => acc + t.fuelExpense, 0);
        const totalToll = trips.reduce((acc, t) => acc + t.tollCharges, 0);
        const totalLoading = trips.reduce((acc, t) => acc + t.loadingUnloading, 0);
        const totalOther = trips.reduce((acc, t) => acc + t.otherExpenses, 0);
        const totalExpenses = trips.reduce((acc, t) => acc + t.totalExpenses, 0);
        const totalPL = trips.reduce((acc, t) => acc + t.profitLoss, 0);
        const totalSettlement = trips.reduce((acc, t) => acc + t.driverSettlementAmount, 0);
        const totalRemaining = trips.reduce((acc, t) => acc + t.remainingDriverBalance, 0);

        html += `
          <h3>Driver-wise Trip Profit & Loss Detailed Registry</h3>
          <table style="font-size: 11px;">
            <thead>
              <tr>
                <th>Trip No</th>
                <th>Date</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Route</th>
                <th style="text-align: right;">Freight</th>
                <th style="text-align: right;">Advance</th>
                <th style="text-align: right;">Bhatta</th>
                <th style="text-align: right;">Fuel</th>
                <th style="text-align: right;">Toll</th>
                <th style="text-align: right;">L/UL</th>
                <th style="text-align: right;">Other</th>
                <th style="text-align: right;">Total Exp</th>
                <th style="text-align: right;">Settled</th>
                <th style="text-align: right;">Balance</th>
                <th style="text-align: right;">Profit/Loss</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${trips.map(row => `
                <tr>
                  <td><strong>${row.tripNumber}</strong></td>
                  <td>${formatDate(row.startDate)}</td>
                  <td>${row.driverName}</td>
                  <td>${row.vehicleNumber}</td>
                  <td>${row.customerName}</td>
                  <td>${row.route}</td>
                  <td style="text-align: right;">₹${row.freightAmount.toFixed(2)}</td>
                  <td style="text-align: right;">₹${row.driverAdvance.toFixed(2)}</td>
                  <td style="text-align: right;">₹${row.driverAllowance.toFixed(2)}</td>
                  <td style="text-align: right;">₹${row.fuelExpense.toFixed(2)}</td>
                  <td style="text-align: right;">₹${row.tollCharges.toFixed(2)}</td>
                  <td style="text-align: right;">₹${row.loadingUnloading.toFixed(2)}</td>
                  <td style="text-align: right;">₹${row.otherExpenses.toFixed(2)}</td>
                  <td style="text-align: right; font-weight: bold;">₹${row.totalExpenses.toFixed(2)}</td>
                  <td style="text-align: right;">₹${row.driverSettlementAmount.toFixed(2)}</td>
                  <td style="text-align: right;">₹${row.remainingDriverBalance.toFixed(2)}</td>
                  <td style="text-align: right; font-weight: bold; color: ${row.profitLoss >= 0 ? '#10b981' : '#ef4444'};">
                    ₹${row.profitLoss.toFixed(2)}
                  </td>
                  <td>${row.paymentStatus}</td>
                </tr>
              `).join('')}
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <td colspan="6">Overall Totals</td>
                <td style="text-align: right;">₹${totalFreight.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalAdvance.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalAllowance.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalFuel.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalToll.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalLoading.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalOther.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalExpenses.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalSettlement.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalRemaining.toFixed(2)}</td>
                <td style="text-align: right; color: ${totalPL >= 0 ? '#10b981' : '#ef4444'};">₹${totalPL.toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        `;
      } else if (plTab === 1) {
        const vehicles = getFilteredVehicles();
        const totalTrips = vehicles.reduce((acc, v) => acc + v.totalTrips, 0);
        const totalRev = vehicles.reduce((acc, v) => acc + v.totalRevenue, 0);
        const totalFuel = vehicles.reduce((acc, v) => acc + v.fuelCost, 0);
        const totalMaint = vehicles.reduce((acc, v) => acc + v.maintenanceCost, 0);
        const totalDriver = vehicles.reduce((acc, v) => acc + v.driverCost, 0);
        const totalTollOther = vehicles.reduce((acc, v) => acc + v.tollOtherCost, 0);
        const totalExpenses = vehicles.reduce((acc, v) => acc + v.totalExpenses, 0);
        const totalPL = vehicles.reduce((acc, v) => acc + v.netProfitLoss, 0);

        html += `
          <h3>Vehicle-wise Fleet Profitability Summary</h3>
          <table>
            <thead>
              <tr>
                <th>Vehicle No</th>
                <th style="text-align: right;">Total Trips</th>
                <th style="text-align: right;">Total Revenue</th>
                <th style="text-align: right;">Fuel Cost</th>
                <th style="text-align: right;">Maintenance Cost</th>
                <th style="text-align: right;">Driver Cost</th>
                <th style="text-align: right;">Toll & Other Exp</th>
                <th style="text-align: right;">Total Expenses</th>
                <th style="text-align: right;">Net Profit/Loss</th>
              </tr>
            </thead>
            <tbody>
              ${vehicles.map(row => `
                <tr>
                  <td><strong>${row.vehicleNumber}</strong></td>
                  <td style="text-align: right;">${row.totalTrips}</td>
                  <td style="text-align: right;">₹${row.totalRevenue.toFixed(2)}</td>
                  <td style="text-align: right;">₹${row.fuelCost.toFixed(2)}</td>
                  <td style="text-align: right;">₹${row.maintenanceCost.toFixed(2)}</td>
                  <td style="text-align: right;">₹${row.driverCost.toFixed(2)}</td>
                  <td style="text-align: right;">₹${row.tollOtherCost.toFixed(2)}</td>
                  <td style="text-align: right; font-weight: bold;">₹${row.totalExpenses.toFixed(2)}</td>
                  <td style="text-align: right; font-weight: bold; color: ${row.netProfitLoss >= 0 ? '#10b981' : '#ef4444'};">
                    ₹${row.netProfitLoss.toFixed(2)}
                  </td>
                </tr>
              `).join('')}
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <td>Overall Totals</td>
                <td style="text-align: right;">${totalTrips}</td>
                <td style="text-align: right;">₹${totalRev.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalFuel.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalMaint.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalDriver.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalTollOther.toFixed(2)}</td>
                <td style="text-align: right;">₹${totalExpenses.toFixed(2)}</td>
                <td style="text-align: right; color: ${totalPL >= 0 ? '#10b981' : '#ef4444'};">₹${totalPL.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        `;
      } else {
        html += `
          <div class="summary-cards">
            <div class="card success">
              <div class="card-title">Total Revenue</div>
              <div class="card-value">₹${reportData.summary.totalRevenue.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Fleet Expenses</div>
              <div class="card-value">₹${reportData.summary.totalExpenses.toLocaleString()}</div>
            </div>
            <div class="card ${reportData.summary.netProfitLoss >= 0 ? 'success' : 'error'}">
              <div class="card-title">Net Operating Margins (Profit/Loss)</div>
              <div class="card-value">₹${reportData.summary.netProfitLoss.toLocaleString()}</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 20px; margin-top: 30px;">
            <div style="flex: 1;">
              <h3>Driver-wise Profit Summary</h3>
              <table>
                <thead>
                  <tr>
                    <th>Driver Name</th>
                    <th>Trips</th>
                    <th>Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.drivers.sort((a,b) => b.netProfitLoss - a.netProfitLoss).map(row => `
                    <tr>
                      <td>${row.driverName}</td>
                      <td>${row.totalTrips}</td>
                      <td style="font-weight: bold; color: ${row.netProfitLoss >= 0 ? '#10b981' : '#ef4444'}">₹${row.netProfitLoss.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="flex: 1;">
              <h3>Vehicle-wise Profit Summary</h3>
              <table>
                <thead>
                  <tr>
                    <th>Vehicle No</th>
                    <th>Trips</th>
                    <th>Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.vehicles.sort((a,b) => b.netProfitLoss - a.netProfitLoss).map(row => `
                    <tr>
                      <td>${row.vehicleNumber}</td>
                      <td>${row.totalTrips}</td>
                      <td style="font-weight: bold; color: ${row.netProfitLoss >= 0 ? '#10b981' : '#ef4444'}">₹${row.netProfitLoss.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
    } else if (reportType === 'profit-loss') {
      html += `
        <div class="summary-cards">
          <div class="card success">
            <div class="card-title">Total Revenue</div>
            <div class="card-value">₹${reportData.summary.totalIncome}</div>
          </div>
          <div style="border-left-color: #f59e0b;" class="card">
            <div class="card-title">Total Commission Deducted</div>
            <div class="card-value">₹${reportData.summary.totalCommission || '0.00'}</div>
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
              <th>Commission</th>
              <th>Advance</th>
              <th>Remaining</th>
              <th>Hold Amt</th>
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
                <td>₹${row.commission || 0}</td>
                <td>
                  ₹${row.advance}
                  ${row.advanceDate ? `<br/><span style="font-size:0.75rem;color:gray;">(${formatDate(row.advanceDate)})</span>` : ''}
                </td>
                <td>₹${row.remainingPayment || '0.00'}</td>
                <td>₹${row.balanceHoldAmount || '0.00'} (${row.podStatus || 'Pending'})</td>
                <td>${formatDate(row.startDate)}</td>
                <td>${row.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'income') {
      html += `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Trip No</th>
              <th>Trip Freight</th>
              <th>Trip Commission</th>
              <th>Amount Collected</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(row => `
              <tr>
                <td>${formatDate(row.date)}</td>
                <td>${row.party?.name || '-'}</td>
                <td><strong>${row.trip?.tripNumber || '-'}</strong></td>
                <td>₹${row.trip?.freightAmount || '0.00'}</td>
                <td>₹${row.trip?.commission || '0.00'}</td>
                <td style="font-weight: bold; color: #16a34a;">₹${row.amount}</td>
                <td>${row.remarks || '-'}</td>
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
              <th>Quantity (Ltrs)</th>
              <th>Rate</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(row => `
              <tr>
                <td>${formatDate(row.date)}</td>
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
                <td>${formatDate(row.date)}</td>
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
      <AdminHeader
        title="Reports & Analytics Center"
        description="Generate official profit-loss summaries, trips registries, diesel consumption logs, and pump vendor clearance reports."
        icon={<BarChartIcon />}
      />

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
              <MenuItem value="income">Income Collections Report</MenuItem>
              <MenuItem value="driver-vehicle-pl">Driver & Vehicle Profit/Loss</MenuItem>
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

          {/* Conditional Filters for Driver & Vehicle P&L Report */}
          {reportType === 'driver-vehicle-pl' && (
            <>
              <Grid item xs={12} sm={2.4}>
                <TextField
                  fullWidth
                  select
                  label="Filter by Driver"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                >
                  <MenuItem value="">All Drivers</MenuItem>
                  {drivers.map(d => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={2.4}>
                <TextField
                  fullWidth
                  select
                  label="Filter by Vehicle"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  <MenuItem value="">All Vehicles</MenuItem>
                  {vehicles.map(v => (
                    <MenuItem key={v.id} value={v.id}>{v.vehicleNumber}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={2.4}>
                <TextField
                  fullWidth
                  select
                  label="Filter by Customer"
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                >
                  <MenuItem value="">All Customers</MenuItem>
                  {parties.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={2.4}>
                <TextField
                  fullWidth
                  select
                  label="Filter by Trip"
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                >
                  <MenuItem value="">All Trips</MenuItem>
                  {tripsList.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.tripNumber}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={2.4}>
                <TextField
                  fullWidth
                  select
                  label="Trip Status"
                  value={tripStatus}
                  onChange={(e) => setTripStatus(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Running">Running</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>
            </>
          )}
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
          {reportType === 'profit-loss' && reportData && reportData.summary && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={3}>
                  <Card sx={{ borderLeft: '6px solid #10b981' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{reportData.summary.totalIncome}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card sx={{ borderLeft: '6px solid #f59e0b' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Commission Deducted</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{reportData.summary.totalCommission || '0.00'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card sx={{ borderLeft: '6px solid #ef4444' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Costs (Fuel + Misc)</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{reportData.summary.totalExpense}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
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
          {reportType === 'trips' && Array.isArray(reportData) && (
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
                      <TableCell align="right">Commission</TableCell>
                      <TableCell align="right">Advance</TableCell>
                      <TableCell align="right">Remaining</TableCell>
                      <TableCell align="right">Hold Amt</TableCell>
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
                        <TableCell align="right">₹{row.commission || 0}</TableCell>
                        <TableCell align="right">
                          ₹{row.advance}
                          {row.advanceDate && (
                            <span style={{ fontSize: '0.75rem', display: 'block', color: 'gray' }}>
                              ({formatDate(row.advanceDate)})
                            </span>
                          )}
                        </TableCell>
                        <TableCell align="right">₹{row.remainingPayment || '0.00'}</TableCell>
                        <TableCell align="right">
                          ₹{row.balanceHoldAmount || '0.00'}
                          <Typography variant="caption" sx={{ display: 'block', color: row.podStatus === 'Approved' ? 'success.main' : 'warning.main' }}>
                            POD: {row.podStatus || 'Pending'}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(row.startDate)}</TableCell>
                        <TableCell>{row.status}</TableCell>
                      </TableRow>
                    ))}
                    {reportData.length === 0 && (
                      <TableRow><TableCell colSpan={11} align="center">No logs found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Render Income Report */}
          {reportType === 'income' && Array.isArray(reportData) && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Income Collections Logs</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Trip No</TableCell>
                      <TableCell align="right">Trip Freight</TableCell>
                      <TableCell align="right">Trip Commission</TableCell>
                      <TableCell align="right">Amount Collected</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{formatDate(row.date)}</TableCell>
                        <TableCell>{row.party?.name || 'N/A'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.trip?.tripNumber || 'N/A'}</TableCell>
                        <TableCell align="right">₹{row.trip?.freightAmount || '0.00'}</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>₹{row.trip?.commission || '0.00'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>₹{row.amount}</TableCell>
                        <TableCell>{row.remarks || 'N/A'}</TableCell>
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

          {/* Render Driver & Vehicle Profit/Loss Report */}
          {reportType === 'driver-vehicle-pl' && reportData && (
            <Box>
              {/* Tab Navigation */}
              <Paper sx={{ mb: 3 }}>
                <Tabs 
                  value={plTab} 
                  onChange={(e, val) => { 
                    setPlTab(val); 
                    setPlSearch(''); 
                    setPlPage(0); 
                    setPlSortField(''); 
                  }} 
                  indicatorColor="primary"
                  textColor="primary"
                  variant="fullWidth"
                >
                  <Tab label="Driver-wise Trip PL" />
                  <Tab label="Vehicle-wise Summary" />
                  <Tab label="Consolidated Summary" />
                </Tabs>
              </Paper>

              {/* Sub-report Search Bar (only for Driver-wise and Vehicle-wise tabs) */}
              {plTab !== 2 && (
                <TextField
                  fullWidth
                  label={plTab === 0 ? "Search by Trip No, Driver, Vehicle, Customer, Route..." : "Search by Vehicle Number..."}
                  value={plSearch}
                  onChange={(e) => { setPlSearch(e.target.value); setPlPage(0); }}
                  sx={{ mb: 3 }}
                  size="small"
                />
              )}

              {/* Driver-wise Trip PL Detailed Table */}
              {plTab === 0 && (() => {
                const sortedAndFilteredTrips = getFilteredTrips();
                const count = sortedAndFilteredTrips.length;
                const paginatedTrips = sortedAndFilteredTrips.slice(plPage * plRowsPerPage, plPage * plRowsPerPage + plRowsPerPage);

                // Calculate Totals
                const totalFreight = sortedAndFilteredTrips.reduce((acc, t) => acc + t.freightAmount, 0);
                const totalAdvance = sortedAndFilteredTrips.reduce((acc, t) => acc + t.driverAdvance, 0);
                const totalAllowance = sortedAndFilteredTrips.reduce((acc, t) => acc + t.driverAllowance, 0);
                const totalFuel = sortedAndFilteredTrips.reduce((acc, t) => acc + t.fuelExpense, 0);
                const totalToll = sortedAndFilteredTrips.reduce((acc, t) => acc + t.tollCharges, 0);
                const totalLoading = sortedAndFilteredTrips.reduce((acc, t) => acc + t.loadingUnloading, 0);
                const totalOther = sortedAndFilteredTrips.reduce((acc, t) => acc + t.otherExpenses, 0);
                const totalExpenses = sortedAndFilteredTrips.reduce((acc, t) => acc + t.totalExpenses, 0);
                const totalPL = sortedAndFilteredTrips.reduce((acc, t) => acc + t.profitLoss, 0);
                const totalSettlement = sortedAndFilteredTrips.reduce((acc, t) => acc + t.driverSettlementAmount, 0);
                const totalRemaining = sortedAndFilteredTrips.reduce((acc, t) => acc + t.remainingDriverBalance, 0);

                return (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Driver-wise Trip Profit & Loss Detailed Registry</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><TableSortLabel active={plSortField === 'tripNumber'} direction={plSortOrder} onClick={() => handleSort('tripNumber')}>Trip No</TableSortLabel></TableCell>
                            <TableCell><TableSortLabel active={plSortField === 'startDate'} direction={plSortOrder} onClick={() => handleSort('startDate')}>Trip Date</TableSortLabel></TableCell>
                            <TableCell>Driver</TableCell>
                            <TableCell>Vehicle</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Route</TableCell>
                            <TableCell align="right"><TableSortLabel active={plSortField === 'freightAmount'} direction={plSortOrder} onClick={() => handleSort('freightAmount')}>Freight</TableSortLabel></TableCell>
                            <TableCell align="right">Advance</TableCell>
                            <TableCell align="right">Bhatta</TableCell>
                            <TableCell align="right">Fuel</TableCell>
                            <TableCell align="right">Toll</TableCell>
                            <TableCell align="right">L/UL</TableCell>
                            <TableCell align="right">Other</TableCell>
                            <TableCell align="right"><TableSortLabel active={plSortField === 'totalExpenses'} direction={plSortOrder} onClick={() => handleSort('totalExpenses')}>Total Exp</TableSortLabel></TableCell>
                            <TableCell align="right">Settled</TableCell>
                            <TableCell align="right">Balance</TableCell>
                            <TableCell align="right"><TableSortLabel active={plSortField === 'profitLoss'} direction={plSortOrder} onClick={() => handleSort('profitLoss')}>Profit/Loss</TableSortLabel></TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedTrips.map((row) => (
                            <TableRow key={row.id} hover>
                              <TableCell sx={{ fontWeight: 600 }}>{row.tripNumber}</TableCell>
                              <TableCell>{formatDate(row.startDate)}</TableCell>
                              <TableCell>{row.driverName}</TableCell>
                              <TableCell>{row.vehicleNumber}</TableCell>
                              <TableCell>{row.customerName}</TableCell>
                              <TableCell>{row.route}</TableCell>
                              <TableCell align="right">₹{row.freightAmount.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{row.driverAdvance.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{row.driverAllowance.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{row.fuelExpense.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{row.tollCharges.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{row.loadingUnloading.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{row.otherExpenses.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>₹{row.totalExpenses.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{row.driverSettlementAmount.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{row.remainingDriverBalance.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: row.profitLoss >= 0 ? 'success.main' : 'error.main' }}>
                                ₹{row.profitLoss.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={row.paymentStatus} 
                                  color={row.paymentStatus === 'Settled' ? 'success' : 'warning'} 
                                  size="small" 
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                  <IconButton size="small" color="primary" onClick={() => handleExportSingleTrip('pdf', row)} title="Download Details PDF">
                                    <PrintIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" color="secondary" onClick={() => handleExportSingleTrip('excel', row)} title="Download Details Excel">
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                          {sortedAndFilteredTrips.length === 0 && (
                            <TableRow><TableCell colSpan={19} align="center">No logs found</TableCell></TableRow>
                          )}
                          
                          {/* Totals Row */}
                          {sortedAndFilteredTrips.length > 0 && (
                            <TableRow sx={{ bgcolor: '#f8fafc', fontStyle: 'italic' }}>
                              <TableCell colSpan={6} sx={{ fontWeight: 700 }}>Overall Totals</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalFreight.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalAdvance.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalAllowance.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalFuel.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalToll.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalLoading.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalOther.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>₹{totalExpenses.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalSettlement.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalRemaining.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: totalPL >= 0 ? 'success.main' : 'error.main' }}>
                                ₹{totalPL.toFixed(2)}
                              </TableCell>
                              <TableCell />
                              <TableCell />
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      rowsPerPageOptions={[10, 25, 50]}
                      component="div"
                      count={count}
                      rowsPerPage={plRowsPerPage}
                      page={plPage}
                      onPageChange={(e, newPage) => setPlPage(newPage)}
                      onRowsPerPageChange={(e) => { setPlRowsPerPage(parseInt(e.target.value, 10)); setPlPage(0); }}
                    />
                  </Paper>
                );
              })()}

              {/* Vehicle-wise Summary Table */}
              {plTab === 1 && (() => {
                const sortedAndFilteredVehicles = getFilteredVehicles();
                const count = sortedAndFilteredVehicles.length;
                const paginatedVehicles = sortedAndFilteredVehicles.slice(plPage * plRowsPerPage, plPage * plRowsPerPage + plRowsPerPage);

                // Calculate Totals
                const totalTrips = sortedAndFilteredVehicles.reduce((acc, v) => acc + v.totalTrips, 0);
                const totalRev = sortedAndFilteredVehicles.reduce((acc, v) => acc + v.totalRevenue, 0);
                const totalFuel = sortedAndFilteredVehicles.reduce((acc, v) => acc + v.fuelCost, 0);
                const totalMaint = sortedAndFilteredVehicles.reduce((acc, v) => acc + v.maintenanceCost, 0);
                const totalDriver = sortedAndFilteredVehicles.reduce((acc, v) => acc + v.driverCost, 0);
                const totalTollOther = sortedAndFilteredVehicles.reduce((acc, v) => acc + v.tollOtherCost, 0);
                const totalExpenses = sortedAndFilteredVehicles.reduce((acc, v) => acc + v.totalExpenses, 0);
                const totalPL = sortedAndFilteredVehicles.reduce((acc, v) => acc + v.netProfitLoss, 0);

                return (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Vehicle-wise Fleet Profitability Summary</Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><TableSortLabel active={plSortField === 'vehicleNumber'} direction={plSortOrder} onClick={() => handleSort('vehicleNumber')}>Vehicle No</TableSortLabel></TableCell>
                            <TableCell align="right"><TableSortLabel active={plSortField === 'totalTrips'} direction={plSortOrder} onClick={() => handleSort('totalTrips')}>Total Trips</TableSortLabel></TableCell>
                            <TableCell align="right"><TableSortLabel active={plSortField === 'totalRevenue'} direction={plSortOrder} onClick={() => handleSort('totalRevenue')}>Total Revenue</TableSortLabel></TableCell>
                            <TableCell align="right">Fuel Cost</TableCell>
                            <TableCell align="right">Maintenance Cost</TableCell>
                            <TableCell align="right">Driver Cost</TableCell>
                            <TableCell align="right">Toll & Other Exp</TableCell>
                            <TableCell align="right"><TableSortLabel active={plSortField === 'totalExpenses'} direction={plSortOrder} onClick={() => handleSort('totalExpenses')}>Total Expenses</TableSortLabel></TableCell>
                            <TableCell align="right"><TableSortLabel active={plSortField === 'netProfitLoss'} direction={plSortOrder} onClick={() => handleSort('netProfitLoss')}>Net Profit/Loss</TableSortLabel></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedVehicles.map((row, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ fontWeight: 600 }}>{row.vehicleNumber}</TableCell>
                              <TableCell align="right">{row.totalTrips}</TableCell>
                              <TableCell align="right">₹{row.totalRevenue.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{row.fuelCost.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{row.maintenanceCost.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{row.driverCost.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{row.tollOtherCost.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>₹{row.totalExpenses.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: row.netProfitLoss >= 0 ? 'success.main' : 'error.main' }}>
                                ₹{row.netProfitLoss.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {sortedAndFilteredVehicles.length === 0 && (
                            <TableRow><TableCell colSpan={9} align="center">No logs found</TableCell></TableRow>
                          )}

                          {/* Totals Row */}
                          {sortedAndFilteredVehicles.length > 0 && (
                            <TableRow sx={{ bgcolor: '#f8fafc', fontStyle: 'italic' }}>
                              <TableCell sx={{ fontWeight: 700 }}>Overall Totals</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{totalTrips}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalRev.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalFuel.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalMaint.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalDriver.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalTollOther.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>₹{totalExpenses.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: totalPL >= 0 ? 'success.main' : 'error.main' }}>
                                ₹{totalPL.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      rowsPerPageOptions={[10, 25, 50]}
                      component="div"
                      count={count}
                      rowsPerPage={plRowsPerPage}
                      page={plPage}
                      onPageChange={(e, newPage) => setPlPage(newPage)}
                      onRowsPerPageChange={(e) => { setPlRowsPerPage(parseInt(e.target.value, 10)); setPlPage(0); }}
                    />
                  </Paper>
                );
              })()}

              {/* Consolidated Summary Tab */}
              {plTab === 2 && (
                <Box>
                  {/* Summary Metric Cards */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                      <Card sx={{ borderLeft: '6px solid #10b981' }}>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{reportData.summary.totalRevenue.toLocaleString()}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card sx={{ borderLeft: '6px solid #ef4444' }}>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">Total Fleet Expenses</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{reportData.summary.totalExpenses.toLocaleString()}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card sx={{ bgcolor: reportData.summary.netProfitLoss >= 0 ? 'success.light' : 'error.light', color: '#ffffff' }}>
                        <CardContent>
                          <Typography variant="body2">Net Operating Margins (Profit/Loss)</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{reportData.summary.netProfitLoss.toLocaleString()}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Driver and Vehicle Rankings lists */}
                  <Grid container spacing={3}>
                    {/* Driver Rankings */}
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Driver-wise Profit Summary</Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Driver Name</TableCell>
                                <TableCell align="right">Total Trips</TableCell>
                                <TableCell align="right">Revenue</TableCell>
                                <TableCell align="right">Net Profit</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {reportData.drivers
                                .sort((a, b) => b.netProfitLoss - a.netProfitLoss)
                                .map((row, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{row.driverName}</TableCell>
                                    <TableCell align="right">{row.totalTrips}</TableCell>
                                    <TableCell align="right">₹{row.totalRevenue.toFixed(2)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: row.netProfitLoss >= 0 ? 'success.main' : 'error.main' }}>
                                      ₹{row.netProfitLoss.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    </Grid>

                    {/* Vehicle Rankings */}
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Vehicle-wise Profit Summary</Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Vehicle No</TableCell>
                                <TableCell align="right">Total Trips</TableCell>
                                <TableCell align="right">Revenue</TableCell>
                                <TableCell align="right">Net Profit</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {reportData.vehicles
                                .sort((a, b) => b.netProfitLoss - a.netProfitLoss)
                                .map((row, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{row.vehicleNumber}</TableCell>
                                    <TableCell align="right">{row.totalTrips}</TableCell>
                                    <TableCell align="right">₹{row.totalRevenue.toFixed(2)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: row.netProfitLoss >= 0 ? 'success.main' : 'error.main' }}>
                                      ₹{row.netProfitLoss.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}

          {/* Render Diesel Refueling logs */}
          {reportType === 'diesel' && Array.isArray(reportData) && (
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
                        <TableCell>{formatDate(row.date)}</TableCell>
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
          {reportType === 'expenses' && Array.isArray(reportData) && (
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
                        <TableCell>{formatDate(row.date)}</TableCell>
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
          {reportType === 'pumps' && Array.isArray(reportData) && (
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
