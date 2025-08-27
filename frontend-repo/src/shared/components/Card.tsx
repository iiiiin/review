import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingClass = paddingClasses[padding] || paddingClasses.md;
  return (
    <div className={`bg-white shadow-md rounded-lg ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}
