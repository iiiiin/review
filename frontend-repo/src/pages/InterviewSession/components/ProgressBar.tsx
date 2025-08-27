'use client';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  currentQuestion?: string;
  questionType?: string;
}

export default function ProgressBar({ currentStep, totalSteps, currentQuestion, questionType }: ProgressBarProps) {
  const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="w-full mb-6 bg-blue-50/90 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-blue-200/50">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-blue-600">
          {questionType || `질문 ${currentStep}`}
        </span>
        <span className="text-sm font-medium text-blue-600">
          {currentStep} / {totalSteps}
        </span>
      </div>
      
      <div className="w-full bg-blue-200/50 rounded-full h-2 mb-4">
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>
      
      {currentQuestion ? (
        <div className="flex items-center gap-3">
          {currentQuestion === '다음 질문을 준비하고 있습니다.' ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-lg font-bold text-blue-600 leading-relaxed animate-pulse">
                {currentQuestion}
              </p>
            </>
          ) : (
            <p className="text-lg font-bold text-gray-800 leading-relaxed">
              {currentQuestion}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}