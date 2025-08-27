// 피드백 상태 관리 시스템 설계
import { create } from 'zustand';

interface QuestionFeedback {
  attemptId: string;
  questionIndex: number;
  questionType: 'main' | 'followUp';
  feedback: any;
  isLoaded: boolean;
  error?: string;
}

interface FeedbackState {
  // 기본 정보
  resultId: string | null;
  interviewType: string;
  totalQuestions: number;
  
  // 피드백 데이터
  feedbacks: Map<number, QuestionFeedback>; // index -> feedback
  answerAttemptIds: string[];
  
  // 순서 보장
  questionOrder: string[]; // 원본 질문 순서
  orderMapping: Map<string, number>; // attemptId -> index
  
  // 로딩 상태
  isLoadingOrder: boolean;
  isLoadingFeedback: boolean;
  
  // Actions
  setBasicInfo: (resultId: string, interviewType: string) => void;
  setQuestionOrder: (order: string[]) => void;
  addAnswerAttemptId: (attemptId: string) => void;
  setFeedback: (index: number, feedback: QuestionFeedback) => void;
  getFeedbackByIndex: (index: number) => QuestionFeedback | null;
  getMainQuestionFeedback: () => QuestionFeedback | null;
  getFollowUpFeedbacks: () => QuestionFeedback[];
  canAccessStep: (step: number) => boolean;
  reset: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  // 초기 상태
  resultId: null,
  interviewType: '',
  totalQuestions: 0,
  feedbacks: new Map(),
  answerAttemptIds: [],
  questionOrder: [],
  orderMapping: new Map(),
  isLoadingOrder: false,
  isLoadingFeedback: false,

  // 기본 정보 설정
  setBasicInfo: (resultId, interviewType) => {
    set({ resultId, interviewType });
  },

  // 질문 순서 설정 (면접 시작 시)
  setQuestionOrder: (order) => {
    const orderMapping = new Map<string, number>();
    order.forEach((questionId, index) => {
      orderMapping.set(questionId, index);
    });
    
    set({ 
      questionOrder: order,
      orderMapping,
      totalQuestions: order.length 
    });
    
    console.log('💾 질문 순서 설정 완료:', { order, orderMapping });
  },

  // answerAttemptId 추가 (WebSocket 수신 시)
  addAnswerAttemptId: (attemptId) => {
    const state = get();
    
    // 중복 방지
    if (state.answerAttemptIds.includes(attemptId)) {
      console.log('⚠️ 이미 존재하는 attemptId:', attemptId);
      return;
    }
    
    // 순서 매핑 확인
    const cleanAttemptId = attemptId.includes('~') ? attemptId.split('~')[0] : attemptId;
    const questionIndex = state.orderMapping.get(cleanAttemptId);
    
    if (questionIndex === undefined) {
      console.warn('⚠️ 매핑되지 않은 attemptId:', attemptId);
      return;
    }
    
    // 상태 업데이트
    set(state => ({
      answerAttemptIds: [...state.answerAttemptIds, attemptId],
      feedbacks: new Map(state.feedbacks).set(questionIndex, {
        attemptId,
        questionIndex,
        questionType: questionIndex === 0 ? 'main' : 'followUp',
        feedback: null,
        isLoaded: false
      })
    }));
    
    console.log('✅ answerAttemptId 추가:', { attemptId, questionIndex });
  },

  // 피드백 데이터 설정
  setFeedback: (index, feedbackData) => {
    set(state => {
      const newFeedbacks = new Map(state.feedbacks);
      newFeedbacks.set(index, { ...feedbackData, isLoaded: true });
      return { feedbacks: newFeedbacks };
    });
    
    console.log('📝 피드백 데이터 설정:', { index, feedbackData });
  },

  // 인덱스로 피드백 조회
  getFeedbackByIndex: (index) => {
    const state = get();
    return state.feedbacks.get(index) || null;
  },

  // 본질문(0번) 피드백 조회
  getMainQuestionFeedback: () => {
    const state = get();
    return state.feedbacks.get(0) || null;
  },

  // 꼬리질문(1,2번) 피드백 배열 조회
  getFollowUpFeedbacks: () => {
    const state = get();
    const followUps: QuestionFeedback[] = [];
    
    for (let i = 1; i < state.totalQuestions; i++) {
      const feedback = state.feedbacks.get(i);
      if (feedback) {
        followUps.push(feedback);
      }
    }
    
    return followUps;
  },

