import axios from 'axios';

// Configure defaults
axios.defaults.baseURL = ''; // Handled by Vite proxy in development
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Response interceptor to catch unauthorized errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request, clearing local session...');
      localStorage.removeItem('token');
      // If we are not on login page, redirect
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const API = {
  // Authentication
  auth: {
    login: (credentials) => axios.post('/api/auth/login', credentials),
    me: () => axios.get('/api/auth/me'),
    changePassword: (data) => axios.post('/api/auth/change-password', data),
    forgotPassword: (data) => axios.post('/api/auth/forgot-password', data),
    resetPassword: (data) => axios.post('/api/auth/reset-password', data)
  },

  // Dashboard
  dashboard: {
    getStats: () => axios.get('/api/v1/dashboard/stats')
  },

  // Owners
  owners: {
    list: (params) => axios.get('/api/v1/owners', { params }),
    get: (id) => axios.get(`/api/v1/owners/${id}`),
    detail: (id) => axios.get(`/api/v1/owners/${id}/detail`),
    create: (data) => axios.post('/api/v1/owners', data),
    update: (id, data) => axios.put(`/api/v1/owners/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/owners/${id}`)
  },

  // Vehicles
  vehicles: {
    list: (params) => axios.get('/api/v1/vehicles', { params }),
    get: (id) => axios.get(`/api/v1/vehicles/${id}`),
    alerts: () => axios.get('/api/v1/vehicles/alerts'),
    lastDriver: (id) => axios.get(`/api/v1/vehicles/${id}/last-driver`),
    create: (data) => axios.post('/api/v1/vehicles', data),
    update: (id, data) => axios.put(`/api/v1/vehicles/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/vehicles/${id}`)
  },

  // Drivers
  drivers: {
    list: (params) => axios.get('/api/v1/drivers', { params }),
    get: (id) => axios.get(`/api/v1/drivers/${id}`),
    alerts: () => axios.get('/api/v1/drivers/alerts'),
    history: (id) => axios.get(`/api/v1/drivers/${id}/history`),
    create: (data) => axios.post('/api/v1/drivers', data),
    update: (id, data) => axios.put(`/api/v1/drivers/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/drivers/${id}`)
  },

  // Locations
  locations: {
    list: (params) => axios.get('/api/v1/locations', { params }),
    get: (id) => axios.get(`/api/v1/locations/${id}`),
    create: (data) => axios.post('/api/v1/locations', data),
    update: (id, data) => axios.put(`/api/v1/locations/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/locations/${id}`)
  },

  // Parties (Customers)
  parties: {
    list: (params) => axios.get('/api/v1/parties', { params }),
    get: (id) => axios.get(`/api/v1/parties/${id}`),
    create: (data) => axios.post('/api/v1/parties', data),
    update: (id, data) => axios.put(`/api/v1/parties/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/parties/${id}`)
  },

  // Trips
  trips: {
    list: (params) => axios.get('/api/v1/trips', { params }),
    get: (id) => axios.get(`/api/v1/trips/${id}`),
    create: (data) => axios.post('/api/v1/trips', data),
    update: (id, data) => axios.put(`/api/v1/trips/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/trips/${id}`)
  },

  // Expense Heads
  expenseHeads: {
    list: (params) => axios.get('/api/v1/expense-heads', { params }),
    get: (id) => axios.get(`/api/v1/expense-heads/${id}`),
    create: (data) => axios.post('/api/v1/expense-heads', data),
    update: (id, data) => axios.put(`/api/v1/expense-heads/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/expense-heads/${id}`)
  },

  // Expenses
  expenses: {
    list: (params) => axios.get('/api/v1/expenses', { params }),
    get: (id) => axios.get(`/api/v1/expenses/${id}`),
    create: (data) => axios.post('/api/v1/expenses', data),
    update: (id, data) => axios.put(`/api/v1/expenses/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/expenses/${id}`)
  },

  // Pumps
  pumps: {
    list: (params) => axios.get('/api/v1/pumps', { params }),
    get: (id) => axios.get(`/api/v1/pumps/${id}`),
    create: (data) => axios.post('/api/v1/pumps', data),
    update: (id, data) => axios.put(`/api/v1/pumps/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/pumps/${id}`)
  },

  // Diesels
  diesels: {
    list: (params) => axios.get('/api/v1/diesels', { params }),
    get: (id) => axios.get(`/api/v1/diesels/${id}`),
    create: (data) => axios.post('/api/v1/diesels', data),
    update: (id, data) => axios.put(`/api/v1/diesels/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/diesels/${id}`)
  },

  // Pump Payments
  pumpPayments: {
    list: (params) => axios.get('/api/v1/pump-payments', { params }),
    get: (id) => axios.get(`/api/v1/pump-payments/${id}`),
    create: (data) => axios.post('/api/v1/pump-payments', data),
    update: (id, data) => axios.put(`/api/v1/pump-payments/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/pump-payments/${id}`)
  },

  // Driver Advances
  driverAdvances: {
    list: (params) => axios.get('/api/v1/driver-advances', { params }),
    get: (id) => axios.get(`/api/v1/driver-advances/${id}`),
    create: (data) => axios.post('/api/v1/driver-advances', data),
    update: (id, data) => axios.put(`/api/v1/driver-advances/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/driver-advances/${id}`)
  },

  // Income Logs
  incomeLogs: {
    list: (params) => axios.get('/api/v1/income-logs', { params }),
    get: (id) => axios.get(`/api/v1/income-logs/${id}`),
    create: (data) => axios.post('/api/v1/income-logs', data),
    update: (id, data) => axios.put(`/api/v1/income-logs/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/income-logs/${id}`)
  },

  // Ledgers
  ledgers: {
    vehicle: (id, params) => axios.get(`/api/v1/ledgers/vehicles/${id}`, { params }),
    owner: (id, params) => axios.get(`/api/v1/ledgers/owners/${id}`, { params }),
    driver: (id, params) => axios.get(`/api/v1/ledgers/drivers/${id}`, { params }),
    party: (id, params) => axios.get(`/api/v1/ledgers/parties/${id}`, { params }),
    pump: (id, params) => axios.get(`/api/v1/ledgers/pumps/${id}`, { params })
  },

  // Reports
  reports: {
    vehicles: (params) => axios.get('/api/v1/reports/vehicles', { params }),
    owners: (params) => axios.get('/api/v1/reports/owners', { params }),
    drivers: (params) => axios.get('/api/v1/reports/drivers', { params }),
    trips: (params) => axios.get('/api/v1/reports/trips', { params }),
    expenses: (params) => axios.get('/api/v1/reports/expenses', { params }),
    diesels: (params) => axios.get('/api/v1/reports/diesels', { params }),
    pumps: (params) => axios.get('/api/v1/reports/pumps', { params }),
    income: (params) => axios.get('/api/v1/reports/income', { params }),
    profitLoss: (params) => axios.get('/api/v1/reports/profit-loss', { params }),
    export: (params) => axios.get('/api/v1/reports/export', { params })
  },

  // Settings
  settings: {
    uploadLogo: (data) => axios.post('/api/v1/settings/logo', data),
    getContactInfo: () => axios.get('/api/v1/settings/contact'),
    getPublicContactInfo: () => axios.get('/api/v1/public/settings/contact'),
    updateContactInfo: (data) => axios.put('/api/v1/settings/contact', data)
  },

  // Pages CMS
  pages: {
    list: () => axios.get('/api/v1/pages'),
    get: (id) => axios.get(`/api/v1/pages/${id}`),
    create: (data) => axios.post('/api/v1/pages', data),
    update: (id, data) => axios.put(`/api/v1/pages/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/pages/${id}`)
  },

  // Enquiries
  enquiries: {
    list: (params) => axios.get('/api/v1/enquiries', { params }),
    updateStatus: (id, data) => axios.patch(`/api/v1/enquiries/${id}`, data),
    delete: (id) => axios.delete(`/api/v1/enquiries/${id}`)
  }
};

export default API;
