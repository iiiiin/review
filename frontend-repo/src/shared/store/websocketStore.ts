// WebSocket 전역 관리 스토어
import { create } from 'zustand';
import { connectWebSocket } from '@/features/interview/hooks/useWebSocket';

// STOMP Client 타입 정의 (모듈이 없을 경우 대비)
interface Client {
  onConnect?: (frame: any) => void;
  onDisconnect?: (frame: any) => void;
  deactivate?: () => void;
}

interface WebSocketState {
  client: Client | null;
  isConnected: boolean;
  callbacks: ((answerAttemptId: string) => void)[];
  
  // 면접 진행 상태 추가
  interviewInProgress: boolean;
  totalQuestions: number;
  completedQuestions: number;
  
  // Actions
  connect: (callback?: (answerAttemptId: string) => void) => void;
  disconnect: () => void;
  addCallback: (callback: (answerAttemptId: string) => void) => void;
  removeCallback: (callback: (answerAttemptId: string) => void) => void;
  
  // 면접 상태 관리 메서드 추가
  startInterview: (totalQuestions: number) => void;
  completeQuestion: () => void;
  endInterview: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  client: null,
  isConnected: false,
  callbacks: [],
  
  // 면접 상태 초기값
  interviewInProgress: false,
  totalQuestions: 0,
  completedQuestions: 0,

  connect: (callback) => {
    
    const state = get();
    
    
    // 이미 연결되어 있으면 콜백만 추가
    if (state.client && state.isConnected) {
      if (callback) {
        set({ callbacks: [...state.callbacks, callback] });
      }
      return;
    }

    
    // 모든 콜백을 처리하는 통합 핸들러
    const handleAnalysisResult = (answerAttemptId: string) => {
      
      const currentState = get();
      
      if (currentState.callbacks.length === 0) {
        console.warn('⚠️ 등록된 콜백이 없습니다!');
        return;
      }
      
      currentState.callbacks.forEach((cb, index) => {
        try {
          cb(answerAttemptId);
        } catch (error) {
          console.error(`❌ 콜백 ${index + 1} 호출 실패:`, error);
        }
      });
    };

    const client = connectWebSocket(handleAnalysisResult);
    
    // 연결 성공 시 상태 업데이트
    const originalOnConnect = client.onConnect;
    client.onConnect = (frame: any) => {
      set({ isConnected: true });
      if (originalOnConnect) originalOnConnect(frame);
    };

    // 연결 해제 시 상태 업데이트
    const originalOnDisconnect = client.onDisconnect;
    client.onDisconnect = (frame: any) => {
      set({ isConnected: false, client: null });
      if (originalOnDisconnect) originalOnDisconnect(frame);
    };

    set({ 
      client,
      callbacks: callback ? [callback] : []
    });
    
  },

  disconnect: () => {
    const state = get();
    // 면접이 진행 중이면 연결 유지
    if (state.interviewInProgress) {
      return;
    }
    
    if (state.client) {
      state.client.deactivate?.();
      set({ 
        client: null, 
        isConnected: false, 
        callbacks: [],
        interviewInProgress: false,
        totalQuestions: 0,
        completedQuestions: 0 
      });
    }
  },

  addCallback: (callback) => {
    const { callbacks } = get();
    set({ callbacks: [...callbacks, callback] });
  },

  removeCallback: (callback) => {
    const { callbacks } = get();
    set({ callbacks: callbacks.filter(cb => cb !== callback) });
  },

  // 면접 상태 관리 메서드 구현
  startInterview: (totalQuestions) => {
    set({ 
      interviewInProgress: true, 
      totalQuestions, 
      completedQuestions: 0 
    });
  },

  completeQuestion: () => {
    const state = get();
    const newCompletedQuestions = state.completedQuestions + 1;
    
    set({ completedQuestions: newCompletedQuestions });
    
    // 모든 질문이 완료되면 면접 종료
    if (newCompletedQuestions >= state.totalQuestions) {
      set({ interviewInProgress: false });
    }
  },

  endInterview: () => {
    const { client } = get();
    if (client) {
      client.deactivate?.();
    }
    set({ 
      client: null,
      isConnected: false,
      callbacks: [],
      interviewInProgress: false,
      totalQuestions: 0,
      completedQuestions: 0 
    });
  }
}));
