import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  InputAdornment,
  FormHelperText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PreviewIcon from '@mui/icons-material/Preview';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WebIcon from '@mui/icons-material/Web';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PublicIcon from '@mui/icons-material/Public';
import LanguageIcon from '@mui/icons-material/Language';
import API from '../services/api';

const PageManager = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editPage, setEditPage] = useState({
    id: null,
    title: '',
    slug: '',
    contentHtml: '',
    contentReact: '',
    metaDescription: '',
    status: 'Active'
  });

  // Code editor tabs: 0 = HTML, 1 = React JS
  const [editorTab, setEditorTab] = useState(0);

  // New page modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newPageData, setNewPageData] = useState({
    title: '',
    slug: '',
    metaDescription: ''
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const response = await API.pages.list();
      if (response.data.status === 'success') {
        setPages(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load website pages.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (page) => {
    setEditPage({
      id: page.id,
      title: page.title,
      slug: page.slug,
      contentHtml: page.contentHtml || '',
      contentReact: page.contentReact || '',
      metaDescription: page.metaDescription || '',
      status: page.status || 'Active'
    });
    setIsEditing(true);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSavePage = async () => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await API.pages.update(editPage.id, {
        title: editPage.title,
        slug: editPage.slug,
        contentHtml: editPage.contentHtml,
        contentReact: editPage.contentReact,
        metaDescription: editPage.metaDescription,
        status: editPage.status
      });

      if (response.data.status === 'success') {
        setSuccessMsg('Page content and layouts updated successfully.');
        fetchPages();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error occurred while saving page content.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this page? This cannot be undone.')) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await API.pages.delete(id);
      setSuccessMsg('Page deleted successfully.');
      fetchPages();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete page.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to slugify page title on typing
  const handleTitleChange = (val) => {
    const slugified = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove symbols
      .trim()
      .replace(/\s+/g, '-'); // spaces to dashes
    setNewPageData({
      ...newPageData,
      title: val,
      slug: slugified
    });
  };

  const handleCreatePage = async () => {
    if (!newPageData.title || !newPageData.slug) {
      alert('Title and Slug are required.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await API.pages.create({
        title: newPageData.title,
        slug: newPageData.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, ''),
        metaDescription: newPageData.metaDescription,
        contentHtml: `<div class="py-20 px-6 max-w-4xl mx-auto text-center">\n  <h1 class="text-5xl font-extrabold text-blue-900 mb-6">${newPageData.title}</h1>\n  <p class="text-xl text-gray-600 leading-relaxed mb-8">This is your brand new custom CMS website page.</p>\n  <div class="inline-block p-1 rounded-full bg-blue-100 px-6 py-2 text-blue-800 font-semibold text-sm">Dynamic CMS Page ready for editing</div>\n</div>`,
        contentReact: ''
      });

      if (response.data.status === 'success') {
        setIsNewModalOpen(false);
        setNewPageData({ title: '', slug: '', metaDescription: '' });
        handleEditClick(response.data.data);
        fetchPages();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create page.');
    } finally {
      setLoading(false);
    }
  };

  // Compile and run preview in real-time inside preview div
  useEffect(() => {
    if (!isEditing) return;

    const previewContainer = document.getElementById('live-preview-container');
    if (!previewContainer) return;

    const initPreview = async () => {
      // 1. Inject HTML
      previewContainer.innerHTML = `
        <div class="preview-inner-html" style="font-family: 'Inter', sans-serif;">
          ${editPage.contentHtml}
        </div>
        <div id="react-root-welcome"></div>
        <div id="contact-form-root"></div>
      `;

      // 2. Transpile and execute React script if present
      if (editPage.contentReact) {
        if (!window.Babel) {
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
            script.onload = resolve;
            document.head.appendChild(script);
          });
        }

        try {
          // 1. Strip ES6 import statements from the code
          const cleanedReact = editPage.contentReact
            .replace(/^\s*import\s+[\s\S]*?from\s+['"].*?['"];?/gm, '')
            .replace(/^\s*import\s+['"].*?['"];?/gm, '');

          // 2. Transpile JSX code using Babel
          const compiledCode = window.Babel.transform(cleanedReact, {
            presets: ['react']
          }).code;

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
            window.ReactDOM,
            window.React.useState,
            window.React.useEffect,
            window.React.useContext,
            window.React.useRef,
            window.React.useMemo,
            window.React.useCallback
          );
        } catch (err) {
          console.warn('React Preview Error:', err);
          const errDiv = document.createElement('div');
          errDiv.style.color = '#ef4444';
          errDiv.style.padding = '12px';
          errDiv.style.border = '1px solid #fecaca';
          errDiv.style.background = '#fef2f2';
          errDiv.style.borderRadius = '6px';
          errDiv.style.marginTop = '16px';
          errDiv.style.fontSize = '13px';
          errDiv.style.fontFamily = 'monospace';
          errDiv.innerText = `React Widget Render Error:\n${err.message}`;
          previewContainer.appendChild(errDiv);
        }
      }
    };

    const timer = setTimeout(initPreview, 400); // debounce updates
    return () => clearTimeout(timer);
  }, [editPage.contentHtml, editPage.contentReact, isEditing, editorTab]);

  if (isEditing) {
    return (
      <Box sx={{ p: 1 }}>
        {/* Editor Workspace Header */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => setIsEditing(false)} 
            variant="outlined"
            sx={{ borderRadius: '20px', textTransform: 'none', px: 3 }}
          >
            Back to Page List
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WebIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              CMS Designer: <Box component="span" sx={{ color: 'primary.main' }}>{editPage.title}</Box>
            </Typography>
          </Box>

          <Button
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSavePage}
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ borderRadius: '20px', textTransform: 'none', px: 4, boxShadow: '0 4px 14px 0 rgba(37,99,235,0.3)' }}
          >
            Save Layout Changes
          </Button>
        </Box>

        {successMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMsg}</Alert>}
        {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert>}

        <Grid container spacing={3}>
          {/* Metadata & Editors Left Pane */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LanguageIcon color="action" /> Page Configurations
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Page Title"
                      value={editPage.title}
                      onChange={(e) => setEditPage({ ...editPage, title: e.target.value })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="URL slug path"
                      value={editPage.slug}
                      onChange={(e) => setEditPage({ ...editPage, slug: e.target.value })}
                      size="small"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">/site/</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="SEO Meta Description Tag"
                      value={editPage.metaDescription}
                      onChange={(e) => setEditPage({ ...editPage, metaDescription: e.target.value })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={editPage.status}
                        label="Status"
                        onChange={(e) => setEditPage({ ...editPage, status: e.target.value })}
                      >
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 1 }} />

                <Tabs 
                  value={editorTab} 
                  onChange={(e, val) => setEditorTab(val)} 
                  sx={{ 
                    mb: 2, 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } 
                  }}
                >
                  <Tab label="HTML Markup Structure" />
                  <Tab label="Interactive React JSX Hook" />
                </Tabs>

                {editorTab === 0 ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                      TailwindCSS styling is fully active. Build layouts using standard utility classes.
                    </Typography>
                    <textarea
                      value={editPage.contentHtml}
                      onChange={(e) => setEditPage({ ...editPage, contentHtml: e.target.value })}
                      style={{
                        width: '100%',
                        height: '420px',
                        fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
                        fontSize: '13px',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        background: '#0f172a',
                        color: '#38bdf8',
                        lineHeight: '1.6',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      placeholder="Write your page HTML layout here..."
                    />
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                      Inject code targeting root divs: id="react-root-welcome" or id="contact-form-root".
                    </Typography>
                    <textarea
                      value={editPage.contentReact}
                      onChange={(e) => setEditPage({ ...editPage, contentReact: e.target.value })}
                      style={{
                        width: '100%',
                        height: '420px',
                        fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
                        fontSize: '13px',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        background: '#0f172a',
                        color: '#a78bfa',
                        lineHeight: '1.6',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      placeholder="// React Script code here..."
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Live Preview Right Pane */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '580px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PreviewIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Interactive Live Preview Frame</Typography>
                </Box>
                
                {/* Browser Mockup Wrapper */}
                <Box sx={{ 
                  flexGrow: 1, 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 3, 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}>
                  {/* Browser Mockup Header */}
                  <Box sx={{ 
                    bgcolor: '#f8fafc', 
                    borderBottom: '1px solid #e2e8f0', 
                    px: 2, 
                    py: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2 
                  }}>
                    {/* Faux control buttons */}
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#eab308' }} />
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#22c55e' }} />
                    </Box>
                    
                    {/* Mock Address Bar */}
                    <Box sx={{ 
                      flexGrow: 1, 
                      bgcolor: '#ffffff', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: 1.5, 
                      px: 2, 
                      py: 0.5, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1 
                    }}>
                      <PublicIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {window.location.origin}/site/{editPage.slug}
                      </Typography>
                    </Box>
                  </Box>

                  {/* HTML Live Content Panel */}
                  <Box
                    sx={{
                      flexGrow: 1,
                      p: 1,
                      bgcolor: '#ffffff',
                      minHeight: '440px',
                      maxHeight: '520px',
                      overflowY: 'auto',
                      position: 'relative'
                    }}
                  >
                    {/* Tailwind stylesheet injected inside preview */}
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
                    <div id="live-preview-container"></div>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* Top Banner Header */}
      <Card sx={{ 
        mb: 4, 
        borderRadius: 4, 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)'
      }}>
        <CardContent sx={{ p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <WebIcon fontSize="large" sx={{ color: 'primary.light' }} /> Public Website CMS Builder
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 600 }}>
              Edit layouts, customize styling configurations, and add custom scripts to construct pages for your public website in real-time.
            </Typography>
          </Box>
          <Button 
            startIcon={<AddIcon />} 
            variant="contained" 
            color="primary"
            onClick={() => setIsNewModalOpen(true)}
            sx={{ 
              borderRadius: '24px', 
              textTransform: 'none', 
              px: 4, 
              py: 1.5,
              fontWeight: 700,
              boxShadow: '0 4px 14px 0 rgba(37,99,235,0.4)',
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' }
            }}
          >
            Create Web Page
          </Button>
        </CardContent>
      </Card>

      {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMsg}</Alert>}

      {/* Pages List View */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Page Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#334155' }}>URL Path</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Meta Description (SEO)</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{page.title}</TableCell>
                <TableCell>
                  <Chip 
                    icon={<LanguageIcon sx={{ fontSize: '1rem !important' }} />}
                    label={`/site/${page.slug}`} 
                    size="small" 
                    variant="outlined" 
                    onClick={() => window.open(`/site/${page.slug}`, '_blank')}
                    sx={{ 
                      fontFamily: 'monospace', 
                      cursor: 'pointer',
                      borderColor: 'primary.light',
                      color: 'primary.dark',
                      '&:hover': { bgcolor: '#eff6ff' }
                    }} 
                  />
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {page.metaDescription || <Box component="span" sx={{ fontStyle: 'italic', opacity: 0.5 }}>No tag provided</Box>}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={page.status} 
                    size="small" 
                    color={page.status === 'Active' ? 'success' : 'default'}
                    sx={{ fontWeight: 700, borderRadius: '6px' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit Code & Meta">
                    <IconButton color="primary" onClick={() => handleEditClick(page)} sx={{ mr: 1 }}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={['home', 'about', 'services', 'contact'].includes(page.slug) ? "System Page (Cannot Delete)" : "Delete Page"}>
                    <span>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeletePage(page.id)} 
                        disabled={['home', 'about', 'services', 'contact'].includes(page.slug)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {pages.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  {loading ? <CircularProgress size={30} /> : 'No customizable pages found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Styled Dialog for Creating Web Pages */}
      <Dialog 
        open={isNewModalOpen} 
        onClose={() => setIsNewModalOpen(false)}
        PaperProps={{
          sx: { borderRadius: 4, width: '480px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AutoAwesomeIcon color="primary" /> Create New Web Page
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Initialize a blank template page on the public company server.
          </Typography>
          
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Page Title Name"
                placeholder="E.g., Careers, FAQ"
                value={newPageData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Public Slug Address"
                placeholder="E.g., careers, faq"
                value={newPageData.slug}
                onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                helperText="Auto-slugified for SEO compliance. Alpha-numeric/dashes only."
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="SEO Meta Description Tag"
                placeholder="Briefly describe what this page contains for search engines..."
                multiline
                rows={3}
                value={newPageData.metaDescription}
                onChange={(e) => setNewPageData({ ...newPageData, metaDescription: e.target.value })}
                variant="outlined"
              />
            </Grid>
          </Grid>

          {/* Live Web Address helper */}
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
              Live Target Link preview:
            </Typography>
            <Typography variant="body2" color="primary.dark" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
              {window.location.origin}/site/{newPageData.slug || 'slug-placeholder'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setIsNewModalOpen(false)} 
            sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '18px' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreatePage} 
            variant="contained"
            disabled={!newPageData.title || !newPageData.slug}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 700, 
              px: 3, 
              borderRadius: '18px',
              boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
            }}
          >
            Create & Open Editor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PageManager;
