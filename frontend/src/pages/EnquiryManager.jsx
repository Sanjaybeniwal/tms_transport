import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Avatar
} from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import { formatDateTime } from '../utils/dateFormatter';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import MessageIcon from '@mui/icons-material/Message';
import SaveIcon from '@mui/icons-material/Save';
import API from '../services/api';

const EnquiryManager = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusInput, setStatusInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Notifications feedback
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchEnquiries();
  }, [activeTab, searchQuery]);

  // Hook into live updates from Layout
  useEffect(() => {
    const handleUpdateEvent = () => {
      fetchEnquiries();
    };
    window.addEventListener('enquiryUpdate', handleUpdateEvent);
    return () => {
      window.removeEventListener('enquiryUpdate', handleUpdateEvent);
    };
  }, [activeTab, searchQuery]);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const response = await API.enquiries.list({
        status: activeTab,
        search: searchQuery
      });
      setEnquiries(response.data.data);
    } catch (err) {
      console.error('Error fetching enquiries:', err);
      showToast('Failed to load enquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleOpenDetail = async (enquiry) => {
    setSelectedEnquiry(enquiry);
    setStatusInput(enquiry.status);
    setNotesInput(enquiry.notes || '');
    setIsDetailOpen(true);

    // Auto-mark as In Progress (Seen) if current status is New
    if (enquiry.status === 'New') {
      try {
        const response = await API.enquiries.updateStatus(enquiry.id, {
          status: 'In Progress'
        });
        // Update local state list
        setEnquiries(prev => prev.map(e => e.id === enquiry.id ? response.data.data : e));
        setStatusInput('In Progress');
        // Notify header layout badge count
        window.dispatchEvent(new Event('enquiryUpdate'));
      } catch (err) {
        console.error('Failed to auto-mark enquiry as seen:', err);
      }
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedEnquiry(null);
  };

  const handleSaveDetail = async () => {
    if (!selectedEnquiry) return;
    try {
      const response = await API.enquiries.updateStatus(selectedEnquiry.id, {
        status: statusInput,
        notes: notesInput
      });
      showToast('Enquiry details updated successfully');
      
      // Update list state locally
      setEnquiries(prev => prev.map(e => e.id === selectedEnquiry.id ? response.data.data : e));
      handleCloseDetail();

      // Trigger a custom event to notify Layout.jsx to reload counts
      window.dispatchEvent(new Event('enquiryUpdate'));
    } catch (err) {
      console.error('Error saving details:', err);
      showToast('Failed to update details', 'error');
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry? This action is permanent.')) return;
    try {
      await API.enquiries.delete(id);
      showToast('Enquiry deleted successfully');
      setEnquiries(prev => prev.filter(e => e.id !== id));
      
      // Trigger a custom event to notify Layout.jsx to reload counts
      window.dispatchEvent(new Event('enquiryUpdate'));
    } catch (err) {
      console.error('Error deleting enquiry:', err);
      showToast('Failed to delete enquiry', 'error');
    }
  };

  // KPI counts
  const kpis = {
    total: enquiries.length,
    new: enquiries.filter(e => e.status === 'New').length,
    inProgress: enquiries.filter(e => e.status === 'In Progress').length,
    resolved: enquiries.filter(e => e.status === 'Resolved').length
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'New': return 'primary';
      case 'In Progress': return 'warning';
      case 'Resolved': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: '1600px', mx: 'auto', p: 1 }}>
      {/* Sleek Gradient Header Card */}
      <Card
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} sm={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar sx={{ bgcolor: '#2563eb', width: 56, height: 56 }}>
                  <MailIcon sx={{ fontSize: '1.8rem', color: '#fff' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                    Customer Enquiry Manager
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#94a3b8', mt: 0.5 }}>
                    Manage client transport booking quotes and messages submitted from the public site contact page.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* KPI Metrics Widgets */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: 'Total Enquiries', count: kpis.total, color: '#475569', subtitle: 'All time submissions' },
          { title: 'New Submissions', count: kpis.new, color: '#2563eb', subtitle: 'Awaiting response' },
          { title: 'In Progress', count: kpis.inProgress, color: '#f59e0b', subtitle: 'Under follow up' },
          { title: 'Resolved Quotes', count: kpis.resolved, color: '#10b981', subtitle: 'Completed and closed' }
        ].map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.title}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: card.color, my: 1 }}>
                  {card.count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters & Table Card */}
      <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', mb: 4 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={7}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  '& .MuiTab-root': { fontWeight: 700, fontSize: '0.9rem', px: 3 },
                }}
              >
                <Tab label="All Enquiries" value="All" />
                <Tab label="New" value="New" />
                <Tab label="In Progress" value="In Progress" />
                <Tab label="Resolved" value="Resolved" />
              </Tabs>
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by name, contact info, or message text..."
                value={searchQuery}
                onChange={handleSearchChange}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress />
          </Box>
        ) : enquiries.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <MessageIcon sx={{ fontSize: '3rem', color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              No Enquiries Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No transport quotes or messages match your current filter selection.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Received Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Client Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Contact Info</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Message Preview</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enquiries.map((enquiry) => (
                  <TableRow key={enquiry.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      {formatDateTime(enquiry.createdAt)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{enquiry.name}</TableCell>
                    <TableCell>{enquiry.email || 'N/A'}</TableCell>
                    <TableCell sx={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {enquiry.message}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={enquiry.status}
                        color={getStatusChipColor(enquiry.status)}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleOpenDetail(enquiry)}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          View & Edit
                        </Button>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteEnquiry(enquiry.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Enquiry Detail & Action Dialog */}
      <Dialog
        open={isDetailOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        {selectedEnquiry && (
          <>
            <DialogTitle sx={{ bgcolor: '#0f172a', color: '#fff', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Enquiry from {selectedEnquiry.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Submitted on {formatDateTime(selectedEnquiry.createdAt)}
                </Typography>
              </Box>
              <Chip
                label={statusInput}
                color={getStatusChipColor(statusInput)}
                sx={{ fontWeight: 800, color: '#fff' }}
              />
            </DialogTitle>

            <DialogContent sx={{ p: 4, mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                    Client Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 3 }}>
                    {selectedEnquiry.name}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                    Email / Phone Number
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    {selectedEnquiry.email || 'No contact info provided'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel id="enquiry-status-label">Update Status</InputLabel>
                    <Select
                      labelId="enquiry-status-label"
                      value={statusInput}
                      label="Update Status"
                      onChange={(e) => setStatusInput(e.target.value)}
                    >
                      <MenuItem value="New">New (Unread)</MenuItem>
                      <MenuItem value="In Progress">In Progress (Follow-up)</MenuItem>
                      <MenuItem value="Resolved">Resolved (Completed)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                    Cargo Requirements & Message Details
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#f8fafc', whiteSpace: 'pre-wrap', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    {selectedEnquiry.message}
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                    Administrative Internal Notes (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Write internal notes about negotiations, quoted rates, follow-ups, etc..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 4, py: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
              <Button onClick={handleCloseDetail} sx={{ textTransform: 'none', fontWeight: 700 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveDetail}
                sx={{ textTransform: 'none', fontWeight: 700, px: 3 }}
              >
                Save Changes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar Alerts */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnquiryManager;
