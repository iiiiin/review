// src/pages/InterviewSetup/components/ProgressBar.tsx
import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full px-4 sm:px-0">
      <div className="relative h-2 bg-gray-200 rounded-full">
        <motion.div
          className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ ease: 'easeInOut', duration: 0.5 }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {steps.map((step) => (
          <div key={step} className="text-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500 ${
                step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
