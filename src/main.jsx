import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { StudyDataProvider } from './context/StudyDataContext.jsx';
import './styles/index.css';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StudyDataProvider>
        <App />
      </StudyDataProvider>
    </BrowserRouter>
  </React.StrictMode>
);
