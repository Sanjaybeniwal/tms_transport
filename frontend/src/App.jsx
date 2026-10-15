import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';

import theme from './theme/theme';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Owners from './pages/Owners';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Locations from './pages/Locations';
import Parties from './pages/Parties';
import Trips from './pages/Trips';
import Ledgers from './pages/Ledgers';
import Reports from './pages/Reports';
import Accounting from './pages/Accounting';
import GenericCrud from './pages/GenericCrud';
import Profile from './pages/Profile';
import PageManager from './pages/PageManager';
import PublicSite from './pages/PublicSite';
import EnquiryManager from './pages/EnquiryManager';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) return null;
  if (!token) return <Navigate to="/buts/login" replace />;

  return children;
};

// Public Route Guard (Redirects logged-in users to home)
const PublicRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) return null;
  if (token) return <Navigate to="/admin" replace />;

  return children;
};

// Generic CRUD Schema Fields Configurations
const expenseHeadFields = [
  { name: 'name', label: 'Category Name', required: true },
  { name: 'description', label: 'Description', multiline: true, rows: 2 },
  { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], defaultValue: 'Active' }
];

const pumpFields = [
  { name: 'name', label: 'Fuel Pump Name', required: true },
  { name: 'contactPerson', label: 'Contact Person', halfWidth: true },
  { name: 'mobile', label: 'Mobile Number', halfWidth: true, required: true },
  { name: 'address', label: 'Pump Address', multiline: true, rows: 2 },
  { name: 'openingBalance', label: 'Opening balance due (₹)', type: 'number', halfWidth: true, defaultValue: 0 },
  { name: 'allocatedLimit', label: 'Credit limit (₹)', type: 'number', halfWidth: true, defaultValue: 0 },
  { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], halfWidth: true, defaultValue: 'Active' }
];

const expenseFields = [
  { name: 'expenseHeadId', label: 'Expense category', type: 'select', apiResource: 'expenseHeads', nestedKey: 'expenseHead', required: true },
  { name: 'vehicleId', label: 'Vehicle number', type: 'select', apiResource: 'vehicles', nestedKey: 'vehicle', halfWidth: true },
  { name: 'tripId', label: 'Trip', type: 'select', apiResource: 'trips', nestedKey: 'trip', halfWidth: true },
  { name: 'amount', label: 'Amount (₹)', type: 'number', halfWidth: true, isCurrency: true, required: true },
  { name: 'date', label: 'Expense Date', type: 'date', halfWidth: true, required: true },
  { name: 'remarks', label: 'Remarks / receipt number', multiline: true, rows: 2 }
];

const dieselFields = [
  { name: 'vehicleId', label: 'Vehicle number', type: 'select', apiResource: 'vehicles', nestedKey: 'vehicle', required: true },
  { name: 'pumpId', label: 'Fuel Pump', type: 'select', apiResource: 'pumps', nestedKey: 'pump', required: true },
  { name: 'driverId', label: 'Driver', type: 'select', apiResource: 'drivers', nestedKey: 'driver', required: true },
  { name: 'tripId', label: 'Trip', type: 'select', apiResource: 'trips', nestedKey: 'trip' },
  { name: 'quantity', label: 'Diesel quantity (litres)', type: 'number', halfWidth: true, required: true },
  { name: 'rate', label: 'Rate per litre (₹)', type: 'number', halfWidth: true, required: true },
  { name: 'totalAmount', label: 'Total amount (₹)', type: 'number', isCurrency: true, required: true, disabled: true },
  { name: 'date', label: 'Diesel entry date', type: 'date', required: true }
];

