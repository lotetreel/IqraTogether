import React from 'react';
import { X, Crown, UserCircle } from 'lucide-react';

const ParticipantsDialog = ({ participants, isHost, onTransferHost, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold dark:text-dark-text-primary">Participants</h3>
          <button onClick={onClose} className="btn-icon">
            <X size={24} />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <ul className="space-y-2">
            {participants.map((participant, index) => (
              <li 
                key={participant.id} 
                className="py-3 px-4 flex items-center justify-between transition-all duration-300 bg-gray-50 dark:bg-dark-bg-secondary rounded-lg border border-gray-100 dark:border-gray-700 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white mr-3">
                    <UserCircle size={20} />
                  </div>
                  <div>
                    <span className="font-medium dark:text-dark-text-primary">{participant.name}</span>
                    {participant.isHost && (
                      <span className="ml-2 badge-primary inline-flex items-center">
                        <Crown size={12} className="mr-1" />
                        Host
                      </span>
                    )}
                  </div>
                </div>
                
                {isHost && !participant.isHost && (
                  <button 
                    onClick={() => onTransferHost(participant.id)}
                    className="btn-secondary text-sm py-1 flex items-center text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900 dark:hover:bg-opacity-20"
                  >
                    <Crown size={14} className="mr-1" />
                    Make Host
                  </button>
                )}
              </li>
            ))}
          </ul>
          
          {participants.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted">
              No participants have joined yet.
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <button 
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsDialog;
