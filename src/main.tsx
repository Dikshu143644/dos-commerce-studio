import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CommerceProvider } from './store/CommerceStore';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <CommerceProvider>
        <App />
      </CommerceProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
