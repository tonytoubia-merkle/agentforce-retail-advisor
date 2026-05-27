import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// RouterProvider lives inside App (createBrowserRouter pattern) — no BrowserRouter here.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
