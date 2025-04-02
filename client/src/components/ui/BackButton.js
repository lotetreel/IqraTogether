import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const BackButton = ({ onClick, className = '' }) => {
  
  return (
    <button 
      onClick={onClick}
      className={`btn-secondary flex items-center px-3 py-2 text-sm group ${className}`}
    >
      <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-1 transition-transform duration-300" />
      Back
    </button>
  );
};

export default BackButton;