import React from 'react';

const ProgressIndicator = ({ currentIndex, hostIndex, totalPhrases, isSynced }) => {
  return (
    <div className="w-full mb-4">
      <div className="progress-container relative">
        <div 
          className="progress-bar" 
          style={{ width: `${(currentIndex + 1) / totalPhrases * 100}%` }}
        ></div>
        
        {/* Host position marker (if not synced) */}
        {!isSynced && (
          <div 
            className="absolute top-0 h-full w-1.5 bg-accent-500 dark:bg-accent-400 rounded-full shadow-glow transition-all duration-500 ease-in-out" 
            style={{ left: `${hostIndex / totalPhrases * 100}%`, transform: 'translateX(-50%)' }}
          ></div>
        )}
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-dark-text-muted mt-1.5">
        <span className="transition-all duration-300">{currentIndex + 1} of {totalPhrases}</span>
        {!isSynced && (
          <span className="badge-accent animate-pulse-once">Not synced with host</span>
        )}
      </div>
    </div>
  );
};

export default ProgressIndicator;
