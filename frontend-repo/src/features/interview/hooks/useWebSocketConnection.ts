import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocketStore } from '@/shared/store/websocketStore';

export interface UseWebSocketConnectionOptions {
  onAnalysisResult?: (answerAttemptId: string) => void;
  shouldConnect?: boolean;
  totalQuestions?: number;
}

export const useWebSocketConnection = ({
  onAnalysisResult,
  shouldConnect = false,
  totalQuestions = 0
}: UseWebSocketConnectionOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  
  const { 
    connect: connectWebSocket, 
    startInterview, 
    completeQuestion,
    isConnected: storeIsConnected
  } = useWebSocketStore();

  // 콜백 함수를 ref로 저장하여 의존성 문제 방지
  const onAnalysisResultRef = useRef(onAnalysisResult);

  useEffect(() => {
    onAnalysisResultRef.current = onAnalysisResult;
  }, [onAnalysisResult]);

  // WebSocket 연결 상태 동기화
  useEffect(() => {
    setIsConnected(storeIsConnected);
  }, [storeIsConnected]);

  // WebSocket 에러 처리는 상위 컴포넌트에서 관리

  // WebSocket 연결 함수
  const connect = useCallback(async () => {
    try {
      if (!onAnalysisResultRef.current) {
        console.warn('🔌 onAnalysisResult 콜백이 없어서 WebSocket 연결을 건너뜁니다.');
        return;
      }

      
      // 면접 시작 알림
      if (totalQuestions > 0) {
        startInterview(totalQuestions);
      }
      
      // WebSocket 연결
      await connectWebSocket(onAnalysisResultRef.current);
      
    } catch (error) {
      console.error('🔥 WebSocket 연결 실패:', error);
      setConnectionError(error as Error);
    }
  }, [totalQuestions, connectWebSocket, startInterview]);

  // 질문 완료 알림
  const notifyQuestionComplete = useCallback(() => {
    completeQuestion();
  }, [completeQuestion]);

  // 자동 연결 로직
  useEffect(() => {
    if (shouldConnect && !isConnected && onAnalysisResultRef.current) {
      connect();
    }
  }, [shouldConnect, isConnected, connect]);

  // 정리 작업
  useEffect(() => {
    return () => {
      // removeCallback은 하지 않음 - 다른 컴포넌트에서도 분석 결과를 받아야 함
    };
  }, []);

  return {
    // 상태
    isConnected,
    connectionError,
    
    // 액션
    connect,
    notifyQuestionComplete,
    
    // 유틸리티
    canConnect: !!onAnalysisResultRef.current,
  };
};
