import { useReducer, useMemo } from 'react';
import type { ExpandedQ, InterviewState, InterviewAction } from '@/features/interview/types';

const TOTAL_ANSWER_TIME = 60;

const initialState: InterviewState = {
  step: 'loading',
  questions: [],
  currentQuestionIndex: 0,
  remainingTime: TOTAL_ANSWER_TIME,
  resultId: null,
  currentRecordingId: null,
};

function interviewReducer(state: InterviewState, action: InterviewAction): InterviewState {
  switch (action.type) {
    case 'START_INTERVIEW':
      return { 
        ...state, 
        questions: action.payload, 
        step: 'preparing', 
        currentQuestionIndex: 0, 
        remainingTime: TOTAL_ANSWER_TIME, 
        currentRecordingId: null 
      };
    case 'START_RECORDING_WAIT':
      return { ...state, step: 'waiting_recording' };
    case 'START_ANSWERING':
      return { ...state, step: 'answering' };
    case 'NEXT_QUESTION':
      if (state.currentQuestionIndex < state.questions.length - 1) {
        return { 
          ...state, 
          currentQuestionIndex: state.currentQuestionIndex + 1, 
          step: 'preparing', 
          remainingTime: TOTAL_ANSWER_TIME, 
          currentRecordingId: null 
        };
      }
      return { ...state, step: 'complete', currentRecordingId: null };
    case 'COMPLETE_INTERVIEW':
      return { ...state, step: 'complete', currentRecordingId: null };
    case 'COMPLETE':
      return { ...state, step: 'complete', currentRecordingId: null };
    case 'TICK':
      if (state.remainingTime > 0) {
        return { ...state, remainingTime: state.remainingTime - 1 };
      }
      if (state.currentQuestionIndex < state.questions.length - 1) {
        return { 
          ...state, 
          currentQuestionIndex: state.currentQuestionIndex + 1, 
          step: 'preparing', 
          remainingTime: TOTAL_ANSWER_TIME, 
          currentRecordingId: null 
        };
      }
      return { ...state, step: 'complete', currentRecordingId: null };
    case 'LOAD_QUESTIONS':
      return { 
        ...state, 
        questions: action.payload, 
        step: 'preparing', 
        currentQuestionIndex: 0, 
        remainingTime: TOTAL_ANSWER_TIME, 
        currentRecordingId: null 
      };
    case 'ADD_QUESTIONS':
      return { ...state, questions: [...state.questions, ...action.payload] };
    case 'SET_RECORDING_ID':
      return { ...state, currentRecordingId: action.payload };
    case 'SET_RESULT_ID':
      return { ...state, resultId: action.payload };
    case 'SET_QUESTION_INDEX':
      return { 
        ...state, 
        currentQuestionIndex: action.payload, 
        step: 'preparing', 
        remainingTime: TOTAL_ANSWER_TIME, 
        currentRecordingId: null 
      };
    default:
      return state;
  }
}

export const useInterviewState = () => {
  const [state, dispatch] = useReducer(interviewReducer, initialState);

  const actions = useMemo(() => ({
    startInterview: (questions: ExpandedQ[]) => {
      dispatch({ type: 'START_INTERVIEW', payload: questions });
    },

    startRecordingWait: () => {
      dispatch({ type: 'START_RECORDING_WAIT' });
    },

    startAnswering: () => {
      dispatch({ type: 'START_ANSWERING' });
    },

    nextQuestion: () => {
      dispatch({ type: 'NEXT_QUESTION' });
    },

    completeInterview: () => {
      dispatch({ type: 'COMPLETE_INTERVIEW' });
    },

    complete: () => {
      dispatch({ type: 'COMPLETE' });
    },

    tick: () => {
      dispatch({ type: 'TICK' });
    },

    loadQuestions: (questions: ExpandedQ[]) => {
      dispatch({ type: 'LOAD_QUESTIONS', payload: questions });
    },

    addQuestions: (questions: ExpandedQ[]) => {
      dispatch({ type: 'ADD_QUESTIONS', payload: questions });
    },

    setRecordingId: (id: string | null) => {
      dispatch({ type: 'SET_RECORDING_ID', payload: id });
    },

    setResultId: (id: string | null) => {
      dispatch({ type: 'SET_RESULT_ID', payload: id });
    },

    setQuestionIndex: (index: number) => {
      dispatch({ type: 'SET_QUESTION_INDEX', payload: index });
    },
  }), [dispatch]);

  return {
    state,
    actions,
    // 편의를 위한 computed values
    currentQuestion: state.questions[state.currentQuestionIndex],
    isLastQuestion: state.currentQuestionIndex >= state.questions.length - 1,
    isLastQuestionInSet: (state.currentQuestionIndex + 1) % 3 === 0,
    currentSet: Math.floor(state.currentQuestionIndex / 3),
  };
};
