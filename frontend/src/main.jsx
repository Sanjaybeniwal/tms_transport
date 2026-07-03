import React from 'react';
import ReactDOMClient from 'react-dom/client';
import ReactDOM from 'react-dom';
import App from './App.jsx';

// Expose React globally for database-seeded runtime Babel widgets
window.React = React;
window.ReactDOM = ReactDOM;

// Import Google Font families dynamically
const linkOutfit = document.createElement('link');
linkOutfit.rel = 'stylesheet';
linkOutfit.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap';
document.head.appendChild(linkOutfit);

ReactDOMClient.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
