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
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PreviewIcon from '@mui/icons-material/Preview';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
        setSuccessMsg('Page updated and saved successfully.');
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
        contentHtml: `<div class="py-16 px-6 max-w-4xl mx-auto">\n  <h1 class="text-4xl font-bold mb-4">${newPageData.title}</h1>\n  <p class="text-gray-600">New dynamic CMS page content goes here...</p>\n</div>`,
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

  // Compile and run preview in real-time inside an iframe or div
  useEffect(() => {
    if (!isEditing) return;

    const previewContainer = document.getElementById('live-preview-container');
    if (!previewContainer) return;

    // Load Babel-standalone if not already loaded, then render the content
    const initPreview = async () => {
      // 1. Inject HTML
      previewContainer.innerHTML = `
        <div class="preview-inner-html" style="font-family: sans-serif;">
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
          // Transpile JSX code using Babel
          const compiledCode = window.Babel.transform(editPage.contentReact, {
            presets: ['react']
          }).code;

          // Wrap React and ReactDOM in scope and evaluate the code
          const runScript = new Function('React', 'ReactDOM', compiledCode);
          runScript(window.React, window.ReactDOM);
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
          errDiv.innerText = `React Script Compilation Error:\n${err.message}`;
          previewContainer.appendChild(errDiv);
        }
      }
    };

    const timer = setTimeout(initPreview, 500); // debounce updates
    return () => clearTimeout(timer);
  }, [editPage.contentHtml, editPage.contentReact, isEditing, editorTab]);

  if (isEditing) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Back and Title Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => setIsEditing(false)} variant="outlined">
            Back to Page List
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Editing: {editPage.title}
          </Typography>
          <Button
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSavePage}
            variant="contained"
            color="success"
            disabled={loading}
          >
            Save Page Content
          </Button>
        </Box>

        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

        <Grid container spacing={3}>
          {/* Metadata & Editors Left Pane */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Page Settings & Code</Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Page Title"
                      value={editPage.title}
                      onChange={(e) => setEditPage({ ...editPage, title: e.target.value })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Slug (Url Path)"
                      value={editPage.slug}
                      onChange={(e) => setEditPage({ ...editPage, slug: e.target.value })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={8}>
                    <TextField
                      fullWidth
                      label="SEO Meta Description"
                      value={editPage.metaDescription}
                      onChange={(e) => setEditPage({ ...editPage, metaDescription: e.target.value })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4}>
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

                <Divider sx={{ mb: 2 }} />

                <Tabs value={editorTab} onChange={(e, val) => setEditorTab(val)} sx={{ mb: 2 }}>
                  <Tab label="HTML Code Structure" />
                  <Tab label="React JSX Widget Code" />
                </Tabs>

                {editorTab === 0 ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Write responsive HTML here. Uses standard TailwindCSS classes (bg-gradient, py-16, grid, text-center etc.).
                    </Typography>
                    <textarea
                      value={editPage.contentHtml}
                      onChange={(e) => setEditPage({ ...editPage, contentHtml: e.target.value })}
                      style={{
                        width: '100%',
                        height: '420px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        background: '#1e293b',
                        color: '#f8fafc',
                        lineHeight: '1.6'
                      }}
                      placeholder="Write your page HTML layout here..."
                    />
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      React widget entrypoint. Use `React.useState`, `React.useEffect`. Must render to `document.getElementById('react-root-welcome')` or `document.getElementById('contact-form-root')`.
                    </Typography>
                    <textarea
                      value={editPage.contentReact}
                      onChange={(e) => setEditPage({ ...editPage, contentReact: e.target.value })}
                      style={{
                        width: '100%',
                        height: '420px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        background: '#1e293b',
                        color: '#f8fafc',
                        lineHeight: '1.6'
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
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '550px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PreviewIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Interactive Live Preview</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Paper
                  variant="outlined"
                  sx={{
                    flexGrow: 1,
                    p: 2,
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    minHeight: '440px',
                    maxHeight: '520px',
                    overflowY: 'auto',
                    borderStyle: 'solid',
                    borderColor: 'divider',
                    position: 'relative'
                  }}
                >
                  {/* Tailwind stylesheet injected inside preview wrapper */}
                  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
                  <div id="live-preview-container"></div>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Website Page CMS Builder</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your company's responsive public website pages. Edit code, slugs, metadata, and preview instantly.
          </Typography>
        </Box>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setIsNewModalOpen(true)}>
          Create New Page
        </Button>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Page Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Slug (URL Path)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Seo Description</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{page.title}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                    /site/{page.slug}
                  </Typography>
                </TableCell>
                <TableCell color="text.secondary">{page.metaDescription || 'No description provided'}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: page.status === 'Active' ? 'success.main' : 'error.main', fontWeight: 700 }}>
                    {page.status}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleEditClick(page)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDeletePage(page.id)} disabled={['home', 'about', 'services', 'contact'].includes(page.slug)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {pages.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {loading ? <CircularProgress size={24} /> : 'No pages found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* New Page Dialog Modal */}
      <Dialog open={isNewModalOpen} onClose={() => setIsNewModalOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Website Page</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Page Title"
                placeholder="E.g., Gallery, FAQ"
                value={newPageData.title}
                onChange={(e) => setNewPageData({ ...newPageData, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Slug Path"
                placeholder="E.g., gallery, faq"
                value={newPageData.slug}
                onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="SEO Meta Description"
                placeholder="Brief summary of page for search engines"
                multiline
                rows={2}
                value={newPageData.metaDescription}
                onChange={(e) => setNewPageData({ ...newPageData, metaDescription: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePage} variant="contained">Create & Edit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PageManager;
