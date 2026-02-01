// src/data/interviewData.ts
import type { InterviewData } from '@/shared/types/interview';

// 공통 질문 (원한다면 계속 확장 가능)
const commonQuestions = {
  tech: [
    {
      id: 1,
      question: 'React의 상태 관리 라이브러리에 대해 설명해주세요.',
      userAnswer: 'Redux, MobX, Recoil 등이 있습니다...',
      feedback: '주요 상태 관리 라이브러리에 대한 이해도가 높습니다...',
      improvements: [
        '각 라이브러리의 구체적인 사용 사례를 들어 설명하기',
        '라이브러리 선택 기준 언급',
        'Context API와의 비교'
      ],
      intent: 'React 생태계 상태 관리 도구 이해 평가',
      modelAnswer: 'Redux는 단일 스토어, MobX는 반응형...',
      followUpQuestions: [],
    },
    // ... 추가 질문
  ],
  behavioral: [
    {
      id: 3,
      question: '가장 어려웠던 프로젝트 경험과 해결 과정',
      userAnswer: '레거시 시스템을 리액트로 마이그레이션...',
      feedback: '동료와 협업을 강조한 점 긍정적...',
      improvements: [
        '기술적 결정 구체적으로 언급',
        '개인적 성장 어필'
      ],
      intent: '문제 해결 능력과 협업 능력 평가',
      modelAnswer: 'jQuery 코드 이커머스 플랫폼을 React로...',
      followUpQuestions: [],
    },
    // ... 추가 질문
  ],
  pt: [
    {
      id: 5,
      question: '주제 발표 PT를 준비할 때 가장 중요한 점은 무엇이라고 생각하나요?',
      userAnswer: '청중의 눈높이에 맞추어 자료를 준비하는 것이 중요하다고 생각합니다.',
      feedback: '청중 분석 관점이 명확함.',
      improvements: [
        '실제 경험을 들어 구체적으로 설명',
        'PT의 흐름 관리에 대한 본인만의 방법 언급'
      ],
      intent: 'PT 발표 준비와 전달력 평가',
      modelAnswer: '청중 분석, 핵심 메시지 선정, 효과적인 시각 자료 활용...',
      followUpQuestions: [],
    },
    // ... 추가 PT 면접 질문
  ]
};

// [각 면접 타입별 목업 데이터 생성]
export const mockTechInterview: InterviewData = {
  company: 'TechCorp',
  position: '프론트엔드 개발자',
  type: '직무 면접',
  date: '2024-07-26',
  time: '14:00',
  duration: '30분',
  questions: commonQuestions.tech,
};

export const mockBehavioralInterview: InterviewData = {
  company: 'Innovate Inc.',
  position: '신입 개발자',
  type: '인성 면접',
  date: '2024-07-25',
  time: '11:00',
  duration: '20분',
  questions: commonQuestions.behavioral,
};

export const mockPtInterview: InterviewData = {
  company: 'PT Masters',
  position: '프레젠터',
  type: 'PT 면접',
  date: '2024-07-24',
  time: '16:00',
  duration: '15분',
  questions: commonQuestions.pt,
};

// 인터뷰 타입별 데이터 맵 (타입 안전 보장)
export const interviewDataMap = {
  job: mockTechInterview,
  personality: mockBehavioralInterview,
  pt: mockPtInterview,
};
