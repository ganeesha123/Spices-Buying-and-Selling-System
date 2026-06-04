import React from 'react';

const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
      <div className="text-center">
        <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4`}></div>
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
