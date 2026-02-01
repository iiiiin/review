// 면접 타입 정의
export type InterviewType = 'job' | 'personality' | 'presentation';

// 기본 면접 세션 Props 인터페이스
export interface BaseInterviewSessionProps {
  sessionId: string;
  initialAttemptIds?: string[];
}

// 일반 면접(인성/직무) Props
export interface GeneralInterviewSessionProps extends BaseInterviewSessionProps {
  interviewType: 'job' | 'personality';
}

// PT 면접 Props
export interface PTInterviewSessionProps extends BaseInterviewSessionProps {
  interviewType: 'presentation';
}

// 통합 면접 세션 Props
export interface InterviewSessionProps extends BaseInterviewSessionProps {
  interviewType: InterviewType;
}

// 면접 완료 콜백 인터페이스
export interface InterviewCompletionCallbacks {
  onComplete?: (answerAttemptIds: string[]) => void;
  onResultId?: (resultId: string) => void;
}

// 면접 상태 인터페이스
export interface InterviewStatus {
  isComplete: boolean;
  currentStep?: number;
  totalSteps?: number;
  resultId?: string | null;
  answerAttemptIds?: string[];
}

// 면접 컴포넌트가 구현해야 하는 인터페이스
export interface IInterviewComponent {
  // Props
  sessionId: string;
  interviewType: InterviewType;
  initialAttemptIds?: string[];
  
  // 상태
  status: InterviewStatus;
  
  // 메서드
  start(): void;
  complete(): void;
  reset(): void;
}