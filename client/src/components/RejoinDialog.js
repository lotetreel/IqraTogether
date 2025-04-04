import React, { useState, useEffect } from 'react';
import { X, LogIn } from 'lucide-react';

const RejoinDialog = ({ isOpen, onClose, onSubmit, initialSessionId, initialUsername }) => {
  const [sessionIdInput, setSessionIdInput] = useState(initialSessionId || '');
  const [usernameInput, setUsernameInput] = useState(initialUsername || '');

  // Update state if initial props change (e.g., context updates while dialog is closed)
  useEffect(() => {
    setSessionIdInput(initialSessionId || '');
  }, [initialSessionId]);

  useEffect(() => {
    setUsernameInput(initialUsername || '');
  }, [initialUsername]);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (sessionIdInput.trim() && usernameInput.trim()) {
      onSubmit({ sessionId: sessionIdInput.trim(), username: usernameInput.trim() });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="card w-full max-w-sm animate-slide-up">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-dark-text-primary">Rejoin Session</h3>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="rejoin-session-id" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Session ID
            </label>
            <input
              id="rejoin-session-id"
              type="text"
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              className="input w-full"
              placeholder="Session ID"
              required
              aria-describedby="session-id-description"
            />
             <p id="session-id-description" className="text-xs text-gray-500 dark:text-gray-400 mt-1">Confirm the ID of the session you want to rejoin.</p>
          </div>
           <div>
            <label htmlFor="rejoin-username" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Your Name
            </label>
            <input
              id="rejoin-username"
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="input w-full"
              placeholder="Your Name"
              required
              aria-describedby="username-description"
            />
             <p id="username-description" className="text-xs text-gray-500 dark:text-gray-400 mt-1">Confirm the name you used in this session.</p>
          </div>
          <div className="pt-2">
            <button type="submit" className="btn-primary w-full flex items-center justify-center">
              <LogIn size={18} className="mr-2" />
              Rejoin Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejoinDialog;
