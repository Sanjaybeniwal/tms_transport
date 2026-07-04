import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
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
  Button,
  Avatar,
  LinearProgress,
  Chip
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
  const { user } = useContext(AuthContext);
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

  if (!stats) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6" sx={{ fontWeight: 700 }}>
          Failed to load dashboard statistics.
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          This could be due to a connection timeout or an invalid session.
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry Loading
        </Button>
      </Box>
    );
  }

  const { cards, monthlyTrends, performance = [] } = stats;

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
      {/* Welcome Banner / Header */}
      <Card
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: 3,
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          border: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 }, '&:last-child': { pb: { xs: 3, sm: 4 } } }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name || 'Administrator'}
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 500 }}>
            Here is your real-time fleet operations overview, active trip logs, and diesel station balances.
          </Typography>
        </CardContent>
      </Card>

      {/* Operations Control Desk */}
      <Card sx={{ mb: 4, border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.5, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
            ⚡ Dispatch & Fleet Control Desk
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ p: 2, border: '1px dashed #e2e8f0', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Trip & Transit Operations
                </Typography>
                <Button variant="contained" color="primary" fullWidth startIcon={<AltRouteIcon />} onClick={() => navigate('/admin/trips')} sx={{ py: 1, fontWeight: 700 }}>
                  Formulate New Trip
                </Button>
                <Button variant="outlined" color="error" fullWidth startIcon={<TrendingDownIcon />} onClick={() => navigate('/admin/expenses')} sx={{ py: 1, fontWeight: 700 }}>
                  Log Trip Expense
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ p: 2, border: '1px dashed #e2e8f0', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Fuel Dues & Payments
                </Typography>
                <Button variant="contained" color="warning" fullWidth startIcon={<LocalGasStationIcon />} onClick={() => navigate('/admin/diesels')} sx={{ py: 1, color: '#ffffff', fontWeight: 700 }}>
                  Log Fuel Refuel
                </Button>
                <Button variant="outlined" color="primary" fullWidth startIcon={<AccountBalanceWalletIcon />} onClick={() => navigate('/admin/pump-payments')} sx={{ py: 1, fontWeight: 700 }}>
                  Settle Pump Payment
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ p: 2, border: '1px dashed #e2e8f0', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Fleet Registry Setup
                </Typography>
                <Button variant="outlined" color="info" fullWidth startIcon={<LocalShippingIcon />} onClick={() => navigate('/admin/vehicles')} sx={{ py: 1, fontWeight: 700 }}>
                  Register Vehicle
                </Button>
                <Button variant="outlined" color="success" fullWidth startIcon={<PersonIcon />} onClick={() => navigate('/admin/drivers')} sx={{ py: 1, fontWeight: 700 }}>
                  Register Driver
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Metric Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cardItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ 
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '6px',
                height: '100%',
                backgroundColor: item.color
              },
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 20px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03)'
              }
            }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mt: 0.5 }}>
                    {item.value}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: `${item.color}15`, 
                  color: item.color,
                  width: 56,
                  height: 56
                }}>
                  {item.icon}
                </Avatar>
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
                    
                    let balanceColor = '#10b981';
                    let progressColor = '#10b981';
                    if (remainingVal <= 0) {
                      balanceColor = '#ef4444';
                      progressColor = '#ef4444';
                    } else if (pct < 20) {
                      balanceColor = '#f59e0b';
                      progressColor = '#f59e0b';
                    } else if (pct < 40) {
                      balanceColor = '#3b82f6';
                      progressColor = '#3b82f6';
                    }
                    
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{limitVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>₹{parseFloat(row.consumed).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                            <Typography sx={{ color: balanceColor, fontWeight: 800, fontSize: '0.95rem' }}>
                              ₹{remainingVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Typography>
                            <Box sx={{ width: 140, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min(100, Math.max(0, pct))} 
                                sx={{ 
                                  width: '100%', 
                                  height: 6, 
                                  borderRadius: 3, 
                                  bgcolor: '#f1f5f9',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: progressColor,
                                    borderRadius: 3
                                  }
                                }} 
                              />
                              <Typography variant="caption" sx={{ color: balanceColor, fontWeight: 700, minWidth: 28 }}>
                                {Math.round(pct)}%
                              </Typography>
                            </Box>
                          </Box>
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
                  {performance.map((row, index) => {
                    const isProfitable = row.profit > 0;
                    return (
                      <TableRow key={index} hover>
                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                          🚚 {row.vehicleNumber}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#10b981', fontWeight: 600 }}>
                          ₹{parseFloat(row.income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#ef4444' }}>
                          ₹{parseFloat(row.expense || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`₹${parseFloat(row.profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                            size="small"
                            sx={{
                              bgcolor: isProfitable ? '#d1fae5' : '#f1f5f9',
                              color: isProfitable ? '#065f46' : '#475569',
                              fontWeight: 800,
                              borderRadius: '6px',
                              border: isProfitable ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
