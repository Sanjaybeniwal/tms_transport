import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Paper, Button, Chip, Stack, Skeleton, Alert, Table, TableHead, TableBody, TableCell, TableRow, TableContainer, LinearProgress, IconButton, Tooltip as MuiTooltip } from '@mui/material';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import RouteOutlined from '@mui/icons-material/RouteOutlined';
import LocalGasStationOutlined from '@mui/icons-material/LocalGasStationOutlined';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import CurrencyRupeeRounded from '@mui/icons-material/CurrencyRupeeRounded';
import PeopleOutlineRounded from '@mui/icons-material/PeopleOutlineRounded';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { formatINR, formatNumber, formatCompactINR, indiaToday } from '../utils/indiaFormat';
const panel = {
  p: {
    xs: 2,
    md: 3
  },
  border: '1px solid #e2e8e8',
  borderRadius: '14px',
  boxShadow: '0 2px 8px #183b4203'
};
const Dashboard = () => {
  const {
    user
  } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setRefreshing(true);
    setError(false);
    try {
      const res = await API.dashboard.getStats();
      setStats(res.data.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const go = path => navigate(`/admin/${path}`);
  const actions = [['trips', 'Trip register', 'ट्रिप बुक', RouteOutlined, '#0e766e'], ['diesels', 'Diesel entries', 'डीज़ल', LocalGasStationOutlined, '#b76b17'], ['expenses', 'Add expenses', 'खर्चा', ReceiptLongOutlined, '#7860ab'], ['driver-advances', 'Driver advances', 'ड्राइवर एडवांस', AccountBalanceWalletOutlined, '#3a6fa0'], ['income-logs', 'Freight collections', 'भाड़ा वसूली', CurrencyRupeeRounded, '#16815b'], ['pump-payments', 'Pump payments', 'पंप भुगतान', LocalGasStationOutlined, '#a65c37']];
  const cards = stats?.cards || {};
  const metrics = [['Money received', 'Freight collections · all time', cards.totalIncome, TrendingUpRounded, '#0e766e', 'income-logs'], ['Total expenses', 'Diesel + other expenses · all time', cards.totalExpenses, ReceiptLongOutlined, '#bc681d', 'expenses'], ['Pump dues', 'Balance payable · all time', cards.outstandingAmount, AccountBalanceWalletOutlined, '#b24b50', 'ledgers/pumps'], ['Diesel expenses', 'Included in total expenses', cards.totalDieselExpense, LocalGasStationOutlined, '#566d9d', 'diesels']];
  const chartData = stats?.monthlyTrends || [];
  return <Box sx={{
    maxWidth: 1540,
    mx: 'auto'
  }}>
    <Stack direction={{
      xs: 'column',
      sm: 'row'
    }} justifyContent="space-between" alignItems={{
      xs: 'flex-start',
      sm: 'center'
    }} spacing={2} mb={3}>
      <Box><Typography variant="overline" sx={{
          color: 'primary.main',
          fontWeight: 700,
          letterSpacing: 1.8
        }}>YOUR TRANSPORT DESK</Typography>
        <Typography component="h1" sx={{
          fontSize: {
            xs: 26,
            md: 31
          },
          fontWeight: 750,
          letterSpacing: '-1px'
        }}>Namaste, {user?.name?.split(' ')[0] || 'welcome'} <Box component="span" sx={{
            color: '#bd731e'
          }}>नमस्ते</Box></Typography>
        <Typography color="text.secondary" sx={{
          mt: .6,
          fontSize: 14
        }}>Your trips, collections and daily accounts. All in one place.</Typography></Box>
      <Stack direction="row" spacing={1} alignItems="center"><Chip icon={<CalendarTodayOutlined sx={{
          fontSize: '16px !important'
        }} />} label={`${indiaToday()} · IST`} variant="outlined" sx={{
          bgcolor: 'white',
          height: 38
        }} /><MuiTooltip title="Refresh dashboard"><IconButton aria-label="Refresh dashboard" disabled={refreshing} onClick={load} sx={{
            bgcolor: 'white',
            border: '1px solid #dce4e6'
          }}><RefreshRounded /></IconButton></MuiTooltip></Stack>
    </Stack>
    <Paper sx={{
      ...panel,
      mb: 3,
      background: '#153d40',
      color: 'white',
      border: 0,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Stack direction={{
        xs: 'column',
        sm: 'row'
      }} spacing={2} alignItems={{
        xs: 'flex-start',
        sm: 'center'
      }} justifyContent="space-between">
        <Box><Chip size="small" label="DAILY OPERATIONS" sx={{
            bgcolor: '#ffffff13',
            color: '#b9e3d9',
            fontSize: 10,
            letterSpacing: 1.5,
            mb: 1
          }} /><Typography variant="h5" sx={{
            fontWeight: 650
          }}>A smoother day, from loading to delivery.</Typography><Typography sx={{
            fontSize: 13,
            color: '#c5d9d7',
            mt: 1
          }}>Open the trip register to book a trip or update a delivery.</Typography></Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => go('trips')} sx={{
          bgcolor: '#f2bb6b',
          color: '#243534',
          flexShrink: 0,
          '&:hover': {
            bgcolor: '#f9cc8b'
          }
        }}>Open trip register</Button>
      </Stack>
    </Paper>
    <Typography variant="h6" mb={1.5}>Daily shortcuts <Box component="span" sx={{
        fontSize: 13,
        color: 'text.secondary',
        fontWeight: 400,
        ml: 1
      }}>रोज़ का काम</Box></Typography>
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: 'repeat(2, 1fr)',
        sm: 'repeat(3, 1fr)',
        lg: 'repeat(6, 1fr)'
      },
      gap: 1.5,
      mb: 3.5
    }}>
      {actions.map(([path, title, hindi, Icon, color]) => <Button key={path} onClick={() => go(path)} sx={{
        bgcolor: 'white',
        border: '1px solid #e0e7e7',
        p: 2,
        color: 'text.primary',
        alignItems: 'flex-start',
        flexDirection: 'column',
        textAlign: 'left',
        '&:hover': {
          bgcolor: '#f1f8f5',
          borderColor: '#a1c8bb'
        }
      }}><Box sx={{
          color,
          mb: 1
        }}><Icon /></Box><Typography fontSize={13} fontWeight={650}>{title}</Typography><Typography fontSize={12} color="text.secondary" mt={.4}>{hindi}</Typography></Button>)}
    </Box>
    {error && <Alert severity="error" action={<Button color="inherit" onClick={load} disabled={refreshing}>Try again</Button>} sx={{
      mb: 3
    }}>{stats ? 'Could not refresh. The last loaded figures are shown.' : 'Could not load your accounts. Please try again.'}</Alert>}
    {loading ? <Grid container spacing={2} mb={3}>{[0, 1, 2, 3].map(i => <Grid item xs={12} sm={6} lg={3} key={i}><Skeleton variant="rounded" height={145} /></Grid>)}</Grid> : stats && <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}><Typography variant="h6">Business overview</Typography><Chip label="All-time totals" size="small" variant="outlined" /></Stack>
      <Grid container spacing={2} mb={3}>
        {metrics.map(([title, description, value, Icon, color, path]) => <Grid item xs={12} sm={6} lg={3} key={title}><Paper sx={{
            ...panel,
            height: '100%'
          }}><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography color="text.secondary" fontSize={13} fontWeight={600}>{title}</Typography><Icon sx={{
                color,
                fontSize: 22
              }} /></Stack><Typography sx={{
              fontSize: {
                xs: 26,
                md: 29
              },
              fontWeight: 750,
              mt: 1.3,
              letterSpacing: '-.7px',
              fontVariantNumeric: 'tabular-nums'
            }}>{formatINR(value)}</Typography><Typography fontSize={11} color="text.secondary" mt={.4}>{description}</Typography><Button size="small" onClick={() => go(path)} endIcon={<ArrowForwardRounded sx={{
              fontSize: '14px !important'
            }} />} sx={{
              px: 0,
              mt: 1,
              fontSize: 11
            }}>View details</Button></Paper></Grid>)}
      </Grid>
      <Paper sx={{
        ...panel,
        mb: 3,
        py: 2
      }}><Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            md: 'repeat(5, 1fr)'
          },
          gap: 2
        }}>{[['Vehicles', cards.totalVehicles, LocalShippingOutlined, 'vehicles'], ['Trips booked', cards.totalTrips, RouteOutlined, 'trips'], ['Drivers', cards.totalDrivers, PersonOutlineRounded, 'drivers'], ['Vehicle owners', cards.totalOwners, PeopleOutlineRounded, 'owners'], ['Diesel pumps', cards.totalPumps, LocalGasStationOutlined, 'pumps']].map(([title, value, Icon, path]) => <Button key={title} onClick={() => go(path)} sx={{
            justifyContent: 'flex-start',
            gap: 1.5,
            color: 'text.primary'
          }}><Icon sx={{
              color: '#77918b',
              fontSize: 24
            }} /><Box textAlign="left"><Typography fontWeight={750} fontSize={21}>{formatNumber(value)}</Typography><Typography fontSize={12} color="text.secondary">{title}</Typography></Box></Button>)}</Box></Paper>
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={8}><Paper sx={{
            ...panel,
            height: 360
          }}><Stack direction="row" justifyContent="space-between" mb={.5}><Typography variant="h6">Collections & expenses</Typography><Chip label="Last 6 months" size="small" sx={{
                bgcolor: '#f0f5f3',
                fontSize: 11
              }} /></Stack><Typography fontSize={12} color="text.secondary" mb={2}>Compare money received with diesel and other costs.</Typography><Box sx={{
              height: 245,
              width: '100%',
              minWidth: 0
            }}><ResponsiveContainer><BarChart data={chartData} barGap={5}><CartesianGrid vertical={false} stroke="#edf1f1" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{
                    fontSize: 11
                  }} /><YAxis tickFormatter={formatCompactINR} axisLine={false} tickLine={false} tick={{
                    fontSize: 11
                  }} width={65} /><Tooltip formatter={value => formatINR(value)} contentStyle={{
                    borderRadius: 12,
                    borderColor: '#e2e8e8'
                  }} /><Legend iconType="circle" wrapperStyle={{
                    fontSize: 12,
                    paddingTop: 15
                  }} /><Bar dataKey="income" name="Collections" fill="#197e70" radius={[4, 4, 0, 0]} maxBarSize={24} /><Bar dataKey="expense" name="Expenses" fill="#e8b36c" radius={[4, 4, 0, 0]} maxBarSize={24} /></BarChart></ResponsiveContainer></Box></Paper></Grid>
        <Grid item xs={12} md={4}><Paper sx={{
            ...panel,
            height: 360
          }}><Typography variant="h6">Diesel usage</Typography><Typography fontSize={12} color="text.secondary" mt={.5}>Litres filled · last 6 months</Typography><Typography variant="h2" mt={2} fontWeight={700}>{formatNumber(chartData.reduce((sum, row) => sum + (Number(row.dieselQty) || 0), 0))}<Box component="span" sx={{
                fontSize: 14,
                fontWeight: 400,
                color: 'text.secondary',
                ml: 1
              }}>litres</Box></Typography><Box sx={{
              height: 187,
              mt: 2
            }}><ResponsiveContainer><AreaChart data={chartData}><defs><linearGradient id="dieselFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d89a41" stopOpacity={.25} /><stop offset="100%" stopColor="#d89a41" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1f1" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{
                    fontSize: 10
                  }} /><Tooltip formatter={value => [`${formatNumber(value)} litres`, 'Diesel']} /><Area dataKey="dieselQty" type="monotone" stroke="#d69a48" fill="url(#dieselFill)" strokeWidth={2} /></AreaChart></ResponsiveContainer></Box></Paper></Grid>
      </Grid>
      <Paper sx={{
        ...panel,
        mb: 3
      }}><Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}><Box><Typography variant="h6">Diesel pump credit limits</Typography><Typography fontSize={12} color="text.secondary" mt={.5}>Allocated limit less recorded diesel purchases. For payment-adjusted dues, see pump khata.</Typography></Box><Button size="small" onClick={() => go('ledgers/pumps')} endIcon={<ArrowForwardRounded />}>Pump khata</Button></Stack><TableContainer><Table sx={{
            minWidth: 600
          }}><TableHead><TableRow><TableCell>Pump name</TableCell><TableCell align="right">Credit limit</TableCell><TableCell align="right">Diesel purchases</TableCell><TableCell align="right">Unused limit</TableCell></TableRow></TableHead><TableBody>{(stats.pumpStats || []).map(row => {
                const remaining = Number(row.remaining) || 0;
                const limit = Number(row.limit) || 0;
                const percent = limit > 0 ? Math.max(0, Math.min(100, remaining / limit * 100)) : 0;
                return <TableRow key={row.id} hover><TableCell sx={{
                    fontWeight: 650
                  }}>{row.name}</TableCell><TableCell align="right">{formatINR(row.limit)}</TableCell><TableCell align="right">{formatINR(row.consumed)}</TableCell><TableCell align="right"><Typography fontSize={13} fontWeight={650} color={remaining <= 0 ? 'error.main' : 'primary.main'}>{formatINR(remaining)}</Typography><LinearProgress aria-label={`${row.name} unused limit`} variant="determinate" value={percent} color={remaining <= 0 ? 'error' : 'primary'} sx={{
                      width: 100,
                      ml: 'auto',
                      mt: .7,
                      height: 4,
                      borderRadius: 2
                    }} /></TableCell></TableRow>;
              })}{!stats.pumpStats?.length && <TableRow><TableCell colSpan={4} sx={{
                  py: 4,
                  textAlign: 'center'
                }}>No pumps added yet. <Button onClick={() => go('pumps')}>Add a diesel pump</Button></TableCell></TableRow>}</TableBody></Table></TableContainer></Paper>
      <Paper sx={panel}><Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}><Box><Typography variant="h6">Vehicle accounts at a glance</Typography><Typography fontSize={12} color="text.secondary" mt={.5}>Collections less diesel and expenses · sample of up to 5 vehicles</Typography></Box><Button onClick={() => go('reports')} size="small" endIcon={<ArrowForwardRounded />}>Reports</Button></Stack><TableContainer><Table sx={{
            minWidth: 540
          }}><TableHead><TableRow><TableCell>Vehicle number</TableCell><TableCell align="right">Collections</TableCell><TableCell align="right">Expenses</TableCell><TableCell align="right">Balance</TableCell></TableRow></TableHead><TableBody>{(stats.performance || []).map(row => <TableRow hover key={row.vehicleNumber}><TableCell sx={{
                  fontWeight: 650
                }}>{row.vehicleNumber}</TableCell><TableCell align="right">{formatINR(row.income)}</TableCell><TableCell align="right">{formatINR(row.expense)}</TableCell><TableCell align="right"><Chip size="small" label={formatINR(row.profit)} sx={{
                    bgcolor: Number(row.profit) >= 0 ? '#eaf5ef' : '#fff0ee',
                    color: Number(row.profit) >= 0 ? '#1b795b' : '#ae4545',
                    fontWeight: 700
                  }} /></TableCell></TableRow>)}{!stats.performance?.length && <TableRow><TableCell colSpan={4} align="center" sx={{
                  py: 4
                }}>Your vehicle accounts will appear here after vehicles are added.</TableCell></TableRow>}</TableBody></Table></TableContainer></Paper>
    </>}
    <Typography fontSize={11} color="text.secondary" textAlign="center" mt={3}>BUTS Express · Amounts in Indian Rupees (₹) · Dates in Indian Standard Time</Typography>
  </Box>;
};
export default Dashboard;
