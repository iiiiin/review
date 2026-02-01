import { CheckCircle } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  summary?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:space-y-6">
        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <li key={step.title} className="relative">
              {/* Connector line */}
              {step.number !== steps.length && (
                <div
                  className={`absolute left-4 top-5 -ml-px mt-0.5 h-full w-0.5 transition-colors duration-300 ${
                    isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-hidden="true"
                />
              )}
              
              <button
                onClick={() => (isCompleted || isCurrent) && onStepClick(step.number)}
                disabled={!isCompleted && !isCurrent}
                className={`group flex w-full items-start ${isCompleted || isCurrent ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className="flex h-9 items-center">
                  <span
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110 ${
                      isCurrent ? 'bg-blue-600 shadow-lg shadow-blue-500/50' : isCompleted ? 'bg-blue-600' : 'border-2 border-gray-300 bg-white'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <span className={`h-2.5 w-2.5 rounded-full transition-transform duration-300 ${isCurrent ? 'bg-white scale-125' : 'bg-gray-300'}`} />
                    )}
                  </span>
                </span>
                <span className="ml-4 flex min-w-0 flex-col items-start">
                  <span
                    className={`text-md font-semibold transition-colors duration-300 ${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-700 group-hover:text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                  {isCompleted && step.summary && (
                    <span className="text-sm text-gray-500 mt-0.5">
                      {step.summary}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
