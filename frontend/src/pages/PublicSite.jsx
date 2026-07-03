import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Container,
  Grid,
  CircularProgress,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import axios from 'axios';

const PublicSite = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const pageSlug = slug || 'home';

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch page data from backend public route
  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const response = await axios.get(`/api/v1/public/pages/${pageSlug}`);
        if (response.data.status === 'success') {
          setPage(response.data.data);
          // Set page title for SEO
          document.title = `${response.data.data.title} | Bombay Uttaranchal Tempo Service`;
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(err.response?.data?.message || 'Page not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [pageSlug]);

  // Transpile and run custom React code when page finishes loading
  useEffect(() => {
    if (loading || !page) return;

    const executeReact = async () => {
      const container = document.getElementById('react-root-anchor');
      if (!container) return;

      // Clear any previous react content/error
      container.innerHTML = `
        <div id="react-root-welcome"></div>
        <div id="contact-form-root"></div>
      `;

      if (page.contentReact) {
        // Load Babel standalone script if not loaded
        if (!window.Babel) {
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
            script.onload = resolve;
            document.head.appendChild(script);
          });
        }

        try {
          // Transpile JSX code using Babel
          const compiledCode = window.Babel.transform(page.contentReact, {
            presets: ['react']
          }).code;

          // Execute transpiled script
          const runScript = new Function('React', 'ReactDOM', compiledCode);
          runScript(window.React, window.ReactDOM);
        } catch (err) {
          console.warn('React script execution error:', err);
        }
      }
    };

    // Give it a tiny delay to ensure HTML is rendered first
    const timer = setTimeout(executeReact, 300);
    return () => clearTimeout(timer);
  }, [page, loading]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { label: 'Home', path: '/home' },
    { label: 'About Us', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Contact', path: '/contact' }
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <img src="/logo.png" alt="BUTS Logo" style={{ height: '70px', objectFit: 'contain' }} />
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              sx={{ textAlign: 'center', fontWeight: 600 }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Tailwind CSS stylesheet injection for rendering page HTML styling */}
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />

      {/* Navigation Header */}
      <AppBar position="sticky" sx={{ bgcolor: '#ffffff', color: '#0f172a', borderBottom: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between', py: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1, display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <RouterLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <img src="/logo.png" alt="BUTS Logo" style={{ height: '75px', marginTop: '-15px', marginBottom: '-15px', objectFit: 'contain' }} />
              </RouterLink>
            </Box>

            {/* Desktop Navigation Links */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
              {navItems.map((item) => (
                <RouterLink
                  key={item.label}
                  to={item.path}
                  style={{
                    textDecoration: 'none',
                    color: pageSlug === item.path.split('/').pop() ? '#2563eb' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    transition: 'color 0.2s',
                  }}
                >
                  {item.label}
                </RouterLink>
              ))}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 260 }
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Dynamic Page Content */}
      <Box sx={{ flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={50} />
          </Box>
        ) : errorMsg ? (
          <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
            <Typography variant="h3" color="error" sx={{ fontWeight: 800, mb: 2 }}>404</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Page Not Found</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {errorMsg}
            </Typography>
            <Button variant="contained" component={RouterLink} to="/site/home">
              Go to Home Page
            </Button>
          </Container>
        ) : page ? (
          <Box>
            {/* HTML code section */}
            <div dangerouslySetInnerHTML={{ __html: page.contentHtml }} />

            {/* React code anchor container */}
            <div id="react-root-anchor" class="max-w-6xl mx-auto px-6 mb-16">
              <div id="react-root-welcome"></div>
              <div id="contact-form-root"></div>
            </div>
          </Box>
        ) : null}
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#0f172a', color: '#94a3b8', py: 8, borderTop: '1px solid #1e293b' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <img src="/logo.png" alt="BUTS Logo" style={{ height: '70px', filter: 'brightness(0.95)', objectFit: 'contain' }} />
              </Box>
              <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                Bombay Uttaranchal Tempo Service (BUTS) connects major industrial corridors to Uttarakhand hill stations with modern logistics, real-time safety, and professional dispatch operations.
              </Typography>
            </Grid>
            <Grid item xs={6} md={4} sx={{ pl: { md: 6 } }}>
              <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 700, mb: 2.5 }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {navItems.map((item) => (
                  <RouterLink
                    key={item.label}
                    to={item.path}
                    style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}
                  >
                    {item.label}
                  </RouterLink>
                ))}
              </Box>
            </Grid>
            <Grid item xs={6} md={4}>
              <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 700, mb: 2.5 }}>
                Our Depot Address
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.8, mb: 2 }}>
                12, Transport Nagar, Phase-II<br />
                New Delhi - 110045, India
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                Phone: +91-9876543210
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: '#1e293b', mb: 4 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption">
              © {new Date().getFullYear()} Bombay Uttaranchal Tempo Service. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', gap: 1.5 }}>
              <span>Security Insured</span> • <span>ISO Certified Operations</span>
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default PublicSite;
