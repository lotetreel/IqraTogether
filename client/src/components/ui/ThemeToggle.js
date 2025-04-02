import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`btn-icon relative overflow-hidden group ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative z-10 transition-transform duration-500 transform">
        {theme === 'dark' ? (
          <Sun size={20} className="text-yellow-300 animate-float" />
        ) : (
          <Moon size={20} className="text-gray-600 dark:text-dark-text-secondary group-hover:rotate-12 transition-transform duration-300" />
        )}
      </div>
      
      {/* Background glow effect */}
      <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
        theme === 'dark' 
          ? 'bg-gradient-radial from-yellow-300/20 to-transparent opacity-100' 
          : 'bg-gradient-radial from-blue-500/10 to-transparent opacity-0'
      }`}></div>
    </button>
  );
};

export default ThemeToggle;