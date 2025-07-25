import React from 'react';
import { Outlet } from 'react-router-dom';

export default function App() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <Outlet />
    </main>
  );
}