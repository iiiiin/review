'use client';

import { useInterviewSetupStore } from '../InterviewSetupStore';
import Step1_Type from './Step1_Type';
import Step2_Details from './Step2_Details';
import Step3_Upload from './Step3_Upload';
import Step4_Confirm from './Step4_Confirm';
import Stepper from './Stepper';
import { motion, AnimatePresence } from 'framer-motion';

const stepComponents = [
  { number: 1, component: Step1_Type },
  { number: 2, component: Step2_Details },
  { number: 3, component: Step3_Upload },
  { number: 4, component: Step4_Confirm },
];

const interviewTypeMap: { [key: string]: string } = {
  'behavioral': '인성 면접',
  'tech': '직무 면접',
  'presentation': 'PT 면접',
};

export default function InterviewSetup() {
  const store = useInterviewSetupStore();
  const { currentStep, setCurrentStep, interviewType, company, job, resume, portfolio, script } = store;

  const CurrentStepComponent = stepComponents.find(s => s.number === currentStep)?.component;

  const getStepSummary = (stepNumber: number): string | undefined => {
    switch (stepNumber) {
      case 1:
        return interviewType ? interviewTypeMap[interviewType] : undefined;
      case 2:
        if (company.name && job.name) return `${company.name} / ${job.name}`;
        if (company.name) return company.name;
        return undefined;
      case 3:
        const files = [
          resume.file || resume.uuid ? '이력서' : null,
          portfolio.file || portfolio.uuid ? '포트폴리오' : null,
          script.file || script.uuid ? '스크립트' : null,
        ].filter(Boolean);
        return files.length > 0 ? files.join(', ') : undefined;
      default:
        return undefined;
    }
  };

  const stepDefs = [
    { number: 1, title: '면접 유형 선택', summary: getStepSummary(1) },
    { number: 2, title: '상세 정보 입력', summary: getStepSummary(2) },
    { number: 3, title: '서류 업로드 (선택)', summary: getStepSummary(3) },
    { number: 4, title: '최종 확인' },
  ];

  return (
    <div className="relative rounded-2xl shadow-2xl border border-white/30 p-1 bg-gradient-to-br from-white/50 to-white/20">
      <div className="bg-white/60 backdrop-blur-xl rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left: Stepper */}
          <div
          className="md:col-span-4 border-r border-white/30
                    p-6 md:p-8
                    md:flex md:justify-center   /* 가로 가운데 */
                    md:pt-10"                   /* 위쪽과 거리 확보(내려오기) */
        >
          <div className="w-full max-w-[340px]">
            <Stepper
              steps={stepDefs}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
            />
          </div>
        </div>

          {/* Right: Content */}
          <div className="md:col-span-8 p-4 md:p-6 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="min-h-[500px] flex flex-col"
              >
                {CurrentStepComponent ? <CurrentStepComponent /> : <div>잘못된 단계입니다.</div>}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
