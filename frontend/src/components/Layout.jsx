import React, { useState, useContext, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Tooltip,
  ListSubheader
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningIcon from '@mui/icons-material/Warning';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MailIcon from '@mui/icons-material/Mail';

import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const drawerWidth = 260;

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [open, setOpen] = useState(true);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  
  // Navigation Menu Sub-Collapses
  const [openFleet, setOpenFleet] = useState(false);
  const [openOps, setOpenOps] = useState(false);
  const [openLedgers, setOpenLedgers] = useState(false);

  // Expiry Warning Alerts & Unread Enquiries
  const [alerts, setAlerts] = useState([]);
  const [enquiryCount, setEnquiryCount] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [vRes, dRes] = await Promise.all([
          API.vehicles.alerts(),
          API.drivers.alerts()
        ]);
        const vehicleAlerts = vRes.data.data.flatMap(v => 
          v.issues.map(issue => ({
            id: `v-${v.id}-${issue.type}`,
            text: `${v.vehicleNumber}: ${issue.type} expires on ${issue.date} ${issue.expired ? '(EXPIRED)' : ''}`,
            expired: issue.expired
          }))
        );
        const driverAlerts = dRes.data.data.map(d => ({
          id: `d-${d.id}`,
          text: `Driver ${d.name}: License expires on ${d.licenseExpiry} ${d.expired ? '(EXPIRED)' : ''}`,
          expired: d.expired
        }));
        setAlerts([...vehicleAlerts, ...driverAlerts]);
      } catch (err) {
        console.error('Error fetching expiry warnings:', err);
      }
    };

    const fetchEnquiryCount = async () => {
      try {
        const response = await API.enquiries.list({ status: 'New' });
        setEnquiryCount(response.data.data.length);
      } catch (err) {
        console.error('Error fetching unread enquiries count:', err);
      }
    };

    if (user) {
      fetchAlerts();
      fetchEnquiryCount();

      // Poll every 30 seconds for live updates
      const interval = setInterval(() => {
        fetchAlerts();
        fetchEnquiryCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleToggleDrawer = () => {
    setOpen(!open);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotifMenu = (event) => {
    setAnchorElNotif(event.currentTarget);
  };

  const handleCloseNotifMenu = () => {
    setAnchorElNotif(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/buts/login');
  };

  const handleNav = (path) => {
    navigate('/admin' + path);
  };

  const menuActive = (path) => location.pathname === '/admin' + path || location.pathname === '/admin' && path === '/';

  const getSidebarItemStyles = (path, extraActiveCheck = false) => {
    const active = extraActiveCheck || menuActive(path);
    return {
      borderRadius: '8px',
      mb: 0.5,
      py: 1,
      color: active ? '#ffffff' : '#94a3b8',
      '& .MuiListItemIcon-root': {
        color: active ? '#ffffff' : '#64748b',
        minWidth: 40
      },
      '&.Mui-selected': {
        background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
        color: '#ffffff',
        '& .MuiListItemIcon-root': { color: '#ffffff' },
        '&:hover': { background: 'linear-gradient(90deg, #1d4ed8 0%, #1e40af 100%)' }
      },
      '&:hover': {
        bgcolor: 'rgba(255, 255, 255, 0.05)',
        color: '#ffffff',
        '& .MuiListItemIcon-root': { color: '#ffffff' }
      }
    };
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleToggleDrawer}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
             <Box 
              component={Link} 
              to="/admin" 
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
             >
                <img src="/logo.png" alt="BUTS Logo" style={{ height: '85px', marginTop: '-20px', marginBottom: '-20px', objectFit: 'contain' }} />
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                  BUTS Express
                </Typography>
             </Box>
            </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Enquiries Mail icon */}
            <IconButton 
              color="inherit" 
              component={Link} 
              to="/admin/enquiries" 
              title="Enquiry Manager"
            >
              <Badge badgeContent={enquiryCount} color="error">
                <MailIcon />
              </Badge>
            </IconButton>

            {/* Expiry Notifications bell */}
            <IconButton color="inherit" onClick={handleOpenNotifMenu}>
              <Badge badgeContent={alerts.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <Menu
              anchorEl={anchorElNotif}
              open={Boolean(anchorElNotif)}
              onClose={handleCloseNotifMenu}
              PaperProps={{ style: { maxHeight: 400, width: '320px' } }}
            >
              <MenuItem disabled>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Document Expiry Alerts</Typography>
              </MenuItem>
              <Divider />
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <MenuItem key={alert.id} onClick={handleCloseNotifMenu} sx={{ whiteSpace: 'normal' }}>
                    <ListItemIcon>
                      <WarningIcon color={alert.expired ? "error" : "warning"} fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2" color={alert.expired ? "error.main" : "text.secondary"}>
                      {alert.text}
                    </Typography>
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  <Typography variant="body2">No active warnings.</Typography>
                </MenuItem>
              )}
            </Menu>

            {/* Profile trigger */}
            <Tooltip title="Account settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 1 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', fontSize: '0.875rem' }}>
                  {user?.name?.substring(0, 2).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="subtitle2">{user?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/admin/profile'); }}>
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                Profile & Settings
              </MenuItem>
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/admin/change-password'); }}>
                <ListItemIcon><LockOpenIcon fontSize="small" /></ListItemIcon>
                Change Password
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 70,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 70,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: 'width 0.2s ease-in-out',
            mt: '64px',
            borderRight: '1px solid #1e293b',
            height: 'calc(100vh - 64px)',
            backgroundColor: '#0f172a',
            boxShadow: '2px 0 12px rgba(0, 0, 0, 0.2)',
            color: '#94a3b8'
          }
        }}
      >
        <List sx={{ px: 1.5, py: 2 }}>
          <ListItemButton 
            onClick={() => handleNav('/')} 
            selected={menuActive('/')}
            sx={getSidebarItemStyles('/')}
          >
            <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
            {open && <ListItemText primary="Dashboard" sx={{ '& .MuiTypography-root': { fontWeight: 700 } }} />}
          </ListItemButton>
        </List>
        <Divider sx={{ mx: 2, borderColor: '#1e293b' }} />

        <List
          sx={{ px: 1.5, py: 1.5 }}
          subheader={
            open && (
              <ListSubheader component="div" id="nested-list-subheader" sx={{ bgcolor: 'transparent', py: 1, px: 1.5, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                Fleet Registry
              </ListSubheader>
            )
          }
        >
          {/* Fleet masters group */}
          <ListItemButton 
            onClick={() => setOpenFleet(!openFleet)}
            sx={getSidebarItemStyles('/masters', openFleet)}
          >
            <ListItemIcon><LocalShippingIcon fontSize="small" /></ListItemIcon>
            {open && <ListItemText primary="Master Registers" sx={{ '& .MuiTypography-root': { fontWeight: 600 } }} />}
            {open && (openFleet ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
          </ListItemButton>
          <Collapse in={openFleet && open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton 
                onClick={() => handleNav('/owners')} 
                selected={menuActive('/owners')}
                sx={{
                  ...getSidebarItemStyles('/owners'),
                  pl: 4
                }}
              >
                <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Vehicle Owners" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
              </ListItemButton>
              <ListItemButton 
                onClick={() => handleNav('/vehicles')} 
                selected={menuActive('/vehicles')}
                sx={{
                  ...getSidebarItemStyles('/vehicles'),
                  pl: 4
                }}
              >
                <ListItemIcon><LocalShippingIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Vehicles List" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
              </ListItemButton>
              <ListItemButton 
                onClick={() => handleNav('/drivers')} 
                selected={menuActive('/drivers')}
                sx={{
                  ...getSidebarItemStyles('/drivers'),
                  pl: 4
                }}
              >
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Drivers List" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
              </ListItemButton>
              <ListItemButton 
                onClick={() => handleNav('/locations')} 
                selected={menuActive('/locations')}
                sx={{
                  ...getSidebarItemStyles('/locations'),
                  pl: 4
                }}
              >
                <ListItemIcon><LocationOnIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Locations" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
              </ListItemButton>
              <ListItemButton 
                onClick={() => handleNav('/parties')} 
                selected={menuActive('/parties')}
                sx={{
                  ...getSidebarItemStyles('/parties'),
                  pl: 4
                }}
              >
                <ListItemIcon><BusinessIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Customers / Parties" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
              </ListItemButton>
              <ListItemButton 
                onClick={() => handleNav('/expense-heads')} 
                selected={menuActive('/expense-heads')}
                sx={{
                  ...getSidebarItemStyles('/expense-heads'),
                  pl: 4
                }}
              >
                <ListItemIcon><ReceiptIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Expense Heads" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
              </ListItemButton>
              <ListItemButton 
                onClick={() => handleNav('/pumps')} 
                selected={menuActive('/pumps')}
                sx={{
                  ...getSidebarItemStyles('/pumps'),
                  pl: 4
                }}
              >
                <ListItemIcon><LocalGasStationIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Diesel Pumps" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
              </ListItemButton>
            </List>
          </Collapse>
        </List>
        <Divider sx={{ mx: 2 }} />

        <List
          sx={{ px: 1.5, py: 1.5 }}
          subheader={
            open && (
              <ListSubheader component="div" sx={{ bgcolor: 'transparent', py: 1, px: 1, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                Core Operations
              </ListSubheader>
            )
          }
        >
          <ListItemButton 
            onClick={() => setOpenOps(!openOps)}
            sx={getSidebarItemStyles('/ops', openOps)}
          >
            <ListItemIcon><PaymentIcon fontSize="small" /></ListItemIcon>
            {open && <ListItemText primary="Transactions" sx={{ '& .MuiTypography-root': { fontWeight: 600 } }} />}
            {open && (openOps ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
          </ListItemButton>
          <Collapse in={openOps && open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
               <ListItemButton 
                 onClick={() => handleNav('/trips')} 
                 selected={menuActive('/trips')}
                 sx={{
                   ...getSidebarItemStyles('/trips'),
                   pl: 4
                 }}
               >
                 <ListItemIcon><LocalShippingIcon fontSize="small" /></ListItemIcon>
                 <ListItemText primary="Delivery Trips Registry" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
               </ListItemButton>
               <ListItemButton 
                 onClick={() => handleNav('/expenses')} 
                 selected={menuActive('/expenses')}
                 sx={{
                   ...getSidebarItemStyles('/expenses'),
                   pl: 4
                 }}
               >
                 <ListItemIcon><ReceiptIcon fontSize="small" /></ListItemIcon>
                 <ListItemText primary="Trip & Vehicle Expenses" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
               </ListItemButton>
               <ListItemButton 
                 onClick={() => handleNav('/diesels')} 
                 selected={menuActive('/diesels')}
                 sx={{
                   ...getSidebarItemStyles('/diesels'),
                   pl: 4
                 }}
               >
                 <ListItemIcon><LocalGasStationIcon fontSize="small" /></ListItemIcon>
                 <ListItemText primary="Fuel Refueling Logs" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
               </ListItemButton>
               <ListItemButton 
                 onClick={() => handleNav('/pump-payments')} 
                 selected={menuActive('/pump-payments')}
                 sx={{
                   ...getSidebarItemStyles('/pump-payments'),
                   pl: 4
                 }}
               >
                 <ListItemIcon><PaymentIcon fontSize="small" /></ListItemIcon>
                 <ListItemText primary="Fuel Station Payments" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
               </ListItemButton>
               <ListItemButton 
                 onClick={() => handleNav('/driver-advances')} 
                 selected={menuActive('/driver-advances')}
                 sx={{
                   ...getSidebarItemStyles('/driver-advances'),
                   pl: 4
                 }}
               >
                 <ListItemIcon><ReceiptIcon fontSize="small" /></ListItemIcon>
                 <ListItemText primary="Driver Advances Log" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
               </ListItemButton>
               <ListItemButton 
                 onClick={() => handleNav('/income-logs')} 
                 selected={menuActive('/income-logs')}
                 sx={{
                   ...getSidebarItemStyles('/income-logs'),
                   pl: 4
                 }}
               >
                 <ListItemIcon><AccountBalanceIcon fontSize="small" /></ListItemIcon>
                 <ListItemText primary="Freight Income Records" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
               </ListItemButton>
            </List>
          </Collapse>
        </List>
        <Divider sx={{ mx: 2, borderColor: '#1e293b' }} />

        <List
          sx={{ px: 1.5, py: 1.5 }}
          subheader={
            open && (
              <ListSubheader component="div" sx={{ bgcolor: 'transparent', py: 1, px: 1.5, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                Financial Books
              </ListSubheader>
            )
          }
        >
          <ListItemButton 
            onClick={() => setOpenLedgers(!openLedgers)}
            sx={{ borderRadius: '8px', mb: 0.5 }}
          >
            <ListItemIcon><AccountBalanceIcon color="primary" /></ListItemIcon>
            {open && <ListItemText primary="Ledger Books" sx={{ '& .MuiTypography-root': { fontWeight: 600 } }} />}
            {open && (openLedgers ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
          <Collapse in={openLedgers && open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 1 }}>
              <ListItemButton 
                onClick={() => handleNav('/ledgers/pumps')} 
                selected={location.pathname.startsWith('/admin/ledgers/pumps')}
                sx={{
                  ...getSidebarItemStyles('/ledgers/pumps', location.pathname.startsWith('/admin/ledgers/pumps')),
                  pl: 4
                }}
              >
                <ListItemIcon><LocalGasStationIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Pump Ledgers" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
              </ListItemButton>
              <ListItemButton 
                onClick={() => handleNav('/ledgers/vehicles')} 
                selected={location.pathname.startsWith('/admin/ledgers/vehicles')}
                sx={{
                  ...getSidebarItemStyles('/ledgers/vehicles', location.pathname.startsWith('/admin/ledgers/vehicles')),
                  pl: 4
                }}
              >
                <ListItemIcon><LocalShippingIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Vehicle Ledgers" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
              </ListItemButton>
              <ListItemButton 
                onClick={() => handleNav('/ledgers/owners')} 
                selected={location.pathname.startsWith('/admin/ledgers/owners')}
                sx={{
                  ...getSidebarItemStyles('/ledgers/owners', location.pathname.startsWith('/admin/ledgers/owners')),
                  pl: 4
                }}
              >
                <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Owner Ledgers" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
              </ListItemButton>
              <ListItemButton 
                onClick={() => handleNav('/ledgers/drivers')} 
                selected={location.pathname.startsWith('/admin/ledgers/drivers')}
                sx={{
                  ...getSidebarItemStyles('/ledgers/drivers', location.pathname.startsWith('/admin/ledgers/drivers')),
                  pl: 4
                }}
              >
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Driver Ledgers" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
              </ListItemButton>
              <ListItemButton 
                onClick={() => handleNav('/ledgers/parties')} 
                selected={location.pathname.startsWith('/admin/ledgers/parties')}
                sx={{
                  ...getSidebarItemStyles('/ledgers/parties', location.pathname.startsWith('/admin/ledgers/parties')),
                  pl: 4
                }}
              >
                <ListItemIcon><BusinessIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Customer Ledgers" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
              </ListItemButton>
            </List>
          </Collapse>
        </List>
        <Divider sx={{ mx: 2, borderColor: '#1e293b' }} />

        <List sx={{ px: 1.5, py: 1.5 }}>
          <ListItemButton 
            onClick={() => handleNav('/reports')} 
            selected={menuActive('/reports')}
            sx={getSidebarItemStyles('/reports')}
          >
            <ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>
            {open && <ListItemText primary="Reports Center" sx={{ '& .MuiTypography-root': { fontWeight: 600 } }} />}
          </ListItemButton>
        </List>
        <Divider sx={{ mx: 2, borderColor: '#1e293b' }} />

        <List 
          sx={{ px: 1.5, py: 1.5 }}
          subheader={
            open && (
              <ListSubheader component="div" sx={{ bgcolor: 'transparent', py: 1, px: 1.5, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                Web Portal & CMS
              </ListSubheader>
            )
          }
        >
          <ListItemButton 
            onClick={() => handleNav('/pages-manager')} 
            selected={menuActive('/pages-manager')}
            sx={getSidebarItemStyles('/pages-manager')}
          >
            <ListItemIcon><BusinessIcon fontSize="small" /></ListItemIcon>
            {open && <ListItemText primary="Page CMS Builder" sx={{ '& .MuiTypography-root': { fontWeight: 600 } }} />}
          </ListItemButton>

          <ListItemButton 
            onClick={() => handleNav('/enquiries')} 
            selected={menuActive('/enquiries')}
            sx={getSidebarItemStyles('/enquiries')}
          >
            <ListItemIcon>
              <Badge badgeContent={enquiryCount} color="error" variant="dot" invisible={enquiryCount === 0}>
                <MailIcon fontSize="small" />
              </Badge>
            </ListItemIcon>
            {open && <ListItemText primary="Enquiry Manager" sx={{ '& .MuiTypography-root': { fontWeight: 600 } }} />}
          </ListItemButton>
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          minHeight: '100vh',
          pt: '88px', // offset for top appbar
          width: `calc(100% - ${open ? drawerWidth : 60}px)`,
          transition: 'width 0.2s ease-in-out'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
