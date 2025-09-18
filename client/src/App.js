import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DuaSyncApp from './components/DuaSyncApp';
import Quran from './components/Quran';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DuaSyncApp />} />
          <Route path="/quran" element={<Quran />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
