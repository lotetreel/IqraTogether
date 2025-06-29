import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DuaSyncApp from './components/DuaSyncApp';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DuaSyncApp />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