const pumpPaymentFields = [
  { name: 'pumpId', label: 'Diesel pump', type: 'select', apiResource: 'pumps', nestedKey: 'pump', required: true },
  { name: 'amount', label: 'Amount paid (₹)', type: 'number', isCurrency: true, halfWidth: true, required: true },
  { name: 'date', label: 'Payment Date', type: 'date', halfWidth: true, required: true },
  { name: 'transactionNumber', label: 'UPI reference / cheque number', halfWidth: true },
  { name: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Cash', 'UPI', 'PhonePe', 'Paytm', 'Net Banking', 'CRED', 'Cheque'], halfWidth: true, required: true },
  { name: 'remarks', label: 'Remarks', multiline: true, rows: 2 }
];

const driverAdvanceFields = [
  { name: 'driverId', label: 'Driver Name', type: 'select', apiResource: 'drivers', nestedKey: 'driver', required: true },
  { name: 'tripId', label: 'Trip', type: 'select', apiResource: 'trips', nestedKey: 'trip', required: true },
  { name: 'amount', label: 'Advance Amount (₹)', type: 'number', isCurrency: true, halfWidth: true, required: true },
  { name: 'date', label: 'Payment Date', type: 'date', halfWidth: true, required: true },
  { name: 'remarks', label: 'Memo', multiline: true, rows: 2 }
];

const incomeLogFields = [
  { name: 'partyId', label: 'Customer / party', type: 'select', apiResource: 'parties', nestedKey: 'party', required: true },
  { name: 'tripId', label: 'Trip', type: 'select', apiResource: 'trips', nestedKey: 'trip', required: true },
  { name: 'tripFreight', label: 'Trip Freight', nestedKey: 'trip', nestedField: 'freightAmount', isCurrency: true, showInTable: true, formHidden: true },
  { name: 'tripCommission', label: 'Trip Commission', nestedKey: 'trip', nestedField: 'commission', isCurrency: true, showInTable: true, formHidden: true },
  { name: 'amount', label: 'Amount received (₹)', type: 'number', isCurrency: true, halfWidth: true, required: true },
  { name: 'date', label: 'Collection date', type: 'date', halfWidth: true, required: true },
  { name: 'remarks', label: 'Payment reference / remarks', multiline: true, rows: 2 }
];

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Access */}
            <Route path="/buts/login" element={<PublicRoute><Login /></PublicRoute>} />

            {/* Protected Routes inside layout */}
            <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="accounting/:section" element={<Accounting />} />
              <Route path="accounting" element={<Navigate to="/admin/accounting/dashboard" replace />} />
              <Route path="change-password" element={<ChangePassword />} />
              <Route path="profile" element={<Profile />} />
              <Route path="pages-manager" element={<PageManager />} />
              <Route path="enquiries" element={<EnquiryManager />} />
              
              {/* Masters CRUD pages */}
              <Route path="owners" element={<Owners />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="locations" element={<Locations />} />
              <Route path="parties" element={<Parties />} />
              <Route path="expense-heads" element={<GenericCrud key="expenseHeads" resource="expenseHeads" title="Expense categories" fields={expenseHeadFields} />} />
              <Route path="pumps" element={<GenericCrud key="pumps" resource="pumps" title="Diesel pumps" fields={pumpFields} />} />

              {/* Operations logs CRUD pages */}
              <Route path="trips" element={<Trips />} />
              <Route path="expenses" element={<GenericCrud key="expenses" resource="expenses" title="Trip & Vehicle Expenses" fields={expenseFields} />} />
              <Route path="diesels" element={<GenericCrud key="diesels" resource="diesels" title="Diesel entries" fields={dieselFields} />} />
              <Route path="pump-payments" element={<GenericCrud key="pumpPayments" resource="pumpPayments" title="Pump payments" fields={pumpPaymentFields} />} />
              <Route path="driver-advances" element={<GenericCrud key="driverAdvances" resource="driverAdvances" title="Driver advances" fields={driverAdvanceFields} />} />
              <Route path="income-logs" element={<GenericCrud key="incomeLogs" resource="incomeLogs" title="Freight collections" fields={incomeLogFields} />} />

              {/* Financial Books */}
              <Route path="ledgers/pumps" element={<Ledgers />} />
              <Route path="ledgers/vehicles" element={<Ledgers />} />
              <Route path="ledgers/owners" element={<Ledgers />} />
              <Route path="ledgers/drivers" element={<Ledgers />} />
              <Route path="ledgers/parties" element={<Ledgers />} />

              {/* Analytics and Reports */}
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* Public Website */}
            <Route path="/site/:slug" element={<PublicSite />} />
            <Route path="/:slug" element={<PublicSite />} />
            <Route path="/" element={<PublicSite />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
