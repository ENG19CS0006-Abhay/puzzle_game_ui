import React from 'react';
import ReactDOM from 'react-dom/client';
// Import the 'App' component which contains the Noir AI logic
import App from './App'; 
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Change this from AIModernPuzzleGame to App */}
    <App />
  </React.StrictMode>,
);