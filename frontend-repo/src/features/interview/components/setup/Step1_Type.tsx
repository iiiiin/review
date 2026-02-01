'use client';

import { User, Briefcase, Presentation, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInterviewSetupStore } from '@/features/interview/InterviewSetupStore';
import Button from '@/shared/components/Button';

const interviewTypes = [
  { 
    id: 'behavioral', 
    name: '인성 면접', 
    description: '가치관, 성격, 경험을 통해 조직 적합성을 평가합니다.', 
    icon: User,
    details: [
      '주로 지원자의 경험과 가치관에 대해 질문합니다.',
      '협업 능력, 문제 해결 방식, 리더십 등을 파악합니다.',
      'STAR 기법(상황, 과제, 행동, 결과)을 활용해 답변하는 것이 효과적입니다.',
    ]
  },
  { 
    id: 'tech', 
    name: '직무 면접', 
    description: '기술 역량과 문제 해결 능력을 심층적으로 평가합니다.', 
    icon: Briefcase,
    details: [
      '담당할 직무와 관련된 기술 지식을 검증합니다.',
      '코딩 테스트, 기술 질문, 시스템 설계 등 다양한 방식으로 진행됩니다.',
      '자신의 경험과 프로젝트를 구체적인 예시로 설명해야 합니다.',
    ]
  },
  { 
    id: 'presentation', 
    name: 'PT 면접', 
    description: '발표 능력과 논리적 사고, 문제 해결 과정을 평가합니다.', 
    icon: Presentation,
    details: [
      '주어진 주제에 대해 분석하고 해결 방안을 발표합니다.',
      '논리적인 흐름과 명확한 전달력이 중요합니다.',
      '발표 후 이어지는 질의응답에 대한 대비가 필요합니다.',
    ]
  },
];

export default function Step1_Type() {
  const selectedType = useInterviewSetupStore((state) => state.interviewType);
  const setInterviewType = useInterviewSetupStore((state) => state.setInterviewType);
  const goToNextStep = useInterviewSetupStore((state) => state.goToNextStep);
  
  const currentTypeDetails = interviewTypes.find(t => t.id === selectedType);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        <h2 className="text-xl font-bold text-gray-800 mb-2">면접 유형</h2>
        <p className="text-gray-600 mb-6">어떤 종류의 면접을 준비하고 싶으신가요?</p>
        
        <div className="grid grid-cols-1 md:grid-cols-[6fr_4fr] gap-8">
          {/* Left: Selection */}
          <div className="flex flex-col gap-4 pl-0">
            {interviewTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setInterviewType(type.id)}
                className={`relative w-full p-6 rounded-lg border-2 text-left transition-all duration-200 ${
                  selectedType === type.id
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm'
                }`}
              >
                <AnimatePresence>
                  {selectedType === type.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute top-3 right-3"
                    >
                      <CheckCircle className="w-6 h-6 text-blue-600 bg-white rounded-full" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center mb-2">
                  <type.icon className={`w-6 h-6 mr-3 transition-colors ${selectedType === type.id ? 'text-blue-600' : 'text-gray-500'}`} />
                  <h3 className="font-bold text-xl text-gray-800">{type.name}</h3>
                </div>
                <p className="text-base text-gray-500 pl-9">{type.description}</p>
              </button>
            ))}
          </div>

          {/* Right: Details Card */}
          <div className="relative min-h-[240px]">
            <AnimatePresence mode="wait">
              {currentTypeDetails ? (
                <motion.div
                  key={currentTypeDetails.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute w-full h-full bg-gray-50 rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex items-center mb-4">
                    <currentTypeDetails.icon className="w-6 h-6 mr-3 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-800">{currentTypeDetails.name} 주요 특징</h3>
                  </div>
                  <ul className="space-y-5"> {/* 항목 간 간격 3 → 5로 확대 */}
                    {currentTypeDetails.details.map((detail, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-3 mt-1 text-green-500 flex-shrink-0" />
                        <span className="text-base text-gray-700 leading-relaxed">
                          {detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center"
                >
                  <Info className="w-10 h-10 text-gray-400 mb-3" />
                  <h3 className="font-semibold text-gray-700">면접 유형 안내</h3>
                  <p className="text-sm text-gray-500 mt-1">왼쪽에서 면접 유형을 선택하시면<br/>이곳에 자세한 설명이 표시됩니다.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-10">
        <Button onClick={goToNextStep} disabled={!selectedType}>
          다음 단계로
        </Button>
      </div>
    </div>
  );
}