  // 스텝 접근 가능 여부 확인
  canAccessStep: (step) => {
    const state = get();
    
    // 0부터 해당 스텝까지 모든 피드백이 로드되었는지 확인
    for (let i = 0; i <= step; i++) {
      const feedback = state.feedbacks.get(i);
      if (!feedback || !feedback.isLoaded) {
        return false;
      }
    }
    
    return true;
  },

  // 상태 초기화
  reset: () => {
    set({
      resultId: null,
      interviewType: '',
      totalQuestions: 0,
      feedbacks: new Map(),
      answerAttemptIds: [],
      questionOrder: [],
      orderMapping: new Map(),
      isLoadingOrder: false,
      isLoadingFeedback: false
    });
  }
}));

// 피드백 로딩 유틸리티 함수들
export class FeedbackLoader {
  
  // 단일 피드백 로드
  static async loadSingleFeedback(attemptId: string): Promise<any> {
    try {
      console.log('📥 피드백 로드 시작:', attemptId);
      
      const response = await fetch(`/api/interview/feedback/${attemptId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const feedbackData = await response.json();
      console.log('✅ 피드백 로드 완료:', attemptId);
      
      return feedbackData;
    } catch (error) {
      console.error('❌ 피드백 로드 실패:', attemptId, error);
      throw error;
    }
  }
  
  // 본질문 피드백만 로드
  static async loadMainQuestionFeedback(resultId: string): Promise<QuestionFeedback | null> {
    const store = useFeedbackStore.getState();
    const mainFeedback = store.getMainQuestionFeedback();
    
    if (!mainFeedback || !mainFeedback.attemptId) {
      console.warn('⚠️ 본질문 attemptId가 없습니다');
      return null;
    }
    
    try {
      const feedbackData = await this.loadSingleFeedback(mainFeedback.attemptId);
      
      const completeFeedback: QuestionFeedback = {
        ...mainFeedback,
        feedback: feedbackData,
        isLoaded: true
      };
      
      store.setFeedback(0, completeFeedback);
      return completeFeedback;
    } catch (error) {
      console.error('❌ 본질문 피드백 로드 실패:', error);
      return null;
    }
  }
  
  // 꼬리질문 피드백들 로드
  static async loadFollowUpFeedbacks(resultId: string): Promise<QuestionFeedback[]> {
    const store = useFeedbackStore.getState();
    const followUpFeedbacks = store.getFollowUpFeedbacks();
    
    const loadPromises = followUpFeedbacks.map(async (feedback, arrayIndex) => {
      if (feedback.isLoaded) {
        return feedback; // 이미 로드됨
      }
      
      try {
        const feedbackData = await this.loadSingleFeedback(feedback.attemptId);
        
        const completeFeedback: QuestionFeedback = {
          ...feedback,
          feedback: feedbackData,
          isLoaded: true
        };
        
        store.setFeedback(feedback.questionIndex, completeFeedback);
        return completeFeedback;
      } catch (error) {
        console.error(`❌ 꼬리질문 ${feedback.questionIndex} 피드백 로드 실패:`, error);
        return { ...feedback, error: error.message };
      }
    });
    
    return Promise.all(loadPromises);
  }
  
  // 전체 피드백 로드
  static async loadAllFeedbacks(resultId: string): Promise<QuestionFeedback[]> {
    const store = useFeedbackStore.getState();
    const allFeedbacks: QuestionFeedback[] = [];
    
    // 순서대로 로드
    for (let i = 0; i < store.totalQuestions; i++) {
      const feedback = store.getFeedbackByIndex(i);
      
      if (!feedback) {
        console.warn(`⚠️ ${i}번 질문 정보가 없습니다`);
        continue;
      }
      
      if (feedback.isLoaded) {
        allFeedbacks.push(feedback);
        continue;
      }
      
      try {
        const feedbackData = await this.loadSingleFeedback(feedback.attemptId);
        
        const completeFeedback: QuestionFeedback = {
          ...feedback,
          feedback: feedbackData,
          isLoaded: true
        };
        
        store.setFeedback(i, completeFeedback);
        allFeedbacks.push(completeFeedback);
      } catch (error) {
        console.error(`❌ ${i}번 질문 피드백 로드 실패:`, error);
        allFeedbacks.push({ ...feedback, error: error.message });
      }
    }
    
    return allFeedbacks;
  }
}

// WebSocket 연동을 위한 훅
export const useFeedbackWebSocket = () => {
  const store = useFeedbackStore();
  
  const handleAnalysisResult = useCallback((answerAttemptId: string) => {
    console.log('🎯 WebSocket 피드백 수신:', answerAttemptId);
    store.addAnswerAttemptId(answerAttemptId);
  }, [store]);
  
  return { handleAnalysisResult };
};