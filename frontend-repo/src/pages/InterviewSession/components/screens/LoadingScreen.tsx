import React from 'react';
import { Loader } from 'lucide-react';

export interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "면접 준비 중..."
}) => {
  return (
    <div className="text-center">
      <Loader className="w-12 h-12 animate-spin mx-auto mb-4" />
      <p className="text-lg mb-2">{message}</p>
    </div>
  );
};