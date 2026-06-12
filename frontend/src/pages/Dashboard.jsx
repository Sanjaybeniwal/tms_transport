import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import API from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.dashboard.getStats();
        setStats(res.data.data);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const { cards, monthlyTrends, performance } = stats;

  const cardItems = [
    { title: 'Total Vehicles', value: cards.totalVehicles, icon: <LocalShippingIcon fontSize="large" />, color: '#3b82f6' },
    { title: 'Total Owners', value: cards.totalOwners, icon: <PeopleIcon fontSize="large" />, color: '#8b5cf6' },
    { title: 'Total Drivers', value: cards.totalDrivers, icon: <PersonIcon fontSize="large" />, color: '#10b981' },
    { title: 'Total Trips', value: cards.totalTrips, icon: <AltRouteIcon fontSize="large" />, color: '#ec4899' },
    { title: 'Total Pumps', value: cards.totalPumps, icon: <LocalGasStationIcon fontSize="large" />, color: '#f59e0b' },
    { title: 'Diesel Expense', value: `₹${cards.totalDieselExpense}`, icon: <LocalGasStationIcon fontSize="large" />, color: '#f43f5e' },
    { title: 'Total Income', value: `₹${cards.totalIncome}`, icon: <TrendingUpIcon fontSize="large" />, color: '#10b981' },
    { title: 'Total Expenses', value: `₹${cards.totalExpenses}`, icon: <TrendingDownIcon fontSize="large" />, color: '#ef4444' },
    { title: 'Pump Outstanding', value: `₹${cards.outstandingAmount}`, icon: <AccountBalanceWalletIcon fontSize="large" />, color: '#6366f1' }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, letterSpacing: '-0.02em' }}>
        Dashboard Analytics
      </Typography>

      {/* Quick Actions Desk */}
      <Box sx={{ 
        mb: 4, 
        p: 2.5, 
        bgcolor: '#ffffff', 
        borderRadius: 3, 
        border: '1px solid #e2e8f0', 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2, 
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 1, color: 'text.secondary' }}>
          Quick Tasks Shortcut:
        </Typography>
        <Button variant="outlined" color="primary" startIcon={<AltRouteIcon />} onClick={() => navigate('/trips')}>
          Formulate New Trip
        </Button>
        <Button variant="outlined" color="secondary" startIcon={<LocalGasStationIcon />} onClick={() => navigate('/diesels')}>
          Log Fuel Refuel
        </Button>
        <Button variant="outlined" color="warning" startIcon={<TrendingDownIcon />} onClick={() => navigate('/expenses')}>
          Log Trip Expense
        </Button>
        <Button variant="outlined" color="info" startIcon={<LocalShippingIcon />} onClick={() => navigate('/vehicles')}>
          Register Vehicle
        </Button>
        <Button variant="outlined" color="success" startIcon={<PersonIcon />} onClick={() => navigate('/drivers')}>
          Register Driver
        </Button>
      </Box>

      {/* Metric Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cardItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ borderLeft: `6px solid ${item.color}` }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {item.value}
                  </Typography>
                </Box>
                <Box sx={{ color: item.color, opacity: 0.8 }}>
                  {item.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Block */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Monthly Income vs Expense */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 420 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Monthly Income vs Expenses
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Diesel Refuel Consumption */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 420 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Diesel Consumption (Liters)
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="dieselQty" name="Liters" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Pump Limits & Outstanding Balances */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Pump Outstanding & Available Limits (Real-time)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fuel Pump Station</TableCell>
                    <TableCell align="right">Pump Limit</TableCell>
                    <TableCell align="right">Diesel Consumed</TableCell>
                    <TableCell align="right">Remaining Available Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.pumpStats && stats.pumpStats.map((row) => {
                    const limitVal = parseFloat(row.limit);
                    const remainingVal = parseFloat(row.remaining);
                    const pct = limitVal > 0 ? (remainingVal / limitVal) * 100 : 0;
                    
                    let balanceColor = 'success.main';
                    if (remainingVal <= 0) {
                      balanceColor = 'error.main';
                    } else if (pct < 20) {
                      balanceColor = 'warning.main';
                    }
                    
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{limitVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary' }}>₹{parseFloat(row.consumed).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right" sx={{ color: balanceColor, fontWeight: 700 }}>
                          ₹{remainingVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!stats.pumpStats || stats.pumpStats.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No active pump registries found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Performing Trucks */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Top Performing Vehicles (Net Profit)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vehicle Number</TableCell>
                    <TableCell align="right">Trip Revenues</TableCell>
                    <TableCell align="right">Fuel/Misc Costs</TableCell>
                    <TableCell align="right">Net Profit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performance.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.vehicleNumber}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>₹{row.income.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>₹{row.expense.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>₹{row.profit.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
