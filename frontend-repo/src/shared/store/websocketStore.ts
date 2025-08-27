// WebSocket 전역 관리 스토어
import { create } from 'zustand';
import { connectWebSocket } from '@/pages/InterviewSession/hooks/useWebSocket';

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
    console.log('🔌 [WebSocketStore] connect 함수 호출됨!');
    console.log('🔌 전달받은 callback:', typeof callback);
    
    const state = get();
    
    console.log('🔌 전역 WebSocket 연결 시도 - 현재 상태:');
    console.log('  - client:', !!state.client);
    console.log('  - isConnected:', state.isConnected);
    console.log('  - callbacks.length:', state.callbacks.length);
    
    // 이미 연결되어 있으면 콜백만 추가
    if (state.client && state.isConnected) {
      console.log('✅ WebSocket 이미 연결됨 - 콜백만 추가');
      if (callback) {
        set({ callbacks: [...state.callbacks, callback] });
      }
      return;
    }

    console.log('🔌 전역 WebSocket 새로운 연결 시작...');
    console.log('📞 전달받은 콜백:', typeof callback);
    
    // 모든 콜백을 처리하는 통합 핸들러
    const handleAnalysisResult = (answerAttemptId: string) => {
      console.log('🎯 WebSocket Store에서 분석 결과 수신:', answerAttemptId);
      console.log('🎯 분석 결과 타입:', typeof answerAttemptId);
      console.log('🎯 분석 결과 원본값:', JSON.stringify(answerAttemptId));
      
      const currentState = get();
      console.log('📋 현재 등록된 콜백 수:', currentState.callbacks.length);
      
      if (currentState.callbacks.length === 0) {
        console.warn('⚠️ 등록된 콜백이 없습니다!');
        return;
      }
      
      currentState.callbacks.forEach((cb, index) => {
        console.log(`📞 콜백 ${index + 1} 호출 시작...`);
        console.log(`📞 콜백 ${index + 1} 함수 타입:`, typeof cb);
        try {
          cb(answerAttemptId);
          console.log(`✅ 콜백 ${index + 1} 호출 성공`);
        } catch (error) {
          console.error(`❌ 콜백 ${index + 1} 호출 실패:`, error);
        }
      });
    };

    console.log('🔗 connectWebSocket 호출 시작...');
    const client = connectWebSocket(handleAnalysisResult);
    console.log('🔗 connectWebSocket 호출 완료, client:', !!client);
    
    // 연결 성공 시 상태 업데이트
    const originalOnConnect = client.onConnect;
    client.onConnect = (frame: any) => {
      console.log('✅ 전역 WebSocket 연결 성공');
      set({ isConnected: true });
      if (originalOnConnect) originalOnConnect(frame);
    };

    // 연결 해제 시 상태 업데이트
    const originalOnDisconnect = client.onDisconnect;
    client.onDisconnect = (frame: any) => {
      console.log('🔌 전역 WebSocket 연결 해제');
      set({ isConnected: false, client: null });
      if (originalOnDisconnect) originalOnDisconnect(frame);
    };

    set({ 
      client,
      callbacks: callback ? [callback] : []
    });
    
    console.log('📋 WebSocket Store 초기화 완료:');
    console.log('  - client:', !!client);
    console.log('  - callbacks 등록됨:', callback ? 1 : 0);
  },

  disconnect: () => {
    const state = get();
    // 면접이 진행 중이면 연결 유지
    if (state.interviewInProgress) {
      console.log('🔌 면접 진행 중이므로 WebSocket 연결 유지');
      return;
    }
    
    if (state.client) {
      console.log('🔌 전역 WebSocket 강제 해제');
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
    console.log(`🚀 면접 시작 - 총 질문 수: ${totalQuestions}`);
    set({ 
      interviewInProgress: true, 
      totalQuestions, 
      completedQuestions: 0 
    });
  },

  completeQuestion: () => {
    const state = get();
    const newCompletedQuestions = state.completedQuestions + 1;
    console.log(`✅ 질문 완료 - 완료된 질문: ${newCompletedQuestions}/${state.totalQuestions}`);
    
    set({ completedQuestions: newCompletedQuestions });
    
    // 모든 질문이 완료되면 면접 종료
    if (newCompletedQuestions >= state.totalQuestions) {
      console.log('🎉 모든 질문 완료 - 면접 종료');
      set({ interviewInProgress: false });
    }
  },

  endInterview: () => {
    console.log('🏁 면접 강제 종료');
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