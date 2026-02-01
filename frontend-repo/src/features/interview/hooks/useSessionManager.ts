import { useCallback, useEffect, useState } from 'react';

export interface UseSessionManagerOptions {
  sessionId: string;
  userName: string;
  onSessionReady?: (sessionId: string) => void;
  onSessionError?: (error: any) => void;
}

export function useSessionManager(
  sessionId: string,
  userName: string,
  onSessionReady?: (sessionId: string) => void,
  onSessionError?: (error: any) => void
) {
  // sessionId에서 ~숫자 부분 제거 (uuid~숫자 형태일 경우 uuid만 사용)
  const cleanSessionId = sessionId.includes('~') ? sessionId.split('~')[0] : sessionId;
  
  
  const [session, setSession] = useState<any>(null);
  const [publisher, setPublisher] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);

  const joinSession = useCallback(async () => {
    try {
      
      // sessionId에서 ~숫자 부분 제거
      const cleanId = sessionId.includes('~') ? sessionId.split('~')[0] : sessionId;
      
      // 세션 시뮬레이션
      const mockSession = { sessionId: cleanId };
      const mockPublisher = { userName, hasVideo: true };
      
      setSession(mockSession);
      setPublisher(mockPublisher);
      setCurrentSessionId(cleanId);
      setIsSessionReady(true);
      setHasVideo(true);

      onSessionReady?.(cleanId);
    } catch (error) {
      console.error('❌ [SessionManager] 세션 조인 실패:', error);
      onSessionError?.(error);
    }
  }, [sessionId, userName, onSessionReady, onSessionError]);

  const leaveSession = useCallback(async () => {
    try {
      
      setSession(null);
      setPublisher(null);
      setSubscribers([]);
      setCurrentSessionId(null);
      setIsSessionReady(false);
      setHasVideo(false);

    } catch (error) {
      console.error('❌ [SessionManager] 세션 나가기 실패:', error);
    }
  }, []);

  // 세션 변경
  const changeSession = useCallback(async (newSessionId: string) => {
    void newSessionId;
    await leaveSession();
    // sessionId가 변경되면 새로운 세션에 자동 조인될 것임
  }, [currentSessionId, leaveSession]);

  // 세션 종료
  const endSession = useCallback(async () => {
    await leaveSession();
  }, [leaveSession]);

  // 세션 재시작
  const restartSession = useCallback(async () => {
    await leaveSession();
    setTimeout(() => joinSession(), 100);
  }, [leaveSession, joinSession]);

  // sessionId 변경 시 자동 재연결
  useEffect(() => {
    // sessionId에서 ~숫자 부분 제거하여 비교
    const cleanCurrentId = currentSessionId?.includes('~') ? currentSessionId.split('~')[0] : currentSessionId;
    const cleanNewId = sessionId.includes('~') ? sessionId.split('~')[0] : sessionId;
    
    if (cleanNewId && cleanNewId !== cleanCurrentId) {
      joinSession();
    }
  }, [sessionId, currentSessionId, joinSession]);

  // 컴포넌트 언마운트 시 세션 정리
  useEffect(() => {
    return () => {
      if (session) {
        leaveSession();
      }
    };
  }, [session, leaveSession]);

  // 초기 세션 설정
  useEffect(() => {
    if (cleanSessionId && !session) {
      joinSession();
    }
  }, [cleanSessionId, session, joinSession]);

  const subscriberCount = subscribers.length;

  return {
    // OpenVidu 호환 API
    session,
    publisher,
    subscribers,
    joinSession,
    leaveSession,
    
    // 확장된 세션 관리 API
    currentSessionId,
    isSessionReady,
    changeSession,
    endSession,
    restartSession,
    hasVideo,
    subscriberCount,
  };
};
