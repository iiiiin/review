// 파일: src/shared/api/websocket.ts
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import { useAuthStore } from '@/shared/store/authStore';

// JWT 디코딩 유틸리티 함수
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT 파싱 실패:', error);
    return null;
  }
}

export function connectWebSocket(onAnalysisResult?: (answerAttemptId: string) => void): Client {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  const wsUrl = `${baseUrl}/ws-stomp`;
  // 1) 토큰 꺼내오기
  
  const { accessToken, userId } = useAuthStore.getState();
  
  // JWT에서 userUuid 추출
  let userUuid: string | null = null;
  if (accessToken) {
    try {
      const jwtPayload = parseJwt(accessToken);
      userUuid = jwtPayload?.userUuid || jwtPayload?.sub || userId; // userUuid 필드명에 따라 조정
    } catch (error) {
      console.error('❌ JWT 파싱 오류:', error);
    }
  }
  
  
  // 토큰이나 userUuid가 없으면 경고 로그 출력
  if (!accessToken) {
    console.warn('⚠️ Access Token이 없습니다. 인증에 실패할 수 있습니다.');
  }
  if (!userUuid) {
    console.warn('⚠️ User UUID가 없습니다. 사용자별 메시지 수신에 실패할 수 있습니다.');
  }

  // 2) STOMP 클라이언트 생성
  const stompClient = new Client({
    // SockJS 로 프록시
    webSocketFactory: () => {
      const sockjs = new SockJS(wsUrl);
      return sockjs;
    },
    // CONNECT 할 때 보낼 헤더
    connectHeaders: accessToken ? {
      Authorization: `Bearer ${accessToken}`,
    } : {},
    // 디버그 로그 활성화 (연결 문제 해결을 위해)
    debug: (_str: string) => {},
    // 자동 재시도(원하는 횟수/간격으로 조정 가능)
    reconnectDelay: 5000,
    // Heartbeat 설정 (연결 유지를 위해)
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    // 연결이 성공했을 때 호출
    onConnect: (_frame: any) => {

      // userUuid 기반 사용자별 토픽 구독 (백엔드 방식에 맞춤)
      if (userUuid) {
        
        // 3) 분석 결과 구독 - 백엔드 토픽 형식에 맞춤
        stompClient.subscribe(
          `/topic/users/${userUuid}/analysis-results`,
          (message: IMessage) => {
            const result = JSON.parse(message.body);
            
            // answerAttemptId 추출하여 콜백 호출 (다양한 필드명 체크)
            const attemptId = result.answerAttemptId || result.recordingId || result.ptAnswerAttemptUuid || result.attemptId;
            if (attemptId && onAnalysisResult) {
              onAnalysisResult(attemptId);
            } else {
              console.warn('⚠️ 일반 분석에서 attemptId를 찾을 수 없습니다. 확인된 필드들:', Object.keys(result));
              console.warn('⚠️ 일반 분석 전체 결과:', result);
              console.warn('⚠️ onAnalysisResult 콜백 존재?', !!onAnalysisResult);
            }
          }
        );

        // 4) 전사 결과 구독 - 백엔드 토픽 형식에 맞춤 (로그만 출력, 피드백 수집에는 사용 안함)
        stompClient.subscribe(
          `/topic/users/${userUuid}/transcript-results`,
          (message: IMessage) => {
            const _transcript = JSON.parse(message.body);
            void _transcript;
            // 전사 결과는 AI 피드백 수집과 무관하므로 별도 처리 없음
          }
        );

        // 5) PT 면접 전용 토픽 구독 시도
        
        // PT 피드백 분석 결과 구독
        stompClient.subscribe(
          `/topic/users/${userUuid}/pt-analysis-results`,
          (message: IMessage) => {
            const result = JSON.parse(message.body);
            
            const attemptId = result.ptAnswerAttemptUuid || result.answerAttemptId || result.recordingId || result.attemptId;
            if (attemptId && onAnalysisResult) {
              onAnalysisResult(attemptId);
            } else {
              console.warn('⚠️ PT 전용 분석에서 attemptId를 찾을 수 없습니다:', Object.keys(result));
              console.warn('⚠️ onAnalysisResult 콜백 존재?', !!onAnalysisResult);
            }
          }
        );

        // PT 피드백 완료 알림 구독
        stompClient.subscribe(
          `/topic/users/${userUuid}/pt-feedback-completed`,
          (message: IMessage) => {
            const result = JSON.parse(message.body);
            
            const attemptId = result.ptAnswerAttemptUuid || result.answerAttemptId || result.recordingId || result.attemptId;
            if (attemptId && onAnalysisResult) {
              onAnalysisResult(attemptId);
            } else {
              console.warn('⚠️ PT 완료에서 attemptId를 찾을 수 없습니다:', Object.keys(result));
              console.warn('⚠️ onAnalysisResult 콜백 존재?', !!onAnalysisResult);
            }
          }
        );
      } else {
        console.warn('⚠️ UserUUID가 없어서 사용자별 토픽 구독을 할 수 없습니다.');
      }
    },
    // 연결이 끊어졌을 때 호출
    onDisconnect: (_frame: any) => {},
    // 오류가 발생했을 때 호출
    onStompError: (frame: { headers: { [x: string]: any; }; }) => {
      console.error('❌ STOMP 프로토콜 에러:', frame.headers['message']);
      console.error('❌ STOMP 에러 상세:', frame);
    },
    // WebSocket 단에서 에러가 발생했을 때
    onWebSocketError: (evt: any) => {
      console.error('❌ WebSocket 에러:', evt);
      console.error('❌ WebSocket 에러 타입:', evt.type);
      console.error('❌ WebSocket 연결 URL:', wsUrl);
    },
    // WebSocket 연결이 끊어졌을 때
    onWebSocketClose: (_evt: any) => {},
  });

  // 5) 실제 연결 시작
  
  try {
    stompClient.activate();
  } catch (error) {
    console.error('❌ STOMP 클라이언트 활성화 실패:', error);
  }

  return stompClient;
}
