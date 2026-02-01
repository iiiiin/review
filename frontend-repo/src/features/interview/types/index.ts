// Interview Session 관련 타입 정의

export type BaseQ = { 
  id?: string | number; 
  question: string 
};

export type FullQ = BaseQ & { 
  followUps?: BaseQ[] 
};

export type ExpandedQ = BaseQ & {
  kind: 'main' | 'follow';
  parentId?: string | number;
  followIndex?: number; // 1부터
};

export interface InterviewSessionProps {
  interviewType: string;
  sessionId: string;
  initialAttemptIds?: string[];
}

export interface InterviewState {
  step: 'loading' | 'preparing' | 'waiting_recording' | 'answering' | 'complete';
  questions: ExpandedQ[];
  currentQuestionIndex: number;
  remainingTime: number;
  resultId: string | null;
  currentRecordingId: string | null;
}

export type InterviewAction =
  | { type: 'START_INTERVIEW'; payload: ExpandedQ[] }
  | { type: 'START_RECORDING_WAIT' }
  | { type: 'START_ANSWERING' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'COMPLETE_INTERVIEW' }
  | { type: 'COMPLETE' }
  | { type: 'TICK' }
  | { type: 'LOAD_QUESTIONS'; payload: ExpandedQ[] }
  | { type: 'ADD_QUESTIONS'; payload: ExpandedQ[] }
  | { type: 'SET_RECORDING_ID'; payload: string | null }
  | { type: 'SET_RESULT_ID'; payload: string | null }
  | { type: 'SET_QUESTION_INDEX'; payload: number };

export const TOTAL_ANSWER_TIME = 60;