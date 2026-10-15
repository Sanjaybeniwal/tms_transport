import React, { useState, useContext, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, Badge, Menu, MenuItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Tooltip, useMediaQuery, useTheme, Button } from '@mui/material';
import MenuRounded from '@mui/icons-material/MenuRounded';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import PeopleOutlineRounded from '@mui/icons-material/PeopleOutlineRounded';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import LocalGasStationOutlined from '@mui/icons-material/LocalGasStationOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import BarChartOutlined from '@mui/icons-material/BarChartOutlined';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import LockOutlined from '@mui/icons-material/LockOutlined';
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded';
import RouteOutlined from '@mui/icons-material/RouteOutlined';
import WebOutlined from '@mui/icons-material/WebOutlined';
import CurrencyRupeeRounded from '@mui/icons-material/CurrencyRupeeRounded';
import { AuthContext } from '../context/AuthContext';
import { formatDate } from '../utils/dateFormatter';
import API from '../services/api';
const drawerWidth = 244;
const groups = [['TRANSPORT ACCOUNTING', [['accounting/dashboard', 'Accounting Overview', AccountBalanceOutlined], ['accounting/own-vehicles', 'Owned Vehicle Accounts', LocalShippingOutlined], ['accounting/brokerage', 'Market Vehicle Accounts', PaymentsOutlined], ['accounting/reports', 'Accounts & Reports', BarChartOutlined]]], ['WORKSPACE', [['', 'Dashboard', DashboardOutlined], ['trips', 'Trip register', RouteOutlined], ['diesels', 'Diesel entries', LocalGasStationOutlined], ['expenses', 'Trip & vehicle expenses', ReceiptLongOutlined]]], ['PAYMENTS & LEDGERS', [['income-logs', 'Freight collections', CurrencyRupeeRounded], ['driver-advances', 'Driver advances', PersonOutlineRounded], ['pump-payments', 'Pump payments', PaymentsOutlined], ['ledgers/pumps', 'Pump Ledger', AccountBalanceOutlined], ['ledgers/parties', 'Company Ledger', BusinessOutlined], ['ledgers/drivers', 'Driver Ledger', PersonOutlineRounded], ['ledgers/vehicles', 'Vehicle Ledger', LocalShippingOutlined], ['ledgers/owners', 'Owner Ledger', PeopleOutlineRounded], ['reports', 'Reports', BarChartOutlined]]], ['FLEET & CONTACTS', [['vehicles', 'Vehicles', LocalShippingOutlined], ['drivers', 'Drivers', PersonOutlineRounded], ['owners', 'Vehicle owners', PeopleOutlineRounded], ['parties', 'Customers / parties', BusinessOutlined], ['pumps', 'Diesel pumps', LocalGasStationOutlined], ['locations', 'Locations', PlaceOutlined], ['expense-heads', 'Expense categories', ReceiptLongOutlined]]], ['WEBSITE', [['pages-manager', 'Website pages', WebOutlined], ['enquiries', 'Customer enquiries', MailOutlineRounded]]]];
const Layout = () => {
  const {
    user,
    logout
  } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userAnchor, setUserAnchor] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [enquiryCount, setEnquiryCount] = useState(0);
  const [alertError, setAlertError] = useState(false);
  useEffect(() => {
    if (!user) return;
    let active = true;
    const fetchAlerts = async () => {
      const results = await Promise.allSettled([API.vehicles.alerts(), API.drivers.alerts(), API.enquiries.list({
        status: 'New'
      })]);
      if (!active) return;
      const [vehicles, drivers, enquiries] = results;
      setAlertError(vehicles.status === 'rejected' || drivers.status === 'rejected');
      if (vehicles.status === 'fulfilled' && drivers.status === 'fulfilled') {
        setAlerts([...vehicles.value.data.data.flatMap(v => v.issues.map(issue => ({
          id: `v-${v.id}-${issue.type}`,
          text: `${v.vehicleNumber}: ${issue.type} ${issue.expired ? 'expired' : 'expires'} on ${formatDate(issue.date)}`,
          expired: issue.expired,
          path: 'vehicles'
        }))), ...drivers.value.data.data.map(d => ({
          id: `d-${d.id}`,
          text: `${d.name}: driving licence ${d.expired ? 'expired' : 'expires'} on ${formatDate(d.licenseExpiry)}`,
          expired: d.expired,
          path: 'drivers'
        }))]);
      }
      if (enquiries.status === 'fulfilled') setEnquiryCount(enquiries.value.data.data.length);
    };
    fetchAlerts();
    window.addEventListener('enquiryUpdate', fetchAlerts);
    const interval = setInterval(fetchAlerts, 30000);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('enquiryUpdate', fetchAlerts);
    };
  }, [user]);
  const go = path => {
    navigate(`/admin${path ? '/' + path : ''}`);
    setMobileOpen(false);
  };
  const title = groups.flatMap(([, items]) => items).find(([path]) => location.pathname.replace(/\/$/, '') === `/admin${path ? '/' + path : ''}`)?.[1] || 'My account';
  const sidebar = <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%'
  }}>
    <Box sx={{
      p: 2.5,
      pb: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1.3
    }}><Box sx={{
        bgcolor: '#efba75',
        color: '#183b3b',
        borderRadius: 2,
        width: 38,
        height: 38,
        display: 'grid',
        placeItems: 'center'
      }}><LocalShippingOutlined /></Box><Box><Typography fontWeight={750} fontSize={17} color="white">BUTS Express</Typography><Typography sx={{
          fontSize: 10,
          color: '#9eb9b9',
          letterSpacing: 1
        }}>TRANSPORT MANAGEMENT</Typography></Box></Box>
    <Box sx={{
      mx: 2,
      mb: 1,
      px: 1.5,
      py: 1.2,
      borderRadius: 2,
      bgcolor: '#ffffff07',
      border: '1px solid #ffffff0e'
    }}><Typography fontSize={11} color="#b8cdca">Bombay Uttaranchal</Typography><Typography fontSize={12} color="#e5eeeb" fontWeight={600}>Tempo Service</Typography></Box>
    {groups.filter(([name]) => name !== 'TRANSPORT ACCOUNTING' || ['Super Admin', 'Admin', 'Manager', 'Accountant'].includes(user?.role)).map(([name, items]) => <Box key={name} sx={{
      px: 1.5,
      pt: 2
    }}><Typography sx={{
        px: 1.3,
        pb: 1,
        color: '#91aead',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 1.5
      }}>{name}</Typography><List disablePadding>{items.map(([path, label, Icon]) => {
          const selected = location.pathname.replace(/\/$/, '') === `/admin${path ? '/' + path : ''}`;
          return <ListItemButton key={path} selected={selected} onClick={() => go(path)} sx={{
            minHeight: 40,
            py: .6,
            px: 1.3,
            mb: .3,
            borderRadius: 1.5,
            color: '#c7d7d5',
            '&:hover': {
              bgcolor: '#ffffff0c',
              color: 'white'
            },
            '&.Mui-selected': {
              bgcolor: '#d5e9de',
              color: '#163f37',
              '&:hover': {
                bgcolor: '#c6dfd2'
              }
            }
          }}><ListItemIcon sx={{
              color: 'inherit',
              minWidth: 31
            }}><Icon sx={{
                fontSize: 19
              }} /></ListItemIcon><ListItemText primary={label} primaryTypographyProps={{
              fontSize: 13,
              fontWeight: selected ? 700 : 450
            }} />{path === 'enquiries' && enquiryCount > 0 && <Badge badgeContent={enquiryCount} color="warning" sx={{
              mr: 1
            }} />}</ListItemButton>;
        })}</List></Box>)}
    <Box sx={{
      mt: 'auto',
      p: 2.5
    }}><Divider sx={{
        borderColor: '#ffffff16',
        mb: 2
      }} /><Typography fontSize={11} color="#a3bebb">हर सफ़र का भरोसेमंद साथी</Typography><Typography fontSize={10} color="#799b98" mt={.5}>Your everyday transport companion</Typography></Box>
  </Box>;
  return <Box sx={{
    display: 'flex',
    minHeight: '100vh'
  }}>
    <Drawer variant={mobile ? 'temporary' : 'permanent'} open={mobile ? mobileOpen : true} onClose={() => setMobileOpen(false)} sx={{
      width: mobile ? 0 : drawerWidth,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: drawerWidth,
        boxSizing: 'border-box',
        bgcolor: '#163738',
        border: 0
      }
    }}>{sidebar}</Drawer>
    <Box sx={{
      flexGrow: 1,
      minWidth: 0
    }}>
      <AppBar position="sticky" sx={{
        bgcolor: '#ffffffed',
        backdropFilter: 'blur(12px)'
      }}><Toolbar sx={{
          minHeight: '72px !important',
          px: {
            xs: 2,
            md: 4
          },
          gap: 1
        }}>
        {mobile && <IconButton aria-label="Open navigation" onClick={() => setMobileOpen(true)} edge="start"><MenuRounded /></IconButton>}
        <Box sx={{
            flexGrow: 1
          }}><Typography fontSize={14} fontWeight={650}>{title}</Typography><Typography fontSize={11} color="text.secondary" sx={{
              display: {
                xs: 'none',
                sm: 'block'
              }
            }}>Office workspace / {title}</Typography></Box>
        <Tooltip title="Customer enquiries"><IconButton aria-label="Customer enquiries" onClick={() => go('enquiries')}><Badge badgeContent={enquiryCount} color="warning"><MailOutlineRounded sx={{
                  fontSize: 21
                }} /></Badge></IconButton></Tooltip>
        <Tooltip title="Document expiry alerts"><IconButton aria-label="Document expiry alerts" onClick={e => setNotificationAnchor(e.currentTarget)}><Badge badgeContent={alerts.length} color="error"><NotificationsOutlined sx={{
                  fontSize: 22
                }} /></Badge></IconButton></Tooltip>
        <Divider orientation="vertical" flexItem sx={{
            my: 2,
            mx: 1
          }} />
        <Button onClick={e => setUserAnchor(e.currentTarget)} aria-label="Open account menu" sx={{
            color: 'text.primary',
            textAlign: 'left',
            p: .5,
            gap: 1
          }}><Avatar sx={{
              bgcolor: '#e6eee9',
              color: '#2a6250',
              width: 34,
              height: 34,
              fontSize: 12
            }}>{user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('')}</Avatar><Box sx={{
              display: {
                xs: 'none',
                sm: 'block'
              }
            }}><Typography fontSize={12} fontWeight={650}>{user?.name}</Typography><Typography fontSize={10} color="text.secondary">{user?.role}</Typography></Box></Button>
      </Toolbar></AppBar>
      <Menu anchorEl={notificationAnchor} open={Boolean(notificationAnchor)} onClose={() => setNotificationAnchor(null)} PaperProps={{
        sx: {
          width: 350,
          maxWidth: '90vw',
          maxHeight: 420
        }
      }}><Typography fontSize={14} fontWeight={700} sx={{
          px: 2,
          py: 1
        }}>Document renewal reminders</Typography><Divider />{alertError ? <MenuItem disabled sx={{
          whiteSpace: 'normal'
        }}>Could not check document renewals. Please try again later.</MenuItem> : alerts.length ? alerts.map(alert => <MenuItem key={alert.id} onClick={() => {
          setNotificationAnchor(null);
          go(alert.path);
        }} sx={{
          whiteSpace: 'normal',
          gap: 1
        }}><WarningAmberRounded color={alert.expired ? 'error' : 'warning'} /><Typography fontSize={12}>{alert.text}</Typography></MenuItem>) : <MenuItem disabled>No document renewals due.</MenuItem>}</Menu>
      <Menu anchorEl={userAnchor} open={Boolean(userAnchor)} onClose={() => setUserAnchor(null)}>{[['profile', 'My profile', PersonOutlineRounded], ['change-password', 'Change password', LockOutlined]].map(([path, label, Icon]) => <MenuItem key={path} onClick={() => {
          setUserAnchor(null);
          go(path);
        }}><ListItemIcon><Icon fontSize="small" /></ListItemIcon>{label}</MenuItem>)}<Divider /><MenuItem onClick={() => {
          logout();
          navigate('/buts/login');
        }}><ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>Log out</MenuItem></Menu>
      <Box component="main" sx={{
        p: {
          xs: 2,
          md: 3,
          xl: 4
        },
        minWidth: 0
      }}><Outlet /></Box>
    </Box>
  </Box>;
};
export default Layout;
