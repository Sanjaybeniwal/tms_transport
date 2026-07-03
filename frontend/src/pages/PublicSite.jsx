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

  // Redirect guard for trailing slashes on /admin/
  useEffect(() => {
    if (pageSlug === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [pageSlug, navigate]);

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

      // Clear the anchor fallback container
      container.innerHTML = '';

      // Ensure roots exist on the page without duplicates
      let welcomeRoot = document.getElementById('react-root-welcome');
      let contactRoot = document.getElementById('contact-form-root');

      if (!welcomeRoot) {
        welcomeRoot = document.createElement('div');
        welcomeRoot.id = 'react-root-welcome';
        container.appendChild(welcomeRoot);
      }
      if (!contactRoot) {
        contactRoot = document.createElement('div');
        contactRoot.id = 'contact-form-root';
        container.appendChild(contactRoot);
      }

      if (page.contentReact) {
        // Load Babel standalone script if not loaded
        if (!window.Babel) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/babel.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load local Babel compiler.'));
            document.head.appendChild(script);
          });
        }

        try {
          // 1. Strip ES6 import statements from the code
          const cleanedReact = page.contentReact
            .replace(/^\s*import\s+[\s\S]*?from\s+['"].*?['"];?/gm, '')
            .replace(/^\s*import\s+['"].*?['"];?/gm, '');

          // 2. Transpile JSX code using Babel using classic runtime (to avoid automatic injection of import statements)
          const compiledCode = window.Babel.transform(cleanedReact, {
            presets: [
              ['react', { runtime: 'classic' }]
            ]
          }).code;

          // Create a safe ReactDOM shim to handle ReactDOM.render with modern React 18 createRoot
          const safeReactDOM = {
            render: (element, container) => {
              if (!container) return;
              container.innerHTML = '';
              const root = window.ReactDOMClient.createRoot(container);
              root.render(element);
            }
          };

          // 3. Wrap React, ReactDOM, and common hooks in scope and evaluate the code
          const runScript = new Function(
            'React',
            'ReactDOM',
            'useState',
            'useEffect',
            'useContext',
            'useRef',
            'useMemo',
            'useCallback',
            compiledCode
          );
          runScript(
            window.React,
            safeReactDOM,
            window.React.useState,
            window.React.useEffect,
            window.React.useContext,
            window.React.useRef,
            window.React.useMemo,
            window.React.useCallback
          );
        } catch (err) {
          console.warn('React script execution error:', err);
          const errDiv = document.createElement('div');
          errDiv.className = 'max-w-4xl mx-auto my-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-sans';
          errDiv.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 4px;">⚠️ React Widget Render Error:</div>
            <div style="font-family: monospace; white-space: pre-wrap;">${err.stack || err.message}</div>
          `;
          container.appendChild(errDiv);
        }
      }
    };

    executeReact();
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
            <div id="react-root-anchor" className="max-w-6xl mx-auto px-6 mb-16" />
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
