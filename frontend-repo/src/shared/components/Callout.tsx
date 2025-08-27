import React from 'react';
import { FileText, Target, Eye, BarChart3, Lightbulb, Info } from 'lucide-react';

interface CalloutProps {
  type: 'intent' | 'transcript' | 'expressions' | 'analysis' | 'modelAnswer' | 'info';
  title: string;
  children: React.ReactNode;
  className?: string;
}

const iconMap = {
  intent: Target,
  transcript: FileText,
  expressions: Eye,
  analysis: BarChart3,
  modelAnswer: Lightbulb,
  info: Info,
};

const colorMap = {
  intent: {
    container: 'bg-white border border-gray-200 shadow-sm',
    icon: 'text-indigo-600 bg-indigo-50',
    title: 'text-gray-900',
  },
  transcript: {
    container: 'bg-white border border-gray-200 shadow-sm',
    icon: 'text-gray-700 bg-gray-100',
    title: 'text-gray-900',
  },
  expressions: {
    container: 'bg-white border border-gray-200 shadow-sm',
    icon: 'text-indigo-600 bg-indigo-50',
    title: 'text-gray-900',
  },
  analysis: {
    container: 'bg-white border border-gray-200 shadow-sm',
    icon: 'text-gray-700 bg-gray-100',
    title: 'text-gray-900',
  },
  modelAnswer: {
    container: 'bg-indigo-50 border border-indigo-200 shadow-sm',
    icon: 'text-indigo-600 bg-indigo-100',
    title: 'text-indigo-900',
  },
  info: {
    container: 'bg-blue-50 border border-blue-200 shadow-sm',
    icon: 'text-blue-600 bg-blue-100',
    title: 'text-blue-900',
  },
};

export default function Callout({ type, title, children, className = '' }: CalloutProps) {
  const IconComponent = iconMap[type];
  const colors = colorMap[type];

  return (
    <div className={`rounded-lg p-6 ${colors.container} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colors.icon}`}>
          <IconComponent className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-lg font-semibold mb-3 ${colors.title}`}>
            {title}
          </h4>
          <div className="text-gray-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}