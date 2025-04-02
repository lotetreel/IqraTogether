import React from 'react';
import DuaSyncApp from './components/DuaSyncApp';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <SocketProvider>
      <DuaSyncApp />
    </SocketProvider>
  );
}

export default App;
