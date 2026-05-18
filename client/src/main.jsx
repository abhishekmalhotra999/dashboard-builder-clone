import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Note: StrictMode intentionally omitted to avoid react-quill double-mount warnings
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
