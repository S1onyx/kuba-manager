import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import MatchList from './pages/MatchList.jsx';
import TournamentView from './pages/TournamentView.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="matches" element={<MatchList />} />
        <Route path="tournament" element={<TournamentView />} />
      </Route>
    </Routes>
  </BrowserRouter>
);