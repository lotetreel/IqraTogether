import React, { useState } from 'react';
import { User, X } from 'lucide-react';

const NameInputDialog = ({ onSubmit, onClose }) => {
  const [name, setName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold dark:text-dark-text-primary">Enter Your Name</h3>
          <button onClick={onClose} className="btn-icon">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="mb-6 text-gray-600 dark:text-dark-text-secondary">
            Please enter your name to join the session:
          </p>
          
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="input pl-10 w-full"
              autoFocus
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button 
              type="submit"
              className="btn-primary flex-1"
            >
              Join
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NameInputDialog;
