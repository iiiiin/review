// src/types/result.ts

// API 파일 타입
export interface InterviewFile {
  fileUuid: string;
  fileType: 'SCRIPT' | string; // 다른 파일 타입들도 있을 수 있음
  fileUrl: string;
}

// API 응답의 개별 면접 데이터 타입
export interface InterviewItem {
  interviewUuid: string;
  createdAt: string;
  finishedAt: string;
  enterpriseName: string;
  position: string;
  questionCount: number;
  files: InterviewFile[];
  interviewType: 'TENACITY' | 'JOB' | 'PT'; // API의 실제 타입
}

// API 응답의 전체 구조 타입
export interface InterviewHistoryResponse {
  status: number;
  message: string;
  result: {
    totalCount: number;
    thisMonthCount: number;
    interviews: InterviewItem[];
  };
}

// 프론트엔드에서 사용할 면접 타입 (한글)
export type InterviewType = '직무' | '인성' | 'PT';

// 답변 시도에 대한 타입 (상세 페이지용)
export interface AnswerAttempt {
  attemptNumber: number;
  videoUrl: string;
  elapsedTime: number;
}

// 꼬리 질문을 포함하는 재귀적인 질문 타입 (상세 페이지용)
export interface Question {
  question: string;
  questionNumber: number;
  purpose: string;
  suggestedAnswer: string;
  feedback: string;
  improvementSuggestions: string;
  emotionTimeline: Array<{ second: number; expression: string; }>;
  answerAttempts: AnswerAttempt[];
  children: Question[];
}

// 기본 면접 결과 타입 (직무, 인성) - 상세 페이지용
export interface InterviewResult {
  interviewUuid: string;
  interviewType: InterviewType;
  createdAt: string;
  finishedAt: string;
  enterpriseName: string;
  position: string;
  averageScore: number;
  questions: Question[];
}

// PT 면접 결과 타입 (기본 면접 결과 확장) - 상세 페이지용
export interface PTInterviewResult extends InterviewResult {
  interviewType: 'PT';
  title: string;
  situation: string;
  whiteboardContent: string;
}

// API 응답을 위한 유니온 타입 (상세 페이지용)
export type InterviewResultResponse = InterviewResult | PTInterviewResult;

// 목록 조회를 위한 요약 정보 타입 (이제 전체 데이터를 사용하므로 주석 처리 또는 삭제 가능)
export interface InterviewResultSummary {
  interviewUuid: string;
  interviewType: InterviewType;
  enterpriseName: string;
  position: string;
  createdAt: string;
  averageScore: number;
  title?: string; // PT 면접에만 존재하므로 선택적 속성
}


// 통합된 면접 상세 응답을 위한 새로운 타입들
export interface Expression {
  second: number;
  expression: string;
}

export interface Segment {
  start: number;
  end: number;
  text: string;
  intent: string;
}

export interface FeedbackSource {
  citedContent: string;
  sourceType: string;
}

export interface Feedback {
  videoUrl: string;
  intent: string;
  expressions: Expression[];
  transcript: string;
  segments: Segment[];
  modelAnswer?: string;
  feedbackSources?: { [key: string]: FeedbackSource };
}

export interface UnifiedQuestion {
  questionNumber: number;
  question: string;
  feedback: Feedback[];
}

export interface UnifiedInterviewDetail {
  interviewUuid: string;
  enterpriseName: string;
  position: string;
  interviewType: 'TENACITY' | 'JOB' | 'PT';
  createdAt: string;
  duration: string;
  ptTitle?: string;
  ptSituation?: string;
  ptFeedBack?: Feedback[];
  questionCount: number;
  questions: UnifiedQuestion[];
}

export interface UnifiedInterviewResponse {
  status: number;
  message: string;
  result: UnifiedInterviewDetail;
}

// 필터링을 위한 타입
export type FilterType = 'all' | 'tech' | 'behavioral' | 'pt';

// PT 면접 API 응답 타입 (task.md 기준)
export interface PTRetryData {
  videoUrl: string;
  intent: string;
  expressions: Expression[];
  transcript: string;
  segments: Segment[];
  modelAnswer: string;
  feedbackSources: any[];
}

export interface PTInterview {
  title: string;
  situation: string;
  enterpriseName: string;
  position: string;
  interviewType: 'PT';
  createdAt: string;
  time: string;
  questionCount: number;
  retry: PTRetryData[];
  questions: any[];
}

export interface PTInterviewResponse {
  status: number;
  message: string;
  result: {
    interviewUuid: string;
    enterpriseName: string;
    position: string;
    interviewType: 'PT';
    createdAt: string;
    duration: string;
    ptInterviews: PTInterview[];
    questionCount: number;
    questions: any[];
  };
}