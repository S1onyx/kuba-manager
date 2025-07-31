import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Importiere Routes und Route
import App from './App.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <Routes>
      {/* Definiere eine Route mit einem URL-Parameter für die Match-ID */}
      <Route path="/match/:matchId" element={<App />} />
      <Route path="/" element={<App />} /> {/* Füge eine Route für den Pfad ohne Match-ID hinzu */}
    </Routes>
  </BrowserRouter>
);