// src/types/interview.ts

/** ---------- 실제 DB/백엔드 연동 타입 ---------- */
export interface Question {
  questionUuid: string;
  parentUuid?: string | null;
  questionNumber: number;
  question: string;
  purpose: string;
  suggestedAnswer: string;
  userUuid: string;
  interviewUuid: string;
}

export interface Interview {
  interviewUuid: string;
  interviewSetsUuid: string;
  interviewType: 'TENACITY' | 'JOB' | 'PT';
  createdAt: string;
  finishedAt: string;
  questions?: Question[];
}

/** ---------- 프론트엔드 mock/시뮬레이션용 타입 ---------- */
export interface InterviewQuestion {
  id: number;
  question: string;
  userAnswer: string;
  feedback: string;
  improvements: string[];
  intent: string;
  modelAnswer: string;
  followUpQuestions: string[];
}

export interface InterviewData {
  company: string;
  position: string;
  type: string;
  date: string;
  time: string;
  duration: string;
  questions: InterviewQuestion[]; // 프론트엔드 mock용 타입
}
