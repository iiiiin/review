// 메인 InterviewSession 컴포넌트 (팩토리 기반)
export { default as InterviewSession } from './InterviewSession';
export { default as InterviewSessionPage } from './InterviewSessionPage';

// 분리된 전용 컴포넌트들
export { GeneralInterviewSession } from './components/GeneralInterview';
export { PTInterviewSession } from './components/PTInterview';

// 팩토리 및 유틸리티
export * from './factory';

// 인터페이스 (interfaces에서만 가져와서 중복 방지)
export type {
  InterviewType,
  InterviewSessionProps,
  GeneralInterviewSessionProps as GeneralInterviewProps,
  PTInterviewSessionProps as PTInterviewProps,
  BaseInterviewSessionProps,
  InterviewCompletionCallbacks,
  InterviewStatus,
  IInterviewComponent
} from './interfaces/InterviewInterface';

// 훅들
export * from './hooks';

// Context
export * from './context/InterviewContext';

// 타입들
export * from './types';